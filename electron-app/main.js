const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray;
let serverProcess;
let obsSettingsFilePath;
const SERVER_BASE_URL = 'http://127.0.0.1:3030';

// Enable live reload for Electron
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname);
  } catch (e) {
    // electron-reload not available in production
  }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false, // Custom title bar
    backgroundColor: '#0a0a0a',
    show: false // Don't show until ready
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Show window when ready AND server is running
  mainWindow.once('ready-to-show', () => {
    // Give server time to start
    setTimeout(() => {
      mainWindow.show();
      checkForUpdates();
    }, 2000); // 2 second delay for server startup
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Handle window controls from renderer
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow.hide();
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/tray-icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show StreamVoice',
      click: () => {
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: menuItem.checked
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => {
        checkForUpdates();
      }
    },
    {
      label: 'About',
      click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: 'About StreamVoice',
          message: 'StreamVoice v1.0.11',
          detail: 'Professional voice control for OBS Studio.\n\nMade with ❤️ for streamers.',
          buttons: ['OK']
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('StreamVoice - Click to open');
  tray.setContextMenu(contextMenu);

  // Double click to show
  tray.on('double-click', () => {
    mainWindow.show();
  });
}

function startBackendServer() {
  const serverPath = path.join(__dirname, 'server', 'index-enhanced.js');

  console.log('Starting backend server from:', serverPath);

  // Check if the server file exists
  const fs = require('fs');
  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found at:', serverPath);
    dialog.showErrorBox('Server Error', `Backend server not found at: ${serverPath}`);
    return;
  }

  // Use the Electron runtime as Node in packaged builds instead of relying on a system node binary.
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      STREAMVOICE_OBS_SETTINGS_FILE: obsSettingsFilePath || ''
    },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
    // Send server logs to renderer for debugging
    if (mainWindow) {
      mainWindow.webContents.send('server-log', data.toString());
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
    // Send server errors to renderer
    if (mainWindow) {
      mainWindow.webContents.send('server-error', data.toString());
    }
  });

  serverProcess.on('error', (error) => {
    console.error(`Server failed to start: ${error.message}`);
    dialog.showErrorBox('Server Error', `Failed to start backend server: ${error.message}`);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Server exited with code=${code} signal=${signal}`);
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox('Server Crashed', `Backend server exited unexpectedly with code ${code}`);
    }
  });

  // Give the server time to start
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.webContents.send('server-started');
    }
  }, 2000);
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

// Auto-updater events
autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: 'A new version of StreamVoice is available!',
    detail: 'It will be downloaded in the background.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded!',
    detail: 'StreamVoice will restart to apply the update.',
    buttons: ['Restart Now', 'Later']
  }).then(result => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

// App event handlers
app.whenReady().then(() => {
  obsSettingsFilePath = path.join(app.getPath('userData'), 'obs-settings.json');
  createWindow();
  createTray();
  startBackendServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Kill the server process
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Store for settings
let appSettings = {
  startWithWindows: false,
  minimizeToTray: true,
  autoConnect: true
};

// IPC handlers for renderer
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-settings', () => {
  return appSettings;
});

ipcMain.handle('save-settings', (event, settings) => {
  appSettings = { ...appSettings, ...settings };

  // Update start with Windows setting
  if (settings.startWithWindows !== undefined) {
    app.setLoginItemSettings({
      openAtLogin: settings.startWithWindows,
      openAsHidden: settings.startWithWindows
    });
  }

  return appSettings;
});

ipcMain.handle('check-obs-connection', async () => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/obs-status`);
    if (!response.ok) {
      throw new Error(`OBS status request failed with ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return { connected: false, error: error.message };
  }
});

ipcMain.handle('voice-command', async (event, command) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorPayload.error || `Voice command request failed with ${response.status}`
      };
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', (event, path) => {
  shell.showItemInFolder(path);
});
