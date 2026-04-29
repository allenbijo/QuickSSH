import { SSHConfig } from 'ssh-config'
import { readFile } from 'fs/promises'
import { homedir } from 'os'
import path from 'path'
import type { SSHHost } from '../../shared/types'

export function getDefaultSSHConfigPath(): string {
  return path.join(homedir(), '.ssh', 'config')
}

export async function parseSSHConfig(configPath?: string): Promise<SSHHost[]> {
  const filePath = configPath || getDefaultSSHConfigPath()

  let raw: string
  try {
    raw = await readFile(filePath, 'utf-8')
  } catch {
    return []
  }

  const config = SSHConfig.parse(raw)
  const hosts: SSHHost[] = []

  for (const line of config) {
    if (line.type !== SSHConfig.DIRECTIVE || line.param !== 'Host') continue

    const rawValue = line.value
    const hostNames: string[] = Array.isArray(rawValue)
      ? (rawValue as { val: string }[]).map((v) => v.val)
      : [String(rawValue)]

    for (const hostValue of hostNames) {
      if (hostValue.includes('*') || hostValue.includes('?')) continue

      const computed = config.compute(hostValue)
      hosts.push({
        name: hostValue,
        hostname: String(computed['HostName'] || hostValue),
        port: parseInt(String(computed['Port'] || '22'), 10),
        user: String(computed['User'] || ''),
        identityFile: Array.isArray(computed['IdentityFile'])
          ? computed['IdentityFile'][0]
          : (computed['IdentityFile'] as string | undefined),
        proxyJump: computed['ProxyJump'] as string | undefined,
      })
    }
  }

  return hosts
}
