const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const srcFile = path.join(rootDir, 'personal_brand_v4.html');
const dstFile = path.join(rootDir, 'index.html');

let html = fs.readFileSync(srcFile, 'utf8');
const isCrlf = html.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

function replaceExact(content, target, replacement) {
  const normContent = content.replace(/\r\n/g, '\n');
  const normTarget = target.replace(/\r\n/g, '\n');
  const normRepl = replacement.replace(/\r\n/g, '\n');

  if (!normContent.includes(normTarget)) {
    throw new Error(`Target snippet not found:\n${target.slice(0, 100)}...`);
  }
  const result = normContent.replace(normTarget, normRepl);
  return isCrlf ? result.replace(/\n/g, '\r\n') : result;
}

console.log('--- Step 1: CSS Updates ---');
const targetCss = `    .snk-light-spot {
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(223, 183, 108, 0.12) 0%, rgba(223, 183, 108, 0.02) 45%, transparent 70%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: left 0.1s ease-out, top 0.1s ease-out;
      z-index: 1;
    }`;

const replacementCss = `    /* Feature 2: Dynamic Specular Studio Lighting Flare */
    .snk-light-spot,
    .hw-light-spot {
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle at center, rgba(255, 248, 230, 0.22) 0%, rgba(223, 183, 108, 0.12) 28%, rgba(223, 183, 108, 0.02) 58%, transparent 72%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 4;
    }
    .snk-tilt-card:hover .snk-light-spot,
    .hw-viewport:hover .hw-light-spot {
      opacity: 1;
    }

    /* Feature 4: Atmospheric Environment Micro-Particles Canvases */
    .portal-petals-canvas,
    .snk-particles-canvas,
    .hw-particles-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 6;
    }

    /* Feature 3: Kinetic Typography Odometer & Digit Roll */
    .odometer-rolling {
      display: inline-block;
      font-variant-numeric: tabular-nums;
      transition: transform 0.15s ease, text-shadow 0.25s ease;
      text-shadow: 0 0 14px rgba(223, 183, 108, 0.65), 0 0 25px rgba(223, 183, 108, 0.35);
      color: #fff6de !important;
    }
    .snk-price-val, .hw-card-price, #hw-tele-price, #snk-degree-val, #hw-hud-angle, #hw-spec-weight, #hw-xray-slider-val {
      font-variant-numeric: tabular-nums;
    }

    /* Feature 1: Multi-Depth 3D Exploded X-Ray Parallax */
    .hw-rig {
      perspective: 1200px;
      transform-style: preserve-3d;
    }
    .hw-rotator {
      transform-style: preserve-3d;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1);
    }
    .hw-main-img,
    .hw-teardown-img {
      transform-style: preserve-3d;
      backface-visibility: hidden;
      will-change: transform, opacity;
    }
    .hw-xray-assembly {
      transform-style: preserve-3d;
    }
    .hw-callout {
      transform-style: preserve-3d;
      will-change: transform;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.35s ease;
    }
    .hw-cat-btn, .hw-rakurs-btn, .hw-profile-btn, .snk-model-tab, .snk-angle-pill, .snk-size-pill, .hw-hud-btn, .hw-video-toggle-btn, .snk-autospin-btn {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }`;

html = replaceExact(html, targetCss, replacementCss);
console.log('✓ CSS updated');

console.log('--- Step 2: HTML Markup Updates ---');
// Project 1 Portal Petals Canvas
const targetPortalCanvas = `<canvas id="portal-world-canvas" class="portal-world-canvas"></canvas>`;
const replacementPortalCanvas = `<canvas id="portal-world-canvas" class="portal-world-canvas"></canvas>
                <!-- Atmospheric Sakura Petals & Stardust Canvas (Feature 4) -->
                <canvas id="portal-petals-canvas" class="portal-petals-canvas"></canvas>`;
html = replaceExact(html, targetPortalCanvas, replacementPortalCanvas);

