import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  estimated1RM,
  exerciseHistory,
  lastPerformance,
  topSet,
  personalBest,
  suggestNext,
  isPR,
  formatSets,
  volume,
  FIRST_TIME_WEIGHT,
} from './progression.js'

/**
 * These functions decide what weight to put on the bar. A bug here doesn't
 * crash anything — it quietly recommends the wrong number, which is worse.
 */

const set = (weight, reps, done = true) => ({ weight, reps, done })

const session = (id, date, entries) => ({
  id,
  date,
  workoutId: 'w1',
  completed: Object.entries(entries).map(([exerciseId, sets]) => ({
    exerciseId,
    done: true,
    sets,
  })),
})

const EXERCISE = { id: 'bench', targetSets: 3, targetReps: 10, increment: 5 }

describe('estimated1RM', () => {
  test('Epley: a single at weight W is W', () => {
    assert.equal(estimated1RM(100, 0), 100)
  })

  test('grows with reps at the same load', () => {
    assert.ok(estimated1RM(100, 10) > estimated1RM(100, 5))
  })

  test('known value: 100 x 10 -> 133.3', () => {
    assert.equal(Math.round(estimated1RM(100, 10) * 10) / 10, 133.3)
  })
})

describe('exerciseHistory', () => {
  test('ignores sets that were never completed', () => {
    const sessions = [session('s1', '2026-08-01', { bench: [set(20, 10, false)] })]
    assert.deepEqual(exerciseHistory(sessions, 'bench'), [])
  })

  test('ignores zero-weight and zero-rep sets', () => {
    const sessions = [session('s1', '2026-08-01', { bench: [set(0, 10), set(20, 0)] })]
    assert.deepEqual(exerciseHistory(sessions, 'bench'), [])
  })

  test('returns oldest first regardless of input order', () => {
    const sessions = [
      session('s2', '2026-08-08', { bench: [set(25, 10)] }),
      session('s1', '2026-08-01', { bench: [set(20, 10)] }),
    ]
    assert.deepEqual(
      exerciseHistory(sessions, 'bench').map((h) => h.date),
      ['2026-08-01', '2026-08-08']
    )
  })

  test('does not leak other exercises', () => {
    const sessions = [session('s1', '2026-08-01', { bench: [set(20, 10)], squat: [set(50, 10)] })]
    assert.equal(exerciseHistory(sessions, 'bench').length, 1)
    assert.equal(exerciseHistory(sessions, 'bench')[0].sets[0].weight, 20)
  })
})

describe('lastPerformance', () => {
  const sessions = [
    session('s1', '2026-08-01', { bench: [set(20, 10)] }),
    session('s2', '2026-08-08', { bench: [set(25, 10)] }),
  ]

  test('returns the most recent session', () => {
    assert.equal(lastPerformance(sessions, 'bench').date, '2026-08-08')
  })

  test('excludeSessionId skips today, so a card does not read itself', () => {
    assert.equal(lastPerformance(sessions, 'bench', { excludeSessionId: 's2' }).date, '2026-08-01')
  })

  test('null when the exercise has never been logged', () => {
    assert.equal(lastPerformance(sessions, 'deadlift'), null)
  })
})

describe('topSet', () => {
  test('picks the heaviest', () => {
    assert.equal(topSet([set(20, 12), set(30, 6), set(25, 10)]).weight, 30)
  })

  test('breaks ties on reps', () => {
    assert.equal(topSet([set(30, 6), set(30, 9)]).reps, 9)
  })
})

