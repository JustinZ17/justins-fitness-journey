import { THEMES } from '../storage/schema.js'

/**
 * Each swatch is painted with its own theme's colors rather than a screenshot,
 * so the previews stay honest if a theme's tokens change.
 */
const PREVIEW = {
  midnight: { bg: '#07080b', card: '#1a1d26', accent: '#00e5a0', ink: '#f3f6fa' },
  daylight: { bg: '#faf9f7', card: '#eae8e4', accent: '#4a6fa5', ink: '#1b1b19' },
  aurora: { bg: 'linear-gradient(150deg,#6d28d9,#db2777)', card: 'rgba(255,255,255,0.3)', accent: '#fde047', ink: '#ffffff' },
  terra: { bg: '#f6f1e8', card: '#e5dbc9', accent: '#b5654a', ink: '#2e2a24' },
}

export function ThemePicker({ value, onChange }) {
  return (
    <div className="theme-grid">
      {THEMES.map((theme) => {
        const p = PREVIEW[theme.id]
        const selected = value === theme.id
        return (
          <button
            key={theme.id}
            type="button"
            className={`theme-card${selected ? ' selected' : ''}`}
            aria-pressed={selected}
            onClick={() => onChange(theme.id)}
          >
            <span className="swatch" style={{ background: p.bg }}>
              <span className="swatch-dots">
                <span className="swatch-dot" style={{ background: p.accent }} />
                <span className="swatch-dot" style={{ background: p.card }} />
              </span>
              <span className="swatch-bar" style={{ background: p.accent, width: '65%' }} />
              <span className="swatch-bar" style={{ background: p.card, width: '85%' }} />
            </span>
            <span className="theme-name" style={selected ? { color: 'var(--accent)' } : undefined}>
              {theme.name}
            </span>
            <span className="theme-blurb">{theme.blurb}</span>
          </button>
        )
      })}
    </div>
  )
}
