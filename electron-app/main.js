const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray;
let serverProcess;

// Enable live reload for Electron
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname);
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

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    checkForUpdates();
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
          message: 'StreamVoice v1.0.0',
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
  // Start the Express server as a child process
  const serverPath = path.join(__dirname, 'server', 'index-enhanced.js');

  serverProcess = spawn('node', [serverPath], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
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
  // This will be implemented by the server
  try {
    const response = await fetch('http://localhost:3030/api/obs-status');
    return await response.json();
  } catch (error) {
    return { connected: false };
  }
});

ipcMain.handle('voice-command', async (event, command) => {
  // Send command to server
  try {
    const response = await fetch('http://localhost:3030/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', (event, path) => {
  shell.showItemInFolder(path);
});