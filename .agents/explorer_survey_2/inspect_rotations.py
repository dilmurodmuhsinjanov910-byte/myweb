import os, glob
from PIL import Image

thumbs = sorted(glob.glob('d:/my web/assets/video_thumbs_webm/*.png'))

print(f"Analyzing {len(thumbs)} thumbnails...")

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

print("\n--- 12 ROTATION VIDEOS ---")
for r in rotation_videos:
    thumb_path = f"d:/my web/assets/video_thumbs_webm/{r}.png"
    im = Image.open(thumb_path)
    print(f"{r}: Size {im.size}")
