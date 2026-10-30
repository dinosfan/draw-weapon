"""Keep source pixels; fit an entire animation with one shared center and scale."""
import math
import numpy as np
from PIL import Image
from matte import clear_white_mattes


def extract_frames(image):
    tiles, source_edges = [], []
    radius = 1
    for index in range(4):
        x, y = index % 2 * image.width // 2, index // 2 * image.height // 2
        tile = image.crop((x, y, x + image.width // 2, y + image.height // 2)).convert('RGBA')
        data = np.array(tile)
        rgb = data[:, :, :3].astype(float)
        green = (rgb[:, :, 1] > 70) & (rgb[:, :, 1] > rgb[:, :, 0] * 1.25) & (rgb[:, :, 1] > rgb[:, :, 2] * 1.25)
        data[green, 3] = 0
        tile = clear_white_mattes(Image.fromarray(data))
        opaque = np.array(tile)[:, :, 3] >= 96
        source_edges.append(int(opaque[0, :].sum() + opaque[-1, :].sum() + opaque[:, 0].sum() + opaque[:, -1].sum()))
        box = tile.getbbox()
        if box:
            radius = max(radius, abs(box[0] - tile.width / 2), abs(box[2] - tile.width / 2), abs(box[1] - tile.height / 2), abs(box[3] - tile.height / 2))
        tiles.append(tile)
    # Preserve small effects' size, and avoid zooming each phase independently.
    radius = max(math.ceil(radius) + 8, math.ceil(min(image.size) / 4) - 12)
    frames = []
    for tile in tiles:
        cx, cy = tile.width // 2, tile.height // 2
        # Resampling can turn sub-threshold flecks into a detectable matte patch.
        # Clean at the final resolution too, before both inspection and packing.
        frames.append(clear_white_mattes(tile.crop((cx - radius, cy - radius, cx + radius, cy + radius)).resize((96, 96), Image.Resampling.NEAREST)))
    return frames, source_edges
