"""產生 PWA 圖示。改設計就改這裡再跑一次：python3 tools/make-icons.py"""
from PIL import Image, ImageDraw
from pathlib import Path

BG = (20, 22, 26)       # --bg 附近的底色
RICE = (244, 241, 233)  # 醋飯
FISH = (249, 130, 98)   # 鮭魚
FAT = (255, 208, 188)   # 鮭魚油花
NORI = (44, 76, 58)     # 海苔（比底色亮，小尺寸才不會跟背景糊在一起）

ROOT = Path(__file__).resolve().parent.parent


def make(size, path):
    S = size * 4  # 先畫 4 倍再縮，得到抗鋸齒
    img = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(img)

    def p(*v):  # 比例 → 像素
        return [x * S for x in v]

    # 醋飯：下方圓角長條
    d.rounded_rectangle(p(0.205, 0.50, 0.795, 0.805), radius=0.115 * S, fill=RICE)

    # 鮭魚：蓋在飯上，兩端比飯寬一點（握壽司的魚肉會垂下來），圓角收邊
    fish = Image.new("RGB", (S, S), FISH)
    fd = ImageDraw.Draw(fish)
    for i in range(4):  # 油花：斜線，靠遮罩裁掉超出魚肉的部分
        x0 = 0.20 + 0.16 * i
        fd.line(p(x0, 0.25, x0 + 0.10, 0.62), fill=FAT, width=int(0.024 * S))
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        p(0.15, 0.29, 0.85, 0.56), radius=0.135 * S, fill=255
    )
    img.paste(fish, (0, 0), mask)

    # 海苔：橫向帶子綁住飯與魚，遠看也知道是壽司
    d.rounded_rectangle(p(0.458, 0.285, 0.542, 0.805), radius=0.012 * S, fill=NORI)

    img.resize((size, size), Image.Resampling.LANCZOS).save(path, "PNG")
    print(f"{path.relative_to(ROOT)}  {size}x{size}")


for n in (180, 192, 512):
    make(n, ROOT / f"icon-{n}.png")
