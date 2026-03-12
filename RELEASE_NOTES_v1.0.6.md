# StreamVoice v1.0.6 - Critical Server Fix

## 🚨 Critical Fix

This release fixes a critical issue where the backend server was not starting properly in the packaged Windows .exe, causing the app to show "Disconnected" status.

## What's Fixed

### 🔧 Backend Server Startup
- Fixed server process spawning in packaged Electron app
- Added missing dependencies (ws, cors) to package.json
- Improved error handling and logging for server startup
- Added visual error messages if server fails to start

## Technical Details

The v1.0.5 release had a packaging issue where the backend server would fail silently when the app was installed from the .exe. This resulted in:
- "Server Reachable: No" in diagnostics
- "Failed to fetch" errors
- Unable to connect to OBS even when configured correctly

This has been fixed by:
1. Adding proper error handling to the server spawn process
2. Including all required dependencies in package.json
3. Better logging to help diagnose future issues

## Installation

1. Download `StreamVoice-Setup-1.0.6.exe`
2. Run the installer
3. Launch StreamVoice
4. The app should now properly start its backend server

## Verification

After launching, you should see:
- "Server Reachable: Yes" in diagnostics
- Version showing as 1.0.6
- Ability to connect to OBS when WebSocket is enabled

---

We apologize for the frustration this bug caused. StreamVoice should now work as intended - a self-contained app that "just works" when you launch it.