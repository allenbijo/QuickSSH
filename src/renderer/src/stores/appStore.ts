import { create } from 'zustand'
import type { Alias, SSHHost, AppSettings, AliasStatus } from '../../../shared/types'

interface AppState {
  aliases: Alias[]
  hosts: SSHHost[]
  settings: AppSettings
  loading: boolean
  page: 'main' | 'settings'

  setPage: (page: 'main' | 'settings') => void
  loadAliases: () => Promise<void>
  loadHosts: () => Promise<void>
  loadSettings: () => Promise<void>
  toggleAlias: (id: string) => Promise<void>
  saveAlias: (alias: Alias) => Promise<void>
  deleteAlias: (id: string) => Promise<void>
  updateAliasStatus: (aliasId: string, status: AliasStatus) => void
  refreshAlias: (id: string) => Promise<void>
  disconnectAll: () => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>
  updateAliasFromMain: (alias: Alias) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  aliases: [],
  hosts: [],
  settings: { sshConfigPath: '', defaultLocalPortStart: 9000 },
  loading: false,
  page: 'main',

  setPage: (page) => set({ page }),

  loadAliases: async () => {
    const aliases = await window.api.getAliases()
    set({ aliases })
  },

  loadHosts: async () => {
    const hosts = await window.api.sshGetHosts()
    set({ hosts })
  },

  loadSettings: async () => {
    const settings = await window.api.getSettings()
    set({ settings })
  },

  toggleAlias: async (id) => {
    const alias = get().aliases.find((a) => a.id === id)
    if (!alias) return

    if (alias.enabled || alias.status === 'connected' || alias.status === 'connecting') {
      set({
        aliases: get().aliases.map((a) =>
          a.id === id ? { ...a, status: 'disconnected' as const, enabled: false } : a
        ),
      })
      try {
        await window.api.sshDisconnect(id)
      } catch {
        // still update UI
      }
    } else {
      set({
        aliases: get().aliases.map((a) =>
          a.id === id ? { ...a, status: 'connecting' as const, enabled: true } : a
        ),
      })
      try {
        await window.api.sshConnect(id)
      } catch {
        set({
          aliases: get().aliases.map((a) =>
            a.id === id ? { ...a, status: 'error' as const, enabled: false } : a
          ),
        })
      }
    }
    await get().loadAliases()
  },

  saveAlias: async (alias) => {
    await window.api.saveAlias(alias)
    await get().loadAliases()
  },

  deleteAlias: async (id) => {
    await window.api.sshDisconnect(id)
    await window.api.deleteAlias(id)
    await get().loadAliases()
  },

  updateAliasStatus: (aliasId, status) => {
    set({
      aliases: get().aliases.map((a) =>
        a.id === aliasId ? { ...a, status, enabled: status === 'connected' } : a
      ),
    })
  },

  refreshAlias: async (id) => {
    await window.api.sshDisconnect(id)
    set({
      aliases: get().aliases.map((a) =>
        a.id === id ? { ...a, status: 'connecting' as const, enabled: true } : a
      ),
    })
    try {
      await window.api.sshConnect(id)
    } catch {
      // error state will be pushed from main
    }
    await get().loadAliases()
  },

  disconnectAll: async () => {
    await window.api.sshDisconnectAll()
    await get().loadAliases()
  },

  updateSettings: async (partial) => {
    const updated = await window.api.setSettings(partial)
    set({ settings: updated })
    await get().loadHosts()
  },

  updateAliasFromMain: (alias) => {
    set({
      aliases: get().aliases.map((a) => (a.id === alias.id ? alias : a)),
    })
  },
}))
