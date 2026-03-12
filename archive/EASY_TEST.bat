@echo off
color 0A
title StreamVoice - Easy Tester

echo ========================================
echo     STREAMVOICE - VOICE CONTROL FOR OBS
echo           Super Easy Test Mode!
echo ========================================
echo.

:: Check if we're in the right folder
if not exist "server\index.js" (
    echo [ERROR] Please run this file from the StreamVoice folder!
    echo.
    echo Download StreamVoice.zip and extract it first.
    echo Then double-click EASY_TEST.bat
    echo.
    pause
    exit
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js not found!
    echo.
    echo Opening Node.js download page...
    start https://nodejs.org/
    echo.
    echo IMPORTANT STEPS:
    echo 1. Download and install Node.js (use defaults)
    echo 2. After installing Node.js, run INSTALL.bat (NOT this file)
    echo 3. Then run EASY_TEST_ENHANCED.bat to start StreamVoice
    echo.
    echo Press any key to open Node.js download page...
    pause
    exit
)

echo [OK] Everything looks good!
echo.

:: Install dependencies if needed
if not exist "server\node_modules" (
    echo First time setup - installing stuff (one time only)...
    cd server
    call npm install
    cd ..
    echo.
)

:: Start the server
echo Starting StreamVoice server...
cd server
start /min cmd /c node index-new.js

:: Wait a bit for server to start
timeout /t 3 /nobreak >nul

:: Open the web interface
cd ..\web
echo.
echo ========================================
echo    OPENING STREAMVOICE IN CHROME...
echo ========================================
echo.

:: Try to find Chrome
set chrome_path=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set chrome_path="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set chrome_path="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set chrome_path="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if defined chrome_path (
    start "" %chrome_path% --new-window "%cd%\index-v2.html"
) else (
    :: Fallback to default browser
    start index-v2.html
    echo.
    echo [!] Chrome not found - opened in default browser
    echo [!] Voice control only works in Chrome!
)

echo.
echo ========================================
echo         HOW TO TEST STREAMVOICE:
echo ========================================
echo.
echo 1. Make sure OBS is running
echo 2. In OBS: Tools - obs-websocket Settings
echo 3. Check "Enable WebSocket server"
echo 4. Leave password blank
echo.
echo THEN IN CHROME:
echo - You should see "Connected" (green)
echo - Hold the big microphone button
echo - Say "Switch to gameplay"
echo - Let go of the button
echo.
echo VOICE COMMANDS TO TRY:
echo - "Switch to gameplay"
echo - "Start recording"
echo - "Stop recording"
echo - "Mute my mic"
echo.
echo ========================================
echo.
echo Press any key to stop StreamVoice...
pause >nul

:: Kill the server
taskkill /F /FI "WindowTitle eq StreamVoice*" >nul 2>&1
echo.
echo StreamVoice stopped. Thanks for testing!
timeout /t 3