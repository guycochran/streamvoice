# StreamVoice Auto-Updater Configuration

## Overview
This document outlines how to implement auto-update functionality for StreamVoice using electron-updater.

## Implementation Steps

### 1. Install Dependencies
```bash
cd electron-app
npm install electron-updater
```

### 2. Update package.json
Add to the existing electron-app/package.json:

```json
{
  "build": {
    "publish": [{
      "provider": "github",
      "owner": "guycochran",
      "repo": "streamvoice"
    }]
  }
}
```

### 3. Add Auto-Updater Code
Create `electron-app/src/updater.js`:

```javascript
const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow } = require('electron');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Logging
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

function initializeUpdater(mainWindow) {
    // Check for updates on startup
    autoUpdater.checkForUpdatesAndNotify();

    // Check every 4 hours
    setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
    }, 4 * 60 * 60 * 1000);

    // Update events
    autoUpdater.on('checking-for-update', () => {
        console.log('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `StreamVoice ${info.version} is available!`,
            detail: 'A new version of StreamVoice is available. Would you like to download it now?',
            buttons: ['Download', 'Later'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();
            }
        });
    });

    autoUpdater.on('update-not-available', () => {
        console.log('Update not available');
    });

    autoUpdater.on('error', (err) => {
        console.error('Update error: ', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);

        // Update progress in UI if needed
        mainWindow.webContents.send('download-progress', progressObj.percent);
    });

    autoUpdater.on('update-downloaded', (info) => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded',
            detail: 'StreamVoice will be updated after restart. Restart now?',
            buttons: ['Restart', 'Later'],
            defaultId: 0
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}

module.exports = { initializeUpdater };
```

### 4. Update main.js
Add to `electron-app/main.js`:

```javascript
const { initializeUpdater } = require('./src/updater');

// After window creation
app.whenReady().then(() => {
    createWindow();

    // Initialize auto-updater
    if (app.isPackaged) {
        initializeUpdater(mainWindow);
    }
});
```

### 5. Add Update Menu Item
Add to the tray menu:

```javascript
{
    label: 'Check for Updates',
    click: () => {
        autoUpdater.checkForUpdatesAndNotify();
    }
}
```

### 6. Version Management
Update strategy for version numbers:

```javascript
// In package.json
"version": "1.0.0",  // Major.Minor.Patch

// Version meanings:
// Major: Breaking changes, significant new features
// Minor: New features, backwards compatible
// Patch: Bug fixes, small improvements
```

### 7. GitHub Release Configuration
When creating releases:

1. **Tag Format**: `v1.0.0` (must match package.json version)
2. **Release Assets**: The installer .exe must be included
3. **Release Notes**: Will be shown to users in update dialog
4. **Pre-release**: Use for beta testing

### 8. Update Notification UI
Add to renderer for progress display:

```javascript
// In preload.js
const { ipcRenderer } = require('electron');

window.electronAPI = {
    onUpdateProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, percent) => {
            callback(percent);
        });
    }
};

// In renderer
electronAPI.onUpdateProgress((percent) => {
    document.getElementById('update-progress').style.width = percent + '%';
    document.getElementById('update-text').innerText = `Downloading update: ${Math.round(percent)}%`;
});
```

### 9. Testing Updates

#### Local Testing
```bash
# Set up local update server
npm install -g http-server
cd dist
http-server -p 8080

# In dev mode, set feed URL
autoUpdater.setFeedURL('http://localhost:8080');
```

#### Production Testing
1. Release v1.0.0
2. Install on test machine
3. Release v1.0.1
4. Verify update notification appears
5. Test download and installation

### 10. Update Settings
Add user preferences:

```javascript
// Store in user preferences
const settings = {
    autoCheckUpdates: true,
    autoDownloadUpdates: false,
    checkInterval: 'daily' // 'startup', 'hourly', 'daily', 'weekly'
};

// Apply settings
autoUpdater.autoDownload = settings.autoDownloadUpdates;
```

## Security Considerations

1. **Code Signing**: Required for Windows to avoid security warnings
   - Purchase code signing certificate
   - Configure in electron-builder

2. **HTTPS Only**: GitHub releases use HTTPS by default

3. **Signature Verification**: electron-updater verifies signatures automatically

## Error Handling

Common errors and solutions:

1. **"Cannot find latest.yml"**
   - Ensure release includes latest.yml
   - Check GitHub release is published (not draft)

2. **"net::ERR_CONNECTION_REFUSED"**
   - Check internet connection
   - Verify GitHub is accessible

3. **"Error: EACCES"**
   - Permission issues, may need admin rights
   - Install to user directory instead

## Rollback Strategy

If update causes issues:

1. Keep previous version installers available
2. Provide download link in Discord/website
3. Document downgrade process
4. Consider adding rollback feature

## Update Channels

Future enhancement - different update channels:

```javascript
// In settings
const updateChannel = 'stable'; // 'stable', 'beta', 'nightly'

// Configure feed URL based on channel
const feedURL = `https://github.com/guycochran/streamvoice/releases/download/channel/${updateChannel}`;
autoUpdater.setFeedURL(feedURL);
```

## Metrics

Track update success:

```javascript
// Send anonymous metrics
autoUpdater.on('update-downloaded', () => {
    // Track successful updates
    analytics.track('update_downloaded', {
        from_version: app.getVersion(),
        to_version: info.version
    });
});
```

## User Communication

### Update Dialog Messages

**Update Available:**
```
StreamVoice v1.1.0 is available!

What's new:
• Custom voice commands
• Performance improvements
• Bug fixes

Download size: 75 MB

Would you like to download it now?
[Download] [Later]
```

**Update Ready:**
```
StreamVoice is ready to update!

The new version will be installed when you restart the app.
Your settings will be preserved.

Restart now?
[Restart] [Later]
```

## Implementation Timeline

1. **Phase 1** (v1.0.1): Basic auto-updater
   - Check for updates on startup
   - Manual check option
   - Download and install

2. **Phase 2** (v1.1.0): Enhanced features
   - Progress indication
   - Update settings
   - Release notes display

3. **Phase 3** (v1.2.0): Advanced features
   - Update channels
   - Differential updates
   - Rollback capability