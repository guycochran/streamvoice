const { app, BrowserWindow, Tray, Menu, shell, ipcMain, dialog, globalShortcut } = require('electron');
const http = require('http');
const fs = require('fs');
const OBSWebSocket = require('obs-websocket-js').default;
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const { SpeechService } = require('./services/speech-service');
const { resolveWhisperConfig, transcribeWithWhisper } = require('./services/whisper-runner');
const { NativeSpeechCaptureService } = require('./services/native-speech-capture-service');

let mainWindow;
let speechCaptureWindow;
let tray;
let serverProcess;
let obsSettingsFilePath;
let appSettingsFilePath;
let backendLogFilePath;
let speechCaptureDirPath;
const speechUploadSessions = new Map();
let nativeSpeechCaptureService;
let registeredVoiceHotkey = null;
let desktopObsReconnectTimer = null;
let latestSpeechPreviewSequence = 0;
const speechService = new SpeechService();
const LOCAL_API_PORT = '3030';
const LOCAL_WS_PORT = '8090';
const SERVER_BASE_URL_CANDIDATES = [
  `http://127.0.0.1:${LOCAL_API_PORT}`,
  `http://localhost:${LOCAL_API_PORT}`,
  `http://[::1]:${LOCAL_API_PORT}`
];
let resolvedServerBaseUrl = null;
const desktopObs = new OBSWebSocket();
let desktopObsState = {
  connected: false,
  status: 'disconnected',
  url: 'ws://127.0.0.1:4455',
  reconnectAttempts: 0,
  lastSuccessfulConnection: null,
  lastError: null,
  settings: {
    host: '127.0.0.1',
    port: 4455,
    password: ''
  }
};
let desktopCommandHistory = [];

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
      allowRunningInsecureContent: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    frame: true,
    backgroundColor: '#0a0a0a',
    show: false,
    title: 'StreamVoice'
  });

  mainWindow.loadFile(path.join(__dirname, 'web', 'index-enhanced.html'));
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

function createSpeechCaptureWindow() {
  speechCaptureWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'speech-capture-preload.js')
    }
  });

  speechCaptureWindow.loadFile(path.join(__dirname, 'speech-capture.html'));
  speechCaptureWindow.on('closed', () => {
    speechCaptureWindow = null;
  });
}

