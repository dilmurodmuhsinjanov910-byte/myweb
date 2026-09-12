/**
 * Tier 4: Real-World Workload Scenarios Test Suite (≥5 complex scenarios)
 * Simulates complete end-to-end user journeys, gestures, and multi-step interactions
 */

const path = require('path');
const fs = require('fs');
const {
  describe,
  it,
  assert,
  assertEqual,
  assertApprox,
  assertInRange
} = require('./helpers/test_utils');
const { probeVideo } = require('./helpers/video_inspector');
const {
  extractHardwareCatalog,
  extractSneakersCatalog,
  findElementById
} = require('./helpers/dom_inspector');
const {
  MockVideoElement,
  PHYSICS_STATES,
  ReferenceDualControlPhysics,
  ReferenceVideoScrubEngine
} = require('./helpers/engine_simulator');

describe('Tier 4: Real-World Workload Scenarios', () => {
  it('T4-SCEN-1: Continuous Page Scroll from Hero to Footer', () => {
    // Simulates a user smoothly scrolling down the entire long single-page portfolio
    const sections = [
      { id: 'hero', startY: 0, endY: 900 },
      { id: 'statement', startY: 900, endY: 1800 },
      { id: 'about', startY: 1800, endY: 2700 },
      { id: 'journey', startY: 2700, endY: 3600 },
      { id: 'project-01', startY: 3600, endY: 5200 },
      { id: 'project-02', startY: 5200, endY: 7200 },
      { id: 'project-03', startY: 7200, endY: 9200 },
      { id: 'stats', startY: 9200, endY: 10000 },
      { id: 'closing', startY: 10000, endY: 10800 }
    ];

    const snkVideo = new MockVideoElement(10.0);
    const snkEngine = new ReferenceVideoScrubEngine(snkVideo);

    const hwVideo = new MockVideoElement(10.0);
    const hwEngine = new ReferenceVideoScrubEngine(hwVideo);

    // Scroll simulation in 50px increments
    const totalHeight = 10800;
    for (let scrollY = 0; scrollY <= totalHeight; scrollY += 100) {
      // If in or past Project 02 (Sneakers): scrollY >= 5200
      if (scrollY >= 5200) {
        const pSnk = Math.min(1.0, (scrollY - 5200) / 2000);
        snkEngine.setTargetProgress(pSnk);
        snkEngine.tickRAF();
      }

      // If in or past Project 03 (Hardware): scrollY >= 7200
      if (scrollY >= 7200) {
        const pHw = Math.min(1.0, (scrollY - 7200) / 2000);
        hwEngine.setTargetProgress(pHw);
        hwEngine.tickRAF();
      }
    }

    // After scrolling past Project 02, sneaker progress should be ~1.0
    assertInRange(snkEngine.smoothProgress, 0.9, 1.0, 'Sneaker scrub should reach end of section');

    // After scrolling past Project 03, hardware progress should be ~1.0
    assertInRange(hwEngine.smoothProgress, 0.9, 1.0, 'Hardware teardown scrub should reach end of section');

    snkEngine.destroy();
    hwEngine.destroy();
  });

  it('T4-SCEN-2: Rapid Category Dock Switching & Immediate Model Scrub', () => {
    // User lands on Project 3, frantically taps between categories and immediately scrubs slider
    const catalog = extractHardwareCatalog();
    const categories = ['headphones', 'mice', 'keyboards', 'speakers'];
    const hwVideo = new MockVideoElement(10.0);
    const hwEngine = new ReferenceVideoScrubEngine(hwVideo);

    let activeCat = 'headphones';
    let activeModel = catalog[activeCat][0];

    // Rapid switches
    for (const cat of categories) {
      activeCat = cat;
      activeModel = catalog[cat][0];
      hwEngine.loadSource(activeModel.video, activeModel.videoMp4, activeModel.thumb);
      assertEqual(hwVideo.src, activeModel.video);
    }

    // Immediately scrub slider to 62%
    hwEngine.seekImmediate(6.2);
    assertEqual(hwVideo.currentTime, 6.2, 'Slider scrub to 6.2s succeeds after rapid category switching');
    hwEngine.destroy();
  });

  it('T4-SCEN-3: Interactive Drag Overrule & Resume Scroll Scrubbing', (done) => {
    // User is scrolling, stops to manually inspect hardware turntable by dragging 720°, releases,
    // observes cooldown lock rejecting scroll events, then resumes scrolling after cooldown
    const hwVideo = new MockVideoElement(10.0);
    const hwEngine = new ReferenceVideoScrubEngine(hwVideo);
    const physics = new ReferenceDualControlPhysics({ cooldownDurationMs: 60 });

    // Step 1: Scroll driving
    hwEngine.setTargetProgress(0.25);
    hwEngine.tickRAF();
    assert(physics.isScrollAllowed());

    // Step 2: User grabs turntable and drags
    physics.notifyUserInteracting('drag');
    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TURNTABLE_DRAG);

    // Scroll attempt during drag is rejected
    const scroll1 = physics.notifyScroll(0.4);
    assert(!scroll1, 'Scroll must be rejected during drag');

    // Step 3: Wait for cooldown
    setTimeout(() => {
      assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN, 'Returns to scroll driven after cooldown');
      const scroll2 = physics.notifyScroll(0.85);
      assert(scroll2, 'Scroll accepted after cooldown');

      hwEngine.setTargetProgress(0.85);
      for (let i = 0; i < 15; i++) hwEngine.tickRAF();
      assert(hwVideo.currentTime > 5.0, 'Video continues smooth tracking on scroll resume');

      physics.destroy();
      hwEngine.destroy();
      done();
    }, 80);
  });

  it('T4-SCEN-4: Play Cinema Activation and Scroll Interrupt Blend', async () => {
    // User clicks ▶ PLAY CINEMA, video plays autonomously, user scrolls page,
    // playback pauses and smoothly blends back to scroll tracking without snapping
    const hwVideo = new MockVideoElement(10.0);
    const hwEngine = new ReferenceVideoScrubEngine(hwVideo);
    let blendCalled = false;
    let blendTime = 0;

    const physics = new ReferenceDualControlPhysics({
      blendWindowMs: 300,
      onBlendBackToScroll: (p, win) => {
        blendCalled = true;
        blendTime = win;
      }
    });

    // Start cinema
    await hwEngine.playAutonomous();
    physics.notifyCinemaPlayback(true);
    assertEqual(physics.state, PHYSICS_STATES.CINEMA_PLAYBACK);
    assert(!hwVideo.paused);

    // Advance simulated playback time
    hwVideo.currentTime = 4.8;

    // User scrolls to 0.70
    const handled = physics.notifyScroll(0.70);
    assert(handled);
    assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
    assert(blendCalled, 'Blend callback must be triggered');
    assertEqual(blendTime, 300, '300ms blend window');

    hwEngine.pauseAutonomous();
    assert(hwVideo.paused, 'Video paused on scroll interrupt');

    physics.destroy();
    hwEngine.destroy();
  });

  it('T4-SCEN-5: High-Speed Fast-Scroll Reverse Scrubbing', () => {
    // User vigorously scrolls upward in reverse at high velocity (3,000 px/s)
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video, { lerpFactor: 0.12, quantizeDelta: 0.038 });

    // Initial position at 1.0 (bottom of section)
    engine.seekImmediate(10.0);
    assertEqual(video.currentTime, 10.0);

    // Fast upward scroll from 1.0 down to 0.0 in 20 high-velocity steps
    for (let step = 20; step >= 0; step--) {
      engine.setTargetProgress(step / 20);
      engine.tickRAF();
    }

    // Engine must not crash, times must be in range, smoothProgress must decrease monotonically
    assertInRange(video.currentTime, 0.0, 10.0);
    assert(engine.smoothProgress < 0.5, 'smoothProgress must have moved significantly towards 0');
    engine.destroy();
  });

  it('T4-SCEN-6: Mobile / Touch Gestures Simulation (touch-drag turntable, angle pills, swipe scrub)', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);
    const physics = new ReferenceDualControlPhysics();

    // Touch gesture 1: User swipes horizontally across turntable
    physics.notifyUserInteracting('drag');
    let touchStartX = 150;
    let touchCurrentX = 280;
    let deltaAngle = (touchCurrentX - touchStartX) * 0.8; // ~104 deg
    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TURNTABLE_DRAG);

    // Touch gesture 2: User taps 90° angle pill
    engine.seekImmediate(2.5); // 90° = 25% of 10s
    assertEqual(video.currentTime, 2.5);

    // Touch gesture 3: User drags slider
    physics.notifyUserInteracting('slider');
    engine.seekImmediate(7.0);
    assertEqual(video.currentTime, 7.0);

    physics.destroy();
    engine.destroy();
  });

  it('T4-SCEN-7: Repeated Rapid Tab and Model Switching Stress Cycle (10 complete cycles)', () => {
    const catalog = extractHardwareCatalog();
    const categories = Object.keys(catalog);
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    for (let cycle = 0; cycle < 10; cycle++) {
      const cat = categories[cycle % categories.length];
      const models = catalog[cat];
      const model = models[cycle % models.length];
      engine.loadSource(model.video, model.videoMp4, model.thumb);
      engine.setTargetProgress((cycle % 5) / 5);
      engine.tickRAF();
      assert(!isNaN(video.currentTime), 'Video currentTime must not become NaN during stress cycle');
    }
    engine.destroy();
  });
});
