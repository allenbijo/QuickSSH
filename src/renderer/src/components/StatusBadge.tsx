import type { AliasStatus } from '../../../shared/types'

const config: Record<AliasStatus, { color: string; label: string; animate?: boolean }> = {
  connected: { color: 'bg-accent', label: 'Connected' },
  disconnected: { color: 'bg-text-muted', label: 'Disconnected' },
  error: { color: 'bg-destructive', label: 'Error' },
  connecting: { color: 'bg-warning', label: 'Connecting', animate: true },
}

export default function StatusBadge({ status }: { status: AliasStatus }) {
  const { color, label, animate } = config[status]

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color} ${animate ? 'animate-pulse-dot' : ''}`} />
      <span className="text-xs text-text-secondary font-medium">{label}</span>
    </div>
  )
}
