import os, glob, subprocess
from PIL import Image

rotation_videos = [
    "360-degree_product_showcase_video_20260912183607",
    "360-degree_product_video_generat_20260912183607",
    "360_degree_product_showcase_video_20260912183605",
    "360_degree_product_showcase_video_20260912183606",
    "Product_360-degree_rotation_video_20260912183605",
    "Product_360-degree_rotation_video_20260912183605_2",
    "Product_360_degree_rotation_video_20260912183606",
    "Product_360_degree_rotation_video_20260912183607",
    "Product_360_degree_showcase_video_20260912183605",
    "Product_360_degree_showcase_video_20260912183606",
    "Product_360_degree_video_showcase_20260912183605",
    "Product_360_degree_video_showcase_20260912183605_2"
]

print("Extracting middle frames for 12 rotation videos...")
for idx, r in enumerate(rotation_videos, 1):
    webm = f"d:/my web/assets/videos_webm/{r}.webm"
    out_png = f"d:/my web/.agents/explorer_survey_2/rot_{idx:02d}.png"
    cmd = [
        'ffmpeg', '-y', '-c:v', 'libvpx-vp9', '-ss', '00:00:05.000',
        '-i', webm, '-vframes', '1', '-pix_fmt', 'rgba', out_png
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    im = Image.open(out_png)
    # Check bounding box of non-transparent pixels
    alpha = im.split()[-1]
    bbox = alpha.getbbox()
    print(f"[{idx:02d}] {r}: size={im.size}, alpha_bbox={bbox}")

