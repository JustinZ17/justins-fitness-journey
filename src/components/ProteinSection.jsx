import { useMemo, useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { DIRECT_PROTEIN_ID } from '../storage/schema.js'
import { TrashIcon } from './Icons.jsx'
import { Sheet } from './Sheet.jsx'

const proteinOf = (food, grams) => ((food?.proteinPer100g ?? 0) * grams) / 100
const round = (n) => Math.round(n * 10) / 10

export function ProteinSection({ date }) {
  const { foods, foodEntries, settings, addFoodEntry, addProteinDirect, removeFoodEntry } = useStore()
  const [manualOpen, setManualOpen] = useState(false)

  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])
  const today = useMemo(() => foodEntries.filter((e) => e.date === date), [foodEntries, date])

  const total = today.reduce((sum, e) => sum + proteinOf(foodsById.get(e.foodId), e.grams), 0)
  const target = settings.proteinTarget || 120
  const pct = Math.min(100, (total / target) * 100)

  // Ranked by what he actually eats, so the row gets better with use.
  const quick = useMemo(
    () =>
      foods
        .filter((f) => f.id !== DIRECT_PROTEIN_ID)
        .slice()
        .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
        .slice(0, 6),
    [foods]
  )

  return (
    <section className="section">
      <div className="section-head">
        <h2>Protein</h2>
        <button type="button" className="link-btn" onClick={() => setManualOpen(true)}>
          Add manually
        </button>
      </div>

      <div className="card protein-card">
        <div className="protein-head">
          <div className="protein-total">
            {round(total)}
            <small> / {target} g</small>
          </div>
          <div className="protein-status">
            {total >= target ? 'Target hit' : `${round(target - total)} g to go`}
          </div>
        </div>

        <div className={`bar${total > target ? ' over' : ''}`}>
          <div style={{ width: `${pct}%` }} />
        </div>

        <div className="quick-add">
          {quick.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => addFoodEntry(food.id, food.defaultServingGrams, date)}
            >
              <span className="qa-name">{food.name}</span>
              <span className="qa-sub">
                {food.defaultServingGrams} g · {round(proteinOf(food, food.defaultServingGrams))} g protein
              </span>
            </button>
          ))}
        </div>

        {today.length > 0 && (
          <div className="entry-list">
            {today.map((entry) => {
              const food = foodsById.get(entry.foodId)
              return (
                <div className="entry" key={entry.id}>
                  <span className="entry-name">{food?.name ?? 'Deleted food'}</span>
                  {entry.foodId !== DIRECT_PROTEIN_ID && (
                    <span className="entry-grams">{entry.grams} g</span>
                  )}
                  <span className="entry-protein">{round(proteinOf(food, entry.grams))} g</span>
                  <button
                    type="button"
                    className="entry-del"
                    aria-label={`Remove ${food?.name ?? 'entry'}`}
                    onClick={() => removeFoodEntry(entry.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {manualOpen && (
        <ManualEntrySheet
          foods={foods}
          onClose={() => setManualOpen(false)}
          onAddFood={(foodId, grams) => {
            addFoodEntry(foodId, grams, date)
            setManualOpen(false)
          }}
          onAddDirect={(grams) => {
            addProteinDirect(grams, date)
            setManualOpen(false)
          }}
        />
      )}
    </section>
  )
}

function ManualEntrySheet({ foods, onClose, onAddFood, onAddDirect }) {
  const selectable = foods.filter((f) => f.id !== DIRECT_PROTEIN_ID)
  const [foodId, setFoodId] = useState(selectable[0]?.id ?? '')
  const [grams, setGrams] = useState(String(selectable[0]?.defaultServingGrams ?? 100))
  const [direct, setDirect] = useState('')

  const food = foods.find((f) => f.id === foodId)
  const computed = round(proteinOf(food, Number(grams) || 0))

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
            onClick={() => onAddDirect(Number(direct))}
          >
            Add
          </button>
        </div>
      </label>

      <div className="divider">or weigh a food</div>

      <label className="field">
        <span>Food</span>
        <select
          className="input"
          value={foodId}
          onChange={(e) => {
            setFoodId(e.target.value)
            const next = foods.find((f) => f.id === e.target.value)
            if (next) setGrams(String(next.defaultServingGrams))
          }}
        >
          {selectable.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} — {f.proteinPer100g} g/100 g
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Grams</span>
        <input
          className="input"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </label>

      <p className="hint">That's {computed} g of protein.</p>

      <button
        type="button"
        className="btn primary full"
        disabled={!foodId || !(Number(grams) > 0)}
        onClick={() => onAddFood(foodId, Number(grams))}
      >
        Add {computed} g
      </button>
    </Sheet>
  )
}
