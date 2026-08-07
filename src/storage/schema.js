/**
 * Shapes, defaults, and first-run seed data.
 *
 *   Settings       { proteinTarget, unit, theme, schedule, version }
 *   Exercise       { id, name, targetSets, targetReps, notes, increment,
 *                    kind, slot, tempo, restSeconds, targetRIR }
 *   Workout        { id, name, exerciseIds[], note }
 *   WorkoutSession { id, date, workoutId, completed[] }
 *     completed[]  { exerciseId, done, sets[] }
 *     sets[]       { weight, reps, done }
 *   Food           { id, name, proteinPer100g, defaultServingGrams, useCount }
 *   FoodEntry      { id, date, foodId, grams }
 *   BodyWeight     { id, date, weight }
 *
 * All dates are 'YYYY-MM-DD' in local time — see lib/date.js.
 *
 * NOTE: the seed below is a generic beginner split. This file is committed to a
 * public repo, so personal programming belongs in an imported backup, never here.
 */

export const SCHEMA_VERSION = 2

export const COLLECTIONS = {
  settings: 'settings',
  exercises: 'exercises',
  workouts: 'workouts',
  sessions: 'sessions',
  foods: 'foods',
  foodEntries: 'foodEntries',
  bodyWeights: 'bodyWeights',
}

export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const DAY_LABELS = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' }

/**
 * Where an exercise sits in the session. Drives grouping and ordering on Today.
 * Mirrors how a coach writes a program: prime, then the heavy work, then the
 * smaller stuff.
 */
export const KINDS = {
  primer: { id: 'primer', label: 'Primer' },
  main: { id: 'main', label: 'Main' },
  accessory: { id: 'accessory', label: 'Accessory' },
}

export const THEMES = [
  { id: 'midnight', name: 'Midnight', blurb: 'Near-black, electric green' },
  { id: 'daylight', name: 'Daylight', blurb: 'Off-white, calm and minimal' },
  { id: 'aurora', name: 'Aurora', blurb: 'Gradient with glass cards' },
  { id: 'terra', name: 'Terra', blurb: 'Sage, terracotta, cream' },
]

export const DEFAULT_SETTINGS = {
  version: SCHEMA_VERSION,
  proteinTarget: 120,
  unit: 'lb',
  theme: 'midnight',
  schedule: { sun: null, mon: 'w-push', tue: null, wed: 'w-pull', thu: null, fri: 'w-legs', sat: null },
}

export const newId = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/**
 * Tempo is coach notation: four digits, eccentric-pause-concentric-pause, in
 * seconds. '2100' = 2s lowering, 1s pause, explosive lift, no pause at the top.
 * 'X' means explosive.
 */
export const TEMPO_PHASES = ['lower', 'pause', 'lift', 'pause']

export function parseTempo(tempo) {
  if (!tempo) return null
  const digits = String(tempo).trim().toUpperCase().split('')
  if (digits.length !== 4) return null
  return digits
}

// --- seed: a standard beginner dumbbell push/pull/legs split ----------------
// Everything here is editable or deletable. Increment is per exercise because
// dumbbells jump 5 lb while the bigger lower-body lifts take 10 lb steps early on.

const ex = (id, name, targetSets, targetReps, increment = 5, notes = '', extra = {}) => ({
  id,
  name,
  targetSets,
  targetReps,
  increment,
  notes,
  kind: 'main',
  slot: '',
  tempo: '',
  restSeconds: null,
  targetRIR: null,
  ...extra,
})

