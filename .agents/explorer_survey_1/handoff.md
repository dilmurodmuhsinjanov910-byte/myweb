# Explorer Survey 1 Handoff Report

## 1. Observation

### 1.1 Root HTML Files & Identity Verification
- **Target Files**: `d:\my web\index.html` and `d:\my web\personal_brand_v4.html`.
- **Search Verification**: Using `find_by_name`, only these two HTML files exist anywhere in the repository.
- **Byte Size**: Both files measure exactly **415,787 bytes** and **10,163 lines** (10,162 non-empty lines).
- **Cryptographic Hash**:
  ```powershell
  Get-FileHash index.html, personal_brand_v4.html
  # Algorithm: SHA256
  # Hash: 82D6D5D5ABFEEF5A750DEBECAD59031D2CCBDA7456AA2FE4A3CC00B16A400FE0 (both)
  ```
- **Diff Check**: `Compare-Object` between `index.html` and `personal_brand_v4.html` returned **0 differences**. They are 100% byte-for-byte clones.

### 1.2 Git Branch & Working Tree Status
- **Active Branch**: `feature/scroll-driven-transparent-videos`.
- **Working Tree**: Clean. Untracked files present: `.agents/` and `ORIGINAL_REQUEST.md`.
- **Remote Branches**: `origin/main`, `origin/develop`, `origin/feature/scroll-driven-transparent-videos`, `origin/feature/scroll-video-webm-alpha`, `origin/feature/luxury-sneaker-photorealism`, `origin/feature/cyber-studio-showcase`.

### 1.3 High-Level File Layout of `index.html`
- **Lines 15–3321**: Inline CSS stylesheets.
  - Lines 630–1823: Project 02 (SSENSE Atelier) CSS rules (`.sneaker-app-container`, `.snk-*`).
  - Lines 1850–3320: Project 03 (Cyber Studio Hardware) CSS rules (`.hardware-app-container`, `.hw-*`).
- **Lines 3322–4363**: HTML `<body>` markup.
  - Lines 3355–3453: `#hero`, `#statement`, `#about`, `#journey`.
  - Lines 3454–4289: `#work` container enclosing the 3 flagship projects:
    - Lines 3460–3635: `<article class="project" id="project-01">` (Teleport Portal).
    - Lines 3637–3960: `<article class="project" id="project-02">` (SSENSE Atelier Luxury Footwear).
    - Lines 3962–4287: `<article class="project" id="project-03">` (Cyber Studio Luxury Hardware).
  - Lines 4290–4363: `#stats`, `#closing`, `#contact`.
- **Lines 4364–4366**: External script imports: GSAP v3.13.0, ScrollTrigger v3.13.0, Lenis v1.3.26.
- **Lines 4368–10160**: `<script type="module">` containing application engines:
  - Lines 4369–4460: Three.js 3D Earth Globe setup (`#orb-canvas`).
  - Lines 4940–5164: GSAP ScrollTrigger timeline orchestrations for sections.
  - Lines 5165–5220: Global scroll, progress bar, navigation hide/reveal.
  - Lines 5221–7264: Project 01 (Teleport Protocol) engine.
  - Lines 7265–8802: Project 02 (SSENSE Atelier Luxury Footwear) engine.
  - Lines 8803–10150: Project 03 (Cyber Studio Luxury Hardware) engine.

### 1.4 Project 02 (Luxury Sneakers Atelier) Implementation
- **DOM Container**: `<div class="project-app-container sneaker-app-container" id="sneaker-app">` (line 3642).
- **Model Tabs Strip**: `<div class="snk-models-bar" id="snk-models-bar">` containing 6 `.snk-model-tab` buttons (lines 3683–3714).
- **Turntable / Viewer Elements**:
  - Viewer container: `#snk-viewer-area` (line 3720).
  - Stage tilt card: `<div class="snk-tilt-card" id="snk-tilt-card">` (line 3739).
  - Render target container: `<div class="snk-render-box" id="snk-render-box"></div>` (line 3741).
  - Lighting & shadow: `#snk-light-spot`, `#snk-ground-shadow`, `#snk-ground-reflection` (lines 3740, 3742–3743).
  - Angle quick-select: `#snk-angle-pills` with `.snk-angle-pill` (`data-angle="0"`, `45`, `90`, `135`, `180`, `270`, `315`, `"top"`) (lines 3747–3756).
  - Turntable HUD: `#snk-degree-dial`, `#snk-degree-val` (line 3728), `#snk-autospin-btn` (line 3731).
