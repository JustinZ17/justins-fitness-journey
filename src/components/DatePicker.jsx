import { Sheet } from './Sheet.jsx'
import { addDays, formatLong, todayISO } from '../lib/date.js'

/**
 * Jump the Today screen to another day.
 *
 * Uses a native date input — on iOS that's the system wheel, which is far
 * better than anything hand-rolled and needs no code. Future dates are barred:
 * this exists to backfill a session you forgot, not to pre-log one.
 */
export function DatePicker({ date, onPick, onClose }) {
  const today = todayISO()

  const quick = [
    { label: 'Today', value: today },
    { label: 'Yesterday', value: addDays(today, -1) },
    { label: '2 days ago', value: addDays(today, -2) },
    { label: '3 days ago', value: addDays(today, -3) },
  ]

  return (
    <Sheet title="Which day?" onClose={onClose}>
      <div className="picker-list">
        {quick.map((q) => (
          <button
            key={q.value}
            type="button"
            className={`picker-item${date === q.value ? ' selected' : ''}`}
            onClick={() => {
              onPick(q.value)
              onClose()
            }}
          >
            <span>
              <strong>{q.label}</strong>
              <small>{formatLong(q.value)}</small>
            </span>
            {date === q.value && <span aria-hidden>✓</span>}
          </button>
        ))}
      </div>

      <div className="divider">or pick a date</div>

      <input
        className="input"
        type="date"
        value={date}
        max={today}
        onChange={(e) => {
          if (!e.target.value) return
          onPick(e.target.value)
          onClose()
        }}
      />
      <p className="hint" style={{ marginTop: 'var(--sp-2)' }}>
        Past days only — logging a workout you haven't done yet would poison the
        weight suggestions.
      </p>
    </Sheet>
  )
}
