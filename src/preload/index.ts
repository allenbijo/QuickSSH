import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'

const api = {
  // SSH
  sshConnect: (aliasId: string) => ipcRenderer.invoke(IPC.SSH_CONNECT, aliasId),
  sshDisconnect: (aliasId: string) => ipcRenderer.invoke(IPC.SSH_DISCONNECT, aliasId),
  sshDisconnectAll: () => ipcRenderer.invoke(IPC.SSH_DISCONNECT_ALL),
  sshStatus: () => ipcRenderer.invoke(IPC.SSH_STATUS),
  sshReadConfig: (path?: string) => ipcRenderer.invoke(IPC.SSH_CONFIG_READ, path),
  sshGetHosts: () => ipcRenderer.invoke(IPC.SSH_CONFIG_HOSTS),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, settings),

  // Aliases
  getAliases: () => ipcRenderer.invoke(IPC.ALIASES_GET),
  saveAlias: (alias: unknown) => ipcRenderer.invoke(IPC.ALIASES_SAVE, alias),
  deleteAlias: (id: string) => ipcRenderer.invoke(IPC.ALIASES_DELETE, id),

  // Terminal
  terminalOpen: (sshHost: string) => ipcRenderer.invoke(IPC.TERMINAL_OPEN, sshHost),
  terminalClose: (sessionId: string) => ipcRenderer.invoke(IPC.TERMINAL_CLOSE, sessionId),
  terminalWrite: (sessionId: string, data: string) =>
    ipcRenderer.send(IPC.TERMINAL_DATA, sessionId, data),
  terminalResize: (sessionId: string, cols: number, rows: number) =>
    ipcRenderer.send(IPC.TERMINAL_RESIZE, sessionId, cols, rows),

  // Dialog
  openFileDialog: () => ipcRenderer.invoke(IPC.DIALOG_OPEN_FILE),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),

  // Event listeners
  onStatusUpdate: (cb: (...args: unknown[]) => void) => {
    const handler = (_event: unknown, ...args: unknown[]): void => cb(...args)
    ipcRenderer.on(IPC.SSH_STATUS_UPDATE, handler)
    return () => {
      ipcRenderer.removeListener(IPC.SSH_STATUS_UPDATE, handler)
    }
  },

  onAliasUpdated: (cb: (...args: unknown[]) => void) => {
    const handler = (_event: unknown, ...args: unknown[]): void => cb(...args)
    ipcRenderer.on('aliases:updated', handler)
    return () => {
      ipcRenderer.removeListener('aliases:updated', handler)
    }
  },

  onTerminalData: (cb: (sessionId: string, data: string) => void) => {
    const handler = (_event: unknown, sessionId: string, data: string): void =>
      cb(sessionId, data)
    ipcRenderer.on(IPC.TERMINAL_DATA_OUT, handler)
    return () => {
      ipcRenderer.removeListener(IPC.TERMINAL_DATA_OUT, handler)
    }
  },

  onTerminalExit: (cb: (sessionId: string) => void) => {
    const handler = (_event: unknown, sessionId: string): void => cb(sessionId)
    ipcRenderer.on('terminal:exit', handler)
    return () => {
      ipcRenderer.removeListener('terminal:exit', handler)
    }
  },
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
