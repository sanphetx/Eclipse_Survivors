"""Build idle(4) / walk(4) / swipe(3) frames for the user's 64x64 mage sprite.

All motion is done by moving/redrawing pixel regions of the user's own sprite;
the fire in the hand is redrawn procedurally each frame using the sprite's
own flame palette so it flickers.
"""
import math
import sys

import numpy as np
from PIL import Image

SRC = sys.argv[1]
OUT = sys.argv[2] if len(sys.argv) > 2 else "."

orig = np.array(Image.open(SRC).convert("RGBA"))
H, W = orig.shape[:2]
R, G, B, A = [orig[..., i].astype(int) for i in range(4)]
yy, xx = np.mgrid[0:H, 0:W]

# ---------------------------------------------------------------- flame mask
flame_col = (A > 0) & (R > 170) & (B < 110) & (R - B > 110)
outline_red = (A > 0) & (R > 120) & (G < 70) & (B < 40)  # dark red flame edge pixels
flame_zone = ((xx >= 41) & (yy <= 31)) | ((xx >= 50) & (yy <= 46) & (yy >= 32))
flame_mask = (flame_col | outline_red) & flame_zone
base = orig.copy()
base[flame_mask] = 0

# palette from the sprite's own flame, dark -> bright
FLAME = [
    (0x84, 0x10, 0x06), (0xF3, 0x2E, 0x00), (0xFD, 0x59, 0x01), (0xFE, 0x80, 0x02),
    (0xFE, 0xA5, 0x03), (0xFF, 0xD4, 0x14), (0xFE, 0xF4, 0x54), (0xFE, 0xFB, 0xAC),
]

PALM = (48.5, 31.0)  # where the flame sits in the hand


def noise1(x, seed):
    return math.sin(x * 1.7 + seed * 12.9898) * 0.5 + math.sin(x * 0.63 + seed * 3.1) * 0.5


def draw_flame(img, t, size=1.0, lean=0.0, origin=PALM, streak=0.0, embers=True):
    """Procedural pixel flame. t: animation phase 0..1. streak>0 stretches it sideways (swipe)."""
    ox, oy = origin
    height = 24 * size
    out = img
    field = np.zeros((H, W), dtype=np.float32)
    for y in range(H):
        h = oy - y  # height above palm
        if h < -2 or h > height + 2:
            continue
        p = max(0.0, h / height)  # 0 bottom .. 1 tip
        sway = (3.0 * math.sin(t * 2 * math.pi + p * 4.0) * p) + lean * p * 6
        cx = ox + sway + 2.5 * p  # original flame curls up-right
        width = (8.0 * size) * math.sin(min(1.0, (p + 0.12)) * math.pi) * (1.0 - 0.35 * p)
        width *= 1 + 0.18 * noise1(y * 0.9, t * 7)
        for x in range(W):
            d = abs(x - cx) / max(width, 0.6)
            v = (1 - d) * (1.15 - 0.75 * p)
            if v > field[y, x]:
                field[y, x] = v
    if streak > 0:  # fire flung forward from the hand: straight tapered burst to the right
        reach = min(W - 1 - ox, 13 * streak)
        for y in range(H):
            for x in range(W):
                dx = x - ox
                if -1 <= dx <= reach:
                    q = max(0.0, dx / max(reach, 1))
                    half = 3.6 * (1 - 0.55 * q) + 0.6
                    dy = abs(y - (oy - 4))
                    v = (1 - dy / half) * (1.25 - 0.45 * q)
                    field[y, x] = max(field[y, x], v)
    # posterize into the flame palette
    levels = [0.05, 0.16, 0.28, 0.4, 0.52, 0.66, 0.8, 0.92]
    for lv, col in zip(levels, FLAME):
        m = field > lv
        out[m, 0], out[m, 1], out[m, 2], out[m, 3] = col[0], col[1], col[2], 255
    if embers:
        rng = np.random.default_rng(int(t * 1000) + 7)
        for _ in range(4):
            ex = int(ox + rng.integers(-3, 10))
            ey = int(oy - height * rng.uniform(0.4, 1.15) - rng.integers(0, 3))
            if 0 <= ex < W and 0 <= ey < H and out[ey, ex, 3] == 0:
                col = FLAME[rng.integers(2, 6)]
                out[ey, ex] = (*col, 255)
    return out


def shift_region(img, x0, y0, x1, y1, dx, dy, fill_from_left=True):
    """Move the opaque pixels of a rectangle by (dx,dy). Vacated pixels inside the
    silhouette are filled with the colour to their left so no holes appear."""
    src = img.copy()
    block = src[y0:y1, x0:x1].copy()
    region_opaque = block[..., 3] > 0
    # clear the block
    img[y0:y1, x0:x1][region_opaque] = 0
    if fill_from_left:
        for y in range(y0, y1):
            for x in range(x0, x1):
                if src[y, x, 3] > 0 and img[y, x, 3] == 0:
                    lx = x - 1
                    while lx >= 0 and img[y, lx, 3] == 0 and lx > x0 - 6:
                        lx -= 1
                    if lx >= 0 and img[y, lx, 3] > 0 and lx >= x0 - 6:
                        img[y, x] = img[y, lx]
    ys, xs = np.where(region_opaque)
    for yb, xb in zip(ys, xs):
        ty, tx = y0 + yb + dy, x0 + xb + dx
        if 0 <= ty < H and 0 <= tx < W:
            img[ty, tx] = block[yb, xb]
    return img


