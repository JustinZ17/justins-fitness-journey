import { useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { KINDS } from '../storage/schema.js'
import { useStore } from '../storage/StoreProvider.jsx'

/**
 * Full editor for one exercise, including the coach-notation fields.
 *
 * This is what makes a program change self-serve: when the trainer bumps the
 * target reps or changes a tempo, it's edited here rather than requiring a new
 * data file.
 */
export function ExerciseEditor({ exercise, onClose }) {
  const { saveExercise, removeExercise, settings } = useStore()
  const isNew = !exercise?.id

  const [draft, setDraft] = useState(() => ({
    name: '',
    targetSets: 3,
    targetReps: 10,
    increment: 5,
    kind: 'main',
    slot: '',
    tempo: '',
    restSeconds: '',
    targetRIR: '',
    notes: '',
    ...exercise,
    restSeconds: exercise?.restSeconds ?? '',
    targetRIR: exercise?.targetRIR ?? '',
  }))

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const valid = draft.name.trim().length > 0

  const save = () => {
    saveExercise({
      ...draft,
      name: draft.name.trim(),
      slot: draft.slot.trim().toUpperCase(),
      tempo: draft.tempo.trim(),
      targetSets: Math.max(0, Number(draft.targetSets) || 0),
      targetReps: Math.max(0, Number(draft.targetReps) || 0),
      increment: Number(draft.increment) || 5,
      restSeconds: draft.restSeconds === '' ? null : Number(draft.restSeconds),
      targetRIR: draft.targetRIR === '' ? null : Number(draft.targetRIR),
    })
    onClose()
  }

  const del = () => {
    if (!window.confirm(`Delete "${exercise.name}"?\n\nIt is removed from every workout. Sessions you've already logged keep their history.`))
      return
    removeExercise(exercise.id)
    onClose()
  }

  return (
    <Sheet title={isNew ? 'New exercise' : 'Edit exercise'} onClose={onClose}>
      <label className="field">
        <span>Name</span>
        <input className="input" value={draft.name} autoFocus={isNew} onChange={(e) => set({ name: e.target.value })} />
      </label>

      <div className="sheet-row">
        <label className="field">
          <span>Sets</span>
          <input className="input" inputMode="numeric" value={draft.targetSets} onChange={(e) => set({ targetSets: e.target.value })} />
        </label>
        <label className="field">
          <span>Reps</span>
          <input className="input" inputMode="numeric" value={draft.targetReps} onChange={(e) => set({ targetReps: e.target.value })} />
        </label>
      </div>
      <p className="hint">Sets of 0 marks it a warm-up with nothing to log.</p>

      <label className="field">
        <span>Weight step ({settings.unit})</span>
        <select className="input" value={draft.increment} onChange={(e) => set({ increment: e.target.value })}>
          <option value="1">1</option>
          <option value="2.5">2.5 — small dumbbells, cable stacks</option>
          <option value="5">5 — most dumbbells and machines</option>
          <option value="10">10 — leg press, heavy machines</option>
          <option value="20">20</option>
        </select>
      </label>
      <p className="hint">Also how much gets added when you clear every target rep.</p>

      <label className="field">
        <span>Type</span>
        <select className="input" value={draft.kind} onChange={(e) => set({ kind: e.target.value })}>
          {Object.values(KINDS).map((k) => (
            <option key={k.id} value={k.id}>{k.label}</option>
          ))}
        </select>
      </label>

      <div className="divider">coach notation — optional</div>

      <div className="sheet-row">
        <label className="field">
          <span>Slot</span>
          <input className="input" placeholder="A1" value={draft.slot} onChange={(e) => set({ slot: e.target.value })} />
        </label>
        <label className="field">
          <span>Tempo</span>
          <input className="input" inputMode="numeric" placeholder="2100" value={draft.tempo} onChange={(e) => set({ tempo: e.target.value })} />
        </label>
      </div>
      <p className="hint">
        Exercises sharing a slot letter (D1, D2, D3) run as a superset. Tempo is four digits:
        lowering, pause, lifting, pause.
      </p>

      <div className="sheet-row">
        <label className="field">
          <span>Rest (seconds)</span>
          <input className="input" inputMode="numeric" placeholder="90" value={draft.restSeconds} onChange={(e) => set({ restSeconds: e.target.value })} />
        </label>
        <label className="field">
          <span>Target RIR</span>
          <input className="input" inputMode="numeric" placeholder="—" value={draft.targetRIR} onChange={(e) => set({ targetRIR: e.target.value })} />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea className="input textarea" rows={2} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>

      <button type="button" className="btn primary full" disabled={!valid} onClick={save}>
        {isNew ? 'Create exercise' : 'Save changes'}
      </button>

      {!isNew && (
        <button type="button" className="btn danger full" style={{ marginTop: 'var(--sp-2)' }} onClick={del}>
          Delete exercise
        </button>
      )}
    </Sheet>
  )
}
