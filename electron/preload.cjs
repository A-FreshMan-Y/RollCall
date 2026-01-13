const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openTxtFile: () => ipcRenderer.invoke('open-txt-file')
})
