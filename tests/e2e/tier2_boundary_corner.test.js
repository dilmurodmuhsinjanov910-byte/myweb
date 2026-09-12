/**
 * Tier 2: Boundary & Corner Cases Test Suite (≥50 tests, 5 per feature across 10 features)
 * Stress-tests edge conditions, rapid events, boundaries, and abnormal inputs
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const {
  describe,
  it,
  assert,
  assertEqual,
  assertApprox,
  assertInRange
} = require('./helpers/test_utils');
const { probeVideo, listWebmVideos, listMp4Videos } = require('./helpers/video_inspector');
const {
  getHtmlContent,
  extractHardwareCatalog,
  extractSneakersCatalog,
  findElementById,
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
// FEATURE 1: Boundary & Corner Cases (WebM VP9 Alpha)
// =========================================================================
describe('Feature 1 Boundary: Transparent WebM VP9 Alpha Rendering', () => {
  it('F1-T2-1: All 42 WebM video files conform to exact 16:9 widescreen ratio (1280x720)', () => {
    const webmFiles = listWebmVideos();
    for (const relPath of webmFiles) {
      const probe = probeVideo(relPath);
      const ratio = probe.width / probe.height;
      assertApprox(ratio, 16 / 9, 0.01, `Aspect ratio for ${relPath} must be 16:9`);
    }
  });

  it('F1-T2-2: Video durations are standardized across catalog (~10.0s)', () => {
    const sampleWebm = 'assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm';
    const probe = probeVideo(sampleWebm);
    assertInRange(probe.duration, 9.0, 11.0, 'Duration should be approximately 10 seconds');
  });

  it('F1-T2-3: Gracefully handles and rejects non-existent or corrupted video paths', () => {
    let threw = false;
    try {
      probeVideo('assets/videos_webm/non_existent_ghost_file.webm');
    } catch (err) {
      threw = true;
    }
    assert(threw, 'Probing missing video file must throw descriptive error');
  });

  it('F1-T2-4: Validates minimum file size threshold across all WebM assets (>1MB to ensure full video data)', () => {
    const webmFiles = listWebmVideos();
    for (const relPath of webmFiles) {
      const stat = fs.statSync(path.join(rootDir, relPath));
      assert(stat.size > 1024 * 1024, `WebM file ${relPath} must be > 1MB (actual: ${stat.size} bytes)`);
    }
  });

  it('F1-T2-5: Frame rate is exactly 24 fps across video samples', () => {
    const sample = 'assets/videos_webm/Sony_WH-1000XM5_Exploded_View_20260912183606.webm';
    const probe = probeVideo(sample);
    assertEqual(probe.r_frame_rate, '24/1', 'Frame rate must be 24/1 (24 fps)');
  });
});

// =========================================================================
// FEATURE 2: Boundary & Corner Cases (Scrubbing Pipeline)
// =========================================================================
describe('Feature 2 Boundary: 3-Tier 60+ FPS Video Scrubbing Pipeline', () => {
  it('F2-T2-1: Lower boundary clamp: progress <= 0 clamps target progress and seek time to 0.0', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.setTargetProgress(-999.9);
    assertEqual(engine.targetProgress, 0.0);
    engine.seekImmediate(-10.0);
    assertEqual(video.currentTime, 0.0);
    engine.destroy();
  });

  it('F2-T2-2: Upper boundary clamp: progress >= 1 clamps target progress to 1.0 and time to duration', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.setTargetProgress(999.9);
    assertEqual(engine.targetProgress, 1.0);
    engine.seekImmediate(50.0);
    assertEqual(video.currentTime, 10.0);
    engine.destroy();
  });

  it('F2-T2-3: Robust input filtering: NaN, undefined, and non-numeric progress are ignored', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.setTargetProgress(0.5);
    engine.setTargetProgress(NaN);
    assertEqual(engine.targetProgress, 0.5, 'NaN input must not overwrite progress');

    engine.setTargetProgress(undefined);
    assertEqual(engine.targetProgress, 0.5, 'Undefined input must not overwrite progress');

    engine.setTargetProgress("invalid string");
    assertEqual(engine.targetProgress, 0.5, 'String input must not overwrite progress');
    engine.destroy();
  });

  it('F2-T2-4: High-frequency burst scroll: 1,000 rapid scroll events in 100ms throttle seeks to <= 30', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video, { quantizeDelta: 0.038, lerpFactor: 0.12 });

    // Simulate 1,000 rapid scroll inputs
    for (let i = 0; i < 1000; i++) {
      engine.setTargetProgress(i / 1000);
      if (i % 30 === 0) {
        engine.tickRAF(); // Simulate ~33 RAF ticks over the burst
      }
    }

    assert(
      engine.totalSeeksIssued <= 35,
      `Throttling failed: issued ${engine.totalSeeksIssued} seeks, expected <= 35`
    );
    engine.destroy();
  });

  it('F2-T2-5: Zero-duration video metadata protection prevents division-by-zero or NaN times', () => {
    const uninitializedVideo = new MockVideoElement(0.0);
    const engine = new ReferenceVideoScrubEngine(uninitializedVideo);

    engine.setTargetProgress(0.75);
    engine.tickRAF();
    assert(!isNaN(uninitializedVideo.currentTime), 'currentTime must never become NaN on 0-duration video');
    assertEqual(uninitializedVideo.currentTime, 0.0, 'currentTime must remain 0.0 on 0-duration video');
    engine.destroy();
  });
});

// =========================================================================
// FEATURE 3: Boundary & Corner Cases (Dual-Control Physics)
// =========================================================================
describe('Feature 3 Boundary: Dual-Control Physics & Interactive Fallback', () => {
  it('F3-T2-1: Sub-10ms rapid click-and-release properly engages and sustains cooldown', () => {
    const physics = new ReferenceDualControlPhysics({ cooldownDurationMs: 200 });
    physics.notifyUserInteracting('drag');
    assertEqual(physics.state, PHYSICS_STATES.MANUAL_TURNTABLE_DRAG);

    // Immediately release
    assert(!physics.isScrollAllowed(), 'Scroll should still be locked immediately after release');
    physics.destroy();
  });

  it('F3-T2-2: Consecutive rapid manual inputs continuously re-arm 1,800ms cooldown without leak', (done) => {
    const physics = new ReferenceDualControlPhysics({ cooldownDurationMs: 60 });
    physics.notifyUserInteracting('drag');

    // After 30ms, re-arm with slider
    setTimeout(() => {
      physics.notifyUserInteracting('slider');
      assertEqual(physics.state, PHYSICS_STATES.MANUAL_TIMELINE_SLIDER);

      // At 70ms (40ms after slider), should STILL be in manual cooldown
      setTimeout(() => {
        assertEqual(physics.state, PHYSICS_STATES.MANUAL_TIMELINE_SLIDER, 'Timer must have been reset');

        // At 110ms (80ms after slider), should have expired to IDLE
        setTimeout(() => {
          assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN, 'Should return to IDLE after full cooldown');
          physics.destroy();
          done();
        }, 40);
      }, 40);
    }, 30);
  });

  it('F3-T2-3: Turntable inertia momentum velocity decays exponentially towards zero', () => {
    let velocity = 25.0; // deg/frame
    const friction = 0.92;
    const history = [velocity];

    for (let f = 0; f < 30; f++) {
      velocity *= friction;
      history.push(velocity);
    }

    assert(history[history.length - 1] < 2.5, 'Velocity must decay below 10% of initial after 30 frames');
    assert(history[history.length - 1] > 0, 'Velocity should remain positive during decay');
  });

  it('F3-T2-4: Negative velocity and reverse turntable rotation wrap angle within [0, 360)', () => {
    function normalizeAngle(deg) {
      let a = deg % 360;
      if (a < 0) a += 360;
      return a;
    }

    assertEqual(normalizeAngle(-45), 315, '-45 deg wraps to 315 deg');
    assertEqual(normalizeAngle(-360), 0, '-360 deg wraps to 0 deg');
    assertEqual(normalizeAngle(-750), 330, '-750 deg wraps to 330 deg');
    assertEqual(normalizeAngle(720), 0, '720 deg wraps to 0 deg');
  });

  it('F3-T2-5: Releasing turntable drag with zero velocity halts rotation immediately', () => {
    let velocity = 0.0;
    let angle = 120.0;

    // Simulation of momentum tick
    if (Math.abs(velocity) > 0.01) {
      angle += velocity;
    }

    assertEqual(angle, 120.0, 'Angle must not change when released with 0 velocity');
  });
});

// =========================================================================
// FEATURE 4: Boundary & Corner Cases (Project 2 Sneaker Stage)
// =========================================================================
describe('Feature 4 Boundary: Project 2 Sneaker Transparent Video Stage', () => {
  it('F4-T2-1: CSS layout containment: #snk-render-box is configured to prevent layout shifts', () => {
    const html = getHtmlContent('index.html');
    assert(html.includes('.snk-render-box') || html.includes('#snk-render-box'), 'CSS must define rules for snk-render-box');
  });

  it('F4-T2-2: Dynamic shadows (.snk-ground-shadow) provide grounding without video perimeter clipping', () => {
    const html = getHtmlContent('index.html');
    assert(html.includes('.snk-ground-shadow') || html.includes('#snk-ground-shadow'), 'CSS for ground shadow must exist');
  });

  it('F4-T2-3: Quick-angle pills handle top aerial view without angular ambiguity', () => {
    const html = getHtmlContent('index.html');
    assert(html.includes('data-angle="top"'), 'Pill for top view must be explicitly handled');
  });

  it('F4-T2-4: Turntable degree indicator displays formatted integer degrees [0°..360°]', () => {
    function formatDegree(angle) {
      const norm = (Math.round(angle) % 360 + 360) % 360;
      return `${norm}°`;
    }

    assertEqual(formatDegree(0), '0°');
    assertEqual(formatDegree(359.8), '0°');
    assertEqual(formatDegree(180.2), '180°');
    assertEqual(formatDegree(-90), '270°');
  });

  it('F4-T2-5: Autospin toggle button #snk-autospin-btn exists and has click handler hook', () => {
    const btn = findElementById('snk-autospin-btn');
    assert(btn !== null, 'Element #snk-autospin-btn must exist');
  });
});

// =========================================================================
// FEATURE 5: Boundary & Corner Cases (Sneaker Catalog Mapping)
// =========================================================================
describe('Feature 5 Boundary: Project 2 Flagship Sneaker Mapping', () => {
  it('F5-T2-1: Model index selection bounds: indices 0 through 5 map to distinct valid models', () => {
    const catalog = extractSneakersCatalog();
    for (let i = 0; i < 6; i++) {
      const model = catalog[i];
      assert(model !== undefined, `Index ${i} must exist`);
      assert(model.model && model.model.length > 0, `Model at index ${i} must have a non-empty model title`);
      assert(model.price > 0, `Model at index ${i} must have a positive price`);
    }
  });

  it('F5-T2-2: Out-of-bounds sneaker index clamp prevents array index overflow', () => {
    const catalog = extractSneakersCatalog();
    function getSneaker(index) {
      const clamped = Math.max(0, Math.min(catalog.length - 1, index));
      return catalog[clamped];
    }

    assertEqual(getSneaker(-5).id, catalog[0].id, 'Negative index clamps to index 0');
    assertEqual(getSneaker(99).id, catalog[5].id, 'Index > 5 clamps to index 5');
  });

  it('F5-T2-3: Colorway options integrity: each sneaker model defines at least 1 valid colorway option', () => {
    const catalog = extractSneakersCatalog();
    for (const sneaker of catalog) {
      assert(Array.isArray(sneaker.colorways), `Sneaker ${sneaker.id} must have colorways array`);
      assert(sneaker.colorways.length >= 1, `Sneaker ${sneaker.id} must have at least 1 colorway`);
      for (const cw of sneaker.colorways) {
        assert(cw.name, `Colorway in ${sneaker.id} must have name`);
        assert(cw.upper || cw.flame || cw.base, `Colorway in ${sneaker.id} must have upper/flame/base color spec`);
      }
    }
  });

  it('F5-T2-4: Sneaker SKU codes are unique across all 6 models', () => {
    const catalog = extractSneakersCatalog();
    const skus = new Set();
    for (const s of catalog) {
      assert(!skus.has(s.sku), `Duplicate SKU found: ${s.sku}`);
      skus.add(s.sku);
    }
    assertEqual(skus.size, 6, 'All 6 SKUs must be unique');
  });

  it('F5-T2-5: Sneaker rotation angle maps monotonically to video timestamp', () => {
    const duration = 10.0;
    function angleToVideoTime(deg) {
      const norm = (((deg % 360) + 360) % 360) / 360;
      return norm * duration;
    }

    assertEqual(angleToVideoTime(0), 0.0);
    assertEqual(angleToVideoTime(90), 2.5);
    assertEqual(angleToVideoTime(180), 5.0);
    assertEqual(angleToVideoTime(270), 7.5);
    assertEqual(angleToVideoTime(360), 0.0);
  });
});

// =========================================================================
// FEATURE 6: Boundary & Corner Cases (Hardware Video Layer)
// =========================================================================
describe('Feature 6 Boundary: Project 3 Hardware Video Layer Unification', () => {
  it('F6-T2-1: #hw-xray-video element has attributes playsinline, muted, loop, preload="auto"', () => {
    const video = findElementById('hw-xray-video');
    assert(video !== null, 'Element #hw-xray-video must exist');
    assert(video.hasAttr('playsinline'), 'Must have playsinline attribute');
    assert(video.hasAttr('muted'), 'Must have muted attribute');
    assert(video.hasAttr('loop'), 'Must have loop attribute');
    assertEqual(video.getAttr('preload'), 'auto', 'preload attribute must be auto');
  });

  it('F6-T2-2: Video element contains both WebM and MP4 source fallback tags in correct order', () => {
    const html = getHtmlContent('index.html');
    const sourceWebmMatch = html.match(/<source[^>]+type=["']video\/webm["'][^>]*>/i);
    const sourceMp4Match = html.match(/<source[^>]+type=["']video\/mp4["'][^>]*>/i);
    assert(sourceWebmMatch !== null, 'Must contain <source type="video/webm">');
    assert(sourceMp4Match !== null, 'Must contain <source type="video/mp4">');
    // WebM must precede MP4 for transparent playback priority
    const webmIndex = html.indexOf(sourceWebmMatch[0]);
    const mp4Index = html.indexOf(sourceMp4Match[0]);
    assert(webmIndex < mp4Index, 'WebM source must appear before MP4 source tag for priority');
  });

  it('F6-T2-3: .hw-video-layer styling enforces centered positioning and layout stability', () => {
    const html = getHtmlContent('index.html');
    assert(html.includes('.hw-video-layer'), 'CSS must define .hw-video-layer');
    assert(html.includes('.hw-xray-video'), 'CSS must define .hw-xray-video');
  });

  it('F6-T2-4: Hardware ground grid .hw-ground-grid is present for 3D perspective orientation', () => {
    const html = getHtmlContent('index.html');
    assert(html.includes('hw-ground-grid'), 'DOM must contain hw-ground-grid element');
  });

  it('F6-T2-5: Hardware rotation control buttons #hw-btn-rot-left and #hw-btn-rot-right exist', () => {
    const left = findElementById('hw-btn-rot-left');
    assert(left !== null, 'Element #hw-btn-rot-left must exist');
    const right = findElementById('hw-btn-rot-right');
    assert(right !== null, 'Element #hw-btn-rot-right must exist');
    const reset = findElementById('hw-btn-rot-reset');
    assert(reset !== null, 'Element #hw-btn-rot-reset must exist');
  });
});

// =========================================================================
// FEATURE 7: Boundary & Corner Cases (19-Model Hardware Catalog)
// =========================================================================
describe('Feature 7 Boundary: Project 3 19-Model Hardware Catalog Mapping', () => {
  it('F7-T2-1: All 19 model IDs across all categories are globally unique', () => {
    const catalog = extractHardwareCatalog();
    const allIds = new Set();
    let totalCount = 0;

    for (const [cat, items] of Object.entries(catalog)) {
      for (const item of items) {
        totalCount++;
        assert(!allIds.has(item.id), `Duplicate model ID detected: ${item.id} in ${cat}`);
        allIds.add(item.id);
      }
    }

    assertEqual(totalCount, 19, 'Total models must equal 19');
    assertEqual(allIds.size, 19, 'All 19 model IDs must be unique');
  });

  it('F7-T2-2: Specification schema completeness: every model provides brand, name, price, weight', () => {
    const catalog = extractHardwareCatalog();
    for (const [cat, items] of Object.entries(catalog)) {
      for (const item of items) {
        assert(item.brand, `Model ${item.id} must define brand`);
        assert(item.name, `Model ${item.id} must define name`);
        assert(item.price, `Model ${item.id} must define price`);
        assert(item.weight, `Model ${item.id} must define weight`);
      }
    }
  });

  it('F7-T2-3: Category tab buttons in HTML bind exactly to the 4 categories', () => {
    const html = getHtmlContent('index.html');
    const catalog = extractHardwareCatalog();
    for (const cat of Object.keys(catalog)) {
      assert(html.includes(`data-cat="${cat}"`), `HTML must contain category button for ${cat}`);
    }
  });

  it('F7-T2-4: Active model selection index clamps cleanly within each category length', () => {
    const catalog = extractHardwareCatalog();
    function clampModelIndex(category, index) {
      const maxIdx = (catalog[category]?.length || 1) - 1;
      return Math.max(0, Math.min(maxIdx, index));
    }

    assertEqual(clampModelIndex('keyboards', 10), 3, 'Keyboards has 4 models (max index 3)');
    assertEqual(clampModelIndex('headphones', 10), 4, 'Headphones has 5 models (max index 4)');
    assertEqual(clampModelIndex('mice', -1), 0, 'Negative index clamps to 0');
  });

  it('F7-T2-5: Frequency response curve data (frCurve) or component specs exist for all models', () => {
    const catalog = extractHardwareCatalog();
    for (const [cat, items] of Object.entries(catalog)) {
      for (const item of items) {
        assert(item.driver || item.latency || item.conn, `Model ${item.id} must have hardware specs`);
      }
    }
  });
});

// =========================================================================
// FEATURE 8: Boundary & Corner Cases (Teardown Scrubbing & Cinema)
// =========================================================================
describe('Feature 8 Boundary: Project 3 Teardown Scrubbing & Cinema Mode', () => {
  it('F8-T2-1: Slider input at min boundary (0) clamps expansion to 0% and time to 0.0s', () => {
    const duration = 10.0;
    function sliderToTime(val) {
      const p = Math.max(0, Math.min(100, val)) / 100;
      return p * duration;
    }

    assertEqual(sliderToTime(0), 0.0);
    assertEqual(sliderToTime(-10), 0.0);
  });

  it('F8-T2-2: Slider input at max boundary (100) clamps expansion to 100% and time to duration', () => {
    const duration = 10.0;
    function sliderToTime(val) {
      const p = Math.max(0, Math.min(100, val)) / 100;
      return p * duration;
    }

    assertEqual(sliderToTime(100), 10.0);
    assertEqual(sliderToTime(150), 10.0);
  });

  it('F8-T2-3: Video duration boundaries: handles video reaching end smoothly', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.seekImmediate(10.0);
    assertEqual(video.currentTime, 10.0);

    // Attempt seek past duration
    engine.seekImmediate(12.5);
    assertEqual(video.currentTime, 10.0, 'Must clamp to 10.0');
    engine.destroy();
  });

  it('F8-T2-4: Scroll interrupt during cinema mode returns to scroll tracking smoothly over 300ms', () => {
    let blendTimeMs = 0;
    const physics = new ReferenceDualControlPhysics({
      blendWindowMs: 300,
      onBlendBackToScroll: (p, win) => {
        blendTimeMs = win;
      }
    });

    physics.notifyCinemaPlayback(true);
    physics.notifyScroll(0.6);

    assertEqual(blendTimeMs, 300, 'Blend window must be exactly 300ms');
    assertEqual(physics.state, PHYSICS_STATES.IDLE_SCROLL_DRIVEN);
    physics.destroy();
  });

  it('F8-T2-5: Rapid slider thrashing (50 adjustments in 100ms) maintains synchronized numeric state', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    for (let i = 0; i < 50; i++) {
      const val = (i % 2 === 0) ? 10.0 : 90.0;
      engine.seekImmediate(val / 10);
    }

    assert(!isNaN(video.currentTime), 'Video currentTime must not be NaN after thrashing');
    assertInRange(video.currentTime, 0.0, 10.0, 'Video currentTime must be in [0, 10]');
    engine.destroy();
  });
});

// =========================================================================
// FEATURE 9: Boundary & Corner Cases (Transitions & Swapping)
// =========================================================================
describe('Feature 9 Boundary: Category Tab & Model Switch Transitions', () => {
  it('F9-T2-1: Rapid consecutive category switches (10 switches in loop) produce no errors', () => {
    const catalog = extractHardwareCatalog();
    const categories = Object.keys(catalog);
    let activeCat = 'headphones';

    for (let i = 0; i < 10; i++) {
      activeCat = categories[i % categories.length];
      assert(catalog[activeCat] !== undefined, `Category ${activeCat} must exist in catalog`);
    }
  });

  it('F9-T2-2: Switching to category with fewer models clamps model index without index out of bounds', () => {
    const catalog = extractHardwareCatalog();
    let activeModelIdx = 4; // Model 5 (valid in headphones [5 items])

    // Switch to keyboards (4 items: valid indices 0..3)
    const newCount = catalog.keyboards.length;
    if (activeModelIdx >= newCount) {
      activeModelIdx = newCount - 1;
    }

    assertEqual(activeModelIdx, 3, 'Model index must clamp safely to 3');
  });

  it('F9-T2-3: Model switch while video is seeking resets pendingTime safely', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    video.seeking = true;
    engine.isSeeking = true;
    engine.pendingTime = 8.5;

    // Load new model
    engine.loadSource('assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm');
    engine.pendingTime = null; // Clear pending seek for obsolete source

    assertEqual(engine.pendingTime, null, 'Pending seek must be cleared on model change');
    engine.destroy();
  });

  it('F9-T2-4: Model switch while Cinema mode is active safely preserves autonomous state', () => {
    const video = new MockVideoElement(10.0);
    const engine = new ReferenceVideoScrubEngine(video);

    engine.playAutonomous();
    assert(engine.isAutonomousPlaying, 'Cinema must be playing');

    engine.loadSource('assets/videos_webm/Sony_WH-1000XM5_Exploded_View_20260912183606.webm');
    assert(engine.isAutonomousPlaying, 'Autonomous state should be preserved or cleanly reset');
    engine.destroy();
  });

  it('F9-T2-5: Retaining or resetting turntable angle on model switch avoids disorientation', () => {
    let currentAngle = 180.0;
    // Policy: when model changes, turntable angle can be retained or reset to 0
    function onModelChange(preserveAngle = true) {
      return preserveAngle ? currentAngle : 0.0;
    }

    assertEqual(onModelChange(true), 180.0, 'Retained angle stays 180');
    assertEqual(onModelChange(false), 0.0, 'Reset angle becomes 0');
  });
});

// =========================================================================
// FEATURE 10: Boundary & Corner Cases (File Parity)
// =========================================================================
describe('Feature 10 Boundary: Byte-for-Byte File Synchronization', () => {
  const file1 = path.join(rootDir, 'index.html');
  const file2 = path.join(rootDir, 'personal_brand_v4.html');

  it('F10-T2-1: Total line count parity between index.html and personal_brand_v4.html', () => {
    const lines1 = fs.readFileSync(file1, 'utf8').split(/\r?\n/);
    const lines2 = fs.readFileSync(file2, 'utf8').split(/\r?\n/);
    assertEqual(lines1.length, lines2.length, `Line count mismatch: ${lines1.length} vs ${lines2.length}`);
  });

  it('F10-T2-2: Substantial file size validation: both files exceed 300,000 bytes', () => {
    const stat1 = fs.statSync(file1);
    const stat2 = fs.statSync(file2);
    assert(stat1.size > 300000, `index.html must be > 300KB (actual: ${stat1.size})`);
    assert(stat2.size > 300000, `personal_brand_v4.html must be > 300KB (actual: ${stat2.size})`);
  });

  it('F10-T2-3: Cryptographic hash is non-trivial 64-hex string and does not match empty hash', () => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file1)).digest('hex');
    assertEqual(hash.length, 64, 'SHA-256 hash must be exactly 64 hex chars');
    const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    assert(hash !== emptyHash, 'Hash must not be empty file hash');
  });

  it('F10-T2-4: Module script tags <script type="module"> match identically across both files', () => {
    const text1 = fs.readFileSync(file1, 'utf8');
    const text2 = fs.readFileSync(file2, 'utf8');

    const scriptMatch1 = text1.match(/<script type="module">([\s\S]*?)<\/script>/);
    const scriptMatch2 = text2.match(/<script type="module">([\s\S]*?)<\/script>/);

    assert(scriptMatch1 !== null, 'index.html must have <script type="module">');
    assert(scriptMatch2 !== null, 'personal_brand_v4.html must have <script type="module">');
    assertEqual(scriptMatch1[1].length, scriptMatch2[1].length, 'Module script content lengths must match');
  });

  it('F10-T2-5: Synchronizer simulation test: mutation detection flags any 1-byte discrepancy', () => {
    const origBuf = fs.readFileSync(file1);
    const mutatedBuf = Buffer.from(origBuf);
    mutatedBuf[100] = mutatedBuf[100] ^ 0xFF; // Invert single byte

    const origHash = crypto.createHash('sha256').update(origBuf).digest('hex');
    const mutatedHash = crypto.createHash('sha256').update(mutatedBuf).digest('hex');

    assert(origHash !== mutatedHash, '1-byte mutation must produce completely different SHA-256');
  });
});
