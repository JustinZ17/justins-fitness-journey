import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Two small charts, hand-drawn as SVG. No charting library — these are a few
 * dozen lines of arithmetic and the bundle stays tiny.
 *
 * They render at measured pixel width rather than scaling a fixed viewBox, so
 * strokes and text stay crisp and never distort on a phone.
 */

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  return [ref, width]
}

/**
 * points: [{ x: number, y: number, label?: string }] — x is any numeric scale
 * (we pass timestamps, so gaps between sessions show as real gaps).
 */
export function LineChart({ points, height = 180, formatX, formatY = (v) => v, unit = '' }) {
  const [ref, width] = useWidth()

  const pad = { top: 16, right: 14, bottom: 22, left: 38 }
  const innerW = Math.max(0, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom

  let body = null

  if (width > 0 && points.length > 0) {
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)

    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const spanX = maxX - minX

    let minY = Math.min(...ys)
    let maxY = Math.max(...ys)
    if (minY === maxY) {
      // A flat line still deserves to be drawn in the middle, not on an edge.
      minY -= 5
      maxY += 5
    } else {
      const breathing = (maxY - minY) * 0.18
      minY -= breathing
      maxY += breathing
    }
    minY = Math.max(0, minY)
    const spanY = maxY - minY || 1

    // Single session: no range to spread across, so pin it centre-left.
    const px = (x) => (spanX === 0 ? pad.left + innerW / 2 : pad.left + ((x - minX) / spanX) * innerW)
    const py = (y) => pad.top + innerH - ((y - minY) / spanY) * innerH

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x)},${py(p.y)}`).join(' ')
    const area =
      points.length > 1
        ? `${line} L${px(maxX)},${pad.top + innerH} L${px(minX)},${pad.top + innerH} Z`
        : ''

    const last = points[points.length - 1]

    body = (
      <>
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal guides at min / mid / max */}
        {[0, 0.5, 1].map((t) => {
          const y = pad.top + innerH * t
          const value = maxY - (maxY - minY) * t
          return (
            <g key={t}>
              <line
                x1={pad.left}
                y1={y}
                x2={width - pad.right}
                y2={y}
                stroke="var(--line)"
                strokeWidth="1"
              />
              <text x={pad.left - 7} y={y + 3.5} textAnchor="end" className="chart-label">
                {formatY(value)}
              </text>
            </g>
          )
        })}

        {area && <path d={area} fill="url(#lc-fill)" />}

        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={px(p.x)}
            cy={py(p.y)}
            r={i === points.length - 1 ? 4.5 : 3}
            fill={i === points.length - 1 ? 'var(--accent)' : 'var(--bg)'}
            stroke="var(--accent)"
            strokeWidth="2"
          />
        ))}

        {formatX && (
          <>
            <text x={pad.left} y={height - 6} textAnchor="start" className="chart-label">
              {formatX(minX)}
            </text>
            {spanX > 0 && (
              <text x={width - pad.right} y={height - 6} textAnchor="end" className="chart-label">
                {formatX(maxX)}
              </text>
            )}
          </>
        )}

        <title>{`Latest: ${formatY(last.y)}${unit}`}</title>
      </>
    )
  }

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Progress over time">
          {body}
        </svg>
      )}
    </div>
  )
}

/** bars: [{ x: string, y: number }] — one per day, oldest first. */
export function BarChart({ bars, target, height = 150, formatY = (v) => Math.round(v) }) {
  const [ref, width] = useWidth()

  const pad = { top: 14, right: 10, bottom: 18, left: 34 }
  const innerW = Math.max(0, width - pad.left - pad.right)
  const innerH = height - pad.top - pad.bottom

  let body = null

  if (width > 0 && bars.length > 0) {
    // Round the ceiling to a clean number so the axis reads "140", not "134.4".
    const raw = Math.max(target || 0, ...bars.map((b) => b.y)) * 1.12 || 1
    const maxY = Math.ceil(raw / 10) * 10
    const slot = innerW / bars.length
    const barW = Math.max(2, slot - 2)
    const py = (y) => pad.top + innerH - (y / maxY) * innerH

    body = (
      <>
        {[0, 1].map((t) => {
          const y = pad.top + innerH * t
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--line)" />
              <text x={pad.left - 6} y={y + 3.5} textAnchor="end" className="chart-label">
                {formatY(t === 0 ? maxY : 0)}
              </text>
            </g>
          )
        })}

        {bars.map((b, i) => {
          const h = b.y > 0 ? Math.max(2, pad.top + innerH - py(b.y)) : 0
          return (
            <rect
              key={b.x}
              x={pad.left + i * slot + (slot - barW) / 2}
              y={pad.top + innerH - h}
              width={barW}
              height={h}
              rx={Math.min(2, barW / 2)}
              fill={target && b.y >= target ? 'var(--accent)' : 'var(--line-strong)'}
            />
          )
        })}

        {target > 0 && (
          <line
            x1={pad.left}
            y1={py(target)}
            x2={width - pad.right}
            y2={py(target)}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.85"
          />
        )}
      </>
    )
  }

  return (
    <div ref={ref} className="chart">
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Daily protein, last 30 days">
          {body}
        </svg>
      )}
    </div>
  )
}
