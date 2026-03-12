#!/usr/bin/env python3

from PIL import Image, ImageDraw, ImageFont
import os

print("🎨 Generating StreamVoice icons...")

# Icon sizes needed
sizes = [16, 32, 48, 64, 128, 256]

# Create assets directory if it doesn't exist
assets_dir = os.path.join(os.path.dirname(__file__), '..', 'assets')
os.makedirs(assets_dir, exist_ok=True)

for size in sizes:
    # Create new image with gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle with gradient effect
    corner_radius = int(size * 0.2)

    # Purple gradient background (simplified - just solid color)
    purple = (118, 75, 162, 255)  # #764ba2

    # Draw rounded rectangle
    x0, y0 = 0, 0
    x1, y1 = size - 1, size - 1

    # Main rectangle
    draw.rounded_rectangle([x0, y0, x1, y1], radius=corner_radius, fill=purple)

    # Draw microphone icon (simplified)
    white = (255, 255, 255, 255)

    # Microphone body
    mic_width = int(size * 0.3)
    mic_height = int(size * 0.4)
    mic_x = (size - mic_width) // 2
    mic_y = int(size * 0.2)

    # Draw mic oval
    draw.ellipse([mic_x, mic_y, mic_x + mic_width, mic_y + mic_height], fill=white)

    # Draw stand
    stand_y = mic_y + mic_height
    draw.arc([mic_x - mic_width//4, stand_y - 5, mic_x + mic_width + mic_width//4, stand_y + mic_height//2],
             0, 180, fill=white, width=max(2, size//32))

    # Vertical line
    draw.line([(size//2, stand_y + mic_height//4), (size//2, size - size//5)],
              fill=white, width=max(2, size//32))

    # Base line
    base_width = int(size * 0.4)
    base_x = (size - base_width) // 2
    base_y = size - size//5
    draw.line([base_x, base_y, base_x + base_width, base_y],
              fill=white, width=max(3, size//24))

    # Save PNG
    img.save(os.path.join(assets_dir, f'icon-{size}.png'))
    print(f"✅ Created icon-{size}.png")

# Create main icon.png (copy of 256)
img_256 = Image.open(os.path.join(assets_dir, 'icon-256.png'))
img_256.save(os.path.join(assets_dir, 'icon.png'))
print("✅ Created icon.png")

# Create small icon (copy of 32)
img_32 = Image.open(os.path.join(assets_dir, 'icon-32.png'))
img_32.save(os.path.join(assets_dir, 'icon-small.png'))
print("✅ Created icon-small.png")

# Create tray icon (16x16 white on transparent)
tray_img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
tray_draw = ImageDraw.Draw(tray_img)

# Simple mic for tray
tray_draw.ellipse([5, 2, 11, 8], fill=white)
tray_draw.arc([3, 7, 13, 13], 0, 180, fill=white, width=1)
tray_draw.line([(8, 10), (8, 14)], fill=white, width=1)
tray_draw.line([(5, 14), (11, 14)], fill=white, width=1)

tray_img.save(os.path.join(assets_dir, 'tray-icon.png'))
print("✅ Created tray-icon.png")

# Create ICO file (multi-resolution Windows icon)
# For now, just use the 256px version
img_256.save(os.path.join(assets_dir, 'icon.ico'), format='ICO', sizes=[(256, 256)])
print("✅ Created icon.ico")

print("\n🎉 All icons generated successfully!")