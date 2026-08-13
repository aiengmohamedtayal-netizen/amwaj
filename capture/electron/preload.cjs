const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('captureDesktop', {
  getSources: () => ipcRenderer.invoke('capture:get-sources'),
  setSource: (sourceId) => ipcRenderer.invoke('capture:set-source', sourceId),
  saveProject: (project) => ipcRenderer.invoke('capture:save-project', project),
  openProject: () => ipcRenderer.invoke('capture:open-project'),
  exportVideo: (payload) => ipcRenderer.invoke('capture:export-video', payload),
  openPath: (filePath) => ipcRenderer.invoke('capture:open-path', filePath),
  onToggleRecording: (callback) => {
    ipcRenderer.on('capture:toggle-recording', callback);
    return () => ipcRenderer.removeListener('capture:toggle-recording', callback);
  }
});
