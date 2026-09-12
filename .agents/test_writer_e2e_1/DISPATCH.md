## 2026-09-12T15:11:53Z
You are the E2E Test Suite Architect. Your working directory is `d:\my web\.agents\test_writer_e2e_1`.
You MUST read `d:\my web\.agents\ORIGINAL_REQUEST.md` verbatim before starting any work.
You MUST also read `d:\my web\TEST_INFRA.md` and `d:\my web\PROJECT.md`.

Objective:
Design and build the comprehensive, automated, opaque-box E2E test suite in `d:\my web\tests\e2e\` to verify all requirements:
1. Requirements to verify:
   - R1: Primary Scroll-Driven Transparent Video Engine (WebM VP9 Alpha, 60+ FPS smooth scrub, zero black borders, zero green fringing, zero layout shifts).
   - R2: Seamless Product-to-Video Mapping:
     * Project 2 (Luxury Sneakers Atelier): 360° multi-angle scroll rotation for all 6 flagship sneaker models.
     * Project 3 (Cyber Studio Hardware): Transparent video playback for all 19 models across 4 categories (Headphones [5], Precision Mice [5], Hi-Fi Speakers [5], Mechanical Keyboards [4]), with 360° rotation & Exploded Teardown scrubbing on scroll.
   - R3: Dual-Control Physics & Interactive Fallback:
     * Scroll drives video time and turntable angle.
     * Turntable dragging, timeline slider scrubbing, or clicking ▶ PLAY CINEMA takes priority, then smoothly returns to scroll tracking.
     * 100% byte-for-byte synchronization between `personal_brand_v4.html` and `index.html`.

2. Test Suite Architecture:
   - Implement an automated test runner script in Node.js (or Python) at `d:\my web\tests\e2e\run_tests.js` (or `test_suite.js`) that can be executed via terminal (`node tests/e2e/run_tests.js`).
   - The test suite must implement the 4-tier methodology from `TEST_INFRA.md`:
     * Tier 1 (Feature Coverage): ≥50 test cases (≥5 tests for each of the 10 features in TEST_INFRA.md).
     * Tier 2 (Boundary & Corner Cases): ≥50 test cases (rapid scrolling, zero/max progress, quick category switches, rapid drag interruptions, video duration boundaries).
     * Tier 3 (Cross-Feature Combinations): ≥10 pairwise combinatorial test cases.
     * Tier 4 (Real-World Scenarios): ≥5 realistic workload scenarios.
   - Total test cases must exceed 115 tests.
   - Include direct video stream validation (verifying WebM VP9 `ALPHA_MODE: 1` and chroma-key MP4 companion presence for all catalog models).
   - Include SHA256 byte-for-byte identity test between `personal_brand_v4.html` and `index.html`.
   - Ensure clean exit code 0 when all tests pass, non-zero when tests fail.

3. Publishing & Completion:
   - Run the test suite to ensure the harness itself works properly.
   - Publish `d:\my web\TEST_READY.md` with complete coverage summary table and instructions on how to run the test suite.
   - Write your handoff report to `d:\my web\.agents\test_writer_e2e_1\handoff.md`.
   - Send a completion message to parent (`f3b26edc-8c09-45d3-b7a2-00b3fee473f3`).

Scope boundaries:
- Write ownership: You own `d:\my web\tests\` and `d:\my web\TEST_READY.md`.
- DO NOT modify `index.html` or `personal_brand_v4.html`!
- Do not cheat: Test suite must perform genuine validations against requirements.
