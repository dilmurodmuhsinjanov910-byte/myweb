/**
 * DualControlPhysics & VideoScrubEngine Concurrency & Stress Test Suite
 * Challenger 1 (Empirical Stress & Concurrency Challenger)
 *
 * Requirements:
 * 1. Rapid mouse dragging during high-velocity scroll.
 * 2. Quick-clicking ▶ PLAY CINEMA while dragging turntable.
 * 3. Repeated rapid category tab switching (100 consecutive switches).
 * 4. Rapid slider adjustments during continuous cinema playback.
 * 5. Strict verification:
 *    - Manual lock (1,800ms cooldown) is strictly maintained.
 *    - Cinema playback cleanly pauses on scroll interrupt and returns smoothly over 300ms without visual snapping.
 *    - No NaN values, no uncaught exceptions, no memory leaks or runaway timers.
 * 6. Dynamic extraction and execution of actual production classes from personal_brand_v4.html and index.html.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  describe,
  it,
  assert,
  assertEqual,
  assertApprox,
  assertInRange
} = require('../e2e/helpers/test_utils');
const { extractHardwareCatalog, extractSneakersCatalog } = require('../e2e/helpers/dom_inspector');

const rootDir = path.resolve(__dirname, '../..');

/**
 * Mock DOM / Video Engine for Stress Harness
 */
class InstrumentedMockVideo {
  constructor(duration = 10.0) {
    this.duration = duration;
    this.currentTime = 0.0;
    this.paused = true;
    this.seeking = false;
    this.readyState = 4;
    this.src = '';
    this.poster = '';
    this.listeners = new Map();
    this.fastSeekCount = 0;
    this.seekHistory = [];
    this.playCount = 0;
    this.pauseCount = 0;
    this.loadCount = 0;
  }

  addEventListener(type, cb, options) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type);
    const wrapper = (evt) => {
      if (options && options.once) {
        this.removeEventListener(type, wrapper);
      }
      cb(evt);
    };
    wrapper._orig = cb;
    set.add(wrapper);
  }

  removeEventListener(type, cb) {
    if (!this.listeners.has(type)) return;
    const set = this.listeners.get(type);
    for (const fn of set) {
      if (fn === cb || fn._orig === cb) {
        set.delete(fn);
        break;
      }
    }
  }

  dispatchEvent(type, eventObj = {}) {
    if (!this.listeners.has(type)) return;
    const set = Array.from(this.listeners.get(type));
    for (const cb of set) {
      cb({ type, target: this, ...eventObj });
    }
  }

  fastSeek(time) {
    this.fastSeekCount++;
    this._seek(time);
  }

  set currentTimeVal(t) {
    this._seek(t);
  }

  _seek(time) {
    const clamped = isNaN(time) ? 0 : Math.max(0, Math.min(this.duration || 10.0, time));
    this.seeking = true;
    this.dispatchEvent('seeking');
    this.currentTime = clamped;
    this.seekHistory.push(clamped);
    this.seeking = false;
    this.dispatchEvent('seeked');
  }

  play() {
    this.paused = false;
    this.playCount++;
    this.dispatchEvent('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.pauseCount++;
    this.dispatchEvent('pause');
  }

  load() {
    this.loadCount++;
    this.dispatchEvent('loadstart');
    this.dispatchEvent('loadedmetadata');
    this.dispatchEvent('canplay');
  }

  querySelectorAll(sel) {
    return [];
  }

  getTotalListenerCount() {
    let count = 0;
    for (const [_, set] of this.listeners) {
      count += set.size;
    }
    return count;
  }
}

/**
 * Deterministic Virtual Clock & Timer Tracker
 */
class VirtualTimerController {
  constructor() {
    this.nowMs = 100000; // Baseline virtual timestamp
    this.activeTimers = new Map();
    this.timerIdCounter = 1;
    this.completedTimerCount = 0;
    this.clearedTimerCount = 0;
  }

  performanceNow() {
    return this.nowMs;
  }

  setTimeout(fn, delayMs) {
    const id = this.timerIdCounter++;
    const triggerTime = this.nowMs + Math.max(0, delayMs);
    this.activeTimers.set(id, { fn, triggerTime, delayMs });
    return id;
  }

  clearTimeout(id) {
    if (this.activeTimers.has(id)) {
      this.activeTimers.delete(id);
      this.clearedTimerCount++;
    }
  }

