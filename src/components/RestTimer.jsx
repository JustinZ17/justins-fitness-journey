import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Rest countdown, started when a set is checked off.
 *
 * Deadline-based, not a decrementing counter: browsers throttle timers in
 * background tabs, so counting down by ticks drifts badly exactly when you've
 * put the phone in your pocket between sets. Storing the end timestamp and
 * re-deriving the remainder keeps it honest however long the app was asleep.
 */

const RestTimerContext = createContext(null)

export function useRestTimer() {
  return useContext(RestTimerContext)
}

const DEFAULT_REST = 90

export function RestTimerProvider({ children }) {
  const [state, setState] = useState(null) // { endsAt, total, label }
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!state) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [state])

  const remaining = state ? Math.max(0, Math.ceil((state.endsAt - now) / 1000)) : 0
  const finished = Boolean(state) && remaining === 0

  // Buzz once when it lands. iOS Safari has no Vibration API, so this is a
  // bonus on Android rather than the mechanism — the bar going green is.
  useEffect(() => {
    if (finished && typeof navigator.vibrate === 'function') navigator.vibrate([180, 90, 180])
  }, [finished])

  const start = useCallback((seconds, label) => {
    const total = Number(seconds) > 0 ? Number(seconds) : DEFAULT_REST
    setState({ endsAt: Date.now() + total * 1000, total, label: label ?? '' })
    setNow(Date.now())
  }, [])

  const stop = useCallback(() => setState(null), [])

  const extend = useCallback((seconds) => {
    setState((s) => (s ? { ...s, endsAt: s.endsAt + seconds * 1000, total: s.total + seconds } : s))
  }, [])

  const value = useMemo(
    () => ({ start, stop, extend, remaining, finished, active: Boolean(state), total: state?.total ?? 0, label: state?.label ?? '' }),
    [start, stop, extend, remaining, finished, state]
  )

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function RestTimerBar() {
  const timer = useRestTimer()
  if (!timer?.active) return null

  const { remaining, total, finished, stop, extend, label } = timer
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 100

  return (
    <div className={`rest-bar${finished ? ' done' : ''}`} role="status" aria-live="polite">
      <div className="rest-fill" style={{ width: `${progress}%` }} />
      <div className="rest-content">
        <span className="rest-time">{finished ? 'Go' : mmss(remaining)}</span>
        <span className="rest-label">{finished ? label || 'Rest over' : `Rest${label ? ` · ${label}` : ''}`}</span>
        {!finished && (
          <button type="button" className="rest-btn" onClick={() => extend(30)}>
            +30s
          </button>
        )}
        <button type="button" className="rest-btn primary" onClick={stop}>
          {finished ? 'Done' : 'Skip'}
        </button>
      </div>
    </div>
  )
}
