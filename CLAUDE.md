# Working notes

Context for anyone (including a future session) picking this up.

## What it is

A single-user fitness tracker for Justin. Installable PWA, no backend, no auth,
no accounts. All data lives in his phone's localStorage. Live at
https://justinz17.github.io/justins-fitness-journey/

He is a beginner — roughly one month of training as of Aug 2026 — which is why
programming stays at double progression and the guides are written the way they
are. Don't reach for RPE autoregulation or percentage-of-1RM work.

## Commands

```
npm run dev -- --host    # LAN URL works on the phone; service workers need HTTPS, so
                         # install/offline can only be tested on the deployed URL
npm test                 # 84 tests, node --test, no framework dependency
npm run build            # static build; base path must match the repo name
npm run icons            # regenerate placeholder PNGs
```

Deploy is automatic on push to `main` via GitHub Actions. `gh` is installed
per-user at
`%LOCALAPPDATA%\Microsoft\WinGet\Packages\GitHub.cli_*\bin\gh.exe` (not on PATH).

## Decisions that look arbitrary but aren't

Undoing any of these reintroduces a bug that was already found the hard way.

- **`driver.js` is the only file that touches localStorage**, and its API is
  async even though localStorage isn't. That's the IndexedDB seam. Retrofitting
  async into sync call sites is the migration that hurts.
- **Dates are local-time `YYYY-MM-DD`, never `toISOString()`.** UTC conversion
  moves an evening workout to tomorrow. `lib/date.js` exists solely for this.
- **`minmax(0, 1fr)`, never bare `1fr`;** `min-width: 0` on flex/grid children
  meant to truncate. Grid items default to `min-width: auto`, so `nowrap` text
  forces tracks wider than their share. This shipped once and only broke on
  device, because the overflow amount depends on the rendering font.
- **Safe-area insets go through `--safe-top` / `--safe-bottom`**, not bare
  `env()`. `env()` is always 0 on desktop, so inset bugs are invisible unless
  the variables can be overridden to simulate a phone.
- **`.app` is `100dvh` with `100%` as fallback**, and the status bar style is
  `default`, not `black-translucent`. Translucent handed the installed app a
  viewport 62px shorter than the screen while still anchored at the top, so the
  bottom of the screen fell outside the web view entirely.
- **Sheets portal into `<body>`.** Rendered inline they land inside `.screen`,
  which clips them and swallows their scroll gestures.
- **Theme colours are duplicated in `index.html` and `themes.css`** because the
  inline pre-paint script runs before the stylesheet loads. `theme-colors.test.js`
  fails if they drift.
- **Deleting is archiving when history exists.** Protein and progression are
  computed from the food/exercise record at read time, so a hard delete silently
  rewrites past days to zero. Same reasoning guards the seed migration.
- **`ErrorBoundary` duplicates the export logic on purpose.** The rescue path
  must not import anything that could itself be the crash.

## Seeding and migration

`SEED_VERSION` in `schema.js` tracks which default program an install holds;
`migrate.js` brings old installs forward. Seeding originally ran once behind a
boolean, so a changed default reached only first-time users — i.e. nobody.

Read the stored `seedVersion` **before** merging `DEFAULT_SETTINGS`, or every
install looks current and the migration silently no-ops.

Migration has two paths: replace the program when nothing has been logged, add
only what's missing when there's history.

## Privacy line

The repo is public and git history is permanent. The seed carries Justin's Day 3
**prescription** (movements, sets, reps, tempo, rest, slots) plus a dumbbell
push/pull/legs split he keeps for later. It deliberately carries **no working
weights and no weekly schedule** — those live in a private JSON backup he
imports. `seed.test.js` fails if either leaks back in.

## Known warts

- `slot`, `tempo` and `restSeconds` live on the Exercise, but they really belong
  to an exercise *within a workout*. Visible symptom: lateral raise is shared
  between Day 3 and Push Day, so its `D1` badge shows on a day that has no slots.
  Fixing it means a workout-exercise join table.
- Storage is synchronous and capped around 5MB. Fine today; the reason photos
  would need IndexedDB first.
- The Actions workflow warns that `actions/checkout@v4` and friends target the
  deprecated Node 20 runtime. Harmless — GitHub force-runs them on Node 24.

## Open items

- Justin's first real session was due Saturday 2026-08-08. Nothing here has been
  used in a gym yet; what annoys him mid-set should outrank anything invented.
- Tue/Thu trainer sessions are unplanned placeholders. He chose not to log them
  for now.
- He was asked to verify the protein milk figure (7 g/100 ml is a guess, not his
  carton) and to correct it in Edit foods.
- The private plan generator lives in a session scratchpad and will not survive.
  The delivered `fitness-plan.json` is the durable artifact.
