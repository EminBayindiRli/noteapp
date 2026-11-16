const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.VITE_DEV === '1'
// Test için veri klasörü dışarıdan verilebilir; normalde %APPDATA%\NoteApp
if (process.env.NOTEAPP_DATA_DIR) app.setPath('userData', process.env.NOTEAPP_DATA_DIR)
const dataDir = app.getPath('userData')
const dataFile = path.join(dataDir, 'noteapp-data.json')
const backupDir = path.join(dataDir, 'backups')
const configFile = path.join(dataDir, 'config.json')

const MIRROR_NAME = 'noteapp-data.json'
const KEEP_DAYS = 30

let win

// Aynı anda iki pencere aynı dosyaya yazmasın
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

/* ---------------- Ayar dosyası (yedek klasörü vb.) ---------------- */

function defaultMirrorDir() {
  if (process.env.NOTEAPP_MIRROR_DIR) return process.env.NOTEAPP_MIRROR_DIR
  const od = process.env.OneDrive || process.env.OneDriveConsumer || process.env.OneDriveCommercial
  if (od && fs.existsSync(od)) return path.join(od, 'NoteApp Yedek')
  return null
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf8'))
  } catch {
    return {}
  }
}
function writeConfig(c) {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(configFile, JSON.stringify(c, null, 2), 'utf8')
}

let config = readConfig()
// İlk çalıştırmada OneDrive varsa yedek klasörü olarak onu kullan
if (config.mirrorDir === undefined) {
  config.mirrorDir = defaultMirrorDir()
  try {
    writeConfig(config)
  } catch {}
}

const mirrorStatus = { lastAt: null, error: null }

/* ---------------- Yazma yardımcıları ---------------- */

const localDay = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function atomicWrite(file, json) {
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, json, 'utf8')
  fs.renameSync(tmp, file)
}

function dailyCopy(dir, json) {
  fs.mkdirSync(dir, { recursive: true })
  const f = path.join(dir, `noteapp-${localDay()}.json`)
  // Günün kopyası her kayıtta güncellenir: her gün için o günün son hali saklanır
  atomicWrite(f, json)
  const files = fs.readdirSync(dir).filter((n) => /^noteapp-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort()
  while (files.length > KEEP_DAYS) fs.unlinkSync(path.join(dir, files.shift()))
}

function writeMirror(json) {
  if (!config.mirrorDir) return
  try {
    fs.mkdirSync(config.mirrorDir, { recursive: true })
    atomicWrite(path.join(config.mirrorDir, MIRROR_NAME), json)
    dailyCopy(path.join(config.mirrorDir, 'gunluk'), json)
    mirrorStatus.lastAt = new Date().toISOString()
    mirrorStatus.error = null
  } catch (e) {
    mirrorStatus.error = e.message
  }
}

function saveAll(data) {
  const json = JSON.stringify(data, null, 2)
  fs.mkdirSync(dataDir, { recursive: true })
  atomicWrite(dataFile, json)
  try {
    dailyCopy(backupDir, json)
  } catch {}
  writeMirror(json)
}

/* ---------------- Pencere ---------------- */

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

/* ---------------- IPC ---------------- */

ipcMain.handle('store:load', () => {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8')
      const data = JSON.parse(raw)
      writeMirror(raw) // açılışta da bir kopya al
      return { data, restored: false }
    }
  } catch (e) {
    console.error(e)
  }
  // Bu bilgisayarda veri yok ama yedek klasöründe varsa (ör. yeni bilgisayar): oradan geri yükle
  try {
    const m = config.mirrorDir && path.join(config.mirrorDir, MIRROR_NAME)
    if (m && fs.existsSync(m)) {
      const data = JSON.parse(fs.readFileSync(m, 'utf8'))
      fs.mkdirSync(dataDir, { recursive: true })
      atomicWrite(dataFile, JSON.stringify(data, null, 2))
      return { data, restored: true }
    }
  } catch (e) {
    console.error(e)
  }
  return { data: null, restored: false }
})

ipcMain.handle('store:save', (_e, data) => {
  saveAll(data)
  return true
})

// Pencere kapanırken son değişikliğin kaybolmaması için senkron kayıt
ipcMain.on('store:saveSync', (e, data) => {
  try {
    saveAll(data)
    e.returnValue = true
  } catch {
    e.returnValue = false
  }
})

ipcMain.handle('store:path', () => dataFile)

ipcMain.handle('backup:status', () => ({
  dir: config.mirrorDir,
  isOneDrive: !!config.mirrorDir && /onedrive/i.test(config.mirrorDir),
  lastAt: mirrorStatus.lastAt,
  error: mirrorStatus.error,
  suggested: defaultMirrorDir(),
}))

ipcMain.handle('backup:choose', async (_e, data) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Yedeklerin kaydedileceği klasörü seç',
    defaultPath: config.mirrorDir || defaultMirrorDir() || app.getPath('documents'),
    properties: ['openDirectory', 'createDirectory'],
  })
  if (canceled || !filePaths[0]) return false
  config.mirrorDir = filePaths[0]
  writeConfig(config)
  if (data) writeMirror(JSON.stringify(data, null, 2))
  return true
})

ipcMain.handle('backup:useDefault', (_e, data) => {
  config.mirrorDir = defaultMirrorDir()
  writeConfig(config)
  if (data) writeMirror(JSON.stringify(data, null, 2))
  return !!config.mirrorDir
})

ipcMain.handle('backup:disable', () => {
  config.mirrorDir = null
  writeConfig(config)
  mirrorStatus.lastAt = null
  mirrorStatus.error = null
  return true
})

ipcMain.handle('backup:now', (_e, data) => {
  writeMirror(JSON.stringify(data, null, 2))
  return { lastAt: mirrorStatus.lastAt, error: mirrorStatus.error }
})

ipcMain.handle('backup:open', () => config.mirrorDir && shell.openPath(config.mirrorDir))

ipcMain.handle('store:export', async (_e, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Yedeği kaydet',
    defaultPath: `noteapp-yedek-${localDay()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8')
  return true
})

ipcMain.handle('store:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Yedek dosyası seç',
    defaultPath: config.mirrorDir || undefined,
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
