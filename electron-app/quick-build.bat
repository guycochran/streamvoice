@echo off
title StreamVoice Installer Builder
color 0A

echo ========================================
echo     STREAMVOICE INSTALLER BUILDER
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js first from https://nodejs.org
    echo.
    pause
    exit
)

echo [OK] Node.js found!
echo.

:: Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies (this may take a few minutes)...
    call npm install
    echo.
)

:: Generate icons if missing
if not exist assets\icon.ico (
    echo Generating app icons...
    python scripts\generate-icons.py 2>nul || (
        echo [WARNING] Could not generate icons. Using placeholders.
    )
    echo.
)

:: Build the installer
echo ========================================
echo     BUILDING WINDOWS INSTALLER...
echo ========================================
echo.
echo This may take 2-3 minutes...
echo.

call npm run build-win

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo        BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Your installer is ready at:
    echo.
    echo     dist\StreamVoice-Setup-1.0.0.exe
    echo.
    echo File size:
    for %%I in (dist\StreamVoice-Setup-*.exe) do echo     %%~zI bytes (%%I)
    echo.
    echo What's next:
    echo 1. Test the installer on a clean Windows machine
    echo 2. Upload to GitHub Releases
    echo 3. Share with the world!
    echo.
) else (
    echo.
    echo ========================================
    echo        BUILD FAILED!
    echo ========================================
    echo.
    echo Common issues:
    echo - Make sure you're in the electron-app directory
    echo - Try running: npm install --force
    echo - Check the error messages above
    echo.
)

pause