- **Visual Medium & Rendering**:
  - **Current Implementation**: Operates on static 2D transparent PNG cutouts in `assets/sneakers/` (`balenciaga_profile.png`, `balenciaga_front3q.png`, `balenciaga_heel.png`, `balenciaga_toe.png`, `balenciaga_top.png`, etc.).
  - Lines 8162–8231: `getSneakerPhotoData()` computes which PNG file to load and whether to apply `transform: scaleX(-1)` based on the angle deg (0..360°).
  - Does **NOT** yet contain a `<video>` element for real-time video rotation.
- **Model Catalog Data Structure**:
  - `const SNEAKERS = [...]` (lines 7271–7927) contains 6 models:
    1. `palm-angels`: Palm Angels Flame Low Suede & Leather ($395)
    2. `balenciaga`: Balenciaga Runner X Distressed Trainer ($1,150)
    3. `margiela`: Maison Margiela Replica GAT ($570)
    4. `rick-owens`: Rick Owens Geobasket Low Leather ($990)
    5. `off-white`: Off-White Out Of Office Sneaker ($635)
    6. `bottega`: Bottega Veneta Orbit Runner Mesh ($890)
  - Each item defines `id`, `brand`, `model`, `price`, `sku`, `desc`, `details`, `craftsmanship`, `shipping`, `reviews`, and `colorways` (array of palette options).
- **Interactive State & Turntable Logic**:
  - Scoped variables: `activeSneakerIdx`, `activeColorwayIdx`, `currentAngle`, `isAerialView`, `isAutoSpinning`, `autoSpinTimer`, `isZoomed`, `isDragging`, `dragStartX`, `dragVelocity`, `inertiaAnimationId` (lines 7929–7950).
  - Pointer dragging on `#snk-tilt-card` captures horizontal mouse/touch movements and calculates angular velocity.
- **Scroll Handling**:
  - Lines 8461–8477: `handleSneakerScrollLink()` attached to `window` and `lenis.on("scroll")`.
  - Guard: `if (isDragging || isAutoSpinning || isHoveringCard) return;`.
  - Logic: Calculates viewport progress `progress = (winH - rect.top) / (winH + rect.height)`. Updates angle `targetAngle = (progress - 0.5) * 360 * 1.8; currentAngle += (targetAngle - currentAngle) * 0.08; updateSneakerView();`.

### 1.5 Project 03 (Cyber Studio Hardware) Implementation
- **DOM Container**: `<div class="project-app-container hardware-app-container" id="hardware-app">` (line 3967).
- **Category Dock**:
  - `<nav class="hw-cat-dock" role="tablist">` (line 3978).
  - 4 Category Buttons:
    1. `.hw-cat-btn[data-cat="headphones"]`: Spatial Headphones (line 3979)
    2. `.hw-cat-btn[data-cat="mice"]`: Precision Mice (line 3984)
    3. `.hw-cat-btn[data-cat="speakers"]`: Hi-Fi Speakers (line 3989)
    4. `.hw-cat-btn[data-cat="keyboards"]`: Keyboards (line 3994)
- **Mode Toggle**: `#hw-mode-studio` ("360° TURNTABLE") and `#hw-mode-xray` ("X-RAY TEARDOWN") (line 4004).
- **Roster & Count**: `#hw-model-count` and `#hw-roster-list` (lines 4016, 4018), populated dynamically via `populateRoster()`.
- **Stage Pane & Viewport**:
  - Stage pane: `<main class="hw-stage-pane" id="hw-stage">` (line 4024).
  - HUD Indicators: `#hw-hud-angle`, `#hw-scroll-badge` ("SCROLL-LINKED: READY"), `#hw-btn-rot-left`, `#hw-btn-rot-reset`, `#hw-btn-rot-right`, `#hw-btn-autorotate` (lines 4027–4036).
  - Viewport: `<div class="hw-viewport" id="hw-viewport">` with `.hw-ground-grid` and `#hw-contact-shadow` (lines 4041–4044).
  - **Video Layer**:
    ```html
    <!-- Lines 4047-4056 -->
    <div class="hw-video-layer" id="hw-video-layer">
      <video id="hw-xray-video" class="hw-xray-video" playsinline muted loop preload="auto" poster="...">
        <source src="assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm" type="video/webm">
        <source src="assets/videos/Apple_AirPods_Max_Exploded_View_20260912183607.mp4" type="video/mp4">
      </video>
      <div class="hw-video-play-badge" id="hw-video-badge">
        <span class="pulse-dot"></span>
        <span class="badge-text" id="hw-video-badge-text">AI 3D EXPLODED CINEMA (WEBM ALPHA)</span>
      </div>
    </div>
    ```
  - **3D Rig & Layers**:
    - Assembled Studio View Layer: `<div class="hw-layer hw-layer-assembled" id="hw-layer-assembled"><img id="hw-main-img" src="..."></div>` (lines 4060–4063).
    - X-Ray CSS Layer Assembly: `<div class="hw-xray-assembly" id="hw-xray-assembly">` with `#xray-chassis`, `#xray-driver`, `#xray-circuit`, `#xray-base` (lines 4066–4127).
