from PIL import Image
from pathlib import Path

src = Path("public/logo.png")
img = Image.open(src).convert("RGBA")

w, h = img.size
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
img = img.crop((left, top, left + side, top + side))

# Multisize ICO for browser tab
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [img.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
ico_images[0].save(
    "src/app/favicon.ico",
    format="ICO",
    sizes=ico_sizes,
    append_images=ico_images[1:],
)
ico_images[0].save(
    "public/favicon.ico",
    format="ICO",
    sizes=ico_sizes,
    append_images=ico_images[1:],
)

# Next.js app router auto icons
img.resize((32, 32), Image.Resampling.LANCZOS).save("src/app/icon.png", format="PNG")
img.resize((180, 180), Image.Resampling.LANCZOS).save(
    "src/app/apple-icon.png", format="PNG"
)

print("ok", "source", w, h)
for p in [
    "src/app/favicon.ico",
    "public/favicon.ico",
    "src/app/icon.png",
    "src/app/apple-icon.png",
]:
    print(p, Path(p).stat().st_size)
