import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { migrateSeed } from './migrate.js'
import { SEED, SEED_VERSION, DEFAULT_SETTINGS } from './schema.js'

/**
 * This is the only code that rewrites data already on a device, so both
 * branches need proving: the one that replaces a program, and the one that
 * must not disturb a single logged set.
 */

const oldInstall = (overrides = {}) => ({
  settings: { ...DEFAULT_SETTINGS, seedVersion: 1, schedule: { ...DEFAULT_SETTINGS.schedule, mon: 'w-push' } },
  exercises: [
    { id: 'e-db-bench', name: 'Dumbbell Bench Press', targetSets: 3, targetReps: 10 },
    { id: 'e-goblet-squat', name: 'Goblet Squat', targetSets: 3, targetReps: 10 },
  ],
  workouts: [{ id: 'w-push', name: 'Push Day', exerciseIds: ['e-db-bench'] }],
  sessions: [],
  ...overrides,
})

const session = () => ({
  id: 's1',
  date: '2026-08-01',
  workoutId: 'w-push',
  completed: [
    { exerciseId: 'e-db-bench', done: true, sets: [{ weight: 20, reps: 10, done: true }] },
  ],
})

describe('nothing logged yet', () => {
  const result = migrateSeed(oldInstall())

  test('replaces the program with the current default', () => {
    assert.deepEqual(
      result.exercises.map((e) => e.name),
      SEED.exercises.map((e) => e.name)
    )
    assert.ok(result.exercises.some((e) => e.name === 'ATW'))
  })

  test('ends up with exactly the current default routines', () => {
    assert.deepEqual(
      result.workouts.map((w) => w.id),
      SEED.workouts.map((w) => w.id)
    )
  })

  test('clears a schedule that pointed at workouts which no longer exist', () => {
    // Left alone it would resolve to nothing and read as a permanent rest week.
    assert.ok(Object.values(result.settings.schedule).every((v) => v === null))
  })
})

describe('history exists', () => {
  const result = migrateSeed(oldInstall({ sessions: [session()] }))

  test('keeps every existing exercise', () => {
    // Removing one would strip the name off logged sets and drop those weights
    // out of the progression maths.
    for (const id of ['e-db-bench', 'e-goblet-squat']) {
      assert.ok(result.exercises.some((e) => e.id === id), `${id} was removed`)
    }
  })

  test('adds the new program alongside it', () => {
    assert.ok(result.exercises.some((e) => e.name === 'ATW'))
    assert.ok(result.workouts.some((w) => w.id === 'w-day3'))
  })

  test('keeps the existing routines and schedule', () => {
    assert.ok(result.workouts.some((w) => w.id === 'w-push'))
    assert.equal(result.settings.schedule.mon, 'w-push')
  })

  test('adds no duplicates', () => {
    const ids = result.exercises.map((e) => e.id)
    assert.equal(ids.length, new Set(ids).size)
  })
})

describe('idempotence', () => {
  test('does nothing once already at the current version', () => {
    assert.equal(migrateSeed(oldInstall({ settings: { seedVersion: SEED_VERSION } })), null)
  })

  test('running twice changes nothing the second time', () => {
    const first = migrateSeed(oldInstall())
    const after = { ...oldInstall(), ...first }
    assert.equal(migrateSeed(after), null)
  })

  test('a fresh install is already current and needs no migration', () => {
    assert.equal(migrateSeed({ settings: DEFAULT_SETTINGS, ...SEED }), null)
  })
})
