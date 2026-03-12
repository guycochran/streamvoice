# StreamVoice OBS Disconnect Issue - Handoff Note

## Current Situation
User reports StreamVoice v1.0.3 still shows "Disconnected" even though OBS itself shows a WebSocket client connected.

## What We Know
1. **OBS WebSocket IS connected** - User sees `[::ffff:127.0.0.1]:54561` in OBS WebSocket settings
2. **The Electron app bundles its own server** at `electron-app/server/index-enhanced.js`
3. **Three WebSocket connections exist**:
   - Web UI → StreamVoice Server (port 8090)
   - StreamVoice Server → OBS WebSocket (port 4455)
   - Both were changed from `localhost` to `127.0.0.1`

## Corrected Read
This does **not** look primarily like an IPv6 problem.

Why:
- OBS already shows the StreamVoice server attached
- That means the server -> OBS hop is likely working
- The more likely failure is the packaged UI relying too heavily on the local WebSocket on port `8090`

## Files Modified For The Actual Fix
1. `electron-app/main.js`
2. `electron-app/server/index-enhanced.js`
3. `electron-app/server/index.js`
4. `electron-app/web/app-enhanced.js`

## Symptoms
- App shows "Disconnected" in red
- OBS shows WebSocket connected at `[::ffff:127.0.0.1]:54561`
- Stream Deck buttons don't work ("Not connected to server")
- User says it briefly flashes "Connected" then back to "Disconnected"

## Fixes Already Applied

### 1. Packaged backend launch fix
- `electron-app/main.js` now launches the bundled backend with:
  - `spawn(process.execPath, [serverPath], { env: { ELECTRON_RUN_AS_NODE: '1' } })`
- This avoids depending on an external `node` binary on Windows

### 2. API route compatibility fix
- Added:
  - `GET /api/obs-status`
  - `GET /api/health`
  - `POST /api/command`
  - `POST /api/execute`
- This fixes the mismatch between the Electron shell and the embedded server

### 3. UI resilience fix
- `electron-app/web/app-enhanced.js` now:
  - polls `http://127.0.0.1:3030/api/obs-status` every 3 seconds
  - falls back to `POST /api/command` when the local WebSocket on `8090` is unavailable
- This removes the hard dependency on the `web UI -> ws://127.0.0.1:8090` path for status and button actions

## Current Best Theory
The fragile part was the packaged UI's WebSocket dependency, not IPv6. Even if the local WebSocket is unstable or closes, the app can still function by using the embedded HTTP API on port `3030`.

## Architecture Reminder
```
Electron Main Process (main.js)
    ├── Spawns Backend Server (server/index-enhanced.js) on port 8090
    ├── Creates BrowserWindow
    └── Loads renderer/index.html
            └── Contains iframe pointing to web/index-enhanced.html
                    └── Web UI connects to ws://127.0.0.1:8090
```

## Next Steps
1. Pull latest `main`
2. Rebuild the Electron app
3. Test the rebuilt Windows app
4. Verify:
   - OBS status no longer stays on red because of a dead local WebSocket alone
   - Stream Deck buttons execute via HTTP fallback
   - Voice commands still work

## If It Still Fails
Collect these exact data points from the rebuilt Windows app:
1. Does the top-left OBS label show `Connected`, `Not Connected`, or `Disconnected`?
2. Do button presses execute anything?
3. Does OBS still show the StreamVoice client connected?
4. Does `http://127.0.0.1:3030/api/obs-status` return JSON on the Windows machine?

If failure remains after this rebuild, the next best move is to inspect runtime logs from the packaged Electron process on Windows. The IPv6 theory should not be the default assumption anymore.