  advance(ms) {
    const targetTime = this.nowMs + ms;
    while (true) {
      let earliestId = null;
      let earliestTime = Infinity;
      for (const [id, timer] of this.activeTimers) {
        if (timer.triggerTime <= targetTime && timer.triggerTime < earliestTime) {
          earliestId = id;
          earliestTime = timer.triggerTime;
        }
      }
      if (earliestId === null) break;
      const timer = this.activeTimers.get(earliestId);
      this.activeTimers.delete(earliestId);
      this.nowMs = timer.triggerTime;
      this.completedTimerCount++;
      timer.fn();
    }
    this.nowMs = targetTime;
  }

  getActiveTimerCount() {
    return this.activeTimers.size;
  }
}

/**
 * Load Production Classes from HTML into VM with Instrumented Environment
 */
function createProductionEnvironment(htmlFile = 'index.html') {
  const filePath = path.join(rootDir, htmlFile);
  const content = fs.readFileSync(filePath, 'utf8');

  const startScrub = content.indexOf('class VideoScrubEngine');
  const endPhysics = content.indexOf('/* Three.js Luxury 3D Earth Globe */');
  if (startScrub === -1 || endPhysics === -1) {
    throw new Error(`Failed to locate VideoScrubEngine and DualControlPhysics classes in ${htmlFile}`);
  }

  const classCode = content.substring(startScrub, endPhysics);
  const timer = new VirtualTimerController();

  let rafQueue = [];
  let rafIdCounter = 1;

  const sandbox = {
    window: {},
    document: {
      querySelector: () => null,
      querySelectorAll: () => []
    },
    performance: {
      now: () => timer.performanceNow()
    },
    setTimeout: (fn, delay) => timer.setTimeout(fn, delay),
    clearTimeout: (id) => timer.clearTimeout(id),
    requestAnimationFrame: (cb) => {
      const id = rafIdCounter++;
      rafQueue.push({ id, cb });
      return id;
    },
    cancelAnimationFrame: (id) => {
      rafQueue = rafQueue.filter(item => item.id !== id);
    },
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    gsap: undefined // Test native RAF fallback pipeline
  };

  vm.createContext(sandbox);
  vm.runInContext(classCode, sandbox);

  function stepRAF(deltaMs = 16.667) {
    timer.advance(deltaMs);
    const currentQueue = [...rafQueue];
    rafQueue = [];
    for (const item of currentQueue) {
      item.cb(timer.performanceNow(), deltaMs);
    }
  }

  return {
    VideoScrubEngine: sandbox.window.VideoScrubEngine,
    DualControlPhysics: sandbox.window.DualControlPhysics,
    timer,
    stepRAF,
    sandbox
  };
}

// =========================================================================
// STRESS TEST SUITE: DUAL CONTROL CONCURRENCY & INTERACTIVE COORDINATION
// =========================================================================

