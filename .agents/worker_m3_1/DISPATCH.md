## 2026-09-12T15:27:16Z
You are Worker M3 (Project 3 Cyber Studio Hardware Video Unification & Dual-Mode Scrubbing). Your working directory is `d:\my web\.agents\worker_m3_1`.
You MUST read `d:\my web\.agents\ORIGINAL_REQUEST.md` verbatim before starting any work.
You MUST also read `d:\my web\PROJECT.md`, `d:\my web\.agents\explorer_survey_1\handoff.md`, `d:\my web\.agents\explorer_survey_2\handoff.md`, `d:\my web\.agents\explorer_survey_3\handoff.md`, and `d:\my web\.agents\worker_m2_1\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Implement Milestone 3: Project 3 (Cyber Studio Hardware) 19-Model Video Layer Unification & Teardown Scrubbing in `d:\my web\personal_brand_v4.html` and mirror 100% byte-for-byte to `d:\my web\index.html`.

Specific Requirements:
1. Video Layer Unification in Project 3:
   - In `personal_brand_v4.html`, update `.hw-video-layer` CSS:
     Make `.hw-video-layer` visible (`opacity: 1; pointer-events: auto;`) in both 360° Studio mode and X-Ray Teardown mode, so the transparent WebM VP9 Alpha video operates seamlessly in both modes.
     Ensure `contain: layout size; object-fit: contain; aspect-ratio: 16/9; z-index: 25; background: transparent;`.
     Ensure `#hw-main-img` and `.hw-video-layer` coordinate harmoniously without layout shifts or flashes.
2. Hardware Catalog 19-Model Verification:
   - Verify all 19 hardware models in `const HARDWARE_CATALOG = { headphones: [...], mice: [...], speakers: [...], keyboards: [...] }`:
     * 5 Headphones, 5 Precision Mice, 5 Hi-Fi Speakers, 4 Mechanical Keyboards (5+5+5+4=19).
     * Confirm each model has valid paths for `video` (`assets/videos_webm/*.webm`) and `videoMp4` (`assets/videos/*.mp4`), with zero 404s.
3. Dual-Control Physics & Scrubbing Engine Integration:
   - Connect `hwVideoEngine` and `hwPhysics`:
     * In `handleScrollLinkUpdate()`: when scrolling through Project 3, if `hwPhysics.notifyScroll()` is allowed:
       Progressively scrub the transparent video from 0% (assembled) to 100% (exploded teardown) in direct proportion to scroll progress at 60+ FPS, while smoothly driving turntable rotation angle.
     * Turntable dragging on `#hw-viewport`, teardown slider dragging (`#hw-xray-slider`), and clicking `▶ PLAY CINEMA` (`#hw-btn-video-play`) engage `hwPhysics.markUserInteracting()` with 1,800ms cooldown, taking immediate priority over scroll.
     * Clicking `▶ PLAY CINEMA` starts autonomous video playback; when the user scrolls the page, it cleanly pauses cinema mode and gracefully blends back into scroll tracking over 300ms without visual snapping.
     * Category tab switching (`.hw-cat-btn`) and model switching in `#hw-roster-list` dynamically invoke `hwVideoEngine.loadSource(model.video, model.videoMp4, hwVideoEngine.TRANSPARENT_POSTER)`, ensuring immediate video swap with zero dark flash and zero layout shift.
4. Byte-for-Byte Synchronization & Git Commit:
   - Make all changes in `personal_brand_v4.html`.
   - Mirror verbatim to `index.html`: `Copy-Item personal_brand_v4.html index.html -Force`.
   - Verify 100% byte-for-byte SHA256 identity (`Compare-Object` and `Get-FileHash`).
   - Run automated test suite: `node tests/e2e/run_tests.js` (all 120 tests must pass).
   - Commit with descriptive message: `git commit -m "feat(hardware): unify transparent video layer and 19-model dual-mode scrubbing for cyber studio"`.
   - Deliver handoff report to `d:\my web\.agents\worker_m3_1\handoff.md`.
   - Send completion message to parent (`f3b26edc-8c09-45d3-b7a2-00b3fee473f3`).

Scope boundaries:
- Write ownership: You own `personal_brand_v4.html` and `index.html`.
- DO NOT break Project 1 or Project 2 functionality.
