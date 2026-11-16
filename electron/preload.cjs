const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.invoke('store:save', data),
  dataPath: () => ipcRenderer.invoke('store:path'),
  exportBackup: (data) => ipcRenderer.invoke('store:export', data),
  importBackup: () => ipcRenderer.invoke('store:import'),
  saveText: (name, content) => ipcRenderer.invoke('file:saveText', { name, content }),
  openDataFolder: () => ipcRenderer.invoke('open:dataFolder'),
  setTheme: (dark) => ipcRenderer.send('theme', dark),
})
