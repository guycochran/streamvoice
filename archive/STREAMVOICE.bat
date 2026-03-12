@echo off
title StreamVoice - Starting...
color 0A

:: One-click launcher that does EVERYTHING
:: No instructions needed - just double-click!

echo.
echo    ====================================
echo           STREAMVOICE IS STARTING
echo    ====================================
echo.
echo    Just a moment...
echo.

:: Check if we're in the right place
if not exist "server\package.json" (
    echo    Setting things up for the first time...
    echo.

    :: Auto-install Node.js if missing
    where node >nul 2>&1
    if %errorlevel% neq 0 (
        echo    [!] Installing what we need... (one time only)
        echo.
        powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'}"
        msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
        del "%TEMP%\node-installer.msi"

        :: Refresh PATH
        set "PATH=%PATH%;%APPDATA%\npm;%ProgramFiles%\nodejs"
    )
)

:: Navigate to server directory
cd server 2>nul || echo.

:: Auto-install dependencies if needed
if not exist "node_modules" (
    echo    Installing StreamVoice... (30 seconds)
    call npm install --silent >nul 2>&1
)

:: Kill any existing instances
taskkill /F /IM node.exe >nul 2>&1

:: Start the enhanced server
echo.
echo    ====================================
echo         STREAMVOICE IS READY!
echo    ====================================
echo.

:: Launch Chrome with StreamVoice
start "" "http://localhost:3030"

:: Start the server (hidden)
node index-enhanced.js

:: If we get here, server stopped
echo.
echo    StreamVoice has stopped.
echo.
pause