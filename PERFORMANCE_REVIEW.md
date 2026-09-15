# Local performance and stability review

Branch: `fix/performance-and-runtime-stability`

Production deployment is pending the owner's visual approval. No push, merge,
or deployment was performed as part of this review.

## Changes

- Share a visibility-aware animation scheduler across the hero, portal,
  sneakers, and solar system. Cap decorative scenes at 60 FPS on desktop,
  30 FPS on touch/small screens, and 15 FPS with reduced motion. Suspend
  rendering offscreen and in hidden tabs; bound simulation time on resume.
- Prepare the solar scene when approaching its viewport, rather than building
  its WebGL scene and loading textures during initial page startup.
- Remove the solar point light's six-face shadow-map render pass. Sunlight
  materials still provide day/night shading. Move the asteroid belt as a group
  instead of uploading hundreds of instance matrices every frame. Reduce
  mobile pixel density and asteroid count.
- Cache portal text glyphs as small bitmaps, remove per-thread shadow blur,
  and stop rewriting parallax transforms once the pointer settles.
- Stop the custom cursor's animation when it settles. Avoid stacking magnetic
  hover tweens and skip solar raycasting outside its canvas.
- Keep native mobile scrolling over the sneaker and solar views. Ordinary
  desktop wheel input scrolls the page; Ctrl/Command + wheel or fullscreen
  controls solar zoom. Fullscreen retains touch orbit controls.
- Make solar pause stop axial rotation, moon rotation, and cloud drift too.
- Rebuild localized text animations after translation and dispose their old
  ScrollTriggers. Handle denied browser storage and close short-lived language
  switch audio contexts.
- Keep the two HTML entrypoints byte-for-byte identical. Exclude review outputs
  and chat backups from Git and Cloudflare asset uploads.

## Measurements

Local Chrome headless, 1365 x 900 desktop and 393 x 852 mobile emulation,
two-second steady-state samples. This machine delivered approximately 240
animation callbacks per second, making excess render work easy to observe.

| Canvas | Desktop before / after | Mobile before / after |
| --- | ---: | ---: |
| Portal dynamic layers, each | 424 / 121 redraws | 372 / 60 redraws |
| Sneaker particle layer | 482 / 120 redraws | 482 / 60 redraws |

Portal redraws decreased by about 71% on desktop and 84% in mobile emulation.
These are render-work counts, not claims of equivalent total CPU savings or
guaranteed FPS on physical phones. Screenshots and raw measurements are kept
locally in `.performance-review/` and are excluded from publication.

## Validation

- `node tests/animation-runtime.test.mjs`: four tests covering offscreen
  suspension, tab hiding/resume, duplicate scheduling, high-refresh frame caps,
  and deferred initialization.
- Inline scripts pass `node --check`; HTML mirrors are identical.
- `python tests/performance_browser.py`: desktop/mobile section measurements,
  screenshots, no JavaScript errors, and no horizontal overflow in measured
  sections.
- `python tests/portfolio_browser_smoke.py`: current-site interaction coverage:
  three languages with stable ScrollTrigger counts across repeated changes,
  six portal destinations, six products and 36 angle selections, planet focus,
  pause/overview, desktop wheel input, explicit mobile touch events, responsive
  widths, reduced motion, and denied localStorage.
- Legacy `node tests/e2e/run_tests.js`: **85 passed, 35 failed both on main and
  this branch**. Those tests target the retired transparent-video/hardware
  catalogue implementation; they are not a passing gate for today's portfolio.

Browser tests require Python Playwright and installed Chrome on Windows.
They exercise localhost only and do not publish the site. Start a local server:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Preview: http://127.0.0.1:8765/

## Owner review

Review the first-page globe, portal transitions, product controls, solar focus
and zoom, and scrolling on the intended devices. Physical iOS Safari and Android
devices have not been tested in this environment. Deployment remains pending
explicit owner approval.
