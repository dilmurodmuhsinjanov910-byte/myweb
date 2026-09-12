import os, glob
import numpy as np
from PIL import Image

def get_crop_feat(path):
    im = Image.open(path)
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    alpha = im.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return None
    crop = im.crop(bbox).resize((100, 100))
    arr = np.array(crop, dtype=np.float32) / 255.0
    # RGB weighted by Alpha
    rgb = arr[:, :, :3]
    a = arr[:, :, 3:4]
    return rgb * a

# Build hardware reference features
hw_feats = {}
for p in glob.glob('d:/my web/assets/hardware/*.png'):
    f = get_crop_feat(p)
    if f is not None:
        hw_feats[os.path.splitext(os.path.basename(p))[0]] = f

snk_feats = {}
for p in glob.glob('d:/my web/assets/sneakers/*.png'):
    f = get_crop_feat(p)
    if f is not None:
        snk_feats[os.path.splitext(os.path.basename(p))[0]] = f

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

print("Matching 12 rotation videos to Hardware and Sneakers...")
for idx in range(1, 13):
    rot_path = f"d:/my web/.agents/explorer_survey_2/rot_{idx:02d}.png"
    feat = get_crop_feat(rot_path)
    r_name = rot_names[idx - 1]
    
    # Best 2 hw matches
    hw_dists = []
    for h_name, h_f in hw_feats.items():
        d = np.mean((feat - h_f)**2)
        hw_dists.append((d, h_name))
    hw_dists.sort()
    
    # Best 2 snk matches
    snk_dists = []
    for s_name, s_f in snk_feats.items():
        d = np.mean((feat - s_f)**2)
        snk_dists.append((d, s_name))
    snk_dists.sort()
    
    print(f"[{idx:02d}] {r_name}")
    print(f"     Top HW : {hw_dists[0][1]} ({hw_dists[0][0]:.4f}), {hw_dists[1][1]} ({hw_dists[1][0]:.4f})")
    print(f"     Top Snk: {snk_dists[0][1]} ({snk_dists[0][0]:.4f}), {snk_dists[1][1]} ({snk_dists[1][0]:.4f})")
