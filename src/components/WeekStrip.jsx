import { useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { DAYS, DAY_LABELS, DAY_NAMES } from '../storage/schema.js'
import { Sheet } from './Sheet.jsx'

/**
 * The training week as seven chips instead of seven dropdowns.
 *
 * The dropdown version stood 448px tall — over half a phone screen — so the
 * exercise list below it started off the bottom of the page and read as
 * missing. The week is set once and rarely touched; it doesn't deserve that
 * much room. Which workout falls on which day is still spelled out on each
 * workout row underneath, so nothing is lost by shrinking this to an editor.
 */
export function WeekStrip() {
  const { workouts, settings, setScheduleDay } = useStore()
  const [editingDay, setEditingDay] = useState(null)

  const workoutFor = (day) => workouts.find((w) => w.id === settings.schedule?.[day]) ?? null
  const trainingDays = DAYS.filter((d) => settings.schedule?.[d])

  return (
    <>
      <div className="card week-strip">
        <div className="week-chips">
          {DAYS.map((day) => {
            const workout = workoutFor(day)
            return (
              <button
                key={day}
                type="button"
                className={`week-chip${workout ? ' on' : ''}`}
                aria-label={`${DAY_LABELS[day]}: ${workout ? workout.name : 'rest day'}`}
                onClick={() => setEditingDay(day)}
              >
                <span className="week-chip-day">{DAY_LABELS[day].slice(0, 1)}</span>
                <span className="week-chip-mark" aria-hidden />
              </button>
            )
          })}
        </div>

        <p className="week-summary">
          {trainingDays.length === 0 ? (
            'No training days set — tap a day to assign a workout.'
          ) : (
            // Grouped by workout, so a routine used twice a week reads
            // "Tue, Thu Trainer session" rather than being listed twice.
            <>
              {[...new Set(trainingDays.map((d) => settings.schedule[d]))].map((id, i) => {
                const days = trainingDays.filter((d) => settings.schedule[d] === id)
                return (
                  <span key={id}>
                    {i > 0 && ' · '}
                    <b>{days.map((d) => DAY_LABELS[d]).join(', ')}</b>{' '}
                    {workouts.find((w) => w.id === id)?.name}
                  </span>
                )
              })}
            </>
          )}
        </p>
      </div>

      {editingDay && (
        <DayPicker
          day={editingDay}
          workouts={workouts}
          current={settings.schedule?.[editingDay] ?? null}
          onPick={(id) => {
            setScheduleDay(editingDay, id)
            setEditingDay(null)
          }}
          onClose={() => setEditingDay(null)}
        />
      )}
    </>
  )
}

function DayPicker({ day, workouts, current, onPick, onClose }) {
  return (
    <Sheet title={`${DAY_NAMES[day]}s`} onClose={onClose}>
      <p className="hint">Applies to every {DAY_NAMES[day]}.</p>
      <div className="picker-list">
        {workouts.map((w) => (
          <button
            key={w.id}
            type="button"
            className={`picker-item${current === w.id ? ' selected' : ''}`}
            onClick={() => onPick(w.id)}
          >
            <span>
              <strong>{w.name}</strong>
              <small>
                {w.exerciseIds.length} exercise{w.exerciseIds.length === 1 ? '' : 's'}
              </small>
            </span>
            {current === w.id && <span aria-hidden>✓</span>}
          </button>
        ))}
        <button
          type="button"
          className={`picker-item${current === null ? ' selected' : ''}`}
          onClick={() => onPick(null)}
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
