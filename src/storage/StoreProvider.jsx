import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { driver } from './driver.js'
import {
  COLLECTIONS,
  DEFAULT_SETTINGS,
  DIRECT_PROTEIN_ID,
  SCHEMA_VERSION,
  SEED,
  newId,
} from './schema.js'
import { dayKey, todayISO } from '../lib/date.js'
import { lastPerformance, suggestNext } from '../lib/progression.js'

/**
 * Holds the entire dataset in memory and is the only thing components talk to.
 *
 * Reads are synchronous (straight off React state), writes go through the async
 * driver. Components never import driver.js, so moving to IndexedDB is a
 * one-file change.
 */

const StoreContext = createContext(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

const NAMES = Object.keys(COLLECTIONS)
const EMPTY = {
  settings: DEFAULT_SETTINGS,
  exercises: [],
  workouts: [],
  sessions: [],
  foods: [],
  foodEntries: [],
  bodyWeights: [],
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(EMPTY)
  const [ready, setReady] = useState(false)

  // Mirror of state for use inside callbacks. Lets actions compute the next
  // value outside setState, so no side effects run in a state updater (which
  // StrictMode would double-invoke in dev).
  const ref = useRef(state)

  const setAll = useCallback((next) => {
    ref.current = next
    setState(next)
  }, [])

  const write = useCallback((name, value) => {
    setAll({ ...ref.current, [name]: value })
    driver.set(COLLECTIONS[name], value)
  }, [setAll])

  const mutate = useCallback(
    (name, updater) => {
      const value = updater(ref.current[name], ref.current)
      write(name, value)
      return value
    },
    [write]
  )

  // --- hydrate -------------------------------------------------------------

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const seeded = await driver.get('seeded', false)

      if (!seeded) {
        await Promise.all(NAMES.map((n) => driver.set(COLLECTIONS[n], SEED[n])))
        await driver.set('seeded', true)
        if (!cancelled) {
          setAll(SEED)
          setReady(true)
        }
        return
      }

      const pairs = await Promise.all(
        NAMES.map(async (n) => [n, await driver.get(COLLECTIONS[n], EMPTY[n])])
      )
      if (cancelled) return

      const loaded = Object.fromEntries(pairs)
      // Merge settings over defaults so fields added in a later version show up
      // without a migration step.
      loaded.settings = {
        ...DEFAULT_SETTINGS,
        ...loaded.settings,
        schedule: { ...DEFAULT_SETTINGS.schedule, ...(loaded.settings?.schedule ?? {}) },
      }
      setAll(loaded)
      setReady(true)
    })()

    return () => {
      cancelled = true
    }
  }, [setAll])

  // --- settings ------------------------------------------------------------

  const updateSettings = useCallback(
    (patch) => mutate('settings', (s) => ({ ...s, ...patch })),
    [mutate]
  )

  const setScheduleDay = useCallback(
    (day, workoutId) =>
      mutate('settings', (s) => ({ ...s, schedule: { ...s.schedule, [day]: workoutId } })),
    [mutate]
  )

  // --- sessions ------------------------------------------------------------

  /**
   * Find or create today's session. Created lazily on first interaction so
   * skipped days don't litter History with empty sessions.
   *
   * At creation, every set is pre-filled from suggestNext(), which is what
   * makes "tap once to check off the exercise" produce real progression data.
   */
  const ensureSession = useCallback(
    (date, workout) => {
      const { exercises, sessions } = ref.current

      const buildEntry = (exerciseId) => {
        const exercise = exercises.find((e) => e.id === exerciseId)
        if (!exercise) return null
        const suggestion = suggestNext(exercise, lastPerformance(sessions, exerciseId))
        // Explicit 0 is meaningful — primers/warm-ups carry no sets to log — so
        // this can't collapse to `|| 3`.
        const setCount = Number.isFinite(exercise.targetSets) ? exercise.targetSets : 3
        return {
          exerciseId,
          done: false,
          sets: Array.from({ length: setCount }, () => ({
            weight: suggestion.weight,
            reps: suggestion.reps,
            done: false,
          })),
        }
      }

      const existing = sessions.find((s) => s.date === date && s.workoutId === workout.id)

      if (existing) {
        // Reconcile: exercises added to the routine after today's session was
        // created would otherwise be invisible until tomorrow.
        const missing = workout.exerciseIds.filter(
          (id) => !existing.completed.some((c) => c.exerciseId === id)
        )
        if (!missing.length) return existing

        const merged = {
          ...existing,
          completed: [...existing.completed, ...missing.map(buildEntry).filter(Boolean)],
        }
        mutate('sessions', (list) => list.map((s) => (s.id === merged.id ? merged : s)))
        return merged
      }

      const session = {
        id: newId('s'),
        date,
        workoutId: workout.id,
        completed: workout.exerciseIds.map(buildEntry).filter(Boolean),
      }
      mutate('sessions', (list) => [...list, session])
      return session
    },
    [mutate]
  )

  /**
   * Add an exercise to TODAY'S SESSION ONLY, leaving the workout template alone.
   *
   * This is what makes coach-led days work: on Tuesday you don't know what's
   * coming, so there's nothing to pre-plan — you record what happened. The
   * exercise still persists in the library, so the second time it's one tap.
   */
  const addExerciseToSession = useCallback(
    (sessionId, exerciseId) => {
      const { exercises, sessions } = ref.current
      const exercise = exercises.find((e) => e.id === exerciseId)
      const session = sessions.find((s) => s.id === sessionId)
      if (!exercise || !session) return
      if (session.completed.some((c) => c.exerciseId === exerciseId)) return

      const suggestion = suggestNext(exercise, lastPerformance(sessions, exerciseId))
      const setCount = exercise.targetSets > 0 ? exercise.targetSets : 3
      const entry = {
        exerciseId,
        adhoc: true,
        done: false,
        sets: Array.from({ length: setCount }, () => ({
          weight: suggestion.weight,
          reps: suggestion.reps,
          done: false,
        })),
      }

      mutate('sessions', (list) =>
        list.map((s) => (s.id === sessionId ? { ...s, completed: [...s.completed, entry] } : s))
      )
    },
    [mutate]
  )

  /** Drop an exercise from today only — the workout template is untouched. */
  const removeExerciseFromSession = useCallback(
    (sessionId, exerciseId) =>
      mutate('sessions', (list) =>
        list.map((s) =>
          s.id === sessionId
            ? { ...s, completed: s.completed.filter((c) => c.exerciseId !== exerciseId) }
            : s
        )
      ),
    [mutate]
  )

  const updateEntry = useCallback(
    (sessionId, exerciseId, updater) =>
      mutate('sessions', (list) =>
        list.map((s) =>
          s.id !== sessionId
            ? s
            : {
                ...s,
                completed: s.completed.map((c) => (c.exerciseId === exerciseId ? updater(c) : c)),
              }
        )
      ),
    [mutate]
  )

  /**
   * The fast path: one tap anywhere on the card. Marking an exercise done also
   * marks every set done at whatever is currently loaded, so checking off an
   * exercise mid-set is a single tap and still records usable data. Adjust the
   * numbers after if reality differed.
   */
  const toggleExerciseDone = useCallback(
    (sessionId, exerciseId) =>
      updateEntry(sessionId, exerciseId, (entry) => {
        const done = !entry.done
        return { ...entry, done, sets: entry.sets.map((s) => ({ ...s, done })) }
      }),
    [updateEntry]
  )

  const toggleSetDone = useCallback(
    (sessionId, exerciseId, index) =>
      updateEntry(sessionId, exerciseId, (entry) => {
        const sets = entry.sets.map((s, i) => (i === index ? { ...s, done: !s.done } : s))
        return { ...entry, sets, done: sets.every((s) => s.done) }
      }),
    [updateEntry]
  )

  const patchSet = useCallback(
    (sessionId, exerciseId, index, patch) =>
      updateEntry(sessionId, exerciseId, (entry) => ({
        ...entry,
        sets: entry.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)),
      })),
    [updateEntry]
  )

  const addSet = useCallback(
    (sessionId, exerciseId) =>
      updateEntry(sessionId, exerciseId, (entry) => {
        const last = entry.sets[entry.sets.length - 1] ?? { weight: 10, reps: 10 }
        return { ...entry, done: false, sets: [...entry.sets, { ...last, done: false }] }
      }),
    [updateEntry]
  )

  const removeSet = useCallback(
    (sessionId, exerciseId, index) =>
      updateEntry(sessionId, exerciseId, (entry) => {
        const sets = entry.sets.filter((_, i) => i !== index)
        return { ...entry, sets, done: sets.length > 0 && sets.every((s) => s.done) }
      }),
    [updateEntry]
  )

  /** Load the suggested weight into every set that hasn't been logged yet. */
  const applyWeightToPending = useCallback(
    (sessionId, exerciseId, weight) =>
      updateEntry(sessionId, exerciseId, (entry) => ({
        ...entry,
        sets: entry.sets.map((s) => (s.done ? s : { ...s, weight })),
      })),
    [updateEntry]
  )

  // --- food ----------------------------------------------------------------

  const addFoodEntry = useCallback(
    (foodId, grams, date = todayISO()) => {
      const entry = { id: newId('fe'), date, foodId, grams: Number(grams) || 0 }
      mutate('foodEntries', (list) => [...list, entry])
      // useCount ranks the quick-add row, so it reflects what he actually eats.
      mutate('foods', (list) =>
        list.map((f) => (f.id === foodId ? { ...f, useCount: (f.useCount || 0) + 1 } : f))
      )
      return entry
    },
    [mutate]
  )

  const removeFoodEntry = useCallback(
    (id) => mutate('foodEntries', (list) => list.filter((e) => e.id !== id)),
    [mutate]
  )

  /** Log grams of protein directly, for anything with a label. */
  const addProteinDirect = useCallback(
    (grams, date = todayISO()) => addFoodEntry(DIRECT_PROTEIN_ID, grams, date),
    [addFoodEntry]
  )

  const saveFood = useCallback(
    (food) =>
      mutate('foods', (list) => {
        if (food.id && list.some((f) => f.id === food.id)) {
          return list.map((f) => (f.id === food.id ? { ...f, ...food } : f))
        }
        return [...list, { useCount: 0, ...food, id: food.id || newId('f') }]
      }),
    [mutate]
  )

  const removeFood = useCallback(
    (id) => mutate('foods', (list) => list.filter((f) => f.id !== id)),
    [mutate]
  )

  // --- body weight ---------------------------------------------------------

  const setBodyWeight = useCallback(
    (weight, date = todayISO()) =>
      mutate('bodyWeights', (list) => {
        const value = Number(weight) || 0
        const existing = list.find((b) => b.date === date)
        if (existing) return list.map((b) => (b.date === date ? { ...b, weight: value } : b))
        return [...list, { id: newId('bw'), date, weight: value }]
      }),
    [mutate]
  )

  // --- exercises & workouts (used by Routines) ------------------------------

  const saveExercise = useCallback(
    (exercise) =>
      mutate('exercises', (list) => {
        if (exercise.id && list.some((e) => e.id === exercise.id)) {
          return list.map((e) => (e.id === exercise.id ? { ...e, ...exercise } : e))
        }
        return [...list, { increment: 5, notes: '', ...exercise, id: exercise.id || newId('e') }]
      }),
    [mutate]
  )

  const removeExercise = useCallback(
    (id) => {
      mutate('exercises', (list) => list.filter((e) => e.id !== id))
      mutate('workouts', (list) =>
        list.map((w) => ({ ...w, exerciseIds: w.exerciseIds.filter((x) => x !== id) }))
      )
    },
    [mutate]
  )

  const saveWorkout = useCallback(
    (workout) =>
      mutate('workouts', (list) => {
        if (workout.id && list.some((w) => w.id === workout.id)) {
          return list.map((w) => (w.id === workout.id ? { ...w, ...workout } : w))
        }
        return [...list, { exerciseIds: [], ...workout, id: workout.id || newId('w') }]
      }),
    [mutate]
  )

  const removeWorkout = useCallback(
    (id) => {
      mutate('workouts', (list) => list.filter((w) => w.id !== id))
      mutate('settings', (s) => ({
        ...s,
        schedule: Object.fromEntries(
          Object.entries(s.schedule).map(([d, wid]) => [d, wid === id ? null : wid])
        ),
      }))
    },
    [mutate]
  )

  // --- backup --------------------------------------------------------------

  const exportAll = useCallback(() => {
    const data = Object.fromEntries(NAMES.map((n) => [n, ref.current[n]]))
    return { app: 'justins-fitness-journey', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data }
  }, [])

  const importAll = useCallback(
    async (payload) => {
      const data = payload?.data
      if (!data || typeof data !== 'object') throw new Error('Not a backup file — no "data" object.')
      if (payload.version > SCHEMA_VERSION) {
        throw new Error(`Backup is version ${payload.version}; this app understands ${SCHEMA_VERSION}.`)
      }
      const next = Object.fromEntries(
        NAMES.map((n) => [n, data[n] ?? EMPTY[n]])
      )
      next.settings = {
        ...DEFAULT_SETTINGS,
        ...next.settings,
        schedule: { ...DEFAULT_SETTINGS.schedule, ...(next.settings?.schedule ?? {}) },
      }
      await Promise.all(NAMES.map((n) => driver.set(COLLECTIONS[n], next[n])))
      await driver.set('seeded', true)
      setAll(next)
    },
    [setAll]
  )

  // --- selectors -----------------------------------------------------------

  const workoutForDate = useCallback(
    (iso) => {
      const id = state.settings.schedule?.[dayKey(iso)]
      return state.workouts.find((w) => w.id === id) ?? null
    },
    [state.settings.schedule, state.workouts]
  )

  const value = useMemo(
    () => ({
      ready,
      ...state,
      updateSettings,
      setScheduleDay,
      ensureSession,
      addExerciseToSession,
      removeExerciseFromSession,
      toggleExerciseDone,
      toggleSetDone,
      patchSet,
      addSet,
      removeSet,
      applyWeightToPending,
      addFoodEntry,
      addProteinDirect,
      removeFoodEntry,
      saveFood,
      removeFood,
      setBodyWeight,
      saveExercise,
      removeExercise,
      saveWorkout,
      removeWorkout,
      exportAll,
      importAll,
      workoutForDate,
    }),
    [
      ready, state, updateSettings, setScheduleDay, ensureSession, addExerciseToSession,
      removeExerciseFromSession, toggleExerciseDone, toggleSetDone,
      patchSet, addSet, removeSet, applyWeightToPending, addFoodEntry, addProteinDirect,
      removeFoodEntry, saveFood, removeFood, setBodyWeight, saveExercise, removeExercise,
      saveWorkout, removeWorkout, exportAll, importAll, workoutForDate,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