// Project 2 Sneaker HUD
const targetSneakerHud = `<div class="snk-turntable-hud">
                      <span id="snk-degree-val" style="font-size:8px;letter-spacing:0.16em;color:var(--gold);background:rgba(0,0,0,0.6);padding:4px 10px;border-radius:12px;border:1px solid rgba(223,183,108,0.3);font-weight:600;">0° // PROFILE</span>
                    </div>`;

const replacementSneakerHud = `<div class="snk-turntable-hud">
                      <div class="snk-degree-dial" id="snk-degree-dial">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 6 16 14 8 14 12 6"/></svg>
                        <span id="snk-degree-val">0° // PROFILE</span>
                      </div>
                      <button class="snk-autospin-btn" id="snk-autospin-btn" title="Toggle 360 Auto-Rotation">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span id="snk-autospin-text">SPIN 360°</span>
                      </button>
                    </div>`;
html = replaceExact(html, targetSneakerHud, replacementSneakerHud);

// Project 2 Sneaker Card Canvas
const targetSnkCard = `<div class="snk-tilt-card" id="snk-tilt-card">
                    <div class="snk-light-spot" id="snk-light-spot"></div>
                    <div class="snk-render-box" id="snk-render-box">
                      <img src="assets/sneakers/studio/palm-angels_profile.jpg" data-src="assets/sneakers/studio/palm-angels_profile.jpg" alt="PALM ANGELS Flame Low" class="snk-photo-render" draggable="false" />
                    </div>
                    <div class="snk-ground-shadow" id="snk-ground-shadow"></div>
                    <div class="snk-ground-reflection" id="snk-ground-reflection"></div>
                  </div>`;

const replacementSnkCard = `<div class="snk-tilt-card" id="snk-tilt-card">
                    <div class="snk-light-spot" id="snk-light-spot"></div>
                    <canvas class="snk-particles-canvas" id="snk-particles-canvas"></canvas>
                    <div class="snk-render-box" id="snk-render-box">
                      <img src="assets/sneakers/studio/palm-angels_profile.jpg" data-src="assets/sneakers/studio/palm-angels_profile.jpg" alt="PALM ANGELS Flame Low" class="snk-photo-render" draggable="false" />
                    </div>
                    <div class="snk-ground-shadow" id="snk-ground-shadow"></div>
                    <div class="snk-ground-reflection" id="snk-ground-reflection"></div>
                  </div>`;
html = replaceExact(html, targetSnkCard, replacementSnkCard);

// Project 2 Sneaker Angle Pills
const targetSnkPills = `<div class="snk-angle-pills" id="snk-angle-pills">
                    <button class="snk-angle-pill active" data-angle="0">0° PROFILE</button>
                    <button class="snk-angle-pill" data-angle="45">45° 3/4 FRONT</button>
                    <button class="snk-angle-pill" data-angle="270">270° HEEL</button>
                    <button class="snk-angle-pill" data-angle="top">AERIAL LACE</button>
                  </div>`;

const replacementSnkPills = `<div class="snk-angle-pills" id="snk-angle-pills">
                    <button class="snk-angle-pill active" data-angle="0">0° PROFILE</button>
                    <button class="snk-angle-pill" data-angle="45">45° 3/4 FRONT</button>
                    <button class="snk-angle-pill" data-angle="90">90° MEDIAL</button>
                    <button class="snk-angle-pill" data-angle="180">180° REAR</button>
                    <button class="snk-angle-pill ref-highlight" data-angle="270" title="Reference Luxury Archive Heel">★ 270° HEEL</button>
                    <button class="snk-angle-pill" data-angle="top">AERIAL LACE</button>
                  </div>`;
html = replaceExact(html, targetSnkPills, replacementSnkPills);

