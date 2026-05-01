import { ReactNode } from 'react'
import { useAppStore } from '../stores/appStore'
import { Settings, Unplug, Cable, Minus, Square, X } from 'lucide-react'

export default function Layout({ children }: { children: ReactNode }) {
  const { page, setPage, disconnectAll, aliases } = useAppStore()
  const activeCount = aliases.filter((a) => a.status === 'connected').length

  return (
    <div className="flex flex-col h-screen select-none">
      {/* Glassmorphism title bar */}
      <header
        className="glass flex items-center justify-between h-12 px-5 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: brand */}
        <div
          className="flex items-center gap-2.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="relative">
            <Cable className="w-4.5 h-4.5 text-accent" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          </div>
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            Quick SSH
          </span>
          {activeCount > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium border border-accent/20">
              {activeCount} active
            </span>
          )}
        </div>

        {/* Right: actions + window controls */}
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {activeCount > 0 && (
            <button
              onClick={disconnectAll}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-destructive
                         hover:bg-destructive/10 rounded-md transition-colors cursor-pointer mr-1"
              title="Disconnect all"
            >
              <Unplug className="w-3 h-3" />
              Disconnect All
            </button>
          )}
          <button
            onClick={() => setPage(page === 'main' ? 'settings' : 'main')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer mr-3 ${
              page === 'settings'
                ? 'bg-accent/15 text-accent'
                : 'text-text-muted hover:text-text-primary hover:bg-white/8'
            }`}
            title={page === 'settings' ? 'Back to tunnels' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Window controls */}
          <div className="flex items-center border-l border-white/10 pl-3 gap-0.5">
            <button
              onClick={() => window.api.windowMinimize()}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => window.api.windowMaximize()}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Maximize"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => window.api.windowClose()}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/15 rounded transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content - transparent so FallingPattern shows through */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
