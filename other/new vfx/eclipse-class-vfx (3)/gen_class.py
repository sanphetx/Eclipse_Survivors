"""Original pixel-art class-skill VFX: Human classes + Archmage line."""
import os, sys, math, json
import numpy as np

SRC = open(os.path.join(os.path.dirname(__file__), "gen_mage.py"), encoding="utf-8").read()
helpers = SRC.split("# ---------------------------------------------------------------- spells")[0]
OUT = sys.argv[1] if len(sys.argv) > 1 else "out_class"
g = {"__file__": __file__}
sys.argv = [sys.argv[0], OUT]
exec(helpers, g)
globals().update({k: v for k, v in g.items() if not k.startswith("__")})


def P(*hexes):
    return [C(h) for h in hexes]


VIOLET = P("#1a0b2e", "#5b2a9e", "#b58cff", "#f4ecff")      # assassin
GOLD = P("#3d2a05", "#b07d12", "#ffd75e", "#fffbe0")        # holy
SKYGOLD = P("#0e2a4a", "#3b8fd9", "#ffd75e", "#ffffff")     # knight blades
SAINT = P("#3a2c08", "#d6a630", "#fff0a8", "#ffffff")
REDTAUNT = P("#3a0808", "#a3161a", "#ff5a4a", "#ffd0c8")
CHRONO = P("#0b1640", "#3550c8", "#9fd0ff", "#f0fbff")
DEATH = P("#06140f", "#17604a", "#6af0c0", "#e8fff6")
VOID = P("#0a0614", "#3a2a6e", "#c9b6ff", "#ffffff")
PRISM = P("#140a24", "#7a3cd6", "#7ff2ff", "#ffffff")


def save_c(name, frames, fps, loop, desc, blend="lighter", anchor=(0.5, 0.5), rot=False, cls=""):
    save(name, frames, fps, loop, desc, spell=None, blend=blend, anchor=anchor, rot=rot, group=cls)


# ---------------- generic extra archetypes
def dash_slash(pal, n=6, w=96, h=24):
    xx, yy = grid(w, h)
    out = []
    for i in range(n):
        t = i / (n - 1)
        head = -w / 2 + w * min(1, t * 1.6)
        tail = head - w * 0.9 * (1 - t * 0.6)
        seg = (xx <= head) & (xx >= tail)
        thick = (h / 2) * (0.9 * (1 - t) + 0.25) * np.clip((xx - tail) / max(head - tail, 1), 0, 1)
        f = np.clip(1 - np.abs(yy) / np.maximum(thick, 0.5), 0, 1) * seg * 1.3
        out.append(posterize(f, pal))
    return out


def afterimage(pal, n=4, w=24, h=32):
    out = []
    for i in range(n):
        img = np.zeros((h, w, 4), np.uint8)
        a = 255 - i * 55
        col = (*pal[2][:3], a)
        img[6:12, 9:15] = col               # head
        img[12:24, 7:17] = col              # cloak
        img[24:31, 8:11] = col; img[24:31, 13:16] = col
        img[13:15, 3:7] = (*pal[3][:3], a)  # blade
        out.append(img)
    return out


def charge_pips(pal, n=4, w=24, h=8):
    out = []
    for i in range(n):  # i = charges filled 0..3
        img = np.zeros((h, w, 4), np.uint8)
        for k in range(3):
            cx = 4 + k * 8
            img[2:6, cx - 2:cx + 2] = pal[3] if k < i else pal[1]
        out.append(outline(img))
    return out


def crescent_moon(pal, n=6, s=96):
    xx, yy = grid(s, s)
    out = []
    for i in range(n):
        r1 = np.hypot(xx, yy) / (s * 0.42)
        r2 = np.hypot(xx - s * 0.14, yy + s * 0.06) / (s * 0.38)
        moon = (r1 < 1) & (r2 > 1)
        glow = np.exp(-((r1 - 1) ** 2) / 0.02) * 0.5 * (0.8 + 0.2 * math.sin(i))
        f = np.maximum(moon * 1.2, glow)
        out.append(posterize(f, pal))
    return out


