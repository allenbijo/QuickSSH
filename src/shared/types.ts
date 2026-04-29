export interface SSHHost {
  name: string
  hostname: string
  port: number
  user: string
  identityFile?: string
  proxyJump?: string
}

export interface PortForward {
  id: string
  localPort: number
  remoteHost: string
  remotePort: number
  sshHost: string
}

export type AliasStatus = 'connected' | 'disconnected' | 'error' | 'connecting'

export interface Alias {
  id: string
  name: string
  forwards: PortForward[]
  enabled: boolean
  status: AliasStatus
}

export interface AppSettings {
  sshConfigPath: string
  defaultLocalPortStart: number
}

export interface TunnelStatus {
  aliasId: string
  forwardId: string
  status: AliasStatus
  error?: string
  pid?: number
}
