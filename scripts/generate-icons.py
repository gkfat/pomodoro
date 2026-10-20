# 產生 PWA icon：public/icon.svg 與 public/icons/*.png。
# 用法：python3 scripts/generate-icons.py（需要 Pillow）
# 圖案取自計時畫面：深色圓盤、灰玫瑰色進度環（約 75%，起點在正上方）與鼠尾草綠的蕃茄葉梗。
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BASE = 512  # 所有幾何以 512 為基準
SUPERSAMPLE = 4

BACKGROUND = '#3E4350'
DISC = '#32363F'
TRACK = '#555B69'
ARC = '#D4A5A5'
LEAF = '#9FB3A0'

CENTER = BASE / 2
RING_RADIUS = 153.6
RING_WIDTH = 38.4
DISC_RADIUS = 184
ARC_SWEEP = 270  # 從正上方順時針
CORNER_RADIUS = 112
STEM = (250, 60, 262, 104)  # x0, y0, x1, y1
LEAF_CENTER = (292, 80)
LEAF_RADII = (34, 14)
LEAF_ANGLE = -30


def leaf_polygon(scale: float) -> list[tuple[float, float]]:
    cx, cy = LEAF_CENTER
    rx, ry = LEAF_RADII
    angle = math.radians(LEAF_ANGLE)
    points = []
    for step in range(72):
        t = step / 72 * 2 * math.pi
        x, y = rx * math.cos(t), ry * math.sin(t)
        rotated_x = x * math.cos(angle) - y * math.sin(angle)
        rotated_y = x * math.sin(angle) + y * math.cos(angle)
        points.append(((cx + rotated_x) * scale, (cy + rotated_y) * scale))
    return points


def draw_icon(size: int, rounded: bool) -> Image.Image:
    scale = size * SUPERSAMPLE / BASE
    canvas_size = size * SUPERSAMPLE
    image = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    if rounded:
        draw.rounded_rectangle((0, 0, canvas_size - 1, canvas_size - 1), CORNER_RADIUS * scale, fill=BACKGROUND)
    else:
        draw.rectangle((0, 0, canvas_size, canvas_size), fill=BACKGROUND)

    def circle(radius: float, fill: str, cx: float = CENTER, cy: float = CENTER) -> None:
        draw.ellipse(((cx - radius) * scale, (cy - radius) * scale, (cx + radius) * scale, (cy + radius) * scale), fill=fill)

    circle(DISC_RADIUS, DISC)

    # PIL 的 width 是從外框往內畫，所以外框取環中心半徑加上半個線寬。
    outer = RING_RADIUS + RING_WIDTH / 2
    box = (
        (CENTER - outer) * scale,
        (CENTER - outer) * scale,
        (CENTER + outer) * scale,
        (CENTER + outer) * scale,
    )
    draw.ellipse(box, outline=TRACK, width=round(RING_WIDTH * scale))
    # PIL 的角度從 3 點鐘方向順時針計算，正上方是 -90 度。
    draw.arc(box, -90, -90 + ARC_SWEEP, fill=ARC, width=round(RING_WIDTH * scale))
    for degrees in (-90, -90 + ARC_SWEEP):
        radians = math.radians(degrees)
        circle(RING_WIDTH / 2, ARC, CENTER + RING_RADIUS * math.cos(radians), CENTER + RING_RADIUS * math.sin(radians))

    x0, y0, x1, y1 = STEM
    draw.rounded_rectangle((x0 * scale, y0 * scale, x1 * scale, y1 * scale), (x1 - x0) / 2 * scale, fill=LEAF)
    draw.polygon(leaf_polygon(scale), fill=LEAF)

    return image.resize((size, size), Image.LANCZOS)


def svg() -> str:
    x0, y0, x1, y1 = STEM
    start = (CENTER, CENTER - RING_RADIUS)
    end = (CENTER - RING_RADIUS, CENTER)
    cap_radius = RING_WIDTH / 2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {BASE} {BASE}">
  <rect width="{BASE}" height="{BASE}" rx="{CORNER_RADIUS}" fill="{BACKGROUND}"/>
  <circle cx="{CENTER}" cy="{CENTER}" r="{DISC_RADIUS}" fill="{DISC}"/>
  <circle cx="{CENTER}" cy="{CENTER}" r="{RING_RADIUS}" fill="none" stroke="{TRACK}" stroke-width="{RING_WIDTH}"/>
  <path d="M {start[0]} {start[1]} A {RING_RADIUS} {RING_RADIUS} 0 1 1 {end[0]} {end[1]}" fill="none" stroke="{ARC}" stroke-width="{RING_WIDTH}" stroke-linecap="round"/>
  <rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="{(x1 - x0) / 2}" fill="{LEAF}"/>
  <ellipse cx="{LEAF_CENTER[0]}" cy="{LEAF_CENTER[1]}" rx="{LEAF_RADII[0]}" ry="{LEAF_RADII[1]}" transform="rotate({LEAF_ANGLE} {LEAF_CENTER[0]} {LEAF_CENTER[1]})" fill="{LEAF}"/>
</svg>
'''


def main() -> None:
    public = ROOT / 'public'
    icons = public / 'icons'
    icons.mkdir(parents=True, exist_ok=True)
    (public / 'icon.svg').write_text(svg(), encoding='utf-8')
    draw_icon(192, rounded=True).save(icons / 'icon-192.png')
    draw_icon(512, rounded=True).save(icons / 'icon-512.png')
    # maskable 與 apple-touch-icon 需滿版背景，由系統自行裁切圓角
    draw_icon(512, rounded=False).save(icons / 'maskable-512.png')
    draw_icon(180, rounded=False).convert('RGB').save(icons / 'apple-touch-icon.png')
    print('generated public/icon.svg and public/icons/*.png')


if __name__ == '__main__':
    main()
