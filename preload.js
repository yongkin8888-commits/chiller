const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopFridge', {
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', { dx, dy }),
  closeApp: () => ipcRenderer.send('close-app'),
  loadLayout: () => ipcRenderer.invoke('layout-load'),
  saveLayout: layout => ipcRenderer.invoke('layout-save', layout)
});
