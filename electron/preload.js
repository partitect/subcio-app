const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electron', {
  // App info
  isElectron: true,
  platform: process.platform,
  
  // IPC communication
  send: (channel, data) => {
    const validChannels = ['new-project', 'open-file', 'save-file'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  receive: (channel, func) => {
    const validChannels = ['new-project', 'file-opened', 'file-saved'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  
  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
});

// Notify that we're in Electron
window.addEventListener('DOMContentLoaded', () => {
  console.log('Running in Electron');
});
