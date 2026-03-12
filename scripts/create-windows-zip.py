#!/usr/bin/env python3
"""Create a Windows-friendly ZIP file for StreamVoice release"""

import os
import zipfile
import shutil
from pathlib import Path

VERSION = "0.3.0"
RELEASE_NAME = f"StreamVoice-v{VERSION}"
TEMP_DIR = f"/tmp/{RELEASE_NAME}"
ZIP_PATH = f"{RELEASE_NAME}-Windows.zip"

print(f"🚀 Creating Windows ZIP for StreamVoice v{VERSION}...")

# Remove old files
if os.path.exists(TEMP_DIR):
    shutil.rmtree(TEMP_DIR)
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

# Create temp directory
os.makedirs(TEMP_DIR)

# Copy files
print("📁 Copying files...")
shutil.copytree("server", os.path.join(TEMP_DIR, "server"))
shutil.copytree("web", os.path.join(TEMP_DIR, "web"))
shutil.copy("EASY_TEST.bat", TEMP_DIR)
shutil.copy("EASY_TEST_ENHANCED.bat", TEMP_DIR)

# Create INSTALL.bat if it doesn't exist locally
install_bat_content = """@echo off
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
echo To start StreamVoice, double-click:
echo - EASY_TEST.bat for basic version (20 commands)
echo - EASY_TEST_ENHANCED.bat for full version (70+ commands)
echo.
pause
"""

with open(os.path.join(TEMP_DIR, "INSTALL.bat"), 'w') as f:
    f.write(install_bat_content)

# Copy documentation
for doc in ["README.md", "README_FOR_KIDS.md", "OBS_WEBSOCKET_SETUP.md",
            "QUICK_TEST.md", "LICENSE", "WINDOWS_SETUP_GUIDE.md"]:
    if os.path.exists(doc):
        shutil.copy(doc, TEMP_DIR)

# Remove node_modules from server
node_modules = os.path.join(TEMP_DIR, "server", "node_modules")
if os.path.exists(node_modules):
    shutil.rmtree(node_modules)

# Create ZIP file
print(f"📦 Creating {ZIP_PATH}...")
with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(TEMP_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, TEMP_DIR)
            zipf.write(file_path, arcname)

# Clean up
shutil.rmtree(TEMP_DIR)

# Get file size
size_mb = os.path.getsize(ZIP_PATH) / (1024 * 1024)

print(f"✅ Windows ZIP created: {ZIP_PATH}")
print(f"📏 Size: {size_mb:.1f} MB")
print("")
print("Next steps:")
print("1. Upload this ZIP to GitHub release")
print("2. Windows users can extract with built-in tools")
print("3. No need for 7-Zip or special software!")