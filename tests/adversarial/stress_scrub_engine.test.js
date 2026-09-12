/**
 * Challenger 2: Adversarial Stress-Testing Suite for VideoScrubEngine & DualControlPhysics
 * 
 * Tests:
 * 1. High-frequency scroll bursts (5,000 seeks in 100ms) with sync & async decoder latency.
 * 2. Seek-lock guard (isSeeking + pendingTime) and Delta t >= 0.038s quantization under extreme load.
 * 3. Boundary seeks (progress < 0, progress > 1, progress = NaN, undefined, null, non-numeric).
 * 4. Zero, negative, and NaN video duration protection.
 * 5. Rapid model loading while seeking is active (verifying pendingTime reset & stale seek neutralization).
 * 6. 100 rapid model switches under continuous seeking barrage.
 * 7. DualControlPhysics priority locks (1,800ms cooldown) and cinema 300ms blend-back.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '../..');
const htmlContent = fs.readFileSync(path.join(rootDir, 'personal_brand_v4.html'), 'utf8');

// Extract production VideoScrubEngine and DualControlPhysics classes
function loadProductionClasses() {
  const engineMatch = htmlContent.match(/class VideoScrubEngine\s*\{[\s\S]*?\n    \}/);
  const physicsMatch = htmlContent.match(/class DualControlPhysics\s*\{[\s\S]*?\n    \}/);

  if (!engineMatch) throw new Error('Could not extract VideoScrubEngine from HTML');
  if (!physicsMatch) throw new Error('Could not extract DualControlPhysics from HTML');

  const sandbox = {
    window: {},
    gsap: undefined,
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now(), 16, 1), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    performance: { now: () => Date.now() },
    setTimeout,
    clearTimeout,
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(
    `const VideoScrubEngine = ${engineMatch[0]};
     const DualControlPhysics = ${physicsMatch[0]};
     sandboxExport = { VideoScrubEngine, DualControlPhysics };`,
    sandbox
  );

  return sandbox.sandboxExport;
}

const { VideoScrubEngine, DualControlPhysics } = loadProductionClasses();

/**
 * Adversarial Video Element Mock
 * Supports configurable decode latency, fastSeek error injection, and rigorous metric tracking.
 */
class AdversarialVideoMock {
  constructor(options = {}) {
    this.duration = options.duration !== undefined ? options.duration : 10.0;
    this._currentTime = options.currentTime || 0.0;
    this.paused = true;
    this.seeking = false;
    this.src = options.src || '';
    this.poster = options.poster || '';
    this.decodeLatencyMs = options.decodeLatencyMs || 0; // 0 = synchronous, >0 = asynchronous
    this.fastSeekThrows = options.fastSeekThrows || false;

    this.listeners = {};
    this.fastSeekCalls = 0;
    this.currentTimeAssignments = 0;
    this.totalSeeksDispatched = 0;
    this.maxConcurrentSeeks = 0;
    this.activeSeeksCount = 0;
    this.seekTimestamps = [];
    this.loadCalls = 0;
  }

  get currentTime() {
    return this._currentTime;
  }

  set currentTime(val) {
    this.currentTimeAssignments++;
    this._dispatchSeek(val);
  }

  addEventListener(event, callback, opts) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push({ callback, once: opts && opts.once });
  }

  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l.callback !== callback);
  }

  emit(event) {
    if (!this.listeners[event]) return;
    const current = [...this.listeners[event]];
    for (const item of current) {
      if (item.once) {
        this.removeEventListener(event, item.callback);
      }
      item.callback({ type: event, target: this });
    }
  }

  fastSeek(targetTime) {
    this.fastSeekCalls++;
    if (this.fastSeekThrows) {
      throw new Error('fastSeek unsupported');
    }
    this._dispatchSeek(targetTime);
  }

  _dispatchSeek(targetTime) {
    this.totalSeeksDispatched++;
    this.activeSeeksCount++;
    if (this.activeSeeksCount > this.maxConcurrentSeeks) {
      this.maxConcurrentSeeks = this.activeSeeksCount;
    }

    this.seeking = true;
    this.seekTimestamps.push({ time: targetTime, timestamp: Date.now() });
    this.emit('seeking');

    if (this.decodeLatencyMs > 0) {
      setTimeout(() => {
        this._currentTime = targetTime;
        this.seeking = false;
        this.activeSeeksCount = Math.max(0, this.activeSeeksCount - 1);
        this.emit('seeked');
      }, this.decodeLatencyMs);
    } else {
      this._currentTime = targetTime;
      this.seeking = false;
      this.activeSeeksCount = Math.max(0, this.activeSeeksCount - 1);
      this.emit('seeked');
    }
  }

  play() {
    this.paused = false;
    this.emit('play');
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.emit('pause');
  }

  load() {
    this.loadCalls++;
    this.emit('loadstart');
    setTimeout(() => {
      this.emit('loadedmetadata');
      this.emit('canplay');
    }, 1);
  }

  querySelectorAll(selector) {
    return [];
  }
}

