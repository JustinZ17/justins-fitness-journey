import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { formatLong, todayISO } from '../lib/date.js'
import { KINDS } from '../storage/schema.js'
import { ExerciseCard } from '../components/ExerciseCard.jsx'
import { ProteinSection } from '../components/ProteinSection.jsx'
import { BodyWeightRow } from '../components/BodyWeightRow.jsx'
import { DayWorkoutPicker } from '../components/DayWorkoutPicker.jsx'
import { AddExerciseSheet } from '../components/AddExerciseSheet.jsx'
import { CatIcon, ChevronIcon, GearIcon, PlusIcon } from '../components/Icons.jsx'

const KIND_ORDER = ['primer', 'main', 'accessory']

/**
 * A shared slot letter means a superset: D1/D2/D3 are performed back to back.
 * Consecutive entries sharing a letter collapse into one bracketed group.
 */
function buildGroups(entries, exercisesById) {
  const groups = []
  for (const entry of entries) {
    const exercise = exercisesById.get(entry.exerciseId)
    if (!exercise) continue
    const letter = exercise.slot ? exercise.slot[0] : null
    const prev = groups[groups.length - 1]
    if (prev && letter && prev.letter === letter && prev.kind === exercise.kind) {
      prev.items.push({ entry, exercise })
    } else {
      groups.push({ letter, kind: exercise.kind || 'main', items: [{ entry, exercise }] })
    }
  }
  return groups
}

export function Today({ onOpenSettings }) {
  const date = todayISO()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const { exercises, sessions, workoutForDate, ensureSession } = useStore()

  const workout = workoutForDate(date)

  // Created as soon as a workout is scheduled so every card has a real id to
  // write against. Sessions with nothing logged are filtered out of History.
  useEffect(() => {
    if (workout) ensureSession(date, workout)
  }, [workout, date, ensureSession])

  const session = useMemo(
    () => (workout ? sessions.find((s) => s.date === date && s.workoutId === workout.id) : null),
    [sessions, date, workout]
  )

  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])

  const groups = useMemo(
    () => (session ? buildGroups(session.completed, exercisesById) : []),
    [session, exercisesById]
  )

  const doneCount = session?.completed.filter((c) => c.done).length ?? 0
  const totalCount = session?.completed.length ?? 0
  const allDone = totalCount > 0 && doneCount === totalCount

  // Section header whenever the kind changes going down the list.
  let lastKind = null

  return (
    <div className="screen">
      <div className="container">
        <header className="page-head">
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow">{formatLong(date)}</p>
            <button type="button" className="title-btn" onClick={() => setPickerOpen(true)}>
              <h1>{workout ? workout.name : 'Rest day'}</h1>
              <ChevronIcon />
            </button>
            {workout?.note && <p className="subtitle">{workout.note}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
            <GearIcon />
          </button>
        </header>

        {workout && session && totalCount > 0 ? (
          <section>
            <div className="section-head">
              <h2>Workout</h2>
              <span className={`count-pill${allDone ? ' complete' : ''}`}>
                {allDone ? 'All done' : `${doneCount} / ${totalCount}`}
              </span>
            </div>

            {groups.map((group, gi) => {
              const showKind = group.kind !== lastKind
              lastKind = group.kind
              const isSuperset = group.items.length > 1

              return (
                <div key={`${group.letter ?? 'g'}-${gi}`}>
                  {showKind && KIND_ORDER.includes(group.kind) && (
                    <p className="kind-head">{KINDS[group.kind]?.label ?? group.kind}</p>
                  )}

                  <div className={`group${isSuperset ? ' superset' : ''}`}>
                    {isSuperset && (
                      <p className="group-label">
                        {group.items.length === 2 ? 'Superset' : 'Tri-set'}
                        <span>back to back, rest after the last</span>
                      </p>
                    )}
                    {group.items.map(({ entry, exercise }) => (
                      <ExerciseCard
                        key={entry.exerciseId}
                        exercise={exercise}
                        entry={entry}
                        session={session}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            <button type="button" className="btn full add-exercise" onClick={() => setAddOpen(true)}>
              <PlusIcon /> Add exercise
            </button>
          </section>
        ) : workout && session ? (
          /* A coach-led day: nothing is planned, so the primary action is to
             record what you're actually doing rather than pick a template. */
          <div className="empty">
            <CatIcon className="empty-cat" />
            <p>
              Nothing planned — log exercises as you go.
            </p>
            <button type="button" className="btn primary" onClick={() => setAddOpen(true)}>
              <PlusIcon /> Add exercise
            </button>
          </div>
        ) : (
          <div className="empty">
            <CatIcon className="empty-cat" />
            <p>Nothing scheduled today.</p>
            <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
              Pick a workout
            </button>
          </div>
        )}

        <ProteinSection date={date} />

        <section className="section">
          <div className="card">
            <BodyWeightRow date={date} />
          </div>
        </section>

        {pickerOpen && <DayWorkoutPicker date={date} onClose={() => setPickerOpen(false)} />}
        {addOpen && session && (
          <AddExerciseSheet session={session} onClose={() => setAddOpen(false)} />
        )}
      </div>
    </div>
  )
}
