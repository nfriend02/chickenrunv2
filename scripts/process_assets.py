import os
from PIL import Image

brain_dir = r"C:\Users\HS Kim\.gemini\antigravity-ide\brain\335be303-aa7d-4ab1-a6a4-7eb1c0f2b27d"
dest_root = r"c:\Users\HS Kim\Desktop\Agames\chickenrunv2\public\assets\images"

targets = {
    "cat_grumpy": ("npcs", "cat_grumpy.png"),
    "cow_rushing": ("npcs", "cow_rushing.png"),
    "dog": ("npcs", "dog.png"),
    "item_pepper": ("items", "item_pepper.png"),
    "item_banana": ("items", "item_banana.png"),
    "item_magnet": ("items", "item_magnet.png"),
    "item_corn": ("items", "item_corn.png"),
    "haystack": ("fixtures", "haystack.png"),
    "fence": ("fixtures", "fence.png"),
    "popcorn_machine": ("fixtures", "popcorn_machine.png"),
    "cat_tractor": ("npcs", "cat_tractor.png"),
}

def remove_white_bg(img, threshold=245, tolerance=25):
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        # Check if pixel is near white
        r, g, b, a = item
        # Calculate brightness and color deviation
        brightness = (r + g + b) / 3
        if brightness >= threshold:
            # Alpha gradient based on threshold
            diff = brightness - threshold
            alpha = max(0, int(255 - (diff / (255 - threshold)) * 255))
            newData.append((r, g, b, alpha))
        elif brightness > (threshold - tolerance) and (max(r, g, b) - min(r, g, b)) < 15:
            # Transition zone for antialiasing
            ratio = (brightness - (threshold - tolerance)) / tolerance
            alpha = int(255 * (1.0 - ratio * 0.7))
            newData.append((r, g, b, alpha))
        else:
            newData.append((r, g, b, a))
    img.putdata(newData)
    return img

files = os.listdir(brain_dir)
for prefix, (subfolder, filename) in targets.items():
    matched = [f for f in files if f.startswith(prefix) and f.endswith(".jpg")]
    if matched:
        latest = sorted(matched)[-1]
        src_path = os.path.join(brain_dir, latest)
        dst_path = os.path.join(dest_root, subfolder, filename)
        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
        img = Image.open(src_path)
        img_transparent = remove_white_bg(img)
        img_transparent.save(dst_path, "PNG")
        print(f"Processed: {latest} -> {dst_path}")

print("All generated assets converted to transparent PNGs successfully!")