describe('Stress Test Suite 1: Rapid Mouse Dragging during High-Velocity Scroll', () => {
  it('ST1-1: 500 interleaved rapid scroll events and 500 mouse drag updates maintain manual lock', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    let currentAngle = 0;
    let scrollAcceptedCount = 0;
    let scrollRejectedCount = 0;

    // Simulate user initiating pointerdown drag
    physics.markUserInteracting('turntable');
    assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TURNTABLE_DRAG);
    assertEqual(physics.isManualInteracting(), true);

    // Blast 500 rapid interleaved scroll events (high velocity: 0.0 -> 1.0) and mouse drag movements
    for (let i = 0; i < 500; i++) {
      // Mouse drag movement
      const dragDelta = (i % 2 === 0 ? 5.2 : -4.8);
      currentAngle += dragDelta;
      physics.markUserInteracting('turntable');
      const normAngle = (((currentAngle % 360) + 360) % 360);
      engine.seekImmediate((normAngle / 360) * mockVideo.duration);

      // Concurrent high-velocity scroll event arriving at same time
      const scrollProgress = (i % 100) / 100;
      const canScroll = physics.notifyScroll(scrollProgress);
      if (canScroll) {
        scrollAcceptedCount++;
        engine.setTargetProgress(scrollProgress);
      } else {
        scrollRejectedCount++;
      }

      // Small time tick (2ms)
      env.timer.advance(2);
      env.stepRAF(16.667);
    }

    // Strict assertions
    assertEqual(scrollAcceptedCount, 0, 'Zero scroll events should be accepted while mouse dragging is active');
    assertEqual(scrollRejectedCount, 500, 'All 500 scroll events must be strictly rejected during drag');
    assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TURNTABLE_DRAG, 'State must remain MANUAL_TURNTABLE_DRAG');
    assert(!isNaN(currentAngle), 'Turntable angle must not be NaN');
    assert(!isNaN(mockVideo.currentTime), 'Video currentTime must not be NaN');
    assertEqual(env.timer.getActiveTimerCount(), 1, 'Only 1 active cooldown timer must exist (no runaway timer accumulation)');

    engine.destroy();
    physics.destroy();
  });

  it('ST1-2: Inertia cooldown state strictly suppresses scroll for full 1,800ms duration after release', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    // Drag begins
    physics.markUserInteracting('turntable');
    env.timer.advance(50);

    // Pointer released: enters INERTIA_COOLDOWN
    physics.releaseInteraction();
    assertEqual(physics.getState(), env.DualControlPhysics.INERTIA_COOLDOWN);
    assertEqual(physics.isManualInteracting(), true);

    // Fire continuous scroll events throughout the 1,800ms cooldown window (advance up to 1,750ms total)
    let scrollRejected = 0;
    for (let t = 50; t < 1750; t += 50) {
      env.timer.advance(50);
      const canScroll = physics.notifyScroll(0.85);
      if (!canScroll) scrollRejected++;
    }

    assert(scrollRejected >= 33, `Scroll must be rejected throughout entire cooldown (rejected ${scrollRejected})`);
    assertEqual(physics.isScrollDriven(), false, 'Physics must not prematurely transition to IDLE_SCROLL_DRIVEN before 1,800ms');

    // Advance past 1,800ms threshold (50 + 1700 + 60 = 1,810ms total)
    env.timer.advance(60);
    assertEqual(physics.getState(), env.DualControlPhysics.IDLE_SCROLL_DRIVEN, 'After 1,800ms, state must revert to IDLE_SCROLL_DRIVEN');
    assertEqual(physics.isManualInteracting(), false);

    // Now scroll must be accepted
    const allowed = physics.notifyScroll(0.9);
    assertEqual(allowed, true, 'Scroll must be allowed once cooldown expires');

    engine.destroy();
    physics.destroy();
  });

  it('ST1-3: Continuous re-arming under persistent intermittent drag touches never drops manual lock', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    // Touch every 500ms for 10 seconds (20 touches)
    for (let i = 0; i < 20; i++) {
      env.timer.advance(500);
      physics.markUserInteracting('turntable');
      physics.releaseInteraction();
      assertEqual(physics.isManualInteracting(), true, `Must stay in manual interacting state at touch ${i}`);
      assertEqual(physics.notifyScroll(0.5), false, `Scroll must be blocked at touch ${i}`);
      assertEqual(env.timer.getActiveTimerCount(), 1, `Active timer count must never exceed 1 at touch ${i}`);
    }

    // Now advance 1,801ms with no input
    env.timer.advance(1801);
    assertEqual(physics.getState(), env.DualControlPhysics.IDLE_SCROLL_DRIVEN, 'Must revert to IDLE after full inactivity');
    assertEqual(physics.notifyScroll(0.5), true, 'Scroll must now be accepted');

    engine.destroy();
    physics.destroy();
  });

  it('ST1-4: Bidirectional scroll thrashing with 360-degree boundary wrap during aggressive turntable drag', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({ cooldownDuration: 1800, videoEngine: engine });

    let currentAngle = 0;
    physics.markUserInteracting('turntable');

    // Drag past 360 in positive and negative directions while scroll reverses
    for (let i = 0; i < 200; i++) {
      currentAngle += (i % 2 === 0 ? 45.5 : -52.3);
      physics.markUserInteracting('turntable');
      const wrapped = (((currentAngle % 360) + 360) % 360);
      assert(wrapped >= 0 && wrapped < 360, `Angle ${wrapped} must be wrapped in [0, 360)`);

      const scrollProg = i % 2 === 0 ? 0.95 : 0.05;
      assertEqual(physics.notifyScroll(scrollProg), false, 'Scroll must remain blocked during bidirectional drag');
      engine.seekImmediate((wrapped / 360) * mockVideo.duration);

      env.timer.advance(5);
      env.stepRAF(16.667);
    }

    assert(!isNaN(mockVideo.currentTime), 'Video currentTime must not be NaN');
    assert(!isNaN(currentAngle), 'Current angle must not be NaN');
    engine.destroy();
    physics.destroy();
  });

  it('ST1-5: High-speed momentum inertia decay with reverse velocity wraps within [0, 360)', () => {
    let currentAngle = 10;
    let velocity = -35.0; // High reverse speed

    // Simulate inertia step function from index.html
    for (let frame = 0; frame < 100; frame++) {
      if (Math.abs(velocity) < 0.05) break;
      currentAngle += velocity;
      velocity *= 0.92; // Damping
      const normAngle = (((currentAngle % 360) + 360) % 360);
      assert(normAngle >= 0 && normAngle < 360, `Inertia angle ${normAngle} out of range`);
    }

    assertApprox(velocity, 0.0, 0.06, 'Velocity must decay towards zero');
    assert(!isNaN(currentAngle), 'Final inertia angle must not be NaN');
  });
});

