import { useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { isBackupStale, downloadBackup } from '../lib/backup.js'

/**
 * Prompt to export when a backup is overdue.
 *
 * Sits on Today rather than hiding in Settings, because the old signal — a 9px
 * dot on the gear — only got noticed by someone already heading to back up.
 *
 * Dismissible, and the dismissal lasts the session: seeing this mid-workout is
 * the wrong moment, and a warning that can't be silenced becomes wallpaper.
 */
export function BackupBanner() {
  const { settings, sessions, foodEntries, exportAll, updateSettings } = useStore()
  const [dismissed, setDismissed] = useState(false)
  const [done, setDone] = useState(false)

  const hasData = sessions.length > 0 || foodEntries.length > 0
  if (dismissed || done || !isBackupStale(settings, hasData)) return null

  const save = () => {
    try {
      downloadBackup(exportAll())
      updateSettings({ lastExportAt: new Date().toISOString() })
      setDone(true)
    } catch (err) {
      console.error('[fitness] backup failed', err)
      alert(`Could not build the backup: ${err.message}`)
    }
  }

  return (
    <div className="backup-banner" role="status">
      <div className="backup-banner-text">
        <strong>Back up your training</strong>
        <span>
          {settings.lastExportAt
            ? "It's been a while since you saved a copy."
            : "You've never saved a copy. It only lives on this device."}
        </span>
      </div>
      <div className="backup-banner-actions">
        <button type="button" className="btn primary" onClick={save}>
          Save a copy
        </button>
        <button
          type="button"
          className="link-btn"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss backup reminder"
        >
          Later
        </button>
      </div>
    </div>
  )
}