def floating_sword(pal, w=12, h=36, n=4):
    out = []
    for i in range(n):
        img = np.zeros((h, w, 4), np.uint8)
        bob = 1 if i in (1, 2) else 0
        cx = w // 2
        for y in range(2, 26):  # blade
            half = 2 if y > 5 else (y - 2) // 2
            img[y + bob, cx - half:cx + half + 1] = pal[2]
            img[y + bob, cx] = pal[3]
        img[26 + bob, 1:w - 1] = pal[1]       # guard
        img[27 + bob:33 + bob, cx - 1:cx + 2] = pal[0 if False else 1]
        img[33 + bob, cx - 2:cx + 3] = pal[2]  # pommel
        out.append(outline(img))
    return out


def giant_sword(pal, n=8, w=48, h=128):
    out = []
    base = floating_sword(pal, w=16, h=40, n=1)[0]
    from PIL import Image
    big = np.array(Image.fromarray(base).resize((48, 120), Image.NEAREST))
    for i in range(n):
        t = i / (n - 1)
        img = np.zeros((h, w, 4), np.uint8)
        drop = int(-120 + min(1, t * 2.2) * 120)  # sword top position
        vis = 120 + drop  # visible rows of the sword (bottom part)
        if vis > 0:
            img[0:vis, :] = big[120 - vis:120, :]
        if t > 0.45:  # impact flare
            xx, yy = grid(w, 16)
            flare = np.clip(1 - np.hypot(xx / (w / 2), yy / 7), 0, 1) * (1.5 - t)
            fl = posterize(flare, pal)
            m = fl[..., 3] > 0
            img[112:128][m] = fl[m]
        out.append(img)
    return out


def parry_flash(pal, n=5, s=56):
    xx, yy = grid(s, s)
    r = np.hypot(xx, yy) / (s / 2)
    ang = np.arctan2(yy, xx)
    out = []
    for i in range(n):
        t = i / (n - 1)
        ring = np.exp(-((r - (0.3 + 0.6 * t)) ** 2) / 0.008) * (1.3 - t)
        star = (np.cos(ang * 4) ** 60) * np.clip(1 - r / (0.9 - t * 0.5), 0, 1) * (1.4 - t)
        out.append(posterize(np.maximum(ring, star), pal))
    return out


def ground_mark(pal, n=8, s=48, sides=3, rune=True):
    xx, yy = grid(s, s)
    e = np.hypot(xx / (s / 2), yy / (s / 4))
    ang = np.arctan2(yy * 2, xx)
    out = []
    for i in range(n):
        t = i / n
        ring = np.exp(-((e - 0.85) ** 2) / 0.005)
        inner = np.exp(-((e - 0.55) ** 2) / 0.004) * 0.9
        poly = np.cos(sides * (ang + t * 2 * math.pi / sides)) > 0.96
        f = np.maximum.reduce([ring * 1.2, inner, poly * (e < 0.85) * 0.9])
        f *= 0.85 + 0.15 * math.sin(t * 2 * math.pi)
        out.append(posterize(f, pal))
    return out


def tri_field(pal, n=6, w=128, h=96):
    xx, yy = grid(w, h)
    pts = [(0, -h * 0.42), (-w * 0.44, h * 0.4), (w * 0.44, h * 0.4)]
    out = []
    for i in range(n):
        f = np.zeros_like(xx)
        inside = np.ones_like(xx, bool)
        for k in range(3):
            (x1, y1), (x2, y2) = pts[k], pts[(k + 1) % 3]
            dx, dy = x2 - x1, y2 - y1
            L = math.hypot(dx, dy)
            cross = (dx * (yy - y1) - dy * (xx - x1)) / L
            inside &= cross < 0
            along = ((xx - x1) * dx + (yy - y1) * dy) / L
            f = np.maximum(f, np.exp(-cross ** 2 / 2) * ((along > 0) & (along < L)) * 1.3)
        sparkle = noise(xx, yy, 0.35, i * 2.2) > 0.82
        f = np.maximum(f, inside * (0.2 + 0.03 * math.sin(i)) + sparkle * inside * 0.5)
        out.append(posterize(f, pal))
    return out


