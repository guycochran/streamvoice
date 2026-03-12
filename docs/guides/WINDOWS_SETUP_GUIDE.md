# 🖥️ Windows Setup Guide for StreamVoice

## For .tar.gz file (Current Release)

### Option 1: Using 7-Zip (Recommended)
1. **Download 7-Zip** (if you don't have it): https://www.7-zip.org/
2. **Right-click** on `StreamVoice-v0.3.0.tar.gz`
3. Select **7-Zip → Extract Here**
4. It creates a `.tar` file
5. **Right-click** the `.tar` file
6. Select **7-Zip → Extract Here** again
7. You now have a `StreamVoice-v0.3.0` folder!

### Option 2: Using Windows Built-in (Windows 10/11)
1. **Rename** the file: Remove `.gz` so it's just `StreamVoice-v0.3.0.tar`
2. **Double-click** the `.tar` file
3. Windows will open it like a folder
4. **Select all** (Ctrl+A) and **Copy** (Ctrl+C)
5. **Create a new folder** on Desktop called `StreamVoice`
6. **Paste** (Ctrl+V) everything into it

### Option 3: Using WinRAR
1. **Right-click** on `StreamVoice-v0.3.0.tar.gz`
2. Select **Extract Here** or **Extract to StreamVoice-v0.3.0\**

## After Extraction

You should see these files in your StreamVoice folder:
- 📁 `server/` (folder)
- 📁 `web/` (folder)
- 📄 `EASY_TEST.bat`
- 📄 `EASY_TEST_ENHANCED.bat`
- 📄 `INSTALL.bat`
- 📄 Other documentation files

## Running StreamVoice

1. **First Time Only**: Double-click `INSTALL.bat`
   - This installs necessary files
   - Wait for "Installation complete!"
   - Press any key

2. **To Use StreamVoice**:
   - For basic version (20 commands): Double-click `EASY_TEST.bat`
   - For enhanced version (70+ commands): Double-click `EASY_TEST_ENHANCED.bat`

3. **Chrome will open automatically** with StreamVoice
   - You should see "Connected" in green
   - If asked for microphone permission, click "Allow"

## Quick Test

1. Make sure OBS is running
2. Hold the big microphone button
3. Say "Switch to gameplay"
4. Release the button
5. Watch OBS change scenes!

## Troubleshooting

**"Windows protected your PC" warning?**
- Click "More info"
- Click "Run anyway"
- This happens because the .bat files aren't digitally signed

**Can't extract the file?**
- Download 7-Zip (free): https://www.7-zip.org/
- It handles .tar.gz files perfectly

**"Node.js not found" error?**
- Download Node.js: https://nodejs.org/
- Choose the "LTS" version
- Install with default settings
- Try running INSTALL.bat again

## For Your Friends

Tell them:
1. Download the file
2. Use 7-Zip to extract it (extract twice!)
3. Run INSTALL.bat once
4. Run EASY_TEST_ENHANCED.bat to start
5. Hold the mic button and talk!

That's it! Enjoy controlling OBS with your voice! 🎤