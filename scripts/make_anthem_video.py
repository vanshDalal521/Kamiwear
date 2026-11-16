#!/usr/bin/env python3
"""
Kamiwear // Anthem 2026 — cinematic product film.

Renders every frame from scratch (PIL), piped straight into ffmpeg:
  - kinetic typography, slash wipes, impact flashes, camera shake
  - parallax product reveals, breathing glow, embers/particles
  - new-season clothing showcase (hero jacket, new fashion, denim,
    Slayer Corps, Night City, Cursed Energy, rapid drop montage)
  - original, fully owned Demon-Slayer-inspired score (taiko, shakuhachi,
    choir, risers) timed to the cuts. No copyrighted movie audio is used.

Usage:
    python3 scripts/make_anthem_video.py                 # full build
    python3 scripts/make_anthem_video.py --reuse-audio   # skip score synth
    python3 scripts/make_anthem_video.py --audio-only
"""
import argparse
import math
import os
import random
import struct
import subprocess
import sys
import time
import wave
from array import array
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_VIDEO = ROOT / "public/assets/video/kamiwear-anthem.mp4"
OUT_POSTER = ROOT / "public/assets/video/kamiwear-anthem-poster.jpg"
OUT_AUDIO = ROOT / "public/assets/audio/kamiwear-anthem.wav"

W, H = 1280, 720
FPS = 30
DURATION = 36.0
SR = 44100

ACCENT = (249, 249, 6)
SLASH = (255, 244, 160)

# ----------------------------------------------------------------------------- fonts
FONT_PATHS = {
    "impact": "/System/Library/Fonts/Supplemental/Impact.ttf",
    "din": "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf",
    "arial": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "narrow": "/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf",
    "narrow_r": "/System/Library/Fonts/Supplemental/Arial Narrow.ttf",
    "regular": "/System/Library/Fonts/Supplemental/Arial.ttf",
    "cjk": "/System/Library/Fonts/Hiragino Sans GB.ttc",
}
_font_cache = {}


def F(kind, size):
    key = (kind, size)
    if key not in _font_cache:
        path = FONT_PATHS[kind]
        try:
            _font_cache[key] = ImageFont.truetype(path, size=size)
        except Exception:
            _font_cache[key] = ImageFont.load_default()
    return _font_cache[key]


# ----------------------------------------------------------------------------- helpers
def clamp(v, lo=0.0, hi=1.0):
    return lo if v < lo else hi if v > hi else v


def lerp(a, b, t):
    return a + (b - a) * t


def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_out_back(t, overshoot=1.7):
    t = clamp(t)
    c = overshoot + 1
    return 1 + c * (t - 1) ** 3 + overshoot * (t - 1) ** 2


def ease_in_out(t):
    t = clamp(t)
    return 3 * t * t - 2 * t * t * t


def dim(color, factor):
    return tuple(int(c * factor) for c in color[:3])


def rgba(color, alpha=255):
    return tuple(color[:3]) + (int(alpha),)


def fit_cover(img, size):
    sw, sh = img.size
    tw, th = size
    scale = max(tw / sw, th / sh)
    nw, nh = max(tw, int(sw * scale + 0.5)), max(th, int(sh * scale + 0.5))
    img = img.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