def taunt_roar(pal, n=6, s=96):
    xx, yy = grid(s, s // 2)
    e = np.hypot(xx / (s / 2), yy / (s / 4))
    out = []
    for i in range(n):
        t = i / (n - 1)
        f = sum(np.exp(-((e - ((t + k * 0.33) % 1)) ** 2) / 0.004) for k in range(3)) * (1.2 - t * 0.4)
        out.append(posterize(f, pal))
    return out


def clock_field(pal, n=8, s=96):
    xx, yy = grid(s, s)
    r = np.hypot(xx, yy) / (s / 2)
    ang = np.arctan2(yy, xx)
    out = []
    for i in range(n):
        t = i / n
        ring = np.exp(-((r - 0.9) ** 2) / 0.003) * 1.2
        ticks = (np.cos(ang * 12) > 0.97) & (r > 0.78) & (r < 0.9)
        hand1 = (np.abs(np.sin(ang - t * 2 * math.pi)) < 0.06) & (np.cos(ang - t * 2 * math.pi) > 0) & (r < 0.7)
        hand2 = (np.abs(np.sin(ang - t * 0.5 * math.pi)) < 0.09) & (np.cos(ang - t * 0.5 * math.pi) > 0) & (r < 0.45)
        tint = np.clip(1 - r, 0, 1) * 0.3
        f = np.maximum.reduce([ring, ticks * 1.1, hand1 * 1.3, hand2 * 1.3, tint])
        out.append(posterize(f, pal))
    return out


def scythe_nova(pal, n=7, s=96):
    xx, yy = grid(s, s)
    r = np.hypot(xx, yy) / (s / 2)
    ang = np.arctan2(yy, xx)
    out = []
    for i in range(n):
        t = i / (n - 1)
        rad = 0.2 + 0.75 * t
        local = (ang + t * 2.5) % (2 * math.pi / 3)
        blade = np.exp(-((r - rad) ** 2) / 0.006) * np.clip(1 - local / 1.4, 0, 1) * (1.4 - t * 0.6)
        out.append(posterize(blade, pal))
    return out


def soul_wisp(pal, n=6, w=16, h=24):
    xx, yy = grid(w, h)
    out = []
    for i in range(n):
        sway = math.sin(i / n * 2 * math.pi) * 1.2
        head = np.clip(1 - np.hypot(xx - sway, yy - 4) / 4, 0, 1) * 1.5
        tail = np.clip(1 - np.abs(xx - sway * (yy / 8)) / (3 - (yy + 10) / 10), 0, 1) * (yy > 3) * np.clip(1 - (yy - 3) / 8, 0, 1)
        out.append(posterize(np.maximum(head, tail), pal))
    return out


def element_wave(pal, n=6, w=64, h=48):
    xx, yy = grid(w, h)
    r = np.hypot(xx + w * 0.4, yy) / (w * 0.75)
    ang = np.arctan2(yy, xx + w * 0.4)
    out = []
    for i in range(n):
        t = i / (n - 1)
        rad = 0.55 + 0.4 * t
        arc = np.exp(-((r - rad) ** 2) / 0.006) * np.clip(1 - np.abs(ang) / 0.75, 0, 1) * (1.4 - t * 0.5)
        out.append(posterize(arc, pal))
    return out


def charge_spin(pal, n=8, s=96):
    xx, yy = grid(s, s)
    r = np.hypot(xx, yy) / (s / 2)
    ang = np.arctan2(yy, xx)
    out = []
    for i in range(n):
        t = i / (n - 1)
        if t < 0.5:  # charging: inward motes + thin ring
            ring = np.exp(-((r - 0.85) ** 2) / 0.002) * t * 2
            motes = (noise(xx, yy, 0.5, i) > 0.85) * np.exp(-((r - (0.9 - t)) ** 2) / 0.01)
            f = np.maximum(ring, motes * 1.3)
        else:  # release: full 360 slash
            k = (t - 0.5) * 2
            f = np.exp(-((r - (0.5 + 0.4 * k)) ** 2) / 0.008) * (1.4 - k * 0.8)
            f *= 0.6 + 0.4 * np.cos(ang * 2 - k * 6)
        out.append(posterize(f, pal))
    return out


def ascend_aura(pal, n=8, w=48, h=72):
    xx, yy = grid(w, h)
    out = []
    for i in range(n):
        t = i / n
        flame = np.clip(1 - np.abs(xx) / (w * 0.42 * (0.6 + 0.4 * (yy + h / 2) / h)), 0, 1)
        flick = noise(xx, yy + t * 40, 0.25, 3) * np.clip((yy + h / 2) / h, 0, 1)
        f = flame * (0.35 + 0.9 * flick)
        out.append(posterize(f, pal))
    return out


def wind_barrier(pal, n=8, s=72):
    xx, yy = grid(s, s)
    r = np.hypot(xx, yy) / (s / 2)
    ang = np.arctan2(yy, xx)
    out = []
    for i in range(n):
        ph = i / n * 2 * math.pi
        f = np.exp(-((r - 0.82) ** 2) / 0.006) * (0.6 + 0.6 * np.sin(ang * 3 + ph * 2)) * 1.2
        f = np.maximum(f, np.exp(-((r - 0.62) ** 2) / 0.004) * (0.5 + 0.5 * np.sin(-ang * 4 + ph * 3)))
        out.append(posterize(f, pal))
    return out


def void_infusion(pal, n=8, s=64):
    xx, yy = grid(s, s)
    r = np.hypot(xx, yy) / (s / 2)
    ang = np.arctan2(yy, xx)
    out = []
    for i in range(n):
        t = i / n
        spokes = (np.cos(ang * 8 + r * 6 - t * 6) > 0.8) * np.clip(1 - r, 0, 1) * 1.3
        ring = np.exp(-((r - (1 - t)) ** 2) / 0.006)
        out.append(posterize(np.maximum(spokes, ring * 1.2), pal))
    return out


# ================= HUMAN
for el, pal in [("main", VIOLET)]:
    save_c("hunter_shadow_slash", dash_slash(VIOLET), 20, False, "นักฆ่า: ฟันเงาตามแนวแดช (หมุนตามทิศแดช)", rot=True, cls="assassin")
save_c("hunter_afterimage", afterimage(VIOLET), 12, False, "นักฆ่า: ภาพติดตา 4 ระดับความจาง (วาดเฟรม 0→3 ตามระยะ)", blend="source-over", cls="assassin")
save_c("hunter_crit_spark", parry_flash(VIOLET, s=40), 20, False, "นักฆ่า: ประกายคริ/ลอบกัด", cls="assassin")
save_c("hunter_dash_charges", charge_pips(VIOLET), 1, False, "นักฆ่า: จุดชาร์จแดช (เฟรม = จำนวนชาร์จ 0–3)", blend="source-over", cls="assassin")
save_c("hunter_shadow_dagger", a_shard(VIOLET, w=16, h=8), 12, True, "นักฆ่า: มีดเงาจากคริ", rot=True, cls="assassin")
save_c("hunter_ult_moon", crescent_moon(VIOLET), 6, True, "นักฆ่า: พระจันทร์เสี้ยวพื้นหลังท่าราตรีพันเงา", cls="assassin")

save_c("knight_sacred_blade", floating_sword(SKYGOLD), 6, True, "อัศวิน: ดาบลอยศักดิ์สิทธิ์ (หมุนตามทิศพุ่ง)", blend="source-over", rot=True, cls="knight")
save_c("knight_blade_slash", a_slash(SKYGOLD, w=40, h=40), 18, False, "อัศวิน: รอยฟันของดาบลอย", cls="knight")
save_c("knight_parry", parry_flash(GOLD), 18, False, "อัศวิน: PARRY แสงทอง", cls="knight")
save_c("knight_bulwark_spin", a_orbit(SKYGOLD, s=80, blades=8), 16, False, "อัศวิน: ป้อมปราการ ดาบฟันวงรอบตัว", cls="knight")
save_c("knight_taunt", taunt_roar(REDTAUNT), 12, False, "อัศวิน: ทุบโล่ยั่วยุ (วงพื้น)", cls="knight")
save_c("knight_excalibur", giant_sword(GOLD), 14, False, "อัศวิน: เอ็กซ์แคลิเบอร์ตกจากฟ้า + แสงกระทบ", blend="source-over", anchor=(0.5, 1.0), cls="knight")

save_c("saint_sigil", ground_mark(SAINT), 10, True, "นักบุญ: ตราศักดิ์สิทธิ์บนพื้น", cls="saint")
save_c("saint_sanctum", tri_field(SAINT), 8, True, "นักบุญ: แดนสามเหลี่ยม (ยืด/หมุนให้ตรงกับ 3 ตรา)", cls="saint")
save_c("saint_sigil_beam", a_beam(SAINT, w=64, h=10), 14, True, "นักบุญ: ลำแสงจากตรายิงมอน", rot=True, cls="saint")
save_c("saint_golem", a_golem(P("#3a2c08", "#8a7a5a", "#d8c9a0", "#fff4c8")), 6, True, "นักบุญ: โกเล็มผู้พิทักษ์", blend="source-over", anchor=(0.5, 1.0), cls="saint")
save_c("saint_golem_taunt", taunt_roar(REDTAUNT, s=128), 12, False, "นักบุญ: โกเล็มคำรามยั่วยุ", cls="saint")
save_c("saint_judgement_pillar", a_pillar(SAINT, w=44, h=128), 16, False, "นักบุญ: เสาพิพากษา", anchor=(0.5, 1.0), cls="saint")

# ================= MAGE LINE
save_c("mage_void_infusion", void_infusion(VOID), 14, True, "จอมเวทย์: Void Infusion (ออร่ารอบตัว)", cls="archmage")
save_c("mage_wind_barrier", wind_barrier(mix("wind", "wind")), 14, True, "จอมเวทย์: บาเรียวายุ", cls="archmage")
save_c("mage_fusion_cast", a_burst(VOID, s=48, seed=5), 18, False, "จอมเวทย์: แฟลชตอนผสานเวทย์สำเร็จ", cls="archmage")

save_c("chronos_timestop", clock_field(CHRONO), 8, True, "เทพเวลา: นาฬิกาหยุดเวลา (วาดใหญ่กลางจอ โปร่งแสง)", cls="chronos")
save_c("chronos_ripple", a_shockwave(CHRONO, w=128, h=64), 14, False, "เทพเวลา: คลื่นเวลาตอนเริ่ม/จบหยุดเวลา", cls="chronos")

save_c("death_scythe_nova", scythe_nova(DEATH), 16, False, "เทพความตาย: เคียววิญญาณ Nova", cls="death")
save_c("death_soul_wisp", soul_wisp(DEATH), 10, True, "เทพความตาย: ดวงวิญญาณ (สแต็ก) ลอยรอบตัว", cls="death")

EL = {"fire": mix("fire", "fire"), "water": mix("water", "water"), "wind": mix("wind", "wind"),
      "light": mix("light", "light"), "dark": mix("dark", "dark")}
for el, pal in EL.items():
    save_c(f"spellblade_wave_{el}", element_wave(pal), 16, False, f"จอมเวทย์ดาบ: คลื่นดาบธาตุ{el}", rot=True, cls="spellblade")
save_c("spellblade_charge_360", charge_spin(PRISM), 12, False, "จอมเวทย์ดาบ: ชาร์จ 3 วิ แล้วฟัน 360° (เฟรมครึ่งแรก=ชาร์จ)", cls="spellblade")

save_c("voidless_aura", ascend_aura(PRISM), 12, True, "ดาบไร้ธาตุ: ออร่าร่างจุติ (วาดหลังตัวละคร)", cls="voidless")
save_c("voidless_heaven_pillar", a_pillar(PRISM, w=40, h=128), 16, False, "ดาบไร้ธาตุ: เสาแสงสวรรค์", anchor=(0.5, 1.0), cls="voidless")
save_c("voidless_spirit_sword", floating_sword(PRISM), 6, True, "ดาบไร้ธาตุ: ดาบวิญญาณ 5 เล่ม", blend="lighter", rot=True, cls="voidless")
save_c("voidless_awaken_burst", a_burst(PRISM, s=96, seed=9), 16, False, "ดาบไร้ธาตุ: ระเบิดตอนจุติ", cls="voidless")

with open(os.path.join(OUT, "class_manifest.json"), "w", encoding="utf-8") as f:
    json.dump(MANIFEST, f, ensure_ascii=False, indent=1)
print(len(MANIFEST))
