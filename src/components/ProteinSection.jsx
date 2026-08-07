import { useMemo, useState } from 'react'
import { useStore } from '../storage/StoreProvider.jsx'
import { DIRECT_PROTEIN_ID } from '../storage/schema.js'
import { TrashIcon } from './Icons.jsx'
import { FoodManager } from './FoodManager.jsx'
import { AddFoodSheet } from './AddFoodSheet.jsx'

const proteinOf = (food, grams) => ((food?.proteinPer100g ?? 0) * grams) / 100
const round = (n) => Math.round(n * 10) / 10

export function ProteinSection({ date }) {
  const { foods, foodEntries, settings, addFoodEntry, removeFoodEntry } = useStore()
  const [manualOpen, setManualOpen] = useState(false)
  const [foodsOpen, setFoodsOpen] = useState(false)

  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])
  const today = useMemo(() => foodEntries.filter((e) => e.date === date), [foodEntries, date])

  const total = today.reduce((sum, e) => sum + proteinOf(foodsById.get(e.foodId), e.grams), 0)
  const target = settings.proteinTarget || 120
  const pct = Math.min(100, (total / target) * 100)

  /**
   * Pinned foods first and never truncated — pinning is an explicit "keep this
   * one tap away", so a cap would quietly ignore it. The rest fill up to six by
   * how often they're used. A tile at the end always opens the full list, so
   * the row never reads as the only things you're allowed to log.
   */
  const { quick, moreCount } = useMemo(() => {
    const usable = foods
      .filter((f) => f.id !== DIRECT_PROTEIN_ID && !f.archived)
      .slice()
      .sort(
        (a, b) =>
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
          (b.useCount || 0) - (a.useCount || 0) ||
          a.name.localeCompare(b.name)
      )
    const pinnedCount = usable.filter((f) => f.pinned).length
    const shown = usable.slice(0, Math.max(6, pinnedCount))
    return { quick: shown, moreCount: usable.length - shown.length }
  }, [foods])

  return (
    <section className="section">
      <div className="section-head">
        <h2>Protein</h2>
        <button type="button" className="link-btn" onClick={() => setFoodsOpen(true)}>
          Edit foods
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

          {/* Always present, so the row is obviously a shortcut and not the
              complete list of what can be logged. */}
          <button type="button" className="qa-more" onClick={() => setManualOpen(true)}>
            <span className="qa-name">Something else</span>
            <span className="qa-sub">
              {moreCount > 0 ? `${moreCount} more foods` : 'any amount'}
            </span>
          </button>
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

      {foodsOpen && <FoodManager onClose={() => setFoodsOpen(false)} />}

      {manualOpen && (
        <AddFoodSheet
          date={date}
          onClose={() => setManualOpen(false)}
          onManageFoods={() => {
            setManualOpen(false)
            setFoodsOpen(true)
          }}
        />
      )}
    </section>
  )
}
