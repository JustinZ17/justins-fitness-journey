import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { GUIDES, guideFor, guideKey } from './guides.js'
import { SEED_EXERCISES } from '../storage/schema.js'

/**
 * Guides attach by name, which is what makes them work across the seed data, an
 * imported coach's plan, and anything typed in later — but it also means a
 * rename silently drops the guide and an art typo silently renders nothing.
 * Neither throws, so only a test catches them.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const artSource = readFileSync(join(root, 'src/components/ExerciseArt.jsx'), 'utf8')

/** Keys of the `art` object in ExerciseArt.jsx. */
function availableArt() {
  const block = artSource.slice(artSource.indexOf('const art = {'))
  return new Set([...block.matchAll(/^ {2}(\w+): \(/gm)].map((m) => m[1]))
}

describe('guideKey', () => {
  test('strips qualifiers so plan-specific names still match', () => {
    assert.equal(guideKey('Seated row (High)'), 'seated row')
    assert.equal(guideKey('Seated Row'), 'seated row')
  })

  test('normalises punctuation and spacing', () => {
    assert.equal(guideKey('One-Arm  Dumbbell Row'), 'one arm dumbbell row')
    assert.equal(guideKey('  ATW '), 'atw')
  })

  test('survives empty input', () => {
    assert.equal(guideKey(''), '')
    assert.equal(guideKey(undefined), '')
  })
})

describe('guide content', () => {
  const art = availableArt()

  test('every guide names a drawing that exists', () => {
    for (const [key, guide] of Object.entries(GUIDES)) {
      assert.ok(art.has(guide.art), `"${key}" points at missing art "${guide.art}"`)
    }
  })

  test('every guide has all four sections filled in', () => {
    for (const [key, guide] of Object.entries(GUIDES)) {
      for (const field of ['find', 'setup', 'execute', 'mistake']) {
        assert.ok(guide[field]?.length > 20, `"${key}" has a thin or missing "${field}"`)
      }
    }
  })
})

describe('coverage', () => {
  test('every seeded exercise resolves to a guide', () => {
    for (const exercise of SEED_EXERCISES) {
      assert.ok(guideFor(exercise.name), `no guide for seeded exercise "${exercise.name}"`)
    }
  })

  /**
   * The names Justin's trainer used. They live in an imported backup rather
   * than this repo, so nothing else would notice if a rename broke them.
   */
  test("the trainer plan's exercise names resolve", () => {
    const planNames = [
      'ATW',
      'Leg press',
      'Seated row (High)',
      'Chest press',
      'Lateral raise',
      'Bicep curl',
      'Tricep pushdown',
    ]
    for (const name of planNames) {
      assert.ok(guideFor(name), `no guide for "${name}"`)
    }
  })

  test('an unknown exercise returns null rather than throwing', () => {
    assert.equal(guideFor('Nordic Ham Curl'), null)
    assert.equal(guideFor(''), null)
  })

  test('common alternative names resolve to the same guide', () => {
    assert.equal(guideFor('Dumbbell Curl'), guideFor('Bicep Curl'))
    assert.equal(guideFor('Seated Cable Row'), guideFor('Seated row (High)'))
    assert.equal(guideFor('RDL'), guideFor('Dumbbell Romanian Deadlift'))
    assert.equal(guideFor('Triceps Pushdown'), guideFor('Tricep pushdown'))
  })

  test('every alias points at a guide that exists', () => {
    // A typo on the right-hand side would resolve to undefined and silently
    // show no guide at all.
    for (const name of ['Dumbbell Curl', 'Lat Raise', 'Hip Thrust', 'Around the world']) {
      assert.ok(guideFor(name), `alias for "${name}" leads nowhere`)
    }
  })
})
