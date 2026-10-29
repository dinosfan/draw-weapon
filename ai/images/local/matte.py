"""Remove rectangular light backdrops while retaining enclosed effect highlights."""
import numpy as np
from PIL import Image

def rectangular_mattes(image, remove=False):
    data = np.array(image.convert('RGBA'))
    height, width = data.shape[:2]
    def opaque(x, y):
        return 0 <= x < width and 0 <= y < height and data[y, x, 3] >= 96
    def light(x, y):
        rgb = data[y, x, :3].astype(int)
        return opaque(x, y) and rgb.min() >= 185 and rgb.max()-rgb.min() <= 75
    def neutral(x, y):
        rgb = data[y, x, :3].astype(int)
        return opaque(x, y) and rgb.max()-rgb.min() <= 35
    heights = [0]*width
    boxes = set()
    for y in range(height):
        heights = [h+1 if opaque(x, y) else 0 for x, h in enumerate(heights)]
        stack = []
        for x in range(width+1):
            h = heights[x] if x < width else 0
            start = x
            while stack and stack[-1][1] > h:
                left, hh = stack.pop()
                start = left
                if x-left >= max(12, width*.18) and hh >= max(12, height*.18) and (x-left)*hh >= width*height*.05:
                    boxes.add((left, y-hh+1, x-1, y))
            if h and (not stack or stack[-1][1] < h):
                stack.append((start, h))
    issues = []
    for left, top, right, bottom in sorted(boxes, key=lambda b: -(b[2]-b[0]+1)*(b[3]-b[1]+1)):
        border = [(x, y) for x in range(left, right+1) for y in (top, bottom)] + [(x, y) for y in range(top, bottom+1) for x in (left, right)]
        outside = [(x, y) for x in range(left, right+1) for y in (top-1, bottom+1)] + [(x, y) for y in range(top, bottom+1) for x in (left-1, right+1)]
        if not all(opaque(x, y) for x, y in border) or sum(not opaque(x, y) for x, y in outside)/len(outside) < .72:
            continue
        lights = [(x, y) for x, y in border if light(x, y)]
        buckets = {}
        for x, y in border:
            key = tuple(int(v)//32 for v in data[y, x, :3])
            buckets[key] = buckets.get(key, 0)+1
        flat = max(buckets.values())/len(border) >= .55
        if len(lights)/len(border) < .25 and sum(neutral(x, y) for x, y in border)/len(border) < .8 and not flat:
            continue
        if remove and len(lights)/len(border) >= .25:
            stack = list(lights)
            seen = set(lights)
            while stack:
                x, y = stack.pop()
                data[y, x, 3] = 0
                for nx, ny in [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]:
                    if max(0, left-2) <= nx <= min(width-1, right+2) and max(0, top-2) <= ny <= min(height-1, bottom+2) and (nx, ny) not in seen and light(nx, ny):
                        seen.add((nx, ny))
                        stack.append((nx, ny))
        else:
            issues.append({'box': [left, top, right, bottom]})
            break
    return Image.fromarray(data), issues

def _clear_white_mattes_once(image):
    image, _ = rectangular_mattes(image, remove=True)
    data = np.array(image.convert('RGBA'))
    rgb = data[:, :, :3].astype(int)
    white = (data[:, :, 3] >= 96) & (rgb.min(2) >= 185) & ((rgb.max(2)-rgb.min(2)) <= 75)
    height, width = white.shape
    seen = np.zeros_like(white)
    for y, x in zip(*np.where(white)):
        if seen[y, x]:
            continue
        stack = [(x, y)]
        seen[y, x] = True
        points = []
        while stack:
            px, py = stack.pop()
            points.append((px, py))
            for nx, ny in [(px+1, py), (px-1, py), (px, py+1), (px, py-1)]:
                if 0 <= nx < width and 0 <= ny < height and white[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((nx, ny))
        left = min(p[0] for p in points)
        right = max(p[0] for p in points)
        top = min(p[1] for p in points)
        bottom = max(p[1] for p in points)
        w, h = right-left+1, bottom-top+1
        members = set(points)
        straight = 0
        for yy in range(top, bottom+1):
            for dy in (-1, 1):
                run = 0
                for xx in range(left, right+1):
                    run = run+1 if (xx, yy) in members and (xx, yy+dy) not in members else 0
                    straight = max(straight, run)
        for xx in range(left, right+1):
            for dx in (-1, 1):
                run = 0
                for yy in range(top, bottom+1):
                    run = run+1 if (xx, yy) in members and (xx+dx, yy) not in members else 0
                    straight = max(straight, run)
        small_patch = max(1, min(3, min(w, h)//3))
        corners = [(left, top, 1, 1), (right, top, -1, 1), (left, bottom, 1, -1), (right, bottom, -1, -1)]
        filled_corners = sum(sum((cx+x*dx, cy+y*dy) in members for y in range(small_patch) for x in range(small_patch))/(small_patch*small_patch) >= .5 for cx, cy, dx, dy in corners)
        exposed = any(not (0 <= px+dx < width and 0 <= py+dy < height) or data[py+dy, px+dx, 3] < 96 for px, py in points for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)])
        if len(points) >= width*height*.003 and min(w, h) >= 3 and len(points)/(w*h) >= .25 and filled_corners >= 1 and straight >= max(6, min(width, height)*.08) and exposed:
            for px, py in points:
                data[py, px, 3] = 0
            continue
        if len(points) >= width*height*.015 and min(w, h) >= 3 and straight >= max(12, min(width, height)*.25):
            for px, py in points:
                data[py, px, 3] = 0
            continue
        if len(points) < width*height*.06 or w < width*.22 or h < height*.22 or len(points)/(w*h) < .55:
            continue
        patch = max(2, int(min(w, h)*.06+.5))
        corners = [(left, top, 1, 1), (right, top, -1, 1), (left, bottom, 1, -1), (right, bottom, -1, -1)]
        if not all(sum((cx+x*dx, cy+y*dy) in members for y in range(patch) for x in range(patch))/(patch*patch) >= .5 for cx, cy, dx, dy in corners):
            continue
        for px, py in points:
            data[py, px, 3] = 0
    return Image.fromarray(data)

def clear_white_mattes(image):
    # Re-detect after each removal: artwork can split a backdrop into overlapping pieces.
    for _ in range(4):
        before = np.array(image.convert('RGBA'))[:, :, 3]
        image = _clear_white_mattes_once(image)
        if np.array_equal(before, np.array(image)[:, :, 3]):
            break
    return image

def transparency_issues(image):
    _, issues = rectangular_mattes(image)
    before = np.array(image.convert('RGBA'))[:, :, 3]
    after = np.array(clear_white_mattes(image))[:, :, 3]
    if np.any(before > after):
        issues.append({'reason': 'residual matte fragments'})
    return issues