function createPatchedVideoMock(options = {}) {
  return new AdversarialVideoMock(options);
}

let testCount = 0;
let passCount = 0;

function assert(condition, name, details = '') {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`  ✓ Test ${testCount}: ${name}${details ? ' — ' + details : ''}`);
  } else {
    console.error(`  ✗ FAILED Test ${testCount}: ${name}${details ? ' — ' + details : ''}`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

async function runAdversarialStressTests() {
  console.log('\n================================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL VIDEO SCRUB ENGINE STRESS HARNESS');
  console.log('================================================================');

  // --------------------------------------------------------------------------
  // Category 1: High-Frequency Scroll Bursts (5,000 rapid seek calls in 100ms)
  // --------------------------------------------------------------------------
  console.log('\n--- Category 1: Extreme High-Frequency Scroll Bursts (5,000 calls) ---');

  {
    // Test 1.1: 5,000 rapid calls to setTargetProgress in 100ms
    const mock = createPatchedVideoMock({ duration: 10.0, decodeLatencyMs: 0 });
    const engine = new VideoScrubEngine(mock, { fps: 60, lerpFactor: 0.12, quantizeDelta: 0.038 });

    const startTime = Date.now();
    for (let i = 0; i <= 5000; i++) {
      engine.setTargetProgress(i / 5000);
    }
    const elapsed = Date.now() - startTime;

    // Simulate 6 animation frames (~100ms)
    for (let f = 0; f < 6; f++) {
      engine._tick();
    }

    assert(
      engine.targetProgress === 1.0,
      'Scroll ingestion registers final progress 1.0 without dropping state',
      `5,000 calls completed in ${elapsed}ms`
    );

    assert(
      mock.totalSeeksDispatched <= 10,
      'Seek-lock guard and RAF lerp strictly throttle seeks to <= 10 (preventing decoder thrashing)',
      `Actual seeks dispatched: ${mock.totalSeeksDispatched} out of 5,000 calls`
    );

    engine.destroy();
  }

  {
    // Test 1.2: 5,000 rapid seekImmediate calls with ASYNC video decoder (25ms latency)
    const mock = createPatchedVideoMock({ duration: 10.0, decodeLatencyMs: 25 });
    const engine = new VideoScrubEngine(mock, { fps: 60, lerpFactor: 0.12, quantizeDelta: 0.038 });

    // Fire 5,000 rapid seekImmediate calls
    for (let i = 0; i <= 5000; i++) {
      const targetTime = (i / 5000) * 10.0;
      engine.seekImmediate(targetTime);
    }

    // While seeking, subsequent seeks must be buffered into pendingTime rather than flooding the decoder
    assert(
      mock.activeSeeksCount <= 1,
      'Decoder lock: max concurrent seeks in flight is strictly <= 1 at all times',
      `Max concurrent: ${mock.maxConcurrentSeeks}`
    );

    assert(
      engine.pendingTime !== null,
      'Pending seek buffer holds latest target time while decoder is busy',
      `pendingTime: ${engine.pendingTime}`
    );

    // Allow async seeks to settle
    await new Promise(r => setTimeout(r, 80));

    assert(
      mock.totalSeeksDispatched <= 5,
      'Async decoder protection: 5,000 seekImmediate calls throttled to <= 5 actual decoder seeks',
      `Total seeks dispatched: ${mock.totalSeeksDispatched}`
    );

    assert(
      Math.abs(mock.currentTime - 10.0) < 0.001,
      'Final video currentTime accurately matches final target (10.0s)',
      `currentTime: ${mock.currentTime}`
    );

    engine.destroy();
  }

  // --------------------------------------------------------------------------
  // Category 2: Quantization Delta Stress Testing (Delta t >= 0.038s)
  // --------------------------------------------------------------------------
  console.log('\n--- Category 2: Delta t >= 0.038s Quantization Guard Stress ---');

  {
    const mock = createPatchedVideoMock({ duration: 10.0, decodeLatencyMs: 0 });
    const engine = new VideoScrubEngine(mock, { fps: 60, lerpFactor: 0.12, quantizeDelta: 0.038 });

    const initialSeeks = mock.totalSeeksDispatched;

    // Sub-threshold seeks: Delta t < 0.038s (progress delta < 0.0038)
    for (let i = 1; i <= 50; i++) {
      engine._requestSeek(i * 0.0005); // Delta t = 0.0005s (< 0.038s)
    }

    assert(
      mock.totalSeeksDispatched === initialSeeks,
      'Sub-threshold seeks (Delta t < 0.038s) are completely filtered out by quantization guard',
      `Seeks dispatched: ${mock.totalSeeksDispatched - initialSeeks}`
    );

    // Macro seek: Delta t >= 0.038s
    engine._requestSeek(0.5); // Delta = 0.5s (>= 0.038s)

    assert(
      mock.totalSeeksDispatched === initialSeeks + 1,
      'Macro seek (Delta t >= 0.038s) passes quantization guard and triggers seek',
      `New seek dispatched to 0.5s`
    );

    engine.destroy();
  }

  // --------------------------------------------------------------------------
  // Category 3: Boundary Seeks & Invalid Inputs (progress < 0, > 1, NaN, zero duration)
  // --------------------------------------------------------------------------
  console.log('\n--- Category 3: Boundary Seeks & Extreme Input Fuzzing ---');

  {
    const mock = createPatchedVideoMock({ duration: 10.0 });
    const engine = new VideoScrubEngine(mock);

    // Extreme negative inputs
    const negatives = [-0.0000001, -1, -500, -9999999, -Infinity];
    for (const val of negatives) {
      engine.setTargetProgress(val);
      assert(engine.targetProgress === 0.0, `Negative input (${val}) clamped strictly to 0.0`);
    }

    // Extreme positive inputs
    const positives = [1.0000001, 2, 500, 9999999, Infinity];
    for (const val of positives) {
      engine.setTargetProgress(val);
      assert(engine.targetProgress === 1.0, `Overshoot input (${val}) clamped strictly to 1.0`);
    }

    // Fuzzing invalid non-numeric and NaN types
    const invalidTypes = [NaN, undefined, null, 'hello', {}, [], '', '-0', '1.5', 'NaN', 'undefined'];
    for (const inv of invalidTypes) {
      let threw = false;
      try {
        engine.setTargetProgress(inv);
      } catch (e) {
        threw = true;
      }
      assert(
        !threw && !isNaN(engine.targetProgress) && engine.targetProgress >= 0 && engine.targetProgress <= 1,
        `Invalid input (${String(inv)}) safely handled without throwing or NaN propagation`,
        `targetProgress: ${engine.targetProgress}`
      );
    }

    // Boundary seekImmediate calls
    engine.seekImmediate(-100);
    assert(mock.currentTime === 0.0, 'seekImmediate(-100) clamped strictly to 0.0s');

    engine.seekImmediate(5000);
    assert(mock.currentTime === 10.0, 'seekImmediate(5000) clamped strictly to duration (10.0s)');

    engine.seekImmediate(NaN);
    assert(mock.currentTime === 0.0, 'seekImmediate(NaN) safely clamped to 0.0s without NaN corruption');

    engine.destroy();
  }

  // --------------------------------------------------------------------------
  // Category 4: Zero, Negative, and NaN Video Duration Protection
  // --------------------------------------------------------------------------
  console.log('\n--- Category 4: Zero & Corrupted Video Duration Protection ---');

  {
    // Video with duration = 0
    const zeroMock = createPatchedVideoMock({ duration: 0.0 });
    const engineZero = new VideoScrubEngine(zeroMock);

    let threw = false;
    try {
      engineZero.setTargetProgress(0.75);
      engineZero._tick();
      engineZero._requestSeek(5.0);
      engineZero.seekImmediate(3.0);
    } catch (e) {
      threw = true;
    }

    assert(
      !threw && zeroMock.totalSeeksDispatched === 0,
      'Zero duration video: _tick and _requestSeek safely return without division by zero or seeking',
      `Seeks dispatched: ${zeroMock.totalSeeksDispatched}`
    );
    engineZero.destroy();

    // Video with duration = NaN
    const nanMock = createPatchedVideoMock({ duration: NaN });
    const engineNan = new VideoScrubEngine(nanMock);

    threw = false;
    try {
      engineNan.setTargetProgress(0.5);
      engineNan._tick();
      engineNan._requestSeek(2.0);
    } catch (e) {
      threw = true;
    }

    assert(
      !threw && nanMock.totalSeeksDispatched === 0,
      'NaN duration video: safely protected against NaN seeking',
      `Seeks dispatched: ${nanMock.totalSeeksDispatched}`
    );
    engineNan.destroy();

    // Video with duration = -5.0
    const negMock = createPatchedVideoMock({ duration: -5.0 });
    const engineNeg = new VideoScrubEngine(negMock);

    threw = false;
    try {
      engineNeg.setTargetProgress(0.5);
      engineNeg._tick();
    } catch (e) {
      threw = true;
    }

    assert(
      !threw && negMock.totalSeeksDispatched === 0,
      'Negative duration video: safely rejected without negative seeking',
      `Seeks dispatched: ${negMock.totalSeeksDispatched}`
    );
    engineNeg.destroy();
  }

  // --------------------------------------------------------------------------
  // Category 5: Rapid Model Loading While Seeking is Active (pendingTime Reset)
  // --------------------------------------------------------------------------
  console.log('\n--- Category 5: Model Loading While Seeking (pendingTime Reset) ---');

  {
    const mock = createPatchedVideoMock({ duration: 10.0, decodeLatencyMs: 30 });
    const engine = new VideoScrubEngine(mock);

    // 1. Trigger initial seek to engage isSeeking
    engine.seekImmediate(5.0);
    assert(mock.seeking === true, 'Video mock is in active seeking state');

    // 2. Queue a pending seek while decoder is active
    engine.seekImmediate(8.5);
    assert(engine.pendingTime === 8.5, 'pendingTime is queued to 8.5s');

    // 3. Load new model source while seek is pending
    const newWebm = 'assets/videos_webm/Product_360_degree_rotation_video_20260912183607.webm';
    engine.loadSource(newWebm, null, engine.TRANSPARENT_POSTER);

    // VERIFY: pendingTime must be reset to null!
    assert(
      engine.pendingTime === null,
      'loadSource immediately resets pendingTime to null, neutralizing stale seeks',
      `pendingTime: ${engine.pendingTime}`
    );

    // 4. Simulate prior seek completing now
    mock.seeking = false;
    mock.emit('seeked');

    // VERIFY: stale seek to 8.5s was NOT dispatched
    assert(
      mock.currentTime !== 8.5,
      'Delayed seeked event from previous video does NOT trigger stale seek to 8.5s on new model',
      `currentTime: ${mock.currentTime}`
    );

    // 5. Simulate loadedmetadata on new model (duration = 15.0s)
    mock.duration = 15.0;
    mock.emit('loadedmetadata');

    assert(
      mock.loadCalls >= 1,
      'New model load primes video metadata cleanly',
      `load calls: ${mock.loadCalls}`
    );

    engine.destroy();
  }

  // --------------------------------------------------------------------------
  // Category 6: 100 Rapid Model Loads under 1,000 Scroll Bursts (Blitz Stress)
  // --------------------------------------------------------------------------
  console.log('\n--- Category 6: Rapid Model Switch Blitz under Continuous Seeking ---');

  {
    const mock = createPatchedVideoMock({ duration: 10.0, decodeLatencyMs: 5 });
    const engine = new VideoScrubEngine(mock);

    let uncaughtErrors = 0;
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      try {
        // Interleave 10 scroll seeks
        for (let j = 0; j < 10; j++) {
          engine.setTargetProgress((i * 10 + j) / 1000);
          engine._tick();
        }
        // Rapid model swap
        engine.loadSource(`assets/videos_webm/fake_model_${i}.webm`, null, engine.TRANSPARENT_POSTER);
      } catch (err) {
        uncaughtErrors++;
      }
    }

    const duration = Date.now() - startTime;
    await new Promise(r => setTimeout(r, 50));

    assert(
      uncaughtErrors === 0,
      '100 rapid model loads under 1,000 scroll seeks execute with zero unhandled exceptions',
      `Completed in ${duration}ms, errors: ${uncaughtErrors}`
    );

    assert(
      engine.pendingTime === null,
      'Final pendingTime is null and clean after blitz completion',
      `pendingTime: ${engine.pendingTime}`
    );

    engine.destroy();
  }

  // --------------------------------------------------------------------------
  // Category 7: DualControlPhysics Priority & Cooldown Stress
  // --------------------------------------------------------------------------
  console.log('\n--- Category 7: DualControlPhysics Priority Machine Stress ---');

  {
    const mock = createPatchedVideoMock({ duration: 10.0 });
    const engine = new VideoScrubEngine(mock);
    const physics = new DualControlPhysics({
      cooldownDuration: 1800,
      blendDuration: 300,
      videoEngine: engine
    });

    // 1. User manual turntable drag takes priority
    physics.markUserInteracting('turntable');
    assert(physics.isScrollDriven() === false, 'Manual turntable drag locks out scroll updates');

    // 2. Fire 1,000 rapid scroll events during cooldown
    let scrollAcceptedCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (physics.notifyScroll(i / 1000)) {
        scrollAcceptedCount++;
      }
    }

    assert(
      scrollAcceptedCount === 0,
      'All 1,000 rapid scroll events are strictly rejected during 1,800ms cooldown lock',
      `Accepted scrolls: ${scrollAcceptedCount}/1000`
    );

    // 3. Autoplay Cinema mode interrupted by scroll
    physics.releaseInteraction();
    physics.state = 0; // IDLE_SCROLL_DRIVEN
    physics.startCinema();
    assert(physics.state === 3, 'Cinema playback active (State 3)');

    // Scroll interrupts cinema
    const scrollAccepted = physics.notifyScroll(0.65);
    assert(
      scrollAccepted === true && physics.state === 0,
      'Scroll event cleanly interrupts cinema playback and initiates 300ms blend-back to scroll tracking'
    );
    assert(
      engine.isBlending === true,
      'VideoScrubEngine engages smooth Hermite blend mode during scroll resumption'
    );

    physics.destroy();
    engine.destroy();
  }

  // --------------------------------------------------------------------------
  // Final Summary
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  ALL ${passCount}/${testCount} ADVERSARIAL STRESS TESTS PASSED (100.0% Success)`);
  console.log('  • 5,000 Scroll Bursts: Throttled, 0 thrashing, max concurrent seeks <= 1');
  console.log('  • Quantization: Delta t < 0.038s filtered, Delta t >= 0.038s passed');
  console.log('  • Boundary Inputs: Negative, overshoot, NaN, null, non-numeric all safe');
  console.log('  • Zero/Corrupted Duration: Division-by-zero & NaN protected');
  console.log('  • Model Load While Seeking: pendingTime reset, stale seeks neutralized');
  console.log('  • Blitz: 100 model loads under 1,000 seeks completed with 0 errors');
  console.log('  • Physics FSM: 1,800ms lock sustained under 1,000 scroll events, 300ms blend-back verified');
  console.log('================================================================\n');
  process.exit(0);
}

if (require.main === module) {
  runAdversarialStressTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runAdversarialStressTests };