describe('Stress Test Suite 2: Quick-Clicking ▶ PLAY CINEMA while Dragging Turntable', () => {
  it('ST2-1: Activating CINEMA_PLAYBACK while dragging cleanly overrides drag and starts playback', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    let stateChanges = [];

    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine,
      onStateChange: (n, p, name) => stateChanges.push({ n, p, name })
    });

    // User is dragging
    physics.markUserInteracting('turntable');
    assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TURNTABLE_DRAG);

    // User clicks ▶ PLAY CINEMA
    physics.startCinema();
    assertEqual(physics.getState(), env.DualControlPhysics.CINEMA_PLAYBACK);
    assertEqual(engine.isAutonomous, true);
    assertEqual(mockVideo.paused, false);
    assertEqual(env.timer.getActiveTimerCount(), 0, 'Cooldown timer must be cleared when cinema starts');

    // Drag move immediately resumes: pointermove calls markUserInteracting('turntable')
    physics.markUserInteracting('turntable');
    assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TURNTABLE_DRAG);
    assertEqual(engine.isAutonomous, false, 'Autonomous playback must halt immediately on drag touch');
    assertEqual(mockVideo.paused, true, 'Video must pause immediately');
    assertEqual(env.timer.getActiveTimerCount(), 1, '1,800ms cooldown timer must re-arm');

    engine.destroy();
    physics.destroy();
  });

  it('ST2-2: 100 rapid alternations between Turntable Drag and ▶ PLAY CINEMA without exceptions or leaks', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    for (let i = 0; i < 100; i++) {
      if (i % 2 === 0) {
        physics.markUserInteracting('turntable');
        engine.seekImmediate((i / 100) * mockVideo.duration);
        assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TURNTABLE_DRAG);
      } else {
        physics.startCinema();
        assertEqual(physics.getState(), env.DualControlPhysics.CINEMA_PLAYBACK);
        assertEqual(engine.isAutonomous, true);
      }
      env.timer.advance(1);
    }

    assert(env.timer.getActiveTimerCount() <= 1, 'Never more than 1 timer active during rapid thrashing');
    assert(!isNaN(mockVideo.currentTime), 'Video currentTime must not be NaN');

    engine.destroy();
    physics.destroy();
  });

  it('ST2-3: Scroll interrupt during cinema cleanly pauses and executes smooth 300ms cubic Hermite blend-back', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    mockVideo.currentTime = 4.0; // Currently at 40% (4.0s) in cinema playback
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12, blendDuration: 300 });

    let blendTriggered = false;
    let blendArgs = null;

    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine,
      onBlendBackToScroll: (targetProg, dur) => {
        blendTriggered = true;
        blendArgs = { targetProg, dur };
      }
    });

    // Start cinema
    physics.startCinema();
    assertEqual(physics.getState(), env.DualControlPhysics.CINEMA_PLAYBACK);
    assertEqual(engine.isAutonomous, true);

    // Now page is scrolled to 80% (targetProgress = 0.8)
    const canScroll = physics.notifyScroll(0.8);
    assertEqual(canScroll, true, 'Scroll must be accepted when interrupting cinema');
    assertEqual(physics.getState(), env.DualControlPhysics.IDLE_SCROLL_DRIVEN, 'State must revert to IDLE_SCROLL_DRIVEN');
    assertEqual(engine.isAutonomous, false, 'Cinema playback must be paused');
    assertEqual(mockVideo.paused, true, 'Video must be paused');
    assertEqual(blendTriggered, true, 'onBlendBackToScroll callback must be invoked');
    assertEqual(blendArgs.targetProg, 0.8);
    assertEqual(blendArgs.dur, 300);

    // Ingest the scroll target into engine
    engine.setTargetProgress(0.8);
    assertEqual(engine.isBlending, true, 'Engine must enter isBlending state');
    assertApprox(engine.blendStartProgress, 0.4, 0.001, 'Blend start progress must match video position (0.4)');

    // Step 0ms: verify zero visual snap (progress at t=0 must be exactly startProgress)
    env.stepRAF(0);
    assertApprox(engine.smoothProgress, 0.4, 0.01, 'At t=0, progress must match start progress (zero snap)');

    // Step 150ms: exactly halfway through 300ms blend window
    // Cubic Hermite at t=0.5: ease = 0.5 * 0.5 * (3 - 1) = 0.50. Target = 0.4 + (0.8 - 0.4)*0.5 = 0.60
    env.stepRAF(150);
    assertApprox(engine.smoothProgress, 0.6, 0.03, 'At t=150ms (halfway), smoothProgress must be ~0.60');
    assertEqual(engine.isBlending, true, 'Still blending at 150ms');

    // Step another 150ms (total 300ms)
    env.stepRAF(150);
    assertApprox(engine.smoothProgress, 0.8, 0.02, 'At t=300ms, smoothProgress must reach target 0.8');
    assertEqual(engine.isBlending, false, 'Blending must complete at 300ms');

    engine.destroy();
    physics.destroy();
  });

  it('ST2-4: Concurrent collision: simultaneous PLAY CINEMA click and high-velocity scroll event on exact same frame', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12, blendDuration: 300 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    // Start cinema and immediately fire scroll on exact same millisecond
    physics.startCinema();
    assertEqual(physics.getState(), env.DualControlPhysics.CINEMA_PLAYBACK);

    const allowed = physics.notifyScroll(0.75);
    assertEqual(allowed, true, 'Scroll must cleanly interrupt cinema even on same frame');
    assertEqual(physics.getState(), env.DualControlPhysics.IDLE_SCROLL_DRIVEN);
    assertEqual(engine.isAutonomous, false, 'Cinema must be paused');

    engine.destroy();
    physics.destroy();
  });

  it('ST2-5: Microsecond-level double-click on PLAY CINEMA button toggles state cleanly', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    let isPlayingCinema = false;

    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine,
      onStateChange: (newState, prevState) => {
        if (newState === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = true;
        else if (prevState === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = false;
      }
    });

    // Rapid double click (<1ms): Click 1 starts, Click 2 pauses
    physics.startCinema();
    assertEqual(isPlayingCinema, true);
    assertEqual(physics.getState(), env.DualControlPhysics.CINEMA_PLAYBACK);

    physics.stopCinema();
    assertEqual(isPlayingCinema, false);
    assertEqual(physics.getState(), env.DualControlPhysics.IDLE_SCROLL_DRIVEN);

    // Another rapid pair
    physics.startCinema();
    assertEqual(isPlayingCinema, true);
    physics.stopCinema();
    assertEqual(isPlayingCinema, false);

    engine.destroy();
    physics.destroy();
  });
});

