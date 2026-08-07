import { daysSince, todayISO } from './date.js'

/**
 * How long before a backup counts as stale.
 *
 * Note this is a prompt, not a deadline. The much-repeated "iOS clears storage
 * after 7 days" is an ITP rule for sites browsed in Safari; web apps added to
 * the home screen have their own storage and are exempt. What can still take
 * the data is deleting the app, storage pressure, or an OS fault — rarer, but
 * total, and there is no server copy. Hence a nudge rather than an alarm.
 */
export const BACKUP_STALE_DAYS = 10

/** True when it's worth prompting for an export. */
export function isBackupStale(settings, hasData) {
  if (!hasData) return false
  const since = daysSince(settings?.lastExportAt)
  return since === null || since >= BACKUP_STALE_DAYS
}

/**
 * Ask the browser to keep this data.
 *
 * Persistent storage is exempt from automatic eviction. Safari grants or
 * refuses on its own criteria without prompting, so this is a request, not a
 * guarantee — but the app never asked at all before, which was simply a gap.
 */
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return { supported: false, persisted: false }
    if (await navigator.storage.persisted?.()) return { supported: true, persisted: true }
    return { supported: true, persisted: await navigator.storage.persist() }
  } catch {
    return { supported: false, persisted: false }
  }
}

/** Current persistence state, without asking again. */
export async function persistenceStatus() {
  try {
    if (!navigator.storage?.persisted) return 'unsupported'
    return (await navigator.storage.persisted()) ? 'granted' : 'not granted'
  } catch {
    return 'unknown'
  }
}

/**
 * Build the backup and hand it to the browser as a download.
 *
 * Shared by Settings and the overdue banner — two copies of a data-export path
 * is exactly the kind of duplication that drifts into one of them being subtly
 * wrong.
 */
export function downloadBackup(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fitness-backup-${todayISO()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke late; Safari needs the URL alive past the click.
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
