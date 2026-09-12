# Explorer Survey 2: Media, 3D & Video Assets Comprehensive Catalog Report

## Executive Summary
This investigation performed an exhaustive, read-only survey of all video, 3D model, and image assets in `d:\my web` to support the integration of scroll-driven transparent video playback for Project 2 (Luxury Sneakers Atelier) and Project 3 (Cyber Studio Hardware).

Key findings:
1. **Total Video Assets**: Exactly **42 unique video animations** exist in the project, provided in parallel formats:
   - `assets/videos_webm/*.webm` (42 files, 99.43 MB total): **Google VP9 with native Alpha channel** (`ALPHA_MODE: 1`, `yuva420p`), confirmed 100% transparent background (`A=0`).
   - `assets/videos/*.mp4` (42 files, 110.99 MB total): **H.264 / AVC ChromaKey** (`yuv420p`), with bright green screen background (`R=6..8, G=136..137, B=47`).
   - `assets/video_thumbs_webm/*.png` (42 files, 8.11 MB): 1280x720 32-bit RGBA PNG poster images (all have opaque backgrounds, `A=255`).
   - `assets/video_thumbs/*.jpg` (42 files, 1.92 MB): 1280x720 JPEG ChromaKey green screen thumbnails.
2. **Asset Categorization (Rotation vs. Teardown)**:
   - **Project 2 (Luxury Sneakers Atelier)**: **12 360° rotation videos** depicting luxury sneaker models (Balenciaga Runner, Maison Margiela Replica GAT, Palm Angels Flame Low, Asics/Bottega Runner, Off-White Low).
   - **Project 3 (Cyber Studio Hardware)**: **30 Exploded Teardown / Disassembly videos** covering all 4 hardware categories (8 Headphones, 7 Mice, 7 Speakers, 7 Keyboards, plus 1 general mouse teardown).
   - **Crucial Clarification**: There are **no 360° rotation videos for hardware models** (all 12 rotation videos are sneakers). Hardware 360° rotation in `index.html` is currently implemented via 2D static images on a CSS 3D-transformed DOM container.
3. **Model Accounting**:
   - **Hardware (19 models)**: All 19 models in `HARDWARE_CATALOG` (`index.html:8810-9255`) are fully accounted for with dedicated or curated high-definition exploded teardown videos mapped in the code.
   - **Sneakers (6 flagship models)**: All 6 sneaker models (`palm-angels`, `balenciaga`, `margiela`, `rick-owens`, `off-white`, `bottega`) have 30 multi-angle transparent PNG photos (5 angles per sneaker) in `assets/sneakers/`, and corresponding 360° rotation videos in `assets/videos_webm/`.
4. **3D Models**: No `.glb`, `.gltf`, `.obj`, or `.fbx` 3D geometry files exist in the repository; the "3D" experience is powered by the scroll-scrubbed transparent WebM video animations and multi-angle sprite transforms.

---

## 1. Observation

### 1.1 Directory Structure & Media Inventory
Inspecting `d:\my web\assets` revealed 6 structured subdirectories:
```
assets/
├── hardware/           30 .png files (21.02 MB) — Flagship product photos and video captures
├── sneakers/           30 .png files (10.76 MB) — 6 models x 5 angles (profile, front3q, toe, heel, top)
├── videos/             42 .mp4 files + 1 .jpeg file (110.99 MB) — ChromaKey green screen videos
├── videos_webm/        42 .webm files (99.43 MB) — VP9 Alpha transparent videos
├── video_thumbs/       42 .jpg files (1.92 MB) — Green screen JPEG thumbnails
└── video_thumbs_webm/  42 .png files (8.11 MB) — 1280x720 PNG posters
```
Root directory also contains one loose frame capture:
- `d:\my web\videoframe_11402.png` (123,489 bytes)
- `d:\my web\assets\videos\Computer_mouse_centered_in_frame_20260912183603.jpeg` (558,119 bytes)

### 1.2 Video Codec & Alpha Channel Stream Probing
Running `ffprobe` and Python Pillow decoder analysis on `assets/videos_webm/*.webm` and `assets/videos/*.mp4`:

- **WebM Stream Probing (`libvpx-vp9`)**:
  ```json
  "streams": [
    {
      "index": 0,
      "codec_name": "vp9",
      "codec_long_name": "Google VP9",
      "width": 1280,
      "height": 720,
      "pix_fmt": "yuva420p",
      "r_frame_rate": "24/1",
      "tags": {
        "HANDLER_NAME": "VideoHandler",
        "ENCODER": "Lavc63.1.101 libvpx-vp9",
        "ALPHA_MODE": "1",
        "DURATION": "00:00:10.000000000"
      }
    }
  ]
  ```
  - **Decoded Background Pixel Test**:
    ```python
    im = Image.open('test_frame_libvpx.png')
    pixel_10_10 = im.getpixel((10, 10))
    # Result: (4, 22, 46, 0) -> Alpha = 0 (100% transparent!)
    ```
- **MP4 Stream Probing (`h264`)**:
  ```json
  "streams": [
    {
      "index": 0,
      "codec_name": "h264",
      "width": 1280,
      "height": 720,
      "pix_fmt": "yuv420p",
      "r_frame_rate": "24/1",
      "duration": "10.000000"
    }
  ]
  ```
  - **Decoded Background Pixel Test**:
    ```python
    pixel_10_10 = im.getpixel((10, 10))
    # Result: (6, 136, 47, 255) -> Pure ChromaKey Green Screen!
    ```

### 1.3 Poster & Image Transparency Verification
- `assets/video_thumbs_webm/*.png` (42 files): All 42 files were checked via PIL extrema; all have `min_alpha = 255`. They contain solid dark backgrounds `(4, 22, 46)`, not transparent backgrounds.
- `assets/sneakers/*.png` (30 files): All 30 files are 100% transparent cutouts (`min_alpha = 0`).
- `assets/hardware/*.png` (30 files):
  - 17 files are transparent PNG cutouts (e.g., `apple_airpods_max.png`, `devialet_phantom_i.png`, `logitech_mx_master_3s.png`, `angry_miao_am_hatsu.png`, etc.).
  - 13 files are 1280x720 video frame grabs with opaque dark background (`A=255`) (e.g., `bose_qc_ultra.png`, `sony_wh1000xm5.png`, `logitech_gpro_x.png`, `sonos_era_300.png`, `jbl_flip_6.png`, etc.).

### 1.4 Code Synchronization Verification
`fc.exe /b "d:\my web\index.html" "d:\my web\personal_brand_v4.html"` returned:
`FC: no differences encountered` (100% byte-for-byte identical, 415,787 bytes each).

---

## 2. Complete Asset Catalog (All 42 Videos)

### Group A: Project 2 — Luxury Sneakers Atelier (12 360° Rotation Videos)
All 12 files feature a luxury sneaker rotating 360° around its vertical axis across 10 seconds (240 frames at 24 fps).