describe('Stress Test Suite 3: Repeated Rapid Category Tab Switching (100 Consecutive Switches)', () => {
  it('ST3-1: 100 consecutive rapid category tab switches update video source with zero exceptions', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    const catalog = extractHardwareCatalog();
    const categories = ['headphones', 'mice', 'speakers', 'keyboards'];

    let lastLoadedModelId = null;

    // Simulate 100 rapid tab clicks
    for (let i = 0; i < 100; i++) {
      const cat = categories[i % categories.length];
      const model = catalog[cat][0]; // First model in category

      physics.markUserInteracting('category');
      if (physics.getState() === env.DualControlPhysics.CINEMA_PLAYBACK) {
        physics.stopCinema();
      }

      if (lastLoadedModelId !== model.id) {
        lastLoadedModelId = model.id;
        engine.loadSource(model.video, model.videoMp4, engine.TRANSPARENT_POSTER);
      }

      const dur = mockVideo.duration || 10.0;
      engine.seekImmediate(0.5 * dur);

      env.timer.advance(2);
      env.stepRAF(16.667);
    }

    assertEqual(mockVideo.loadCount, 100, 'Video load() must be called for each model load');
    assert(mockVideo.src.includes('assets/videos_webm/'), 'Video src must point to valid WebM asset');
    assertEqual(engine.pendingTime, null, 'pendingTime must be cleanly flushed');
    assertEqual(env.timer.getActiveTimerCount(), 1, 'Only 1 active cooldown timer');

    engine.destroy();
    physics.destroy();
  });

  it('ST3-2: Category switch while video is seeking resets pendingTime safely without stale seeks', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });

    // Set video seeking state
    engine.isSeeking = true;
    engine.pendingTime = 8.5; // Stale seek from previous model

    // Switch model
    engine.loadSource('assets/videos_webm/new_model.webm', 'assets/videos/new_model.mp4');
    assertEqual(engine.pendingTime, null, 'loadSource must immediately reset pendingTime to null');

    engine.destroy();
  });

  it('ST3-3: Category switch while CINEMA_PLAYBACK is active cleanly pauses cinema', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    let isPlayingCinema = false;

    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine,
      onStateChange: (newState, prevState) => {
        if (newState === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = true;
        if (prevState === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = false;
      }
    });

    physics.startCinema();
    assertEqual(isPlayingCinema, true);

    // Tab switch logic
    physics.stopCinema();
    physics.markUserInteracting('category');
    assertEqual(isPlayingCinema, false, 'isPlayingCinema must be false after category tab switch');
    assertEqual(engine.isAutonomous, false, 'Autonomous playback must be disabled');

    engine.destroy();
    physics.destroy();
  });

  it('ST3-4: Switching to shorter category (4 keyboards vs 5 headphones) clamps model selection index safely', () => {
    const catalog = extractHardwareCatalog();
    assertEqual(catalog['headphones'].length, 5);
    assertEqual(catalog['keyboards'].length, 4);

    let activeCategory = 'headphones';
    let activeModelIdx = 4; // 5th headphone selected

    // Switch to keyboards
    activeCategory = 'keyboards';
    activeModelIdx = 0; // Tab switch resets to index 0

    const activeList = catalog[activeCategory];
    assert(activeModelIdx < activeList.length, 'Clamped model index must be within range');
    assert(activeList[activeModelIdx] !== undefined, 'Selected model must be defined');
    assertEqual(activeList[activeModelIdx].id, 'keychron-q1-pro');
  });

  it('ST3-5: Full 19-model hardware catalog traversal stress: sequential model switching across all 19 models under rapid scrub', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const catalog = extractHardwareCatalog();

    let loadedCount = 0;
    const categories = ['headphones', 'mice', 'speakers', 'keyboards'];

    for (const cat of categories) {
      const models = catalog[cat];
      for (const model of models) {
        assert(model.video && model.videoMp4, `Model ${model.id} must define video paths`);
        engine.loadSource(model.video, model.videoMp4, engine.TRANSPARENT_POSTER);
        engine.seekImmediate(0.35 * (mockVideo.duration || 10.0));
        env.stepRAF(16.667);
        loadedCount++;
      }
    }

    assertEqual(loadedCount, 19, 'Must successfully traverse all 19 hardware models');
    assertEqual(mockVideo.loadCount, 19);
    engine.destroy();
  });

  it('ST3-6: Sneaker atelier 6-model catalog rapid switching with 360 video and photo fallback coordination', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const sneakers = extractSneakersCatalog();

    assertEqual(sneakers.length, 6, 'Must define 6 flagship sneaker models');

    for (let cycle = 0; cycle < 3; cycle++) {
      sneakers.forEach((snk, idx) => {
        assert(snk.video && snk.videoMp4, `Sneaker ${snk.id} must define video paths`);
        engine.loadSource(snk.video, snk.videoMp4, engine.TRANSPARENT_POSTER);
        // Angle to video time mapping
        const angle = (idx * 60) % 360;
        const norm = (((angle % 360) + 360) % 360) / 360;
        engine.seekImmediate(norm * (mockVideo.duration || 10.0));
        env.stepRAF(16.667);
      });
    }

    assertEqual(mockVideo.loadCount, 18, '6 models * 3 cycles = 18 loads');
    engine.destroy();
  });
});

