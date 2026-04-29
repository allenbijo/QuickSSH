import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { SSHManager } from './ssh/manager'
import { TerminalManager } from './ssh/terminal'
import { parseSSHConfig } from './ssh/config'
import * as store from './store'
import { IPC } from '../shared/ipc'

const sshManager = new SSHManager()
const terminalManager = new TerminalManager()
let mainWin: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  mainWin = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    transparent: true,
    frame: false,
    hasShadow: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    show: false,
  })
  const win = mainWin

  win.on('ready-to-show', () => {
    win.show()
  })

  sshManager.setWindow(win)
  terminalManager.setWindow(win)

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function registerIPC(): void {
  // SSH
  ipcMain.handle(IPC.SSH_CONNECT, async (_, aliasId: string) => {
    await sshManager.connectAlias(aliasId)
  })

  ipcMain.handle(IPC.SSH_DISCONNECT, async (_, aliasId: string) => {
    await sshManager.disconnectAlias(aliasId)
  })

  ipcMain.handle(IPC.SSH_DISCONNECT_ALL, async () => {
    await sshManager.disconnectAll()
  })

  ipcMain.handle(IPC.SSH_STATUS, () => {
    return sshManager.getStatuses()
  })

  ipcMain.handle(IPC.SSH_CONFIG_READ, async (_, path?: string) => {
    return parseSSHConfig(path)
  })

  ipcMain.handle(IPC.SSH_CONFIG_HOSTS, async () => {
    return sshManager.loadHosts()
  })

  // Settings
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return store.getSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_, settings: Record<string, unknown>) => {
    return store.setSettings(settings)
  })

  // Aliases
  ipcMain.handle(IPC.ALIASES_GET, () => {
    return store.getAliases()
  })

  ipcMain.handle(IPC.ALIASES_SAVE, (_, alias) => {
    return store.saveAlias(alias)
  })

  ipcMain.handle(IPC.ALIASES_DELETE, (_, id: string) => {
    return store.deleteAlias(id)
  })

  // Terminal
  ipcMain.handle(IPC.TERMINAL_OPEN, (_, sshHost: string) => {
    return terminalManager.open(sshHost)
  })

  ipcMain.handle(IPC.TERMINAL_CLOSE, (_, sessionId: string) => {
    terminalManager.close(sessionId)
  })

  ipcMain.on(IPC.TERMINAL_DATA, (_, sessionId: string, data: string) => {
    terminalManager.write(sessionId, data)
  })

  ipcMain.on(IPC.TERMINAL_RESIZE, (_, sessionId: string, cols: number, rows: number) => {
    terminalManager.resize(sessionId, cols, rows)
  })

  // Window controls
  ipcMain.handle('window:minimize', () => mainWin?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWin?.isMaximized()) mainWin.unmaximize()
    else mainWin?.maximize()
  })
  ipcMain.handle('window:close', () => mainWin?.close())

  // File dialog
  ipcMain.handle(IPC.DIALOG_OPEN_FILE, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'All Files', extensions: ['*'] }],
    })
    return result.canceled ? null : result.filePaths[0]
  })
}

app.whenReady().then(() => {
  registerIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await sshManager.destroy()
  terminalManager.closeAll()
})
