/**
 * Progressive overload. Pure functions over session history — no storage, no
 * React, so they're trivial to reason about and to reuse from the charts.
 *
 * The scheme is DOUBLE PROGRESSION, the standard beginner approach:
 *   hit the target reps on every target set  ->  add one increment next time
 *   missed any of them                       ->  repeat the same weight
 *
 * That's why sets are logged individually. A beginner's reps fall off across
 * sets (10, 9, 7), and that fall-off is exactly the signal that says "not yet".
 */

/** Weight used when an exercise has never been logged. Light on purpose. */
export const FIRST_TIME_WEIGHT = 10

/** Epley formula. Only meaningful up to ~12 reps, which is the working range here. */
export const estimated1RM = (weight, reps) => weight * (1 + reps / 30)

const loggedSets = (entry) => (entry?.sets ?? []).filter((s) => s.done && s.weight > 0 && s.reps > 0)

/**
 * Every session where this exercise had real logged work, oldest first.
 * -> [{ sessionId, date, sets }]
 */
export function exerciseHistory(sessions, exerciseId) {
  return sessions
    .map((session) => {
      const entry = session.completed?.find((c) => c.exerciseId === exerciseId)
      const sets = loggedSets(entry)
      return sets.length ? { sessionId: session.id, date: session.date, sets } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Most recent session with real work for this exercise, or null. */
export function lastPerformance(sessions, exerciseId, { excludeSessionId } = {}) {
  const history = exerciseHistory(sessions, exerciseId).filter((h) => h.sessionId !== excludeSessionId)
  return history.length ? history[history.length - 1] : null
}

/** Heaviest set; ties broken by reps. */
export function topSet(sets) {
  return sets.reduce(
    (best, s) => (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best),
    null
  )
}

/** Best-ever weight and best-ever estimated 1RM for an exercise. */
export function personalBest(sessions, exerciseId, { excludeSessionId } = {}) {
  const history = exerciseHistory(sessions, exerciseId).filter((h) => h.sessionId !== excludeSessionId)
  if (!history.length) return null

  let bestWeight = null
  let bestE1RM = null
  for (const { date, sets } of history) {
    for (const set of sets) {
      if (!bestWeight || set.weight > bestWeight.weight) bestWeight = { ...set, date }
      const e1rm = estimated1RM(set.weight, set.reps)
      if (!bestE1RM || e1rm > bestE1RM.e1rm) bestE1RM = { ...set, date, e1rm }
    }
  }
  return { weight: bestWeight, e1rm: bestE1RM }
}

/**
 * What to load next time.
 * -> { weight, reps, reason, isFirst }
 */
export function suggestNext(exercise, last) {
  const targetReps = exercise.targetReps ?? 10
  const targetSets = exercise.targetSets ?? 3
  const increment = exercise.increment || 5

  if (!last) {
    return { weight: FIRST_TIME_WEIGHT, reps: targetReps, reason: 'First time — start light', isFirst: true }
  }

  const working = topSet(last.sets).weight
  const atWorking = last.sets.filter((s) => s.weight >= working)
  const clearedAll = atWorking.length >= targetSets && atWorking.every((s) => s.reps >= targetReps)

  if (clearedAll) {
    return {
      weight: working + increment,
      reps: targetReps,
      reason: `Hit ${targetSets}×${targetReps} last time`,
      isFirst: false,
    }
  }

  return { weight: working, reps: targetReps, reason: 'Repeat until all reps clear', isFirst: false }
}

/** True when this set beats every set logged for the exercise before today. */
export function isPR(sessions, exerciseId, set, { excludeSessionId } = {}) {
  if (!set?.done || !set.weight || !set.reps) return false
  const best = personalBest(sessions, exerciseId, { excludeSessionId })
  if (!best) return true
  return (
    set.weight > best.weight.weight ||
    estimated1RM(set.weight, set.reps) > estimated1RM(best.e1rm.weight, best.e1rm.reps)
  )
}

/** '20 lb × 10, 9, 8' when the weight held; '20×10, 25×8' when it changed. */
export function formatSets(sets, unit = 'lb') {
  if (!sets?.length) return ''
  const sameWeight = sets.every((s) => s.weight === sets[0].weight)
  if (sameWeight) return `${sets[0].weight} ${unit} × ${sets.map((s) => s.reps).join(', ')}`
  return sets.map((s) => `${s.weight}×${s.reps}`).join(', ')
}

/** Total weight moved in a session entry — the simplest honest "did more" metric. */
export const volume = (sets) => loggedSets({ sets }).reduce((sum, s) => sum + s.weight * s.reps, 0)
