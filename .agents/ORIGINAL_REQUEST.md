# Original User Request

## Initial Request — 2026-09-12T20:01:34+05:00

Connect and configure all background-removed transparent product videos (WebM VP9 Alpha & ChromaKey) directly into the portfolio project showcases, so that scrolling the page smoothly scrubs and drives the video animations (360° rotation & exploded teardowns) for each matching item.

Working directory: d:\my web
Integrity mode: development

## Requirements

### R1. Primary Scroll-Driven Transparent Video Engine
The product showcase stages must use the background-removed transparent videos (WebM Alpha) as the core interactive visual medium. As the user scrolls through each project section on the page, the video playback timeline (`currentTime`) must scrub smoothly in direct proportion to scroll progress at 60+ FPS with zero stutter, zero black borders, and zero green fringing.

### R2. Seamless Product-to-Video Mapping
Every product model across the showcase categories must be mapped to its dedicated transparent video:
- **Project 2 (Luxury Sneakers Atelier)**: Real-time 360° multi-angle scroll rotation for all flagship sneaker models.
- **Project 3 (Cyber Studio Hardware)**: Dedicated transparent video playback for all 19 models across 4 categories (`Headphones`, `Precision Mice`, `Hi-Fi Speakers`, `Mechanical Keyboards`), featuring both 360° rotation and Exploded Teardown scrubbing on scroll.

### R3. Dual-Control Physics & Interactive Fallback
Seamlessly handle user interactions:
- When scrolling, scroll progress drives video time and turntable angle.
- When the user manually drags the 3D turntable, scrubs the timeline slider, or clicks `▶ PLAY CINEMA`, manual control takes immediate priority without conflict, and gracefully returns to scroll-tracking when scrolling resumes.
- Ensure 100% byte-for-byte synchronization between `personal_brand_v4.html` and `index.html`.

## Acceptance Criteria

### Visual & Transparency Integrity
- [ ] All product videos display with 100% transparent backgrounds over the dark luxury theme (no green halos, no bounding box artifacts).
- [ ] Poster images and initial video frames load instantly with zero layout shifts or visual flicker.

### Scroll-Driven Performance
- [ ] Scrolling down the page progressively scrubs the transparent video from 0% (assembled) to 100% (exploded teardown) and rotates the 3D model.
- [ ] Video playback interpolation is smooth and responsive to fast and slow scroll speeds.

### Interactive Synchronization
- [ ] Switching between category tabs or product models immediately loads the matching transparent video and connects it to the scroll engine.
- [ ] Zero JavaScript console errors; 100% byte-for-byte identity between `personal_brand_v4.html` and `index.html`.
