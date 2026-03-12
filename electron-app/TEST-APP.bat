@echo off
title StreamVoice Test Mode
color 0A

echo ========================================
echo     STREAMVOICE TEST MODE
echo ========================================
echo.
echo This will run StreamVoice in development mode
echo to help debug issues.
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found!
    pause
    exit
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting StreamVoice in development mode...
echo.
echo This window will show server output.
echo The app window will open separately.
echo.

:: Start Electron in development mode
npm start

echo.
echo StreamVoice closed.
pause