| # | Video Base Name | WebM Size | MP4 Size | Depicted Sneaker Model | Visual Characteristics |
|---|---|---|---|---|---|
| 1 | `360-degree_product_showcase_video_20260912183607` | 2.81 MB | 3.81 MB | Balenciaga Runner 3XL | Distressed white/silver runner, "42" heel stamp, rear 360 rotation |
| 2 | `360-degree_product_video_generat_20260912183607` | 2.79 MB | 3.27 MB | Balenciaga Runner X | Technical mesh runner with exterior "43" stamp on toe box, front 360 |
| 3 | `360_degree_product_showcase_video_20260912183605` | 1.68 MB | 1.87 MB | Maison Margiela / Off-White | Minimalist low-top leather trainer with lateral chevron patch |
| 4 | `360_degree_product_showcase_video_20260912183606` | 2.24 MB | 2.53 MB | Palm Angels Flame Low | White calfskin upper with lateral leather flame appliqué and green heel badge |
| 5 | `Product_360-degree_rotation_video_20260912183605` | 1.56 MB | 1.54 MB | Maison Margiela Replica GAT | Suede T-toe, white nappa upper, gum sole, rear 360 rotation |
| 6 | `Product_360-degree_rotation_video_20260912183605_2` | 1.61 MB | 1.74 MB | Maison Margiela Replica GAT | German Army Trainer side profile, 360 horizontal rotation |
| 7 | `Product_360_degree_rotation_video_20260912183606` | 1.76 MB | 2.29 MB | Maison Margiela Replica GAT | Heritage gum sole, white basting stitch, clean side rotation |
| 8 | `Product_360_degree_rotation_video_20260912183607` | 2.92 MB | 3.68 MB | Balenciaga Runner Distressed | Multi-panel raw-edge runner, 3/4 quarter angle 360 rotation |
| 9 | `Product_360_degree_showcase_video_20260912183605` | 1.98 MB | 1.83 MB | Palm Angels Flame Low | Focus on red heel tab and sole profile in 360 rotation |
| 10 | `Product_360_degree_showcase_video_20260912183606` | 2.61 MB | 2.52 MB | Asics / Bottega Orbit Runner | Aerodynamic metallic tape cage runner, profile 360 rotation |
| 11 | `Product_360_degree_video_showcase_20260912183605` | 1.55 MB | 1.52 MB | Rick Owens Geobasket Low | Minimalist brutalist low silhouette, dark shadow leather profile |
| 12 | `Product_360_degree_video_showcase_20260912183605_2` | 1.64 MB | 2.07 MB | Maison Margiela Replica GAT | Full side profile studio rotation on transparent ground |

---

### Group B: Project 3 — Cyber Studio Hardware (30 Exploded Teardown Videos)
All 30 files feature hardware products scrubbing from assembled state at $t=0\text{s}$ to fully exploded mechanical teardown at $t=5\text{s}..10\text{s}$.

#### Category 1: Headphones (8 Videos)
| # | Video Base Name | WebM Size | MP4 Size | Mapped In Code? | Target Hardware Model |
|---|---|---|---|---|---|
| 13 | `Apple_AirPods_Max_Exploded_View_20260912183607` | 2.50 MB | 3.17 MB | Yes (`apple-airpods-max`) | Apple AirPods Max (Ear cups, H1 SiP, canopy) |
| 14 | `Bose_QuietComfort_Ultra_Exploded_View_20260912183606` | 2.50 MB | 2.71 MB | Yes (`bose-qc-ultra`) | Bose QuietComfort Ultra (Bio-cellulose driver, ANC) |
| 15 | `Sennheiser_HD_660S2_Exploded_View_20260912183606` | 2.72 MB | 2.99 MB | Yes (`sennheiser-hd660s2`) | Sennheiser HD 660S2 (Steel mesh, voice coil, transducer) |
| 16 | `Sony_WH-1000XM5_Exploded_View_20260912183606` | 2.32 MB | 2.54 MB | Yes (`sony-wh1000xm5`) | Sony WH-1000XM5 (Carbon fiber dome, V1 processor) |
| 17 | `Headphones_exploded_view_animation_20260912183607` | 2.85 MB | 3.21 MB | Yes (`bo-h95`) | Bang & Olufsen Beoplay H95 (Curated luxury teardown) |
| 18 | `Sony_headphones_exploded_view_an_20260912183606` | 2.33 MB | 2.80 MB | Alternate | Sony Headphones alternate exploded view |
| 19 | `Headphones_exploded-view_visuali_20260912183606` | 2.40 MB | 2.62 MB | Alternate | Generic luxury headphone teardown (Focal Bathys match) |
| 20 | `Headphones_exploding_view_animation_20260912183607` | 2.49 MB | 2.99 MB | Alternate | Over-ear open-back teardown (Sennheiser HD820 match) |

