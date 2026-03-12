#!/bin/bash
# Test build script to verify electron-app can be built

echo "=== StreamVoice Build Test ==="
echo

echo "1. Checking Node.js version..."
node --version
npm --version

echo -e "\n2. Installing dependencies..."
npm install --force

echo -e "\n3. Checking for required files..."
if [ -f "assets/icon.png" ]; then
    echo "✓ Icon file exists"
else
    echo "✗ Icon file missing - creating placeholder"
    cp assets/icon.svg assets/icon.png 2>/dev/null || touch assets/icon.png
fi

if [ -f "assets/icon.ico" ]; then
    echo "✓ Windows icon exists"
else
    echo "✗ Windows icon missing - creating placeholder"
    touch assets/icon.ico
fi

echo -e "\n4. Testing build command..."
npm run build-win -- --dry-run

echo -e "\n=== Build test complete ==="