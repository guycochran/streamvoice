#!/bin/bash

echo "🧪 Testing StreamVoice Electron App..."
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from the electron-app directory"
    exit 1
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for required files
echo "✅ Checking files..."
required_files=(
    "main.js"
    "preload.js"
    "renderer/index.html"
    "renderer/style.css"
    "renderer/renderer.js"
    "server/index-enhanced.js"
    "web/index-enhanced.html"
    "assets/icon.png"
)

all_good=true
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        all_good=false
    else
        echo "✅ Found: $file"
    fi
done

if [ "$all_good" = false ]; then
    echo
    echo "❌ Some files are missing. Cannot proceed."
    exit 1
fi

echo
echo "🚀 All checks passed! You can now:"
echo "1. Run in dev mode: npm start"
echo "2. Build installer: npm run build-win"
echo
echo "The installer will be in: dist/StreamVoice-Setup-1.0.0.exe"