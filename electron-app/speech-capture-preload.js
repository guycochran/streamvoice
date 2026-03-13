const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('speechCaptureAPI', {
  onStart: (callback) => ipcRenderer.on('speech-capture-start', (_event, payload) => callback(payload)),
  onStop: (callback) => ipcRenderer.on('speech-capture-stop', callback),
  onStartMonitor: (callback) => ipcRenderer.on('speech-capture-monitor-start', (_event, payload) => callback(payload)),
  submitPreviewAudio: (payload) => ipcRenderer.invoke('speech-preview-audio', payload),
  submitAudio: (payload) => ipcRenderer.invoke('speech-submit-audio', payload),
  beginAudioUpload: (payload) => ipcRenderer.invoke('speech-begin-audio-upload', payload),
  appendAudioUploadChunk: (payload) => ipcRenderer.invoke('speech-append-audio-upload-chunk', payload),
  completeAudioUpload: (payload) => ipcRenderer.invoke('speech-complete-audio-upload', payload),
  reportError: (message) => ipcRenderer.send('speech-capture-error', message),
  reportLifecycle: (payload) => ipcRenderer.send('speech-capture-lifecycle', payload),
  reportLevel: (payload) => ipcRenderer.send('speech-capture-level', payload),
  reportReady: () => ipcRenderer.send('speech-capture-ready')
});