function loadStartupScreen(title, detail) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const backendTail = getBackendLogTailSync();
  const backendBlock = backendTail
    ? `<pre>${escapeHtml(backendTail)}</pre>`
    : '<p>No backend log available yet.</p>';

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
        pre {
          margin: 16px 0 0;
          padding: 14px;
          white-space: pre-wrap;
          word-break: break-word;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          color: #d7e0ea;
          font-size: 12px;
          line-height: 1.45;
          max-height: 240px;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <div class="panel">
        <h1>${title}</h1>
        <p>${detail}</p>
        ${backendBlock}
      </div>
    </body>
  </html>`;

  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

function getBackendLogTailSync() {
  if (!backendLogFilePath || !fs.existsSync(backendLogFilePath)) {
    return '';
  }

  const content = fs.readFileSync(backendLogFilePath, 'utf8');
  const lines = content.trim().split('\n').filter(Boolean);
  return lines.slice(-12).join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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
          message: 'StreamVoice v1.1.0-beta.7',
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
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
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

function ensureSpeechCaptureDir() {
  if (!speechCaptureDirPath) {
    speechCaptureDirPath = path.join(app.getPath('userData'), 'speech-captures');
  }

  fs.mkdirSync(speechCaptureDirPath, { recursive: true });
  return speechCaptureDirPath;
}

function getNativeSpeechCaptureService() {
  if (!nativeSpeechCaptureService) {
    nativeSpeechCaptureService = new NativeSpeechCaptureService({
      appRoot: __dirname,
      speechCaptureDir: ensureSpeechCaptureDir()
    });
  }

  return nativeSpeechCaptureService;
}

function shouldUseNativeSpeechCapture() {
  return getNativeSpeechCaptureService().isSupported();
}

async function startSpeechCaptureFlow() {
  const currentState = speechService.getState();
  if (currentState.recording || currentState.transcribing) {
    return { success: true, state: currentState };
  }

  const state = speechService.startPushToTalk();
  broadcastSpeechState();

  if (shouldUseNativeSpeechCapture()) {
    try {
      await getNativeSpeechCaptureService().startRecording({
        deviceId: appSettings.preferredMicDeviceId || '',
        deviceLabel: appSettings.preferredMicLabel || ''
      });
      speechService.updateCaptureTelemetry({
        capturePhase: 'native_recording',
        lastError: null
      });
      broadcastSpeechState();
      return { success: true, state: speechService.getState() };
    } catch (error) {
      const failedState = speechService.fail(error);
      broadcastSpeechState();
      return {
        success: false,
        error: error.message,
        state: failedState
      };
    }
  }

  const captureConfig = {
    deviceId: appSettings.preferredMicDeviceId || '',
    previewEnabled: (appSettings.speechCommandModel || 'tiny.en') !== 'tiny.en'
  };
  speechCaptureWindow?.webContents.send('speech-capture-start', captureConfig);
  speechCaptureWindow?.webContents.executeJavaScript(`
    window.__streamvoiceStartCapture && window.__streamvoiceStartCapture(${JSON.stringify(captureConfig)});
  `).catch(() => {});
  return { success: true, state };
}

async function stopSpeechCaptureFlow() {
  const currentState = speechService.getState();
  if (!currentState.recording && !currentState.transcribing) {
    return { success: true, state: currentState };
  }

  const state = speechService.stopPushToTalk();
  broadcastSpeechState();

  if (shouldUseNativeSpeechCapture()) {
    try {
      speechService.updateCaptureTelemetry({
        capturePhase: 'native_finalizing'
      });
      broadcastSpeechState();

      const captureResult = await getNativeSpeechCaptureService().stopRecording();
      speechService.recordWhisperDiagnostics({
        stderr: captureResult.stderr || ''
      });
      speechService.updateCaptureTelemetry({
        capturePhase: 'native_recorded',
        lastAudioBytes: captureResult.byteLength,
        lastAudioMimeType: 'audio/wav'
      });
      broadcastSpeechState();

      return await processSpeechAudioFile(captureResult.filePath, {
        durationMs: captureResult.durationMs,
        mimeType: 'audio/wav'
      });
    } catch (error) {
      const failedState = speechService.fail(error);
      broadcastSpeechState();
      return {
        success: false,
        error: error.message,
        state: failedState
      };
    }
  }

  speechCaptureWindow?.webContents.send('speech-capture-stop');
  speechCaptureWindow?.webContents.executeJavaScript(`
    window.__streamvoiceStopCapture && window.__streamvoiceStopCapture();
  `).catch(() => {});
  return { success: true, state };
}

function registerVoiceHotkey() {
  if (!app.isReady()) {
    return;
  }

  if (registeredVoiceHotkey) {
    globalShortcut.unregister(registeredVoiceHotkey);
    registeredVoiceHotkey = null;
  }

  const accelerator = String(appSettings.voiceHotkey || '').trim();
  if (!accelerator) {
    return;
  }

  try {
    const registered = globalShortcut.register(accelerator, async () => {
      const speechState = speechService.getState();
      if (speechState.recording) {
        await stopSpeechCaptureFlow();
      } else if (!speechState.transcribing) {
        await startSpeechCaptureFlow();
      }
    });

    if (!registered) {
      throw new Error(`Failed to register hotkey "${accelerator}"`);
    }

    registeredVoiceHotkey = accelerator;
  } catch (error) {
    speechService.updateCaptureTelemetry({
      lastError: `Hotkey error: ${error.message}`
    });
    broadcastSpeechState();
  }
}

async function persistSpeechCapture(audioBytes, metadata = {}) {
  const captureDir = ensureSpeechCaptureDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = metadata.mimeType === 'audio/wav'
    ? 'wav'
    : (metadata.mimeType === 'audio/webm' ? 'webm' : 'bin');
  const filePath = path.join(captureDir, `utterance-${timestamp}.${extension}`);
  await fs.promises.writeFile(filePath, Buffer.from(audioBytes));
  return filePath;
}

async function trimSilenceFromWav(filePath, options = {}) {
  const threshold = options.threshold ?? 900;
  const minSilenceSamples = options.minSilenceSamples ?? 1600;
  const raw = await fs.promises.readFile(filePath);

  if (raw.length <= 44) {
    return filePath;
  }

  const riff = raw.toString('ascii', 0, 4);
  const wave = raw.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    return filePath;
  }

  const audioFormat = raw.readUInt16LE(20);
  const channels = raw.readUInt16LE(22);
  const sampleRate = raw.readUInt32LE(24);
  const bitsPerSample = raw.readUInt16LE(34);
  const declaredDataSize = raw.readUInt32LE(40);
  const availableDataSize = Math.max(0, raw.length - 44);
  const dataSize = Math.min(declaredDataSize, availableDataSize);

  if (audioFormat !== 1 || channels !== 1 || bitsPerSample !== 16 || sampleRate !== 16000) {
    return filePath;
  }

  const sampleCount = Math.floor(dataSize / 2);
  if (sampleCount <= 0) {
    return filePath;
  }
  let startSample = 0;
  let endSample = sampleCount - 1;

  const readSample = (index) => Math.abs(raw.readInt16LE(44 + (index * 2)));

  while (startSample < sampleCount && readSample(startSample) < threshold) {
    startSample += 1;
  }

  while (endSample > startSample && readSample(endSample) < threshold) {
    endSample -= 1;
  }

  startSample = Math.max(0, startSample - minSilenceSamples);
  endSample = Math.min(sampleCount - 1, endSample + minSilenceSamples);

  if (startSample <= 0 && endSample >= sampleCount - 1) {
    return filePath;
  }

  const trimmedSampleCount = Math.max(1, endSample - startSample + 1);
  const trimmedDataSize = trimmedSampleCount * 2;
  const trimmed = Buffer.alloc(44 + trimmedDataSize);
  raw.copy(trimmed, 0, 0, 44);
  raw.copy(trimmed, 44, 44 + (startSample * 2), 44 + ((endSample + 1) * 2));
  trimmed.writeUInt32LE(36 + trimmedDataSize, 4);
  trimmed.writeUInt32LE(trimmedDataSize, 40);

  const trimmedPath = filePath.replace(/\.wav$/i, '-trimmed.wav');
  await fs.promises.writeFile(trimmedPath, trimmed);
  return trimmedPath;
}

function createSpeechUploadSession(metadata = {}) {
  const uploadId = `speech-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  speechUploadSessions.set(uploadId, {
    uploadId,
    chunks: [],
    byteLength: 0,
    mimeType: metadata.mimeType || 'audio/wav',
    durationMs: metadata.durationMs || 0
  });
  return uploadId;
}

function appendSpeechUploadChunk(uploadId, audioChunk = []) {
  const session = speechUploadSessions.get(uploadId);
  if (!session) {
    throw new Error('Speech upload session not found');
  }

  const chunkBuffer = Buffer.from(audioChunk);
  session.chunks.push(chunkBuffer);
  session.byteLength += chunkBuffer.length;

  return {
    uploadId,
    totalBytes: session.byteLength,
    chunkCount: session.chunks.length
  };
}

