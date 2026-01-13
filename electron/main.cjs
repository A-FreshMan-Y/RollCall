const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs')
        }
    })

    // 👇 关键：区分开发 / 打包环境
    const isDev = !app.isPackaged

    if (isDev) {
        // 开发环境：Vite
        win.loadURL('http://localhost:5173')
    } else {
        // 打包后：本地文件
        win.loadFile(path.join(__dirname, '../dist/index.html'))
    }
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
