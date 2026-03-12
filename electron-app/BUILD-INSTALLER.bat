@echo off
title StreamVoice Installer Builder
color 0A

echo ========================================
echo     STREAMVOICE INSTALLER BUILDER
echo ========================================
echo.
echo This window will stay open so you can see what happens!
echo.

:: First, let's check where we are
echo Current directory:
cd
echo.

:: Check if Node.js is installed
echo Checking for Node.js...
node --version
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo          NODE.JS NOT FOUND!
    echo ========================================
    echo.
    echo You need to install Node.js first:
    echo.
    echo 1. Go to https://nodejs.org
    echo 2. Download the LTS version
    echo 3. Install it
    echo 4. Run this file again
    echo.
    pause
    exit
)

echo Node.js is installed!
echo.

:: Check if we're in the right folder
if not exist "package.json" (
    echo ========================================
    echo          WRONG FOLDER!
    echo ========================================
    echo.
    echo This file must be run from the electron-app folder!
    echo Please make sure you're in:
    echo    streamvoice\electron-app
    echo.
    pause
    exit
)

:: Install dependencies
echo ========================================
echo     INSTALLING DEPENDENCIES
echo ========================================
echo.
echo This may take a few minutes the first time...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo     DEPENDENCY INSTALL FAILED!
    echo ========================================
    echo.
    echo Try running this command manually:
    echo    npm install --force
    echo.
    pause
    exit
)

echo.
echo Dependencies installed successfully!
echo.

:: Build the installer
echo ========================================
echo     BUILDING WINDOWS INSTALLER
echo ========================================
echo.
echo This will take 2-3 minutes...
echo.

call npx electron-builder --win

echo.
echo ========================================
echo          BUILD COMPLETE!
echo ========================================
echo.

:: Check if the installer was created
if exist "dist\StreamVoice-Setup-*.exe" (
    echo SUCCESS! Your installer is ready:
    echo.
    dir dist\*.exe /b
    echo.
    echo Full path:
    cd dist
    echo %cd%
    cd ..
    echo.
    echo What to do next:
    echo 1. Navigate to the 'dist' folder
    echo 2. Double-click the .exe to test it
    echo 3. Share it with the world!
) else (
    echo ERROR: No installer was created!
    echo.
    echo Check the error messages above.
    echo Common fixes:
    echo - Delete node_modules folder and try again
    echo - Run: npm install --force
    echo - Make sure you have enough disk space
)

echo.
echo Press any key to close this window...
pause >nul