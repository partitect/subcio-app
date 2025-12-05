const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electron', {
  // App info
  isElectron: true,
  platform: process.platform,
  
  // Get app version
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // IPC communication
  send: (channel, data) => {
    const validChannels = ['new-project', 'open-file', 'save-file', 'export-video'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  receive: (channel, func) => {
    const validChannels = ['new-project', 'file-opened', 'file-saved', 'export-progress', 'export-complete'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // Export video using native FFmpeg (faster than wasm)
  exportVideo: (options) => ipcRenderer.invoke('export:video', options),
  
  // Get backend URL
  getBackendUrl: () => 'http://127.0.0.1:8000',
});

// Notify that we're in Electron
window.addEventListener('DOMContentLoaded', () => {
  console.log('Running in Electron Desktop Mode');
  console.log('Platform:', process.platform);
});
