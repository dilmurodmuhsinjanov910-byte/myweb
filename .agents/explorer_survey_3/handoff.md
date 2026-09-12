# Architectural & Technical Survey Handoff Report: Transparent Video Engine, Dual-Control Physics & State Coordination

**Agent**: Explorer Survey 3  
**Working Directory**: `d:\my web\.agents\explorer_survey_3`  
**Date**: 2026-09-12T20:07:30+05:00  
**Target Files**: `personal_brand_v4.html`, `index.html`, `assets/videos_webm/`, `assets/videos/`  
**Mode**: Read-Only Architecture Exploration & Technical Specification  

---

## 1. Observation

### 1.1 Integrity and Existing Codebase Structure
1. **Byte-for-byte Identity of HTML Entrypoints**:
   - Command: `powershell -Command "(Get-FileHash index.html).Hash; (Get-FileHash personal_brand_v4.html).Hash"`
   - Output:
     ```
     82D6D5D5ABFEEF5A750DEBECAD59031D2CCBDA7456AA2FE4A3CC00B16A400FE0
     82D6D5D5ABFEEF5A750DEBECAD59031D2CCBDA7456AA2FE4A3CC00B16A400FE0
     ```
   - Command: `powershell -Command "Compare-Object (Get-Content index.html) (Get-Content personal_brand_v4.html)"`
   - Output: Empty (files are currently 100% identical, exactly 415,787 bytes each, 10,163 lines).

2. **Git Repository Status**:
   - Active Branch: `feature/scroll-driven-transparent-videos`
   - Untracked files: `.agents/`, `ORIGINAL_REQUEST.md`
   - Working tree clean with zero uncommitted source file changes.

### 1.2 Video Asset Stream & Codec Properties
1. **WebM Alpha Videos (`assets/videos_webm/*.webm`)**:
   - Total Files: 42 files (12 360° rotation videos, 28 exploded/disassembly videos, 2 hardware showcase variants).
   - Codec & Stream Properties (via `ffprobe -v error -show_streams -of json assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm`):
     - Video Codec: `vp9` (Google VP9, Profile 0), mime: `vp09.00.31.08`
     - Tag: `"ALPHA_MODE": "1"`
     - Resolution: `1280x720`, Aspect Ratio: `16:9`
     - Framerate: `24/1` (24.0 fps), Duration: `10.013s` (240 frames total)
     - Audio Codec: `opus` 48kHz stereo (muted in DOM presentation)
   - Alpha Channel Distribution (via `ffmpeg -c:v libvpx-vp9 -pix_fmt yuva420p`):
     - Frame 1s pixel analysis: `Mode: RGBA, shape: (720, 1280, 4)`
     - Background pixels: `Alpha = 0` across 845,635 / 921,600 pixels (>91.7% of the frame is completely transparent).
     - Outer 1-pixel boundary test (`top`, `bottom`, `left`, `right` edges): `0 / 1280` and `0 / 720` non-zero alpha pixels. There is **zero boundary noise** in the encoded source WebM files.
   - **Keyframe Interval (GOP Length)**:
     - Command: `ffprobe -v error -select_streams v -show_entries frame=key_frame -of default=noprint_wrappers=1 "assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm"`
     - Result across all sampled WebM files: Exactly **2 keyframes per 10-second video** (1 keyframe at frame 0, 1 keyframe at ~frame 120/240; inter-keyframe distance ~120 frames).

2. **Companion MP4 Videos (`assets/videos/*.mp4`)**:
   - Total Files: 42 companion files.
   - Codec: H.264 / AVC (`yuv420p`, High profile, level 3.1).
   - Background Color: Chroma-key green screen with corner RGB `(8, 137, 47)`.
   - Purpose: Designed as a chroma-key fallback source for platforms lacking WebM VP9 Alpha support (specifically Apple WebKit / Safari).

### 1.3 Existing DOM & JavaScript Implementation Deficiencies
1. **Project 02: SSENSE Atelier Luxury Footwear (`#sneaker-app`)**:
   - Location: Lines 3642–3945 (HTML), Lines 630–1850 (CSS), Lines 7265–8550 (JS).
   - Current Rendering Mechanism: In line 8241–8252 (`updateSneakerView`), renders static 2D cutout images (`snk-photo-render`) from 5 discrete angles (`balenciaga_front3q.png`, etc.).
   - **Deficiency**: There is **no `<video>` element** in `#sneaker-app`. Requirement R1/R2 mandates real-time 360° multi-angle scroll rotation driven by transparent video for all 6 sneaker models (`palm-angels`, `balenciaga`, `margiela`, `rick-owens`, `off-white`, `bottega`).

