import { useState } from 'react'

/**
 * Number control for mid-set use: two oversized targets and a value you can
 * still type into if you want to. The buttons are the primary path — typing is
 * the escape hatch, not the workflow.
 */
export function Stepper({ value, onChange, step = 5, min = 0, max = 9999, label, variant = 'weight' }) {
  // draft is non-null only while the field is focused; it owns the display then,
  // so outside updates (the suggestion chip) don't yank text mid-edit.
  const [draft, setDraft] = useState(null)

  const clamp = (n) => Math.min(max, Math.max(min, n))
  const round = (n) => Math.round(n * 100) / 100

  const bump = (dir) => onChange(clamp(round((Number(value) || 0) + dir * step)))

  const commit = () => {
    if (draft === null) return
    const parsed = parseFloat(draft.replace(',', '.'))
    onChange(Number.isFinite(parsed) ? clamp(round(parsed)) : value)
    setDraft(null)
  }

  return (
    <div className={`stepper ${variant}`}>
      <button type="button" onClick={() => bump(-1)} aria-label={`Decrease ${label}`}>
        −
      </button>
      <input
        className="value"
        inputMode="decimal"
        aria-label={label}
        value={draft ?? String(value ?? 0)}
        onFocus={(e) => {
          setDraft(String(value ?? 0))
          requestAnimationFrame(() => e.target.select())
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <button type="button" onClick={() => bump(1)} aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  )
}
