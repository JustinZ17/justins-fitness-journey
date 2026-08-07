import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './storage/StoreProvider.jsx'
import { Today } from './screens/Today.jsx'
import { History } from './screens/History.jsx'
import { Routines } from './screens/Routines.jsx'
import { SettingsSheet } from './components/SettingsSheet.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { RestTimerProvider, RestTimerBar } from './components/RestTimer.jsx'
import { todayISO } from './lib/date.js'
import { ChartIcon, DumbbellIcon, ListIcon, PawIcon } from './components/Icons.jsx'

const TABS = [
  // Today gets a paw alternate; CSS picks one on the golden theme.
  { id: 'today', label: 'Today', Icon: DumbbellIcon, Alt: PawIcon },
  { id: 'routines', label: 'Routines', Icon: ListIcon },
  { id: 'history', label: 'History', Icon: ChartIcon },
]

function Shell() {
  const { ready, settings } = useStore()
  const [tab, setTab] = useState('today')
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Which day the Today screen is showing. Usually today, but History can send
  // you back to fix a session you logged wrong or forgot to log at all.
  const [viewDate, setViewDate] = useState(() => todayISO())

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
      {tab === 'today' && (
        <Today
          date={viewDate}
          onChangeDate={setViewDate}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {tab === 'routines' && <Routines onOpenSettings={() => setSettingsOpen(true)} />}
      {tab === 'history' && (
        <History
          onOpenSettings={() => setSettingsOpen(true)}
          onEditDate={(date) => {
            setViewDate(date)
            setTab('today')
          }}
        />
      )}

      <RestTimerBar />

      <nav className="tabbar">
        <div className="tabbar-inner" role="tablist">
          {TABS.map(({ id, label, Icon, Alt }) => (
            <button
              key={id}
              type="button"
              className="tab"
              role="tab"
              aria-selected={tab === id}
              onClick={() => {
                // Returning to Today always means today, not whatever past day
                // you were last editing.
                if (id === 'today') setViewDate(todayISO())
                setTab(id)
              }}
            >
              <Icon className={Alt ? 'mark-tick' : undefined} />
              {Alt && <Alt className="mark-paw" />}
              {label}
            </button>
          ))}
        </div>
      </nav>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <RestTimerProvider>
          <Shell />
        </RestTimerProvider>
      </StoreProvider>
    </ErrorBoundary>
  )
}