#### Category 2: Precision Mice (7 Videos)
| # | Video Base Name | WebM Size | MP4 Size | Mapped In Code? | Target Hardware Model |
|---|---|---|---|---|---|
| 21 | `Apple_Magic_Mouse_2_Exploded_20260912183605` | 2.06 MB | 1.85 MB | Yes (`apple-magic-mouse-2`) | Apple Magic Mouse 2 (Acrylic shell, touch sensor) |
| 22 | `Logitech_G_Pro_X_Superlight_20260912183605` | 2.10 MB | 2.08 MB | Yes (`logitech-gpro-x`) | Logitech G Pro X Superlight 2 (HERO 2, Lightforce) |
| 23 | `Razer_DeathAdder_V3_Pro_Exploded_20260912183606` | 2.26 MB | 2.57 MB | Yes (`razer-deathadder-v3`) | Razer DeathAdder V3 Pro (Focus Pro 30K, optical switches) |
| 24 | `ZOWIE_EC2-CW_Exploded_View_20260912183606` | 2.31 MB | 2.13 MB | Yes (`zowie-ec2-cw`) | ZOWIE EC2-CW Wireless (Esports chassis, 3370 sensor) |
| 25 | `Mouse_disassembly_product_visual_20260912183605` | 1.97 MB | 2.22 MB | Yes (`logitech-mx-master-3s`) | Logitech MX Master 3S (Ergonomic thumb-rest, MagSpeed) |
| 26 | `Exploded_view_computer_mouse_ani_20260912183605` | 2.09 MB | 1.97 MB | Alternate | Symmetrical honeycomb mouse (Finalmouse UltralightX) |
| 27 | `Exploded_view_computer_mouse_video_20260912183606` | 2.16 MB | 2.01 MB | Alternate | Lightweight gaming mouse (Razer Viper Mini SE) |

#### Category 3: Hi-Fi Speakers (7 Videos)
| # | Video Base Name | WebM Size | MP4 Size | Mapped In Code? | Target Hardware Model |
|---|---|---|---|---|---|
| 28 | `Sonos_Era_300_Exploded_View_20260912183607` | 3.01 MB | 3.18 MB | Yes (`sonos-era-300`) | Sonos Era 300 (Hourglass waveguide, 6 driver array) |
| 29 | `Marshall_Stanmore_III_Exploded_View_20260912183607` | 3.29 MB | 3.54 MB | Yes (`marshall-stanmore-3`) | Marshall Stanmore III (Cabinet, woofer, tweeters) |
| 30 | `JBL_Flip_6_Exploded_View_20260912183607` | 2.71 MB | 3.04 MB | Yes (`jbl-flip-6`) | JBL Flip 6 (Racetrack woofer, passive radiators) |
| 31 | `Bose_SoundLink_Revolve_II_Exploded_20260912183607` | 2.73 MB | 2.91 MB | Yes (`bose-revolve-2`) | Bose SoundLink Revolve+ II (Omni deflector, transducers) |
| 32 | `Speaker_exploded-view_product_vi_20260912183606` | 2.67 MB | 2.90 MB | Yes (`devialet-phantom-i`) | Devialet Phantom I 108dB (HBI woofers, ADH core) |
| 33 | `JBL_speaker_exploded_view_animation_20260912183607` | 2.77 MB | 3.09 MB | Alternate | Portable cylindrical speaker alternate teardown |
| 34 | `Speaker_disassembly_product_visu_20260912183606` | 2.10 MB | 2.24 MB | Alternate | Acoustic chamber teardown (KEF LS50 / Beosound A9) |

