import os, glob, subprocess
from PIL import Image

rot_names = [
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

print("Extracting frames at 1s, 4s, 7s to identify sneaker models...")
for idx, r in enumerate(rot_names, 1):
    webm = f"d:/my web/assets/videos_webm/{r}.webm"
    out1 = f"d:/my web/.agents/explorer_survey_2/f_{idx:02d}_1s.png"
    out4 = f"d:/my web/.agents/explorer_survey_2/f_{idx:02d}_4s.png"
    subprocess.run(['ffmpeg', '-y', '-c:v', 'libvpx-vp9', '-ss', '00:00:01.000', '-i', webm, '-vframes', '1', '-pix_fmt', 'rgba', out1], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(['ffmpeg', '-y', '-c:v', 'libvpx-vp9', '-ss', '00:00:04.000', '-i', webm, '-vframes', '1', '-pix_fmt', 'rgba', out4], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("Done extracting frames.")
