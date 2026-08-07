import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { todayISO, isoToDate, dayKey, lastNDays, relativeDay } from './date.js'

/**
 * The whole point of this module is that it never touches UTC. An evening
 * workout landing on tomorrow's date is a silent, confusing data bug.
 */

describe('todayISO', () => {
  test('formats local calendar parts, zero-padded', () => {
    assert.equal(todayISO(new Date(2026, 7, 6, 12, 0, 0)), '2026-08-06')
    assert.equal(todayISO(new Date(2026, 0, 5, 12, 0, 0)), '2026-01-05')
  })

  test('late evening stays on today, unlike toISOString', () => {
    // 11pm local. In any timezone behind UTC, toISOString() rolls to tomorrow.
    const lateNight = new Date(2026, 7, 6, 23, 30, 0)
    assert.equal(todayISO(lateNight), '2026-08-06')
  })

  test('early morning stays on today too', () => {
    // 12:30am local rolls *backwards* under UTC for zones ahead of it.
    assert.equal(todayISO(new Date(2026, 7, 6, 0, 30, 0)), '2026-08-06')
  })

  test('round-trips through isoToDate', () => {
    const iso = '2026-08-06'
    assert.equal(todayISO(isoToDate(iso)), iso)
  })
})

describe('isoToDate', () => {
  test('produces local midnight, not UTC midnight', () => {
    const d = isoToDate('2026-08-06')
    assert.equal(d.getFullYear(), 2026)
    assert.equal(d.getMonth(), 7)
    assert.equal(d.getDate(), 6)
    assert.equal(d.getHours(), 0)
  })
})

describe('dayKey', () => {
  test('maps dates to the schedule keys', () => {
    assert.equal(dayKey('2026-08-06'), 'thu')
    assert.equal(dayKey('2026-08-08'), 'sat')
    assert.equal(dayKey('2026-08-09'), 'sun')
  })
})

describe('lastNDays', () => {
  const from = new Date(2026, 7, 6)

  test('returns n days, oldest first, ending today', () => {
    const days = lastNDays(5, from)
    assert.equal(days.length, 5)
    assert.equal(days[0], '2026-08-02')
    assert.equal(days[4], '2026-08-06')
  })

  test('crosses a month boundary correctly', () => {
    const days = lastNDays(3, new Date(2026, 7, 2))
    assert.deepEqual(days, ['2026-07-31', '2026-08-01', '2026-08-02'])
  })

  test('30 days for the protein chart', () => {
    assert.equal(lastNDays(30, from).length, 30)
  })
})

describe('relativeDay', () => {
  const from = new Date(2026, 7, 6)

  test('names the recent past', () => {
    assert.equal(relativeDay('2026-08-06', from), 'Today')
    assert.equal(relativeDay('2026-08-05', from), 'Yesterday')
    assert.equal(relativeDay('2026-08-03', from), '3 days ago')
  })

  test('falls back to a date for anything older', () => {
    assert.match(relativeDay('2026-06-01', from), /Jun/)
  })
})