// Project 3 Hardware Stage Pane
const targetHwStage = `                <main class="hw-stage-pane" id="hw-stage">
                  <!-- Top Stage HUD Indicators -->
                  <div class="hw-stage-hud">
                    <div class="hw-hud-tag" id="hw-hud-angle">STUDIO // 3/4 HERO PERSPECTIVE</div>
                    
                    <!-- Multi-Angle Studio Rakurs Pills -->
                    <div class="hw-rakurs-pills" id="hw-rakurs-pills" style="display:flex;gap:6px;align-items:center;z-index:25;">
                      <button class="hw-rakurs-btn active" data-rakurs="hero" style="background:rgba(223,183,108,0.22);border:1px solid rgba(223,183,108,0.5);color:#fff3d1;padding:4px 12px;font-size:7.5px;letter-spacing:0.14em;cursor:pointer;border-radius:12px;transition:all 0.25s;font-weight:700;">3/4 HERO</button>
                      <button class="hw-rakurs-btn" data-rakurs="profile" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);color:#888;padding:4px 12px;font-size:7.5px;letter-spacing:0.14em;cursor:pointer;border-radius:12px;transition:all 0.25s;font-weight:600;">PROFILE</button>
                      <button class="hw-rakurs-btn" data-rakurs="teardown" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);color:#888;padding:4px 12px;font-size:7.5px;letter-spacing:0.14em;cursor:pointer;border-radius:12px;transition:all 0.25s;font-weight:600;">EXPLODED TEARDOWN</button>
                    </div>
                  </div>

                  <!-- 3D Turntable Viewport (Drag with inertia) -->
                  <div class="hw-viewport" id="hw-viewport">
                    <!-- Ground grid & dynamic contact shadow -->
                    <div class="hw-ground-grid"></div>
                    <div class="hw-contact-shadow" id="hw-contact-shadow"></div>

                    <!-- 3D Product Studio Stage Rig -->
                    <div class="hw-rig" id="hw-rig" style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                      <div class="hw-rotator" id="hw-rotator" style="position:relative;width:86%;height:86%;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;">
                        <!-- Primary Studio Image (Hero / Profile) -->
                        <img id="hw-main-img" class="hw-main-img" src="assets/hardware/studio/apple-airpods-max_hero.jpg" alt="Hardware Flagship" draggable="false" style="max-width:92%;max-height:88%;object-fit:contain;transition:opacity 0.35s ease, transform 0.35s ease;filter:drop-shadow(0 20px 35px rgba(0,0,0,0.85));">
                        <!-- Exploded Teardown Studio Image (Overlay with Cross-Fade) -->
                        <img id="hw-teardown-img" class="hw-teardown-img" src="assets/hardware/studio/apple-airpods-max_teardown.jpg" alt="Hardware Teardown" draggable="false" style="position:absolute;inset:0;margin:auto;max-width:92%;max-height:88%;object-fit:contain;opacity:0;pointer-events:none;transition:opacity 0.35s ease, transform 0.35s ease;filter:drop-shadow(0 20px 40px rgba(223,183,108,0.18));">
                      </div>

                      <!-- Interactive Technical Callouts Overlay (revealed in Teardown mode) -->
                      <div class="hw-xray-assembly" id="hw-xray-assembly" style="position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 0.4s ease;">
                        <div class="hw-callout callout-left" style="top: 22%; left: 5%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>HOUSING MATRIX</strong>
                            <span id="callout-chassis-spec">Aviation-Grade Anodized Alloy</span>
                          </div>
                        </div>
                        <div class="hw-callout callout-right" style="top: 38%; right: 5%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>ACOUSTIC / MOTOR CORE</strong>
                            <span id="callout-driver-spec">Custom Dynamic Transducer</span>
                          </div>
                        </div>
                        <div class="hw-callout callout-left" style="top: 64%; left: 7%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>LOGIC &amp; DSP ARCHITECTURE</strong>
                            <span id="callout-pcb-spec">Low-Latency Neural Compute SIP</span>
                          </div>
                        </div>
                        <div class="hw-callout callout-right" style="top: 76%; right: 7%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>DAMPING / BASE INTERFACE</strong>
                            <span id="callout-base-spec">Acoustically Calibrated Mesh</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- X-Ray Separation Slider Bar -->
                  <div class="hw-xray-slider-bar" id="hw-xray-slider-bar">
                    <span class="hw-slider-lbl">EXPLODED TEARDOWN DEPTH</span>
                    <input type="range" id="hw-xray-slider" min="0" max="100" value="0" step="0.5" />
                    <span class="hw-slider-val" id="hw-xray-slider-val">0%</span>
                  </div>`;