async function transcribeSpeechWithFallback({ primaryAudioPath, fallbackAudioPath = null }) {
  const appRoot = __dirname;
  const userDataPath = app.getPath('userData');
  const preferredModel = appSettings.speechCommandModel || 'tiny.en';
  const attempts = [];
  const seen = new Set();

  const queueAttempt = (audioPath, modelPreference) => {
    if (!audioPath) {
      return;
    }

    const key = `${audioPath}::${modelPreference}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    attempts.push({ audioPath, modelPreference });
  };

  queueAttempt(primaryAudioPath, preferredModel);
  if (fallbackAudioPath && fallbackAudioPath !== primaryAudioPath) {
    queueAttempt(fallbackAudioPath, preferredModel);
  }

  if (preferredModel === 'tiny.en') {
    queueAttempt(primaryAudioPath, 'base.en');
    if (fallbackAudioPath && fallbackAudioPath !== primaryAudioPath) {
      queueAttempt(fallbackAudioPath, 'base.en');
    }
  }

  let lastWhisperResult = null;
  let lastError = null;
  let attemptCount = 0;

  for (const attempt of attempts) {
    attemptCount += 1;
    try {
      const whisperResult = await transcribeWithWhisper({
        audioPath: attempt.audioPath,
        appRoot,
        userDataPath,
        modelPreference: attempt.modelPreference
      });

      lastWhisperResult = {
        ...whisperResult,
        audioPath: attempt.audioPath,
        modelPreference: attempt.modelPreference,
        attemptCount,
        fallbackUsed: attemptCount > 1
      };
      const normalizedTranscript = normalizeSpeechTranscript(whisperResult.transcript);

      if (normalizedTranscript) {
        return {
          whisperResult: lastWhisperResult,
          normalizedTranscript,
          audioPath: attempt.audioPath,
          modelPreference: attempt.modelPreference
        };
      }
    } catch (error) {
      lastError = error;
      lastWhisperResult = {
        transcript: '',
        durationMs: null,
        stdout: '',
        stderr: error.message,
        audioPath: attempt.audioPath,
        modelPreference: attempt.modelPreference,
        modelName: attempt.modelPreference,
        attemptCount,
        fallbackUsed: attemptCount > 1
      };
    }
  }

  if (lastError && !lastWhisperResult?.transcript) {
    throw lastError;
  }

  return {
    whisperResult: lastWhisperResult,
    normalizedTranscript: '',
    audioPath: lastWhisperResult?.audioPath || primaryAudioPath,
    modelPreference: preferredModel
  };
}

async function processSpeechAudioSubmission(audioBytes, payload = {}) {
  latestSpeechPreviewSequence = 0;
  const initialFilePath = await persistSpeechCapture(audioBytes, {
    mimeType: payload.mimeType
  });
  const filePath = initialFilePath;
  speechService.completeCapture({
    filePath,
    durationMs: payload.durationMs,
    audioBytes: audioBytes?.length || 0,
    mimeType: payload.mimeType
  });
  updateSpeechRuntimeConfig();
  broadcastSpeechState();

  const {
    whisperResult,
    normalizedTranscript,
    audioPath: transcriptionAudioPath
  } = await transcribeSpeechWithFallback({
    primaryAudioPath: filePath,
    fallbackAudioPath: initialFilePath
  });

  if (transcriptionAudioPath && transcriptionAudioPath !== filePath) {
    const fallbackStats = await fs.promises.stat(transcriptionAudioPath).catch(() => null);
    speechService.completeCapture({
      filePath: transcriptionAudioPath,
      durationMs: payload.durationMs,
      audioBytes: fallbackStats?.size || (audioBytes?.length || 0),
      mimeType: payload.mimeType
    });
    broadcastSpeechState();
  }

  if (whisperResult) {
    speechService.recordWhisperDiagnostics(whisperResult);
  }

  if (!normalizedTranscript) {
    throw new Error('Whisper did not recognize speech. Try a slightly longer phrase like "unmute mic" or "start stream".');
  }

  speechService.completeTranscript(normalizedTranscript);
  broadcastSpeechState();

  const commandResult = await executeDesktopCommand(normalizedTranscript);
  speechService.recordCommand(normalizedTranscript, commandResult);
  broadcastSpeechState();

  return {
    success: true,
    filePath: transcriptionAudioPath || filePath,
    transcript: normalizedTranscript,
    commandResult,
    state: speechService.getState()
  };
}

async function processSpeechAudioFile(filePath, payload = {}) {
  latestSpeechPreviewSequence = 0;
  const processedFilePath = filePath;
  const fileStats = await fs.promises.stat(processedFilePath);

  speechService.completeCapture({
    filePath: processedFilePath,
    durationMs: payload.durationMs,
    audioBytes: fileStats.size,
    mimeType: payload.mimeType || 'audio/wav'
  });
  updateSpeechRuntimeConfig();
  broadcastSpeechState();

  const {
    whisperResult,
    normalizedTranscript,
    audioPath: transcriptionAudioPath
  } = await transcribeSpeechWithFallback({
    primaryAudioPath: processedFilePath,
    fallbackAudioPath: filePath
  });

  if (transcriptionAudioPath && transcriptionAudioPath !== processedFilePath) {
    const fallbackStats = await fs.promises.stat(transcriptionAudioPath).catch(() => null);
    speechService.completeCapture({
      filePath: transcriptionAudioPath,
      durationMs: payload.durationMs,
      audioBytes: fallbackStats?.size || fileStats.size,
      mimeType: payload.mimeType || 'audio/wav'
    });
    broadcastSpeechState();
  }

  if (whisperResult) {
    speechService.recordWhisperDiagnostics(whisperResult);
  }

  if (!normalizedTranscript) {
    throw new Error('Whisper did not recognize speech. Try a slightly longer phrase like "unmute mic" or "start stream".');
  }

  speechService.completeTranscript(normalizedTranscript);
  broadcastSpeechState();

  const commandResult = await executeDesktopCommand(normalizedTranscript);
  speechService.recordCommand(normalizedTranscript, commandResult);
  broadcastSpeechState();

  return {
    success: true,
    filePath: transcriptionAudioPath || processedFilePath,
    transcript: normalizedTranscript,
    commandResult,
    state: speechService.getState()
  };
}

function loadDesktopObsSettings() {
  try {
    if (!obsSettingsFilePath || !fs.existsSync(obsSettingsFilePath)) {
      return;
    }

    const parsed = JSON.parse(fs.readFileSync(obsSettingsFilePath, 'utf8'));
    if (!parsed || !parsed.host || !parsed.port) {
      return;
    }

    desktopObsState.settings = {
      host: parsed.host,
      port: Number(parsed.port),
      password: parsed.password || ''
    };
  } catch (error) {
    desktopObsState.lastError = `Failed to load OBS settings: ${error.message}`;
  }
}

function loadAppSettings() {
  if (!appSettingsFilePath || !fs.existsSync(appSettingsFilePath)) {
    return;
  }

  try {
    const savedSettings = JSON.parse(fs.readFileSync(appSettingsFilePath, 'utf8'));
    appSettings = {
      ...appSettings,
      ...savedSettings
    };
  } catch (error) {
    console.warn('Failed to load app settings:', error.message);
  }
}

function persistAppSettings() {
  if (!appSettingsFilePath) {
    return;
  }

  fs.writeFileSync(appSettingsFilePath, JSON.stringify(appSettings, null, 2));
}

function persistDesktopObsSettings() {
  if (!obsSettingsFilePath) {
    return;
  }

  fs.mkdirSync(path.dirname(obsSettingsFilePath), { recursive: true });
  fs.writeFileSync(obsSettingsFilePath, JSON.stringify(desktopObsState.settings, null, 2));
}

function buildDesktopObsUrl() {
  return `ws://${desktopObsState.settings.host}:${desktopObsState.settings.port}`;
}

function getDesktopObsStatus() {
  return {
    connected: desktopObsState.connected,
    status: desktopObsState.status,
    url: desktopObsState.url,
    reconnectAttempts: desktopObsState.reconnectAttempts,
    lastSuccessfulConnection: desktopObsState.lastSuccessfulConnection,
    lastError: desktopObsState.lastError,
    scenes: desktopObsState.scenes || [],
    currentScene: desktopObsState.currentScene || ''
  };
}

function pushDesktopCommandHistory(entry) {
  desktopCommandHistory.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  if (desktopCommandHistory.length > 50) {
    desktopCommandHistory = desktopCommandHistory.slice(-50);
  }
}

function getDesktopHealthStatus() {
  const startTime = app.getAppMetrics?.()[0]?.creationTime || Date.now();
  const speechState = speechService.getState();

  return {
    status: desktopObsState.connected ? 'healthy' : 'degraded',
    uptime: 0,
    subsystems: {
      app: {
        status: 'healthy',
        version: app.getVersion(),
        pid: process.pid,
        lastError: null,
        startTime
      },
      backend: {
        status: 'unknown',
        httpApi: {
          status: 'unknown',
          port: LOCAL_API_PORT,
          lastError: null
        },
        webSocket: {
          status: 'unknown',
          port: LOCAL_WS_PORT,
          clients: 0,
          lastError: null
        }
      },
      obs: {
        status: desktopObsState.status,
        url: desktopObsState.url,
        connected: desktopObsState.connected,
        reconnectAttempts: desktopObsState.reconnectAttempts,
        lastSuccessfulConnection: desktopObsState.lastSuccessfulConnection,
        lastError: desktopObsState.lastError
      },
      speech: {
        status: speechState.status || 'unknown',
        engine: speechState.provider || 'whisper.cpp',
        supported: speechState.available,
        gameMode: appSettings.speechGameMode !== false,
        model: speechState.model,
        modelStatus: speechState.modelStatus,
        inputLevel: speechState.inputLevel,
        selectedMicLabel: speechState.selectedMicLabel,
        lastError: speechState.lastError,
        lastTranscriptAt: speechState.lastTranscriptAt
      },
      microphone: {
        status: 'unknown',
        lastError: null
      }
    }
  };
}

function broadcastDesktopStatus() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('desktop-status-updated', getDesktopObsStatus());
  }
}

