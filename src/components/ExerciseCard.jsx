import { useState } from 'react'
import { Stepper } from './Stepper.jsx'
import { CheckIcon, ChevronIcon, TrashIcon } from './Icons.jsx'
import { formatSets, isPR, lastPerformance, suggestNext } from '../lib/progression.js'
import { relativeDay } from '../lib/date.js'
import { useStore } from '../storage/StoreProvider.jsx'

/**
 * One exercise in today's checklist.
 *
 * The whole main row is the done toggle — one tap, no confirm, no sheet. The
 * chevron is a separate hit area so opening the set detail can never be
 * mistaken for checking the exercise off.
 */
export function ExerciseCard({ exercise, entry, session }) {
  const [open, setOpen] = useState(false)
  const {
    sessions,
    settings,
    toggleExerciseDone,
    toggleSetDone,
    patchSet,
    addSet,
    removeSet,
    applyWeightToPending,
  } = useStore()

  const unit = settings.unit
  const last = lastPerformance(sessions, exercise.id, { excludeSessionId: session.id })
  const suggestion = suggestNext(exercise, last)
  const anyPR = entry.sets.some((s) => isPR(sessions, exercise.id, s, { excludeSessionId: session.id }))

  const currentWeight = entry.sets[0]?.weight ?? suggestion.weight
  const suggestionApplied = entry.sets.every((s) => s.done || s.weight === suggestion.weight)

  const subtitle = last
    ? `Last ${relativeDay(last.date).toLowerCase()}: ${formatSets(last.sets, unit)}`
    : 'No history yet — first time'

  return (
    <div className={`card exercise${entry.done ? ' done' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <button
          type="button"
          className="ex-main"
          onClick={() => toggleExerciseDone(session.id, exercise.id)}
          aria-pressed={entry.done}
        >
          <span className="checkbox">
            <CheckIcon />
          </span>
          <span className="ex-body">
            <span className="ex-name">
              {exercise.name}
              {anyPR && (
                <>
                  {' '}
                  <span className="pr-badge">PR</span>
                </>
              )}
            </span>
            <span className="ex-meta">{subtitle}</span>
          </span>
          <span className="ex-target">
            {currentWeight} {unit}
          </span>
        </button>

        <button
          type="button"
          className="ex-expand"
          aria-expanded={open}
          aria-label={open ? 'Hide sets' : 'Show sets'}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronIcon />
        </button>
      </div>

      {open && (
        <div className="ex-detail">
          {!suggestionApplied && (
            <button
              type="button"
              className="suggestion"
              onClick={() => applyWeightToPending(session.id, exercise.id, suggestion.weight)}
            >
              <span style={{ flex: 1 }}>
                Try{' '}
                <strong>
                  {suggestion.weight} {unit}
                </strong>{' '}
                × {suggestion.reps}
                <span className="why">{suggestion.reason}</span>
              </span>
              <span aria-hidden>→</span>
            </button>
          )}

          <div className="set-head">
            <span className="set-no" />
            <span className="col-weight">Weight ({unit})</span>
            <span className="col-reps">Reps</span>
            <span className="set-head-spacer" />
          </div>

          {entry.sets.map((set, i) => (
            <div className="set-row" key={i}>
              <span className="set-no">{i + 1}</span>
              <Stepper
                variant="weight"
                value={set.weight}
                step={exercise.increment || 5}
                onChange={(weight) => patchSet(session.id, exercise.id, i, { weight })}
                label={`Set ${i + 1} weight`}
              />
              <Stepper
                variant="reps"
                value={set.reps}
                step={1}
                max={100}
                onChange={(reps) => patchSet(session.id, exercise.id, i, { reps })}
                label={`Set ${i + 1} reps`}
              />
              <button
                type="button"
                className="set-check"
                aria-pressed={set.done}
                aria-label={`Mark set ${i + 1} done`}
                onClick={() => toggleSetDone(session.id, exercise.id, i)}
              >
                <CheckIcon />
              </button>
            </div>
          ))}

          <div className="set-actions">
            <button type="button" className="btn" onClick={() => addSet(session.id, exercise.id)}>
              + Add set
            </button>
            {entry.sets.length > 1 && (
              <button
                type="button"
                className="btn danger"
                onClick={() => removeSet(session.id, exercise.id, entry.sets.length - 1)}
                aria-label="Remove last set"
              >
                <TrashIcon /> Set
              </button>
            )}
          </div>

          <p className="notes">
            Target {exercise.targetSets}×{exercise.targetReps}
            {exercise.notes ? ` — ${exercise.notes}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
