import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import type { Alias } from '../../../shared/types'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  RefreshCw,
  Terminal,
  ArrowRight,
} from 'lucide-react'

interface Props {
  alias: Alias
  onEdit: (alias: Alias) => void
  onTerminal: (sshHost: string) => void
}

const statusConfig = {
  connected: {
    accent: 'bg-accent',
    label: 'Connected',
    dotClass: 'bg-accent shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    cardGlow: 'shadow-[0_0_24px_rgba(34,197,94,0.12)]',
  },
  connecting: {
    accent: 'bg-warning',
    label: 'Connecting',
    dotClass: 'bg-warning animate-pulse-dot',
    cardGlow: '',
  },
  error: {
    accent: 'bg-destructive',
    label: 'Error',
    dotClass: 'bg-destructive',
    cardGlow: '',
  },
  disconnected: {
    accent: 'bg-white/15',
    label: 'Disconnected',
    dotClass: 'bg-text-muted',
    cardGlow: '',
  },
} as const

export default function AliasCard({ alias, onEdit, onTerminal }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { toggleAlias, refreshAlias, deleteAlias } = useAppStore()
  const isActive = alias.status === 'connected' || alias.status === 'connecting'
  const status = statusConfig[alias.status]

  return (
    <div
      className={`group relative rounded-xl border border-white/8 bg-[rgba(18,18,18,0.6)] backdrop-blur-2xl
                  transition-all duration-200 overflow-hidden
                  hover:border-white/15 hover:bg-[rgba(24,24,24,0.7)]
                  ${status.cardGlow}`}
    >
      {/* Status accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${status.accent}`} />

      {/* Main row */}
      <div className="flex items-stretch pl-5 pr-2">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center px-2 -ml-2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Name + meta */}
        <div className="flex-1 min-w-0 py-3.5 pl-3 pr-4">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="font-semibold text-[14px] text-text-primary truncate">
              {alias.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
            <span className="text-text-secondary font-medium">{status.label}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-muted">
              {alias.forwards.length} forward{alias.forwards.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-0.5 py-3.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {isActive && (
            <button
              onClick={() => refreshAlias(alias.id)}
              className="p-2 text-text-muted hover:text-accent rounded-md
                         hover:bg-white/8 transition-colors cursor-pointer"
              title="Reconnect"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {alias.forwards.length > 0 && (
            <button
              onClick={() => onTerminal(alias.forwards[0].sshHost)}
              className="p-2 text-text-muted hover:text-text-primary rounded-md
                         hover:bg-white/8 transition-colors cursor-pointer"
              title="Open terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(alias)}
            className="p-2 text-text-muted hover:text-text-primary rounded-md
                       hover:bg-white/8 transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => deleteAlias(alias.id)}
            className="p-2 text-text-muted hover:text-destructive rounded-md
                       hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px bg-white/8 my-3 mx-2" />

        {/* Toggle switch */}
        <div className="flex items-center px-3">
          <div
            className={`toggle-switch ${isActive ? 'active' : ''}`}
            onClick={() => toggleAlias(alias.id)}
            role="switch"
            aria-checked={isActive}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleAlias(alias.id)
              }
            }}
          >
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      {/* Expanded forwards list */}
      {expanded && alias.forwards.length > 0 && (
        <div className="border-t border-white/8 bg-black/15 px-5 py-2.5 space-y-1.5">
          {alias.forwards.map((fwd) => (
            <div
              key={fwd.id}
              className="flex items-center gap-3 text-xs py-1.5 px-3 rounded-md bg-white/4 border border-white/5"
            >
              <span className="font-mono text-accent font-semibold">
                :{fwd.localPort}
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted" />
              <span className="font-mono text-text-secondary">
                {fwd.remoteHost}:{fwd.remotePort}
              </span>
              <span className="text-text-muted ml-auto">via</span>
              <span className="font-medium text-text-secondary">{fwd.sshHost}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
