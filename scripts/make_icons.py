"""Builds the install icons in public/icons from the two master images in public/icons/source.

mobile/  full-bleed art: Android adaptive (maskable) icons and the iOS home-screen icon.
desktop/ wood-sign tile on transparency: installed-app icons for Windows/macOS/ChromeOS, favicons, .ico.
"""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / 'public' / 'icons'
SRC = ROOT / 'source'
MOBILE = ROOT / 'mobile'
DESKTOP = ROOT / 'desktop'


def square(img):
    s = min(img.size)
    left, top = (img.width - s) // 2, (img.height - s) // 2
    return img.crop((left, top, left + s, top + s))


def save(img, path, size):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    print(f'{path.relative_to(ROOT)}  {size}x{size}')


def desktop_tile(master):
    """Cuts the rounded tile out of its white backdrop and centres it with a small margin."""
    rgb = master.convert('RGB')
    diff = ImageChops.difference(rgb, Image.new('RGB', rgb.size, (255, 255, 255))).convert('L')
    l, t, r, b = diff.point(lambda v: 255 if v > 60 else 0).getbbox()
    inset = int((r - l) * 0.006)
    tile = rgb.crop((l + inset, t + inset, r - inset, b - inset))
    w, h = tile.size
    scale = 4
    mask = Image.new('L', (w * scale, h * scale), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w * scale - 1, h * scale - 1), radius=int(min(w, h) * 0.15 * scale), fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    # Leftover backdrop inside the rounded corners: near-white pixels connected to the outside become transparent.
    # The gold rim separates the backdrop from the bright swirl inside, so the artwork is untouched.
    pad = 2
    not_white = ImageChops.difference(tile, Image.new('RGB', tile.size, (255, 255, 255))).convert('L')
    region = Image.new('L', (w + pad * 2, h + pad * 2), 255)
    region.paste(not_white.point(lambda v: 255 if v < 40 else 0), (pad, pad))
    ImageDraw.floodfill(region, (0, 0), 128)
    outside = region.crop((pad, pad, pad + w, pad + h)).point(lambda v: 0 if v == 128 else 255)
    mask = ImageChops.darker(mask, outside.filter(ImageFilter.GaussianBlur(1)))
    rgba = tile.convert('RGBA')
    rgba.putalpha(mask)

    side = int(max(w, h) / 0.92)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    shadow = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    ox, oy = (side - w) // 2, (side - h) // 2
    shadow.paste((0, 0, 0, 110), (ox, oy + side // 60), mask)
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(side // 80)))
    canvas.alpha_composite(rgba, (ox, oy))
    return canvas


def face_badge(master):
    """Close-up of the hen's face on a rounded tile; the full scene is unreadable at 16-32 px."""
    s = master.width
    face = master.crop((int(s * 0.15), int(s * 0.08), int(s * 0.61), int(s * 0.54))).convert('RGBA')
    m = Image.new('L', face.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, face.width - 1, face.height - 1), radius=int(face.width * 0.2), fill=255)
    face.putalpha(m)
    return face


def main():
    mobile = square(Image.open(SRC / 'icon_master_mobile.png').convert('RGB'))
    desktop = desktop_tile(square(Image.open(SRC / 'icon_master_desktop.png')))
    face = face_badge(mobile)

    # Android: maskable icons keep the hen inside the central safe circle; launchers crop to their own shape.
    for s in (192, 512):
        save(mobile, MOBILE / f'maskable-{s}.png', s)
    # iOS home screen (iOS rounds the corners itself and ignores transparency).
    save(mobile, MOBILE / 'apple-touch-icon.png', 180)
    for s in (120, 152, 167):
        save(mobile, MOBILE / f'apple-touch-icon-{s}.png', s)

    # Installed desktop app (Chrome/Edge on Windows, macOS, ChromeOS) and browser tabs.
    for s in (48, 64, 128, 192, 256, 512):
        save(desktop, DESKTOP / f'icon-{s}.png', s)
    for s in (16, 32):
        save(face, DESKTOP / f'favicon-{s}.png', s)
    # Multi-size .ico: face close-up for tab/titlebar sizes, the full tile for shortcuts and the taskbar.
    frames = [face.resize((s, s), Image.LANCZOS) for s in (16, 32)] + [desktop.resize((s, s), Image.LANCZOS) for s in (48, 64, 128, 256)]
    frames[-1].save(DESKTOP / 'favicon.ico', format='ICO', sizes=[f.size for f in frames], append_images=frames[:-1])
    print('desktop/favicon.ico  16-256')


if __name__ == '__main__':
    main()
