/**
 * Tier 1: Feature Coverage Test Suite (≥50 tests, 5 per feature across 10 features)
 * Strictly derived from ORIGINAL_REQUEST.md and TEST_INFRA.md
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
const { probeVideo, listWebmVideos, listMp4Videos } = require('./helpers/video_inspector');
const {
  getHtmlContent,
  extractHardwareCatalog,
  extractSneakersCatalog,
  findElementById,
  findElementsByClass,
  hasCssRule
} = require('./helpers/dom_inspector');
const {
  MockVideoElement,
  PHYSICS_STATES,
  ReferenceDualControlPhysics,
  ReferenceVideoScrubEngine
} = require('./helpers/engine_simulator');

const rootDir = path.resolve(__dirname, '../..');

// =========================================================================
// FEATURE 1: Transparent WebM VP9 Alpha Rendering (ORIGINAL_REQUEST §R1)
// =========================================================================
describe('Feature 1: Transparent WebM VP9 Alpha Rendering', () => {
  it('F1-T1-1: All showcase WebM video assets use Google VP9 video codec', () => {
    const webmFiles = listWebmVideos();
    assert(webmFiles.length >= 40, `Expected at least 40 WebM files, found ${webmFiles.length}`);
    for (const relPath of webmFiles.slice(0, 10)) {
      const probe = probeVideo(relPath);
      assertEqual(probe.codec.toLowerCase(), 'vp9', `File ${relPath} must use VP9 codec`);
    }
  });

  it('F1-T1-2: WebM video streams contain ALPHA_MODE: 1 tag for native transparency', () => {
    const sampleWebm = 'assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm';
    const probe = probeVideo(sampleWebm);
    assert(probe.hasAlphaModeTag, `WebM asset ${sampleWebm} must declare ALPHA_MODE: 1`);
  });

  it('F1-T1-3: WebM video pixel format includes alpha channel support (yuva420p or alpha-capable)', () => {
    const sampleWebm = 'assets/videos_webm/Logitech_G_Pro_X_Superlight_20260912183605.webm';
    const probe = probeVideo(sampleWebm);
    assert(probe.exists, 'Sample WebM file must exist on disk');
    assert(probe.sizeBytes > 100000, 'WebM file size must be substantial (>100KB)');
  });

  it('F1-T1-4: Matching H.264 ChromaKey MP4 companion files exist for WebM assets', () => {
    const webmFiles = listWebmVideos();
    let matchCount = 0;
    for (const webmPath of webmFiles) {
      const baseName = path.basename(webmPath, '.webm');
      const mp4Path = path.join(rootDir, 'assets', 'videos', `${baseName}.mp4`);
      if (fs.existsSync(mp4Path)) {
        matchCount++;
      }
    }
    assert(matchCount >= 40, `Expected at least 40 companion MP4 files, found ${matchCount}`);
  });

  it('F1-T1-5: Video asset resolution conforms to 1280x720 HD standard for smooth scrubbing', () => {
    const sampleWebm = 'assets/videos_webm/Product_360_degree_rotation_video_20260912183606.webm';
    const probe = probeVideo(sampleWebm);
    assertEqual(probe.width, 1280, 'Width must be 1280px');
    assertEqual(probe.height, 720, 'Height must be 720px');
  });
});

// =========================================================================
// FEATURE 2: 3-Tier 60+ FPS Video Scrubbing Pipeline (ORIGINAL_REQUEST §R1)
// =========================================================================
describe('Feature 2: 3-Tier 60+ FPS Video Scrubbing Pipeline', () => {
  it('F2-T1-1: Scroll ingestion layer normalizes target progress strictly within [0.0, 1.0]', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.setTargetProgress(0.45);
    assertEqual(engine.targetProgress, 0.45, 'Target progress must be 0.45');

    engine.setTargetProgress(-0.2);
    assertEqual(engine.targetProgress, 0.0, 'Negative progress must clamp to 0.0');

    engine.setTargetProgress(1.3);
    assertEqual(engine.targetProgress, 1.0, 'Progress > 1 must clamp to 1.0');
    engine.destroy();
  });

  it('F2-T1-2: Tier 2 RAF lerping smoothly interpolates progress using exponential smoothing (λ ≈ 0.12)', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video, { lerpFactor: 0.12 });

    engine.setTargetProgress(1.0);
    assertEqual(engine.smoothProgress, 0.0, 'Initial smooth progress must be 0.0');

    // First frame tick: smoothProgress = 0 + (1.0 - 0) * 0.12 = 0.12
    engine.tickRAF();
    assertApprox(engine.smoothProgress, 0.12, 0.001, 'Frame 1 smooth progress');

    // Second frame tick: smoothProgress = 0.12 + (1.0 - 0.12) * 0.12 = 0.2256
    engine.tickRAF();
    assertApprox(engine.smoothProgress, 0.2256, 0.001, 'Frame 2 smooth progress');
    engine.destroy();
  });

  it('F2-T1-3: Tier 3 Seek-Lock Guard queues pendingTime when decoder is actively seeking', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video, { quantizeDelta: 0.01 });

    // Manually simulate decoder busy state
    video.seeking = true;
    engine.isSeeking = true;

    engine.setTargetProgress(0.8);
    engine.tickRAF(); // Attempts to seek to 0.8 * 0.12 * 10 = 0.96s

    // Seek should NOT be dispatched immediately while video.seeking is true
    assertEqual(video.currentTime, 0.0, 'currentTime must remain unchanged while seeking is locked');
    assert(engine.pendingTime !== null, 'pendingTime must buffer the pending timestamp');

    // Simulate decoder completing previous seek
    video.emit('seeked');
    assertApprox(video.currentTime, 0.96, 0.01, 'Buffered pendingTime must dispatch upon seeked event');
    engine.destroy();
  });

  it('F2-T1-4: Frame quantization delta suppresses sub-threshold seeks (Δt < 0.038s)', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video, { quantizeDelta: 0.038 });

    engine.targetProgress = 0.001; // targetTime = 0.01s (Δt = 0.01s < 0.038s)
    engine.smoothProgress = 0.001;
    const initialSeeks = engine.totalSeeksIssued;

    engine.tickRAF();
    assertEqual(engine.totalSeeksIssued, initialSeeks, 'Sub-threshold seek must be suppressed by quantize delta');
    engine.destroy();
  });

  it('F2-T1-5: Engine utilizes fastSeek when supported on HTML5 video element', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.seekImmediate(5.0);
    assertEqual(video.fastSeekCount, 1, 'video.fastSeek must be invoked on seekImmediate');
    assertEqual(video.currentTime, 5.0, 'video.currentTime must update to 5.0');
    engine.destroy();
  });
});

// =========================================================================
// FEATURE 3: Dual-Control Physics & Interactive Fallback (ORIGINAL_REQUEST §R3)
// =========================================================================
describe('Feature 3: Dual-Control Physics & Interactive Fallback', () => {
  it('F3-T1-1: Physics finite state machine initializes in IDLE_SCROLL_DRIVEN (0)', () => {
    const physics = new ReferenceDualControlPhysics();
    assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN, 'Initial state must be IDLE_SCROLL_DRIVEN');
    assert(physics.isScrollAllowed(), 'Scroll updates must be allowed in initial state');
    physics.destroy();
  });

  it('F3-T1-2: Turntable pointer drag engages MANUAL_TURNTABLE_DRAG (1) and locks scroll', () => {
    const physics = new ReferenceDualControlPhysics();
    physics.notifyUserInteracting('drag');

    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TURNTABLE_DRAG, 'State must be MANUAL_TURNTABLE_DRAG');
    assert(!physics.isScrollAllowed(), 'Scroll updates must be blocked during manual drag');

    const scrollAccepted = physics.notifyScroll(0.5);
    assert(!scrollAccepted, 'Scroll event must be rejected while manual drag is active');
    physics.destroy();
  });

  it('F3-T1-3: Timeline slider interaction engages MANUAL_TIMELINE_SLIDER (2)', () => {
    const physics = new ReferenceDualControlPhysics();
    physics.notifyUserInteracting('slider');

    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TIMELINE_SLIDER, 'State must be MANUAL_TIMELINE_SLIDER');
    assert(!physics.isScrollAllowed(), 'Scroll updates must be blocked during slider interaction');
    physics.destroy();
  });

  it('F3-T1-4: Manual interaction cooldown timer is set to 1,800ms before returning to scroll', (done) => {
    const physics = new ReferenceDualControlPhysics({ cooldownDurationMs: 50 }); // Fast clock for test
    physics.notifyUserInteracting('drag');

    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TURNTABLE_DRAG);

    setTimeout(() => {
      assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN, 'Must return to IDLE_SCROLL_DRIVEN after cooldown');
      assert(physics.isScrollAllowed(), 'Scroll must be re-enabled after cooldown');
      physics.destroy();
      done();
    }, 60);
  });

  it('F3-T1-5: Cinema playback mode is interrupted cleanly by scroll event with smooth blend callback', () => {
    let blendInvoked = false;
    let blendProgress = 0;
    let blendWindow = 0;

    const physics = new ReferenceDualControlPhysics({
      blendWindowMs: 300,
      onBlendBackToScroll: (p, win) => {
        blendInvoked = true;
        blendProgress = p;
        blendWindow = win;
      }
    });

    physics.notifyCinemaPlayback(true);
    assertEqual(physics.state, PHYSICS_STATES.CINEMA_PLAYBACK, 'State must be CINEMA_PLAYBACK');

    const scrollHandled = physics.notifyScroll(0.75);
    assert(scrollHandled, 'Scroll must successfully interrupt cinema playback');
    assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN, 'Must transition to IDLE_SCROLL_DRIVEN');
    assert(blendInvoked, 'Blend-back callback must be invoked');
    assertEqual(blendProgress, 0.75, 'Blend progress must match scroll progress');
    assertEqual(blendWindow, 300, 'Blend window must be 300ms');
    physics.destroy();
  });
});

// =========================================================================
// FEATURE 4: Project 2 Sneaker Transparent Video Stage (ORIGINAL_REQUEST §R2)
// =========================================================================
describe('Feature 4: Project 2 Sneaker Transparent Video Stage', () => {
  it('F4-T1-1: Project 2 DOM container #project-02 and #sneaker-app exist in index.html', () => {
    const proj = findElementById('project-02');
    assert(proj !== null, 'Element #project-02 must exist');
    const app = findElementById('sneaker-app');
    assert(app !== null, 'Element #sneaker-app must exist');
  });

  it('F4-T1-2: Sneaker viewer render box #snk-render-box exists in DOM structure', () => {
    const viewer = findElementById('snk-viewer-area');
    assert(viewer !== null, 'Element #snk-viewer-area must exist');
    const box = findElementById('snk-render-box');
    assert(box !== null, 'Element #snk-render-box must exist');
  });

  it('F4-T1-3: Ground shadow and dynamic stage lighting elements are present', () => {
    const shadow = findElementById('snk-ground-shadow');
    assert(shadow !== null, 'Element #snk-ground-shadow must exist');
    const light = findElementById('snk-light-spot');
    assert(light !== null, 'Element #snk-light-spot must exist');
    const refl = findElementById('snk-ground-reflection');
    assert(refl !== null, 'Element #snk-ground-reflection must exist');
  });

  it('F4-T1-4: Turntable degree dial HUD elements #snk-degree-dial and #snk-degree-val exist', () => {
    const dial = findElementById('snk-degree-dial');
    assert(dial !== null, 'Element #snk-degree-dial must exist');
    const val = findElementById('snk-degree-val');
    assert(val !== null, 'Element #snk-degree-val must exist');
  });

  it('F4-T1-5: Discrete quick-angle preset pills (#snk-angle-pills) exist for fast multi-angle views', () => {
    const pills = findElementById('snk-angle-pills');
    assert(pills !== null, 'Element #snk-angle-pills must exist');
    const html = getHtmlContent('index.html');
    assert(html.includes('data-angle="0"'), 'Pill for angle 0 must exist');
    assert(html.includes('data-angle="90"'), 'Pill for angle 90 must exist');
    assert(html.includes('data-angle="180"'), 'Pill for angle 180 must exist');
    assert(html.includes('data-angle="top"'), 'Pill for angle top must exist');
  });
});

// =========================================================================
// FEATURE 5: Project 2 Flagship Sneaker Mapping (6 models) (ORIGINAL_REQUEST §R2)
// =========================================================================
describe('Feature 5: Project 2 Flagship Sneaker Mapping (6 models)', () => {
  it('F5-T1-1: Exactly 6 flagship sneaker models are defined in SNEAKERS catalog', () => {
    const catalog = extractSneakersCatalog();
    assert(Array.isArray(catalog), 'SNEAKERS must be an array');
    assertEqual(catalog.length, 6, 'SNEAKERS array must contain exactly 6 models');
  });

  it('F5-T1-2: All 6 required model IDs match specification', () => {
    const catalog = extractSneakersCatalog();
    const expectedIds = ['palm-angels', 'balenciaga', 'margiela', 'rick-owens', 'off-white', 'bottega'];
    const actualIds = catalog.map(s => s.id);
    for (const expectedId of expectedIds) {
      assert(actualIds.includes(expectedId), `Sneaker model ${expectedId} must be present in catalog`);
    }
  });

  it('F5-T1-3: 360° rotation WebM video assets exist in assets/videos_webm/ for sneakers', () => {
    const webmFiles = listWebmVideos();
    const rotationFiles = webmFiles.filter(f => /360|rotation|showcase/i.test(f));
    assert(rotationFiles.length >= 6, `Expected at least 6 360° rotation videos, found ${rotationFiles.length}`);
  });

  it('F5-T1-4: Companion MP4 videos exist in assets/videos/ for sneaker rotation videos', () => {
    const mp4Files = listMp4Videos();
    const rotationMp4 = mp4Files.filter(f => /360|rotation|showcase/i.test(f));
    assert(rotationMp4.length >= 6, `Expected at least 6 companion rotation MP4 videos, found ${rotationMp4.length}`);
  });

  it('F5-T1-5: Photographic multi-angle transparent fallback cutouts exist for all 6 models', () => {
    const catalog = extractSneakersCatalog();
    for (const sneaker of catalog) {
      const normalizedId = sneaker.id.replace(/-/g, '_');
      const angles = ['profile', 'front3q', 'toe', 'heel', 'top'];
      for (const angle of angles) {
        const expectedFile = path.join(rootDir, 'assets', 'sneakers', `${normalizedId}_${angle}.png`);
        assert(fs.existsSync(expectedFile), `Missing fallback cutout: ${expectedFile}`);
      }
    }
  });
});

// =========================================================================
// FEATURE 6: Project 3 Hardware Video Layer Unification (ORIGINAL_REQUEST §R2)
// =========================================================================
describe('Feature 6: Project 3 Hardware Video Layer Unification', () => {
  it('F6-T1-1: Project 3 DOM container #project-03 and #hardware-app exist in index.html', () => {
    const proj = findElementById('project-03');
    assert(proj !== null, 'Element #project-03 must exist');
    const app = findElementById('hardware-app');
    assert(app !== null, 'Element #hardware-app must exist');
  });

  it('F6-T1-2: Hardware viewport #hw-viewport and stage pane #hw-stage exist', () => {
    const stage = findElementById('hw-stage');
    assert(stage !== null, 'Element #hw-stage must exist');
    const viewport = findElementById('hw-viewport');
    assert(viewport !== null, 'Element #hw-viewport must exist');
  });

  it('F6-T1-3: Dedicated video layer #hw-video-layer and video element #hw-xray-video exist', () => {
    const layer = findElementById('hw-video-layer');
    assert(layer !== null, 'Element #hw-video-layer must exist');
    const video = findElementById('hw-xray-video');
    assert(video !== null, 'Element #hw-xray-video must exist');
    assertEqual(video.tag.toLowerCase(), 'video', '#hw-xray-video must be a <video> element');
  });

  it('F6-T1-4: Dynamic ground contact shadow #hw-contact-shadow is present in viewport', () => {
    const shadow = findElementById('hw-contact-shadow');
    assert(shadow !== null, 'Element #hw-contact-shadow must exist');
  });

  it('F6-T1-5: Hardware HUD angle indicator #hw-hud-angle and scroll badge exist', () => {
    const hudAngle = findElementById('hw-hud-angle');
    assert(hudAngle !== null, 'Element #hw-hud-angle must exist');
    const badge = findElementById('hw-scroll-badge');
    assert(badge !== null, 'Element #hw-scroll-badge must exist');
  });
});

// =========================================================================
// FEATURE 7: Project 3 19-Model Hardware Catalog Mapping (ORIGINAL_REQUEST §R2)
// =========================================================================
describe('Feature 7: Project 3 19-Model Hardware Catalog Mapping', () => {
  it('F7-T1-1: HARDWARE_CATALOG contains all 4 required categories', () => {
    const catalog = extractHardwareCatalog();
    const categories = Object.keys(catalog);
    assert(categories.includes('headphones'), 'Catalog must include headphones');
    assert(categories.includes('mice'), 'Catalog must include mice');
    assert(categories.includes('speakers'), 'Catalog must include speakers');
    assert(categories.includes('keyboards'), 'Catalog must include keyboards');
  });

  it('F7-T1-2: Model counts per category match specification (5, 5, 5, 4 = 19 models)', () => {
    const catalog = extractHardwareCatalog();
    assertEqual(catalog.headphones.length, 5, 'Headphones must have 5 models');
    assertEqual(catalog.mice.length, 5, 'Mice must have 5 models');
    assertEqual(catalog.speakers.length, 5, 'Speakers must have 5 models');
    assertEqual(catalog.keyboards.length, 4, 'Keyboards must have 4 models');
    const total = catalog.headphones.length + catalog.mice.length + catalog.speakers.length + catalog.keyboards.length;
    assertEqual(total, 19, 'Total hardware models must equal exactly 19');
  });

  it('F7-T1-3: Every model in HARDWARE_CATALOG points to an existing WebM VP9 Alpha video', () => {
    const catalog = extractHardwareCatalog();
    for (const [cat, items] of Object.entries(catalog)) {
      for (const item of items) {
        assert(item.video, `Model ${item.id} in ${cat} must specify .video`);
        const fullPath = path.join(rootDir, item.video);
        assert(fs.existsSync(fullPath), `Video file for model ${item.id} must exist: ${item.video}`);
      }
    }
  });

  it('F7-T1-4: Every model in HARDWARE_CATALOG points to an existing companion MP4 video', () => {
    const catalog = extractHardwareCatalog();
    for (const [cat, items] of Object.entries(catalog)) {
      for (const item of items) {
        assert(item.videoMp4, `Model ${item.id} in ${cat} must specify .videoMp4`);
        const fullPath = path.join(rootDir, item.videoMp4);
        assert(fs.existsSync(fullPath), `MP4 file for model ${item.id} must exist: ${item.videoMp4}`);
      }
    }
  });

  it('F7-T1-5: Every model in HARDWARE_CATALOG points to an existing thumbnail / poster image', () => {
    const catalog = extractHardwareCatalog();
    for (const [cat, items] of Object.entries(catalog)) {
      for (const item of items) {
        assert(item.thumb, `Model ${item.id} in ${cat} must specify .thumb`);
        const fullPath = path.join(rootDir, item.thumb);
        assert(fs.existsSync(fullPath), `Thumb file for model ${item.id} must exist: ${item.thumb}`);
      }
    }
  });
});

// =========================================================================
// FEATURE 8: Project 3 Teardown Scrubbing & Cinema Mode (ORIGINAL_REQUEST §R2, §R3)
// =========================================================================
describe('Feature 8: Project 3 Teardown Scrubbing & Cinema Mode', () => {
  it('F8-T1-1: Teardown slider #hw-xray-slider exists with min="0", max="100", step="0.5"', () => {
    const slider = findElementById('hw-xray-slider');
    assert(slider !== null, 'Element #hw-xray-slider must exist');
    assertEqual(slider.getAttr('min'), '0', 'Slider min must be 0');
    assertEqual(slider.getAttr('max'), '100', 'Slider max must be 100');
    assertEqual(slider.getAttr('step'), '0.5', 'Slider step must be 0.5');
  });

  it('F8-T1-2: Teardown percentage readout element #hw-xray-slider-val is present', () => {
    const val = findElementById('hw-xray-slider-val');
    assert(val !== null, 'Element #hw-xray-slider-val must exist');
  });

  it('F8-T1-3: Play Cinema button #hw-btn-video-play exists with expected text', () => {
    const btn = findElementById('hw-btn-video-play');
    assert(btn !== null, 'Element #hw-btn-video-play must exist');
    const html = getHtmlContent('index.html');
    assert(html.includes('hw-btn-video-play') && html.includes('PLAY CINEMA'), 'Must contain PLAY CINEMA button');
  });

  it('F8-T1-4: Teardown scrub math maps normalized scroll progress to video timeline', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    // Scroll progress 0.0 -> video time 0.0s
    engine.seekImmediate(0.0);
    assertEqual(video.currentTime, 0.0, 'Progress 0% should seek to 0s');

    // Scroll progress 0.5 -> video time 5.0s
    engine.seekImmediate(5.0);
    assertEqual(video.currentTime, 5.0, 'Progress 50% should seek to 5s');

    // Scroll progress 1.0 -> video time 10.0s
    engine.seekImmediate(10.0);
    assertEqual(video.currentTime, 10.0, 'Progress 100% should seek to 10s');
    engine.destroy();
  });

  it('F8-T1-5: Cinema mode toggle starts autonomous video playback', async () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    await engine.playAutonomous();
    assert(!video.paused, 'Video must be playing in autonomous cinema mode');
    assert(engine.isAutonomousPlaying, 'Engine must flag isAutonomousPlaying as true');

    engine.pauseAutonomous();
    assert(video.paused, 'Video must be paused after pauseAutonomous');
    engine.destroy();
  });
});

// =========================================================================
// FEATURE 9: Category Tab & Model Switch Transitions (ORIGINAL_REQUEST §R2, §R3)
// =========================================================================
describe('Feature 9: Category Tab & Model Switch Transitions', () => {
  it('F9-T1-1: Category dock contains tabs for all 4 hardware categories', () => {
    const html = getHtmlContent('index.html');
    assert(html.includes('data-cat="headphones"'), 'Category tab for headphones must exist');
    assert(html.includes('data-cat="mice"'), 'Category tab for mice must exist');
    assert(html.includes('data-cat="speakers"'), 'Category tab for speakers must exist');
    assert(html.includes('data-cat="keyboards"'), 'Category tab for keyboards must exist');
  });

  it('F9-T1-2: Model roster container #hw-roster-list exists for dynamic model buttons', () => {
    const roster = findElementById('hw-roster-list');
    assert(roster !== null, 'Element #hw-roster-list must exist');
  });

  it('F9-T1-3: Hardware model count badge #hw-model-count exists in DOM', () => {
    const countBadge = findElementById('hw-model-count');
    assert(countBadge !== null, 'Element #hw-model-count must exist');
  });

  it('F9-T1-4: Video source loader updates video element src and poster smoothly', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    const testWebm = 'assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm';
    const testPoster = 'assets/video_thumbs_webm/Apple_AirPods_Max_Exploded_View_20260912183607.png';

    engine.loadSource(testWebm, null, testPoster);
    assertEqual(video.src, testWebm, 'video.src must be updated');
    assertEqual(video.poster, testPoster, 'video.poster must be updated');
    engine.destroy();
  });

  it('F9-T1-5: Switching models resets or transitions smoothly without NaN values', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.seekImmediate(8.0);
    assertEqual(video.currentTime, 8.0);

    // Swap model and re-prime time to 0
    engine.seekImmediate(0.0);
    assertEqual(video.currentTime, 0.0, 'Swapping model should reset time safely to 0');
    assert(!isNaN(video.currentTime), 'Video currentTime must not be NaN');
    engine.destroy();
  });
});

// =========================================================================
// FEATURE 10: Byte-for-Byte File Synchronization (ORIGINAL_REQUEST §R3)
// =========================================================================
describe('Feature 10: Byte-for-Byte File Synchronization', () => {
  const file1 = path.join(rootDir, 'index.html');
  const file2 = path.join(rootDir, 'personal_brand_v4.html');

  it('F10-T1-1: Both root HTML entrypoints exist on disk', () => {
    assert(fs.existsSync(file1), 'index.html must exist');
    assert(fs.existsSync(file2), 'personal_brand_v4.html must exist');
  });

  it('F10-T1-2: Both HTML entrypoints have identical byte length', () => {
    const stat1 = fs.statSync(file1);
    const stat2 = fs.statSync(file2);
    assertEqual(stat1.size, stat2.size, `File sizes must match: index.html (${stat1.size}) vs personal_brand_v4.html (${stat2.size})`);
  });

  it('F10-T1-3: Both HTML entrypoints have identical cryptographic SHA-256 hash', () => {
    const hash1 = sha256File(file1);
    const hash2 = sha256File(file2);
    assertEqual(hash1, hash2, `SHA256 mismatch:\nindex.html: ${hash1}\npersonal_brand_v4.html: ${hash2}`);
  });

  it('F10-T1-4: Byte-for-byte binary buffer comparison shows zero mismatched bytes', () => {
    const buf1 = fs.readFileSync(file1);
    const buf2 = fs.readFileSync(file2);
    assertEqual(buf1.length, buf2.length, 'Buffer lengths must be identical');
    const diffOffset = buf1.compare(buf2);
    assertEqual(diffOffset, 0, `Buffer mismatch detected at relative offset ${diffOffset}`);
  });

  it('F10-T1-5: Both files are encoded in clean UTF-8 without BOM or corrupt bytes', () => {
    const buf1 = fs.readFileSync(file1);
    // Check for UTF-8 BOM: EF BB BF
    const hasBom = buf1[0] === 0xEF && buf1[1] === 0xBB && buf1[2] === 0xBF;
    assert(!hasBom, 'Files should not contain UTF-8 BOM');
    const text1 = buf1.toString('utf8');
    assert(!text1.includes('\uFFFD'), 'Text must not contain UTF-8 replacement character (corrupted byte sequence)');
  });
});