def bob(img, dy, split=52):
    """Move everything above row `split` by dy (body breathing / step bob)."""
    out = img.copy()
    if dy == 0:
        return out
    top = img[:split].copy()
    out[:split] = 0
    if dy > 0:
        out[dy:split + dy] = np.where(top[..., 3:4] > 0, top, out[dy:split + dy])
    else:
        out[:split + dy] = top[-dy:]
        out[split + dy:split] = np.where(img[split + dy:split, ..., 3:4] > 0, img[split + dy:split], 0)
    return out


CAPE = (6, 36, 23, 58)       # trailing cape + left hand
FOOT_L = (12, 55, 28, 64)
FOOT_R = (29, 55, 44, 64)
ARM = (40, 27, 57, 42)       # right forearm + hand

frames = {"idle": [], "walk": [], "swipe": []}

# ---------------------------------------------------------------- idle (4)
for i in range(4):
    f = base.copy()
    f = shift_region(f, *CAPE, dx=-1 if i in (1, 2) else 0, dy=0)
    f = bob(f, 1 if i in (1, 2) else 0)
    pal = (PALM[0], PALM[1] + (1 if i in (1, 2) else 0))
    f = draw_flame(f, i / 4, size=1.0, origin=pal)
    frames["idle"].append(f)

# ---------------------------------------------------------------- walk (4)
steps = [(0, 0, 0), (3, -3, 1), (0, 0, 0), (-3, 3, 1)]  # left foot dx, right foot dx, body bob
for i, (lf, rf, bb) in enumerate(steps):
    f = base.copy()
    f = shift_region(f, *FOOT_L, dx=lf, dy=0, fill_from_left=False)
    f = shift_region(f, *FOOT_R, dx=rf, dy=0, fill_from_left=False)
    f = shift_region(f, *CAPE, dx=-1 if i % 2 else 1, dy=0)
    f = bob(f, bb)
    pal = (PALM[0], PALM[1] + bb)
    f = draw_flame(f, i / 4 + 0.13, size=0.85, lean=-0.25, origin=pal)
    frames["walk"].append(f)

# ---------------------------------------------------------------- swipe (3)
swipe = [  # arm dx, arm dy, flame size, streak, body lean
    (-2, 1, 0.55, 0.0, 0),   # wind-up: hand pulled back, fire gathers
    (3, 0, 0.2, 1.0, 1),     # swipe: hand flicks forward, fire slashes out
    (1, 0, 0.7, 0.0, 0),     # follow-through
]
for i, (adx, ady, fs, st, lean) in enumerate(swipe):
    f = base.copy()
    if lean:
        f = shift_region(f, 20, 2, 46, 40, dx=1, dy=0)  # head/torso lean forward
    f = shift_region(f, *ARM, dx=adx, dy=ady)
    pal = (PALM[0] + adx, PALM[1] + ady)
    f = draw_flame(f, 0.3 + i * 0.27, size=fs, origin=pal, streak=st, embers=i != 0)
    frames["swipe"].append(f)


def save_strip(name, fr):
    sheet = np.concatenate(fr, axis=1)
    Image.fromarray(sheet, "RGBA").save(f"{OUT}/mage_{name}.png")


for k, v in frames.items():
    save_strip(k, v)

# preview: 3 rows, 6x scale, on dark bg
S = 6
rows = []
for k in ("idle", "walk", "swipe"):
    fr = frames[k] + [np.zeros_like(base)] * (4 - len(frames[k]))
    rows.append(np.concatenate(fr, axis=1))
grid = np.concatenate(rows, axis=0)
img = Image.fromarray(grid, "RGBA").resize((grid.shape[1] * S, grid.shape[0] * S), Image.NEAREST)
bg = Image.new("RGBA", img.size, (38, 36, 50, 255))
bg.alpha_composite(img)
bg.save(f"{OUT}/preview_frames.png")

# animated GIF preview
gif = []
seq = [("idle", 8, 0.18), ("walk", 8, 0.12), ("swipe", 6, 0.08)]
for name, loops, _ in seq:
    fr = frames[name]
    for j in range(loops if name != "swipe" else 2):
        for f in fr:
            im = Image.fromarray(f, "RGBA").resize((256, 256), Image.NEAREST)
            b = Image.new("RGBA", im.size, (38, 36, 50, 255))
            b.alpha_composite(im)
            gif.append(b.convert("RGB"))
    if name == "swipe":
        for f in frames["idle"] * 2:
            im = Image.fromarray(f, "RGBA").resize((256, 256), Image.NEAREST)
            b = Image.new("RGBA", im.size, (38, 36, 50, 255))
            b.alpha_composite(im)
            gif.append(b.convert("RGB"))
gif[0].save(f"{OUT}/preview_mage.gif", save_all=True, append_images=gif[1:], duration=130, loop=0)
print("ok")
