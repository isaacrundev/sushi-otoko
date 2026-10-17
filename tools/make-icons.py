"""產生 PWA 圖示。改設計就改這裡再跑一次：python3 tools/make-icons.py"""
from PIL import Image, ImageDraw
from pathlib import Path

BG = (20, 22, 26)       # --bg 附近的底色
PLATE = (238, 241, 246)
ACCENT = (52, 211, 153)

ROOT = Path(__file__).resolve().parent.parent


def make(size, path):
    S = size * 4  # 先畫 4 倍再縮，得到抗鋸齒
    img = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(img)
    c = S / 2

    def circle(ratio, color):
        r = S * ratio
        d.ellipse([c - r, c - r, c + r, c + r], fill=color)

    # 盤子（外圈留白 → 可安全裁切成 maskable）
    circle(0.34, PLATE)
    circle(0.25, BG)
    circle(0.115, ACCENT)

    img.resize((size, size), Image.Resampling.LANCZOS).save(path, "PNG")
    print(f"{path.relative_to(ROOT)}  {size}x{size}")


for n in (180, 192, 512):
    make(n, ROOT / f"icon-{n}.png")
