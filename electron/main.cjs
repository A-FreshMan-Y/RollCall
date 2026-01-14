const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // 有时文件系统访问受限，开发阶段可尝试关闭，生产环境建议开启并查准路径
        }
    })

    const isDev = !app.isPackaged

    if (isDev) {
        win.loadURL('http://localhost:5173')
    } else {
        // 使用 pathToFileURL 解决路径中的空格、中文字符等编码问题
        const indexPath = path.join(app.getAppPath(), 'dist', 'index.html')
        win.loadURL(url.pathToFileURL(indexPath).href)
    }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

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
