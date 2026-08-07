import { useMemo, useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { useStore } from '../storage/StoreProvider.jsx'
import { DIRECT_PROTEIN_ID } from '../storage/schema.js'
import { PlusIcon } from './Icons.jsx'

const round = (n) => Math.round(n * 10) / 10
const proteinOf = (food, grams) => ((food?.proteinPer100g ?? 0) * grams) / 100

/**
 * Every food, one tap each.
 *
 * The quick-add row on Today only has space for a handful, which made it look
 * like the list of things you're allowed to log. This is the full set: tap to
 * log a normal serving, or open a row to change the amount first.
 */
export function AddFoodSheet({ date, onClose, onManageFoods }) {
  const { foods, addFoodEntry, addProteinDirect } = useStore()
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [grams, setGrams] = useState('')
  const [direct, setDirect] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return foods
      .filter((f) => f.id !== DIRECT_PROTEIN_ID && !f.archived)
      .filter((f) => !q || f.name.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
          (b.useCount || 0) - (a.useCount || 0) ||
          a.name.localeCompare(b.name)
      )
  }, [foods, query])

  const add = (food, amount) => {
    addFoodEntry(food.id, amount, date)
    onClose()
  }

  const openRow = (food) => {
    setExpandedId(food.id)
    setGrams(String(food.defaultServingGrams))
  }

  return (
    <Sheet title="Add protein" onClose={onClose}>
      <label className="field">
        <span>Straight from the label</span>
        <div className="sheet-row">
          <input
            className="input"
            inputMode="decimal"
            placeholder="grams of protein"
            value={direct}
            onChange={(e) => setDirect(e.target.value)}
          />
          <button
            type="button"
            className="btn primary"
            style={{ flex: '0 0 auto' }}
            disabled={!(Number(direct) > 0)}
            onClick={() => {
              addProteinDirect(Number(direct), date)
              onClose()
            }}
          >
            Add
          </button>
        </div>
      </label>

      <div className="divider">or pick a food</div>

      <input
        className="input"
        placeholder="Search your foods"
        value={query}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 'var(--sp-3)' }}
      />

      <div className="picker-list">
        {results.map((food) => {
          const open = expandedId === food.id
          return (
            <div key={food.id} className={`food-row${open ? ' open' : ''}`}>
              <div className="food-row-main">
                <button type="button" className="food-pick" onClick={() => add(food, food.defaultServingGrams)}>
                  <span>
                    <strong>
                      {food.pinned && <span className="pin-dot" aria-label="pinned" />}
                      {food.name}
                    </strong>
                    <small>
                      {food.defaultServingGrams} g ·{' '}
                      {round(proteinOf(food, food.defaultServingGrams))} g protein
                    </small>
                  </span>
                  <PlusIcon />
                </button>
                <button
                  type="button"
                  className="food-amount"
                  aria-label={`Change amount for ${food.name}`}
                  onClick={() => (open ? setExpandedId(null) : openRow(food))}
                >
                  g
                </button>
              </div>

              {open && (
                <div className="food-row-edit">
                  <input
                    className="input"
                    inputMode="decimal"
                    autoFocus
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn primary"
                    disabled={!(Number(grams) > 0)}
                    onClick={() => add(food, Number(grams))}
                  >
                    Add {round(proteinOf(food, Number(grams) || 0))} g
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {results.length === 0 && (
        <p className="hint" style={{ marginTop: 'var(--sp-4)' }}>
          Nothing matches “{query.trim()}”.
        </p>
      )}

      <button type="button" className="btn full" style={{ marginTop: 'var(--sp-4)' }} onClick={onManageFoods}>
        Edit my foods
      </button>
    </Sheet>
  )
}
