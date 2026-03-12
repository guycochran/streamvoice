#!/bin/bash
# Build locally and prepare for upload

cd electron-app

echo "=== Building StreamVoice locally ==="

# Clean previous builds
rm -rf dist/
rm -rf node_modules/

# Install dependencies
npm install --force

# Build
npm run build-win

# Check if build succeeded
if [ -f "dist/StreamVoice-Setup-1.0.0.exe" ]; then
    echo "✅ Build successful!"
    echo "Installer located at: electron-app/dist/StreamVoice-Setup-1.0.0.exe"

    # Create a release directory
    mkdir -p ../releases
    cp dist/StreamVoice-Setup-*.exe ../releases/

    echo "📦 Files ready for release in: releases/"
else
    echo "❌ Build failed - no installer found"
    exit 1
fi