export const SEED_EXERCISES = [
  // Push
  ex('e-db-bench', 'Dumbbell Bench Press', 3, 10, 5, 'Elbows ~45°, control the way down.'),
  ex('e-incline-press', 'Incline Dumbbell Press', 3, 10, 5),
  ex('e-shoulder-press', 'Dumbbell Shoulder Press', 3, 10, 5),
  ex('e-lateral-raise', 'Lateral Raise', 3, 12, 5, 'Light. Lead with the elbows.', { kind: 'accessory' }),
  ex('e-tricep-ext', 'Overhead Tricep Extension', 3, 12, 5, '', { kind: 'accessory' }),
  // Pull
  ex('e-db-row', 'One-Arm Dumbbell Row', 3, 10, 5, 'Per side. Pull to the hip, not the chest.'),
  ex('e-db-pullover', 'Dumbbell Pullover', 3, 12, 5),
  ex('e-rear-delt-fly', 'Rear Delt Fly', 3, 12, 5, '', { kind: 'accessory' }),
  ex('e-db-curl', 'Dumbbell Curl', 3, 10, 5, '', { kind: 'accessory' }),
  ex('e-hammer-curl', 'Hammer Curl', 3, 10, 5, '', { kind: 'accessory' }),
  // Legs
  ex('e-goblet-squat', 'Goblet Squat', 3, 10, 10, 'One dumbbell at the chest. Sit down, not back.'),
  ex('e-rdl', 'Dumbbell Romanian Deadlift', 3, 10, 10, 'Hinge at the hips, soft knees, flat back.'),
  ex('e-db-lunge', 'Dumbbell Lunge', 3, 10, 5, 'Per leg.'),
  ex('e-calf-raise', 'Dumbbell Calf Raise', 3, 15, 5, '', { kind: 'accessory' }),
  ex('e-glute-bridge', 'Dumbbell Glute Bridge', 3, 12, 10, '', { kind: 'accessory' }),
]

export const SEED_WORKOUTS = [
  {
    id: 'w-push',
    name: 'Push Day',
    note: '',
    exerciseIds: ['e-db-bench', 'e-incline-press', 'e-shoulder-press', 'e-lateral-raise', 'e-tricep-ext'],
  },
  {
    id: 'w-pull',
    name: 'Pull Day',
    note: '',
    exerciseIds: ['e-db-row', 'e-db-pullover', 'e-rear-delt-fly', 'e-db-curl', 'e-hammer-curl'],
  },
  {
    id: 'w-legs',
    name: 'Leg Day',
    note: '',
    exerciseIds: ['e-goblet-squat', 'e-rdl', 'e-db-lunge', 'e-calf-raise', 'e-glute-bridge'],
  },
]

/** Special food used by the "just log grams of protein" path. */
export const DIRECT_PROTEIN_ID = 'f-direct'

const food = (id, name, proteinPer100g, defaultServingGrams) => ({
  id,
  name,
  proteinPer100g,
  defaultServingGrams,
  useCount: 0,
})

export const SEED_FOODS = [
  food('f-chicken', 'Chicken Breast', 31, 150),
  food('f-whey', 'Whey Protein Scoop', 80, 30),
  food('f-eggs', 'Whole Eggs', 13, 100),
  food('f-egg-whites', 'Egg Whites', 11, 150),
  food('f-greek-yogurt', 'Greek Yogurt (nonfat)', 10, 170),
  food('f-cottage', 'Cottage Cheese', 11, 150),
  food('f-beef', 'Ground Beef 90/10', 26, 130),
  food('f-salmon', 'Salmon', 25, 140),
  food('f-tuna', 'Canned Tuna', 26, 100),
  food('f-shrimp', 'Shrimp', 24, 120),
  food('f-pork', 'Pork Loin', 27, 130),
  food('f-milk', 'Milk (2%)', 3.4, 250),
  food('f-cheddar', 'Cheddar Cheese', 25, 30),
  food('f-tofu', 'Firm Tofu', 17, 120),
  food('f-lentils', 'Lentils (cooked)', 9, 150),
  food('f-black-beans', 'Black Beans (cooked)', 9, 130),
  food('f-peanut-butter', 'Peanut Butter', 25, 32),
  food('f-oats', 'Oats (dry)', 13, 50),
  // Escape hatch for "the label says 35 g protein". At 100 g protein per 100 g,
  // the grams you type ARE the grams of protein, so FoodEntry stays unchanged.
  food(DIRECT_PROTEIN_ID, 'Protein (direct entry)', 100, 25),
]

export const SEED = {
  settings: DEFAULT_SETTINGS,
  exercises: SEED_EXERCISES,
  workouts: SEED_WORKOUTS,
  sessions: [],
  foods: SEED_FOODS,
  foodEntries: [],
  bodyWeights: [],
}