- **Controls & Cinema Play**:
  - Teardown Slider Bar: `<div class="hw-xray-slider-bar" id="hw-xray-slider-bar">` (line 4132).
  - Play Cinema Button: `<button class="hw-video-toggle-btn" id="hw-btn-video-play">▶ PLAY CINEMA</button>` (line 4134).
  - Slider: `<input type="range" id="hw-xray-slider" min="0" max="100" value="50" step="0.5" />` (line 4135).
  - Value: `<span class="hw-slider-val" id="hw-xray-slider-val">50%</span>` (line 4136).
- **Model Catalog Data Structure (19 Models)**:
  - Defined in `const HARDWARE_CATALOG = { headphones: [...], mice: [...], speakers: [...], keyboards: [...] }` (lines 8810–9256):
    - **Headphones (5)**: `apple-airpods-max`, `sony-wh1000xm5`, `bose-qc-ultra`, `sennheiser-hd660s2`, `bo-h95`.
    - **Precision Mice (5)**: `logitech-gpro-x` (Superlight 2), `razer-deathadder-v3`, `apple-magic-mouse-2`, `zowie-ec2-cw`, `logitech-mx-master-3s`.
    - **Hi-Fi Speakers (5)**: `sonos-era-300`, `marshall-stanmore-3`, `jbl-flip-6`, `bose-revolve-2` (SoundLink Revolve+ II), `devialet-phantom-i`.
    - **Mechanical Keyboards (4)**: `keychron-q1-pro`, `logitech-g915-tkl`, `apple-magic-keyboard`, `razer-huntsman-v3`.
    - **Total count**: 5 + 5 + 5 + 4 = 19 models.
  - Every model dictionary specifies: `id`, `name`, `brand`, `brandTag`, `price`, `weight`, `freq`, `driver`, `latency`, `conn`, `battery`, `image`, `video` (points to `assets/videos_webm/*.webm`), `videoMp4` (`assets/videos/*.mp4`), `thumb` (`assets/video_thumbs_webm/*.png`), `thumbJpg`, component specs, and `frCurve`.
- **Video Transparency & Format Verification**:
  - Probed using `ffprobe` and `ffmpeg`:
    - All 42 `.webm` files in `assets/videos_webm/` have codec VP9 with `ALPHA_MODE: 1`.
    - Decoding via `libvpx-vp9` yields pixel format `yuva420p` with genuine zero-alpha background pixels (e.g. RGB=(4,22,46), Alpha=0).
    - All 43 `.mp4` files in `assets/videos/` are H.264 `yuv420p` with bright green chromakey backgrounds (RGB=(6,136,47)).
- **Interactive State & Turntable Logic**:
  - Scoped variables: `activeCategory`, `activeModelIdx`, `isXRayMode` (default `false`), `xrayExpansion` (0.50), `currentAngle`, `targetAngle`, `velocity`, `isDragging`, `isUserManualInteracting`, `userInteractionTimeout`, `isAutoRotating`, `isPlayingCinema` (lines 9258–9274).
  - Pointer dragging on `#hw-viewport` updates `currentAngle` and applies momentum inertia via `animateTurntableInertia()` running in a `requestAnimationFrame` loop (lines 9832–9844).
  - Cinema Play: Clicking `#hw-btn-video-play` toggles `hwXrayVideo.play()` / `.pause()` and sets `isPlayingCinema = true/false` (line 10042). While playing, `timeupdate` syncs `xrayExpansion` and `xraySlider.value`.
  - Manual interaction lock: `markUserInteracting()` flags `isUserManualInteracting = true` for 1,800ms to avoid fighting scroll events (line 9356).
