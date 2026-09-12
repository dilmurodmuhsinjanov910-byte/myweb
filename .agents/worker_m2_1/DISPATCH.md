## 2026-09-12T15:21:00Z

<USER_REQUEST>
You are Worker M2 (Project 2 Luxury Sneakers Atelier Video Integration). Your working directory is `d:\my web\.agents\worker_m2_1`.
You MUST read `d:\my web\.agents\ORIGINAL_REQUEST.md` verbatim before starting any work.
You MUST also read `d:\my web\PROJECT.md`, `d:\my web\.agents\explorer_survey_2\handoff.md`, `d:\my web\.agents\explorer_survey_3\handoff.md`, and `d:\my web\.agents\worker_m1_1\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Implement Milestone 2: Project 2 (Luxury Sneakers Atelier) Scroll-Driven 360° Transparent Video Integration in `d:\my web\personal_brand_v4.html` and mirror 100% byte-for-byte to `d:\my web\index.html`.

Specific Requirements:
1. Video Element Integration in Project 2:
   - Add `<video id="snk-video" class="snk-video-render" playsinline muted loop preload="auto" poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='9' viewBox='0 0 16 9'%3E%3C/svg%3E">` into `#snk-render-box` inside `#snk-tilt-card` in `personal_brand_v4.html`.
   - Add CSS for `.snk-video-render`:
     `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: transparent; aspect-ratio: 16/9; contain: layout size; pointer-events: none; z-index: 6;`
   - Ensure zero black borders, zero green fringing, and 100% transparent backgrounds over the dark luxury theme.
2. Sneaker Catalog Video Mapping:
   - Add `video` and `videoMp4` properties to each of the 6 sneaker models in `const SNEAKERS = [...]`:
     * `palm-angels`: `video: "assets/videos_webm/360_degree_product_showcase_video_20260912183606.webm"`, `videoMp4: "assets/videos/360_degree_product_showcase_video_20260912183606.mp4"`
     * `balenciaga`: `video: "assets/videos_webm/Product_360_degree_rotation_video_20260912183607.webm"`, `videoMp4: "assets/videos/Product_360_degree_rotation_video_20260912183607.mp4"`
     * `margiela`: `video: "assets/videos_webm/Product_360-degree_rotation_video_20260912183605_2.webm"`, `videoMp4: "assets/videos/Product_360-degree_rotation_video_20260912183605_2.mp4"`
     * `rick-owens`: `video: "assets/videos_webm/Product_360_degree_video_showcase_20260912183605.webm"`, `videoMp4: "assets/videos/Product_360_degree_video_showcase_20260912183605.mp4"`
     * `off-white`: `video: "assets/videos_webm/360_degree_product_showcase_video_20260912183605.webm"`, `videoMp4: "assets/videos/360_degree_product_showcase_video_20260912183605.mp4"`
     * `bottega`: `video: "assets/videos_webm/Product_360_degree_showcase_video_20260912183606.webm"`, `videoMp4: "assets/videos/Product_360_degree_showcase_video_20260912183606.mp4"`
3. Wire Video Engine & Dual-Control Physics:
   - Instantiate `snkVideoEngine = new VideoScrubEngine(snkVideo, { fps: 60, lerpFactor: 0.12, quantizeDelta: 0.038 })`.
   - Instantiate `snkPhysics = new DualControlPhysics({ cooldownDuration: 1800, blendDuration: 300, videoEngine: snkVideoEngine })`.
   - In `handleSneakerScrollLink()`: when scrolling past Project 2, if `snkPhysics.notifyScroll()` is allowed, map scroll progress directly to video rotation ($0 \to 360^\circ$ and video `currentTime = progress * duration`).
   - In manual pointer drag on `#snk-tilt-card`, quick-angle pills (`.snk-angle-pill`), and autospin (`startAutoSpin`):
     * Engage manual lock: `snkPhysics.markUserInteracting('turntable')`.
     * Turntable angle changes continuously update video time ($t = \frac{(\text{angle} \pmod{360} + 360) \pmod{360}}{360} \times \text{duration}$) via `snkVideoEngine.seekImmediate(t)`.
     * On pointer release or autospin pause, smoothly transition through `snkPhysics.releaseInteraction()`.
   - When switching sneaker models in `switchSneaker(idx)` / `updateSneakerView()`, update `snkVideoEngine.loadSource(sneaker.video, sneaker.videoMp4, snkVideoEngine.TRANSPARENT_POSTER)`.
   - Retain the static multi-angle photographic cutouts as an instant fallback during rapid flicking.
4. Byte-for-Byte Synchronization & Git Commit:
   - Make all changes in `personal_brand_v4.html`.
   - Mirror verbatim to `index.html`: `Copy-Item personal_brand_v4.html index.html -Force`.
   - Verify 100% byte-for-byte SHA256 identity (`Compare-Object` and `Get-FileHash`).
   - Run automated test suite: `node tests/e2e/run_tests.js`.
   - Commit with descriptive message: `git commit -m "feat(sneakers): integrate scroll-driven 360 transparent video engine for luxury sneakers atelier"`.
   - Deliver handoff report to `d:\my web\.agents\worker_m2_1\handoff.md`.
   - Send completion message to parent (`f3b26edc-8c09-45d3-b7a2-00b3fee473f3`).

Scope boundaries:
- Write ownership: You own `personal_brand_v4.html` and `index.html`.
- DO NOT break Project 1 or Project 3 functionality.
</USER_REQUEST>
