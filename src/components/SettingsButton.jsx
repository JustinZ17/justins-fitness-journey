import { useStore } from '../storage/StoreProvider.jsx'
import { isBackupStale } from '../lib/backup.js'
import { GearIcon } from './Icons.jsx'

/**
 * The settings button, with a dot when a backup is overdue.
 *
 * A dot rather than a banner: losing everything is the worst thing that can
 * happen to this app, but it isn't urgent on any given day, and a nag on the
 * Today screen would be noise exactly when you're mid-set.
 */
export function SettingsButton({ onClick }) {
  const { settings, sessions, foodEntries } = useStore()
  const stale = isBackupStale(settings, sessions.length > 0 || foodEntries.length > 0)

  return (
    <button
      type="button"
      className={`icon-btn${stale ? ' has-dot' : ''}`}
      aria-label={stale ? 'Settings — backup overdue' : 'Settings'}
      onClick={onClick}
    >
      <GearIcon />
    </button>
  )
}
