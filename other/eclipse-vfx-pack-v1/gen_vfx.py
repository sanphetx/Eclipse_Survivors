"""Original pixel-art VFX spritesheet generator for Eclipse Survivors.

Every effect is drawn procedurally as an intensity field per frame, then
posterized into a small palette so it reads as crisp pixel art (no
anti-aliasing). Output: one horizontal strip PNG per effect + vfx_manifest.json.
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(os.path.join(OUT, "sheets"), exist_ok=True)


def hexc(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def grid(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x - (w - 1) / 2.0, y - (h - 1) / 2.0


def value_noise(w, h, cell, seed):
    rng = np.random.default_rng(seed)
    gw, gh = w // cell + 2, h // cell + 2
    g = rng.random((gh, gw)).astype(np.float32)
    ys = np.linspace(0, gh - 1.001, h)
    xs = np.linspace(0, gw - 1.001, w)
    y0 = ys.astype(int)
    x0 = xs.astype(int)
    fy = (ys - y0)[:, None]
    fx = (xs - x0)[None, :]
    a = g[y0][:, x0]
    b = g[y0][:, x0 + 1]
    c = g[y0 + 1][:, x0]
    d = g[y0 + 1][:, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def posterize(field, palette, thresholds):
    """field 0..1 -> RGBA. palette[i] used where field > thresholds[i] (desc)."""
    h, w = field.shape
    img = np.zeros((h, w, 4), dtype=np.uint8)
    for col, th in sorted(zip(palette, thresholds), key=lambda p: p[1]):
        img[field > th] = col
    return img


def strip(frames):
    h, w, _ = frames[0].shape
    sheet = np.zeros((h, w * len(frames), 4), dtype=np.uint8)
    for i, f in enumerate(frames):
        sheet[:, i * w:(i + 1) * w] = f
    return sheet


def ease_out(t):
    return 1 - (1 - t) ** 2


manifest = {}


def save(name, frames, fps, loop, anchor, blend, desc):
    sheet = strip(frames)
    Image.fromarray(sheet, "RGBA").save(os.path.join(OUT, "sheets", f"{name}.png"))
    h, w, _ = frames[0].shape
    manifest[name] = {
        "file": f"sheets/{name}.png",
        "frameWidth": w,
        "frameHeight": h,
        "frames": len(frames),
        "fps": fps,
        "loop": loop,
        "anchor": anchor,
        "blend": blend,
        "description": desc,
    }


# ---------------------------------------------------------------- 1. slash
def slash_crescent(name, pal, th, desc, seed=1):
    W = H = 96
    X, Y = grid(W, H)
    r = np.hypot(X, Y)
    ang = np.arctan2(Y, X)  # -pi..pi, 0 = right
    noise = value_noise(W, H, 6, seed)
    frames = []
    n = 6
    for i in range(n):
        t = i / (n - 1)
        sweep_end = -1.9 + 3.6 * ease_out(min(1, t * 1.6))  # leading edge
        span = 2.4 * (1 - 0.55 * t)
        start = sweep_end - span
        a = (ang - start) / max(span, 1e-3)  # 0 tail .. 1 head
        inside = (a >= 0) & (a <= 1)
        radius = 34
        thick = 3 + 9 * a * (1 - t * 0.6)  # thick at head, thin tail
        band = 1 - np.abs(r - radius) / np.maximum(thick, 0.5)
        f = np.clip(band, 0, 1) * inside * (0.35 + 0.65 * a)
        f *= 1.15 - 0.9 * t
        f += (noise - 0.5) * 0.12 * inside
        # sparks trailing outside the arc on late frames
        if t > 0.3:
            sp = (value_noise(W, H, 3, seed + i) > 0.86) & (np.abs(r - radius - 10) < 5) & inside
            f = np.maximum(f, sp * (0.5 - 0.3 * t))
        frames.append(posterize(np.clip(f, 0, 1), pal, th))
    save(name, frames, 22, False, [0.5, 0.5], "lighter", desc)


slash_crescent(
    "slash_moon",
    [hexc("ffffff"), hexc("e9d5ff"), hexc("a78bfa"), hexc("5b21b6", 220)],
    [0.78, 0.55, 0.32, 0.14],
    "Moonshadow Assassin dash slash — purple-white crescent. Rotate to dash direction (frame faces right).",
)
slash_crescent(
    "slash_holy",
    [hexc("ffffff"), hexc("fef3c7"), hexc("fbbf24"), hexc("b45309", 220)],
    [0.78, 0.55, 0.32, 0.14],
    "Holy Bulwark sacred blade slash — gold crescent. Rotate to swing direction.",
    seed=7,
)

# ---------------------------------------------------------------- 2. hit spark


def hit_spark():
    W = H = 48
    X, Y = grid(W, H)
    r = np.hypot(X, Y)
    ang = np.arctan2(Y, X)
    frames = []
    n = 5
    for i in range(n):
        t = i / (n - 1)
        # 4-point star: angular width shrinks with distance -> pointed spikes
        main = np.abs(np.cos(2 * (ang + 0.785)))  # peaks at 45 deg offsets
        minor = np.abs(np.cos(2 * ang))
        length = 7 + 15 * ease_out(t)
        spike = np.clip(main ** 2 - r / length, 0, 1) * 1.8
        spike2 = np.clip(minor ** 2 - r / (length * 0.55), 0, 1) * 1.4
        core = np.clip(1 - r / (8 * (1 - t) + 0.5), 0, 1) * 1.4
        f = np.maximum.reduce([spike, spike2, core]) * (1.3 - 1.0 * t)
        if t > 0.2:
            ring = np.clip(1 - np.abs(r - (6 + 14 * t)) / 1.2, 0, 1) * (0.9 - 0.8 * t)
            ring *= (np.cos(ang * 6) > 0)  # broken ring = flying debris
            f = np.maximum(f, ring)
        frames.append(posterize(np.clip(f, 0, 1), [hexc("ffffff"), hexc("fef08a"), hexc("f59e0b", 230)], [0.6, 0.32, 0.12]))
    save("hit_spark", frames, 24, False, [0.5, 0.5], "lighter", "Generic impact spark for hits/crits. Tint-free; draw at hit point.")


hit_spark()

# ---------------------------------------------------------------- 3. explosion


def explosion(name, pal, th, desc, seed, smoke=True):
    W = H = 96
    X, Y = grid(W, H)
    r = np.hypot(X, Y)
    frames = []
    n = 8
    for i in range(n):
        t = i / (n - 1)
        nz = value_noise(W, H, 7, seed + i * 3)
        nz2 = value_noise(W, H, 4, seed + 100 + i)
        R = 8 + 34 * ease_out(t)
        edge = R * (0.82 + 0.36 * nz)
        f = np.clip(1 - r / np.maximum(edge, 1), 0, 1)
        heat = 1.25 - 1.15 * t  # cools over time
        f = f ** (0.6 + 0.8 * t) * heat + (nz2 - 0.5) * 0.15
        if t > 0.45:  # hollow out (smoke ring)
            hole = np.clip(1 - r / (R * (t - 0.35) * 1.2 + 1), 0, 1)
            f = f - hole * 0.9
        f = np.clip(f, 0, 1)
        img = posterize(f, pal, th)
        if smoke and t > 0.5:
            sm = (np.clip(1 - np.abs(r - R * 0.95) / 7, 0, 1) * (nz > 0.45) * (1.1 - t)) > 0.25
            sm = sm & (img[..., 3] == 0)
            img[sm] = hexc("3f3f46", 170)
        frames.append(img)
    save(name, frames, 16, False, [0.5, 0.55], "source-over", desc)


explosion(
    "explosion_fire",
    [hexc("ffffff"), hexc("fde047"), hexc("fb923c"), hexc("dc2626"), hexc("7f1d1d", 230)],
    [0.85, 0.65, 0.45, 0.25, 0.1],
    "Fire explosion — meteor, explosive barrel, Hellfire soul burst, supernova (scale up).",
    seed=11,
)
explosion(
    "explosion_hellfire",
    [hexc("fff7ed"), hexc("fb923c"), hexc("ea580c"), hexc("7c2d12"), hexc("1c1917", 235)],
    [0.85, 0.62, 0.42, 0.22, 0.08],
    "Demon Lord hellfire burst — orange-black flame. Soul explosion / Gate of Inferno.",
    seed=23,
)

# ---------------------------------------------------------------- 4. lightning


def lightning():
    W, H = 64, 128
    frames = []
    n = 6
    rng = np.random.default_rng(5)
    path = []
    x = W / 2
    for y in range(0, H - 14):
        if y % 6 == 0:
            x += rng.integers(-5, 6)
            x = min(max(x, 14), W - 14)
        path.append(x)
    branches = [(30, -1), (58, 1), (80, -1)]
    for i in range(n):
        t = i / (n - 1)
        f = np.zeros((H, W), dtype=np.float32)
        yy, xx = np.mgrid[0:H, 0:W]
        if t < 0.85:
            reveal = min(1, (i + 1) / 2)  # bolt drops in 2 frames
            maxy = int((H - 14) * reveal)
            thick = 2.6 if i in (1, 2) else 1.6
            for y in range(maxy):
                d = np.abs(xx[y] - path[y])
                f[y] = np.maximum(f[y], np.clip(1 - d / thick, 0, 1) + np.clip(1 - d / (thick * 3.2), 0, 1) * 0.45)
            if i >= 1:
                for by, dirn in branches:
                    bx = path[by]
                    for k in range(18):
                        yb = by + k
                        if yb >= maxy:
                            break
                        xb = bx + dirn * k * 0.8 + (k % 4 - 1.5)
                        d = np.abs(xx[yb] - xb)
                        f[yb] = np.maximum(f[yb], np.clip(1 - d / 1.2, 0, 1) * (1 - k / 22))
            f *= 1.2 - 0.7 * t
        # ground burst
        if i >= 1:
            gx, gy = path[-1], H - 12
            rr = np.hypot((xx - gx) * 0.8, (yy - gy) * 1.6)
            R = 4 + 20 * ease_out((i - 1) / (n - 2))
            burst = np.clip(1 - rr / R, 0, 1) * (1.3 - t)
            ring = np.clip(1 - np.abs(rr - R) / 1.5, 0, 1) * (1 - t)
            f = np.maximum.reduce([f, burst, ring])
        frames.append(posterize(np.clip(f, 0, 1), [hexc("ffffff"), hexc("fef9c3"), hexc("60a5fa"), hexc("1d4ed8", 220)], [0.7, 0.45, 0.25, 0.1]))
    save("lightning_strike", frames, 20, False, [0.5, 0.9], "lighter", "Lightning strike from sky; anchor is the ground impact point (bottom).")


lightning()

# ---------------------------------------------------------------- 5. ice nova


def ice_nova():
    W = H = 96
    X, Y = grid(W, H)
    r = np.hypot(X, Y)
    ang = np.arctan2(Y, X)
    frames = []
    n = 7
    for i in range(n):
        t = i / (n - 1)
        R = 6 + 36 * ease_out(t)
        ring = np.clip(1 - np.abs(r - R) / (3.5 - 2 * t), 0, 1) * (1.2 - t)
        # 8 diamond shards riding the ring
        shards = np.zeros_like(r)
        for k in range(8):
            a0 = k * math.pi / 4 + 0.2
            cx, cy = math.cos(a0) * (R + 3), math.sin(a0) * (R + 3)
            dx, dy = X - cx, Y - cy
            u = dx * math.cos(a0) + dy * math.sin(a0)
            v = -dx * math.sin(a0) + dy * math.cos(a0)
            d = np.abs(u) / 10 + np.abs(v) / 3.6
            shards = np.maximum(shards, np.clip(1 - d, 0, 1))
        shards *= 1.15 - 0.6 * t
        frost = ((value_noise(W, H, 3, 40 + i) > 0.82) & (r < R * 0.85)) * (0.55 - 0.5 * t)
        core = np.clip(1 - r / 9, 0, 1) * (1 - t * 2) * 1.3
        f = np.maximum.reduce([ring, shards, frost, core])
        frames.append(posterize(np.clip(f, 0, 1), [hexc("ffffff"), hexc("cffafe"), hexc("67e8f9"), hexc("0e7490", 200)], [0.72, 0.48, 0.26, 0.1]))
    save("ice_nova", frames, 16, False, [0.5, 0.5], "lighter", "Frost nova ring with 8 shards. Shatter reaction / Absolute Zero.")


ice_nova()

# ---------------------------------------------------------------- 6. magic circle (loop)


def magic_circle(name, pal, desc, seed):
    W = H = 96
    X, Y = grid(W, H)
    Yt = Y * 1.0
    r = np.hypot(X, Yt)
    ang = np.arctan2(Yt, X)
    frames = []
    n = 8
    rng = np.random.default_rng(seed)
    runes = rng.random(16)
    for i in range(n):
        rot = i / n * (2 * math.pi / 6)  # loops seamlessly (hexagram symmetry)
        f = np.zeros_like(r)
        f = np.maximum(f, np.clip(1 - np.abs(r - 42) / 1.3, 0, 1))
        f = np.maximum(f, np.clip(1 - np.abs(r - 36) / 1.0, 0, 1) * 0.8)
        f = np.maximum(f, np.clip(1 - np.abs(r - 20) / 1.0, 0, 1) * 0.9)
        # hexagram: two triangles inscribed in r=36
        for tri in range(2):
            for k in range(3):
                a1 = rot + tri * math.pi / 3 + k * 2 * math.pi / 3
                a2 = a1 + 2 * math.pi / 3
                p1 = np.array([math.cos(a1), math.sin(a1)]) * 36
                p2 = np.array([math.cos(a2), math.sin(a2)]) * 36
                d = p2 - p1
                L = np.hypot(*d)
                u = ((X - p1[0]) * d[0] + (Yt - p1[1]) * d[1]) / L
                v = np.abs((X - p1[0]) * d[1] - (Yt - p1[1]) * d[0]) / L
                seg = (u >= 0) & (u <= L)
                f = np.maximum(f, np.clip(1 - v / 1.0, 0, 1) * seg * 0.75)
        # rune ticks between r=36..42 rotating opposite
        ra = (ang - (-rot * 1.5)) % (2 * math.pi)
        slot = (ra / (2 * math.pi) * 16).astype(int) % 16
        frac = (ra / (2 * math.pi) * 16) % 1
        tick = (r > 37.5) & (r < 40.5) & (np.abs(frac - 0.5) < 0.18 + 0.12 * runes[slot])
        f = np.maximum(f, tick * 0.95)
        pulse = 0.85 + 0.15 * math.sin(i / n * 2 * math.pi)
        frames.append(posterize(np.clip(f * pulse, 0, 1), pal, [0.75, 0.45, 0.2]))
    save(name, frames, 10, True, [0.5, 0.5], "lighter",
         desc + " Draw on ground and squash Y by ISO_TILT (0.68) for 2.5D floor look.")


magic_circle("magic_circle_gold", [hexc("ffffff"), hexc("fde68a"), hexc("d97706", 200)],
             "Looping gold rune circle — Sanctum Saint sigil, Rite of the Seven Sins base, portals.", 3)
magic_circle("magic_circle_crimson", [hexc("ffe4e6"), hexc("fb7185"), hexc("9f1239", 210)],
             "Looping crimson rune circle — Vampire / Demon rituals, cursed statues.", 9)

# ---------------------------------------------------------------- 7. holy pillar


def holy_pillar():
    W, H = 64, 160
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx = (W - 1) / 2
    frames = []
    n = 7
    for i in range(n):
        t = i / (n - 1)
        width = (3 + 15 * math.sin(min(1, t * 1.5) * math.pi / 2)) * (1 - max(0, t - 0.6) * 2.2)
        width = max(width, 0.5)
        top = H * (1 - min(1, t * 2.5))  # beam descends from top in ~2 frames
        col = np.clip(1 - np.abs(xx - cx) / width, 0, 1) * (yy >= top)
        shimmer = value_noise(W, H, 5, 60 + i)
        col = col * (0.75 + 0.35 * shimmer)
        base_r = np.hypot((xx - cx) * 0.7, (yy - (H - 10)) * 2.0)
        base = np.clip(1 - base_r / (6 + 22 * ease_out(t)), 0, 1) * (1.2 - t)
        motes = (value_noise(W, H, 2, 80 + i) > 0.9) & (np.abs(xx - cx) < width + 8) & (yy > top)
        f = np.maximum.reduce([col * (1.25 - 0.8 * t), base, motes * (0.6 - 0.4 * t)])
        frames.append(posterize(np.clip(f, 0, 1), [hexc("ffffff"), hexc("fef3c7"), hexc("facc15"), hexc("a16207", 200)], [0.78, 0.55, 0.3, 0.12]))
    save("holy_pillar", frames, 14, False, [0.5, 0.94], "lighter", "Pillar of light from sky — Judgement Pillar, Saint ultimate finisher. Anchor = ground.")


holy_pillar()

# ---------------------------------------------------------------- 8. blood burst


def blood_burst():
    W = H = 64
    X, Y = grid(W, H)
    rng = np.random.default_rng(31)
    drops = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.6, 1.0), rng.uniform(1.2, 2.6)) for _ in range(14)]
    frames = []
    n = 6
    for i in range(n):
        t = i / (n - 1)
        f = np.zeros_like(X)
        core = np.clip(1 - np.hypot(X, Y) / (9 * (1 - t) + 1), 0, 1) * (1.2 - t)
        f = np.maximum(f, core)
        for a, spd, sz in drops:
            dist = 26 * spd * ease_out(t)
            gy = 10 * t * t  # gravity
            cx, cy = math.cos(a) * dist, math.sin(a) * dist + gy
            s = sz * (1 - 0.5 * t)
            d = np.hypot(X - cx, Y - cy)
            f = np.maximum(f, np.clip(1 - d / s, 0, 1) * 1.1)
        frames.append(posterize(np.clip(f, 0, 1), [hexc("fecdd3"), hexc("e11d48"), hexc("881337", 235)], [0.8, 0.4, 0.12]))
    save("blood_burst", frames, 18, False, [0.5, 0.5], "source-over", "Blood splatter — bleed pop, Crimson Feast drink, Blood Pact.")


blood_burst()

# ---------------------------------------------------------------- 9. void vortex (loop)


def void_vortex():
    W = H = 96
    X, Y = grid(W, H)
    r = np.hypot(X, Y)
    ang = np.arctan2(Y, X)
    frames = []
    n = 8
    for i in range(n):
        rot = i / n * (2 * math.pi / 3)  # 3 arms -> seamless loop
        spiral = np.cos(3 * (ang + rot) - r * 0.16)
        f = (spiral * 0.5 + 0.5) * np.clip(1 - r / 44, 0, 1) ** 0.7
        f = f * np.clip(r / 6, 0, 1)  # dark eye in centre
        rim = np.clip(1 - np.abs(r - 44) / 2, 0, 1) * 0.5
        f = np.maximum(f, rim)
        img = posterize(np.clip(f, 0, 1), [hexc("f5d0fe"), hexc("c026d3"), hexc("581c87"), hexc("1e1b4b", 200)], [0.82, 0.6, 0.38, 0.18])
        eye = r < 6
        img[eye] = hexc("09090b", 255)
        frames.append(img)
    save("void_vortex", frames, 12, True, [0.5, 0.5], "source-over", "Looping dark vortex — black hole, Gluttony maw, Sloth time field, portals.")


void_vortex()

# ---------------------------------------------------------------- 10. heal sparkle


def heal_sparkle():
    W, H = 48, 64
    rng = np.random.default_rng(77)
    parts = [(rng.uniform(-14, 14), rng.uniform(0, 1), rng.uniform(0.7, 1.3)) for _ in range(9)]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    cx = (W - 1) / 2
    frames = []
    n = 8
    for i in range(n):
        t = i / n
        f = np.zeros((H, W), dtype=np.float32)
        for px, ph, sc in parts:
            p = (t + ph) % 1.0
            x = cx + px + math.sin(p * 6 + px) * 2
            y = H - 6 - p * (H - 12)
            a = math.sin(p * math.pi)
            d1 = np.abs(xx - x) + np.abs(yy - y) * 2.2
            d2 = np.abs(xx - x) * 2.2 + np.abs(yy - y)
            plus = np.maximum(np.clip(1 - d1 / (3 * sc), 0, 1), np.clip(1 - d2 / (3 * sc), 0, 1))
            f = np.maximum(f, plus * a * 1.2)
        frames.append(posterize(np.clip(f, 0, 1), [hexc("ffffff"), hexc("86efac"), hexc("16a34a", 220)], [0.7, 0.4, 0.15]))
    save("heal_sparkle", frames, 12, True, [0.5, 0.9], "lighter", "Looping rising + sparkles — regen zones, flower field, sanctum heal. Anchor = feet.")


heal_sparkle()

with open(os.path.join(OUT, "vfx_manifest.json"), "w") as fh:
    json.dump(manifest, fh, indent=2)
print("generated", len(manifest), "effects")