function broadcastSpeechState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('speech-state-updated', speechService.getState());
  }
}

function syncSpeechCaptureMonitor() {
  if (!speechCaptureWindow || speechCaptureWindow.isDestroyed()) {
    return;
  }

  speechCaptureWindow.webContents.send('speech-capture-monitor-start', {
    deviceId: appSettings.preferredMicDeviceId || ''
  });

  speechCaptureWindow.webContents.executeJavaScript(`
    window.__streamvoiceStartMonitor && window.__streamvoiceStartMonitor(${JSON.stringify({
      deviceId: appSettings.preferredMicDeviceId || ''
    })});
  `).catch(() => {});
}

function updateSpeechRuntimeConfig() {
  const config = resolveWhisperConfig({
    appRoot: __dirname,
    userDataPath: app.getPath('userData'),
    modelPreference: appSettings.speechCommandModel || 'tiny.en'
  });

  speechService.setMode(appSettings.speechInputMode || 'push_to_talk');
  speechService.updateRuntimeConfig({
    binaryPath: config.binaryPath,
    modelPath: config.modelPath,
    modelStatus: config.binaryPath && config.modelPath ? 'ready' : 'not_installed'
  });
  speechService.setState({
    model: appSettings.speechCommandModel || 'tiny.en'
  });
}

