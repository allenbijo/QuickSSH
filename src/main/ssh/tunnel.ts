import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import type { PortForward, SSHHost, AliasStatus } from '../../shared/types'

export interface TunnelEvent {
  status: AliasStatus
  error?: string
  forwardId: string
  pid?: number
}

export class SSHTunnel extends EventEmitter {
  private process: ChildProcess | null = null
  private _status: AliasStatus = 'disconnected'
  private stderrBuffer = ''

  constructor(
    public readonly forward: PortForward,
    private host: SSHHost
  ) {
    super()
  }

  get status(): AliasStatus {
    return this._status
  }

  get pid(): number | undefined {
    return this.process?.pid
  }

  async connect(): Promise<void> {
    if (this._status === 'connected' || this._status === 'connecting') return

    this.setStatus('connecting')
    this.stderrBuffer = ''

    const args = [
      '-N',
      '-o', 'ExitOnForwardFailure=yes',
      '-o', 'ServerAliveInterval=15',
      '-o', 'ServerAliveCountMax=3',
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'BatchMode=no',
      '-L', `${this.forward.localPort}:${this.forward.remoteHost}:${this.forward.remotePort}`,
    ]

    if (this.host.port !== 22) args.push('-p', String(this.host.port))
    if (this.host.user) args.push('-l', this.host.user)
    if (this.host.identityFile) args.push('-i', this.host.identityFile)
    if (this.host.proxyJump) args.push('-J', this.host.proxyJump)

    args.push(this.host.hostname)

    this.process = spawn('ssh', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        SSH_ASKPASS_REQUIRE: 'prefer',
      },
      windowsHide: true,
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      this.stderrBuffer += data.toString()
    })

    this.process.on('error', (err) => {
      this.setStatus('error', err.message)
      this.process = null
    })

    this.process.on('exit', (code) => {
      if (this._status === 'disconnected') return
      if (code === 0) {
        this.setStatus('disconnected')
      } else {
        const errMsg = this.stderrBuffer.trim() || `SSH exited with code ${code}`
        this.setStatus('error', errMsg)
      }
      this.process = null
    })

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this._status === 'connecting') {
          this.setStatus('connected')
          resolve()
        }
      }, 2500)

      this.process!.on('exit', (code) => {
        clearTimeout(timeout)
        if (this._status === 'connected') return
        const errMsg = this.stderrBuffer.trim() || `SSH exited with code ${code}`
        reject(new Error(errMsg))
      })

      this.process!.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
  }

  async disconnect(): Promise<void> {
    if (!this.process) {
      this.setStatus('disconnected')
      return
    }

    this.setStatus('disconnected')

    const proc = this.process
    this.process = null

    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        try {
          proc.kill('SIGKILL')
        } catch {
          // already dead
        }
        resolve()
      }, 5000)

      proc.on('exit', () => {
        clearTimeout(timer)
        resolve()
      })

      try {
        proc.kill('SIGTERM')
      } catch {
        clearTimeout(timer)
        resolve()
      }
    })
  }

  isAlive(): boolean {
    if (!this.process || !this.process.pid) return false
    try {
      process.kill(this.process.pid, 0)
      return true
    } catch {
      return false
    }
  }

  private setStatus(status: AliasStatus, error?: string): void {
    this._status = status
    const event: TunnelEvent = {
      status,
      error,
      forwardId: this.forward.id,
      pid: this.process?.pid,
    }
    this.emit('status', event)
  }
}