#### Category 4: Mechanical Keyboards (7 Videos)
| # | Video Base Name | WebM Size | MP4 Size | Mapped In Code? | Target Hardware Model |
|---|---|---|---|---|---|
| 35 | `Keychron_Q1_Pro_Exploded_View_20260912183607` | 2.92 MB | 3.75 MB | Yes (`keychron-q1-pro`) | Keychron Q1 Pro (Double gasket, CNC aluminum, PCB) |
| 36 | `Logitech_G915_TKL_Exploded_View_20260912183606` | 2.75 MB | 2.79 MB | Yes (`logitech-g915-tkl`) | Logitech G915 TKL (Low profile GL switches, top plate) |
| 37 | `Apple_Magic_Keyboard_Exploded_View_20260912183607` | 2.74 MB | 3.16 MB | Yes (`apple-magic-keyboard`) | Apple Magic Keyboard with Touch ID (Scissor switch, unibody) |
| 38 | `Razer_Huntsman_V3_Pro_Exploded_20260912183606` | 2.75 MB | 2.65 MB | Yes (`razer-huntsman-v3`) | Razer Huntsman V3 Pro (Gen-2 analog optical switches) |
| 39 | `Logitech_G915_keyboard_exploded_20260912183607` | 2.93 MB | 3.58 MB | Alternate | Full-size Logitech G915 layout exploded teardown |
| 40 | `Exploded_view_of_keyboard_animation_20260912183607` | 2.97 MB | 3.49 MB | Alternate | Custom mechanical keyboard switch/keycap/chassis stack |
| 41 | `Keyboard_exploded-view_product_v_20260912183607` | 2.85 MB | 3.54 MB | Alternate | Low profile keyboard teardown (Angry Miao AM Hatsu) |

#### Extra Disassembly Video (1 Video)
| # | Video Base Name | WebM Size | MP4 Size | Category | Description |
|---|---|---|---|---|---|
| 42 | `Exploded-view_product_visualizat_20260912183606` | 2.43 MB | 2.73 MB | Precision Mice | Exploded mouse chassis, PCB sensor, scroll wheel assembly |

---

## 3. Logic Chain: Analysis & Inferences

1. **Premise 1 (R1 & R2 Requirements)**: The user requested seamless scroll-driven scrubbing of background-removed transparent product videos (WebM VP9 Alpha & ChromaKey) for Project 2 (Sneakers Atelier) and Project 3 (Cyber Studio Hardware: 19 models).
2. **Observation 1**: In `index.html` (lines 8810-9255), `HARDWARE_CATALOG` defines exactly 19 models:
   - 5 Headphones, 5 Mice, 5 Speakers, 4 Keyboards ($5 + 5 + 5 + 4 = 19$).
   - Every one of the 19 models already has:
     ```javascript
     video: "assets/videos_webm/<Name>.webm",
     videoMp4: "assets/videos/<Name>.mp4",
     thumb: "assets/video_thumbs_webm/<Name>.png",
     thumbJpg: "assets/video_thumbs/<Name>.jpg"
     ```
3. **Observation 2**: All 42 `.webm` files were tested with `ffprobe` and `libvpx-vp9`. All 42 contain `ALPHA_MODE: 1` and `yuva420p` pixel format. Every pixel sampled outside the product silhouette returned `A=0` (completely transparent).
4. **Observation 3**: All 42 `.mp4` files contain `yuv420p` with a bright green background (`R=6..8, G=136..137, B=47`), confirming they are ChromaKey videos intended for green-screen shader/canvas fallback.
5. **Observation 4**: The 42 videos contain exactly 12 360° rotation videos and 30 exploded teardown videos. By visual frame inspection (`view_file`), all 12 360° rotation videos are luxury sneaker models (Balenciaga Runner, Margiela GAT, Palm Angels Flame, Asics/Bottega Runner, Off-White/Rick Owens).
6. **Observation 5**: In Project 2 (`#sneaker-app` in `index.html`), the viewer is currently an `<img>` tag (`snk-photo-render`) that swaps 5 static PNGs on angle change (`getSneakerPhotoData()`). The 12 available 360° sneaker rotation videos are **not yet connected** into `#sneaker-app`.
7. **Observation 6**: In Project 3 (`#hardware-app` in `index.html`), `<video id="hw-xray-video">` exists and scrubs on scroll during X-Ray Teardown mode, but in 360° Turntable mode, it falls back to a 2D image (`#hw-main-img`) rotated via CSS 3D matrix. Because there are no 360° rotation videos for hardware models in the asset inventory, hardware 360° rotation must continue using the 3D-transformed high-resolution cutouts or canvas turntable.
8. **Observation 7**: The poster images in `assets/video_thumbs_webm/*.png` have opaque black/navy backgrounds (`A=255`). Setting them as `poster=""` on transparent video elements could cause a flash of dark background before the transparent video frames render. A transparent 1x1 data URI or transparent SVG poster is recommended.

