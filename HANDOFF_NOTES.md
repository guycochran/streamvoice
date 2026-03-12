# Handoff Notes - StreamVoice GitHub Actions Fix
## For the Next Developer

## Quick Summary
**Problem**: GitHub Actions can't build the Electron app because electron-builder is confused by the directory structure.
**Solution**: Move server and web folders out of electron-app directory.
**Status**: Problem identified, solution known, not yet implemented.

## What Works
✅ Node/npm installation in GitHub Actions
✅ Electron installation
✅ Building a minimal Electron app from scratch
✅ The workflows themselves (after our fixes)

## What Doesn't Work
❌ Building the actual StreamVoice electron-app
❌ Any electron-builder command in the current structure

## The Fix (Not Yet Done)
```bash
# Commands to restructure:
mv electron-app/server ./streamvoice-server
mv electron-app/web ./streamvoice-web
mv electron-app/renderer ./streamvoice-renderer
mv electron-app/scripts ./streamvoice-scripts

# Update electron-app/main.js to reference new paths
# Update package.json files
# Test locally
# Push to GitHub
```

## Key Files to Check
1. `/electron-app/main.js` - Has paths to server/web that need updating
2. `/electron-app/package.json` - Has dependencies for server that should be moved
3. `/.github/workflows/build-electron.yml` - Main workflow (already fixed)
4. `/.github/workflows/build-windows.yml` - Windows workflow (already fixed)

## Proof It Will Work
Check `.github/workflows-archive/test-electron-builder.yml` - This succeeded by creating a minimal app. It proves electron-builder works when the directory structure is correct.

## Current Directory Issues
```
electron-app/
├── main.js          ✅ (belongs here)
├── preload.js       ✅ (belongs here)
├── package.json     ✅ (belongs here)
├── assets/          ✅ (belongs here)
├── server/          ❌ (move to root)
├── web/             ❌ (move to root)
├── renderer/        ❌ (move to root)
└── scripts/         ❌ (move to root)
```

## Testing Approach
1. Make the directory changes
2. Run locally: `cd electron-app && npm install && npm run build-win`
3. If it works locally, push to GitHub
4. Watch the GitHub Actions run

## Background Processes
Two servers are running - you might want to kill them:
- `ps aux | grep "node index.js"`
- `ps aux | grep "node index-new.js"`

## Good Luck!
This should be a straightforward fix once the directories are restructured. The hard debugging work is already done - we know exactly what the problem is and how to fix it.