import { useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { FolderOpen, Server, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const { settings, hosts, updateSettings, loadHosts } = useAppStore()
  const [configPath, setConfigPath] = useState(settings.sshConfigPath)
  const [defaultPort, setDefaultPort] = useState(settings.defaultLocalPortStart)
  const [refreshing, setRefreshing] = useState(false)

  const handleBrowse = async () => {
    const path = await window.api.openFileDialog()
    if (path) {
      setConfigPath(path)
      await updateSettings({ sshConfigPath: path })
    }
  }

  const handleSaveSettings = async () => {
    await updateSettings({
      sshConfigPath: configPath,
      defaultLocalPortStart: defaultPort,
    })
  }

  const handleRefreshHosts = async () => {
    setRefreshing(true)
    await loadHosts()
    setRefreshing(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-10 pt-10 pb-12 space-y-10">
      <header>
        <h1 className="text-[22px] font-semibold text-text-primary tracking-tight leading-none mb-2">
          Settings
        </h1>
        <p className="text-sm text-text-secondary">
          Configure SSH config path and default port settings.
        </p>
      </header>

      {/* SSH Config Path */}
      <section>
        <h3 className="text-sm font-medium text-text-primary mb-3">SSH Config File</h3>
        <div className="flex gap-2.5">
          <input
            type="text"
            value={configPath}
            onChange={(e) => setConfigPath(e.target.value)}
            placeholder="~/.ssh/config (auto-detected)"
            className="flex-1 px-3.5 py-2.5 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg
                       text-sm font-mono text-text-primary placeholder:text-text-muted
                       focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25
                       transition-colors"
          />
          <button
            onClick={handleBrowse}
            className="px-3.5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg
                       text-sm text-text-secondary hover:text-text-primary hover:bg-white/10 hover:border-white/20
                       transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FolderOpen className="w-4 h-4" />
            Browse
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2.5">
          Leave empty to auto-detect from ~/.ssh/config
        </p>
      </section>

      {/* Default Local Port */}
      <section>
        <h3 className="text-sm font-medium text-text-primary mb-3">Default Local Port Start</h3>
        <input
          type="number"
          value={defaultPort}
          onChange={(e) => setDefaultPort(parseInt(e.target.value) || 9000)}
          className="w-40 px-3.5 py-2.5 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg
                     text-sm font-mono text-text-primary
                     focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25
                     transition-colors"
        />
        <p className="text-xs text-text-muted mt-2.5">
          New port forwards will start from this port number.
        </p>
      </section>

      {/* Save button */}
      <div className="pt-2">
        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary
                     text-sm font-medium rounded-lg transition-colors cursor-pointer
                     shadow-[0_4px_20px_rgba(34,197,94,0.25)]"
        >
          Save Settings
        </button>
      </div>

      {/* Detected Hosts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">
            Detected SSH Hosts
          </h3>
          <button
            onClick={handleRefreshHosts}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-text-secondary
                       hover:text-accent transition-colors cursor-pointer disabled:opacity-50
                       px-2.5 py-1.5 rounded-md hover:bg-white/5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {hosts.length === 0 ? (
          <div className="py-10 text-center text-sm text-text-muted border border-white/10 rounded-xl bg-white/5 backdrop-blur-md">
            No hosts found. Check your SSH config path.
          </div>
        ) : (
          <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Host
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Hostname
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-text-muted uppercase tracking-wider">
                    Port
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-medium text-text-muted uppercase tracking-wider">
                    User
                  </th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((host) => (
                  <tr
                    key={host.name}
                    className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary">
                      <div className="flex items-center gap-2.5">
                        <Server className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        {host.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-secondary text-xs">
                      {host.hostname}
                    </td>
                    <td className="px-4 py-3 font-mono text-text-secondary text-xs">
                      {host.port}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {host.user || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
