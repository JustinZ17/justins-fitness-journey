import { Component } from 'react'
import { COLLECTIONS } from '../storage/schema.js'

/**
 * A render crash must never strand the data.
 *
 * There is no server copy: every session and food entry lives in this device's
 * localStorage. A white screen would leave it technically present but
 * unreachable, so this reads the raw keys directly — no store, no hooks,
 * nothing that could be implicated in the crash — and offers a download.
 */
export class ErrorBoundary extends Component {
  state = { error: null, saved: false }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[fitness] render crashed', error, info)
  }

  rescueData = () => {
    try {
      const data = {}
      for (const name of Object.keys(COLLECTIONS)) {
        const raw = localStorage.getItem(`jfj:${COLLECTIONS[name]}`)
        data[name] = raw ? JSON.parse(raw) : null
      }
      const payload = {
        app: 'justins-fitness-journey',
        version: 2,
        exportedAt: new Date().toISOString(),
        recoveredFromCrash: true,
        data,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fitness-rescue-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
      this.setState({ saved: true })
    } catch (err) {
      console.error('[fitness] rescue export failed', err)
      alert(`Could not build the backup: ${err.message}`)
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="screen">
        <div className="container crash">
          <h1>Something broke</h1>
          <p className="crash-lead">
            The app hit an error while drawing the screen. Your logged data is still on this
            phone — save a copy before doing anything else.
          </p>

          <button type="button" className="btn primary full" onClick={this.rescueData}>
            Save my data
          </button>
          {this.state.saved && <p className="crash-ok">Saved. Keep that file somewhere safe.</p>}

          <button
            type="button"
            className="btn full"
            style={{ marginTop: 'var(--sp-3)' }}
            onClick={() => window.location.reload()}
          >
            Reload the app
          </button>

          <details className="crash-details">
            <summary>Error detail</summary>
            <pre>{String(this.state.error?.stack || this.state.error)}</pre>
          </details>
        </div>
      </div>
    )
  }
}
