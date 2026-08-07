import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { formatLong, todayISO } from '../lib/date.js'
import { ExerciseCard } from '../components/ExerciseCard.jsx'
import { ProteinSection } from '../components/ProteinSection.jsx'
import { BodyWeightRow } from '../components/BodyWeightRow.jsx'
import { DayWorkoutPicker } from '../components/DayWorkoutPicker.jsx'
import { ChevronIcon, GearIcon } from '../components/Icons.jsx'

export function Today({ onOpenSettings }) {
  const date = todayISO()
  const [pickerOpen, setPickerOpen] = useState(false)
  const { exercises, sessions, workoutForDate, ensureSession } = useStore()

  const workout = workoutForDate(date)

  // Create today's session as soon as there's a workout scheduled, so every
  // card has a real id to write against. Sessions with nothing logged are
  // filtered out of History, so an unused one costs nothing.
  useEffect(() => {
    if (workout) ensureSession(date, workout)
  }, [workout, date, ensureSession])

  const session = useMemo(
    () => (workout ? sessions.find((s) => s.date === date && s.workoutId === workout.id) : null),
    [sessions, date, workout]
  )

  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const doneCount = session?.completed.filter((c) => c.done).length ?? 0
  const totalCount = session?.completed.length ?? 0

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          {/* Tappable so the day's workout can be changed without waiting for
              the Routines screen — including undoing it back to a rest day. */}
          <button type="button" className="title-btn" onClick={() => setPickerOpen(true)}>
            <h1>{workout ? workout.name : 'Rest day'}</h1>
            <ChevronIcon />
          </button>
          <p className="date">{formatLong(date)}</p>
        </div>
        <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
          <GearIcon />
        </button>
      </header>

      {workout && session ? (
        <section>
          <div className="section-head">
            <h2>Workout</h2>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
              {doneCount} / {totalCount} done
            </span>
          </div>

          {session.completed.map((entry) => {
            const exercise = exercisesById.get(entry.exerciseId)
            if (!exercise) return null
            return (
              <ExerciseCard
                key={entry.exerciseId}
                exercise={exercise}
                entry={entry}
                session={session}
              />
            )
          })}
        </section>
      ) : (
        <div className="empty">
          <p style={{ marginTop: 0 }}>Nothing scheduled today.</p>
          <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
            Pick a workout
          </button>
        </div>
      )}

      <ProteinSection date={date} />

      <section className="section">
        <BodyWeightRow date={date} />
      </section>

      {pickerOpen && <DayWorkoutPicker date={date} onClose={() => setPickerOpen(false)} />}
    </div>
  )
}