2. **Project 03: Cyber Studio Luxury Hardware (`#hardware-app`)**:
   - Location: Lines 3967–4150 (HTML), Lines 1852–2630 (CSS), Lines 8805–10150 (JS).
   - DOM Video Layer:
     ```html
     <!-- Line 4047-4056 -->
     <div class="hw-video-layer" id="hw-video-layer">
       <video id="hw-xray-video" class="hw-xray-video" playsinline muted loop preload="auto" poster="...">
         <source src="assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm" type="video/webm">
         <source src="assets/videos/Apple_AirPods_Max_Exploded_View_20260912183607.mp4" type="video/mp4">
       </video>
     </div>
     ```
   - CSS Invisibility in Studio Mode:
     - Line 2288: `.hw-video-layer { opacity: 0; pointer-events: none; }`
     - Line 2335: `.hardware-app-container.xray-active .hw-video-layer { opacity: 1; pointer-events: auto; }`
     - **Deficiency**: The video is only visible in X-Ray Teardown mode. In 360° Studio mode, the video layer is hidden at `opacity: 0`, leaving the user with a flat 2D image (`#hw-main-img`) on a CSS 3D rig.
   - Video Scrubbing Implementation:
     - Line 9874–9880:
       ```javascript
       if (hwXrayVideo && hwXrayVideo.duration) {
         const targetTime = teardownProgress * hwXrayVideo.duration;
         if (!isNaN(targetTime) && Math.abs(hwXrayVideo.currentTime - targetTime) > 0.08) {
           hwXrayVideo.currentTime = targetTime;
         }
       }
       ```
     - **Deficiency**: Naive direct assignment to `video.currentTime` without `isSeeking` protection. During scroll bursts, this repeatedly cancels in-flight decoder seeks, causing decoder stalls and dropped frames.

---

## 2. Logic Chain

### 2.1 Video Decoding Pipeline & Stutter Prevention
1. *From Observation 1.2.1*, each 10-second WebM file contains only 2 keyframes.
2. If `video.currentTime` is assigned directly inside a high-frequency scroll or Lenis callback (which can fire 60–240 times per second), the browser media thread is forced to abort in-flight frame decoding and seek backwards to the nearest keyframe (~5 seconds prior) to reconstruct intermediate delta frames up to the requested timestamp.
3. Therefore, setting `currentTime` at native scroll frequency guarantees media pipeline thrashing, frame drops, and severe stutter.
4. *Deduction & Architectural Solution*:
   - To achieve 60+ FPS without decode stalls, video scrubbing MUST be decoupled from raw scroll events using a **Three-Tier Non-Blocking Scrubbing Pipeline**:
     - **Tier 1 (Scroll Ingestion)**: Compute target normalized progress $P_{\text{target}} \in [0, 1]$ in the scroll listener and store it in memory. Do NOT touch `video.currentTime` here.
     - **Tier 2 (RAF Lerping)**: In a central `requestAnimationFrame` loop, interpolate progress using an exponential smoothing filter:
       $$P_{\text{smooth}} \leftarrow P_{\text{smooth}} + (P_{\text{target}} - P_{\text{smooth}}) \times \lambda \quad (\lambda \approx 0.12)$$
       This guarantees that frame requests arrive strictly synced to the display refresh rate (60Hz / 120Hz) with smooth velocity transitions.
     - **Tier 3 (Seek-Lock Guard & FastSeek)**: Maintain an `isSeeking` boolean flag bound to `seeking` and `seeked` DOM events on the `<video>` element. If `isSeeking === true`, buffer the latest `targetTime` into `pendingTime`. Only issue a seek if `!isSeeking` and the delta exceeds frame quantization:
       $$\Delta t = |t_{\text{current}} - t_{\text{target}}| \ge 0.038\text{s}$$
       Where supported, invoke `video.fastSeek(targetTime)`; fallback cleanly to `video.currentTime = targetTime`.

