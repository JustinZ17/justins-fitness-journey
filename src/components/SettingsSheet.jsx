import { useRef, useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { ThemePicker } from './ThemePicker.jsx'
import { Diagnostics } from './Diagnostics.jsx'
import { useStore } from '../storage/StoreProvider.jsx'
import { daysSince, todayISO } from '../lib/date.js'
import { BACKUP_STALE_DAYS } from '../lib/backup.js'

/**
 * Export/import is not a nice-to-have. iOS evicts localStorage for PWAs that go
 * unused for about a week, and there is no server copy — this sheet is the only
 * durable backup path in the app.
 */
export function SettingsSheet({ onClose }) {
  const { settings, updateSettings, bodyWeights, exportAll, importAll } = useStore()
  const [target, setTarget] = useState(String(settings.proteinTarget))
  const [status, setStatus] = useState(null)
  const fileRef = useRef(null)

  const latestWeight = bodyWeights.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  const sinceExport = daysSince(settings.lastExportAt)
  const backupStale = sinceExport === null || sinceExport >= BACKUP_STALE_DAYS

  const commitTarget = () => {
    const n = Math.round(Number(target))
    if (Number.isFinite(n) && n > 0) updateSettings({ proteinTarget: n })
    else setTarget(String(settings.proteinTarget))
  }

  const handleExport = () => {
    try {
      const payload = exportAll()
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
      updateSettings({ lastExportAt: new Date().toISOString() })
      setStatus({ kind: 'ok', text: 'Backup downloaded. Keep it somewhere off this phone.' })
    } catch (err) {
      setStatus({ kind: 'error', text: `Export failed: ${err.message}` })
    }
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // let the same file be picked twice
    if (!file) return

    try {
      const payload = JSON.parse(await file.text())
      const counts = payload?.data
        ? `${payload.data.sessions?.length ?? 0} sessions, ${payload.data.foodEntries?.length ?? 0} food entries`
        : 'unknown contents'
      const ok = window.confirm(
        `Replace ALL current data with this backup?\n\n${file.name}\n${counts}\n\nThis cannot be undone.`
      )
      if (!ok) return

      await importAll(payload)
      setStatus({ kind: 'ok', text: 'Backup restored.' })
      setTarget(String(payload.data?.settings?.proteinTarget ?? settings.proteinTarget))
    } catch (err) {
      setStatus({ kind: 'error', text: `Import failed: ${err.message}` })
    }
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      {status && <div className={`alert ${status.kind}`}>{status.text}</div>}

      <div className="section-head">
        <h2>Theme</h2>
      </div>
      <ThemePicker
        value={settings.theme || 'midnight'}
        onChange={(theme) => updateSettings({ theme })}
      />

      <div className="section-head" style={{ marginTop: 'var(--sp-6)' }}>
        <h2>Targets</h2>
      </div>

      <label className="field">
        <span>Daily protein target (g)</span>
        <input
          className="input"
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onBlur={commitTarget}
        />
      </label>
      {latestWeight?.weight > 0 && (
        <p className="hint">
          At {latestWeight.weight} {settings.unit}, a common beginner target is about{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              const suggested = Math.round(latestWeight.weight)
              setTarget(String(suggested))
              updateSettings({ proteinTarget: suggested })
            }}
          >
            {Math.round(latestWeight.weight)} g
          </button>{' '}
          (≈1 g per {settings.unit}).
        </p>
      )}

      <label className="field">
        <span>Units</span>
        <select
          className="input"
          value={settings.unit}
          onChange={(e) => updateSettings({ unit: e.target.value })}
        >
          <option value="lb">Pounds (lb)</option>
          <option value="kg">Kilograms (kg)</option>
        </select>
      </label>
      <p className="hint">
        Changes the label only — it does not convert numbers you've already logged.
      </p>

      <div className="section-head" style={{ marginTop: 24 }}>
        <h2>Backup</h2>
      </div>
      <div className={`backup-status${backupStale ? ' stale' : ''}`}>
        {sinceExport === null
          ? 'Never backed up'
          : sinceExport === 0
            ? 'Last backup: today'
            : `Last backup: ${sinceExport} day${sinceExport === 1 ? '' : 's'} ago`}
      </div>
      <p className="hint">
        There is no server. If iOS clears this app's storage, an exported file is the only way
        back — and it clears storage for apps left unused for about a week.
      </p>

      <div className="sheet-row" style={{ marginBottom: 12 }}>
        <button type="button" className="btn primary" onClick={handleExport}>
          Export JSON
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleImportFile}
      />

      <Diagnostics />

      <button type="button" className="btn full" onClick={onClose} style={{ marginTop: 'var(--sp-4)' }}>
        Done
      </button>
    </Sheet>
  )
}
