const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.invoke('store:save', data),
  saveSync: (data) => ipcRenderer.sendSync('store:saveSync', data),
  dataPath: () => ipcRenderer.invoke('store:path'),
  exportBackup: (data) => ipcRenderer.invoke('store:export', data),
  importBackup: () => ipcRenderer.invoke('store:import'),
  saveText: (name, content) => ipcRenderer.invoke('file:saveText', { name, content }),
  openDataFolder: () => ipcRenderer.invoke('open:dataFolder'),
  setTheme: (dark) => ipcRenderer.send('theme', dark),
  backup: {
    status: () => ipcRenderer.invoke('backup:status'),
    choose: (data) => ipcRenderer.invoke('backup:choose', data),
    useDefault: (data) => ipcRenderer.invoke('backup:useDefault', data),
    disable: () => ipcRenderer.invoke('backup:disable'),
    now: (data) => ipcRenderer.invoke('backup:now', data),
    open: () => ipcRenderer.invoke('backup:open'),
  },
})
