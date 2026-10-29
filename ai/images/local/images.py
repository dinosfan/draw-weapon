"""Private local reference preparation and four-by-four chroma/coverage checks."""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("mode", choices=["prepare", "inspect"])
parser.add_argument("folder")
parser.add_argument("--style")
parser.add_argument("--image")
args = parser.parse_args()
folder = Path(args.folder)
if args.mode == "prepare":
    drawing = Image.open(folder / "drawing.png").convert("RGBA")
    drawing.thumbnail((512, 512), Image.Resampling.LANCZOS)
    paper = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    paper.alpha_composite(drawing, ((512-drawing.width)//2, (512-drawing.height)//2))
    paper.convert("RGB").save(folder / "drawing-ref.png")
    style = Image.open(args.style).convert("RGBA").resize((512, 512), Image.Resampling.NEAREST)
    background = Image.new("RGBA", style.size, (0, 255, 0, 255))
    background.alpha_composite(style)
    background.convert("RGB").save(folder / "style-ref.png")
    print(json.dumps({"prepared": True}))
else:
    image = Image.open(args.image).convert("RGBA")
    low, coverage, edges = [], [], []
    for row in range(4):
        coverage.append([])
        edges.append([])
        for col in range(4):
            x, y, r, b = round(col*image.width/4), round(row*image.height/4), round((col+1)*image.width/4), round((row+1)*image.height/4)
            tile = image.crop((x+2,y+2,r-2,b-2)).resize((96,96),Image.Resampling.NEAREST)
            p = np.array(tile)
            visible = (p[:,:,3] >= 96) & ~((p[:,:,0] < 65) & (p[:,:,1] > 210) & (p[:,:,2] < 65))
            amount = float(visible.mean())
            edge = max(float(visible[:3,:].mean()),float(visible[-3:,:].mean()),float(visible[:,:3].mean()),float(visible[:,-3:].mean()))
            coverage[-1].append(round(amount,4))
            edges[-1].append(round(edge,4))
            if amount < 0.01 or amount > 0.95 or edge > 0.24:
                low.append({"row": row+1, "column": col+1, "coverage": round(amount,4), "reason": "empty" if amount < 0.01 else "background" if amount > 0.95 else "crossing-cell-border"})
    print(json.dumps({"valid": not low, "lowCells": low, "coverage": coverage,"edges":edges}))
