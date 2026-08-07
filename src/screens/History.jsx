import { useMemo, useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import {
  estimated1RM,
  exerciseHistory,
  formatSets,
  personalBest,
  topSet,
  volume,
} from '../lib/progression.js'
import { formatShort, isoToDate, lastNDays, relativeDay, todayISO } from '../lib/date.js'
import { LineChart, BarChart } from '../components/Chart.jsx'
import { ChevronIcon, GearIcon } from '../components/Icons.jsx'

const round = (n) => Math.round(n * 10) / 10

export function History({ onOpenSettings }) {
  const { sessions, exercises, workouts, foods, foodEntries, settings } = useStore()
  const unit = settings.unit

  const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  const workoutsById = useMemo(() => new Map(workouts.map((w) => [w.id, w])), [workouts])

  // Only exercises with real logged work can be charted.
  const trackable = useMemo(
    () =>
      exercises
        .map((e) => ({ exercise: e, history: exerciseHistory(sessions, e.id) }))
        .filter((t) => t.history.length > 0)
        .sort((a, b) => {
          const la = a.history[a.history.length - 1].date
          const lb = b.history[b.history.length - 1].date
          return lb.localeCompare(la)
        }),
    [exercises, sessions]
  )

  const [selectedId, setSelectedId] = useState(null)
  const selected = trackable.find((t) => t.exercise.id === selectedId) ?? trackable[0] ?? null

  // Sessions where something was actually done — auto-created empty ones don't
  // belong in a history list.
  const logged = useMemo(
    () =>
      sessions
        .filter((s) => s.completed?.some((c) => c.done))
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [sessions]
  )

  return (
    <div className="screen">
      <div className="container">
        <header className="page-head">
          <div>
            <p className="eyebrow">Your training</p>
            <div className="title-btn" style={{ cursor: 'default' }}>
              <h1>History</h1>
            </div>
          </div>
          <button type="button" className="icon-btn" aria-label="Settings" onClick={onOpenSettings}>
            <GearIcon />
          </button>
        </header>

        <ProgressSection
          trackable={trackable}
          selected={selected}
          onSelect={setSelectedId}
          sessions={sessions}
          unit={unit}
        />

        <ProteinSection foods={foods} foodEntries={foodEntries} target={settings.proteinTarget} />

        <SessionsSection
          logged={logged}
          exercisesById={exercisesById}
          workoutsById={workoutsById}
          unit={unit}
        />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- charts -- */

function ProgressSection({ trackable, selected, onSelect, sessions, unit }) {
  const [metric, setMetric] = useState('weight')

  if (!selected) {
    return (
      <section className="section">
        <div className="section-head">
          <h2>Progress</h2>
        </div>
        <div className="empty">
          <p style={{ marginBottom: 0 }}>
            Nothing logged yet. Finish a workout and your weights will chart here.
          </p>
        </div>
      </section>
    )
  }

  const { exercise, history } = selected

  const points = history.map((h) => {
    const top = topSet(h.sets)
    return {
      x: isoToDate(h.date).getTime(),
      y: metric === 'weight' ? top.weight : round(estimated1RM(top.weight, top.reps)),
      date: h.date,
    }
  })

  const first = points[0]
  const last = points[points.length - 1]
  const delta = round(last.y - first.y)
  const pb = personalBest(sessions, exercise.id)

  return (
    <section className="section">
      <div className="section-head">
        <h2>Progress</h2>
        <div className="segmented">
          <button
            type="button"
            className={metric === 'weight' ? 'on' : ''}
            onClick={() => setMetric('weight')}
          >
            Weight
          </button>
          <button
            type="button"
            className={metric === 'e1rm' ? 'on' : ''}
            onClick={() => setMetric('e1rm')}
          >
            Est. 1RM
          </button>
        </div>
      </div>

      <div className="card chart-card">
        <select
          className="input chart-picker"
          value={exercise.id}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Choose an exercise to chart"
        >
          {trackable.map((t) => (
            <option key={t.exercise.id} value={t.exercise.id}>
              {t.exercise.name}
            </option>
          ))}
        </select>

        <div className="chart-head">
          <div>
            <span className="chart-big">
              {last.y}
              <small> {unit}</small>
            </span>
            <span className="chart-sub">
              {history.length === 1
                ? 'first session'
                : `${delta >= 0 ? '+' : ''}${delta} ${unit} since ${formatShort(first.date)}`}
            </span>
          </div>
          {pb && (
            <div className="chart-pb">
              <span className="chart-pb-label">Best</span>
              <span className="chart-pb-value">
                {pb.weight.weight} {unit} × {pb.weight.reps}
              </span>
            </div>
          )}
        </div>

        {/* todayISO, not toISOString: these are local-midnight timestamps, and
            converting via UTC shifts the label a day in zones ahead of UTC. */}
        <LineChart
          points={points}
          formatX={(x) => formatShort(todayISO(new Date(x)))}
          formatY={(v) => Math.round(v)}
          unit={` ${unit}`}
        />

        <p className="chart-foot">
          {metric === 'weight'
            ? 'Heaviest set each session.'
            : 'Estimated one-rep max — a way to compare sessions when the reps changed, not a lift to attempt.'}
        </p>
      </div>
    </section>
  )
}

function ProteinSection({ foods, foodEntries, target }) {
  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])

  const bars = useMemo(() => {
    const byDay = new Map(lastNDays(30).map((d) => [d, 0]))
    for (const entry of foodEntries) {
      if (!byDay.has(entry.date)) continue
      const food = foodsById.get(entry.foodId)
      if (!food) continue
      byDay.set(entry.date, byDay.get(entry.date) + (food.proteinPer100g * entry.grams) / 100)
    }
    return [...byDay.entries()].map(([x, y]) => ({ x, y }))
  }, [foodEntries, foodsById])

  const logged = bars.filter((b) => b.y > 0)
  const average = logged.length ? logged.reduce((s, b) => s + b.y, 0) / logged.length : 0
  const hit = bars.filter((b) => b.y >= target).length

  return (
    <section className="section">
      <div className="section-head">
        <h2>Protein · 30 days</h2>
      </div>
      <div className="card chart-card">
        <div className="chart-head">
          <div>
            <span className="chart-big">
              {Math.round(average)}
              <small> g avg</small>
            </span>
            <span className="chart-sub">
              {logged.length ? `across ${logged.length} logged days` : 'nothing logged yet'}
            </span>
          </div>
          <div className="chart-pb">
            <span className="chart-pb-label">Target hit</span>
            <span className="chart-pb-value">{hit} days</span>
          </div>
        </div>
        <BarChart bars={bars} target={target} />
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- sessions - */

function SessionsSection({ logged, exercisesById, workoutsById, unit }) {
  const [openId, setOpenId] = useState(null)

  return (
    <section className="section">
      <div className="section-head">
        <h2>Sessions</h2>
        <span className="count-pill">{logged.length}</span>
      </div>

      {logged.length === 0 ? (
        <div className="empty">
          <p style={{ marginBottom: 0 }}>No finished sessions yet.</p>
        </div>
      ) : (
        logged.map((session) => {
          const done = session.completed.filter((c) => c.done)
          const total = done.reduce((sum, c) => sum + volume(c.sets), 0)
          const open = openId === session.id

          return (
            <div className="card session" key={session.id}>
              <button
                type="button"
                className="session-row"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : session.id)}
              >
                <span className="session-body">
                  <span className="session-name">
                    {workoutsById.get(session.workoutId)?.name ?? 'Session'}
                  </span>
                  <span className="session-meta">
                    {relativeDay(session.date)} · {done.length} exercise
                    {done.length === 1 ? '' : 's'}
                    {total > 0 && ` · ${Math.round(total).toLocaleString()} ${unit} moved`}
                  </span>
                </span>
                <ChevronIcon className={open ? 'flip' : ''} />
              </button>

              {open && (
                <div className="session-detail">
                  {done.map((entry) => {
                    const exercise = exercisesById.get(entry.exerciseId)
                    const sets = entry.sets.filter((s) => s.done && s.weight > 0)
                    return (
                      <div className="session-line" key={entry.exerciseId}>
                        <span className="session-ex">{exercise?.name ?? 'Removed exercise'}</span>
                        <span className="session-sets">
                          {sets.length ? formatSets(sets, unit) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </section>
  )
}
