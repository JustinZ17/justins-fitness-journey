import { useMemo, useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { DAYS, DAY_LABELS, KINDS } from '../storage/schema.js'
import { ExerciseEditor } from '../components/ExerciseEditor.jsx'
import { WorkoutEditor } from '../components/WorkoutEditor.jsx'
import { GearIcon, PlusIcon } from '../components/Icons.jsx'

const KIND_ORDER = ['primer', 'main', 'accessory']

export function Routines({ onOpenSettings }) {
  const { exercises, workouts, settings, setScheduleDay } = useStore()
  const [editingExercise, setEditingExercise] = useState(null)
  const [editingWorkout, setEditingWorkout] = useState(null)

  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])

  const grouped = useMemo(() => {
    const buckets = new Map(KIND_ORDER.map((k) => [k, []]))
    for (const e of exercises) {
      const key = buckets.has(e.kind) ? e.kind : 'main'
      buckets.get(key).push(e)
    }
    for (const list of buckets.values()) {
      list.sort((a, b) => (a.slot || 'zz').localeCompare(b.slot || 'zz') || a.name.localeCompare(b.name))
    }
    return buckets
  }, [exercises])

  return (
    <div className="screen">
      <div className="container">
        <header className="page-head">
          <div>
            <p className="eyebrow">Your program</p>
            <div className="title-btn" style={{ cursor: 'default' }}>
              <h1>Routines</h1>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
            <GearIcon />
          </button>
        </header>

        {/* Week first: it's the thing that changes what Today shows. */}
        <section>
          <div className="section-head">
            <h2>Your week</h2>
          </div>
          <div className="card week">
            {DAYS.map((day) => (
              <div className="week-row" key={day}>
                <span className="week-day">{DAY_LABELS[day]}</span>
                <select
                  className="input week-select"
                  value={settings.schedule?.[day] ?? ''}
                  aria-label={`Workout for ${DAY_LABELS[day]}`}
                  onChange={(e) => setScheduleDay(day, e.target.value || null)}
                >
                  <option value="">Rest day</option>
                  {workouts.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Workouts</h2>
            <button type="button" className="link-btn" onClick={() => setEditingWorkout({})}>
              + New
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="empty"><p style={{ marginBottom: 0 }}>No workouts yet.</p></div>
          ) : (
            workouts.map((w) => {
              const days = DAYS.filter((d) => settings.schedule?.[d] === w.id)
              return (
                <button key={w.id} type="button" className="card row-item" onClick={() => setEditingWorkout(w)}>
                  <span className="row-body">
                    <strong>{w.name}</strong>
                    <small>
                      {w.exerciseIds.length} exercise{w.exerciseIds.length === 1 ? '' : 's'}
                      {days.length > 0 && ` · ${days.map((d) => DAY_LABELS[d]).join(', ')}`}
                    </small>
                  </span>
                  <span className="row-chev" aria-hidden>›</span>
                </button>
              )
            })
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <h2>Exercises</h2>
            <button type="button" className="link-btn" onClick={() => setEditingExercise({})}>
              + New
            </button>
          </div>

          {KIND_ORDER.map((kind) => {
            const list = grouped.get(kind) ?? []
            if (!list.length) return null
            return (
              <div key={kind}>
                <p className="kind-head">{KINDS[kind].label}</p>
                {list.map((e) => (
                  <button key={e.id} type="button" className="card row-item" onClick={() => setEditingExercise(e)}>
                    <span className="row-body">
                      <strong>
                        {e.slot && <span className="slot">{e.slot}</span>} {e.name}
                      </strong>
                      <small>
                        {e.targetSets > 0 ? `${e.targetSets}×${e.targetReps}` : 'warm-up'}
                        {` · +${e.increment} ${settings.unit} steps`}
                        {e.tempo ? ` · tempo ${e.tempo}` : ''}
                        {e.restSeconds ? ` · ${e.restSeconds}s rest` : ''}
                      </small>
                    </span>
                    <span className="row-chev" aria-hidden>›</span>
                  </button>
                ))}
              </div>
            )
          })}
        </section>

        {editingExercise && (
          <ExerciseEditor
            exercise={editingExercise.id ? editingExercise : null}
            onClose={() => setEditingExercise(null)}
          />
        )}
        {editingWorkout && (
          <WorkoutEditor
            workout={editingWorkout.id ? editingWorkout : null}
            onClose={() => setEditingWorkout(null)}
          />
        )}
      </div>
    </div>
  )
}