- **Scroll Handling in Project 03**:
  - Lines 9849–9894: `handleScrollLinkUpdate()` registered on `window` and `lenis.on("scroll")`.
  - Guard: `if (isUserManualInteracting || isDragging || isPlayingCinema) return;`.
  - Computes `progress = (winH - rect.top) / (winH + rect.height)`.
  - Turntable angle: `scrollTargetAngle = (progress - 0.5) * 360 * 1.5; currentAngle += (scrollTargetAngle - currentAngle) * 0.08;`.
  - Video scrub: `teardownProgress = Math.sin(Math.min(Math.max((progress - 0.1) / 0.8, 0), 1) * Math.PI);`
    ```javascript
    if (hwXrayVideo && hwXrayVideo.duration) {
      const targetTime = teardownProgress * hwXrayVideo.duration;
      if (!isNaN(targetTime) && Math.abs(hwXrayVideo.currentTime - targetTime) > 0.08) {
        hwXrayVideo.currentTime = targetTime;
      }
    }
    ```
  - **CRITICAL CSS ANOMALY**:
    - Lines 2282–2295 & 2335–2338: `.hw-video-layer` has `opacity: 0; pointer-events: none;` by default.
    - It only becomes `opacity: 1` when `.hardware-app-container.xray-active` is active!
    - When `isXRayMode` is false (the initial 360 Studio state), the video layer is hidden, so scroll scrubbing the video is invisible to the user until they manually toggle `X-RAY TEARDOWN` mode.

### 1.6 Scroll Handling Architecture
1. **Lenis Smooth Scroll Engine**:
   - `lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10*t)), smoothWheel: true, wheelMultiplier: 1.0 });` (lines 4377–4382).
   - Hooked to GSAP ticker: `gsap.ticker.add((time) => lenis.raf(time * 1000));` (line 4384).
   - Updates ScrollTrigger on scroll: `lenis.on("scroll", ScrollTrigger.update);` (line 4383).
2. **GSAP ScrollTrigger**:
   - Registered at line 4371 (`gsap.registerPlugin(ScrollTrigger)`).
   - Manages page-wide section animations (`.reveal`, `.counter`, `#closing`, and `.project` timeline clips).
   - Refreshes on window resize: `ScrollTrigger.refresh()` (line 10158).
3. **Component Scroll Listeners**:
   - Global scroll listener for `#progress` and `#nav` hiding (line 5167).
   - Project 2 listener `handleSneakerScrollLink` (line 8474).
   - Project 3 listener `handleScrollLinkUpdate` (line 9891).

---

## 2. Logic Chain

1. **HTML File Redundancy & Synchronization**:
   - *Observation*: `index.html` and `personal_brand_v4.html` have the exact same byte count (415,787), line count (10,163), and SHA256 checksum (`82D6D5D5ABFEEF5A750DEBECAD59031D2CCBDA7456AA2FE4A3CC00B16A400FE0`).
   - *Logic*: Both files are mirrored production entry points. Requirement R3 explicitly mandates: "Ensure 100% byte-for-byte synchronization between `personal_brand_v4.html` and `index.html`." Any downstream modifications to one file must be applied symmetrically to the other or synchronized upon commit.

2. **Project 2 (Sneakers Atelier) Video Gap**:
   - *Observation*: Project 2 currently uses an `<img>` tag inside `#snk-render-box` with static PNGs from `assets/sneakers/` (`getSneakerPhotoData()`).
   - *Observation*: `assets/videos_webm/` contains 12 rotation/showcase WebM videos with VP9 alpha channel (such as `Product_360-degree_rotation_video_20260912183605.webm`, which depicts the Maison Margiela sneaker rotating 360° on transparent background).
   - *Logic*: Project 2 does not yet meet R1 ("Primary Scroll-Driven Transparent Video Engine") or R2 ("Project 2 (Luxury Sneakers Atelier): Real-time 360° multi-angle scroll rotation for all flagship sneaker models"). To fulfill the requirements, Project 2 requires a dedicated transparent video player element integrated into `#snk-tilt-card` / `#snk-render-box` that scrubs smoothly with scroll and model switching.

3. **Project 3 (Cyber Studio Hardware) Video Integration & Mode Restriction**:
   - *Observation*: Project 3 defines all 19 models in `HARDWARE_CATALOG` with explicit `video: "assets/videos_webm/..."` paths, and contains `<video id="hw-xray-video">` inside `.hw-video-layer`.
   - *Observation*: In CSS, `.hw-video-layer` is styled with `opacity: 0` unless `.hardware-app-container` has the `.xray-active` class.
   - *Observation*: In JS, `handleScrollLinkUpdate()` updates `hwXrayVideo.currentTime = targetTime;` directly inside the scroll callback, without throttling to `requestAnimationFrame`.
   - *Logic*: While Project 3 has the 19 models and transparent WebM files mapped, in standard 360° mode the video layer is completely invisible (displaying only the static PNG `#hw-main-img`). Furthermore, scrubbing `<video>` directly in a raw scroll event handler can cause decoding stutter or frame drops during rapid scrolling. Scrubbing must be driven smoothly through a requestAnimationFrame lerp loop at 60+ FPS to fulfill R1.

