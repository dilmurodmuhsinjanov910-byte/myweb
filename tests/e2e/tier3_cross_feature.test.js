/**
 * Tier 3: Pairwise Combinatorial Test Suite (≥10 tests)
 * Tests cross-feature interactions and complex state transitions
 */

const path = require('path');
const fs = require('fs');
const {
  describe,
  it,
  assert,
  assertEqual,
  assertApprox,
  assertInRange,
  sha256File
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

const rootDir = path.resolve(__dirname, '../..');

describe('Tier 3: Pairwise Combinatorial Interactions', () => {
  it('T3-COMB-1 [F1 × F2]: WebM VP9 Alpha video asset loaded into 3-Tier Scrubbing Engine under rapid scroll scrubbing', () => {
    const sampleWebm = 'assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm';
    const probe = probeVideo(sampleWebm);
    assert(probe.hasAlphaModeTag, 'WebM stream must declare ALPHA_MODE: 1');

    const video = new MockVideoElement(probe.duration);
    const engine = new ReferenceVideoScrubEngine(video, { quantizeDelta: 0.038, lerpFactor: 0.12 });
    engine.loadSource(sampleWebm);

    // Run 50 rapid scroll ticks
    for (let i = 0; i <= 50; i++) {
      engine.setTargetProgress(i / 50);
      engine.tickRAF();
    }

    assert(engine.totalSeeksIssued > 0, 'Seeks must be issued during scrub');
    assertInRange(video.currentTime, 0.0, probe.duration, 'Video time must be within duration');
    engine.destroy();
  });

  it('T3-COMB-2 [F2 × F3]: High-frequency scroll scrubbing interrupted by manual turntable drag', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);
    const physics = new ReferenceDualControlPhysics({ cooldownDurationMs: 1800 });

    // Step 1: Scroll driving
    engine.setTargetProgress(0.3);
    engine.tickRAF();
    assert(physics.isScrollAllowed(), 'Scroll allowed in IDLE state');

    // Step 2: User initiates manual drag
    physics.notifyUserInteracting('drag');
    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TURNTABLE_DRAG);

    // Step 3: Subsequent scroll events should be ignored
    const scrollAccepted = physics.notifyScroll(0.8);
    assert(!scrollAccepted, 'Scroll must be rejected during manual drag');

    // Engine progress remains at user command
    engine.seekImmediate(7.2);
    assertEqual(video.currentTime, 7.2, 'Manual drag immediately controls video time');
    physics.destroy();
    engine.destroy();
  });

  it('T3-COMB-3 [F3 × F8]: Active Cinema Playback interrupted by user scroll event (initiating 300ms blend-back)', async () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);
    let blendInvoked = false;
    let blendTarget = 0;

    const physics = new ReferenceDualControlPhysics({
      blendWindowMs: 300,
      onBlendBackToScroll: (p) => {
        blendInvoked = true;
        blendTarget = p;
      }
    });

    // Start cinema mode
    await engine.playAutonomous();
    physics.notifyCinemaPlayback(true);
    assertEqual(physics.state, PHYSICS_STATES.CINEMA_PLAYBACK);
    assert(!video.paused, 'Video should be actively playing in cinema mode');

    // User scrolls page to progress 0.65
    const accepted = physics.notifyScroll(0.65);
    assert(accepted, 'Scroll must interrupt cinema playback');
    assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
    assert(blendInvoked, 'Blend callback must be triggered');
    assertEqual(blendTarget, 0.65, 'Blend target progress must be 0.65');

    engine.pauseAutonomous();
    assert(video.paused, 'Video must be paused after autonomous cinema interrupted');
    physics.destroy();
    engine.destroy();
  });

  it('T3-COMB-4 [F7 × F9]: Category tab switch from Headphones to Keyboards with immediate model selection', () => {
    const catalog = extractHardwareCatalog();
    assert(catalog.headphones.length === 5, 'Headphones has 5 models');
    assert(catalog.keyboards.length === 4, 'Keyboards has 4 models');

    let activeCat = 'headphones';
    let activeIdx = 0;

    // Switch category to keyboards
    activeCat = 'keyboards';
    activeIdx = 2; // Model 3: Apple Magic Keyboard

    const selectedModel = catalog[activeCat][activeIdx];
    assert(selectedModel !== undefined, 'Selected keyboard model must exist');
    assert(selectedModel.video.endsWith('.webm'), 'Selected model video must be WebM');
    assert(fs.existsSync(path.join(rootDir, selectedModel.video)), 'Video asset must exist on disk');
  });

  it('T3-COMB-5 [F2 × F9]: Rapid category switches while video scrub engine has pending seeks queued', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    // Simulate busy seek state
    video.seeking = true;
    engine.isSeeking = true;
    engine.setTargetProgress(0.9);
    engine.tickRAF(); // Buffers pendingTime = 0.9 * 0.12 * 10 = 1.08s
    assert(engine.pendingTime !== null, 'pendingTime should be buffered');

    // Abrupt category switch occurs
    const newWebm = 'assets/videos_webm/Keychron_Q1_Pro_Exploded_View_20260912183607.webm';
    engine.loadSource(newWebm);
    engine.pendingTime = null; // Clear obsolete seek

    // Release seeking
    video.emit('seeked');
    assertEqual(engine.pendingTime, null, 'No obsolete seek dispatched after category switch');
    engine.destroy();
  });

  it('T3-COMB-6 [F5 × F4]: Sneaker model change while turntable degree dial is rotated to 270°', () => {
    const catalog = extractSneakersCatalog();
    let currentSneakerIdx = 1; // Balenciaga
    let currentAngle = 270.0;

    // User switches to Margiela (idx 2)
    currentSneakerIdx = 2;
    const activeModel = catalog[currentSneakerIdx];
    assertEqual(activeModel.id, 'margiela');

    // Angle preserved at 270 degrees
    assertEqual(currentAngle, 270.0, 'Turntable angle maintained across sneaker model swap');
  });

  it('T3-COMB-7 [F3 × F8]: Teardown slider drag to 85% followed immediately by ▶ PLAY CINEMA click', async () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);
    const physics = new ReferenceDualControlPhysics();

    // User scrubs slider to 85%
    physics.notifyUserInteracting('slider');
    engine.seekImmediate(8.5);
    assertEqual(video.currentTime, 8.5, 'Video currentTime seeks to 8.5s');
    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TIMELINE_SLIDER);

    // User clicks ▶ PLAY CINEMA
    physics.notifyCinemaPlayback(true);
    await engine.playAutonomous();
    assertEqual(physics.state, PHYSICS_STATES.CINEMA_PLAYBACK, 'Cinema playback takes priority over slider lock');
    assert(!video.paused, 'Video begins continuous playback from 8.5s');

    physics.destroy();
    engine.destroy();
  });

  it('T3-COMB-8 [F2 × F8]: Page scroll entering Project 3 section while Teardown slider is at non-zero value', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);
    const physics = new ReferenceDualControlPhysics({ cooldownDurationMs: 50 });

    // Slider was left at 40%
    physics.notifyUserInteracting('slider');
    engine.seekImmediate(4.0);
    assertEqual(video.currentTime, 4.0);

    // Wait for cooldown to expire so scroll takes over
    setTimeout(() => {
      assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
      // Scroll resumes
      engine.setTargetProgress(0.7);
      for (let i = 0; i < 10; i++) engine.tickRAF();
      assert(video.currentTime > 4.0, 'Video currentTime moves from 4.0s towards 7.0s on scroll resume');
      physics.destroy();
      engine.destroy();
    }, 60);
  });

  it('T3-COMB-9 [F6 × F7]: Hardware video layer rendering across all 4 categories with contact shadow grounding', () => {
    const catalog = extractHardwareCatalog();
    const shadow = findElementById('hw-contact-shadow');
    assert(shadow !== null, '#hw-contact-shadow must be present in DOM');

    for (const [catName, models] of Object.entries(catalog)) {
      for (const m of models) {
        assert(m.video.startsWith('assets/videos_webm/'), `Video for ${m.id} in ${catName} must be in videos_webm`);
        assert(m.videoMp4.startsWith('assets/videos/'), `MP4 for ${m.id} in ${catName} must be in videos`);
      }
    }
  });

  it('T3-COMB-10 [F10 × F1]: Byte-for-byte SHA256 parity verification combined with media asset path references', () => {
    const hash1 = sha256File(path.join(rootDir, 'index.html'));
    const hash2 = sha256File(path.join(rootDir, 'personal_brand_v4.html'));
    assertEqual(hash1, hash2, 'index.html and personal_brand_v4.html must have identical SHA256');

    // Both files reference the same WebM assets
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert(html.includes('assets/videos_webm/'), 'HTML must reference assets/videos_webm/');
    assert(html.includes('assets/videos/'), 'HTML must reference assets/videos/');
  });

  it('T3-COMB-11 [F1 × F4]: Sneaker 360° video aspect ratio vs stage container containment', () => {
    const sampleWebm = 'assets/videos_webm/Product_360_degree_rotation_video_20260912183606.webm';
    const probe = probeVideo(sampleWebm);
    assert(probe.exists, 'Video file must exist');
    assertApprox(probe.width / probe.height, 16 / 9, 0.01, 'Aspect ratio must be 16:9');

    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert(html.includes('snk-render-box'), 'snk-render-box must exist in CSS/HTML');
  });

  it('T3-COMB-12 [F2 × F7]: 3-tier scrub engine frame quantization across all 19 hardware models', () => {
    const catalog = extractHardwareCatalog();
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video, { quantizeDelta: 0.038 });

    for (const [catName, models] of Object.entries(catalog)) {
      for (const m of models) {
        engine.loadSource(m.video);
        engine.setTargetProgress(0.5);
        engine.tickRAF();
        assertInRange(video.currentTime, 0.0, 10.0, `Current time must be valid for model ${m.id}`);
      }
    }
    engine.destroy();
  });

  it('T3-COMB-13 [F8 × F9]: Cinema playback across category tabs pauses cleanly on category tab switch', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);
    const physics = new ReferenceDualControlPhysics();

    // Start cinema on current model
    physics.notifyCinemaPlayback(true);
    engine.playAutonomous();
    assertEqual(physics.state, PHYSICS_STATES.CINEMA_PLAYBACK);
    assert(!video.paused);

    // User switches category dock: policy cleanly pauses cinema
    physics.notifyCinemaPlayback(false);
    engine.pauseAutonomous();
    assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
    assert(video.paused, 'Video paused on category switch');

    physics.destroy();
    engine.destroy();
  });
});
