const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray;
let serverProcess;
let obsSettingsFilePath;
let backendLogFilePath;
const LOCAL_API_PORT = '3030';
const LOCAL_WS_PORT = '8090';
const SERVER_BASE_URL_CANDIDATES = [
  `http://127.0.0.1:${LOCAL_API_PORT}`,
  `http://localhost:${LOCAL_API_PORT}`,
  `http://[::1]:${LOCAL_API_PORT}`
];
let resolvedServerBaseUrl = null;

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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    backgroundColor: '#0a0a0a',
    show: false,
    title: 'StreamVoice'
  });

  loadStartupScreen('Starting StreamVoice...', 'Launching local backend and connecting to OBS.');

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

function loadStartupScreen(title, detail) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>StreamVoice</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #0f1116;
          color: #f4f7fb;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .panel {
          width: min(560px, calc(100vw - 48px));
          padding: 28px 32px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(29, 34, 43, 0.96), rgba(16, 19, 25, 0.98));
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }
        p {
          margin: 0;
          color: #a9b4c2;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="panel">
        <h1>${title}</h1>
        <p>${detail}</p>
      </div>
    </body>
  </html>`;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

async function loadEnhancedApp(maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const baseUrl = await resolveServerBaseUrl(true);
      await mainWindow.loadURL(`${baseUrl}/index-enhanced.html`);
      mainWindow.show();
      checkForUpdates();
      return;
    } catch (error) {
      loadStartupScreen(
        'Starting StreamVoice...',
        `Waiting for local services (${attempt}/${maxAttempts}). ${error.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  loadStartupScreen(
    'StreamVoice Could Not Start',
    'The local backend did not become reachable. Restart the app and check the packaged backend log.'
  );
  mainWindow.show();
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
          message: 'StreamVoice v1.0.17',
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
  if (!fs.existsSync(serverPath)) {
    console.error('Server file not found at:', serverPath);
    dialog.showErrorBox('Server Error', `Backend server not found at: ${serverPath}`);
    return;
  }

  // Use the Electron runtime as Node in packaged builds instead of relying on a system node binary.
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: LOCAL_API_PORT,
      ELECTRON_RUN_AS_NODE: '1',
      STREAMVOICE_API_PORT: LOCAL_API_PORT,
      STREAMVOICE_WS_PORT: LOCAL_WS_PORT,
      STREAMVOICE_OBS_SETTINGS_FILE: obsSettingsFilePath || ''
    },
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  });

  serverProcess.stdout.on('data', (data) => {
    appendBackendLog(`STDOUT ${data.toString()}`);
    console.log(`Server: ${data}`);
    // Send server logs to renderer for debugging
    if (mainWindow) {
      mainWindow.webContents.send('server-log', data.toString());
    }
  });

  serverProcess.stderr.on('data', (data) => {
    appendBackendLog(`STDERR ${data.toString()}`);
    console.error(`Server Error: ${data}`);
    // Send server errors to renderer
    if (mainWindow) {
      mainWindow.webContents.send('server-error', data.toString());
    }
  });

  serverProcess.on('error', (error) => {
    appendBackendLog(`PROCESS_ERROR ${error.message}`);
    console.error(`Server failed to start: ${error.message}`);
    dialog.showErrorBox('Server Error', `Failed to start backend server: ${error.message}`);
  });

  serverProcess.on('exit', (code, signal) => {
    appendBackendLog(`PROCESS_EXIT code=${code} signal=${signal}`);
    console.log(`Server exited with code=${code} signal=${signal}`);
    if (code !== 0 && !app.isQuitting) {
      dialog.showErrorBox('Server Crashed', `Backend server exited unexpectedly with code ${code}`);
    }
  });

  setTimeout(() => {
    if (mainWindow) {
      loadEnhancedApp();
    }
  }, 500);
}

function appendBackendLog(message) {
  if (!backendLogFilePath) {
    return;
  }

  const line = `[${new Date().toISOString()}] ${message.endsWith('\n') ? message : `${message}\n`}`;
  fs.appendFile(backendLogFilePath, line, () => {});
}

async function resolveServerBaseUrl(forceRefresh = false) {
  if (resolvedServerBaseUrl && !forceRefresh) {
    return resolvedServerBaseUrl;
  }

  for (const baseUrl of SERVER_BASE_URL_CANDIDATES) {
    try {
      const response = await requestLocalJson(baseUrl, '/health');
      if (response.statusCode >= 200 && response.statusCode < 300) {
        resolvedServerBaseUrl = baseUrl;
        return baseUrl;
      }
    } catch (error) {
      // Probe the next local loopback candidate.
    }
  }

  throw new Error('Local StreamVoice API is unavailable');
}

async function fetchFromLocalServer(pathname, options = {}) {
  const candidateUrls = resolvedServerBaseUrl
    ? [resolvedServerBaseUrl, ...SERVER_BASE_URL_CANDIDATES.filter((url) => url !== resolvedServerBaseUrl)]
    : SERVER_BASE_URL_CANDIDATES;

  let lastError = null;

  for (const baseUrl of candidateUrls) {
    try {
      const response = await requestLocalJson(baseUrl, pathname, options);
      resolvedServerBaseUrl = baseUrl;
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Local StreamVoice API is unavailable');
}

function requestLocalJson(baseUrl, pathname, options = {}) {
  const url = new URL(pathname, baseUrl);
  const method = options.method || 'GET';
  const headers = { ...(options.headers || {}) };
  const body = options.body || null;

  if (body && !headers['Content-Length']) {
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  return new Promise((resolve, reject) => {
    const request = http.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      headers,
      timeout: 3000
    }, (response) => {
      let raw = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });

      response.on('end', () => {
        let json = null;
        if (raw) {
          try {
            json = JSON.parse(raw);
          } catch (error) {
            return reject(new Error(`Invalid JSON from local API: ${error.message}`));
          }
        }

        resolve({
          ok: response.statusCode >= 200 && response.statusCode < 300,
          status: response.statusCode,
          statusCode: response.statusCode,
          json: async () => json
        });
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error('Local API request timed out'));
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (body) {
      request.write(body);
    }

    request.end();
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
  obsSettingsFilePath = path.join(app.getPath('userData'), 'obs-settings.json');
  backendLogFilePath = path.join(app.getPath('userData'), 'backend.log');
  fs.writeFileSync(backendLogFilePath, '', { flag: 'a' });
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

ipcMain.handle('get-server-base-url', async () => {
  return await resolveServerBaseUrl();
});

ipcMain.handle('get-backend-log-tail', async () => {
  if (!backendLogFilePath || !fs.existsSync(backendLogFilePath)) {
    return '';
  }

  const content = fs.readFileSync(backendLogFilePath, 'utf8');
  const lines = content.trim().split('\n');
  return lines.slice(-20).join('\n');
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
    const response = await fetchFromLocalServer('/api/obs-status');
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
    const response = await fetchFromLocalServer('/api/command', {
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