function normalizeSpeechTranscript(transcript) {
  return String(transcript || '')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\w\s%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeGameModeTranscript(transcript) {
  return normalizeSpeechTranscript(transcript)
    .replace(/\b(the|please|can you|could you|would you|hey|okay|ok|now)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDesktopCommand(transcript) {
  const normalized = normalizeSpeechTranscript(transcript);
  const gameNormalized = appSettings.speechGameMode ? normalizeGameModeTranscript(transcript) : normalized;
  const activeTranscript = gameNormalized || normalized;

  if (!activeTranscript) {
    return '';
  }

  const compact = ` ${activeTranscript} `;
  const includesPhrase = (phrase) => compact.includes(` ${phrase} `);

  const micVolumeMatch = activeTranscript.match(/\bmic volume (\d+)\s*percent\b/);
  if (micVolumeMatch) {
    return `mic volume ${micVolumeMatch[1]} percent`;
  }

  const desktopVolumeMatch = activeTranscript.match(/\bdesktop volume (\d+)\s*percent\b/);
  if (desktopVolumeMatch) {
    return `desktop volume ${desktopVolumeMatch[1]} percent`;
  }

  if (appSettings.speechGameMode) {
    if (activeTranscript === 'live' || activeTranscript === 'go') return 'start stream';
    if (activeTranscript === 'stop') return 'stop stream';
    if (activeTranscript === 'break' || activeTranscript === 'brb') return 'switch to break';
    if (activeTranscript === 'gameplay' || activeTranscript === 'game') return 'switch to gameplay';
    if (activeTranscript === 'raid') return 'raid mode';
    if (activeTranscript === 'record') return 'record';
    if (activeTranscript === 'screenshot' || activeTranscript === 'shot') return 'screenshot';
  }

  if (includesPhrase('stream starting setup')) return 'stream starting setup';
  if (includesPhrase('stream ending setup')) return 'stream ending setup';
  if (includesPhrase('emergency mute')) return 'emergency mute';
  if (includesPhrase('subscriber celebration')) return 'subscriber celebration';
  if (includesPhrase('raid mode')) return 'raid mode';
  if (includesPhrase('start streaming') || includesPhrase('start the stream') || includesPhrase('start stream') || includesPhrase('go live')) return 'start stream';
  if (includesPhrase('stop streaming') || includesPhrase('stop the stream') || includesPhrase('stop stream') || includesPhrase('end the stream') || includesPhrase('end stream')) return 'stop stream';
  if (includesPhrase('start recording') || includesPhrase('start the recording') || includesPhrase('record')) return 'record';
  if (includesPhrase('stop recording') || includesPhrase('stop the recording') || includesPhrase('end recording')) return 'stop recording';
  if (includesPhrase('take screenshot') || includesPhrase('screenshot')) return 'screenshot';
  if (includesPhrase('unmute microphone') || includesPhrase('unmute mic') || includesPhrase('unmute my mic') || includesPhrase('unmute')) return 'unmute';
  if (includesPhrase('mute microphone') || includesPhrase('mute mic') || includesPhrase('mute my mic') || includesPhrase('mute')) return 'mute';

  if (normalized.includes('switch to ')) {
    const target = normalized.split('switch to ')[1]?.trim();
    if (target) {
      return `switch to ${target}`;
    }
  }

  const knownScenes = Array.isArray(desktopObsState.scenes) ? desktopObsState.scenes : [];
  for (const sceneName of knownScenes) {
    const lowerScene = String(sceneName).toLowerCase();
    if (lowerScene && normalized.includes(lowerScene)) {
      return `switch to ${lowerScene}`;
    }
  }

  return normalized;
}

function updateDesktopSubsystemHealth(subsystem, status, extra = {}) {
  if (subsystem === 'speech') {
    desktopObsState.speech = {
      ...(desktopObsState.speech || {}),
      status,
      engine: 'whisper.cpp',
      ...extra
    };
  }

  if (subsystem === 'microphone') {
    desktopObsState.microphone = {
      ...(desktopObsState.microphone || {}),
      status,
      ...extra
    };
  }
}

async function getDesktopSceneState() {
  const { scenes, currentProgramSceneName } = await desktopObs.call('GetSceneList');
  return {
    currentScene: currentProgramSceneName,
    scenes: scenes.map((scene) => scene.sceneName)
  };
}

function normalizeDesktopName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function resolveMappedScene(targetScene) {
  const mappingKey = normalizeDesktopName(targetScene);
  return appSettings.sceneMappings?.[mappingKey] || targetScene;
}

function getSceneAliases(targetScene) {
  const key = normalizeDesktopName(targetScene);
  const aliasMap = {
    starting: ['starting', 'start', 'starting soon', 'stream starting', 'intro'],
    ending: ['ending', 'end', 'stream ending', 'outro', 'goodbye'],
    brb: ['brb', 'break', 'be right back', 'intermission'],
    raid: ['raid', 'raid mode'],
    gameplay: ['gameplay', 'game', 'gaming'],
    chatting: ['chatting', 'just chatting', 'chat'],
    camera: ['camera', 'cam'],
    desktop: ['desktop', 'screen']
  };

  return aliasMap[key] || [targetScene];
}

async function findDesktopInput(target) {
  const { inputs } = await desktopObs.call('GetInputList');
  return inputs.find((input) => input.inputName.toLowerCase().includes(target.toLowerCase()));
}

async function desktopSwitchToScene(targetScene) {
  if (!desktopObsState.connected) {
    throw new Error('OBS not connected');
  }

  const { scenes } = await getDesktopSceneState();
  const requestedTarget = resolveMappedScene(targetScene);
  const aliases = getSceneAliases(requestedTarget).map(normalizeDesktopName);
  const sceneName = scenes.find((scene) => {
    const normalizedScene = normalizeDesktopName(scene);
    return aliases.some((alias) =>
      normalizedScene === alias ||
      normalizedScene.includes(alias) ||
      alias.includes(normalizedScene)
    );
  });

  if (!sceneName) {
    throw new Error(`Scene "${requestedTarget}" not found`);
  }

  await desktopObs.call('SetCurrentProgramScene', { sceneName });
  desktopObsState.currentScene = sceneName;
  if (!Array.isArray(desktopObsState.scenes) || desktopObsState.scenes.length === 0) {
    desktopObsState.scenes = scenes;
  }
  broadcastDesktopStatus();
  return { success: true, message: `Switched to ${sceneName}` };
}

async function desktopSetMute(target, muted) {
  if (!desktopObsState.connected) {
    throw new Error('OBS not connected');
  }

  const input = await findDesktopInput(target);
  if (!input) {
    throw new Error(`Audio source "${target}" not found`);
  }

  await desktopObs.call('SetInputMute', {
    inputName: input.inputName,
    inputMuted: muted
  });
  return { success: true, message: `${input.inputName} ${muted ? 'muted' : 'unmuted'}` };
}

async function desktopTakeScreenshot() {
  if (!desktopObsState.connected) {
    throw new Error('OBS not connected');
  }

  const { currentScene } = await getDesktopSceneState();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotDir = app.getPath('pictures');
  await desktopObs.call('SaveSourceScreenshot', {
    sourceName: currentScene,
    imageFormat: 'png',
    imageFilePath: path.join(screenshotDir, `streamvoice-screenshot-${timestamp}.png`)
  });
  return { success: true, message: 'Screenshot saved' };
}

async function desktopSetVolume(target, percent) {
  if (!desktopObsState.connected) {
    throw new Error('OBS not connected');
  }

  const input = await findDesktopInput(target);
  if (!input) {
    throw new Error(`Audio source "${target}" not found`);
  }

  const normalizedPercent = Math.max(0, Math.min(100, Number(percent)));
  const volumeDb = normalizedPercent === 0 ? -100 : (normalizedPercent / 100 * 100) - 100;

  await desktopObs.call('SetInputVolume', {
    inputName: input.inputName,
    inputVolumeDb: volumeDb
  });

  return {
    success: true,
    message: `${input.inputName} volume set to ${normalizedPercent}%`
  };
}

async function desktopStartRecording() {
  const { outputActive } = await desktopObs.call('GetRecordStatus');
  if (outputActive) {
    return { success: false, message: 'Already recording' };
  }
  await desktopObs.call('StartRecord');
  return { success: true, message: 'Recording started' };
}

async function desktopStartStreaming() {
  const { outputActive } = await desktopObs.call('GetStreamStatus');
  if (outputActive) {
    return { success: false, message: 'Already streaming' };
  }
  await desktopObs.call('StartStream');
  return { success: true, message: 'Stream started' };
}

async function desktopStopStreaming() {
  const { outputActive } = await desktopObs.call('GetStreamStatus');
  if (!outputActive) {
    return { success: false, message: 'Not streaming' };
  }
  await desktopObs.call('StopStream');
  return { success: true, message: 'Stream stopped' };
}

async function desktopStopRecording() {
  const { outputActive } = await desktopObs.call('GetRecordStatus');
  if (!outputActive) {
    return { success: false, message: 'Not recording' };
  }
  await desktopObs.call('StopRecord');
  return { success: true, message: 'Recording stopped' };
}

async function executeDesktopCommand(command) {
  const normalized = extractDesktopCommand(command);
  const micVolumeMatch = normalized.match(/^mic volume (\d+)\s*percent$/);
  const desktopVolumeMatch = normalized.match(/^desktop volume (\d+)\s*percent$/);
  let result;

  if (!normalized) {
    throw new Error('Command is required');
  }

  if (normalized.startsWith('switch to ')) {
    result = await desktopSwitchToScene(normalized.replace(/^switch to\s+/, ''));
  } else if (micVolumeMatch) {
    result = await desktopSetVolume('mic', micVolumeMatch[1]);
  } else if (desktopVolumeMatch) {
    result = await desktopSetVolume('desktop', desktopVolumeMatch[1]);
  } else if (normalized === 'start recording' || normalized === 'record') {
    result = await desktopStartRecording();
  } else if (normalized === 'stop recording' || normalized === 'end recording') {
    result = await desktopStopRecording();
  } else if (normalized === 'start streaming' || normalized === 'start stream' || normalized === 'go live') {
    result = await desktopStartStreaming();
  } else if (normalized === 'stop streaming' || normalized === 'stop stream' || normalized === 'end stream') {
    result = await desktopStopStreaming();
  } else if (normalized === 'mute microphone' || normalized === 'mute mic' || normalized === 'mute my mic' || normalized === 'mute') {
    result = await desktopSetMute('mic', true);
  } else if (normalized === 'unmute microphone' || normalized === 'unmute mic' || normalized === 'unmute my mic' || normalized === 'unmute') {
    result = await desktopSetMute('mic', false);
  } else if (normalized === 'take screenshot' || normalized === 'screenshot') {
    result = await desktopTakeScreenshot();
  } else if (normalized === 'emergency mute') {
    await desktopSetMute('mic', true);
    try {
      await desktopSwitchToScene('brb');
    } catch (_error) {}
    result = { success: true, message: 'Emergency mute activated' };
  } else if (normalized === 'stream starting setup') {
    try {
      await desktopSwitchToScene('starting');
    } catch (_error) {}
    const streamResult = await desktopStartStreaming();
    let recordResult = { success: false, message: 'Recording not started' };
    try {
      recordResult = await desktopStartRecording();
    } catch (_error) {}
    result = {
      success: streamResult.success || recordResult.success,
      message: `Stream starting setup triggered. ${streamResult.message}. ${recordResult.message}.`
    };
  } else if (normalized === 'stream ending setup') {
    try {
      await desktopSwitchToScene('ending');
    } catch (_error) {}
    const stopStreamResult = await desktopStopStreaming().catch(() => ({ success: false, message: 'Stream stop failed' }));
    const stopRecordResult = await desktopStopRecording().catch(() => ({ success: false, message: 'Recording stop failed' }));
    result = {
      success: stopStreamResult.success || stopRecordResult.success,
      message: `Stream ending setup triggered. ${stopStreamResult.message}. ${stopRecordResult.message}.`
    };
  } else if (normalized === 'raid mode') {
    result = await desktopSwitchToScene('raid');
    result.message = 'Raid mode activated';
  } else if (normalized === 'subscriber celebration') {
    result = { success: true, message: 'Subscriber celebration triggered' };
  } else {
    throw new Error(`Command "${normalized}" is not supported yet in desktop mode`);
  }

  pushDesktopCommandHistory({
    command: normalized,
    result: result.success ? 'success' : 'error',
    message: result.message
  });

  return result;
}

async function connectDesktopObs() {
  clearTimeout(desktopObsReconnectTimer);
  desktopObsState.status = 'connecting';
  desktopObsState.url = buildDesktopObsUrl();
  desktopObsState.reconnectAttempts += 1;
  broadcastDesktopStatus();

  try {
    await desktopObs.connect(desktopObsState.url, desktopObsState.settings.password);
    desktopObsState.connected = true;
    desktopObsState.status = 'connected';
    desktopObsState.lastError = null;
    desktopObsState.lastSuccessfulConnection = new Date().toISOString();
    const sceneState = await getDesktopSceneState().catch(() => ({ scenes: [], currentScene: '' }));
    desktopObsState.scenes = sceneState.scenes || [];
    desktopObsState.currentScene = sceneState.currentScene || '';
  } catch (error) {
    desktopObsState.connected = false;
    desktopObsState.status = 'error';
    desktopObsState.lastError = error.message;
    desktopObsReconnectTimer = setTimeout(() => {
      connectDesktopObs();
    }, 5000);
  }

  broadcastDesktopStatus();
}

desktopObs.on('ConnectionClosed', () => {
  desktopObsState.connected = false;
  desktopObsState.status = 'disconnected';
  desktopObsState.scenes = [];
  desktopObsState.currentScene = '';
  broadcastDesktopStatus();
  clearTimeout(desktopObsReconnectTimer);
  desktopObsReconnectTimer = setTimeout(() => {
    connectDesktopObs();
  }, 5000);
});

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
  appSettingsFilePath = path.join(app.getPath('userData'), 'app-settings.json');
  backendLogFilePath = path.join(app.getPath('userData'), 'backend.log');
  speechCaptureDirPath = path.join(app.getPath('userData'), 'speech-captures');
  fs.writeFileSync(backendLogFilePath, '', { flag: 'a' });
  loadDesktopObsSettings();
  loadAppSettings();
  speechService.initialize();
  updateSpeechRuntimeConfig();
  registerVoiceHotkey();
  createWindow();
  createSpeechCaptureWindow();
  createTray();
  startBackendServer();
  connectDesktopObs();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  globalShortcut.unregisterAll();
  // Kill the server process
  if (serverProcess) {
    serverProcess.kill();
  }
  if (speechCaptureWindow && !speechCaptureWindow.isDestroyed()) {
    speechCaptureWindow.destroy();
  }
  clearTimeout(desktopObsReconnectTimer);
  desktopObs.disconnect().catch(() => {});
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
  autoConnect: true,
  speechInputMode: 'push_to_talk',
  speechCommandModel: 'tiny.en',
  speechGameMode: true,
  voiceHotkey: 'Ctrl+Shift+`',
  preferredMicDeviceId: '',
  preferredMicLabel: '',
  sceneMappings: {
    starting: '',
    ending: '',
    brb: '',
    raid: '',
    gameplay: ''
  }
};

// IPC handlers for renderer
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-settings', () => {
  return appSettings;
});

