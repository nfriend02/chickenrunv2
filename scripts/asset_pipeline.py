"""Chicken Run V2 asset pipeline.

Usage:
  python scripts/asset_pipeline.py videos [--char funny_chicken] [--action run]
  python scripts/asset_pipeline.py backgrounds [--stage 1]
  python scripts/asset_pipeline.py props [--stage 1]
  python scripts/asset_pipeline.py sprites
  python scripts/asset_pipeline.py all

Raw inputs (read only): raw_videos/, raw_backgrounds/, raw_generated/
Outputs: public/assets/anim/, public/assets/stages/, public/assets/images/
Previews and temp frames: .cache/
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW_VIDEOS = ROOT / "raw_videos"
RAW_BG = ROOT / "raw_backgrounds"
RAW_GEN = ROOT / "raw_generated"
OUT_ANIM = ROOT / "public" / "assets" / "anim"
OUT_STAGES = ROOT / "public" / "assets" / "stages"
OUT_IMAGES = ROOT / "public" / "assets" / "images"
CACHE = ROOT / ".cache"

EXTRACT_FPS = 12
FRAME_HEIGHT = {"default": 256, "cat_grumpy": 320}
MAX_SHEET_WIDTH = 4096

# Veo puts a small sparkle watermark near the bottom-right corner.
WATERMARK_BOX = (0.86, 0.74, 0.97, 0.92)

LOOP_ACTIONS = {"run", "walk", "chase", "move", "rush", "angry", "victory"}
# Short cyclic motions get an auto-detected seamless loop; longer performances are sampled evenly.
CYCLE_ACTIONS = {"run", "walk", "chase", "move", "rush"}

# Per-clip source ranges in seconds. Clips not listed use the whole video.
CLIP_OVERRIDES = {
    ("funny_chicken", "run"): {"start": 0.0, "end": 1.40},
    ("funny_chicken", "jump"): {"start": 0.8, "end": 3.2},
    ("funny_chicken", "hit"): {"start": 0.0, "end": 2.5},
    ("funny_chicken", "caught"): {"start": 0.0, "end": 2.8},
    ("daffy_duck", "jump"): {"start": 0.5, "end": 3.5},
    ("daffy_duck", "caught"): {"start": 0.5, "end": 2.8},
    ("rooster_king", "jump"): {"start": 1.0, "end": 3.3},
    ("rooster_king", "hit"): {"start": 1.2, "end": 3.0},
    ("rooster_king", "caught"): {"start": 0.8, "end": 3.2},
    ("speedy_chick", "jump"): {"start": 0.3, "end": 2.6},
    ("speedy_chick", "caught"): {"start": 0.4, "end": 2.8},
    ("turbo_turkey", "jump"): {"start": 1.0, "end": 3.4},
    ("turbo_turkey", "hit"): {"start": 0.8, "end": 3.2},
    ("turbo_turkey", "caught"): {"start": 0.6, "end": 2.8},
    # Subjects that walk away from / toward the camera shrink or grow; normalize per-frame size.
    ("cat_grumpy", "walk"): {"start": 0.0, "end": 2.2, "normalize": True},
    ("cat_grumpy", "chase"): {"start": 0.0, "end": 1.3},
    ("dog", "move"): {"start": 1.2, "end": None, "normalize": True},
    ("cow_rushing", "move"): {"start": 1.2, "end": None, "normalize": True},
}

MAX_FRAMES = {"loop": 12, "once": 16}

_rembg_session = None


def log(msg):
    print(msg, flush=True)


def ffmpeg_exe():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        sys.exit("ffmpeg not found. Install with: pip install imageio-ffmpeg")


def rembg_remove(img):
    global _rembg_session
    from rembg import new_session, remove
    if _rembg_session is None:
        _rembg_session = new_session("isnet-general-use")
    return remove(img, session=_rembg_session)


# ---------------------------------------------------------------- videos

def extract_frames(video, start, end, out_dir):
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    cmd = [ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y",
           "-ss", f"{start:.3f}"]
    if end is not None:
        cmd += ["-t", f"{end - start:.3f}"]
    cmd += ["-i", str(video), "-vf", f"fps={EXTRACT_FPS}", str(out_dir / "f_%03d.png")]
    subprocess.run(cmd, check=True)
    return sorted(out_dir.glob("f_*.png"))


def frame_signature(path):
    img = Image.open(path).convert("L").resize((64, 36))
    return np.asarray(img, dtype=np.float32) / 255.0


def pick_loop(frames, max_len):
    """Find the start/length whose last frame flows back into the first one."""
    sigs = [frame_signature(f) for f in frames]
    n = len(sigs)
    best = (1e9, 0, min(n, max_len))
    for a in range(0, max(1, n // 3)):
        for length in range(6, max_len + 1):
            if a + length >= n:
                break
            diff = float(np.mean(np.abs(sigs[a] - sigs[a + length])))
            if diff < best[0]:
                best = (diff, a, length)
    _, a, length = best
    return frames[a:a + length], best[0]


def sample_evenly(frames, count):
    if len(frames) <= count:
        return frames
    idx = np.linspace(0, len(frames) - 1, count).round().astype(int)
    return [frames[i] for i in idx]


def cut_watermark(rgba):
    w, h = rgba.size
    x0, y0, x1, y1 = WATERMARK_BOX
    arr = np.asarray(rgba).copy()
    arr[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w), 3] = 0
    return Image.fromarray(arr)


def alpha_anchor(rgba):
    a = np.asarray(rgba)[:, :, 3].astype(np.float32)
    mask = a > 40
    if mask.sum() < 50:
        return None
    rows = np.where(mask.sum(axis=1) > 3)[0]
    ys, xs = np.nonzero(mask)
    weights = a[ys, xs]
    cx = float((xs * weights).sum() / weights.sum())
    bottom = int(rows.max())
    return cx, bottom


def build_sheet(char, action, rgba_frames, loop):
    anchors = [alpha_anchor(f) for f in rgba_frames]
    valid = [a for a in anchors if a is not None]
    if not valid:
        raise RuntimeError(f"{char}/{action}: background removal left nothing")
    ref_x = float(np.median([a[0] for a in valid]))
    ref_bottom = int(np.median([a[1] for a in valid]))

    w, h = rgba_frames[0].size
    aligned = []
    for f, anc in zip(rgba_frames, anchors):
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        dx, dy = (0, 0) if anc is None else (round(ref_x - anc[0]), ref_bottom - anc[1])
        canvas.paste(f, (dx, dy), f)
        aligned.append(canvas)

    union = None
    for f in aligned:
        bbox = f.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
        if bbox:
            union = bbox if union is None else (
                min(union[0], bbox[0]), min(union[1], bbox[1]),
                max(union[2], bbox[2]), max(union[3], bbox[3]))
    pad = 6
    x0 = max(0, union[0] - pad)
    y0 = max(0, union[1] - pad)
    x1 = min(w, union[2] + pad)
    y1 = min(h, union[3] + pad)

    target_h = FRAME_HEIGHT.get(char, FRAME_HEIGHT["default"])
    scale = target_h / (y1 - y0)
    fw = int(round((x1 - x0) * scale))
    fh = target_h
    n = len(aligned)
    if fw * n > MAX_SHEET_WIDTH:
        scale = MAX_SHEET_WIDTH / n / (x1 - x0)
        fw = int((x1 - x0) * scale)
        fh = int((y1 - y0) * scale)

    sheet = Image.new("RGBA", (fw * n, fh), (0, 0, 0, 0))
    for i, f in enumerate(aligned):
        crop = f.crop((x0, y0, x1, y1)).resize((fw, fh), Image.LANCZOS)
        sheet.paste(crop, (i * fw, 0))

    out_dir = OUT_ANIM / char
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(out_dir / f"{action}.webp", "WEBP", quality=90, method=6)
    meta = {
        "frameCount": n,
        "fps": EXTRACT_FPS,
        "frameWidth": fw,
        "frameHeight": fh,
        "loop": loop,
        "pivot": {"x": round((ref_x - x0) / (x1 - x0), 4), "y": 1.0},
    }
    (out_dir / f"{action}.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    preview_dir = CACHE / "preview"
    preview_dir.mkdir(parents=True, exist_ok=True)
    gif_frames = []
    for i in range(n):
        bg = Image.new("RGBA", (fw, fh), (120, 170, 90, 255))
        tile = sheet.crop((i * fw, 0, (i + 1) * fw, fh))
        bg.alpha_composite(tile)
        gif_frames.append(bg.convert("P", palette=Image.ADAPTIVE))
    gif_frames[0].save(preview_dir / f"{char}_{action}.gif", save_all=True,
                       append_images=gif_frames[1:], duration=int(1000 / EXTRACT_FPS), loop=0)
    return meta


def normalize_size(rgba_frames):
    """Rescale each frame so the subject keeps a constant height, bottom-centred."""
    boxes = [f.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox() for f in rgba_frames]
    heights = [b[3] - b[1] for b in boxes if b]
    if not heights:
        return rgba_frames
    ref_h = max(heights)
    crops = []
    for f, b in zip(rgba_frames, boxes):
        if not b:
            crops.append(None)
            continue
        crop = f.crop(b)
        s = ref_h / (b[3] - b[1])
        crops.append(crop.resize((max(1, round(crop.width * s)), ref_h), Image.LANCZOS))
    cw = max(c.width for c in crops if c) + 8
    ch = ref_h + 8
    out = []
    for c in crops:
        canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        if c:
            canvas.paste(c, ((cw - c.width) // 2, ch - ref_h - 4), c)
        out.append(canvas)
    return out


def repair_faded(rgba_frames, drop):
    """rembg sometimes returns a near-empty or ghosted frame; drop it (loops) or reuse a neighbour."""
    solid = [int((np.asarray(f)[:, :, 3] > 200).sum()) for f in rgba_frames]
    med = float(np.median(solid))
    bad = {i for i, s in enumerate(solid) if s < 0.35 * med}
    if not bad:
        return rgba_frames
    log(f"  repaired faded frames {sorted(bad)}")
    if drop:
        return [f for i, f in enumerate(rgba_frames) if i not in bad]
    good = [i for i in range(len(rgba_frames)) if i not in bad]
    return [f if i not in bad else rgba_frames[min(good, key=lambda g: (abs(g - i), g > i))]
            for i, f in enumerate(rgba_frames)]


def rgba_signature(rgba):
    bg = Image.new("RGBA", rgba.size, (128, 128, 128, 255))
    bg.alpha_composite(rgba)
    return np.asarray(bg.convert("L").resize((64, 36)), dtype=np.float32) / 255.0


def process_video(char, action):
    video = RAW_VIDEOS / char / f"{action}.mp4"
    override = CLIP_OVERRIDES.get((char, action), {})
    loop = action in LOOP_ACTIONS
    frames = extract_frames(video, override.get("start", 0.0), override.get("end"),
                            CACHE / "frames" / char / action)
    if override.get("normalize"):
        rgba = normalize_size([cut_watermark(rembg_remove(Image.open(f).convert("RGB")).convert("RGBA"))
                               for f in frames])
        if action in CYCLE_ACTIONS:
            sigs = [rgba_signature(f) for f in rgba]
            best = (1e9, 0, min(len(rgba), MAX_FRAMES["loop"]))
            for a in range(0, max(1, len(sigs) // 3)):
                for length in range(6, MAX_FRAMES["loop"] + 1):
                    if a + length >= len(sigs):
                        break
                    diff = float(np.mean(np.abs(sigs[a] - sigs[a + length])))
                    if diff < best[0]:
                        best = (diff, a, length)
            rgba = rgba[best[1]:best[1] + best[2]]
            log(f"  normalized loop frames={len(rgba)} seam diff={best[0]:.4f}")
        else:
            rgba = sample_evenly(rgba, MAX_FRAMES["once"])
        rgba = repair_faded(rgba, drop=action in CYCLE_ACTIONS)
        meta = build_sheet(char, action, rgba, loop)
        log(f"  -> anim/{char}/{action}.webp {meta['frameWidth']}x{meta['frameHeight']} x{meta['frameCount']}")
        return
    if action in CYCLE_ACTIONS:
        frames, diff = pick_loop(frames, MAX_FRAMES["loop"])
        log(f"  loop frames={len(frames)} seam diff={diff:.4f}")
    else:
        frames = sample_evenly(frames, MAX_FRAMES["once"])
        log(f"  frames={len(frames)}")
    rgba = [cut_watermark(rembg_remove(Image.open(f).convert("RGB")).convert("RGBA")) for f in frames]
    rgba = repair_faded(rgba, drop=action in CYCLE_ACTIONS)
    meta = build_sheet(char, action, rgba, loop)
    log(f"  -> anim/{char}/{action}.webp {meta['frameWidth']}x{meta['frameHeight']} x{meta['frameCount']}")


def cmd_videos(args):
    if not RAW_VIDEOS.exists():
        log("raw_videos/ not found")
        return
    for char_dir in sorted(p for p in RAW_VIDEOS.iterdir() if p.is_dir()):
        if args.char and char_dir.name != args.char:
            continue
        for video in sorted(char_dir.glob("*.mp4")):
            if args.action and video.stem != args.action:
                continue
            log(f"[video] {char_dir.name}/{video.stem}")
            process_video(char_dir.name, video.stem)
    write_anim_manifest()


def write_anim_manifest():
    manifest = {}
    if OUT_ANIM.exists():
        for char_dir in sorted(p for p in OUT_ANIM.iterdir() if p.is_dir()):
            actions = sorted(p.stem for p in char_dir.glob("*.json"))
            if actions:
                manifest[char_dir.name] = actions
    OUT_ANIM.mkdir(parents=True, exist_ok=True)
    (OUT_ANIM / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    log(f"[manifest] {manifest}")


# ----------------------------------------------------------- backgrounds

def patch_sparkle(img, cx, cy, radius, source_dx):
    """Hide the Gemini sparkle by blending in a patch copied from source_dx pixels away."""
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    h, w, _ = arr.shape
    r = int(radius)
    out = arr.copy()
    for y in range(max(0, cy - r), min(h, cy + r)):
        for x in range(max(0, cx - r), min(w, cx + r)):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5 / r
            if d >= 1:
                continue
            t = 1.0 if d < 0.6 else (1 - d) / 0.4
            sx = min(w - 1, max(0, x + source_dx))
            out[y, x] = out[y, x] * (1 - t) + arr[y, sx] * t
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def remove_gemini_sparkle(img):
    """Gemini stamps a sparkle about 97px in from the bottom-right corner of a 1376x768 image."""
    w, h = img.size
    cx, cy = int(w * 0.9295), int(h * 0.8737)
    return patch_sparkle(img, cx, cy, w * 0.03, -int(w * 0.07))


def make_vertical_seamless(img, band_ratio=0.18):
    arr = np.asarray(img.convert("RGB"), dtype=np.float32)
    h = arr.shape[0]
    b = int(h * band_ratio)
    body = arr[:h - b].copy()
    tail = arr[h - b:]
    t = np.linspace(0.0, 1.0, b)[:, None, None]
    body[:b] = tail * (1 - t) + body[:b] * t
    return Image.fromarray(body.clip(0, 255).astype(np.uint8))


def road_columns(img):
    arr = np.asarray(img.convert("RGB"), dtype=np.int32)
    road = (arr[:, :, 0] > arr[:, :, 1] + 8)
    return road


def road_extent(road_rows):
    frac = road_rows.mean(axis=0)
    cols = np.where(frac > 0.5)[0]
    if len(cols) == 0:
        return None
    w = road_rows.shape[1]
    return cols.min() / w, (cols.max() + 1) / w


def process_stage_background(stage_no):
    src = RAW_BG / f"stage{stage_no:02d}"
    sky_path = src / "sky.png"
    ground_path = src / "ground_tile.png"
    if not sky_path.exists() or not ground_path.exists():
        log(f"[bg] stage{stage_no:02d}: sky.png or ground_tile.png missing, skipped")
        return
    out = OUT_STAGES / f"stage{stage_no:02d}"
    out.mkdir(parents=True, exist_ok=True)
    preview = CACHE / "preview"
    preview.mkdir(parents=True, exist_ok=True)

    sky = remove_gemini_sparkle(Image.open(sky_path).convert("RGB"))
    sky_out = sky.resize((2048, int(2048 * sky.height / sky.width)), Image.LANCZOS)
    sky_out.save(out / "sky.webp", "WEBP", quality=88, method=6)
    bottom = np.asarray(sky)[int(sky.height * 0.9):].reshape(-1, 3).mean(axis=0)
    fog = "#%02x%02x%02x" % tuple(int(v) for v in bottom)

    ground = remove_gemini_sparkle(Image.open(ground_path).convert("RGB"))

    road = road_columns(ground)
    h = road.shape[0]
    top = road_extent(road[: int(h * 0.12)])
    bot = road_extent(road[int(h * 0.88):])
    full = road_extent(road)
    perspective_warning = False
    if top and bot:
        wt, wb = top[1] - top[0], bot[1] - bot[0]
        if abs(wt - wb) / max(wt, wb) > 0.15:
            perspective_warning = True
            log(f"  WARNING stage{stage_no:02d} ground_tile: road width differs top {wt:.2f} vs bottom {wb:.2f} (perspective?)")

    tile = make_vertical_seamless(ground)
    tile.save(out / "ground.webp", "WEBP", quality=88, method=6)

    u0, u1 = full if full else (0.33, 0.67)
    if u1 - u0 > 0.7:
        log(f"  road detection failed for stage{stage_no:02d} (width {u1 - u0:.2f}), using 0.30-0.70")
        u0, u1 = 0.30, 0.70
    grass_w = int(tile.width * max(0.05, u0 - 0.03))
    grass = tile.crop((0, 0, grass_w, tile.height))
    grass.save(out / "grass.webp", "WEBP", quality=85, method=6)

    stacked = Image.new("RGB", (tile.width, tile.height * 2))
    stacked.paste(tile, (0, 0))
    stacked.paste(tile, (0, tile.height))
    stacked.resize((tile.width // 2, tile.height)).save(preview / f"stage{stage_no:02d}_ground_tiled.png")

    meta_path = out / "stage.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    meta.update({
        "sky": "sky.webp",
        "ground": "ground.webp",
        "grass": "grass.webp",
        "groundAspect": round(tile.height / tile.width, 4),
        "roadU0": round(float(u0), 4),
        "roadU1": round(float(u1), 4),
        "fogColor": fog,
        "perspectiveWarning": perspective_warning,
    })
    meta.setdefault("props", [])
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    log(f"[bg] stage{stage_no:02d}: road u {u0:.3f}-{u1:.3f}, fog {fog}")


def cmd_backgrounds(args):
    stages = [args.stage] if args.stage else range(1, 6)
    for s in stages:
        process_stage_background(s)


# ----------------------------------------------------------------- props

def cutout(path, max_side):
    img = rembg_remove(Image.open(path).convert("RGB")).convert("RGBA")
    bbox = img.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    img = img.crop(bbox)
    scale = min(1.0, max_side / max(img.size))
    if scale < 1.0:
        img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    return img


def process_stage_props(stage_no):
    src = RAW_BG / f"stage{stage_no:02d}" / "props"
    if not src.exists():
        return
    out = OUT_STAGES / f"stage{stage_no:02d}" / "props"
    out.mkdir(parents=True, exist_ok=True)
    props = []
    for p in sorted(list(src.glob("*.jpg")) + list(src.glob("*.png"))):
        img = cutout(p, 768)
        img.save(out / f"{p.stem}.webp", "WEBP", quality=88, method=6)
        props.append({"name": p.stem, "file": f"props/{p.stem}.webp",
                      "aspect": round(img.width / img.height, 4)})
        log(f"[prop] stage{stage_no:02d}/{p.stem} {img.size}")
    meta_path = OUT_STAGES / f"stage{stage_no:02d}" / "stage.json"
    meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
    meta["props"] = props
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")


def cmd_props(args):
    stages = [args.stage] if args.stage else range(1, 6)
    for s in stages:
        process_stage_props(s)


# --------------------------------------------------------------- sprites

GENERATED_SPRITES = {
    "duck": ("npcs", "duck.png"),
    "item_rice": ("items", "item_rice.png"),
}


def cmd_sprites(args):
    for stem, (folder, name) in GENERATED_SPRITES.items():
        matches = list(RAW_GEN.glob(f"{stem}.*"))
        if not matches:
            continue
        img = cutout(matches[0], 512)
        dst = OUT_IMAGES / folder / name
        dst.parent.mkdir(parents=True, exist_ok=True)
        img.save(dst, "PNG", optimize=True)
        log(f"[sprite] {dst.relative_to(ROOT)} {img.size}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["videos", "backgrounds", "props", "sprites", "all"])
    parser.add_argument("--char")
    parser.add_argument("--action")
    parser.add_argument("--stage", type=int)
    args = parser.parse_args()
    if args.command in ("backgrounds", "all"):
        cmd_backgrounds(args)
    if args.command in ("props", "all"):
        cmd_props(args)
    if args.command in ("sprites", "all"):
        cmd_sprites(args)
    if args.command in ("videos", "all"):
        cmd_videos(args)


if __name__ == "__main__":
    main()
