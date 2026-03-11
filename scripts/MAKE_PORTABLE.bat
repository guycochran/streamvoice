@echo off
echo ========================================
echo   Creating Portable StreamVoice Package
echo ========================================
echo.

:: Create portable folder structure
mkdir StreamVoice-Portable 2>nul
mkdir StreamVoice-Portable\node-portable 2>nul

echo Downloading portable Node.js...
:: Download Node.js portable (no install needed!)
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile 'node-portable.zip'"

echo Extracting Node.js...
powershell -Command "Expand-Archive -Path 'node-portable.zip' -DestinationPath 'StreamVoice-Portable\node-portable' -Force"

:: Copy StreamVoice files
echo Copying StreamVoice files...
xcopy /E /I /Y server StreamVoice-Portable\server
xcopy /E /I /Y web StreamVoice-Portable\web
copy EASY_TEST.bat StreamVoice-Portable\
copy README_FOR_KIDS.md StreamVoice-Portable\

:: Create a special launcher that uses portable Node
echo @echo off > StreamVoice-Portable\START_STREAMVOICE.bat
echo color 0A >> StreamVoice-Portable\START_STREAMVOICE.bat
echo title StreamVoice - Portable Edition >> StreamVoice-Portable\START_STREAMVOICE.bat
echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo ==================================== >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo    STREAMVOICE PORTABLE EDITION >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo      No Installation Needed! >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo ==================================== >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo :: Use portable Node.js >> StreamVoice-Portable\START_STREAMVOICE.bat
echo set PATH=%%~dp0node-portable\node-v20.11.0-win-x64;%%PATH%% >> StreamVoice-Portable\START_STREAMVOICE.bat
echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo :: Install dependencies if needed >> StreamVoice-Portable\START_STREAMVOICE.bat
echo if not exist "server\node_modules" ( >> StreamVoice-Portable\START_STREAMVOICE.bat
echo     echo First time setup... >> StreamVoice-Portable\START_STREAMVOICE.bat
echo     cd server >> StreamVoice-Portable\START_STREAMVOICE.bat
echo     call ..\node-portable\node-v20.11.0-win-x64\npm install >> StreamVoice-Portable\START_STREAMVOICE.bat
echo     cd .. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo ) >> StreamVoice-Portable\START_STREAMVOICE.bat
echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo :: Start server >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo Starting StreamVoice... >> StreamVoice-Portable\START_STREAMVOICE.bat
echo cd server >> StreamVoice-Portable\START_STREAMVOICE.bat
echo start /min cmd /c ..\node-portable\node-v20.11.0-win-x64\node index-new.js >> StreamVoice-Portable\START_STREAMVOICE.bat
echo cd .. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo :: Wait and open Chrome >> StreamVoice-Portable\START_STREAMVOICE.bat
echo timeout /t 3 /nobreak ^>nul >> StreamVoice-Portable\START_STREAMVOICE.bat
echo start chrome.exe --new-window "%%~dp0web\index-v2.html" >> StreamVoice-Portable\START_STREAMVOICE.bat
echo if errorlevel 1 start "%%~dp0web\index-v2.html" >> StreamVoice-Portable\START_STREAMVOICE.bat
echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo StreamVoice is running! >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo 1. Make sure OBS is running >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo 2. Enable WebSocket in OBS settings >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo 3. Hold mic button and speak! >> StreamVoice-Portable\START_STREAMVOICE.bat
echo echo. >> StreamVoice-Portable\START_STREAMVOICE.bat
echo pause >> StreamVoice-Portable\START_STREAMVOICE.bat

:: Create a simple readme
echo Creating readme...
echo StreamVoice Portable Edition > StreamVoice-Portable\README.txt
echo. >> StreamVoice-Portable\README.txt
echo Just double-click START_STREAMVOICE.bat >> StreamVoice-Portable\README.txt
echo No installation needed! >> StreamVoice-Portable\README.txt
echo. >> StreamVoice-Portable\README.txt
echo Requirements: >> StreamVoice-Portable\README.txt
echo - OBS Studio >> StreamVoice-Portable\README.txt
echo - Chrome Browser >> StreamVoice-Portable\README.txt
echo - Windows 10/11 >> StreamVoice-Portable\README.txt

:: Clean up
del node-portable.zip

echo.
echo ========================================
echo    Portable Package Created!
echo ========================================
echo.
echo The StreamVoice-Portable folder contains everything needed.
echo Just share the whole folder - no installation required!
echo.
echo Kids can just:
echo 1. Extract the folder
echo 2. Double-click START_STREAMVOICE.bat
echo 3. Start talking to OBS!
echo.
pause