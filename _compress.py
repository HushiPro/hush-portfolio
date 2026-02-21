"""Batch compress images to WebP format for web optimization."""
import os
from pathlib import Path
from PIL import Image

WEB_ROOT = Path(r"E:\Hush_Project\Web")
IMG_DIRS = [
    WEB_ROOT / "pic",
    WEB_ROOT / "assets",
]

# Max dimensions for different categories
MAX_CARD_WIDTH = 1200   # project card / tool images
MAX_LOGO_WIDTH = 600    # logo

WEBP_QUALITY = 82  # good balance of quality/size

converted = []

for img_dir in IMG_DIRS:
    if not img_dir.exists():
        continue
    for img_path in img_dir.rglob("*"):
        if img_path.suffix.lower() not in (".png", ".jpg", ".jpeg"):
            continue
        
        try:
            img = Image.open(img_path)
            
            # Determine max width
            if "logo" in img_path.name.lower():
                max_w = MAX_LOGO_WIDTH
            else:
                max_w = MAX_CARD_WIDTH
            
            # Resize if too large
            w, h = img.size
            if w > max_w:
                ratio = max_w / w
                new_size = (max_w, int(h * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            
            # Convert to RGB if RGBA (for WebP compatibility)
            if img.mode == "RGBA":
                # Keep alpha for WebP
                pass
            elif img.mode != "RGB":
                img = img.convert("RGB")
            
            # Save as WebP
            webp_path = img_path.with_suffix(".webp")
            img.save(webp_path, "WEBP", quality=WEBP_QUALITY, method=6)
            
            old_size = img_path.stat().st_size
            new_size_bytes = webp_path.stat().st_size
            savings = (1 - new_size_bytes / old_size) * 100
            
            converted.append({
                "old": img_path.name,
                "new": webp_path.name,
                "old_kb": old_size // 1024,
                "new_kb": new_size_bytes // 1024,
                "savings": savings,
            })
            
            print(f"  {img_path.name:40s} {old_size//1024:>6d} KB -> {webp_path.name:40s} {new_size_bytes//1024:>6d} KB  ({savings:.0f}% smaller)")
            
        except Exception as e:
            print(f"  SKIP {img_path.name}: {e}")

total_old = sum(c["old_kb"] for c in converted)
total_new = sum(c["new_kb"] for c in converted)
print(f"\n  Total: {total_old} KB -> {total_new} KB  ({(1-total_new/total_old)*100:.0f}% smaller)")
