import { useMemo } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { exerciseHistory, isPR, volume } from '../lib/progression.js'
import { relativeDay } from '../lib/date.js'

/**
 * Shown once every exercise is checked off.
 *
 * Deliberately backward-looking rather than congratulatory: the useful thing
 * at the end of a session is what actually moved compared with last time.
 */
export function SessionSummary({ session }) {
  const { sessions, exercises, settings, setSessionNote } = useStore()
  const unit = settings.unit

  const stats = useMemo(() => {
    const total = session.completed.reduce((sum, c) => sum + volume(c.sets), 0)

    const prs = []
    for (const entry of session.completed) {
      const exercise = exercises.find((e) => e.id === entry.exerciseId)
      if (!exercise) continue
      const best = entry.sets.find((s) =>
        isPR(sessions, entry.exerciseId, s, { excludeSessionId: session.id })
      )
      if (best) prs.push({ name: exercise.name, set: best })
    }

    // Previous session of the same workout, for a like-for-like comparison.
    const previous = sessions
      .filter(
        (s) =>
          s.workoutId === session.workoutId &&
          s.id !== session.id &&
          s.date <= session.date &&
          s.completed.some((c) => c.done)
      )
      .sort((a, b) => b.date.localeCompare(a.date))[0]

    const previousTotal = previous
      ? previous.completed.reduce((sum, c) => sum + volume(c.sets), 0)
      : null

    return { total, prs, previous, previousTotal }
  }, [session, sessions, exercises])

  const { total, prs, previous, previousTotal } = stats
  const delta = previousTotal ? total - previousTotal : null

  return (
    <div className="card summary">
      <p className="summary-kicker">Session complete</p>

      <div className="summary-figure">
        <span className="summary-big">{Math.round(total).toLocaleString()}</span>
        <span className="summary-unit">{unit} moved</span>
      </div>

      {delta !== null && (
        <p className="summary-delta">
          {delta === 0
            ? `Same as ${relativeDay(previous.date).toLowerCase()}`
            : `${delta > 0 ? '+' : ''}${Math.round(delta).toLocaleString()} ${unit} vs ${relativeDay(previous.date).toLowerCase()}`}
        </p>
      )}

      {prs.length > 0 && (
        <ul className="summary-prs">
          {prs.map((pr) => (
            <li key={pr.name}>
              <span className="pr-badge">PR</span>
              {pr.name} — {pr.set.weight} {unit} × {pr.set.reps}
            </li>
          ))}
        </ul>
      )}

      <label className="field" style={{ marginTop: 'var(--sp-4)', marginBottom: 0 }}>
        <span>Notes</span>
        <textarea
          className="input textarea"
          rows={2}
          placeholder="Felt easy, shoulder a bit tight…"
          value={session.note ?? ''}
          onChange={(e) => setSessionNote(session.id, e.target.value)}
        />
      </label>
    </div>
  )
}
