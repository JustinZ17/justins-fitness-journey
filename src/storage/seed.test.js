import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { SEED, SEED_EXERCISES, SEED_WORKOUTS, DEFAULT_SETTINGS } from './schema.js'
import { guideFor } from '../lib/guides.js'

/**
 * The seed is Justin's real training day, and this file is public.
 *
 * The line drawn is: prescription yes, personal numbers no. That's a decision
 * about privacy, not correctness, so nothing about the code enforces it and a
 * later edit could undo it without anything looking wrong. These tests hold
 * the line.
 */

describe('seed carries the prescription', () => {
  test('Day 3 has the movements from the sheet, in order', () => {
    const day3 = SEED_WORKOUTS.find((w) => w.id === 'w-day3')
    const byId = new Map(SEED_EXERCISES.map((e) => [e.id, e]))
    assert.deepEqual(
      day3.exerciseIds.map((id) => byId.get(id).name),
      [
        'ATW',
        'Leg press',
        'Seated row (High)',
        'Chest press',
        'Lateral raise',
        'Bicep curl',
        'Tricep pushdown',
      ]
    )
  })

  test('the dumbbell split is kept alongside it for later', () => {
    for (const id of ['w-push', 'w-pull', 'w-legs']) {
      const workout = SEED_WORKOUTS.find((w) => w.id === id)
      assert.ok(workout, `${id} is missing`)
      assert.ok(workout.exerciseIds.length > 0, `${id} has no exercises`)
    }
  })

  test('every workout references exercises that exist', () => {
    // A dangling id renders as a missing card and is easy to introduce by hand.
    const ids = new Set(SEED_EXERCISES.map((e) => e.id))
    for (const workout of SEED_WORKOUTS) {
      for (const id of workout.exerciseIds) {
        assert.ok(ids.has(id), `"${workout.name}" points at unknown exercise "${id}"`)
      }
    }
  })

  test('exercise ids are unique', () => {
    const ids = SEED_EXERCISES.map((e) => e.id)
    assert.equal(ids.length, new Set(ids).size, 'duplicate exercise id in the seed')
  })

  test('keeps the coach notation', () => {
    const bySlot = Object.fromEntries(SEED_EXERCISES.map((e) => [e.slot, e]))
    assert.equal(bySlot.A1.tempo, '2100')
    assert.equal(bySlot.B1.tempo, '2002')
    assert.equal(bySlot.C1.tempo, '2100')
    assert.equal(bySlot.A1.restSeconds, 90)
  })

  test('the D group shares a letter so it renders as a tri-set', () => {
    const dGroup = SEED_EXERCISES.filter((e) => e.slot.startsWith('D'))
    assert.equal(dGroup.length, 3)
    assert.deepEqual(dGroup.map((e) => e.slot), ['D1', 'D2', 'D3'])
  })

  test('the primer carries no sets to log', () => {
    const atw = SEED_EXERCISES.find((e) => e.name === 'ATW')
    assert.equal(atw.kind, 'primer')
    assert.equal(atw.targetSets, 0)
  })

  test('every seeded exercise has a how-to guide', () => {
    for (const e of SEED_EXERCISES) {
      assert.ok(guideFor(e.name), `no guide for "${e.name}"`)
    }
  })

  test('Day 3 contains exactly the seven from the sheet', () => {
    const day3 = SEED_WORKOUTS.find((w) => w.id === 'w-day3')
    assert.equal(day3.exerciseIds.length, 7)
  })
})

describe('seed withholds the personal parts', () => {
  test('ships no working weights', () => {
    // Weights only ever reach storage through logged sessions.
    assert.deepEqual(SEED.sessions, [])
    for (const e of SEED_EXERCISES) {
      assert.ok(!('weight' in e), `"${e.name}" carries a weight`)
      assert.ok(!('startingWeight' in e), `"${e.name}" carries a starting weight`)
    }
  })

  test('ships no training schedule', () => {
    for (const [day, workoutId] of Object.entries(DEFAULT_SETTINGS.schedule)) {
      assert.equal(workoutId, null, `${day} is pre-assigned, revealing the training week`)
    }
  })

  test('ships no logged history of any kind', () => {
    assert.deepEqual(SEED.foodEntries, [])
    assert.deepEqual(SEED.bodyWeights, [])
  })
})
