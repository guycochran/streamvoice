@echo off
color 0A
title StreamVoice Enhanced - Advanced Features!

echo ========================================
echo     STREAMVOICE ENHANCED v0.3.0
echo     Advanced Voice Control for OBS
echo ========================================
echo.
echo NEW FEATURES:
echo - Stream Deck alternative (one-click macros)
echo - Audio mixer with volume control
echo - 70+ voice commands
echo - Transition controls
echo - Filter controls (green screen, blur)
echo - Studio mode support
echo - Screenshot and replay buffer
echo.

:: Check if we're in the right folder
if not exist "server\index-enhanced.js" (
    echo [ERROR] Enhanced version not found!
    echo Please make sure you're in the StreamVoice folder.
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
    echo 1. Download and install Node.js (use defaults)
    echo 2. Then run this file again
    echo.
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

:: Kill any existing StreamVoice servers
taskkill /F /FI "WindowTitle eq StreamVoice*" >nul 2>&1
taskkill /F /FI "WindowTitle eq Administrator:  StreamVoice*" >nul 2>&1

:: Start the enhanced server
echo Starting StreamVoice Enhanced server...
cd server
start "StreamVoice Enhanced Server" cmd /k node index-enhanced.js

:: Wait a bit for server to start
timeout /t 3 /nobreak >nul

:: Open the enhanced web interface
cd ..\web
echo.
echo ========================================
echo    OPENING STREAMVOICE ENHANCED...
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
    start "" %chrome_path% --new-window "%cd%\index-enhanced.html"
) else (
    :: Fallback to default browser
    start index-enhanced.html
    echo.
    echo [!] Chrome not found - opened in default browser
    echo [!] Voice control only works in Chrome!
)

echo.
echo ========================================
echo         ENHANCED FEATURES:
echo ========================================
echo.
echo STREAM DECK MODE:
echo - Click the "Stream Deck" tab
echo - One-click macros for common actions
echo - Start/end stream sequences
echo - Emergency buttons
echo.
echo AUDIO MIXER:
echo - Click the "Audio Mixer" tab
echo - Control volumes with sliders
echo - Quick mute/unmute buttons
echo.
echo NEW VOICE COMMANDS:
echo - "Enable green screen"
echo - "Set transition duration medium"
echo - "Take screenshot"
echo - "Increase mic volume"
echo - "Enable studio mode"
echo - And 50+ more!
echo.
echo ========================================
echo.
echo Press any key to stop StreamVoice Enhanced...
pause >nul

:: Kill the server
taskkill /F /FI "WindowTitle eq StreamVoice Enhanced*" >nul 2>&1
echo.
echo StreamVoice Enhanced stopped. Thanks for testing the advanced features!
timeout /t 3