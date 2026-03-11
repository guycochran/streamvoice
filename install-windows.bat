@echo off
echo ===================================
echo StreamVoice Installer v0.1.0
echo ===================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

:: Create StreamVoice directory
set INSTALL_DIR=%USERPROFILE%\StreamVoice
echo Installing to: %INSTALL_DIR%
echo.

if exist "%INSTALL_DIR%" (
    echo [!] StreamVoice already installed
    echo.
    choice /C YN /M "Reinstall?"
    if errorlevel 2 exit /b 0
    rmdir /S /Q "%INSTALL_DIR%"
)

mkdir "%INSTALL_DIR%"
cd /d "%INSTALL_DIR%"

:: Download StreamVoice
echo Downloading StreamVoice...
curl -L https://github.com/guycochran/streamvoice/archive/main.zip -o streamvoice.zip
if %errorlevel% neq 0 (
    echo [ERROR] Download failed!
    pause
    exit /b 1
)

:: Extract
echo Extracting files...
powershell -command "Expand-Archive -Path streamvoice.zip -DestinationPath ."
move streamvoice-main\* .
rmdir /S /Q streamvoice-main
del streamvoice.zip

:: Install dependencies
echo Installing dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)
cd ..

:: Create desktop shortcut
echo Creating desktop shortcut...
set DESKTOP=%USERPROFILE%\Desktop
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\StreamVoice.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-streamvoice.bat'; $Shortcut.IconLocation = '%INSTALL_DIR%\icon.ico'; $Shortcut.Save()"

:: Create start script
echo @echo off > start-streamvoice.bat
echo cd /d "%INSTALL_DIR%\server" >> start-streamvoice.bat
echo start /min cmd /c node index.js >> start-streamvoice.bat
echo timeout /t 2 /nobreak >> start-streamvoice.bat
echo start http://localhost:8888 >> start-streamvoice.bat

echo.
echo ===================================
echo Installation Complete!
echo ===================================
echo.
echo StreamVoice has been installed to:
echo %INSTALL_DIR%
echo.
echo A shortcut has been created on your desktop.
echo.
echo Starting StreamVoice now...
timeout /t 3
call start-streamvoice.bat