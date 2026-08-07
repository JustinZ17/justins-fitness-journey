import { useMemo, useState } from 'react'
import { Sheet } from './Sheet.jsx'
import { useStore } from '../storage/StoreProvider.jsx'
import { DIRECT_PROTEIN_ID, newId } from '../storage/schema.js'
import { PlusIcon } from './Icons.jsx'

const round = (n) => Math.round(n * 10) / 10

/** Foods you actually eat, and what's in them. */
export function FoodManager({ onClose }) {
  const { foods, foodEntries } = useStore()
  const [editing, setEditing] = useState(null)

  const { active, archived } = useMemo(() => {
    const usable = foods.filter((f) => f.id !== DIRECT_PROTEIN_ID)
    const byName = (a, b) => a.name.localeCompare(b.name)
    return {
      active: usable.filter((f) => !f.archived).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byName(a, b)),
      archived: usable.filter((f) => f.archived).sort(byName),
    }
  }, [foods])

  if (editing) {
    return (
      <FoodEditor
        food={editing.id ? editing : null}
        entryCount={editing.id ? foodEntries.filter((e) => e.foodId === editing.id).length : 0}
        onBack={() => setEditing(null)}
        onClose={onClose}
      />
    )
  }

  return (
    <Sheet title="Your foods" onClose={onClose}>
      <button type="button" className="btn full" onClick={() => setEditing({})}>
        <PlusIcon /> Add a food
      </button>

      <p className="hint" style={{ marginTop: 'var(--sp-3)' }}>
        Pinned foods always show in the quick-add row. Everything else appears there by
        how often you use it.
      </p>

      <div className="picker-list">
        {active.map((food) => (
          <button key={food.id} type="button" className="picker-item" onClick={() => setEditing(food)}>
            <span>
              <strong>
                {food.pinned && <span className="pin-dot" aria-label="pinned" />}
                {food.name}
              </strong>
              <small>
                {food.proteinPer100g} g per 100 g · {food.defaultServingGrams} g serving ={' '}
                {round((food.proteinPer100g * food.defaultServingGrams) / 100)} g
              </small>
            </span>
            <span className="row-chev" aria-hidden>›</span>
          </button>
        ))}
      </div>

      {archived.length > 0 && (
        <>
          <div className="divider">hidden</div>
          <div className="picker-list">
            {archived.map((food) => (
              <button
                key={food.id}
                type="button"
                className="picker-item dim"
                onClick={() => setEditing(food)}
              >
                <span>
                  <strong>{food.name}</strong>
                  <small>hidden from quick-add — past entries still count</small>
                </span>
                <span className="row-chev" aria-hidden>›</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  )
}

function FoodEditor({ food, entryCount, onBack, onClose }) {
  const { saveFood, removeFood, setFoodArchived, toggleFoodPinned } = useStore()
  const isNew = !food

  const [name, setName] = useState(food?.name ?? '')
  const [protein, setProtein] = useState(String(food?.proteinPer100g ?? ''))
  const [serving, setServing] = useState(String(food?.defaultServingGrams ?? 100))
  const [pinned, setPinned] = useState(food?.pinned ?? false)

  const proteinNum = Number(protein) || 0
  const servingNum = Number(serving) || 0
  const perServing = round((proteinNum * servingNum) / 100)
  const valid = name.trim().length > 0 && proteinNum > 0 && servingNum > 0

  const save = () => {
    saveFood({
      ...(food ?? {}),
      id: food?.id ?? newId('f'),
      name: name.trim(),
      proteinPer100g: proteinNum,
      defaultServingGrams: servingNum,
      pinned,
      archived: false,
    })
    onBack()
  }

  return (
    <Sheet title={isNew ? 'New food' : 'Edit food'} onClose={onClose}>
      <label className="field">
        <span>Name</span>
        <input
          className="input"
          value={name}
          autoFocus={isNew}
          placeholder="Protein milk"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="sheet-row">
        <label className="field">
          <span>Protein per 100 g</span>
          <input
            className="input"
            inputMode="decimal"
            value={protein}
            placeholder="7"
            onChange={(e) => setProtein(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Usual serving (g)</span>
          <input
            className="input"
            inputMode="decimal"
            value={serving}
            onChange={(e) => setServing(e.target.value)}
          />
        </label>
      </div>

      <p className="hint">
        {valid
          ? `One serving = ${perServing} g of protein.`
          : 'Take both numbers off the label. For a drink, millilitres and grams are close enough.'}
      </p>

      <button
        type="button"
        className={`toggle-row${pinned ? ' on' : ''}`}
        aria-pressed={pinned}
        onClick={() => setPinned((v) => !v)}
      >
        <span>
          <strong>Show in quick-add</strong>
          <small>Always keep it in the one-tap row</small>
        </span>
        <span className="toggle-switch" aria-hidden />
      </button>

      <button
        type="button"
        className="btn primary full"
        style={{ marginTop: 'var(--sp-4)' }}
        disabled={!valid}
        onClick={save}
      >
        {isNew ? 'Add food' : 'Save changes'}
      </button>

      {!isNew && !food.archived && (
        <button
          type="button"
          className="btn danger full"
          style={{ marginTop: 'var(--sp-2)' }}
          onClick={() => {
            // Only a food nothing references can be truly deleted. Anything
            // with history gets hidden instead, so past days keep their totals.
            if (entryCount > 0) {
              if (
                !window.confirm(
                  `Hide "${food.name}"?\n\nIt disappears from quick-add and the food picker. The ${entryCount} time${entryCount === 1 ? '' : 's'} you've already logged it stay counted, so your past protein stays accurate.`
                )
              )
                return
              setFoodArchived(food.id, true)
            } else {
              if (!window.confirm(`Delete "${food.name}"? You've never logged it, so nothing is lost.`)) return
              removeFood(food.id)
            }
            onBack()
          }}
        >
          {entryCount > 0 ? 'Hide from lists' : 'Delete'}
        </button>
      )}

      {!isNew && food.archived && (
        <button
          type="button"
          className="btn full"
          style={{ marginTop: 'var(--sp-2)' }}
          onClick={() => {
            setFoodArchived(food.id, false)
            onBack()
          }}
        >
          Unhide
        </button>
      )}

      <button type="button" className="btn full" style={{ marginTop: 'var(--sp-2)' }} onClick={onBack}>
        Back
      </button>
    </Sheet>
  )
}
