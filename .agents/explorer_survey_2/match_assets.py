import os, glob
import numpy as np
from PIL import Image

def get_feature(img_path):
    im = Image.open(img_path).convert('RGB').resize((64, 64))
    arr = np.array(im, dtype=np.float32)
    return arr / 255.0

# Load hardware references
hw_refs = {}
for p in glob.glob('d:/my web/assets/hardware/*.png'):
    name = os.path.splitext(os.path.basename(p))[0]
    hw_refs[name] = get_feature(p)

# Load sneaker references
snk_refs = {}
for p in glob.glob('d:/my web/assets/sneakers/*.png'):
    name = os.path.splitext(os.path.basename(p))[0]
    snk_refs[name] = get_feature(p)

all_thumbs = sorted(glob.glob('d:/my web/assets/video_thumbs_webm/*.png'))

print(f"{'Thumbnail':50} | {'Best Hardware Match':30} (Dist) | {'Best Sneaker Match':30} (Dist)")
print("-" * 125)

for t in all_thumbs:
    t_name = os.path.splitext(os.path.basename(t))[0]
    t_feat = get_feature(t)
    
    # Best hw
    best_hw, min_hw_dist = None, 999999.0
    for h_name, h_feat in hw_refs.items():
        d = np.mean((t_feat - h_feat)**2)
        if d < min_hw_dist:
            min_hw_dist = d
            best_hw = h_name
            
    # Best snk
    best_snk, min_snk_dist = None, 999999.0
    for s_name, s_feat in snk_refs.items():
        d = np.mean((t_feat - s_feat)**2)
        if d < min_snk_dist:
            min_snk_dist = d
            best_snk = s_name
            
    print(f"{t_name[:48]:50} | {best_hw:30} ({min_hw_dist:.4f}) | {best_snk:30} ({min_snk_dist:.4f})")
