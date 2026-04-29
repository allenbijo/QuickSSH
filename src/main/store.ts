import Store from 'electron-store'
import type { Alias, AppSettings } from '../shared/types'

interface StoreSchema {
  settings: AppSettings
  aliases: Alias[]
}

const store = new Store<StoreSchema>({
  defaults: {
    settings: {
      sshConfigPath: '',
      defaultLocalPortStart: 9000,
    },
    aliases: [],
  },
})

export function getSettings(): AppSettings {
  return store.get('settings')
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...partial }
  store.set('settings', updated)
  return updated
}

export function getAliases(): Alias[] {
  return store.get('aliases')
}

export function saveAlias(alias: Alias): Alias[] {
  const aliases = getAliases()
  const idx = aliases.findIndex((a) => a.id === alias.id)
  if (idx >= 0) {
    aliases[idx] = alias
  } else {
    aliases.push(alias)
  }
  store.set('aliases', aliases)
  return aliases
}

export function deleteAlias(id: string): Alias[] {
  const aliases = getAliases().filter((a) => a.id !== id)
  store.set('aliases', aliases)
  return aliases
}
