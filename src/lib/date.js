import { DAYS } from '../storage/schema.js'

/**
 * Local-timezone date helpers.
 *
 * Never use toISOString() for these — it converts to UTC first, so anyone west
 * of UTC gets tomorrow's date after 5pm and their evening workout lands on the
 * wrong day.
 */

export function todayISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 'YYYY-MM-DD' -> Date at local midnight (not UTC midnight). */
export function isoToDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 'YYYY-MM-DD' -> 'mon' | 'tue' | ... , matching Settings.schedule keys. */
export function dayKey(iso) {
  return DAYS[isoToDate(iso).getDay()]
}

/** 'YYYY-MM-DD' -> 'Thursday, Aug 6' */
export function formatLong(iso) {
  return isoToDate(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/** 'YYYY-MM-DD' -> 'Aug 6' */
export function formatShort(iso) {
  return isoToDate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Oldest-first list of the last n ISO dates, ending today. */
export function lastNDays(n, from = new Date()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - i)
    out.push(todayISO(d))
  }
  return out
}

/** Whole days between two ISO dates, or since an ISO timestamp. Null if absent. */
export function daysSince(iso, from = new Date()) {
  if (!iso) return null
  const then = iso.length > 10 ? todayISO(new Date(iso)) : iso
  return Math.round((isoToDate(todayISO(from)) - isoToDate(then)) / 86400000)
}

/** Shift an ISO date by n days, staying in local time. */
export function addDays(iso, n) {
  const d = isoToDate(iso)
  d.setDate(d.getDate() + n)
  return todayISO(d)
}

/** Human relative label for a past date: 'Today', 'Yesterday', '3 days ago'. */
export function relativeDay(iso, from = new Date()) {
  const days = Math.round((isoToDate(todayISO(from)) - isoToDate(iso)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'Last week'
  return formatShort(iso)
}
