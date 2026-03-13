const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('speechCaptureAPI', {
  onStart: (callback) => ipcRenderer.on('speech-capture-start', (_event, payload) => callback(payload)),
  onStop: (callback) => ipcRenderer.on('speech-capture-stop', callback),
  onStartMonitor: (callback) => ipcRenderer.on('speech-capture-monitor-start', (_event, payload) => callback(payload)),
  submitAudio: (payload) => ipcRenderer.invoke('speech-submit-audio', payload),
  reportError: (message) => ipcRenderer.send('speech-capture-error', message),
  reportLevel: (payload) => ipcRenderer.send('speech-capture-level', payload),
  reportReady: () => ipcRenderer.send('speech-capture-ready')
});
