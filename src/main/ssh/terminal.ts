import { BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import { IPC } from '../../shared/ipc'

interface TerminalSession {
  process: ChildProcess
  sshHost: string
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>()
  private window: BrowserWindow | null = null

  setWindow(win: BrowserWindow): void {
    this.window = win
  }

  open(sshHost: string): string {
    const sessionId = crypto.randomUUID()

    const proc = spawn('ssh', ['-t', '-t', sshHost], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
      windowsHide: false,
    })

    proc.stdout?.on('data', (data: Buffer) => {
      this.window?.webContents.send(IPC.TERMINAL_DATA_OUT, sessionId, data.toString())
    })

    proc.stderr?.on('data', (data: Buffer) => {
      this.window?.webContents.send(IPC.TERMINAL_DATA_OUT, sessionId, data.toString())
    })

    proc.on('exit', () => {
      this.sessions.delete(sessionId)
      this.window?.webContents.send('terminal:exit', sessionId)
    })

    this.sessions.set(sessionId, { process: proc, sshHost })
    return sessionId
  }

  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId)
    session?.process.stdin?.write(data)
  }

  resize(_sessionId: string, _cols: number, _rows: number): void {
    // resize requires node-pty; with plain child_process we skip this
  }

  close(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      try {
        session.process.kill('SIGTERM')
      } catch {
        // already dead
      }
      this.sessions.delete(sessionId)
    }
  }

  closeAll(): void {
    for (const [id] of this.sessions) {
      this.close(id)
    }
  }
}
