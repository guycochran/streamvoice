@echo off
color 0A
title StreamVoice Enhanced v0.3.0 - 70+ Commands!

echo ========================================
echo     STREAMVOICE ENHANCED v0.3.0
echo     70+ Commands + Stream Deck Mode!
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "server\index-enhanced.js" (
    echo [ERROR] Please run this file from the StreamVoice folder!
    echo.
    echo Make sure you extracted the ZIP file first!
    pause
    exit
)

:: Check if Node.js is installed
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download the LTS version
    echo 3. Install it (use default settings)
    echo 4. Run this file again
    echo.
    pause
    exit
)

echo [OK] Node.js found!
echo.

:: Check if node_modules exists (INSTALL.bat was run)
if not exist "server\node_modules" (
    echo [!] Dependencies not installed. Running INSTALL.bat...
    echo.
    call INSTALL.bat
    echo.
)

:: Start OBS check
echo Checking if OBS is running...
tasklist /FI "IMAGENAME eq obs64.exe" 2>NUL | find /I /N "obs64.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] OBS is running!
) else (
    echo [!] OBS is not running. Please start OBS Studio first!
    echo.
    echo Would you like me to open OBS WebSocket setup instructions? (Y/N)
    choice /C YN /N
    if errorlevel 2 goto skip_obs_help
    start https://github.com/guycochran/streamvoice#-obs-websocket-setup
    :skip_obs_help
)

echo.
echo Starting StreamVoice Enhanced server...
echo.

:: Start the enhanced server
cd server
start /B node index-enhanced.js

:: Give server time to start
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo     SERVER STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Opening StreamVoice Enhanced in Chrome...
echo.

:: Try to find Chrome
set chrome_found=0
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set chrome_path="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set chrome_found=1
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set chrome_path="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    set chrome_found=1
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set chrome_path="%LocalAppData%\Google\Chrome\Application\chrome.exe"
    set chrome_found=1
)

if %chrome_found%==1 (
    :: Open the enhanced interface
    %chrome_path% "http://localhost:3030/index-enhanced.html"
) else (
    echo [WARNING] Chrome not found in default location!
    echo.
    echo Please open Chrome manually and go to:
    echo http://localhost:3030/index-enhanced.html
    echo.
    start http://localhost:3030/index-enhanced.html
)

echo.
echo ========================================
echo     STREAMVOICE IS NOW RUNNING!
echo ========================================
echo.
echo QUICK START:
echo 1. Allow microphone access in Chrome
echo 2. Hold the mic button and say a command
echo 3. Try: "Switch to gameplay"
echo.
echo NEW IN v0.3.0:
echo - Click "Stream Deck" tab for one-click macros!
echo - 70+ voice commands (see All Commands tab)
echo - Audio mixer with volume sliders
echo.
echo To stop: Close this window
echo.
echo Enjoy controlling OBS with your voice!
pause