ipcMain.handle('desktop-get-status', async () => {
  if (desktopObsState.connected) {
    try {
      const sceneState = await getDesktopSceneState();
      desktopObsState.scenes = sceneState.scenes || [];
      desktopObsState.currentScene = sceneState.currentScene || '';
    } catch (_error) {
      // Keep the last known scene state.
    }
  }

  return getDesktopObsStatus();
});

ipcMain.handle('desktop-get-health', () => {
  const health = getDesktopHealthStatus();
  const speechState = speechService.getState();
  if (desktopObsState.speech) {
    health.subsystems.speech = {
      ...health.subsystems.speech,
      ...desktopObsState.speech
    };
  }
  health.subsystems.speech = {
    ...health.subsystems.speech,
    status: speechState.status === 'error' ? 'error' : (speechState.available ? 'available' : health.subsystems.speech.status),
    engine: speechState.provider,
    supported: speechState.available,
    inputLevel: speechState.inputLevel,
    selectedMicLabel: speechState.selectedMicLabel
  };
  if (desktopObsState.microphone) {
    health.subsystems.microphone = {
      ...health.subsystems.microphone,
      ...desktopObsState.microphone
    };
  }
  return health;
});

ipcMain.handle('desktop-get-command-history', () => {
  return desktopCommandHistory;
});

