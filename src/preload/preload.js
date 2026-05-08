const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  getModels: () => ipcRenderer.invoke('get-models'),
});
