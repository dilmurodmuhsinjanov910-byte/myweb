## 2026-09-12T15:12:00Z
You are Worker M1 (Core Video Engine & Physics Architecture). Your working directory is `d:\my web\.agents\worker_m1_1`.
You MUST read `d:\my web\.agents\ORIGINAL_REQUEST.md` verbatim before starting any work.
You MUST also read `d:\my web\PROJECT.md`, `d:\my web\.agents\explorer_survey_1\handoff.md`, and `d:\my web\.agents\explorer_survey_3\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Implement Milestone 1: Core Video Engine & Physics Architecture in `d:\my web\personal_brand_v4.html`, and sync 100% byte-for-byte to `d:\my web\index.html`.

Specific Requirements:
1. Implement the `VideoScrubEngine` class / module:
   - 3-tier non-blocking scrubbing architecture:
     * Tier 1 (Scroll Ingestion): Cleanly receives scroll progress without touching video `currentTime` in high-frequency events.
     * Tier 2 (RAF Lerp): Uses a 60+ FPS `requestAnimationFrame` loop (hooked to `gsap.ticker` or RAF) with exponential smoothing ($\lambda \approx 0.12$) to calculate smooth target time.
     * Tier 3 (Seek-Lock Guard): Listens to `seeking` and `seeked` events on the `<video>` element, buffers `pendingTime` if `isSeeking` is true, quantizes seek requests ($\Delta t \ge 0.038$s), and uses `video.fastSeek(targetTime)` where supported with fallback to `video.currentTime = targetTime`.
2. Implement `DualControlPhysics` state machine:
   - 5 states: `IDLE_SCROLL_DRIVEN (0)`, `MANUAL_TURNTABLE_DRAG (1)`, `MANUAL_TIMELINE_SLIDER (2)`, `CINEMA_PLAYBACK (3)`, `INERTIA_COOLDOWN (4)`.
   - Pointer drag on turntable or slider input immediately engages `markUserInteracting()` with 1,800ms cooldown lock, overriding scroll updates.
   - When continuous playback is active (`CINEMA_PLAYBACK`), page scrolling cleanly pauses playback and smoothly blends back to scroll-driven tracking over a 300ms window without visual snapping.
3. Transparent Poster & Shielding Architecture:
   - Ensure video viewport containers have fixed sizing/containment (`object-fit: contain; aspect-ratio: 16/9; contain: layout size;`).
   - Remove any dark background flicker or layout shifts during initial load or model swaps. Use transparent SVG/1x1 data URI poster or instant `loadedmetadata` frame priming.
   - Remove outer CSS drop-shadow filters from transparent video elements (e.g. `.hw-xray-video`), allowing the dynamic DOM contact shadows (`.hw-contact-shadow`, `.snk-ground-shadow`) to provide realistic grounding without border artifacts.
4. Byte-for-Byte Synchronization & Git Commit:
   - Make all changes in `personal_brand_v4.html`.
   - Mirror verbatim to `index.html`: `Copy-Item personal_brand_v4.html index.html -Force`.
   - Verify 100% byte-for-byte SHA256 identity (`Compare-Object` or `fc.exe /b`).
   - Execute git commit with descriptive message (e.g. `feat(engine): implement 3-tier non-blocking video scrub engine and dual-control physics state machine`).
5. Documentation & Handoff:
   - Write `d:\my web\.agents\worker_m1_1\handoff.md` with complete documentation of changes, verification commands, and test results.
   - Send completion message to parent (`f3b26edc-8c09-45d3-b7a2-00b3fee473f3`).

Scope boundaries:
- Write ownership: You own `personal_brand_v4.html` and `index.html`.
- DO NOT touch files in `tests/`!
- Do not break existing page functionality or other sections.