4. **Category and Model Roster Handling**:
   - *Observation*: The 4 category buttons (`data-cat="headphones|mice|speakers|keyboards"`) dynamically repopulate `#hw-roster-list` via `populateRoster()` and reset `activeModelIdx = 0`.
   - *Observation*: Switching models invokes `updateModelView()`, which updates `hwXrayVideo.src = model.video`, resets poster, calls `.load()`, and recalculates telemetry specs and the Harman FR curve canvas.
   - *Logic*: The category switching and model selection architecture is robust and modular. The video switching logic is already wired to model selection, but needs to ensure that video load events or ready states gracefully transition without visual layout shifts or blank flickers (meeting Acceptance Criteria: "Poster images and initial video frames load instantly with zero layout shifts or visual flicker").

---

## 3. Caveats

- **Video Content Scope for Sneakers**: We observed 12 360-degree rotation videos in `assets/videos_webm/`, some of which depict sneakers (e.g. Margiela GAT) and others depict hardware items. The downstream implementation team must verify the exact video-to-sneaker mapping for all 6 models in Project 2.
- **Hardware 360° vs Teardown Video Channels**: In Project 3, the catalog entries currently point to the `*_Exploded_View_*.webm` videos for each model. If both 360° rotation and Exploded Teardown are to be displayed via transparent video, the engine must either coordinate between the 360 rotation videos and the exploded teardown videos, or synchronize 3D rig rotation with video scrubbing.
- **Safari / iOS WebM Transparency Support**: WebM VP9 Alpha is fully supported in Chromium and modern WebKit/Safari 15.4+, but the existing codebase also maintains fallback MP4 videos in `assets/videos/`. If chromakey canvas shaders are desired for legacy engines, that would be an alternative implementation.

---

## 4. Conclusion

1. **Repository & File Architecture**: The project is a single-page luxury portfolio with two identical root files (`index.html` and `personal_brand_v4.html`). The git repository is on branch `feature/scroll-driven-transparent-videos`.
2. **Project 2 Status**: Fully functional interactive e-commerce stage with 6 luxury sneaker models, 360° drag physics, swatches, and cart/checkout simulation, but currently renders via **static PNG sprite swapping** rather than scroll-driven transparent WebM video.
3. **Project 3 Status**: Highly advanced hardware laboratory with all **19 flagship models structured across 4 categories** (`headphones`, `mice`, `speakers`, `keyboards`). Transparent WebM VP9 Alpha videos (`ALPHA_MODE: 1`) are already mapped to each model. However, the video layer is hidden in default 360 mode by CSS (`opacity: 0`), and scroll scrubbing sets `currentTime` directly in scroll callbacks rather than via an optimized 60+ FPS rAF timeline engine.
4. **Scroll Engine**: Lenis smooth scroll and GSAP ScrollTrigger are already operational and provide the ideal high-precision clock (`gsap.ticker` and `lenis.on("scroll")`) to power a seamless dual-control scroll-driven transparent video engine.

---

## 5. Verification Method

To independently verify all observations and conclusions:

1. **Verify HTML File Identity**:
   ```powershell
   Get-FileHash "d:\my web\index.html", "d:\my web\personal_brand_v4.html"
   Compare-Object (Get-Content "d:\my web\index.html") (Get-Content "d:\my web\personal_brand_v4.html")
   ```
   *Expected Result*: Hashes match `82D6D5D5ABFEEF5A750DEBECAD59031D2CCBDA7456AA2FE4A3CC00B16A400FE0`, zero differences.

2. **Verify Git Branch**:
   ```powershell
   git status
   git branch
   ```
   *Expected Result*: On branch `feature/scroll-driven-transparent-videos`.

3. **Verify WebM VP9 Native Alpha Channel**:
   ```powershell
   ffprobe -v error -select_streams v:0 -show_entries stream_tags=ALPHA_MODE -of default=noprint_wrappers=1 assets\videos_webm\Apple_AirPods_Max_Exploded_View_20260912183607.webm
   ```
   *Expected Result*: `ALPHA_MODE=1`.

4. **Verify Project 3 19 Models in Catalog**:
   ```powershell
   python -c "
   import re
   with open('index.html', encoding='utf-8') as f:
       text = f.read()
   m = re.findall(r'id:\s*\"([^\"]+)\"', text[text.find('HARDWARE_CATALOG'):text.find('State Management')])
   print('Count:', len(m), m)
   "
   ```
   *Expected Result*: Count: 19 models across headphones, mice, speakers, keyboards.
