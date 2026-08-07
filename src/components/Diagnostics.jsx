import { useEffect, useState } from 'react'

/**
 * Device readout, tucked away in Settings.
 *
 * Exists because layout bugs on an installed iOS web app are invisible from a
 * desktop browser — safe-area insets are always 0 there, and the viewport
 * behaves differently once the app leaves Safari. Guessing from screenshots
 * costs more round trips than just reading the numbers off the device.
 */
export function Diagnostics() {
  const [info, setInfo] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const measure = () => {
      const cs = getComputedStyle(document.documentElement)
      const app = document.querySelector('.app')
      const bar = document.querySelector('.tabbar')
      const appRect = app?.getBoundingClientRect()
      const barRect = bar?.getBoundingClientRect()

      setInfo({
        build: typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : 'dev',
        theme: document.documentElement.dataset.theme || '(unset)',
        // What iOS tints the status bar from, vs what's actually behind the
        // app. If these differ, the band across the top won't match.
        themeColor:
          document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '(none)',
        bodyBg: getComputedStyle(document.body).backgroundColor,
        standalone:
          window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true,
        innerH: window.innerHeight,
        clientH: document.documentElement.clientHeight,
        screenH: window.screen?.height ?? 0,
        dvh: Math.round((window.visualViewport?.height ?? window.innerHeight) * 10) / 10,
        safeTop: cs.getPropertyValue('--safe-top').trim(),
        safeBottom: cs.getPropertyValue('--safe-bottom').trim(),
        appH: appRect ? Math.round(appRect.height) : null,
        barBottom: barRect ? Math.round(barRect.bottom) : null,
        // Gap inside the viewport — a layout problem, fixable in CSS.
        deadStrip: barRect ? Math.round(window.innerHeight - barRect.bottom) : null,
        // Screen the web view was never given — an iOS chrome problem, and no
        // amount of CSS can reach it. Distinguishing the two took a round trip.
        screenGap: (window.screen?.height ?? 0) - window.innerHeight,
      })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  if (!info) return null

  const text = Object.entries(info)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return (
    <details className="diag">
      <summary>Diagnostics</summary>
      <dl className="diag-list">
        {Object.entries(info).map(([k, v]) => (
          <div
            key={k}
            className={(k === 'deadStrip' || k === 'screenGap') && v !== 0 ? 'diag-bad' : undefined}
          >
            <dt>{k}</dt>
            <dd>{String(v)}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="btn full"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
          } catch {
            // Clipboard needs a secure context and can still be refused; the
            // values are on screen either way.
            setCopied(false)
          }
        }}
      >
        {copied ? 'Copied' : 'Copy for Claude'}
      </button>
    </details>
  )
}