---

## 4. Caveats & Edge Cases

1. **No Hardware 360° Rotation Videos**: The original request mentions "360° rotation & exploded teardowns" for Project 3 hardware models. However, the physical filesystem only contains exploded teardown videos for hardware. All 12 360° rotation videos in `assets/videos_webm/` depict sneakers. Hardware 360° rotation must remain driven by 3D CSS transforms or WebGL/Canvas rendering of the hardware PNG cutouts.
2. **Sneaker Video Mapping**: The 12 sneaker rotation videos have generic names (e.g. `Product_360_degree_rotation_video_20260912183606`). They map visually to Balenciaga Runner (Videos 1, 2, 8, 10), Margiela GAT (Videos 5, 6, 7, 12), Palm Angels (Videos 4, 9), and Off-White / Rick Owens (Videos 3, 11).
3. **Poster Opacity**: Because `assets/video_thumbs_webm/*.png` are opaque, they should not be placed over the transparent showcase stages without alpha transparency handling or instant video frame priming.
4. **Hardware Image Alpha**: In `assets/hardware/`, 17 images are transparent cutouts and 13 are 1280x720 opaque frames. For the 13 opaque items, the WebM VP9 video itself has the true transparent cutout.

---

## 5. Conclusion & Actionable Recommendations

1. **Project 3 (Cyber Studio Hardware)**:
   - All 19 hardware models are fully mapped to high-definition transparent WebM VP9 exploded teardown videos (`assets/videos_webm/*.webm`) with MP4 ChromaKey fallbacks (`assets/videos/*.mp4`).
   - The scroll-scrubbing engine for X-Ray Teardown is already functioning in `handleScrollLinkUpdate()` in `index.html:9824`.
   - In 360° Turntable mode, the 19 models should continue using the 3D inertial drag rig with contact shadows.
2. **Project 2 (Luxury Sneakers Atelier)**:
   - Connect the 12 transparent WebM 360° rotation videos to `#sneaker-app`.
   - On page scroll through Project 2, scrub the transparent video timeline in direct proportion to scroll progress (`currentTime = progress * video.duration`), while preserving pointer drag scrubbing.
   - Retain the 30 multi-angle PNGs in `assets/sneakers/` as instant fallbacks.
3. **File Synchronization**:
   - `personal_brand_v4.html` and `index.html` are currently identical. Any future edits by implementation agents must be synced byte-for-byte between both files.

---

## 6. Verification Method

To independently verify these findings, run the following PowerShell and ffprobe commands:

```powershell
# 1. Verify exact count of 42 WebM and 42 MP4 video files:
(Get-ChildItem "d:\my web\assets\videos_webm" -Filter *.webm).Count # Output: 42
(Get-ChildItem "d:\my web\assets\videos" -Filter *.mp4).Count      # Output: 42

# 2. Verify VP9 Alpha transparency on any WebM video:
ffprobe -v error -show_entries stream=codec_name,pix_fmt -show_entries stream_tags=ALPHA_MODE -of json "d:\my web\assets\videos_webm\Apple_AirPods_Max_Exploded_View_20260912183607.webm"
# Expected: codec_name = "vp9", ALPHA_MODE = "1", pix_fmt = "yuva420p" (with libvpx-vp9)

# 3. Verify ChromaKey green background on MP4 video:
ffmpeg -i "d:\my web\assets\videos\Apple_AirPods_Max_Exploded_View_20260912183607.mp4" -vframes 1 -f rawvideo -pix_fmt rgb24 - | python -c "import sys; data = sys.stdin.buffer.read(3); print('RGB at (0,0):', list(data))"
# Expected: G ~ 136-137, R,B < 15

# 4. Verify byte-for-byte identity of index.html and personal_brand_v4.html:
fc.exe /b "d:\my web\index.html" "d:\my web\personal_brand_v4.html"
# Expected: "FC: no differences encountered"
```
