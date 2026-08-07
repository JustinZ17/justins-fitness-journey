import { useMemo, useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { useStore } from '../storage/StoreProvider.jsx'
import { KINDS, newId } from '../storage/schema.js'
import { relativeDay } from '../lib/date.js'
import { PlusIcon } from './Icons.jsx'

/**
 * Add an exercise to today's session.
 *
 * Built for coach-led days: the exercise you're told to do may not exist yet,
 * so creating one has to be as fast as picking one. Anything created here lands
 * in the library, so the second time it's a single tap.
 */
export function AddExerciseSheet({ session, onClose }) {
  const { exercises, sessions, addExerciseToSession, saveExercise } = useStore()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const alreadyIn = useMemo(
    () => new Set(session.completed.map((c) => c.exerciseId)),
    [session.completed]
  )

  // Most recently trained first — on a trainer day you're usually repeating
  // something from a recent session, not reaching for an old one.
  const lastUsed = useMemo(() => {
    const map = new Map()
    for (const s of sessions) {
      for (const c of s.completed) {
        const prev = map.get(c.exerciseId)
        if (!prev || s.date > prev) map.set(c.exerciseId, s.date)
      }
    }
    return map
  }, [sessions])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises
      .filter((e) => !alreadyIn.has(e.id))
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const la = lastUsed.get(a.id) ?? ''
        const lb = lastUsed.get(b.id) ?? ''
        if (la !== lb) return lb.localeCompare(la)
        return a.name.localeCompare(b.name)
      })
  }, [exercises, alreadyIn, query, lastUsed])

  const add = (exerciseId) => {
    addExerciseToSession(session.id, exerciseId)
    onClose()
  }

  if (creating) {
    return (
      <CreateExerciseForm
        initialName={query.trim()}
        onCancel={() => setCreating(false)}
        onClose={onClose}
        onCreate={(draft) => {
          const id = newId('e')
          saveExercise({ ...draft, id })
          addExerciseToSession(session.id, id)
          onClose()
        }}
      />
    )
  }

  return (
    <Sheet title="Add exercise" onClose={onClose}>
      <input
        className="input"
        placeholder="Search or type a new name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        style={{ marginBottom: 'var(--sp-3)' }}
      />

      <button type="button" className="btn full" onClick={() => setCreating(true)}>
        <PlusIcon /> Create {query.trim() ? `"${query.trim()}"` : 'a new exercise'}
      </button>

      {results.length > 0 && <div className="divider">from your library</div>}

      <div className="picker-list">
        {results.map((exercise) => (
          <button key={exercise.id} type="button" className="picker-item" onClick={() => add(exercise.id)}>
            <span>
              <strong>{exercise.name}</strong>
              <small>
                {exercise.targetSets > 0 ? `${exercise.targetSets}×${exercise.targetReps}` : 'no sets'}
                {lastUsed.has(exercise.id)
                  ? ` · ${relativeDay(lastUsed.get(exercise.id)).toLowerCase()}`
                  : ' · never logged'}
              </small>
            </span>
            <PlusIcon />
          </button>
        ))}
      </div>

      {results.length === 0 && query.trim() && (
        <p className="hint" style={{ marginTop: 'var(--sp-4)' }}>
          Nothing in your library matches “{query.trim()}”.
        </p>
      )}
    </Sheet>
  )
}

function CreateExerciseForm({ initialName, onCreate, onCancel, onClose }) {
  const [name, setName] = useState(initialName)
  const [targetSets, setTargetSets] = useState('3')
  const [targetReps, setTargetReps] = useState('10')
  const [increment, setIncrement] = useState('5')
  const [kind, setKind] = useState('main')

  const valid = name.trim().length > 0

  return (
    <Sheet title="New exercise" onClose={onClose}>
      <label className="field">
        <span>Name</span>
        <input
          className="input"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cable fly"
        />
      </label>

      <div className="sheet-row">
        <label className="field">
          <span>Sets</span>
          <input
            className="input"
            inputMode="numeric"
            value={targetSets}
            onChange={(e) => setTargetSets(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Reps</span>
          <input
            className="input"
            inputMode="numeric"
            value={targetReps}
            onChange={(e) => setTargetReps(e.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span>Weight step</span>
        <select className="input" value={increment} onChange={(e) => setIncrement(e.target.value)}>
          <option value="2.5">2.5 — small dumbbells, cable stacks</option>
          <option value="5">5 — most dumbbells and machines</option>
          <option value="10">10 — leg press, heavy machines</option>
        </select>
      </label>
      <p className="hint">How much the +/− buttons move, and the jump when you earn more weight.</p>

      <label className="field">
        <span>Type</span>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          {Object.values(KINDS).map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>

      <div className="sheet-row">
        <button type="button" className="btn" onClick={onCancel}>
          Back
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!valid}
          onClick={() =>
            onCreate({
              name: name.trim(),
              targetSets: Math.max(0, Number(targetSets) || 0),
              targetReps: Math.max(0, Number(targetReps) || 0),
              increment: Number(increment) || 5,
              kind,
              slot: '',
              tempo: '',
              restSeconds: null,
              targetRIR: null,
              notes: '',
            })
          }
        >
          Add to today
        </button>
      </div>
    </Sheet>
  )
}
