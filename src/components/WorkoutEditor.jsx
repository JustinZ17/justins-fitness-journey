import { useMemo, useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { useStore } from '../storage/StoreProvider.jsx'
import { PlusIcon, TrashIcon } from './Icons.jsx'

/** Build a workout: name, note, and an ordered list of exercises. */
export function WorkoutEditor({ workout, onClose }) {
  const { exercises, saveWorkout, removeWorkout } = useStore()
  const isNew = !workout?.id

  const [name, setName] = useState(workout?.name ?? '')
  const [note, setNote] = useState(workout?.note ?? '')
  const [ids, setIds] = useState(workout?.exerciseIds ?? [])
  const [adding, setAdding] = useState(false)

  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const available = exercises.filter((e) => !ids.includes(e.id))

  const move = (index, delta) => {
    const next = [...ids]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setIds(next)
  }

  const save = () => {
    saveWorkout({ ...(workout ?? {}), name: name.trim(), note: note.trim(), exerciseIds: ids })
    onClose()
  }

  const del = () => {
    if (!window.confirm(`Delete "${workout.name}"?\n\nAny day scheduled to it becomes a rest day. Logged sessions are kept.`)) return
    removeWorkout(workout.id)
    onClose()
  }

  if (adding) {
    return (
      <Sheet title="Add to workout" onClose={() => setAdding(false)}>
        {available.length === 0 ? (
          <p className="hint">Every exercise is already in this workout.</p>
        ) : (
          <div className="picker-list">
            {available.map((e) => (
              <button
                key={e.id}
                type="button"
                className="picker-item"
                onClick={() => {
                  setIds([...ids, e.id])
                  setAdding(false)
                }}
              >
                <span>
                  <strong>{e.name}</strong>
                  <small>
                    {e.slot ? `${e.slot} · ` : ''}
                    {e.targetSets > 0 ? `${e.targetSets}×${e.targetReps}` : 'warm-up'}
                  </small>
                </span>
                <PlusIcon />
              </button>
            ))}
          </div>
        )}
        <button type="button" className="btn full" style={{ marginTop: 'var(--sp-4)' }} onClick={() => setAdding(false)}>
          Back
        </button>
      </Sheet>
    )
  }

  return (
    <Sheet title={isNew ? 'New workout' : 'Edit workout'} onClose={onClose}>
      <label className="field">
        <span>Name</span>
        <input className="input" value={name} autoFocus={isNew} placeholder="Day 3" onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span>Note</span>
        <input className="input" value={note} placeholder="Solo session · ~43 min" onChange={(e) => setNote(e.target.value)} />
      </label>

      <div className="section-head" style={{ marginTop: 'var(--sp-5)' }}>
        <h2>Exercises</h2>
        <span className="count-pill">{ids.length}</span>
      </div>

      {ids.length === 0 && <p className="hint">No exercises yet. An empty workout is fine — you can log ad-hoc on the day.</p>}

      <div className="order-list">
        {ids.map((id, i) => {
          const e = byId.get(id)
          return (
            <div className="order-item" key={id}>
              <span className="order-body">
                <strong>{e?.name ?? 'Missing exercise'}</strong>
                <small>
                  {e?.slot ? `${e.slot} · ` : ''}
                  {e?.targetSets > 0 ? `${e.targetSets}×${e.targetReps}` : 'warm-up'}
                </small>
              </span>
              <span className="order-actions">
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button type="button" aria-label="Move down" disabled={i === ids.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button type="button" aria-label="Remove" onClick={() => setIds(ids.filter((x) => x !== id))}>
                  <TrashIcon />
                </button>
              </span>
            </div>
          )
        })}
      </div>

      <button type="button" className="btn full" style={{ marginTop: 'var(--sp-3)' }} onClick={() => setAdding(true)}>
        <PlusIcon /> Add exercise
      </button>

      <button type="button" className="btn primary full" style={{ marginTop: 'var(--sp-5)' }} disabled={!name.trim()} onClick={save}>
        {isNew ? 'Create workout' : 'Save changes'}
      </button>

      {!isNew && (
        <button type="button" className="btn danger full" style={{ marginTop: 'var(--sp-2)' }} onClick={del}>
          Delete workout
        </button>
      )}
    </Sheet>
  )
}
