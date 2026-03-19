"""Generate GitHub social preview image for Folio."""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

WIDTH, HEIGHT = 1280, 640
GREEN = (29, 185, 84)
GREEN_DARK = (20, 140, 60)
BG = (10, 10, 10)
SURFACE = (28, 28, 30)
WHITE = (255, 255, 255)
WHITE_DIM = (200, 200, 200)
MUTED = (140, 140, 140)
GREEN_BADGE_BG = (18, 42, 26)

# Fonts
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"

ICON_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "icon.png")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "social-preview.png")

img = Image.new("RGB", (WIDTH, HEIGHT), BG)
draw = ImageDraw.Draw(img)

# Subtle gradient overlay
for y in range(HEIGHT):
    r = int(BG[0] + (15 - BG[0]) * (y / HEIGHT) * 0.3)
    g = int(BG[1] + (25 - BG[1]) * (y / HEIGHT) * 0.3)
    b = int(BG[2] + (18 - BG[2]) * (y / HEIGHT) * 0.3)
    draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))

# Green accent line at top
draw.rectangle([(0, 0), (WIDTH, 4)], fill=GREEN)

# Layout: icon on left-center, text on right
CONTENT_Y_START = 140
LEFT_MARGIN = 100

# Draw app icon
icon = Image.open(ICON_PATH).convert("RGBA")
icon_size = 160
icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

# Create rounded mask for icon
mask = Image.new("L", (icon_size, icon_size), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([(0, 0), (icon_size, icon_size)], radius=36, fill=255)

# Place icon
icon_x = LEFT_MARGIN
icon_y = HEIGHT // 2 - icon_size // 2 - 20
img.paste(icon, (icon_x, icon_y), mask)

# Text area starts after icon
TEXT_X = icon_x + icon_size + 60
TEXT_MAX_W = WIDTH - TEXT_X - 80

# "Folio" title
font_title = ImageFont.truetype(FONT_BLACK, 72)
draw.text((TEXT_X, icon_y - 10), "Folio", fill=WHITE, font=font_title)

# Tagline
font_tagline = ImageFont.truetype(FONT_BOLD, 28)
draw.text(
    (TEXT_X, icon_y + 80),
    "Your Smart Coupon Wallet",
    fill=GREEN,
    font=font_tagline,
)

# Description
font_desc = ImageFont.truetype(FONT_REG, 20)
desc = "Scan, organize, and never miss a deal.\nOffline-first. No accounts. No tracking. No ads."
draw.multiline_text(
    (TEXT_X, icon_y + 125),
    desc,
    fill=WHITE_DIM,
    font=font_desc,
    spacing=8,
)

# Feature pills at bottom
features = ["OCR Scanning", "Expiry Alerts", "100% Offline", "Open Source"]
font_pill = ImageFont.truetype(FONT_BOLD, 16)
pill_x = TEXT_X
pill_y = icon_y + 210

for feat in features:
    bbox = font_pill.getbbox(feat)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pill_w = tw + 28
    pill_h = th + 16
    # Pill background
    draw.rounded_rectangle(
        [(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)],
        radius=pill_h // 2,
        fill=SURFACE,
        outline=(50, 50, 52),
    )
    draw.text(
        (pill_x + 14, pill_y + 7),
        feat,
        fill=GREEN,
        font=font_pill,
    )
    pill_x += pill_w + 12

# GitHub badge bottom-left
font_gh = ImageFont.truetype(FONT_REG, 15)
gh_text = "github.com/suryarjuna/folio"
draw.text((LEFT_MARGIN, HEIGHT - 50), gh_text, fill=MUTED, font=font_gh)

# "Free & Open Source" badge bottom-right
font_badge = ImageFont.truetype(FONT_BOLD, 14)
badge_text = "FREE & OPEN SOURCE"
bbox = font_badge.getbbox(badge_text)
bw = bbox[2] - bbox[0] + 24
bh = bbox[3] - bbox[1] + 14
bx = WIDTH - 100 - bw
by = HEIGHT - 54
draw.rounded_rectangle(
    [(bx, by), (bx + bw, by + bh)],
    radius=bh // 2,
    fill=GREEN_BADGE_BG,
    outline=GREEN,
)
draw.text((bx + 12, by + 5), badge_text, fill=GREEN, font=font_badge)

img.save(OUTPUT_PATH, "PNG", quality=95)
print(f"Saved social preview: {OUTPUT_PATH}")
print(f"Size: {WIDTH}x{HEIGHT}")
