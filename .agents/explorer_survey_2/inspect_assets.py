import glob, os
from PIL import Image

pngs = glob.glob('d:/my web/assets/hardware/*.png')
for p in sorted(pngs):
    im = Image.open(p)
    name = os.path.basename(p)
    is_trans = (im.mode == 'RGBA') and (im.getextrema()[3][0] < 255)
    status = "TRANSPARENT" if is_trans else "OPAQUE"
    print(f"{name:30} : {status} (mode: {im.mode}, size: {im.size})")