### 2.2 Cross-Platform Transparency & Halo Prevention
1. *From Observation 1.2.1*, WebM VP9 Alpha files have clean alpha edges (`ALPHA_MODE=1`), but *From Observation 1.2.2*, Safari/WebKit does not decode WebM Alpha tracks in `<video>`.
2. Chromium (Chrome, Edge, Brave, Opera) and Gecko (Firefox) represent >85% of desktop browsers and decode WebM Alpha directly to the compositor layer with zero CPU overhead.
3. Safari on macOS and iOS requires either HEVC with Alpha or WebGL ChromaKey on the companion MP4 files.
4. In CSS line 2303, `filter: drop-shadow(0 20px 45px rgba(0, 0, 0, 0.95))` is applied directly to `.hw-xray-video`.
5. Because drop-shadow calculates shadows off the alpha silhouette, any minor compression artifact or scaling filter can cause a visible rectangular box or perimeter shadow.
6. *Deduction & Architectural Solution*:
   - Remove outer CSS filters from the `<video>` element itself.
   - Rely instead on the existing underlying DOM elements: `.hw-contact-shadow` and `.snk-ground-shadow`, which dynamically scale and rotate with the turntable.
   - For Safari compatibility, implement automatic feature detection: if WebM Alpha fails (or on Safari/WebKit), transparently route the companion MP4 video through a lightweight 2D canvas with WebGL fragment shader chroma-keying.

### 2.3 Dual-Control State Machine & Priority Coordination
1. *From Observation 1.3.2*, user interactions currently come from 4 competing sources:
   - Page scroll progress (Lenis / window scroll)
   - Pointer drag on 3D turntable (`hwViewport` / `snk-tilt-card`)
   - Manual slider input (`#hw-xray-slider`)
   - Continuous playback button (`▶ PLAY CINEMA` / `#hw-btn-video-play`)
2. Without a formal priority state machine, these inputs collide: a subtle mousewheel event can override a manual drag, or a continuous video playback can be violently interrupted by scroll jitter.
3. *Deduction & Architectural Solution*:
   - Establish a 5-State Finite State Machine (FSM):
     ```
     State 0: IDLE_SCROLL_DRIVEN (Priority 1)
     State 1: MANUAL_TURNTABLE_DRAG (Priority 4 - Immediate Overrule)
     State 2: MANUAL_TIMELINE_SLIDER (Priority 3 - Immediate Overrule)
     State 3: CINEMA_PLAYBACK (Priority 2 - Autonomous)
     State 4: INERTIA_COOLDOWN (Transition State)
     ```
   - **Precedence Rule**:
     - Any pointer interaction (`pointerdown` on turntable or `input` on slider) immediately transitions state to `MANUAL_*` and sets `isUserManualInteracting = true`. All scroll event handlers early-return.
     - Clicking `▶ PLAY CINEMA` triggers `video.play()`. As `timeupdate` fires, the video timeline drives the slider and 3D rig.
     - When the user scrolls the page (wheel or touch), if `CINEMA_PLAYBACK` is active, the system cleanly pauses the video, reverts the button to `▶ PLAY CINEMA`, and gracefully lerps back to scroll-driven tracking over a 300ms smoothing window (`lambda = 0.08`), eliminating any jarring snap.

### 2.4 Product & Category Switching Architecture
1. *From Observation 1.3.1 & 1.3.2*, Project 2 has 6 sneaker models, and Project 3 has 19 hardware models across 4 categories.
2. When switching models or categories:
   - Setting `video.src = newUrl` immediately clears the current frame buffer. If not masked, this causes a blank frame or white/black flash (layout shift / flash).
3. *Deduction & Architectural Solution*:
   - Poster Image Shielding: Set `video.poster = model.thumb` before changing `src`.
   - Maintain fixed bounding box dimensions (`width: 100%; height: 100%; object-fit: contain; aspect-ratio: 16/9; contain: layout size;`).
   - Listen for `loadedmetadata` with `{ once: true }` to immediately initialize `video.currentTime = targetTime` before rendering the new video stream, ensuring zero visual hitch or reset to 0s.

---

## 3. Caveats

1. **Hardware Decoder Limits**:
   - Mobile devices (especially low-end Android or older iPhones) can experience thermal throttling if multiple 1080p/720p hardware decoders are instantiated simultaneously.
   - *Mitigation*: Only the currently active section's video (`#sneaker-app` or `#hardware-app`) should have an active decoding pipeline. When a project is offscreen (detected via `IntersectionObserver`), pause the video and suspend RAF seeks.
2. **Safari iOS Low Power Mode**:
   - On iOS Safari in Low Power Mode, auto-playing `<video>` or high-frequency seeking may be throttled by iOS WebKit to 30 FPS.
   - *Mitigation*: The lerping RAF loop naturally accommodates any framerate drop without accumulating lag or queuing runaway seeks.
3. **No Codebase Edits During Investigation**:
   - This phase is strictly read-only. No source files were touched. Proposed implementations are delivered as drop-in architectural designs.

---

## 4. Conclusion & Technical Recommendations

