import { useState } from 'react'
import { StoreProvider, useStore } from './storage/StoreProvider.jsx'
import { Today } from './screens/Today.jsx'
import { SettingsSheet } from './components/SettingsSheet.jsx'
import { ChartIcon, DumbbellIcon, ListIcon } from './components/Icons.jsx'

const TABS = [
  { id: 'today', label: 'Today', Icon: DumbbellIcon },
  { id: 'routines', label: 'Routines', Icon: ListIcon },
  { id: 'history', label: 'History', Icon: ChartIcon },
]

function Shell() {
  const { ready } = useStore()
  const [tab, setTab] = useState('today')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Hydration is a single synchronous localStorage read behind an async API —
  // this frame is effectively invisible, but it keeps children from rendering
  // against empty state.
  if (!ready) return <div className="screen" />

  return (
    <div className="app">
      {tab === 'today' && (
        <Today
          onOpenSettings={() => setSettingsOpen(true)}
          onGoToRoutines={() => setTab('routines')}
        />
      )}
      {tab === 'routines' && <Placeholder title="Routines" onOpenSettings={() => setSettingsOpen(true)} />}
      {tab === 'history' && <Placeholder title="History" onOpenSettings={() => setSettingsOpen(true)} />}

      <nav className="tabbar" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function Placeholder({ title, onOpenSettings }) {
  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="date">Coming next</p>
        </div>
        <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
          ⚙
        </button>
      </header>
      <div className="empty">Not built yet — Today first.</div>
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
