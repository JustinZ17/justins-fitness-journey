import { daysSince } from './date.js'

/**
 * How long before a backup counts as stale.
 *
 * iOS evicts localStorage for web apps left unused for roughly seven days, and
 * there is no server copy — so the nudge lands before that window rather than
 * after. Ten days is a compromise: long enough not to nag someone training
 * three times a week, short enough to matter before a holiday.
 */
export const BACKUP_STALE_DAYS = 10

/** True when it's worth prompting for an export. */
export function isBackupStale(settings, hasData) {
  if (!hasData) return false
  const since = daysSince(settings?.lastExportAt)
  return since === null || since >= BACKUP_STALE_DAYS
}
