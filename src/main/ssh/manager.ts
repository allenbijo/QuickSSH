import { BrowserWindow } from 'electron'
import { SSHTunnel, TunnelEvent } from './tunnel'
import { parseSSHConfig } from './config'
import { getAliases, getSettings, saveAlias } from '../store'
import type { Alias, SSHHost, TunnelStatus, AliasStatus } from '../../shared/types'
import { IPC } from '../../shared/ipc'

export class SSHManager {
  private tunnels = new Map<string, SSHTunnel[]>()
  private hosts: SSHHost[] = []
  private window: BrowserWindow | null = null
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null

  setWindow(win: BrowserWindow): void {
    this.window = win
  }

  async loadHosts(configPath?: string): Promise<SSHHost[]> {
    const settings = getSettings()
    this.hosts = await parseSSHConfig(configPath || settings.sshConfigPath || undefined)
    return this.hosts
  }

  getHosts(): SSHHost[] {
    return this.hosts
  }

  async connectAlias(aliasId: string): Promise<void> {
    const aliases = getAliases()
    const alias = aliases.find((a) => a.id === aliasId)
    if (!alias) throw new Error(`Alias "${aliasId}" not found`)

    await this.disconnectAlias(aliasId)
    await this.loadHosts()

    const tunnels: SSHTunnel[] = []

    for (const fwd of alias.forwards) {
      const host = this.hosts.find((h) => h.name === fwd.sshHost)
      if (!host) throw new Error(`SSH host "${fwd.sshHost}" not found in config`)

      const tunnel = new SSHTunnel(fwd, host)
      tunnel.on('status', (event: TunnelEvent) => {
        this.pushStatus(aliasId, event)
        this.updateAliasStatus(aliasId)
      })
      tunnels.push(tunnel)
    }

    this.tunnels.set(aliasId, tunnels)

    const results = await Promise.allSettled(tunnels.map((t) => t.connect()))
    const anyFailed = results.some((r) => r.status === 'rejected')
    const allFailed = results.every((r) => r.status === 'rejected')

    alias.enabled = !allFailed
    alias.status = allFailed ? 'error' : anyFailed ? 'error' : 'connected'
    saveAlias(alias)

    this.pushAliasUpdate(alias)

    if (!this.healthCheckInterval) {
      this.startHealthCheck()
    }
  }

  async disconnectAlias(aliasId: string): Promise<void> {
    const tunnels = this.tunnels.get(aliasId)
    if (tunnels) {
      await Promise.all(tunnels.map((t) => t.disconnect()))
      this.tunnels.delete(aliasId)
    }

    const aliases = getAliases()
    const alias = aliases.find((a) => a.id === aliasId)
    if (alias) {
      alias.status = 'disconnected'
      alias.enabled = false
      saveAlias(alias)
      this.pushAliasUpdate(alias)
    }
  }

  async disconnectAll(): Promise<void> {
    const ids = [...this.tunnels.keys()]
    await Promise.all(ids.map((id) => this.disconnectAlias(id)))
  }

  getStatuses(): Record<string, AliasStatus> {
    const result: Record<string, AliasStatus> = {}
    for (const [aliasId, tunnels] of this.tunnels) {
      const statuses = tunnels.map((t) => t.status)
      if (statuses.every((s) => s === 'connected')) result[aliasId] = 'connected'
      else if (statuses.some((s) => s === 'error')) result[aliasId] = 'error'
      else if (statuses.some((s) => s === 'connecting')) result[aliasId] = 'connecting'
      else result[aliasId] = 'disconnected'
    }
    return result
  }

  private updateAliasStatus(aliasId: string): void {
    const tunnels = this.tunnels.get(aliasId)
    if (!tunnels) return

    const statuses = tunnels.map((t) => t.status)
    let aliasStatus: AliasStatus = 'disconnected'

    if (statuses.every((s) => s === 'connected')) aliasStatus = 'connected'
    else if (statuses.some((s) => s === 'error')) aliasStatus = 'error'
    else if (statuses.some((s) => s === 'connecting')) aliasStatus = 'connecting'

    const aliases = getAliases()
    const alias = aliases.find((a) => a.id === aliasId)
    if (alias && alias.status !== aliasStatus) {
      alias.status = aliasStatus
      alias.enabled = aliasStatus === 'connected' || aliasStatus === 'connecting'
      saveAlias(alias)
      this.pushAliasUpdate(alias)
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      for (const [aliasId, tunnels] of this.tunnels) {
        for (const tunnel of tunnels) {
          if (tunnel.status === 'connected' && !tunnel.isAlive()) {
            tunnel.emit('status', {
              status: 'error',
              error: 'Process died unexpectedly',
              forwardId: tunnel.forward.id,
            } satisfies TunnelEvent)
          }
        }
      }
    }, 10_000)
  }

  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  private pushStatus(aliasId: string, event: TunnelEvent): void {
    const status: TunnelStatus = {
      aliasId,
      forwardId: event.forwardId,
      status: event.status,
      error: event.error,
      pid: event.pid,
    }
    this.window?.webContents.send(IPC.SSH_STATUS_UPDATE, status)
  }

  private pushAliasUpdate(alias: Alias): void {
    this.window?.webContents.send('aliases:updated', alias)
  }

  async destroy(): Promise<void> {
    this.stopHealthCheck()
    await this.disconnectAll()
  }
}
