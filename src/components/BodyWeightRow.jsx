import { useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'

/** Collapsed to a single line until tapped — it's a once-a-week action. */
export function BodyWeightRow({ date }) {
  const { bodyWeights, settings, setBodyWeight } = useStore()
  const todayEntry = bodyWeights.find((b) => b.date === date)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(String(todayEntry?.weight ?? ''))

  const save = () => {
    const n = Number(value)
    if (n > 0) setBodyWeight(n, date)
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" className="bw-row" onClick={() => setOpen(true)}>
        <span className="muted">Body weight</span>
        <span className="bw-value">
          {todayEntry ? `${todayEntry.weight} ${settings.unit}` : 'Log weigh-in'}
        </span>
      </button>
    )
  }

  return (
    <div className="bw-row">
      <span className="muted">Body weight</span>
      <input
        className="input"
        style={{ flex: 1, maxWidth: 110 }}
        inputMode="decimal"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <button type="button" className="btn primary" style={{ minHeight: 44, padding: '0 16px' }} onClick={save}>
        Save
      </button>
    </div>
  )
}
