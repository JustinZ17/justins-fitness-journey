import { Sheet } from './Sheet.jsx'
import { ExerciseArt } from './ExerciseArt.jsx'
import { guideFor } from '../lib/guides.js'

/**
 * How to do one exercise.
 *
 * Ordered the way it's needed at the gym: find the kit, get set up, do the rep,
 * avoid the usual mistake. Short on purpose — it gets read standing next to a
 * machine with a phone in one hand.
 */
export function GuideSheet({ exercise, onClose }) {
  const guide = guideFor(exercise.name)

  return (
    <Sheet title={exercise.name} onClose={onClose}>
      {guide ? (
        <>
          <div className="guide-art">
            <ExerciseArt name={guide.art} />
          </div>

          <ol className="guide-steps">
            <li>
              <span className="guide-label">Find it</span>
              <p>{guide.find}</p>
            </li>
            <li>
              <span className="guide-label">Set up</span>
              <p>{guide.setup}</p>
            </li>
            <li>
              <span className="guide-label">The rep</span>
              <p>{guide.execute}</p>
            </li>
          </ol>

          <div className="guide-watch">
            <span className="guide-label">Watch out for</span>
            <p>{guide.mistake}</p>
          </div>

          {exercise.tempo && (
            <p className="hint" style={{ marginTop: 'var(--sp-4)' }}>
              Your plan sets a tempo of {exercise.tempo} for this — see the timing note on the
              exercise card.
            </p>
          )}

          <p className="guide-caveat">
            A diagram, not a demonstration. If a movement hurts anywhere sharp, stop and ask
            your trainer to watch a set.
          </p>
        </>
      ) : (
        <>
          <p className="hint">
            No guide written for “{exercise.name}” yet — guides are matched on the exercise
            name, so a custom one won't have picked one up.
          </p>
          {exercise.notes && <p className="session-note">{exercise.notes}</p>}
          <p className="hint">
            You can keep your own cues in the exercise's Notes field, under Routines.
          </p>
        </>
      )}

      <button type="button" className="btn full" style={{ marginTop: 'var(--sp-4)' }} onClick={onClose}>
        Got it
      </button>
    </Sheet>
  )
}
