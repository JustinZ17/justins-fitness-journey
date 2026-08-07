import { Sheet } from './Sheet.jsx'
import { useStore } from '../storage/StoreProvider.jsx'
import { dayKey, isoToDate } from '../lib/date.js'

/**
 * Assign a workout to a weekday.
 *
 * The schedule is keyed by weekday, so this changes every future Thursday too —
 * the copy says so rather than pretending it's a one-day override.
 */
export function DayWorkoutPicker({ date, onClose }) {
  const { workouts, settings, setScheduleDay } = useStore()
  const day = dayKey(date)
  const current = settings.schedule?.[day] ?? null
  const weekday = isoToDate(date).toLocaleDateString(undefined, { weekday: 'long' })

  const choose = (workoutId) => {
    setScheduleDay(day, workoutId)
    onClose()
  }

  return (
    <Sheet title={`${weekday}s`} onClose={onClose}>
      <p className="hint">Applies to every {weekday}, not just today.</p>

      <div className="picker-list">
        {workouts.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`picker-item${current === w.id ? ' selected' : ''}`}
            onClick={() => choose(w.id)}
          >
            <span>
              <strong>{w.name}</strong>
              <small>{w.exerciseIds.length} exercises</small>
            </span>
            {current === w.id && <span aria-hidden>✓</span>}
          </button>
        ))}

        <button
          type="button"
          className={`picker-item${current === null ? ' selected' : ''}`}
          onClick={() => choose(null)}
        >
          <span>
            <strong>Rest day</strong>
            <small>No workout scheduled</small>
          </span>
          {current === null && <span aria-hidden>✓</span>}
        </button>
      </div>
    </Sheet>
  )
}