### 4.1 Recommended Implementation Blueprint for Project 2 (Sneakers Atelier)
1. **Add Dedicated Transparent Video Stage**:
   - Insert `<video id="snk-video" class="snk-video-render" playsinline muted loop preload="auto">` into `.snk-render-box`.
   - Map each of the 6 sneaker models to its 360° rotation video in `assets/videos_webm/`:
     - `palm-angels`: `Product_360_degree_rotation_video_20260912183606.webm`
     - `balenciaga`: `Product_360-degree_rotation_video_20260912183605.webm`
     - `margiela`: `Product_360-degree_rotation_video_20260912183605_2.webm`
     - `rick-owens`: `Product_360_degree_rotation_video_20260912183607.webm`
     - `off-white`: `Product_360_degree_showcase_video_20260912183605.webm`
     - `bottega`: `Product_360_degree_showcase_video_20260912183606.webm`
2. **Synchronize Video Time with Turntable Angle**:
   - As turntable angle $\theta \in [0, 360^\circ)$ changes (via scroll or manual drag):
     $$t = \left(\frac{(\theta \pmod{360} + 360) \pmod{360}}{360}\right) \times \text{duration}$$
   - Apply seek via non-blocking seek-lock loop. Keep high-resolution photographic cutouts as an instant fallback during rapid flicking.

### 4.2 Recommended Implementation Blueprint for Project 3 (Cyber Studio Hardware)
1. **Unify 360° Studio & X-Ray Video Mode**:
   - Update CSS: Keep `.hw-video-layer` visible (`opacity: 1`) in both modes.
   - In 360° Studio mode: Video scrubs from 0% to 50% (rotation cycle).
   - In X-Ray Teardown mode: Video scrubs from 50% to 100% (exploded assembly/disassembly cycle).
2. **Dual-Control Priority State Machine**:
   - Implement the 5-state machine with `markUserInteracting()` timer (1,800ms cooldown) and instant scroll overrule.
3. **Seek-Locking Code Pattern**:
   ```javascript
   class VideoScrubber {
     constructor(videoEl) {
       this.video = videoEl;
       this.isSeeking = false;
       this.pendingTime = null;
       this.targetTime = 0;
       
       this.video.addEventListener('seeking', () => { this.isSeeking = true; });
       this.video.addEventListener('seeked', () => {
         this.isSeeking = false;
         if (this.pendingTime !== null) {
           const t = this.pendingTime;
           this.pendingTime = null;
           this.seek(t);
         }
       });
     }
     
     seek(time) {
       if (!this.video.duration || isNaN(this.video.duration)) return;
       const clamped = Math.max(0, Math.min(this.video.duration, time));
       if (Math.abs(this.video.currentTime - clamped) < 0.038) return;
       
       if (!this.isSeeking) {
         if (typeof this.video.fastSeek === 'function') {
           this.video.fastSeek(clamped);
         } else {
           this.video.currentTime = clamped;
         }
       } else {
         this.pendingTime = clamped;
       }
     }
   }
   ```

### 4.3 Synchronization & Zero-Error Protocol
1. Any code update MUST be made to `personal_brand_v4.html` first.
2. Mirror verbatim to `index.html`:
   `powershell -Command "Copy-Item personal_brand_v4.html index.html -Force"`
3. Verify byte-for-byte SHA256 match before every commit.

---

## 5. Verification Method

To independently verify all findings and test subsequent implementations:

1. **File Hash Identity Check**:
   ```powershell
   powershell -Command "if ((Get-FileHash index.html).Hash -eq (Get-FileHash personal_brand_v4.html).Hash) { Write-Host 'MATCH: 100% Byte-for-Byte Identical' } else { Write-Error 'MISMATCH!' }"
   ```

2. **WebM Alpha Transparency & GOP Verification**:
   ```powershell
   ffprobe -v error -select_streams v -show_entries stream=codec_name,pix_fmt,tags -of json "assets/videos_webm/Apple_AirPods_Max_Exploded_View_20260912183607.webm"
   ```
   - Verify `"ALPHA_MODE": "1"` is present.

3. **Runtime Performance & Console Error Audit**:
   - Serve project locally:
     ```powershell
     python -m http.server 8080
     ```
   - In browser DevTools:
     - Open Console: Verify `0 Errors`, `0 Warnings`.
     - Open Performance Monitor: Verify FPS stays at 60+ FPS during rapid and continuous scroll.
     - Inspect Rendering: Check "Paint flashing" to verify video decoding occurs on GPU compositor layer without full-document layout shifts (Cumulative Layout Shift = 0.00).
