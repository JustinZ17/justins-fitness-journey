import { useState } from 'react'
import { Stepper } from './Stepper.jsx'
import { CheckIcon, ChevronIcon, PawIcon, TrashIcon } from './Icons.jsx'
import { formatSets, isPR, lastPerformance, suggestNext } from '../lib/progression.js'
import { relativeDay } from '../lib/date.js'
import { parseTempo } from '../storage/schema.js'
import { useStore } from '../storage/StoreProvider.jsx'
import { useRestTimer } from './RestTimer.jsx'
import { GuideSheet } from './GuideSheet.jsx'
import { guideFor } from '../lib/guides.js'

/**
 * One exercise in today's checklist.
 *
 * The whole main row is the done toggle — one tap, no confirm, no sheet. The
 * chevron is a separate hit area so opening the set detail can never be
 * mistaken for checking the exercise off.
 */
export function ExerciseCard({ exercise, entry, session }) {
  const [open, setOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const hasGuide = Boolean(guideFor(exercise.name))
  const {
    sessions,
    settings,
    toggleExerciseDone,
    toggleSetDone,
    patchSet,
    addSet,
    removeSet,
    applyWeightToPending,
    removeExerciseFromSession,
  } = useStore()
  const rest = useRestTimer()

  /**
   * Checking a set off starts the rest clock; un-checking a mistake shouldn't.
   * Only the per-set control does this — the whole-card tap usually means
   * "I did this earlier", where a countdown would just be noise.
   */
  const handleSetToggle = (index) => {
    const wasDone = entry.sets[index]?.done
    toggleSetDone(session.id, exercise.id, index)
    if (!wasDone) rest?.start(exercise.restSeconds, exercise.name)
  }

  const unit = settings.unit
  const last = lastPerformance(sessions, exercise.id, { excludeSessionId: session.id })
  const suggestion = suggestNext(exercise, last)
  const anyPR = entry.sets.some((s) => isPR(sessions, exercise.id, s, { excludeSessionId: session.id }))
  const tempo = parseTempo(exercise.tempo)

  const isPrimer = exercise.kind === 'primer'
  const currentWeight = entry.sets[0]?.weight ?? suggestion.weight
  const suggestionApplied = entry.sets.every((s) => s.done || s.weight === suggestion.weight)

  const subtitle = last
    ? `Last ${relativeDay(last.date).toLowerCase()} · ${formatSets(last.sets, unit)}`
    : isPrimer
      ? 'Warm-up — no load to track'
      : 'First time — no history yet'

  return (
    <article className={`card exercise${entry.done ? ' done' : ''}`}>
      <div className="ex-row">
        <button
          type="button"
          className="ex-main"
          onClick={() => toggleExerciseDone(session.id, exercise.id)}
          aria-pressed={entry.done}
        >
          <span className="checkbox">
            <CheckIcon className="mark-tick" />
            <PawIcon className="mark-paw" />
          </span>

          <span className="ex-body">
            <span className="ex-title">
              {/* The slot letter is a position in a written program. On an
                  ad-hoc day there is no program, so it would be noise. */}
              {exercise.slot && !entry.adhoc && <span className="slot">{exercise.slot}</span>}
              <span className="ex-name">{exercise.name}</span>
              {anyPR && <span className="pr-badge">PR</span>}
            </span>
            <span className="ex-meta">{subtitle}</span>
          </span>

          {!isPrimer && (
            <span className="ex-load">
              <b>{currentWeight}</b>
              <small>{unit}</small>
            </span>
          )}
        </button>

        {/* Primers have no sets, but still need somewhere to hold notes and the
            remove action, so they keep the disclosure too. */}
        <button
          type="button"
          className="ex-expand"
          aria-expanded={open}
          aria-label={open ? `Hide details for ${exercise.name}` : `Show details for ${exercise.name}`}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronIcon />
        </button>
      </div>

      {open && !isPrimer && (
        <div className="ex-detail">
          {(exercise.targetSets || exercise.tempo || exercise.restSeconds || exercise.targetRIR != null) && (
            <div className="chips">
              {exercise.targetSets > 0 && (
                <span className="chip">
                  <b>
                    {exercise.targetSets}×{exercise.targetReps}
                  </b>{' '}
                  target
                </span>
              )}
              {exercise.tempo && (
                <span className="chip">
                  tempo <b>{exercise.tempo}</b>
                </span>
              )}
              {exercise.restSeconds > 0 && (
                <span className="chip">
                  rest <b>{exercise.restSeconds}s</b>
                </span>
              )}
              {exercise.targetRIR != null && (
                <span className="chip">
                  RIR <b>{exercise.targetRIR}</b>
                </span>
              )}
            </div>
          )}

          {!suggestionApplied && (
            <button
              type="button"
              className="suggestion"
              onClick={() => applyWeightToPending(session.id, exercise.id, suggestion.weight)}
            >
              <span style={{ flex: 1 }}>
                Load{' '}
                <strong>
                  {suggestion.weight} {unit}
                </strong>{' '}
                × {suggestion.reps}
                <span className="why">{suggestion.reason}</span>
              </span>
              <span className="go" aria-hidden>
                →
              </span>
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
                onClick={() => handleSetToggle(i)}
              >
                <CheckIcon className="mark-tick" />
                <PawIcon className="mark-paw" />
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
              >
                <TrashIcon /> Set
              </button>
            )}
          </div>

          {(exercise.notes || tempo) && (
            <p className="notes">
              {exercise.notes}
              {tempo && (
                <span className="tempo-legend">
                  {exercise.notes ? <br /> : null}
                  Tempo {exercise.tempo}: {tempo[0]}s down · {tempo[1]}s pause · {tempo[2] === '0' ? 'explosive' : `${tempo[2]}s`} up
                  {tempo[3] !== '0' ? ` · ${tempo[3]}s hold` : ''}
                </span>
              )}
            </p>
          )}

          {/* Today only — the workout template and the exercise library are
              both left alone, so this is safe to tap on a skipped lift. */}
          <div className="detail-actions">
            {hasGuide && (
              <button type="button" className="link-btn" onClick={() => setGuideOpen(true)}>
                How to do this
              </button>
            )}
            <button
              type="button"
              className="link-btn remove-today"
              onClick={() => removeExerciseFromSession(session.id, exercise.id)}
            >
              Remove from today
            </button>
          </div>
        </div>
      )}

      {open && isPrimer && (
        <div className="ex-detail">
          {exercise.notes && <p className="notes" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>{exercise.notes}</p>}
          <div className="detail-actions">
            {hasGuide && (
              <button type="button" className="link-btn" onClick={() => setGuideOpen(true)}>
                How to do this
              </button>
            )}
            <button
              type="button"
              className="link-btn remove-today"
              onClick={() => removeExerciseFromSession(session.id, exercise.id)}
            >
              Remove from today
            </button>
          </div>
        </div>
      )}

      {guideOpen && <GuideSheet exercise={exercise} onClose={() => setGuideOpen(false)} />}
    </article>
  )
}
