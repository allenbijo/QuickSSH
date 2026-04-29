import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import Layout from './components/Layout'
import AliasList from './components/AliasList'
import SettingsPage from './components/SettingsPage'
import { FallingPattern } from './components/ui/falling-pattern'

export default function App() {
  const { page, aliases, loadAliases, loadHosts, loadSettings, updateAliasFromMain } = useAppStore()
  const hasActive = aliases.some((a) => a.status === 'connected' || a.status === 'connecting')

  useEffect(() => {
    loadAliases()
    loadHosts()
    loadSettings()
  }, [loadAliases, loadHosts, loadSettings])

  useEffect(() => {
    const unsub = window.api.onAliasUpdated((alias) => {
      updateAliasFromMain(alias as ReturnType<typeof useAppStore.getState>['aliases'][0])
    })
    return unsub
  }, [updateAliasFromMain])

  return (
    <div
      className="relative h-screen overflow-hidden"
      style={{ borderRadius: '12px' }}
    >
      {/* Ambient animated background — only when a tunnel is active */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-700 ${hasActive ? 'opacity-70' : 'opacity-0'}`}
      >
        {hasActive && (
          <FallingPattern
            color="rgba(255, 255, 255, 0.5)"
            backgroundColor="rgba(7, 11, 20, 0.55)"
            duration={140}
            blurIntensity="0.6em"
            density={1.2}
            className="h-full"
          />
        )}
      </div>

      {/* Idle background — solid dark when no active tunnels */}
      {!hasActive && (
        <div
          className="absolute inset-0 z-0"
          style={{ background: 'rgba(7, 11, 20, 0.92)' }}
        />
      )}

      {/* Strong vignette — calm center, rain visible at edges */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(7, 11, 20, 0.55) 0%, rgba(7, 11, 20, 0.25) 60%, transparent 100%)',
          borderRadius: '12px',
        }}
      />

      {/* Top accent glow */}
      <div
        className="absolute inset-x-0 top-0 h-48 z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(34, 197, 94, 0.10), transparent 70%)',
        }}
      />

      {/* App content on top */}
      <div className="relative z-10 h-full">
        <Layout>
          {page === 'main' ? <AliasList /> : <SettingsPage />}
        </Layout>
      </div>
    </div>
  )
}
