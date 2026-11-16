const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.VITE_DEV === '1'
const dataDir = app.getPath('userData')
const dataFile = path.join(dataDir, 'noteapp-data.json')
const backupDir = path.join(dataDir, 'backups')

let win

const overlay = (dark) => ({
  color: dark ? '#09090b' : '#fafafa',
  symbolColor: dark ? '#a1a1aa' : '#52525b',
  height: 40,
})

function createWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1000,
    minHeight: 640,
    title: 'NoteApp',
    backgroundColor: '#fafafa',
    titleBarStyle: 'hidden',
    titleBarOverlay: overlay(false),
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.setMenuBarVisibility(false)
  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  if (isDev) win.loadURL('http://localhost:5173')
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

function dailyBackup(json) {
  try {
    fs.mkdirSync(backupDir, { recursive: true })
    const day = new Date().toISOString().slice(0, 10)
    const f = path.join(backupDir, `noteapp-${day}.json`)
    if (!fs.existsSync(f)) {
      fs.writeFileSync(f, json, 'utf8')
      const files = fs.readdirSync(backupDir).filter((n) => n.endsWith('.json')).sort()
      while (files.length > 30) fs.unlinkSync(path.join(backupDir, files.shift()))
    }
  } catch {}
}

ipcMain.handle('store:load', () => {
  try {
    if (fs.existsSync(dataFile)) return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  } catch (e) {
    console.error(e)
  }
  return null
})

ipcMain.handle('store:save', (_e, data) => {
  const json = JSON.stringify(data, null, 2)
  const tmp = dataFile + '.tmp'
  fs.writeFileSync(tmp, json, 'utf8')
  fs.renameSync(tmp, dataFile)
  dailyBackup(json)
  return true
})

ipcMain.handle('store:path', () => dataFile)

ipcMain.handle('store:export', async (_e, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Yedeği kaydet',
    defaultPath: `noteapp-yedek-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  return true
})

ipcMain.handle('store:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Yedek dosyası seç',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths[0]) return null
  return JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
})

ipcMain.handle('file:saveText', async (_e, { name, content }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: name,
    filters: [{ name: 'CSV (Excel)', extensions: ['csv'] }],
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, '﻿' + content, 'utf8')
  return true
})

ipcMain.handle('open:dataFolder', () => shell.openPath(dataDir))

ipcMain.on('theme', (_e, dark) => {
  if (!win) return
  try {
    win.setTitleBarOverlay(overlay(dark))
    win.setBackgroundColor(dark ? '#09090b' : '#fafafa')
  } catch {}
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
