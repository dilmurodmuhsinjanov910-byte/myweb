# E2E Test Infra: Portfolio Scroll-Driven Transparent Video Engine

## Test Philosophy
- Opaque-box, requirement-driven. Derived strictly from ORIGINAL_REQUEST.md.
- Verification without internal module dependence.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Transparent WebM VP9 Alpha Rendering | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | 3-Tier 60+ FPS Video Scrubbing Pipeline | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Dual-Control Physics & Interactive Fallback | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 4 | Project 2 Sneaker Transparent Video Stage | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | Project 2 Flagship Sneaker Mapping (6 models) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Project 3 Hardware Video Layer Unification | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Project 3 19-Model Hardware Catalog Mapping | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Project 3 Teardown Scrubbing & Cinema Mode | ORIGINAL_REQUEST §R2, §R3 | 5 | 5 | ✓ |
| 9 | Category Tab & Model Switch Transitions | ORIGINAL_REQUEST §R2, §R3 | 5 | 5 | ✓ |
| 10 | Byte-for-Byte File Synchronization | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |

## Test Architecture
- Test Runner: Node.js / Playwright / Puppeteer or Headless Browser Automation Test Suite.
- Test Cases Location: `tests/e2e/`
- Test Execution: `node tests/e2e/run_tests.js`
- Pass/Fail Semantics: Exit code 0 on 100% pass; non-zero on any failure.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Continuous Page Scroll from Hero to Footer | F1, F2, F3, F4, F6, F7, F8 | High |
| 2 | Rapid Category Dock Switching & Immediate Model Scrub | F7, F8, F9 | High |
| 3 | Interactive Drag Overrule & Resume Scroll Scrubbing | F2, F3, F7, F8 | High |
| 4 | Play Cinema Activation and Scroll Interrupt Blend | F2, F3, F8 | High |
| 5 | High-Speed Fast-Scroll Reverse Scrubbing | F1, F2, F4, F6, F7 | High |

## Coverage Thresholds
- Tier 1 (Feature Coverage): ≥50 test cases (5 × 10 features)
- Tier 2 (Boundary & Corner Cases): ≥50 test cases (5 × 10 features)
- Tier 3 (Cross-Feature Combinations): ≥10 test cases
- Tier 4 (Real-World Scenarios): ≥5 realistic workload scenarios
- Total Target: ≥115 automated test cases
