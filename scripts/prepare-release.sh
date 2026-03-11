#!/bin/bash

# StreamVoice Release Preparation Script
# This script creates a ready-to-use zip file for distribution

VERSION="0.2.0"
RELEASE_NAME="StreamVoice-v${VERSION}"
RELEASE_DIR="/tmp/${RELEASE_NAME}"

echo "🚀 Preparing StreamVoice v${VERSION} release..."

# Clean up any previous release
rm -rf "${RELEASE_DIR}" "${RELEASE_DIR}.zip"

# Create release directory
mkdir -p "${RELEASE_DIR}"

# Copy essential files
echo "📁 Copying files..."
cp -r server "${RELEASE_DIR}/"
cp -r web "${RELEASE_DIR}/"
cp EASY_TEST.bat "${RELEASE_DIR}/"
cp README.md "${RELEASE_DIR}/"
cp README_FOR_KIDS.md "${RELEASE_DIR}/"
cp OBS_WEBSOCKET_SETUP.md "${RELEASE_DIR}/"
cp QUICK_TEST.md "${RELEASE_DIR}/"
cp LICENSE "${RELEASE_DIR}/"

# Remove node_modules from server (users will install fresh)
rm -rf "${RELEASE_DIR}/server/node_modules"

# Create a simple installer for Windows
cat > "${RELEASE_DIR}/INSTALL.bat" << 'EOF'
@echo off
color 0A
title StreamVoice Installer

echo ========================================
echo     STREAMVOICE INSTALLER
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not found!
    echo.
    echo Opening Node.js download page...
    start https://nodejs.org/
    echo.
    echo Please install Node.js first, then run this installer again.
    pause
    exit
)

echo [OK] Node.js found!
echo.
echo Installing StreamVoice dependencies...
cd server
call npm install
cd ..
echo.
echo ========================================
echo     INSTALLATION COMPLETE!
echo ========================================
echo.
echo To start StreamVoice, double-click EASY_TEST.bat
echo.
pause
EOF

# Create the zip file using tar (works on Linux without zip)
echo "📦 Creating release package..."
cd /tmp
tar -czf "${RELEASE_NAME}.tar.gz" "${RELEASE_NAME}"

# Move to the project directory
mv "${RELEASE_NAME}.tar.gz" ~/skunkworks-production-agents/streamvoice/

echo "✅ Release package created: ${RELEASE_NAME}.tar.gz"
echo "📍 Location: ~/skunkworks-production-agents/streamvoice/${RELEASE_NAME}.tar.gz"
echo ""
echo "Next steps:"
echo "1. Upload ${RELEASE_NAME}.tar.gz to GitHub Releases"
echo "2. Share the download link with beta testers"
echo "3. They just need to:"
echo "   - Download and extract the zip"
echo "   - Run INSTALL.bat (one time)"
echo "   - Run EASY_TEST.bat to use StreamVoice"