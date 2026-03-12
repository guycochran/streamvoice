# 🏗️ Building StreamVoice Installer on Windows

Since we're on Linux, you'll need to build the Windows installer on an actual Windows machine. Here's how:

## Prerequisites

1. **Windows 10/11**
2. **Node.js 18+** (download from https://nodejs.org)
3. **Git** (to clone the repo)

## Build Steps

### 1. Clone the Repository

```bash
git clone https://github.com/guycochran/streamvoice.git
cd streamvoice/electron-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install Electron and all build tools.

### 3. Build the Installer

```bash
npm run build-win
```

Or directly:

```bash
npx electron-builder --win
```

### 4. Find Your Installer

The installer will be at:
```
electron-app/dist/StreamVoice-Setup-1.0.0.exe
```

## What the Installer Includes

- ✅ StreamVoice.exe (main app)
- ✅ All Node modules bundled
- ✅ Server code embedded
- ✅ Web UI embedded
- ✅ Start Menu shortcuts
- ✅ Desktop shortcut (optional)
- ✅ Uninstaller

## Testing the Installer

1. Copy `StreamVoice-Setup-1.0.0.exe` to a clean Windows machine
2. Double-click to install
3. Check:
   - Appears in Start Menu
   - Desktop shortcut created (if selected)
   - System tray icon appears
   - Voice control works

## Distributing

### Option 1: GitHub Release

1. Go to: https://github.com/guycochran/streamvoice/releases
2. Create new release
3. Upload `StreamVoice-Setup-1.0.0.exe`
4. Users download and install

### Option 2: Direct Download

Upload to any file host and share the link.

## Code Signing (Optional but Recommended)

Without code signing, users will see "Unknown Publisher" warnings.

To sign:
1. Get a code signing certificate (~$200/year)
2. Set environment variables:
   ```
   set CSC_LINK=path\to\certificate.pfx
   set CSC_KEY_PASSWORD=your_password
   ```
3. Build normally - electron-builder will auto-sign

## Troubleshooting

### "Cannot find module" errors
- Make sure you're in the `electron-app` directory
- Run `npm install` again

### Build fails with icon errors
- Icons are already generated
- If missing, run: `python scripts/generate-icons.py`

### "Wine is required" on Linux
- You must build on Windows for Windows
- Or install Wine (complex setup)

---

## Quick Build Script for Windows

Save this as `quick-build.bat` in the electron-app folder:

```batch
@echo off
echo Building StreamVoice Installer...
echo.

:: Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

:: Build
echo Building installer...
call npm run build-win

echo.
echo =============================
echo BUILD COMPLETE!
echo =============================
echo.
echo Installer location:
echo dist\StreamVoice-Setup-1.0.0.exe
echo.
pause
```

Then just double-click `quick-build.bat` on Windows!

---

## The Result

Your users will:
1. Download `StreamVoice-Setup-1.0.0.exe`
2. Double-click
3. Click through installer (Company: StreamVoice Team)
4. StreamVoice launches automatically
5. System tray icon appears
6. They start using voice control!

No Node.js, no Chrome, no command line. Just a professional Windows app! 🎉