# ----------------------------------------------------------------------------- text
def make_text(text, font, fill, spacing=0.0, glow=None, glow_blur=10,
              stroke_width=0, stroke_fill=None, pad=None):
    """Render text (with optional letter-spacing, glow, outline).

    Returns dict with rgb, mask, content width/height and symmetric padding.
    """
    fill = rgba(fill)
    if stroke_fill is not None:
        stroke_fill = rgba(stroke_fill)
    widths = [font.getlength(ch) for ch in text]
    cw = int(round(sum(widths) + spacing * max(0, len(text) - 1)))
    cw = max(cw, 1)
    ascent, descent = font.getmetrics()
    ch = ascent + descent
    if pad is None:
        pad = 30 if glow else 6
    img = Image.new("RGBA", (cw + pad * 2, ch + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = pad
    for glyph, gw in zip(text, widths):
        if glyph != " ":
            d.text((x, pad), glyph, font=font, fill=fill,
                   stroke_width=stroke_width, stroke_fill=stroke_fill)
        x += gw + spacing
    if glow:
        alpha = img.getchannel("A").filter(ImageFilter.GaussianBlur(glow_blur))
        galpha = glow[3] if len(glow) > 3 else 110
        if galpha < 255:
            alpha = alpha.point(lambda v: int(v * galpha / 255))
        gl = Image.new("RGBA", img.size, rgba(glow, 0))
        gl.putalpha(alpha)
        merged = Image.new("RGBA", img.size, (0, 0, 0, 0))
        merged.alpha_composite(gl)
        merged.alpha_composite(img)
        img = merged
    return {
        "rgb": img.convert("RGB"),
        "mask": img.getchannel("A"),
        "cw": cw,
        "ch": ch,
        "pad": pad,
    }


def paste_text(frame, layer, x, y, opacity=1.0, align="left", dy=0.0):
    if opacity <= 0.003:
        return
    pad = layer["pad"]
    if align == "center":
        x -= layer["cw"] / 2
    elif align == "right":
        x -= layer["cw"]
    mask = layer["mask"]
    if opacity < 0.999:
        mask = mask.point(lambda v: int(v * opacity))
    frame.paste(layer["rgb"], (int(x - pad), int(y - pad + dy)), mask)


def text_size(layer):
    return layer["cw"], layer["ch"]


def make_pill(text, font, accent, spacing=2.0, padx=16, pady=9,
              fg=None, bg=(6, 5, 12, 165), border=None):
    label = make_text(text, font, fg or accent, spacing=spacing, pad=4)
    tw, th = label["cw"], label["ch"]
    w, h = tw + padx * 2, th + pady * 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2,
                        fill=bg, outline=rgba(border or accent, 210), width=1)
    # paste label centered
    lx = (w - tw) // 2 - label["pad"]
    ly = (h - th) // 2 - label["pad"]
    mask = label["mask"]
    img.paste(label["rgb"], (lx, ly), mask)
    # add accent dot
    return {"rgb": img.convert("RGB"), "mask": img.getchannel("A"),
            "cw": w, "ch": h, "pad": 0}


def make_chips(items, accent, font_kind="narrow", font_size=14):
    font = F(font_kind, font_size)
    spacing = 1.6
    padx, pady = 13, 8
    labels = [make_text(t.upper(), font, (236, 238, 246), spacing=spacing, pad=3)
              for t in items]
    heights = [l["ch"] + pady * 2 for l in labels]
    gap = 10
    total_w = sum(l["cw"] + padx * 2 for l in labels) + gap * (len(labels) - 1)
    total_h = max(heights)
    img = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 0
    for layer in labels:
        w = layer["cw"] + padx * 2
        h = layer["ch"] + pady * 2
        d.rounded_rectangle([x, 0, x + w - 1, h - 1], radius=h // 2,
                            fill=(255, 255, 255, 14),
                            outline=rgba(accent, 110), width=1)
        img.paste(layer["rgb"], (x + padx - layer["pad"], pady - layer["pad"]),
                  layer["mask"])
        x += w + gap
    return {"rgb": img.convert("RGB"), "mask": img.getchannel("A"),
            "cw": total_w, "ch": total_h, "pad": 0}


# ----------------------------------------------------------------------------- art
def make_kanji(char, size, color, alpha=24, blur=0):
    font = F("cjk", size)
    layer = make_text(char, font, color, pad=40)
    if blur:
        layer["rgb"] = layer["rgb"].filter(ImageFilter.GaussianBlur(blur))
        layer["mask"] = layer["mask"].filter(ImageFilter.GaussianBlur(blur))
    if alpha < 255:
        layer["mask"] = layer["mask"].point(lambda v: int(v * alpha / 255))
    return layer


def make_background(path, accent, brightness=0.30, blur=20, glow_strength=46,
                    glow_pos=(0.70, 0.46), bw=W + 160, bh=H + 160):
    if path and Path(path).exists():
        src = Image.open(path).convert("RGB")
        base = fit_cover(src, (bw, bh))
        base = base.filter(ImageFilter.GaussianBlur(blur))
        base = ImageEnhance.Brightness(base).enhance(brightness)
        base = ImageEnhance.Color(base).enhance(0.62)
        base = Image.blend(base, Image.new("RGB", (bw, bh), dim(accent, 1.0)), 0.07)
    else:
        base = Image.new("RGB", (bw, bh), (10, 8, 18))
    # accent radial glow
    glow = Image.new("RGB", (bw, bh), accent)
    mask = Image.new("L", (bw, bh), 0)
    md = ImageDraw.Draw(mask)
    cx, cy = int(bw * glow_pos[0]), int(bh * glow_pos[1])
    r = int(min(bw, bh) * 0.52)
    md.ellipse([cx - r, cy - r, cx + r, cy + r], fill=glow_strength)
    mask = mask.filter(ImageFilter.GaussianBlur(int(min(bw, bh) * 0.16)))
    base = Image.composite(glow, base, mask)
    # cinematic gradient (dark top & bottom)
    grad = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(bh):
        ny = y / bh
        a = int(150 * max(0, 0.28 - ny) / 0.28) if ny < 0.28 else 0
        a2 = int(200 * max(0, ny - 0.66) / 0.34) if ny > 0.66 else 0
        if a or a2:
            gd.line([(0, y), (bw, y)], fill=(2, 2, 6, max(a, a2)))
    base = Image.alpha_composite(base.convert("RGBA"), grad).convert("RGB")
    return base


def make_card(path, accent, label=None, size=(400, 530), margin=26, photo_boost=1.0):
    """Glass-free lookbook card: full garment visible, blurred backdrop, accent glow."""
    CW, CH = size
    M = margin
    total = (CW + M * 2, CH + M * 2)
    canvas = Image.new("RGBA", total, (0, 0, 0, 0))

    # soft accent glow
    glow = Image.new("RGBA", total, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([M, M, M + CW - 1, M + CH - 1], radius=24,
                         fill=rgba(accent, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(16))
    canvas.alpha_composite(glow)

    # drop shadow
    shadow = Image.new("RGBA", total, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([M + 4, M + 12, M + CW + 4, M + CH + 12], radius=24,
                         fill=(0, 0, 0, 190))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow)

    content = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    if path and Path(path).exists():
        src = Image.open(path).convert("RGB")
        backdrop = fit_cover(src, (CW, CH)).filter(ImageFilter.GaussianBlur(18))
        backdrop = ImageEnhance.Brightness(backdrop).enhance(0.30)
        backdrop = ImageEnhance.Color(backdrop).enhance(0.50)
        backdrop = Image.blend(backdrop, Image.new("RGB", (CW, CH), accent), 0.09)
        content.paste(backdrop, (0, 0))

        top_band = 46 if label else 18
        pad_lr = 14
        pad_b = 16
        avail = (CW - pad_lr * 2, CH - top_band - pad_b)
        photo = ImageOps.contain(src, avail, Image.LANCZOS)
        if photo_boost != 1.0:
            photo = ImageEnhance.Brightness(photo).enhance(photo_boost)
        paw, pah = photo.size
        px = (CW - paw) // 2
        py = top_band + (avail[1] - pah) // 2
        pmask = rounded_mask((paw, pah), 14)
        # photo shadow
        sh = Image.new("RGBA", (paw + 24, pah + 24), (0, 0, 0, 0))
        shd = ImageDraw.Draw(sh)
        shd.rounded_rectangle([12, 16, 12 + paw, 16 + pah], radius=14,
                              fill=(0, 0, 0, 210))
        sh = sh.filter(ImageFilter.GaussianBlur(8))
        content.alpha_composite(sh, (px - 12, py - 12))
        content.paste(photo, (px, py), pmask)
        # thin photo border
        cd = ImageDraw.Draw(content)
        cd.rounded_rectangle([px, py, px + paw - 1, py + pah - 1], radius=14,
                             outline=(255, 255, 255, 45), width=1)
        # top gradient for label
        grad = Image.new("RGBA", (CW, top_band + 12), (0, 0, 0, 0))
        gd2 = ImageDraw.Draw(grad)
        for y in range(top_band + 12):
            a = int(150 * (1 - y / (top_band + 12)))
            gd2.line([(0, y), (CW, y)], fill=(2, 2, 6, a))
        content.alpha_composite(grad, (0, 0))

        if label:
            lf = F("narrow", 13)
            ll = make_text(label.upper(), lf, accent, spacing=2.0, pad=3)
            ld = ImageDraw.Draw(content)
            ld.ellipse([16, 20, 23, 27], fill=rgba(accent, 255))
            content.paste(ll["rgb"], (32 - ll["pad"], 10 - ll["pad"]), ll["mask"])
    else:
        d = ImageDraw.Draw(content)
        d.rectangle([0, 0, CW, CH], fill=(18, 16, 26, 255))

    # rounded clip + subtle border
    content.putalpha(Image.composite(content.getchannel("A"),
                                     Image.new("L", (CW, CH), 0),
                                     rounded_mask((CW, CH), 24)))
    bd = ImageDraw.Draw(content)
    bd.rounded_rectangle([0, 0, CW - 1, CH - 1], radius=24,
                         outline=(255, 255, 255, 55), width=1)
    canvas.alpha_composite(content, (M, M))

    return {"img": canvas, "cw": CW, "ch": CH, "pad": M}


def paste_card(frame, card, x, y, scale=1.0, opacity=1.0, anchor="lt"):
    """x,y refer to the card's content top-left (excluding glow margin)."""
    CW, CH, M = card["cw"], card["ch"], card["pad"]
    if anchor == "center":
        x -= CW / 2
        y -= CH / 2
    elif anchor == "rt":
        x -= CW
    img = card["img"]
    cx = x + CW / 2
    cy = y + CH / 2
    if scale != 1.0:
        img = img.resize((max(1, int(img.width * scale)),
                          max(1, int(img.height * scale))), Image.LANCZOS)
        px = cx - (M + CW / 2) * scale
        py = cy - (M + CH / 2) * scale
    else:
        px = x - M
        py = y - M
    mask = img.getchannel("A")
    if opacity < 0.999:
        mask = mask.point(lambda v: int(v * opacity))
    frame.paste(img.convert("RGB"), (int(px), int(py)), mask)


# ----------------------------------------------------------------------------- particles / fx
def make_particles(seed, count, color, area=(0, W, 0, H), speed=(26, 70),
                   size=(1, 3), drift=24, alpha=(30, 90)):
    rnd = random.Random(seed)
    out = []
    for _ in range(count):
        out.append({
            "x": rnd.uniform(area[0], area[1]),
            "y": rnd.uniform(area[2], area[3]),
            "speed": rnd.uniform(*speed),
            "size": rnd.uniform(*size),
            "drift": rnd.uniform(-drift, drift),
            "freq": rnd.uniform(0.4, 1.5),
            "phase": rnd.uniform(0, math.tau),
            "alpha": rnd.randint(*alpha),
            "color": color,
        })
    return out


def draw_particles(frame, lt, particles, rise=True, wrap_h=H + 40):
    if not particles:
        return
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for p in particles:
        direction = -1 if rise else 1
        y = (p["y"] + direction * p["speed"] * lt) % wrap_h - 20
        x = p["x"] + math.sin(lt * p["freq"] + p["phase"]) * p["drift"]
        flicker = 0.65 + 0.35 * math.sin(lt * 3.2 + p["phase"])
        a = int(p["alpha"] * flicker)
        r = p["size"]
        od.ellipse([x - r, y - r, x + r, y + r], fill=rgba(p["color"], a))
    frame.paste(overlay.convert("RGB"), (0, 0), overlay.getchannel("A"))


def draw_rings(frame, cx, cy, lt, color, count=3, max_r=380):
    size = max_r * 2 + 40
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(count):
        phase = (lt * 0.9 + i / count) % 1.0
        r = 40 + phase * max_r
        a = int(110 * (1 - phase) ** 1.4)
        if a > 2:
            od.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r],
                       outline=rgba(color, a), width=2)
    frame.paste(overlay.convert("RGB"),
                (int(cx - size / 2), int(cy - size / 2)), overlay.getchannel("A"))


def draw_slash(frame, progress, color=SLASH):
    if progress <= 0.0 or progress >= 1.0:
        return
    x = -420 + progress * (W + 840)
    y = 360
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    pts = [(x - 300, y - 170), (x + 300, y + 170)]
    od.line(pts, fill=rgba(color, 120), width=34)
    od.line(pts, fill=(255, 255, 255, 210), width=12)
    od.line(pts, fill=(255, 255, 255, 255), width=3)
    frame.paste(overlay.convert("RGB"), (0, 0), overlay.getchannel("A"))


def draw_speed_lines(frame, lt, color=(255, 255, 255), duration=0.3, count=26, seed=7):
    if lt >= duration:
        return
    p = 1 - lt / duration
    rnd = random.Random(seed)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    cx, cy = W / 2, H / 2
    for _ in range(count):
        ang = rnd.uniform(0, math.tau)
        r0 = rnd.uniform(120, 330)
        r1 = r0 + rnd.uniform(150, 520)
        a = int(rnd.uniform(30, 95) * p)
        x0, y0 = cx + math.cos(ang) * r0, cy + math.sin(ang) * r0 * 0.62
        x1, y1 = cx + math.cos(ang) * r1, cy + math.sin(ang) * r1 * 0.62
        od.line([(x0, y0), (x1, y1)], fill=rgba(color, a), width=rnd.choice([1, 1, 2]))
    frame.paste(overlay.convert("RGB"), (0, 0), overlay.getchannel("A"))


WHITE = Image.new("RGB", (W, H), (255, 255, 255))
BLACK = Image.new("RGB", (W, H), (0, 0, 0))


def apply_impact(frame, lt, accent, slash_len=0.30, flash=0.90):
    if lt < slash_len:
        draw_slash(frame, clamp(lt / slash_len), color=SLASH)
    if lt < 0.12:
        a = flash * (1 - lt / 0.12)
        if a > 0.01:
            frame = Image.blend(frame, WHITE, a * 0.7)
    return frame


# ----------------------------------------------------------------------------- background & vignette
def make_vignette():
    small = Image.new("L", (64, 36), 0)
    px = small.load()
    for yy in range(36):
        for xx in range(64):
            nx = (xx / 63 - 0.5) * 2
            ny = (yy / 35 - 0.5) * 2
            r = math.sqrt(nx * nx + ny * ny) / math.sqrt(2)
            a = int(170 * clamp((r - 0.28) / 0.72) ** 1.5)
            px[xx, yy] = a
    return small.resize((W, H), Image.BICUBIC)


VIGNETTE = make_vignette()

SCENES = [
    (0.0, 3.2, "OPENING"),
    (3.2, 7.2, "HERO DROP"),
    (7.2, 10.8, "NEW FASHION"),
    (10.8, 14.4, "NEW DENIM"),
    (14.4, 18.6, "SLAYER CORPS"),
    (18.6, 22.0, "NIGHT CITY"),
    (22.0, 25.2, "CURSED ENERGY"),
    (25.2, 28.8, "THE DROP"),
    (28.8, 36.0, "KAMIWEAR"),
]
CUTS = [s[0] for s in SCENES] + [26.4, 27.6]


def scene_index(t):
    for i, (start, end, _) in enumerate(SCENES):
        if start <= t < end:
            return i
    return len(SCENES) - 1


# ----------------------------------------------------------------------------- HUD
def draw_spaced(draw, x, y, text, font, fill, spacing=2.0):
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + spacing
    return x


def spaced_width(text, font, spacing=2.0):
    return sum(font.getlength(ch) for ch in text) + spacing * max(0, len(text) - 1)


def draw_hud(frame, t, accent, label, index):
    d = ImageDraw.Draw(frame)
    # letterbox
    d.rectangle([0, 0, W, 54], fill=(2, 2, 5))
    d.rectangle([0, 666, W, 720], fill=(2, 2, 5))
    # corner brackets
    c = dim(accent, 0.5)
    for (bx, by, sx, sy) in [(26, 66, 1, 1), (W - 26, 66, -1, 1),
                             (26, 652, 1, -1), (W - 26, 652, -1, -1)]:
        d.line([(bx, by), (bx + 22 * sx, by)], fill=c, width=1)
        d.line([(bx, by), (bx, by + 22 * sy)], fill=c, width=1)
    # left: wordmark
    wf = F("impact", 18)
    d.text((28, 18), "KAMIWEAR", font=wf, fill=rgba(accent, 255))
    x = 28 + wf.getlength("KAMIWEAR") + 10
    nf = F("narrow", 12)
    draw_spaced(d, x, 24, "// ANTHEM", nf, (150, 152, 165), 2.0)
    # right: scene label + counter
    lf = F("narrow", 13)
    lab = label.upper()
    lw = spaced_width(lab, lf, 2.2)
    draw_spaced(d, W - 176 - lw, 25, lab, lf, (150, 152, 165), 2.2)
    cf = F("narrow", 13)
    counter = f"{index + 1:02d} / {len(SCENES):02d}"
    draw_spaced(d, W - 28 - spaced_width(counter, cf, 1.8), 25, counter, cf,
                rgba(accent, 255), 1.8)
    # progress
    bx0, bx1, by = 26, W - 26, 710
    d.line([(bx0, by), (bx1, by)], fill=(38, 38, 46), width=2)
    frac = clamp(t / DURATION)
    d.line([(bx0, by), (bx0 + (bx1 - bx0) * frac, by)], fill=rgba(accent, 255), width=2)
    for cut in SCENES[1:]:
        cx = bx0 + (bx1 - bx0) * (cut[0] / DURATION)
        d.line([(cx, by - 3), (cx, by + 3)], fill=(70, 70, 82), width=1)


# ----------------------------------------------------------------------------- product scene
class ProductScene:
    def __init__(self, start, end, label, index, bg_path, card_path,
                 accent, tag, titles, subtitle, price, chips,
                 side="right", seed=1, decor=None, glow_pos=(0.70, 0.46),
                 card_size=(400, 530), zoom=1.0, entry="right",
                 bg_brightness=0.30, photo_boost=1.0, quick=False):
        self.start = start
        self.end = end
        self.label = label
        self.index = index
        self.accent = accent
        self.side = side
        self.seed = seed
        self.decor = decor
        self.entry = entry
        self.zoom = zoom
        self.quick = quick
        # Short montage shots need snappier type so every line lands before the cut.
        self.time_scale = 0.34 if quick else 1.0
        self.text_dur = 0.26 if quick else 0.5
        self.entry_dur = 0.34 if quick else 0.62
        self.bg = make_background(bg_path, accent, brightness=bg_brightness,
                                  glow_pos=glow_pos)
        self.card = make_card(card_path, accent, tag, size=card_size,
                              photo_boost=photo_boost)
        self.particles = make_particles(seed, 22, accent,
                                        alpha=(18, 55), speed=(20, 52),
                                        size=(1, 2.2), drift=18)
        self.glitch = []
        # layout
        left_x = 70 if side == "right" else 590
        anchor = left_x if side == "right" else W - 70
        align = "left" if side == "right" else "right"
        max_w = 660 if side == "right" else 620
        self.layers = []

        pill_f = F("narrow", 14)
        pill = make_pill(tag, pill_f, accent, spacing=2.0)
        self.layers.append(("pill", pill, anchor, 146, 0.12, align))

        y = 196
        for i, (txt, col, base) in enumerate(titles):
            size = base
            while size > 22 and F("impact", size).getlength(txt) > max_w:
                size -= 2
            glow = rgba(accent, 70) if i == 0 else None
            layer = make_text(txt, F("impact", size), col, spacing=1.5,
                              glow=glow, glow_blur=12)
            self.layers.append(("title", layer, anchor, y, 0.20 + i * 0.12, align))
            y += layer["ch"] + 2
        if titles and titles[0][0] == "CURSED ENERGY":
            # build glitch tint copies of the first title line
            base_layer = self.layers[1][1]
            for tint in [(255, 40, 80), (80, 120, 255)]:
                gl = Image.new("RGBA", base_layer["rgb"].size, tint + (0,))
                gl.putalpha(base_layer["mask"].point(lambda v: int(v * 0.55)))
                self.glitch.append((gl.convert("RGB"), gl.getchannel("A")))

        self.title_bottom = y
        sub_layer = make_text(subtitle, F("regular", 21), (182, 186, 200),
                              spacing=0.4, pad=6)
        self.layers.append(("sub", sub_layer, anchor, y + 10, 0.55, align))

        price_layer = make_text(price, F("arial", 48), accent, spacing=1.0,
                                glow=rgba(accent, 70), glow_blur=10)
        self.layers.append(("price", price_layer, anchor, y + 44, 0.68, align))

        chips_layer = make_chips(chips, accent)
        self.layers.append(("chips", chips_layer, anchor, y + 112, 0.82, align))

        self.pill_layer = pill

    def bg_at(self, t, lt):
        bw, bh = self.bg.size
        base_off_x = (bw - W) / 2 + math.sin(t * 0.16 + self.seed) * 26 * self.zoom
        base_off_y = (bh - H) / 2 + math.cos(t * 0.13 + self.seed) * 18 * self.zoom
        shake = 0.0
        if lt < 0.4:
            shake = 12 * math.exp(-lt * 12) * math.sin(lt * 80 + 1.3)
        ox = int(clamp(base_off_x + shake, 0, bw - W))
        oy = int(clamp(base_off_y - shake * 0.6, 0, bh - H))
        return self.bg.crop((ox, oy, ox + W, oy + H))

    def card_target(self):
        if self.side == "right":
            return 776, 92
        return 60, 92

    def render(self, t):
        lt = t - self.start
        frame = self.bg_at(t, lt)
        # decor under card
        if self.decor == "rings":
            cx = 976
            cy = 380
            draw_rings(frame, cx, cy, lt, self.accent)
        if self.decor == "kanji":
            pass
        if self.decor == "scanlines":
            scan = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            sd = ImageDraw.Draw(scan)
            for y in range(0, H, 4):
                sd.line([(0, y), (W, y)], fill=(0, 0, 0, 42))
            frame.paste(scan.convert("RGB"), (0, 0), scan.getchannel("A"))
            band_y = int((lt * 120) % (H + 120)) - 60
            band = Image.new("RGBA", (W, 46), (0, 0, 0, 0))
            bd = ImageDraw.Draw(band)
            bd.rectangle([0, 0, W, 46], fill=rgba(self.accent, 12))
            bd.line([(0, 22), (W, 22)], fill=rgba(self.accent, 60), width=1)
            frame.paste(band.convert("RGB"), (0, band_y), band.getchannel("A"))
        if self.decor == "glitch" and lt < 0.35:
            rnd = random.Random(int(t * 1000))
            ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            od = ImageDraw.Draw(ov)
            for _ in range(7):
                gy = rnd.randint(70, 620)
                gh = rnd.randint(2, 9)
                col = rnd.choice([(255, 40, 80), (60, 220, 255), (190, 120, 255)])
                od.rectangle([rnd.randint(-40, 120), gy, W, gy + gh],
                             fill=rgba(col, rnd.randint(24, 60)))
            frame.paste(ov.convert("RGB"), (0, 0), ov.getchannel("A"))

        # card entry
        tx, ty = self.card_target()
        entry_p = ease_out_back(clamp(lt / self.entry_dur), 1.5)
        if self.entry == "right":
            cx = tx + (1 - entry_p) * 260
            cy = ty + (1 - entry_p) * 10
        elif self.entry == "left":
            cx = tx - (1 - entry_p) * 260
            cy = ty + (1 - entry_p) * 10
        elif self.entry == "bottom":
            cx = tx
            cy = ty + (1 - entry_p) * 240
        else:
            cx, cy = tx, ty
        float_y = math.sin((t - self.start) * 1.4 + self.seed) * 4
        scale = 0.94 + 0.06 * entry_p
        if lt < 0.4 and self.entry == "center":
            scale *= 1.0 + 0.05 * (1 - clamp(lt / 0.4))
        paste_card(frame, self.card, cx, cy + float_y, scale=scale,
                   opacity=clamp(lt / (0.10 if self.quick else 0.18)))

        # kinetic text
        for kind, layer, ax, ay, delay, align in self.layers:
            p = ease_out_cubic(clamp((lt - delay * self.time_scale) / self.text_dur))
            paste_text(frame, layer, ax, ay, opacity=p, align=align,
                       dy=(1 - p) * 26)
            if kind == "pill" and p > 0:
                pass
        # accent underline under the last title line
        p = ease_out_cubic(clamp((lt - 0.34 * self.time_scale) /
                                 (0.35 if self.quick else 0.55)))
        title_layers = [entry for entry in self.layers if entry[0] == "title"]
        last_title = title_layers[-1]
        uy = last_title[3] + last_title[1]["ch"] + 4
        if p > 0:
            ux = 70 if self.side == "right" else W - 70 - 180 * p
            d = ImageDraw.Draw(frame)
            d.rounded_rectangle([ux, uy, ux + 180 * p, uy + 4], radius=2,
                                fill=rgba(self.accent, 255))

        # glitch title copies (cursed energy)
        if self.glitch and lt < 0.42:
            base_layer = self.layers[1][1]
            ax, ay = self.layers[1][2], self.layers[1][3]
            tp = ease_out_cubic(clamp((lt - 0.20) / 0.5))
            if self.side == "right":
                x0 = ax - base_layer["pad"]
            else:
                x0 = ax - base_layer["cw"] - base_layer["pad"]
            jitter = 3 + 2 * math.sin(lt * 60)
            fade = clamp(1 - lt / 0.42)
            for idx, (rgb, mask) in enumerate(self.glitch):
                off = -jitter if idx == 0 else jitter
                frame.paste(rgb, (int(x0 + off),
                                  int(ay - base_layer["pad"] + (1 - tp) * 26)),
                            mask.point(lambda v: int(v * fade)))

        # particles over content
        draw_particles(frame, lt, self.particles, rise=True)
        frame = apply_impact(frame, lt, self.accent)
        return frame


class MontageScene:
    def __init__(self, start, end, label, index, subs):
        self.start, self.end = start, end
        self.label, self.index = label, index
        self.subs = subs

    def render(self, t):
        for s in self.subs:
            if s.start <= t < s.end:
                return s.render(t)
        return self.subs[-1].render(min(t, self.subs[-1].end - 0.001))


# ----------------------------------------------------------------------------- title scene
class TitleScene:
    def __init__(self, start, end, label, index):
        self.start, self.end = start, end
        self.label, self.index = label, index
        self.accent = ACCENT
        self.bg = make_background(
            ROOT / "public/assets/generated/slayer-corps-cover-perfect-1773032305388.png",
            (200, 40, 24), brightness=0.16, blur=26, glow_strength=38,
            glow_pos=(0.66, 0.42))
        self.kanji = make_kanji("鬼", 560, (255, 46, 26), alpha=26, blur=2)
        self.particles = make_particles(3, 40, (255, 96, 40),
                                        alpha=(22, 80), speed=(24, 70),
                                        size=(1, 2.6), drift=26)
        self.kami = make_text("KAMIWEAR", F("impact", 168), (255, 255, 255),
                              spacing=4, glow=(249, 249, 6, 90), glow_blur=18)
        self.anthem = make_text("ANTHEM", F("impact", 104), (0, 0, 0),
                                spacing=22, stroke_width=3,
                                stroke_fill=(249, 249, 6), pad=12)
        self.top = make_text("KAMIWEAR PRESENTS", F("narrow", 15),
                             (210, 210, 222), spacing=6.0, pad=6)
        self.sub = make_text("NEW SEASON  //  2026", F("narrow", 16),
                             (249, 249, 6), spacing=4.0, pad=6)
        self.fine = make_text("AN ORIGINAL KAMIWEAR ANTHEM", F("regular", 12),
                              (130, 132, 148), spacing=3.0, pad=6)

    def render(self, t):
        lt = t - self.start
        frame = self.bg.crop(((self.bg.width - W) // 2,
                              (self.bg.height - H) // 2,
                              (self.bg.width - W) // 2 + W,
                              (self.bg.height - H) // 2 + H)).copy()
        # ghost kanji, breathing
        kscale = 1.0 + 0.015 * math.sin(lt * 1.1)
        kx, ky = 1000, 370
        draw_kanji = self.kanji
        kw = int(draw_kanji["cw"] * kscale)
        kh = int(draw_kanji["ch"] * kscale)
        rgb = draw_kanji["rgb"].resize((kw, kh), Image.BILINEAR)
        mask = draw_kanji["mask"].resize((kw, kh), Image.BILINEAR)
        frame.paste(rgb, (int(kx - kw / 2), int(ky - kh / 2)), mask)
        draw_particles(frame, lt, self.particles, rise=True)

        # top label
        p = ease_out_cubic(clamp((lt - 0.55) / 0.5))
        paste_text(frame, self.top, W / 2, 138, opacity=p * 0.9, align="center")
        # KAMIWEAR punch-in
        p = clamp((lt - 0.05) / 0.5)
        scale = 1.16 - 0.16 * ease_out_cubic(p)
        rgb = self.kami["rgb"]
        mask = self.kami["mask"]
        if scale != 1:
            lw = int(rgb.width * scale)
            lh = int(rgb.height * scale)
            rgb = rgb.resize((lw, lh), Image.BILINEAR)
            mask = mask.resize((lw, lh), Image.BILINEAR)
        if p < 1:
            mask = mask.point(lambda v: int(v * p))
        frame.paste(rgb, (int(W / 2 - rgb.width / 2), int(214 + (1 - p) * 14)),
                    mask)
        # ANTHEM outline reveal
        p = ease_out_cubic(clamp((lt - 0.38) / 0.55))
        paste_text(frame, self.anthem, W / 2, 398, opacity=p, align="center",
                   dy=(1 - p) * 26)
        # divider grows from center
        p = ease_out_cubic(clamp((lt - 0.7) / 0.6))
        if p > 0:
            d = ImageDraw.Draw(frame)
            half = 130 * p
            d.rounded_rectangle([W / 2 - half, 512, W / 2 + half, 515], radius=2,
                                fill=(249, 249, 6))
        # bottom
        p = ease_out_cubic(clamp((lt - 0.9) / 0.55))
        paste_text(frame, self.sub, W / 2, 536, opacity=p, align="center")
        paste_text(frame, self.fine, W / 2, 566, opacity=p * 0.8, align="center")
        # speed lines on entry
        draw_speed_lines(frame, lt, duration=0.45, count=30, seed=11)
        frame = apply_impact(frame, lt, self.accent, slash_len=0.34, flash=1.0)
        return frame


# ----------------------------------------------------------------------------- outro scene
class OutroScene:
    def __init__(self, start, end, label, index):
        self.start, self.end = start, end
        self.label, self.index = label, index
        self.accent = ACCENT
        self.bg = make_background(
            ROOT / "public/assets/fashion/hero-oversized-jacket.jpg",
            (249, 249, 6), brightness=0.18, blur=28, glow_strength=44,
            glow_pos=(0.5, 0.36))
        self.we = make_text("WEAR", F("impact", 138), (255, 255, 255),
                            spacing=6, glow=(249, 249, 6, 60), glow_blur=16)
        self.the = make_text("THE ANIME.", F("impact", 118), (249, 249, 6),
                             spacing=3, glow=(249, 249, 6, 80), glow_blur=16)
        self.tag = make_text("NEW SEASON. NEW CLOTHES. NEW ENERGY.",
                             F("narrow", 19), (205, 206, 218), spacing=3.2, pad=6)
        self.particles = make_particles(21, 34, (249, 249, 6),
                                        alpha=(20, 60), speed=(18, 48),
                                        size=(1, 2.4), drift=22)
        # CTA pill
        cta_font = F("narrow", 19)
        cta_text = make_text("SHOP THE DROP", cta_font, (6, 6, 10),
                             spacing=3.0, pad=4)
        cw = cta_text["cw"] + 70
        ch = cta_text["ch"] + 26
        cta = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cta)
        cd.rounded_rectangle([0, 0, cw - 1, ch - 1], radius=ch // 2,
                             fill=rgba(ACCENT, 255))
        cta.paste(cta_text["rgb"], (28 - cta_text["pad"],
                                    (ch - cta_text["ch"]) // 2 - cta_text["pad"]),
                  cta_text["mask"])
        # arrow
        ax = cw - 44
        ay = ch // 2
        cd.line([(ax - 8, ay), (ax + 8, ay)], fill=(6, 6, 10), width=3)
        cd.line([(ax + 2, ay - 6), (ax + 8, ay), (ax + 2, ay + 6)],
                fill=(6, 6, 10), width=3)
        self.cta = {"rgb": cta.convert("RGB"), "mask": cta.getchannel("A"),
                    "cw": cw, "ch": ch, "pad": 0}
        # product strip cards
        data = [
            ("public/assets/fashion/hero-oversized-jacket.jpg", "HERO JACKET"),
            ("public/assets/newgen/hoodie-oversized-hoodie-streetwear-product-phot-7abcf9.jpg", "PUFF HOODIE"),
            ("public/assets/newgen/jeans-baggy-jeans-streetwear-product-photo-051323.jpg", "BAGGY DENIM"),
            ("public/assets/generated/demon-slayer-kokushibo-hoodie-1773032491748.png", "SLAYER HOODIE"),
        ]
        self.cards = []
        for i, (path, lab) in enumerate(data):
            card = make_card(ROOT / path, ACCENT if i % 2 == 0 else (255, 90, 50),
                             lab, size=(176, 196), margin=16)
            self.cards.append(card)

    def render(self, t):
        lt = t - self.start
        frame = self.bg.crop(((self.bg.width - W) // 2,
                              (self.bg.height - H) // 2,
                              (self.bg.width - W) // 2 + W,
                              (self.bg.height - H) // 2 + H)).copy()
        draw_particles(frame, lt, self.particles, rise=True)

        p = ease_out_back(clamp(lt / 0.55), 1.2)
        paste_text(frame, self.we, W / 2, 76 + (1 - p) * 20,
                   opacity=clamp(lt / 0.25), align="center")
        p = ease_out_cubic(clamp((lt - 0.18) / 0.55))
        paste_text(frame, self.the, W / 2, 182 + (1 - p) * 26,
                   opacity=p, align="center")
        p = ease_out_cubic(clamp((lt - 0.45) / 0.5))
        paste_text(frame, self.tag, W / 2, 310, opacity=p * 0.95, align="center")

        # CTA appears after the brand slam
        cp = ease_out_back(clamp((lt - 0.85) / 0.5), 1.3)
        if cp > 0:
            cta = self.cta
            x = W / 2 - cta["cw"] / 2
            y = 344 + (1 - cp) * 20
            mask = cta["mask"]
            if cp < 1:
                mask = mask.point(lambda v: int(v * cp))
            pulse = 1.0 + 0.015 * math.sin(lt * 3.4)
            if pulse != 1.0:
                cw2, ch2 = int(cta["cw"] * pulse), int(cta["ch"] * pulse)
                rgb2 = cta["rgb"].resize((cw2, ch2), Image.BILINEAR)
                mask2 = mask.resize((cw2, ch2), Image.BILINEAR)
                frame.paste(rgb2, (int(x - (cw2 - cta["cw"]) / 2),
                                   int(y - (ch2 - cta["ch"]) / 2)), mask2)
            else:
                frame.paste(cta["rgb"], (int(x), int(y)), mask)

        # product strip
        for i, card in enumerate(self.cards):
            delay = 1.25 + i * 0.12
            p = ease_out_back(clamp((lt - delay) / 0.5), 1.5)
            if p <= 0:
                continue
            base_x = 252 + i * 200
            base_y = 412 + (6 if i % 2 == 0 else -4)
            float_y = math.sin(lt * 1.1 + i) * 4
            scale = 0.92 + 0.08 * p
            paste_card(frame, card, base_x, base_y + (1 - p) * 90 + float_y,
                       scale=scale, opacity=clamp((lt - delay) / 0.3))

        draw_speed_lines(frame, lt, duration=0.35, count=26, seed=31)
        frame = apply_impact(frame, lt, self.accent, slash_len=0.32, flash=1.0)

        # final blade + fade
        if lt > 5.55:
            draw_slash(frame, clamp((lt - 5.55) / 0.22), color=(255, 255, 255))
        if lt > 5.75:
            a = clamp((lt - 5.75) / 1.15)
            frame = Image.blend(frame, BLACK, a)
        return frame


# ----------------------------------------------------------------------------- scene graph
title_scene = TitleScene(*SCENES[0], index=0)
hero_scene = ProductScene(
    *SCENES[1], index=1,
    bg_path=ROOT / "public/assets/fashion/hero-oversized-jacket.jpg",
    card_path=ROOT / "public/assets/fashion/hero-oversized-jacket.jpg",
    accent=(249, 249, 6), tag="2026 HERO DROP",
    titles=[("HERO", (255, 255, 255), 100),
            ("OVERSIZED", (255, 255, 255), 62),
            ("STREET JACKET", (249, 249, 6), 54)],
    subtitle="380GSM armor cotton. Cut for the streets.",
    price="INR 4,200", chips=["380GSM COTTON", "REINFORCED STITCH"],
    side="right", seed=101, glow_pos=(0.25, 0.42), entry="right")

fashion_scene = ProductScene(
    *SCENES[2], index=2,
    bg_path=ROOT / "public/assets/newgen/hoodie-oversized-hoodie-streetwear-product-phot-7abcf9.jpg",
    card_path=ROOT / "public/assets/newgen/hoodie-oversized-hoodie-streetwear-product-phot-7abcf9.jpg",
    accent=(255, 190, 40), tag="NEW FASHION // DROP 02",
    titles=[("PUFF PRINT", (255, 255, 255), 78),
            ("HOODIE", (255, 190, 40), 84)],
    subtitle="Gradient wash. Oversized fit. Zero compromise.",
    price="INR 3,200", chips=["PUFF PRINT", "OVERSIZED FIT"],
    side="left", seed=102, glow_pos=(0.78, 0.45), entry="left",
    photo_boost=1.03)

denim_scene = ProductScene(
    *SCENES[3], index=3,
    bg_path=ROOT / "public/assets/newgen/jeans-baggy-jeans-streetwear-product-photo-051323.jpg",
    card_path=ROOT / "public/assets/newgen/jeans-baggy-jeans-streetwear-product-photo-051323.jpg",
    accent=(150, 215, 255), tag="NEW SEASON DENIM",
    titles=[("ACID WASH", (255, 255, 255), 96),
            ("BAGGY DENIM", (150, 215, 255), 58)],
    subtitle="Relaxed silhouette. Statement wash.",
    price="INR 3,100", chips=["BAGGY FIT", "ACID WASH"],
    side="right", seed=103, glow_pos=(0.26, 0.50), entry="bottom",
    bg_brightness=0.21)

slayer_scene = ProductScene(
    *SCENES[4], index=4,
    bg_path=ROOT / "public/assets/generated/slayer-corps-cover-perfect-1773032305388.png",
    card_path=ROOT / "public/assets/generated/demon-slayer-kokushibo-hoodie-1773032491748.png",
    accent=(255, 84, 42), tag="SLAYER CORPS // LIMITED",
    titles=[("KOKUSHIBO", (255, 255, 255), 104),
            ("DEMON SLAYER HOODIE", (255, 96, 48), 42)],
    subtitle="Hashira energy. Forged for the modern warrior.",
    price="INR 8,900", chips=["LIMITED RELEASE", "PREMIUM FLEECE"],
    side="right", seed=104, glow_pos=(0.70, 0.42), entry="right",
    decor="rings", photo_boost=1.12)

night_scene = ProductScene(
    *SCENES[5], index=5,
    bg_path=ROOT / "public/assets/generated/night-city-cover-perfect-v2-1773032380473.png",
    card_path=ROOT / "public/assets/generated/night-city-cyber-joggers-1773032534008.png",
    accent=(0, 238, 214), tag="NIGHT CITY // TECHWEAR",
    titles=[("NIGHT CITY", (0, 238, 214), 92),
            ("CYBER JOGGERS", (255, 255, 255), 62)],
    subtitle="Neon edge. All-terrain comfort.",
    price="INR 6,400", chips=["TECHWEAR", "NEON ACCENT"],
    side="right", seed=105, glow_pos=(0.72, 0.44), entry="right",
    decor="scanlines", photo_boost=1.22)

cursed_scene = ProductScene(
    *SCENES[6], index=6,
    bg_path=ROOT / "public/assets/generated/cursed-energy-product-sukuna-1773032399164.png",
    card_path=ROOT / "public/assets/generated/cursed-energy-product-sukuna-1773032399164.png",
    accent=(190, 122, 255), tag="CURSED ENERGY // DROP 03",
    titles=[("CURSED ENERGY", (190, 122, 255), 78),
            ("SUKUNA HOODIE", (255, 255, 255), 66)],
    subtitle="Dark aura. Premium street fit.",
    price="INR 5,900", chips=["HEAVY FLEECE", "DARK AURA"],
    side="right", seed=106, glow_pos=(0.28, 0.46), entry="right",
    decor="glitch", photo_boost=1.12)

montage_scene = MontageScene(
    *SCENES[7], index=7,
    subs=[
        ProductScene(
            25.2, 26.4, "THE DROP", 7,
            bg_path=ROOT / "public/assets/hoodies/water-breathing-hoodie-main.jpeg",
            card_path=ROOT / "public/assets/hoodies/water-breathing-hoodie-main.jpeg",
            accent=(92, 190, 255), tag="SLAYER CORPS",
            titles=[("WATER", (255, 255, 255), 96),
                    ("BREATHING HOODIE", (92, 190, 255), 48)],
            subtitle="Flow state. Limited run.",
            price="INR 6,000", chips=["GRAPHIC ART", "HEAVYWEIGHT"],
            side="right", seed=107, glow_pos=(0.30, 0.46), entry="right",
            photo_boost=1.08, quick=True),
        ProductScene(
            26.4, 27.6, "THE DROP", 7,
            bg_path=ROOT / "public/assets/cdn/water-breathing-hoodie-1b6ba7.png",
            card_path=ROOT / "public/assets/cdn/water-breathing-hoodie-1b6ba7.png",
            accent=(255, 205, 40), tag="SLAYER CORPS",
            titles=[("ZENITSU", (255, 205, 40), 104),
                    ("OVERSIZED", (255, 255, 255), 66)],
            subtitle="Lightning fast. Everyday armor.",
            price="INR 7,600", chips=["100% COTTON", "ANIME PRINT"],
            side="right", seed=108, glow_pos=(0.30, 0.46), entry="left",
            photo_boost=1.03, quick=True),
        ProductScene(
            27.6, 28.8, "THE DROP", 7,
            bg_path=ROOT / "public/assets/newgen/jacket-bomber-jacket-streetwear-product-photo-2f328d.jpg",
            card_path=ROOT / "public/assets/newgen/jacket-bomber-jacket-streetwear-product-photo-2f328d.jpg",
            accent=(249, 249, 6), tag="NEW FASHION",
            titles=[("SHADOW", (255, 255, 255), 100),
                    ("BOMBER JACKET", (249, 249, 6), 58)],
            subtitle="Back graphic. Built to move.",
            price="INR 5,400", chips=["LIMITED PIECE", "STREET FIT"],
            side="right", seed=109, glow_pos=(0.30, 0.46), entry="bottom",
            quick=True),
    ])

outro_scene = OutroScene(*SCENES[8], index=8)

SCENE_OBJS = [title_scene, hero_scene, fashion_scene, denim_scene, slayer_scene,
              night_scene, cursed_scene, montage_scene, outro_scene]


def render_frame(t):
    idx = scene_index(t)
    frame = SCENE_OBJS[idx].render(t)
    accent = getattr(SCENE_OBJS[idx], "accent", ACCENT)
    frame = frame.convert("RGB")
    # vignette
    frame.paste((0, 0, 0), (0, 0), VIGNETTE)
    draw_hud(frame, t, accent, SCENES[idx][2], idx)
    # final global fade so the HUD dissolves with the picture
    if t > 35.45:
        frame = Image.blend(frame, BLACK, clamp((t - 35.45) / 0.5))
    return frame


# ----------------------------------------------------------------------------- audio
TBL = 8192
SIN = [math.sin(2 * math.pi * i / TBL) for i in range(TBL)]
HALF_PI = math.pi / 2


def pan_gains(pan):
    ang = (max(-1.0, min(1.0, pan)) + 1) * math.pi / 4
    return math.cos(ang), math.sin(ang)


def note_freq(note):
    offsets = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    letter = note[0]
    i = 1
    accidental = ""
    if len(note) > 2 and note[1] in "#b":
        accidental = note[1]
        i = 2
    octave = int(note[i:])
    midi = 12 * (octave + 1) + offsets[letter]
    if accidental == "#":
        midi += 1
    elif accidental == "b":
        midi -= 1
    return 440.0 * (2 ** ((midi - 69) / 12))


def synth_audio():
    rnd = random.Random(4242)
    n = int(SR * DURATION)
    left = [0.0] * n
    right = [0.0] * n

    def add(idx, v, pan=0.0):
        if 0 <= idx < n:
            lg, rg = pan_gains(pan)
            left[idx] += v * lg
            right[idx] += v * rg

    # ---- taiko -------------------------------------------------------------
    def taiko(start, strength=1.0, pitch=1.0, pan=0.0):
        s = int(start * SR)
        length = min(int(0.95 * SR), n - s)
        if length <= 1:
            return
        ph = 0.0
        lp = 0.0
        lg, rg = pan_gains(pan)
        for i in range(length):
            t = i / SR
            f = (52.0 * pitch + 92.0 * pitch * math.exp(-t * 9.5))
            ph += f * TBL / SR
            if ph >= TBL:
                ph -= TBL
            env = math.exp(-t * 6.2) * (1 - math.exp(-t * 420))
            body = SIN[int(ph)] * env
            body += SIN[int(ph * 2.02) & (TBL - 1)] * math.exp(-t * 12) * 0.24
            noise = rnd.random() * 2 - 1
            lp += (noise - lp) * 0.14
            skin = lp * math.exp(-t * 26) * 0.55
            v = (body + skin) * strength * 0.50
            left[s + i] += v * lg
            right[s + i] += v * rg

    def sub_boom(start, strength=1.0):
        s = int(start * SR)
        length = min(int(1.6 * SR), n - s)
        ph = 0.0
        for i in range(length):
            t = i / SR
            f = 54 * (1 + 0.5 * math.exp(-t * 18))
            ph += f * TBL / SR
            if ph >= TBL:
                ph -= TBL
            env = math.exp(-t * 2.2) * (1 - math.exp(-t * 300))
            v = SIN[int(ph)] * env * strength * 0.20
            left[s + i] += v
            right[s + i] += v

    # ---- shakuhachi --------------------------------------------------------
    def flute(start, dur, note, amp=0.13, pan=-0.06):
        if start >= DURATION:
            return
        f = note_freq(note)
        s = int(start * SR)
        length = min(int(dur * SR), n - s)
        if length <= 1:
            return
        ph = rnd.random() * TBL
        attack = min(0.14, dur * 0.3)
        release = min(0.30, dur * 0.4)
        breath = 0.0
        lg, rg = pan_gains(pan)
        for i in range(length):
            t = i / SR
            env = min(1.0, t / attack) * min(1.0, max(0.0, (dur - t) / release))
            vib = 1 + 0.0045 * math.sin(2 * math.pi * 5.3 * t) * min(1.0, t * 4)
            ph += f * vib * TBL / SR
            ph %= TBL
            tone = SIN[int(ph)] * 0.72 + SIN[int(ph * 2) & (TBL - 1)] * 0.16
            tone += SIN[int(ph * 3) & (TBL - 1)] * 0.06
            nz = rnd.random() * 2 - 1
            breath += (nz - breath) * 0.10
            v = (tone + breath * 0.09 * min(1.0, t * 8)) * env * amp
            left[s + i] += v * lg
            right[s + i] += v * rg

    # ---- koto --------------------------------------------------------------
    def koto(start, note, amp=0.055, pan=0.25, dur=1.1):
        f = note_freq(note)
        s = int(start * SR)
        length = min(int(dur * SR), n - s)
        if length <= 1:
            return
        lg, rg = pan_gains(pan)
        phases = [rnd.random() * TBL for _ in range(4)]
        for i in range(length):
            t = i / SR
            v = 0.0
            for h in range(1, 5):
                phases[h - 1] = (phases[h - 1] + f * h * TBL / SR) % TBL
                v += SIN[int(phases[h - 1])] * (1.0 / h) * math.exp(-t * (2.2 + h * 0.9))
            pick = (rnd.random() * 2 - 1) * math.exp(-t * 180) * 0.16
            v = (v * 0.7 + pick) * amp
            left[s + i] += v * lg
            right[s + i] += v * rg

    # ---- pads / strings ----------------------------------------------------
    def pad(start, dur, notes, amp=0.06, pan=0.0):
        s = int(start * SR)
        length = min(int(dur * SR), n - s)
        if length <= 1:
            return
        voices = []
        for note in notes:
            f = note_freq(note)
            voices.append([rnd.random(), f * 0.997])
            voices.append([rnd.random(), f * 1.003])
        attack = min(0.5, dur * 0.35)
        release = min(0.7, dur * 0.4)
        lg, rg = pan_gains(pan)
        for i in range(length):
            t = i / SR
            env = min(1.0, t / attack) * min(1.0, max(0.0, (dur - t) / release))
            v = 0.0
            for vi in range(len(voices)):
                ph = voices[vi][0] + voices[vi][1] / SR
                if ph >= 1.0:
                    ph -= 1.0
                voices[vi][0] = ph
                v += (2 * ph - 1)
            v = v / len(voices) * amp * env
            left[s + i] += v * lg
            right[s + i] += v * rg

    def choir(start, dur, notes, amp=0.05, pan=0.0):
        s = int(start * SR)
        length = min(int(dur * SR), n - s)
        if length <= 1:
            return
        voices = []
        for note in notes:
            f = note_freq(note)
            voices.append([rnd.random() * TBL, f, 1.0])
            voices.append([rnd.random() * TBL, f * 1.004, 1.0])
        attack = min(0.8, dur * 0.4)
        release = min(0.9, dur * 0.45)
        lg, rg = pan_gains(pan)
        for i in range(length):
            t = i / SR
            env = min(1.0, t / attack) * min(1.0, max(0.0, (dur - t) / release))
            vib = 1 + 0.003 * math.sin(2 * math.pi * 4.1 * t)
            v = 0.0
            for vi in range(len(voices)):
                ph = (voices[vi][0] + voices[vi][1] * vib * TBL / SR) % TBL
                voices[vi][0] = ph
                v += SIN[int(ph)] + 0.25 * SIN[int(ph * 2) & (TBL - 1)]
            v = v / len(voices) * amp * env
            left[s + i] += v * lg
            right[s + i] += v * rg

    def drone():
        for i in range(n):
            t = i / SR
            fade = min(1.0, t / 1.8) * min(1.0, max(0.0, (DURATION - t) / 2.4))
            v = (math.sin(2 * math.pi * 73.42 * t) * 0.055 +
                 math.sin(2 * math.pi * 110.0 * t + 0.4) * 0.022 +
                 math.sin(2 * math.pi * 146.83 * t) * 0.012)
            left[i] += v * fade
            right[i] += v * fade

    def bell(start, note, amp=0.07, pan=0.2):
        f = note_freq(note)
        s = int(start * SR)
        length = min(int(2.4 * SR), n - s)
        lg, rg = pan_gains(pan)
        for i in range(length):
            t = i / SR
            env = (1 - math.exp(-t * 600)) * math.exp(-t * 1.7)
            v = (math.sin(2 * math.pi * f * t) +
                 0.42 * math.sin(2 * math.pi * f * 2.76 * t) * math.exp(-t * 1.2) +
                 0.18 * math.sin(2 * math.pi * f * 5.4 * t) * math.exp(-t * 2.2))
            v = v * env * amp
            left[s + i] += v * lg
            right[s + i] += v * rg

    def riser(start, dur, amp=0.06, pan=0.0):
        s = int(start * SR)
        length = min(int(dur * SR), n - s)
        lp = 0.0
        lg, rg = pan_gains(pan)
        for i in range(length):
            p = i / length
            env = math.sin(math.pi * p) ** 2
            lp += ((rnd.random() * 2 - 1) - lp) * (0.02 + p * 0.30)
            v = lp * env * amp
            left[s + i] += v * lg
            right[s + i] += v * rg

    def hat(start, amp=0.02, pan=0.0):
        s = int(start * SR)
        length = min(int(0.05 * SR), n - s)
        lg, rg = pan_gains(pan)
        hp = 0.0
        for i in range(length):
            t = i / SR
            nz = rnd.random() * 2 - 1
            hp += (nz - hp) * 0.55
            v = (nz - hp) * math.exp(-t * 90) * amp
            left[s + i] += v * lg
            right[s + i] += v * rg

    # ---- arrangement -------------------------------------------------------
    drone()
    chords = [
        (0.0, 3.4, ["D3", "F3", "A3"]),
        (3.2, 7.4, ["Bb2", "D3", "F3"]),
        (7.2, 11.0, ["F2", "A2", "C3"]),
        (10.8, 14.6, ["C3", "E3", "G3"]),
        (14.4, 18.8, ["D3", "F3", "A3", "D4"]),
        (18.6, 22.2, ["Bb2", "D3", "F3"]),
        (22.0, 25.4, ["G2", "Bb2", "D3"]),
        (25.2, 29.0, ["A2", "C#3", "E3"]),
        (28.8, 33.2, ["D3", "F3", "A3", "D4"]),
        (33.0, 36.0, ["D3", "A3", "D4"]),
    ]
    for start, end, notes in chords:
        pad(start, end - start + 0.4, notes, amp=0.052 if start < 14.4 else 0.066)
    for start, end, notes in [(14.4, 18.6, ["D3", "F3", "A3"]),
                              (18.6, 22.0, ["Bb2", "D3", "F3"]),
                              (28.8, 33.0, ["D3", "F3", "A3", "D4"])]:
        choir(start, end - start, notes, amp=0.05)

    def chord_for(time):
        for cstart, cend, notes in chords:
            if cstart <= time < cend:
                return notes
        return chords[-1][2]

    # koto arpeggios
    t = 3.2
    step = 0.6
    idx = 0
    while t < 28.8:
        notes = chord_for(t)
        note = notes[idx % len(notes)]
        koto(t, note, amp=0.05, pan=-0.34 if idx % 2 == 0 else 0.34,
             dur=1.0)
        idx += 1
        step = 0.3 if 25.2 <= t < 28.8 else 0.6
        t += step

    # flute phrases
    flute_notes = [
        (1.15, "A3", 1.0, 0.11), (2.20, "D4", 1.1, 0.12),
        (3.45, "D4", 0.7, 0.13), (4.15, "F4", 0.5, 0.13),
        (4.65, "A4", 1.0, 0.14), (5.70, "C5", 0.55, 0.13),
        (6.30, "A4", 0.75, 0.13),
        (7.45, "D4", 0.6, 0.14), (8.05, "F4", 0.5, 0.14),
        (8.55, "A4", 0.85, 0.15), (9.45, "D5", 1.1, 0.16),
        (10.55, "C5", 0.5, 0.14),
        (11.15, "F3", 0.7, 0.13), (11.9, "A3", 0.6, 0.13),
        (12.5, "C4", 0.75, 0.14), (13.25, "D4", 1.0, 0.15),
        (14.55, "D5", 0.7, 0.17), (15.3, "F5", 0.5, 0.16),
        (15.8, "A5", 1.0, 0.18), (16.85, "G5", 0.6, 0.16),
        (17.45, "F5", 0.5, 0.16), (17.95, "D5", 0.6, 0.16),
        (18.8, "F5", 0.6, 0.16), (19.45, "D5", 0.6, 0.15),
        (20.05, "C5", 0.7, 0.15), (20.75, "A4", 1.0, 0.14),
        (21.75, "Bb4", 0.7, 0.14),
        (22.35, "A4", 1.3, 0.125), (23.65, "C5", 0.9, 0.13),
        (24.55, "D5", 1.4, 0.135),
        (25.4, "D4", 0.22, 0.09), (25.65, "F4", 0.22, 0.09),
        (25.9, "G4", 0.22, 0.09), (26.15, "A4", 0.22, 0.10),
        (26.4, "C5", 0.22, 0.10), (26.65, "D5", 0.22, 0.10),
        (26.9, "F5", 0.22, 0.11), (27.15, "A5", 0.24, 0.12),
        (27.45, "D5", 0.3, 0.12), (27.75, "A5", 0.55, 0.13),
        (29.0, "D5", 0.8, 0.17), (29.8, "F5", 0.6, 0.17),
        (30.4, "A5", 1.2, 0.18), (31.6, "G5", 0.6, 0.16),
        (32.2, "F5", 0.6, 0.16), (32.85, "D5", 1.5, 0.16),
    ]
    for start, note, dur, amp in flute_notes:
        flute(start, dur, note, amp=amp)

    # taiko pulse
    t = 3.2
    beat = 0.6
    k = 0
    while t < 33.0:
        accent = (k % 4 == 0)
        strength = (0.86 if accent else 0.52) * (1.12 if t >= 14.4 else 0.92)
        taiko(t, strength, 1.0, pan=-0.16 if k % 2 == 0 else 0.16)
        if 14.4 <= t < 28.8:
            taiko(t + 0.3, 0.24, 1.35, pan=0.24 if k % 2 == 0 else -0.24)
        if 10.8 <= t < 14.4:
            taiko(t + 0.3, 0.18, 1.3, pan=0.2)
        k += 1
        t += beat

    # rolls into cuts
    def roll(t0, t1, strength=0.45):
        tt = t0
        step = 0.14
        while tt < t1:
            taiko(tt, strength * (0.7 + 0.3 * ((tt - t0) / max(0.01, t1 - t0))),
                  1.05, pan=0.0)
            step = max(0.055, step * 0.93)
            tt += step

    roll(6.5, 7.2, 0.42)
    roll(10.0, 10.8, 0.45)
    roll(13.1, 14.4, 0.55)
    roll(17.9, 18.6, 0.45)
    roll(21.3, 22.0, 0.40)
    roll(24.5, 25.2, 0.46)
    roll(28.0, 28.8, 0.60)

    # cut hits
    hits = [
        (0.0, 1.35, 0.95), (3.2, 1.00, 1.00), (7.2, 0.95, 1.00),
        (10.8, 0.95, 0.95), (14.4, 1.45, 0.90), (18.6, 1.05, 1.00),
        (22.0, 0.95, 0.85), (25.2, 1.00, 0.95), (26.4, 0.62, 1.10),
        (27.6, 0.66, 1.15), (28.8, 1.50, 0.90), (31.2, 1.00, 0.95),
        (33.0, 1.35, 0.85),
    ]
    for start, strength, pitch in hits:
        taiko(start, strength, pitch, pan=0.0)
        if strength >= 1.3:
            sub_boom(start, strength)

    for start, note in [(14.4, "D5"), (16.8, "A5"), (19.2, "F5"),
                        (21.6, "D5"), (28.8, "D5"), (31.2, "A5"),
                        (33.0, "D5")]:
        bell(start, note, amp=0.065, pan=0.18)

    for start, dur in [(2.55, 0.65), (13.15, 1.2), (24.3, 0.9),
                       (27.7, 1.05), (34.0, 0.8)]:
        riser(start, dur, amp=0.055)

    # hats during the full section
    t = 14.4
    while t < 28.8:
        hat(t, amp=0.016, pan=0.3 if int(t * 10) % 2 else -0.3)
        hat(t + 0.3, amp=0.009, pan=-0.25)
        t += 0.6

    # ---- reverb ------------------------------------------------------------
    d1 = int(0.083 * SR)
    d2 = int(0.117 * SR)
    for i in range(d1, n):
        l = left[i - d1]
        r = right[i - d2]
        left[i] += l * 0.16 + r * 0.05
        right[i] += r * 0.16 + l * 0.05

    # ---- master ------------------------------------------------------------
    peak = 1e-9
    for i in range(n):
        if abs(left[i]) > peak:
            peak = abs(left[i])
        if abs(right[i]) > peak:
            peak = abs(right[i])
    gain = 0.90 / peak
    fade_in = int(0.05 * SR)
    fade_out = int(2.2 * SR)
    OUT_AUDIO.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT_AUDIO), "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        frames = bytearray()
        for i in range(n):
            env = 1.0
            if i < fade_in:
                env = i / fade_in
            if i > n - fade_out:
                env = min(env, (n - i) / fade_out)
            l = math.tanh(left[i] * gain * env * 1.06) * 0.95
            r = math.tanh(right[i] * gain * env * 1.06) * 0.95
            frames += struct.pack("<hh", int(l * 32767), int(r * 32767))
        wf.writeframes(frames)
    print(f"[audio] wrote {OUT_AUDIO} ({DURATION:.0f}s)")


# ----------------------------------------------------------------------------- render
def render_video():
    total = int(round(DURATION * FPS))
    OUT_VIDEO.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
        "-r", str(FPS), "-i", "-",
        "-i", str(OUT_AUDIO),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", "-movflags", "+faststart",
        str(OUT_VIDEO),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    try:
        for f in range(total):
            frame = render_frame(f / FPS)
            proc.stdin.write(frame.tobytes())
            if f % 120 == 0:
                done = f / total
                elapsed = time.time() - t0
                eta = elapsed / max(0.001, done) - elapsed if done else 0
                print(f"[video] frame {f}/{total}  {done * 100:5.1f}%  eta {eta:5.0f}s")
        proc.stdin.close()
        code = proc.wait()
    except BrokenPipeError:
        code = proc.wait()
    if code != 0:
        raise SystemExit(f"ffmpeg exited with {code}")
    print(f"[video] wrote {OUT_VIDEO} in {time.time() - t0:.0f}s")

    poster = render_frame(1.45)
    poster.save(OUT_POSTER, quality=92)
    print(f"[poster] wrote {OUT_POSTER}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reuse-audio", action="store_true")
    parser.add_argument("--audio-only", action="store_true")
    args = parser.parse_args()
    if args.audio_only:
        synth_audio()
        return
    if not (args.reuse_audio and OUT_AUDIO.exists()):
        synth_audio()
    render_video()


if __name__ == "__main__":
    main()
