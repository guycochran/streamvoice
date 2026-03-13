const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),

    // App info
    getVersion: () => ipcRenderer.invoke('get-version'),

    // OBS connection
    checkOBSConnection: () => ipcRenderer.invoke('check-obs-connection'),
    desktopExecuteCommand: (command) => ipcRenderer.invoke('desktop-execute-command', command),
    desktopGetCommandHistory: () => ipcRenderer.invoke('desktop-get-command-history'),
    desktopGetHealth: () => ipcRenderer.invoke('desktop-get-health'),
    desktopGetObsSettings: () => ipcRenderer.invoke('desktop-get-obs-settings'),
    desktopGetStatus: () => ipcRenderer.invoke('desktop-get-status'),
    desktopSaveObsSettings: (settings) => ipcRenderer.invoke('desktop-save-obs-settings', settings),
    desktopTestObsConnection: () => ipcRenderer.invoke('desktop-test-obs-connection'),
    desktopUpdateSubsystemHealth: (payload) => ipcRenderer.invoke('desktop-update-subsystem-health', payload),
    speechGetState: () => ipcRenderer.invoke('speech-get-state'),
    speechStartPushToTalk: () => ipcRenderer.invoke('speech-start-push-to-talk'),
    speechStopPushToTalk: () => ipcRenderer.invoke('speech-stop-push-to-talk'),
    getServerBaseUrl: () => ipcRenderer.invoke('get-server-base-url'),
    getBackendLogTail: () => ipcRenderer.invoke('get-backend-log-tail'),
    onDesktopStatusUpdated: (callback) => ipcRenderer.on('desktop-status-updated', (_event, status) => callback(status)),
    onSpeechStateUpdated: (callback) => ipcRenderer.on('speech-state-updated', (_event, state) => callback(state)),

    // Settings
    getSettings: () => ipcRenderer.invoke('get-settings'),
    saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

    // Voice commands
    sendVoiceCommand: (command) => ipcRenderer.invoke('voice-command', command),

    // Updates
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),

    // System
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),
});