const replacementHwStage = `                <main class="hw-stage-pane" id="hw-stage">
                  <!-- Top Stage HUD Indicators -->
                  <div class="hw-stage-hud">
                    <div class="hw-hud-tag" id="hw-hud-angle">STUDIO // 3/4 HERO PERSPECTIVE</div>
                    
                    <div class="hw-hud-scroll-badge" id="hw-scroll-badge" title="Scroll Page to Scrub 3D Teardown & Rotate Turntable">
                      <span class="scroll-dot"></span>
                      <span id="hw-scroll-badge-text">SCROLL-LINKED: READY</span>
                    </div>

                    <div class="hw-hud-controls">
                      <button class="hw-hud-btn" id="hw-btn-rot-left" title="Rotate Counter-Clockwise">↺ -15°</button>
                      <button class="hw-hud-btn" id="hw-btn-rot-reset" title="Reset Alignment">ALIGN</button>
                      <button class="hw-hud-btn" id="hw-btn-rot-right" title="Rotate Clockwise">↻ +15°</button>
                    </div>

                    <!-- Multi-Angle Studio Rakurs Pills -->
                    <div class="hw-rakurs-pills" id="hw-rakurs-pills" style="display:flex;gap:6px;align-items:center;z-index:25;">
                      <button class="hw-rakurs-btn active" data-rakurs="hero" style="background:rgba(223,183,108,0.22);border:1px solid rgba(223,183,108,0.5);color:#fff3d1;padding:4px 12px;font-size:7.5px;letter-spacing:0.14em;cursor:pointer;border-radius:12px;transition:all 0.25s;font-weight:700;">3/4 HERO</button>
                      <button class="hw-rakurs-btn" data-rakurs="profile" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);color:#888;padding:4px 12px;font-size:7.5px;letter-spacing:0.14em;cursor:pointer;border-radius:12px;transition:all 0.25s;font-weight:600;">PROFILE</button>
                      <button class="hw-rakurs-btn" data-rakurs="teardown" style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);color:#888;padding:4px 12px;font-size:7.5px;letter-spacing:0.14em;cursor:pointer;border-radius:12px;transition:all 0.25s;font-weight:600;">EXPLODED TEARDOWN</button>
                    </div>
                  </div>

                  <!-- 3D Turntable Viewport (Drag with inertia) -->
                  <div class="hw-viewport" id="hw-viewport">
                    <!-- Ground grid & dynamic contact shadow -->
                    <div class="hw-ground-grid"></div>
                    <div class="hw-contact-shadow" id="hw-contact-shadow"></div>

                    <!-- Dynamic Specular Studio Lighting Flare (Feature 2) -->
                    <div class="hw-light-spot" id="hw-light-spot"></div>

                    <!-- Atmospheric Environment Micro-Particles Canvas (Feature 4) -->
                    <canvas class="hw-particles-canvas" id="hw-particles-canvas"></canvas>

                    <!-- AI High-Definition Transparent WebM Video Teardown Layer -->
                    <div class="hw-video-layer" id="hw-video-layer" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.35s ease;z-index:3;">
                      <video id="hw-xray-video" class="hw-xray-video" playsinline muted loop preload="auto" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9' viewBox='0 0 16 9'%3E%3C/svg%3E" style="max-width:92%;max-height:88%;object-fit:contain;">
                        <source src="assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm" type="video/webm">
                        <source src="assets/videos/Apple_AirPods_Max_Exploded_View_20260912183607.mp4" type="video/mp4">
                      </video>
                      <div class="hw-video-play-badge" id="hw-video-badge" style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:none;">
                        <span class="pulse-dot"></span>
                        <span class="badge-text" id="hw-video-badge-text">AI 3D EXPLODED CINEMA (WEBM ALPHA)</span>
                      </div>
                    </div>

                    <!-- 3D Product Studio Stage Rig (Feature 1 Multi-Depth 3D Exploded Parallax) -->
                    <div class="hw-rig" id="hw-rig" style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                      <div class="hw-rotator" id="hw-rotator" style="position:relative;width:86%;height:86%;display:flex;align-items:center;justify-content:center;transform-style:preserve-3d;">
                        <!-- Primary Studio Image (Hero / Profile) -->
                        <img id="hw-main-img" class="hw-main-img" src="assets/hardware/studio/apple-airpods-max_hero.jpg" alt="Hardware Flagship" draggable="false" style="max-width:92%;max-height:88%;object-fit:contain;transition:opacity 0.35s ease, transform 0.15s cubic-bezier(0.2,0,0.2,1);filter:drop-shadow(0 20px 35px rgba(0,0,0,0.85));">
                        <!-- Exploded Teardown Studio Image (Overlay with Cross-Fade) -->
                        <img id="hw-teardown-img" class="hw-teardown-img" src="assets/hardware/studio/apple-airpods-max_teardown.jpg" alt="Hardware Teardown" draggable="false" style="position:absolute;inset:0;margin:auto;max-width:92%;max-height:88%;object-fit:contain;opacity:0;pointer-events:none;transition:opacity 0.35s ease, transform 0.15s cubic-bezier(0.2,0,0.2,1);filter:drop-shadow(0 20px 40px rgba(223,183,108,0.18));">

                        <!-- Multi-Depth 3D Exploded X-Ray Parallax Planes (Feature 1) -->
                        <div class="hw-depth-layer hw-layer-chassis" id="hw-layer-chassis" style="position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d;"></div>
                        <div class="hw-depth-layer hw-layer-driver" id="hw-layer-driver" style="position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d;"></div>
                        <div class="hw-depth-layer hw-layer-magnets" id="hw-layer-magnets" style="position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d;"></div>
                        <div class="hw-depth-layer hw-layer-pcb" id="hw-layer-pcb" style="position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d;"></div>
                      </div>

                      <!-- Interactive Technical Callouts Overlay (revealed in Teardown mode) -->
                      <div class="hw-xray-assembly" id="hw-xray-assembly" style="position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 0.4s ease;transform-style:preserve-3d;">
                        <div class="hw-callout callout-left" id="hw-callout-1" style="top: 22%; left: 5%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>HOUSING MATRIX</strong>
                            <span id="callout-chassis-spec">Aviation-Grade Anodized Alloy</span>
                          </div>
                        </div>
                        <div class="hw-callout callout-right" id="hw-callout-2" style="top: 38%; right: 5%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>ACOUSTIC / MOTOR CORE</strong>
                            <span id="callout-driver-spec">Custom Dynamic Transducer</span>
                          </div>
                        </div>
                        <div class="hw-callout callout-left" id="hw-callout-3" style="top: 64%; left: 7%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>LOGIC &amp; DSP ARCHITECTURE</strong>
                            <span id="callout-pcb-spec">Low-Latency Neural Compute SIP</span>
                          </div>
                        </div>
                        <div class="hw-callout callout-right" id="hw-callout-4" style="top: 76%; right: 7%;">
                          <span class="callout-dot"></span>
                          <span class="callout-line"></span>
                          <div class="callout-card">
                            <strong>DAMPING / BASE INTERFACE</strong>
                            <span id="callout-base-spec">Acoustically Calibrated Mesh</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- X-Ray Separation Slider Bar -->
                  <div class="hw-xray-slider-bar" id="hw-xray-slider-bar">
                    <span class="hw-slider-lbl">EXPLODED TEARDOWN DEPTH</span>
                    <button class="hw-video-toggle-btn" id="hw-btn-video-play" title="Play Full Cinematic Teardown Video">▶ PLAY CINEMA</button>
                    <input type="range" id="hw-xray-slider" min="0" max="100" value="0" step="0.5" />
                    <span class="hw-slider-val" id="hw-xray-slider-val">0%</span>
                  </div>`;
html = replaceExact(html, targetHwStage, replacementHwStage);
console.log('✓ HTML markup updated');

// Save intermediate progress
fs.writeFileSync(srcFile, html);
console.log('Intermediate changes saved.');
