import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/appStore'
import type { Alias, PortForward } from '../../../shared/types'
import { Plus, X, Minus } from 'lucide-react'
import Select from './ui/Select'

interface Props {
  alias: Alias | null
  onClose: () => void
}

function createEmptyForward(defaultPort: number): PortForward {
  return {
    id: crypto.randomUUID(),
    localPort: defaultPort,
    remoteHost: 'localhost',
    remotePort: 5432,
    sshHost: '',
  }
}

export default function AliasEditor({ alias, onClose }: Props) {
  const { hosts, settings, saveAlias } = useAppStore()

  const [name, setName] = useState('')
  const [forwards, setForwards] = useState<PortForward[]>([])

  useEffect(() => {
    if (alias) {
      setName(alias.name)
      setForwards([...alias.forwards])
    } else {
      setName('')
      setForwards([createEmptyForward(settings.defaultLocalPortStart)])
    }
  }, [alias, settings.defaultLocalPortStart])

  const addForward = () => {
    const lastPort = forwards.length > 0
      ? forwards[forwards.length - 1].localPort + 1
      : settings.defaultLocalPortStart
    setForwards([...forwards, createEmptyForward(lastPort)])
  }

  const removeForward = (id: string) => {
    setForwards(forwards.filter((f) => f.id !== id))
  }

  const updateForward = (id: string, field: keyof PortForward, value: string | number) => {
    setForwards(
      forwards.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    )
  }

  const handleSave = async () => {
    if (!name.trim() || forwards.length === 0) return

    const isValidPort = (p: number) => Number.isInteger(p) && p >= 1 && p <= 65535
    const validForwards = forwards.filter(
      (f) => f.sshHost && isValidPort(f.localPort) && isValidPort(f.remotePort) && f.remoteHost.trim()
    )
    if (validForwards.length === 0) return

    const aliasData: Alias = {
      id: alias?.id || crypto.randomUUID(),
      name: name.trim(),
      forwards: validForwards,
      enabled: alias?.enabled || false,
      status: alias?.status || 'disconnected',
    }

    await saveAlias(aliasData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">
            {alias ? 'Edit Alias' : 'New Alias'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-md
                       hover:bg-bg-elevated transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Alias name */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Alias Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production DB"
              className="w-full px-3 py-2 bg-bg-primary border border-border-subtle rounded-lg
                         text-sm text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25
                         transition-colors"
            />
          </div>

          {/* Port Forwards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-secondary">
                Port Forwards
              </label>
              <button
                onClick={addForward}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover
                           transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="space-y-2.5">
              {forwards.map((fwd) => (
                <div
                  key={fwd.id}
                  className="flex items-start gap-2 p-3 rounded-lg bg-bg-primary border border-border-subtle"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {/* Local port */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">
                        Local Port
                      </label>
                      <input
                        type="number"
                        value={fwd.localPort}
                        onChange={(e) =>
                          updateForward(fwd.id, 'localPort', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 bg-bg-surface border border-border-subtle rounded-md
                                   text-sm font-mono text-text-primary
                                   focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>

                    {/* Remote port */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">
                        Remote Port
                      </label>
                      <input
                        type="number"
                        value={fwd.remotePort}
                        onChange={(e) =>
                          updateForward(fwd.id, 'remotePort', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 bg-bg-surface border border-border-subtle rounded-md
                                   text-sm font-mono text-text-primary
                                   focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>

                    {/* Remote host */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">
                        Remote Host
                      </label>
                      <input
                        type="text"
                        value={fwd.remoteHost}
                        onChange={(e) => updateForward(fwd.id, 'remoteHost', e.target.value)}
                        placeholder="localhost"
                        className="w-full px-2.5 py-1.5 bg-bg-surface border border-border-subtle rounded-md
                                   text-sm font-mono text-text-primary placeholder:text-text-muted
                                   focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>

                    {/* SSH Host */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-text-muted mb-1">
                        SSH Host
                      </label>
                      <Select
                        value={fwd.sshHost}
                        onChange={(v) => updateForward(fwd.id, 'sshHost', v)}
                        placeholder="Select host…"
                        options={hosts.map((h) => ({ value: h.name, label: h.name }))}
                      />
                    </div>
                  </div>

                  {/* Remove button */}
                  {forwards.length > 1 && (
                    <button
                      onClick={() => removeForward(fwd.id)}
                      className="mt-5 p-1 text-text-muted hover:text-destructive rounded
                                 hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary
                       hover:text-text-primary hover:bg-bg-elevated rounded-lg
                       transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || forwards.length === 0}
            className="px-4 py-2 text-sm font-medium text-bg-primary bg-accent
                       hover:bg-accent-hover rounded-lg transition-colors cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {alias ? 'Save Changes' : 'Create Alias'}
          </button>
        </div>
      </div>
    </div>
  )
}
