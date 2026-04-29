import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { X, Terminal as TerminalIcon } from 'lucide-react'

interface Props {
  sessionId: string
  sshHost: string
  onClose: () => void
}

export default function TerminalView({ sessionId, sshHost, onClose }: Props) {
  const termRef = useRef<HTMLDivElement>(null)
  const termInstance = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!termRef.current) return

    const term = new Terminal({
      theme: {
        background: '#0F172A',
        foreground: '#F8FAFC',
        cursor: '#22C55E',
        cursorAccent: '#0F172A',
        selectionBackground: '#334155',
        black: '#1E293B',
        red: '#EF4444',
        green: '#22C55E',
        yellow: '#EAB308',
        blue: '#3B82F6',
        magenta: '#A855F7',
        cyan: '#06B6D4',
        white: '#F8FAFC',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 1000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(termRef.current)

    requestAnimationFrame(() => fitAddon.fit())

    term.onData((data) => {
      window.api.terminalWrite(sessionId, data)
    })

    const unsubData = window.api.onTerminalData((sid, data) => {
      if (sid === sessionId) term.write(data)
    })

    const unsubExit = window.api.onTerminalExit((sid) => {
      if (sid === sessionId) {
        term.writeln('\r\n\x1b[90m--- Session ended ---\x1b[0m')
      }
    })

    const observer = new ResizeObserver(() => {
      fitAddon.fit()
      window.api.terminalResize(sessionId, term.cols, term.rows)
    })
    observer.observe(termRef.current)

    termInstance.current = term

    return () => {
      observer.disconnect()
      unsubData()
      unsubExit()
      term.dispose()
    }
  }, [sessionId])

  return (
    <div className="border-t border-border-default bg-bg-primary">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-surface border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-medium text-text-secondary">
            {sshHost}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary rounded
                     hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Terminal body */}
      <div ref={termRef} className="h-64" />
    </div>
  )
}
