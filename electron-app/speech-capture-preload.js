const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('speechCaptureAPI', {
  onStart: (callback) => ipcRenderer.on('speech-capture-start', callback),
  onStop: (callback) => ipcRenderer.on('speech-capture-stop', callback),
  submitAudio: (payload) => ipcRenderer.invoke('speech-submit-audio', payload),
  reportError: (message) => ipcRenderer.send('speech-capture-error', message),
  reportReady: () => ipcRenderer.send('speech-capture-ready')
});
