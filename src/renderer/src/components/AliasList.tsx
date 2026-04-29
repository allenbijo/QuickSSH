import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import AliasCard from './AliasCard'
import AliasEditor from './AliasEditor'
import TerminalView from './TerminalView'
import type { Alias } from '../../../shared/types'
import { Plus, Cable } from 'lucide-react'

export default function AliasList() {
  const { aliases } = useAppStore()
  const [editingAlias, setEditingAlias] = useState<Alias | null | 'new'>(null)
  const [terminalSession, setTerminalSession] = useState<{
    sessionId: string
    sshHost: string
  } | null>(null)

  const handleTerminal = async (sshHost: string) => {
    try {
      const sessionId = await window.api.terminalOpen(sshHost)
      setTerminalSession({ sessionId, sshHost })
    } catch (err) {
      console.error('Failed to open terminal:', err)
    }
  }

  if (aliases.length === 0 && editingAlias === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <Cable className="w-9 h-9 text-text-muted" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2 tracking-tight">
          No tunnels configured
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm leading-relaxed">
          Create an alias to group your SSH port forwards and toggle them with one click.
        </p>
        <button
          onClick={() => setEditingAlias('new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover
                     text-bg-primary text-sm font-medium rounded-lg transition-colors cursor-pointer
                     shadow-[0_4px_20px_rgba(34,197,94,0.25)]"
        >
          <Plus className="w-4 h-4" />
          Create Alias
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-10 pt-10 pb-12">
          {/* Page header */}
          <header className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-semibold text-text-primary tracking-tight leading-none mb-2">
                Tunnels
              </h1>
              <p className="text-sm text-text-secondary">
                {aliases.length} {aliases.length === 1 ? 'alias' : 'aliases'} configured
              </p>
            </div>
            <button
              onClick={() => setEditingAlias('new')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-bg-primary
                         bg-accent hover:bg-accent-hover rounded-lg transition-colors cursor-pointer
                         shadow-[0_4px_20px_rgba(34,197,94,0.25)]"
            >
              <Plus className="w-4 h-4" />
              New Alias
            </button>
          </header>

          {/* Alias cards */}
          <div className="space-y-3.5">
            {aliases.map((alias) => (
              <AliasCard
                key={alias.id}
                alias={alias}
                onEdit={(a) => setEditingAlias(a)}
                onTerminal={handleTerminal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Terminal panel */}
      {terminalSession && (
        <TerminalView
          sessionId={terminalSession.sessionId}
          sshHost={terminalSession.sshHost}
          onClose={() => {
            window.api.terminalClose(terminalSession.sessionId)
            setTerminalSession(null)
          }}
        />
      )}

      {/* Editor modal */}
      {editingAlias !== null && (
        <AliasEditor
          alias={editingAlias === 'new' ? null : editingAlias}
          onClose={() => setEditingAlias(null)}
        />
      )}
    </div>
  )
}