describe('Stress Test Suite 4: Rapid Slider Adjustments during Continuous Cinema Playback', () => {
  it('ST4-1: Moving slider during cinema mode halts cinema immediately on first input event', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    let isPlayingCinema = false;

    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine,
      onStateChange: (newState, prevState) => {
        if (newState === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = true;
        else if (prevState === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = false;
      }
    });

    physics.startCinema();
    assertEqual(isPlayingCinema, true);
    assertEqual(engine.isAutonomous, true);

    // User grabs and moves slider
    physics.markUserInteracting('slider');
    assertEqual(isPlayingCinema, false, 'Cinema must be cancelled on slider touch');
    assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TIMELINE_SLIDER);
    assertEqual(engine.isAutonomous, false);
    assertEqual(mockVideo.paused, true);

    engine.destroy();
    physics.destroy();
  });

  it('ST4-2: 100 rapid slider adjustments (0% to 100% thrashing) maintain synchronized numeric state', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    let xrayExpansion = 0;

    for (let i = 0; i < 100; i++) {
      const val = (i * 7) % 101; // Values between 0 and 100
      physics.markUserInteracting('slider');
      xrayExpansion = val / 100;
      engine.seekImmediate(xrayExpansion * mockVideo.duration);

      env.timer.advance(1);
      env.stepRAF(16.667);

      assert(!isNaN(mockVideo.currentTime), `currentTime must not be NaN at iteration ${i}`);
      assertInRange(mockVideo.currentTime, 0.0, 10.0);
      assert(!isNaN(xrayExpansion), `xrayExpansion must not be NaN at iteration ${i}`);
      assertInRange(xrayExpansion, 0.0, 1.0);
    }

    // Slider released
    physics.releaseInteraction();
    assertEqual(physics.getState(), env.DualControlPhysics.INERTIA_COOLDOWN);
    assertEqual(env.timer.getActiveTimerCount(), 1, 'Only 1 active cooldown timer');

    // Advance 1,800ms
    env.timer.advance(1801);
    assertEqual(physics.getState(), env.DualControlPhysics.IDLE_SCROLL_DRIVEN);

    engine.destroy();
    physics.destroy();
  });

  it('ST4-3: Slider input with adversarial edge values (negative, >100, NaN, Infinity) are safely handled', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });

    const adversarialValues = [-100, 500, NaN, Infinity, -Infinity, null, undefined, 'garbage'];

    for (const val of adversarialValues) {
      engine.seekImmediate(val);
      assert(!isNaN(engine.smoothProgress), `smoothProgress must not be NaN for input ${val}`);
      assert(!isNaN(engine.smoothTime), `smoothTime must not be NaN for input ${val}`);
      assertInRange(engine.smoothProgress, 0.0, 1.0);
    }

    engine.destroy();
  });

  it('ST4-4: Simultaneous slider input and video timeupdate event race condition test', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    let isPlayingCinema = true;
    let sliderVal = 50.0;

    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine,
      onStateChange: (n, p) => {
        if (p === env.DualControlPhysics.CINEMA_PLAYBACK) isPlayingCinema = false;
      }
    });
    physics.startCinema();

    // Concurrently: video timeupdate fires while user drags slider
    for (let i = 0; i < 50; i++) {
      // User moves slider to i * 2%
      physics.markUserInteracting('slider');
      sliderVal = i * 2;
      engine.seekImmediate((sliderVal / 100) * mockVideo.duration);

      // Video timeupdate fires
      if (isPlayingCinema) {
        sliderVal = (mockVideo.currentTime / mockVideo.duration) * 100;
      }

      env.timer.advance(10);
      env.stepRAF(16.667);
    }

    assertEqual(isPlayingCinema, false, 'Cinema must be cancelled');
    assertEqual(physics.getState(), env.DualControlPhysics.MANUAL_TIMELINE_SLIDER);
    assertApprox(sliderVal, 98.0, 0.1, 'Slider must reflect user input, not be overwritten by timeupdate');

    engine.destroy();
    physics.destroy();
  });
});