describe('suggestNext — double progression', () => {
  test('no history: starts light and flags it', () => {
    const s = suggestNext(EXERCISE, null)
    assert.equal(s.weight, FIRST_TIME_WEIGHT)
    assert.equal(s.reps, 10)
    assert.equal(s.isFirst, true)
  })

  test('cleared every target rep: add one increment', () => {
    const last = { sets: [set(20, 10), set(20, 10), set(20, 10)] }
    assert.equal(suggestNext(EXERCISE, last).weight, 25)
  })

  test('missed on the last set: hold the weight', () => {
    const last = { sets: [set(20, 10), set(20, 10), set(20, 8)] }
    assert.equal(suggestNext(EXERCISE, last).weight, 20)
  })

  test('exceeded reps also progresses', () => {
    const last = { sets: [set(20, 12), set(20, 11), set(20, 10)] }
    assert.equal(suggestNext(EXERCISE, last).weight, 25)
  })

  test('too few sets does not progress, even if every set cleared', () => {
    const last = { sets: [set(20, 10), set(20, 10)] }
    assert.equal(suggestNext(EXERCISE, last).weight, 20)
  })

  test('uses the exercise increment, not a constant', () => {
    const legPress = { ...EXERCISE, increment: 10 }
    const last = { sets: [set(90, 10), set(90, 10), set(90, 10)] }
    assert.equal(suggestNext(legPress, last).weight, 100)
  })

  test('fractional increments stay exact (no float drift)', () => {
    const pushdown = { ...EXERCISE, increment: 2.5 }
    const last = { sets: [set(27.5, 10), set(27.5, 10), set(27.5, 10)] }
    assert.equal(suggestNext(pushdown, last).weight, 30)
  })

  test('judges against the top set when a lighter back-off set is present', () => {
    // 25 is the working weight; the 20 is a back-off and must not veto progress.
    const last = { sets: [set(25, 10), set(25, 10), set(25, 10), set(20, 6)] }
    assert.equal(suggestNext(EXERCISE, last).weight, 30)
  })

  test('always suggests the target reps, not last time reps', () => {
    const last = { sets: [set(20, 6), set(20, 6), set(20, 6)] }
    assert.equal(suggestNext(EXERCISE, last).reps, 10)
  })
})

describe('personalBest and isPR', () => {
  const sessions = [
    session('s1', '2026-08-01', { bench: [set(20, 10)] }),
    session('s2', '2026-08-08', { bench: [set(25, 8)] }),
  ]

  test('best weight and best estimated 1RM can be different sets', () => {
    // 25x2 is the heaviest; 20x15 is the strongest showing (e1RM 30 vs 26.7).
    const mixed = [
      session('a', '2026-08-01', { bench: [set(20, 15)] }),
      session('b', '2026-08-08', { bench: [set(25, 2)] }),
    ]
    const pb = personalBest(mixed, 'bench')
    assert.equal(pb.weight.weight, 25, 'heaviest set')
    assert.equal(pb.e1rm.weight, 20, 'best estimated 1RM')
  })

  test('a heavier set is a PR', () => {
    assert.equal(isPR(sessions, 'bench', set(30, 5)), true)
  })

  test('a lighter, easier set is not', () => {
    assert.equal(isPR(sessions, 'bench', set(15, 5)), false)
  })

  test('same weight for more reps is a PR on estimated 1RM', () => {
    assert.equal(isPR(sessions, 'bench', set(25, 12)), true)
  })

  test('the first ever set counts as a PR', () => {
    assert.equal(isPR([], 'bench', set(10, 10)), true)
  })

  test('an unfinished set is never a PR', () => {
    assert.equal(isPR(sessions, 'bench', set(100, 10, false)), false)
  })

  test('excludeSessionId stops a set counting as its own predecessor', () => {
    // Without the exclusion, s2's own 25x8 would be the record to beat.
    assert.equal(isPR(sessions, 'bench', set(25, 8), { excludeSessionId: 's2' }), true)
  })
})

describe('formatSets', () => {
  test('collapses a shared weight', () => {
    assert.equal(formatSets([set(20, 10), set(20, 9), set(20, 8)], 'lb'), '20 lb × 10, 9, 8')
  })

  test('spells out each set when the weight changed', () => {
    assert.equal(formatSets([set(20, 10), set(25, 8)], 'lb'), '20×10, 25×8')
  })

  test('empty input is empty output, not a crash', () => {
    assert.equal(formatSets([], 'lb'), '')
    assert.equal(formatSets(undefined, 'lb'), '')
  })
})

describe('volume', () => {
  test('sums weight times reps over completed sets only', () => {
    assert.equal(volume([set(20, 10), set(20, 10, false)]), 200)
  })
})
