import { DEFAULT_SETTINGS, SEED, SEED_VERSION } from './schema.js'

/**
 * Bring an existing install up to the current default program.
 *
 * The original seeding ran once behind a boolean flag, which meant anyone who
 * had already opened the app kept whatever the defaults were on that day. When
 * the default program later changed, existing installs — the only install that
 * matters here — never saw it.
 *
 * Two paths, chosen by whether anything has actually been trained:
 *
 *   nothing logged -> replace the program outright. There is no history to
 *                     protect and no reason to leave a stale routine cluttering
 *                     the list.
 *   history exists -> add only what's missing. Never touch an exercise that
 *                     logged sets point at, or those sessions lose their names
 *                     and their weights stop counting toward progression.
 */
export function migrateSeed(state) {
  const current = state.settings?.seedVersion ?? 1
  if (current >= SEED_VERSION) return null

  const hasHistory = (state.sessions?.length ?? 0) > 0

  const settings = { ...state.settings, seedVersion: SEED_VERSION }

  if (!hasHistory) {
    return {
      exercises: SEED.exercises,
      workouts: SEED.workouts,
      // The old schedule pointed at workouts that no longer exist; leaving it
      // would resolve to nothing and read as a permanent rest week.
      settings: { ...settings, schedule: { ...DEFAULT_SETTINGS.schedule } },
    }
  }

  const haveExercise = new Set(state.exercises.map((e) => e.id))
  const haveWorkout = new Set(state.workouts.map((w) => w.id))

  return {
    exercises: [...state.exercises, ...SEED.exercises.filter((e) => !haveExercise.has(e.id))],
    workouts: [...state.workouts, ...SEED.workouts.filter((w) => !haveWorkout.has(w.id))],
    settings,
  }
}