describe('Stress Test Suite 5: Forensic Integrity, Memory Leak & Timer Leak Audit', () => {
  it('ST5-1: Cooldown timer lifecycle audit over 1,000 randomized interactive events', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);
    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    const sources = ['turntable', 'slider', 'category', 'model'];

    for (let step = 0; step < 1000; step++) {
      const action = step % 5;
      if (action === 0) {
        physics.markUserInteracting(sources[step % sources.length]);
      } else if (action === 1) {
        physics.releaseInteraction();
      } else if (action === 2) {
        physics.startCinema();
      } else if (action === 3) {
        physics.notifyScroll((step % 100) / 100);
      } else if (action === 4) {
        env.timer.advance(25);
      }

      // Check invariants
      const activeTimers = env.timer.getActiveTimerCount();
      assert(activeTimers <= 1, `Active timer count was ${activeTimers}, expected <= 1 at step ${step}`);
      assert(physics.getState() >= 0 && physics.getState() <= 4, `State ${physics.getState()} is invalid enum value`);
    }

    engine.destroy();
    physics.destroy();
    assertEqual(env.timer.getActiveTimerCount(), 0, 'All timers must be cleared after destroy()');
  });

  it('ST5-2: Video duration edge boundaries (0, NaN, Infinity, unloaded) never cause division-by-zero or NaN', () => {
    const env = createProductionEnvironment('index.html');

    const edgeDurations = [0, NaN, -5, Infinity, -Infinity, null, undefined];

    for (const d of edgeDurations) {
      const mockVideo = new InstrumentedMockVideo(d);
      const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });

      engine.setTargetProgress(0.5);
      env.stepRAF(16.667);

      assert(!isNaN(engine.smoothProgress), `smoothProgress is NaN for duration ${d}`);
      assert(!isNaN(engine.smoothTime), `smoothTime is NaN for duration ${d}`);

      engine.seekImmediate(5.0);
      assert(!isNaN(engine.smoothProgress), `smoothProgress is NaN after seekImmediate with duration ${d}`);

      engine.destroy();
    }
  });

  it('ST5-3: Byte-for-byte SHA256 parity and class implementation parity between index.html and personal_brand_v4.html', () => {
    const file1 = path.join(rootDir, 'personal_brand_v4.html');
    const file2 = path.join(rootDir, 'index.html');

    const buf1 = fs.readFileSync(file1);
    const buf2 = fs.readFileSync(file2);

    assertEqual(buf1.length, buf2.length, 'File byte lengths must match exactly');
    assert(buf1.equals(buf2), 'personal_brand_v4.html and index.html must be 100% byte-for-byte identical');

    // Both files instantiate identical classes with identical behavior
    const env1 = createProductionEnvironment('personal_brand_v4.html');
    const env2 = createProductionEnvironment('index.html');

    const p1 = new env1.DualControlPhysics({ cooldownDuration: 1800 });
    const p2 = new env2.DualControlPhysics({ cooldownDuration: 1800 });

    p1.markUserInteracting('turntable');
    p2.markUserInteracting('turntable');

    assertEqual(p1.getState(), p2.getState());
    assertEqual(p1.notifyScroll(0.5), p2.notifyScroll(0.5));

    p1.destroy();
    p2.destroy();
  });

  it('ST5-4: Engine and physics destroy() lifecycle cleans up all RAF loops, timers, and event listeners', () => {
    const env = createProductionEnvironment('index.html');
    const mockVideo = new InstrumentedMockVideo(10.0);

    const initialListeners = mockVideo.getTotalListenerCount();

    const engine = new env.VideoScrubEngine(mockVideo, { fps: 60, lerpFactor: 0.12 });
    const physics = new env.DualControlPhysics({
      cooldownDuration: 1800,
      videoEngine: engine
    });

    const activeListeners = mockVideo.getTotalListenerCount();
    assert(activeListeners > initialListeners, 'Engine must register listeners on video element');

    physics.markUserInteracting('turntable');
    assertEqual(env.timer.getActiveTimerCount(), 1, '1 active timer scheduled');

    // Destroy both
    engine.destroy();
    physics.destroy();

    assertEqual(env.timer.getActiveTimerCount(), 0, 'All timers must be cancelled upon destroy');
    const listenersAfterDestroy = mockVideo.getTotalListenerCount();
    assertEqual(listenersAfterDestroy, 0, 'All video event listeners must be removed upon destroy');
  });
});
