const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Data management
  getAllData: () => ipcRenderer.invoke('get-all-data'),
  saveAllData: (data) => ipcRenderer.invoke('save-all-data', data),
  
  // Export/Import
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: (data) => ipcRenderer.invoke('import-data', data),
  exportCalendar: () => ipcRenderer.invoke('export-calendar'),
  exportCsv: () => ipcRenderer.invoke('export-csv'),
  
  // File dialogs
  showSaveDialog: (content, defaultName) => ipcRenderer.invoke('show-save-dialog', content, defaultName),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog')
});
