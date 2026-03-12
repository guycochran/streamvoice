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