ipcMain.handle('desktop-get-obs-settings', () => {
  return { ...desktopObsState.settings };
});

ipcMain.handle('desktop-save-obs-settings', async (event, settings) => {
  desktopObsState.settings = {
    host: settings.host || '127.0.0.1',
    port: Number(settings.port) || 4455,
    password: settings.password || ''
  };
  persistDesktopObsSettings();

  try {
    await desktopObs.disconnect();
  } catch (error) {
    // Ignore disconnect errors during reconnect.
  }

  await connectDesktopObs();
  return { success: true };
});

ipcMain.handle('desktop-test-obs-connection', async () => {
  const testObs = new OBSWebSocket();
  const url = buildDesktopObsUrl();

  try {
    await testObs.connect(url, desktopObsState.settings.password);
    const version = await testObs.call('GetVersion');
    await testObs.disconnect();
    return {
      success: true,
      obsVersion: version.obsVersion,
      obsWebSocketVersion: version.obsWebSocketVersion
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('desktop-execute-command', async (_event, command) => {
  try {
    return await executeDesktopCommand(command);
  } catch (error) {
    pushDesktopCommandHistory({
      command,
      result: 'error',
      message: error.message
    });
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('desktop-update-subsystem-health', (_event, payload) => {
  updateDesktopSubsystemHealth(payload.subsystem, payload.status, payload.extra || {});
  return { success: true };
});

ipcMain.handle('speech-get-state', () => {
  return speechService.getState();
});

ipcMain.handle('speech-start-push-to-talk', async () => {
  return await startSpeechCaptureFlow();
});

ipcMain.handle('speech-stop-push-to-talk', async () => {
  return await stopSpeechCaptureFlow();
});

ipcMain.on('speech-capture-error', (_event, message) => {
  speechService.fail(message || 'Speech capture failed');
  broadcastSpeechState();
});

ipcMain.on('speech-capture-ready', () => {
  updateSpeechRuntimeConfig();
  syncSpeechCaptureMonitor();
  broadcastSpeechState();
});

ipcMain.on('speech-capture-level', (_event, payload = {}) => {
  const nextInputLevel = Number(payload.inputLevel || 0);
  const nextMicLabel = payload.selectedMicLabel || appSettings.preferredMicLabel || 'System Default Microphone';
  const nextMicDeviceId = payload.selectedMicDeviceId ?? appSettings.preferredMicDeviceId;

  speechService.updateCaptureTelemetry({
    inputLevel: nextInputLevel,
    selectedMicDeviceId: nextMicDeviceId,
    selectedMicLabel: nextMicLabel
  });

  desktopObsState.microphone = {
    ...(desktopObsState.microphone || {}),
    status: 'available',
    inputLevel: nextInputLevel,
    selectedMicDeviceId: nextMicDeviceId,
    selectedMicLabel: nextMicLabel,
    lastError: null
  };

  broadcastSpeechState();
});

ipcMain.on('speech-capture-lifecycle', (_event, payload = {}) => {
  speechService.updateCaptureTelemetry({
    capturePhase: payload.capturePhase,
    lastCaptureChunkCount: payload.lastCaptureChunkCount,
    lastAudioBytes: payload.lastAudioBytes,
    lastAudioMimeType: payload.lastAudioMimeType,
    lastError: payload.lastError
  });
  broadcastSpeechState();
});

ipcMain.handle('speech-submit-audio', async (_event, payload) => {
  try {
    return await processSpeechAudioSubmission(payload.audioBytes, payload);
  } catch (error) {
    const state = speechService.fail(error);
    broadcastSpeechState();
    return {
      success: false,
      error: error.message,
      state
    };
  }
});

ipcMain.handle('speech-begin-audio-upload', async (_event, payload = {}) => {
  const uploadId = createSpeechUploadSession(payload);
  return {
    success: true,
    uploadId
  };
});

ipcMain.handle('speech-append-audio-upload-chunk', async (_event, payload = {}) => {
  try {
    const result = appendSpeechUploadChunk(payload.uploadId, payload.audioChunk || []);
    return {
      success: true,
      ...result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('speech-complete-audio-upload', async (_event, payload = {}) => {
  const session = speechUploadSessions.get(payload.uploadId);
  if (!session) {
    return {
      success: false,
      error: 'Speech upload session not found'
    };
  }

  speechUploadSessions.delete(payload.uploadId);

  try {
    const audioBytes = Buffer.concat(session.chunks);
    return await processSpeechAudioSubmission(audioBytes, {
      mimeType: payload.mimeType || session.mimeType,
      durationMs: payload.durationMs || session.durationMs
    });
  } catch (error) {
    const state = speechService.fail(error);
    broadcastSpeechState();
    return {
      success: false,
      error: error.message,
      state
    };
  }
});

ipcMain.handle('speech-preview-audio', async (_event, payload) => {
  try {
    const sequence = Number(payload.sequence || 0);
    if (sequence < latestSpeechPreviewSequence) {
      return {
        success: true,
        ignored: true
      };
    }

    latestSpeechPreviewSequence = sequence;
    const filePath = await persistSpeechCapture(payload.audioBytes, {
      mimeType: payload.mimeType
    });
    const whisperResult = await transcribeWithWhisper({
      audioPath: filePath,
      appRoot: __dirname,
      userDataPath: app.getPath('userData'),
      timeoutMs: 7000,
      modelPreference: appSettings.speechCommandModel || 'tiny.en'
    });
    const normalizedTranscript = normalizeSpeechTranscript(whisperResult.transcript);

    if (sequence !== latestSpeechPreviewSequence) {
      return {
        success: true,
        ignored: true
      };
    }

    if (normalizedTranscript) {
      speechService.recordPreview({
        transcript: normalizedTranscript,
        sequence,
        durationMs: whisperResult.durationMs,
        stdout: whisperResult.stdout,
        stderr: whisperResult.stderr
      });
      broadcastSpeechState();
    }

    return {
      success: true,
      transcript: normalizedTranscript
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

speechService.on('state-changed', () => {
  broadcastSpeechState();
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

  if (Object.prototype.hasOwnProperty.call(settings, 'speechInputMode')) {
    speechService.setMode(appSettings.speechInputMode || 'push_to_talk');
    broadcastSpeechState();
  }

  if (Object.prototype.hasOwnProperty.call(settings, 'voiceHotkey')) {
    registerVoiceHotkey();
  }

  persistAppSettings();
  if (Object.prototype.hasOwnProperty.call(settings, 'preferredMicDeviceId')) {
    syncSpeechCaptureMonitor();
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
