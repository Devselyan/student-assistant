const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getClasses: () => ipcRenderer.invoke('get-classes'),
  saveClass: (cls) => ipcRenderer.invoke('save-class', cls),
  deleteClass: (id) => ipcRenderer.invoke('delete-class', id),
  exportCalendar: () => ipcRenderer.invoke('export-calendar'),
  exportCsv: () => ipcRenderer.invoke('export-csv')
});
