import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './storage/StoreProvider.jsx'
import { Today } from './screens/Today.jsx'
import { SettingsSheet } from './components/SettingsSheet.jsx'
import { ChartIcon, DumbbellIcon, GearIcon, ListIcon } from './components/Icons.jsx'

const TABS = [
  { id: 'today', label: 'Today', Icon: DumbbellIcon },
  { id: 'routines', label: 'Routines', Icon: ListIcon },
  { id: 'history', label: 'History', Icon: ChartIcon },
]

function Shell() {
  const { ready, settings } = useStore()
  const [tab, setTab] = useState('today')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const theme = settings.theme || 'midnight'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // Keep the iOS status bar in step with the theme, or a light theme launches
    // with a black bar above it in standalone mode.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const token = getComputedStyle(document.documentElement).getPropertyValue('--theme-color')
      if (token.trim()) meta.setAttribute('content', token.trim())
    }
  }, [theme])

  // Hydration is one synchronous localStorage read behind an async API, so this
  // frame is effectively invisible — it just stops children rendering on empty state.
  if (!ready) return <div className="screen" />

  return (
    <div className="app">
      {tab === 'today' && <Today onOpenSettings={() => setSettingsOpen(true)} />}
      {tab === 'routines' && (
        <Placeholder title="Routines" onOpenSettings={() => setSettingsOpen(true)} />
      )}
      {tab === 'history' && (
        <Placeholder title="History" onOpenSettings={() => setSettingsOpen(true)} />
      )}

      <nav className="tabbar">
        <div className="tabbar-inner" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className="tab"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function Placeholder({ title, onOpenSettings }) {
  return (
    <div className="screen">
      <div className="container">
        <header className="page-head">
          <div>
            <p className="eyebrow">Coming next</p>
            <div className="title-btn" style={{ pointerEvents: 'none' }}>
              <h1>{title}</h1>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
            <GearIcon />
          </button>
        </header>
        <div className="empty">
          <p>Not built yet — Today first.</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
