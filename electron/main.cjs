const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: __dirname + '/preload.cjs'
        }
    })

    win.loadURL('http://localhost:5173')
}

ipcMain.handle('open-txt-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: '选择名单文件',
        filters: [{ name: 'Text', extensions: ['txt'] }],
        properties: ['openFile']
    })

    if (canceled) return []

    const content = fs.readFileSync(filePaths[0], 'utf-8')

    return content
        .split(/\r?\n/)
        .map(n => n.trim())
        .filter(Boolean)
})

app.whenReady().then(createWindow)
