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
 * The seed carries Justin's own training day, so a fresh install or a cleared
 * storage comes back as his real program — plus a dumbbell push/pull/legs
 * split he isn't using now but wants on hand.
 *
 * Prescription only — movements, sets, reps, tempo, rest, and the D-group
 * tri-set. Deliberately NO working weights and NO weekly schedule: this file is
 * committed to a public repo and git history is permanent, so how much he lifts
 * and which days he trains stay in his private backup instead.
 */

export const SCHEMA_VERSION = 2

/**
 * Bumped whenever the seeded program changes.
 *
 * Seeding used to run once, guarded by a boolean, so anyone who had already
 * opened the app was pinned to whatever the defaults were that day — a later
 * change to the program simply never arrived. This version lets an existing
 * install pick up a new default program without losing anything logged.
 */
export const SEED_VERSION = 3

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

/** Full names, because "every Mon" pluralises to "Mons". */
export const DAY_NAMES = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
}

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
  { id: 'golden', name: 'Golden', blurb: 'Golden shorthair, green eyes' },
]

export const DEFAULT_SETTINGS = {
  version: SCHEMA_VERSION,
  seedVersion: SEED_VERSION,
  proteinTarget: 120,
  unit: 'lb',
  theme: 'midnight',
  // Left empty on purpose — the training week is set in the app, not shipped here.
  schedule: { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null },
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

// --- seed --------------------------------------------------------------------
// Justin's own training day, plus a dumbbell push/pull/legs split kept on hand
// for later. Prescription only — working weights live in his private backup.
//
// Slot letters are the coach's grouping: a shared letter (D1/D2/D3) runs as a
// superset, which Today renders as one bracketed block. The PPL routines carry
// no slots, because they aren't written that way.

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

/** The trainer's Day 3 — the program actually in use. */
const DAY3_EXERCISES = [
  ex('e-atw', 'ATW', 0, 0, 5, 'Primer — no load tracked.', { kind: 'primer', slot: 'P1' }),
  ex('e-leg-press', 'Leg press', 3, 12, 10, '', { slot: 'A1', tempo: '2100', restSeconds: 90 }),
  ex('e-seated-row-high', 'Seated row (High)', 3, 12, 5, '', { slot: 'B1', tempo: '2002', restSeconds: 90 }),
  ex('e-chest-press', 'Chest press', 3, 10, 5, '', { slot: 'C1', tempo: '2100', restSeconds: 90 }),
  // Shared with Push Day below rather than duplicated — two exercises with the
  // same name would be worse than one carrying a slot it only uses on Day 3.
  ex('e-lateral-raise', 'Lateral raise', 3, 14, 2.5, 'Light. Lead with the elbows.', {
    kind: 'accessory',
    slot: 'D1',
    restSeconds: 90,
  }),
  ex('e-bicep-curl', 'Bicep curl', 3, 11, 2.5, '', { kind: 'accessory', slot: 'D2' }),
  ex('e-tricep-pushdown', 'Tricep pushdown', 3, 12, 2.5, '', { kind: 'accessory', slot: 'D3' }),
]

/** A standard dumbbell split, unused for now but here when it's wanted. */
const DUMBBELL_EXERCISES = [
  ex('e-db-bench', 'Dumbbell Bench Press', 3, 10, 5, 'Elbows ~45°, control the way down.'),
  ex('e-incline-press', 'Incline Dumbbell Press', 3, 10, 5),
  ex('e-shoulder-press', 'Dumbbell Shoulder Press', 3, 10, 5),
  ex('e-tricep-ext', 'Overhead Tricep Extension', 3, 12, 5, '', { kind: 'accessory' }),
  ex('e-db-row', 'One-Arm Dumbbell Row', 3, 10, 5, 'Per side. Pull to the hip, not the chest.'),
  ex('e-db-pullover', 'Dumbbell Pullover', 3, 12, 5),
  ex('e-rear-delt-fly', 'Rear Delt Fly', 3, 12, 5, '', { kind: 'accessory' }),
  ex('e-db-curl', 'Dumbbell Curl', 3, 10, 5, '', { kind: 'accessory' }),
  ex('e-hammer-curl', 'Hammer Curl', 3, 10, 5, '', { kind: 'accessory' }),
  ex('e-goblet-squat', 'Goblet Squat', 3, 10, 10, 'One dumbbell at the chest. Sit down, not back.'),
  ex('e-rdl', 'Dumbbell Romanian Deadlift', 3, 10, 10, 'Hinge at the hips, soft knees, flat back.'),
  ex('e-db-lunge', 'Dumbbell Lunge', 3, 10, 5, 'Per leg.'),
  ex('e-calf-raise', 'Dumbbell Calf Raise', 3, 15, 5, '', { kind: 'accessory' }),
  ex('e-glute-bridge', 'Dumbbell Glute Bridge', 3, 12, 10, '', { kind: 'accessory' }),
]

export const SEED_EXERCISES = [...DAY3_EXERCISES, ...DUMBBELL_EXERCISES]

export const SEED_WORKOUTS = [
  {
    id: 'w-day3',
    name: 'Day 3',
    note: 'Solo session · ~43 min · programmed by trainer',
    exerciseIds: DAY3_EXERCISES.map((e) => e.id),
  },
  // Coach-led days vary week to week, so there is nothing to pre-plan — this
  // exists to name the day and hold whatever gets logged ad-hoc.
  { id: 'w-trainer', name: 'Trainer session', note: 'With coach · log as you go', exerciseIds: [] },
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

/**
 * pinned  — force it into the quick-add row regardless of how often it's used,
 *           so a new staple doesn't have to earn its place first.
 * archived — hidden everywhere you'd pick a food, but still resolvable by the
 *           entries that already reference it. Deleting outright would silently
 *           rewrite past protein totals to zero.
 */
const food = (id, name, proteinPer100g, defaultServingGrams) => ({
  id,
  name,
  proteinPer100g,
  defaultServingGrams,
  useCount: 0,
  pinned: false,
  archived: false,
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
