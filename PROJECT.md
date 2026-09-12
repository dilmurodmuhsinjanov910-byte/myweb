# Project: Portfolio Scroll-Driven Transparent Video Engine

## Architecture
A high-performance, scroll-driven interactive video engine powering Project 2 (Luxury Sneakers Atelier) and Project 3 (Cyber Studio Hardware) in a luxury single-page web portfolio.
- **Visual Medium**: Native WebM VP9 Alpha (`ALPHA_MODE: 1`, `yuva420p`) videos with 100% transparent backgrounds rendered over the dark luxury theme with zero black borders, zero green fringing, and zero layout shifts.
- **Scrubbing Engine**: 3-Tier Non-Blocking Scrubbing Pipeline:
  1. Scroll Ingestion: Normalizes scroll progress $P_{\text{target}} \in [0, 1]$ via Lenis and GSAP ScrollTrigger.
  2. RAF Lerping: Smooths target progress in a 60+ FPS `requestAnimationFrame` loop ($\lambda \approx 0.12$).
  3. Seek-Lock Guard: Manages `isSeeking` state with queued `pendingTime` and $\Delta t \ge 0.038$s quantization using `video.fastSeek` with fallback to `video.currentTime`.
- **Dual-Control Physics**: 5-State Finite State Machine (`IDLE_SCROLL_DRIVEN`, `MANUAL_TURNTABLE_DRAG`, `MANUAL_TIMELINE_SLIDER`, `CINEMA_PLAYBACK`, `INERTIA_COOLDOWN`) with 1,800ms manual lock and 300ms smooth return to scroll-tracking.
- **Synchronization**: `index.html` and `personal_brand_v4.html` maintained with 100% byte-for-byte SHA256 parity.

## Code Layout
- `d:\my web\index.html`: Production entrypoint (HTML, CSS, JS application engines).
- `d:\my web\personal_brand_v4.html`: Mirrored entrypoint (100% byte-for-byte clone of `index.html`).
- `d:\my web\assets\videos_webm\`: 42 WebM VP9 Alpha transparent video assets (`ALPHA_MODE: 1`).
- `d:\my web\assets\videos\`: 42 H.264 ChromaKey green-screen fallback videos.
- `d:\my web\assets\sneakers\`: 30 multi-angle transparent PNG photographic cutouts.
- `d:\my web\assets\hardware\`: 30 hardware product photos and cutouts.
- `d:\my web\assets\video_thumbs_webm\`: 42 PNG poster frames.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Transparent WebM VP9 Alpha Rendering | Zero-halo, zero-border transparent video playback over dark background | M1 | Survey / R1 |
| 2 | 3-Tier 60+ FPS Video Scrubbing Pipeline | RAF lerping + seek-locking (`isSeeking` + `pendingTime`) to eliminate decoder lag | M1 | Survey / R1 |
| 3 | Dual-Control 5-State Physics Machine | Reconcile scroll vs turntable drag vs slider scrub vs Play Cinema with priority lock | M1 | Survey / R3 |
| 4 | Transparent Poster & Shielding Architecture | Zero layout shifts or dark background flicker on initial load and model swaps | M1 | Survey / R1 |
| 5 | Project 2 Sneaker Transparent Video Stage | Dedicated `<video id="snk-video">` in `#snk-render-box` for 360° rotation | M2 | Survey / R2 |
| 6 | Project 2 Flagship Sneaker Mapping | Map all 6 sneaker models to dedicated 360° rotation WebM VP9 Alpha videos | M2 | Survey / R2 |
| 7 | Project 2 Dual-Control Scroll & Turntable | Scroll drives video time & angle; drag/pills take priority, then return to scroll | M2 | Survey / R3 |
| 8 | Project 3 Hardware Video Layer Unification | Ensure `.hw-video-layer` is visible (`opacity: 1`) and clean in 360 & X-Ray modes | M3 | Survey / R2 |
| 9 | Project 3 19-Model Hardware Catalog Mapping | Transparent video playback for all 19 models across 4 categories | M3 | Survey / R2 |
| 10 | Project 3 Teardown Scrubbing & Cinema Mode | Scroll scrubs 0% (assembled) to 100% (exploded), manual slider & Play Cinema sync | M3 | Survey / R2, R3 |
| 11 | Project 3 Category & Model Switch Transitions | Switching tabs/models immediately updates transparent video with zero flicker | M3 | Survey / R2, R3 |
| 12 | Byte-for-Byte File Synchronization | Guarantee `index.html` and `personal_brand_v4.html` remain 100% byte-for-byte identical | M1-M4 | Survey / R3 |
| 13 | E2E Testing Suite (Tiers 1-4) | Systematic opaque-box test suite for visual transparency, scrub, and sync | E2E Track | Requirements |
| 14 | Adversarial Hardening & Forensic Audit | Tier 5 adversarial testing, runtime 60+ FPS verification, and integrity audit | M4 | Requirements |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Video Engine & Physics Architecture | 3-Tier non-blocking scrub engine, 5-state priority machine, poster shielding, byte-sync | none | DONE |
| M2 | Project 2 (Sneakers) Transparent Video Integration | `<video id="snk-video">`, 6 sneaker models mapping, 360° scroll rotation & drag | M1 | DONE |
| M3 | Project 3 (Hardware) 19-Model Video & Teardown | Unify video layer, 19 models across 4 categories, dual-mode scrub, cinema play | M1 | DONE |
| M4 | E2E Test Pass, Adversarial Hardening & Audit | 100% pass of E2E suite (Tiers 1-4), Tier 5 adversarial hardening, forensic audit | M2, M3, E2E | IN_PROGRESS |

## Interface Contracts
### `VideoScrubEngine`
- `constructor(videoElement, options: { fps = 60, lerpFactor = 0.12, quantizeDelta = 0.038 })`
- `setTargetProgress(progress: number)`: Ingests normalized scroll progress $[0, 1]$.
- `seekImmediate(timeInSeconds: number)`: Manual drag/slider immediate seek.
- `playAutonomous()`: Cinema playback mode.
- `pauseAutonomous()`: Pauses video and blends back to scroll progress over 300ms.
- `loadSource(srcWebm: string, srcMp4?: string, poster?: string)`: Smooth swap with layout containment and metadata priming.

### `DualControlPhysics`
- State: `IDLE_SCROLL_DRIVEN (0)` | `MANUAL_TURNTABLE_DRAG (1)` | `MANUAL_TIMELINE_SLIDER (2)` | `CINEMA_PLAYBACK (3)` | `INERTIA_COOLDOWN (4)`
- `notifyUserInteracting()`: Sets 1,800ms cooldown lock.
- `notifyScroll()`: If cinema playing, pause and return to scroll tracking over 300ms window; if user manual interacting, ignore scroll.
