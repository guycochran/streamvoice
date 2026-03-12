#!/bin/bash

# Create placeholder icons for development
echo "🎨 Creating placeholder icons..."

cd "$(dirname "$0")/../assets"

# Create a simple purple square for now
echo '<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#764ba2"/>
  <text x="128" y="148" font-family="Arial" font-size="120" fill="white" text-anchor="middle">🎤</text>
</svg>' > icon-placeholder.svg

# Create basic PNG files (using ImageMagick if available, or just copies)
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    for size in 16 32 48 64 128 256; do
        convert -background "#764ba2" -fill white -size ${size}x${size} \
                -gravity center label:"🎤" icon-${size}.png
        echo "✅ Created icon-${size}.png"
    done
else
    echo "ImageMagick not found. Creating placeholder files..."
    # Create placeholder files
    for size in 16 32 48 64 128 256; do
        touch icon-${size}.png
        echo "📄 Created placeholder icon-${size}.png"
    done
fi

# Create additional required files
cp icon-256.png icon.png 2>/dev/null || touch icon.png
cp icon-32.png icon-small.png 2>/dev/null || touch icon-small.png
cp icon-16.png tray-icon.png 2>/dev/null || touch tray-icon.png

# Create ICO file (Windows icon)
touch icon.ico

echo "✅ Placeholder icons created!"
echo "Note: These are placeholders. For production, create proper icons."