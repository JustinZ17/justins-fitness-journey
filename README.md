# Justin's Fitness Journey

A single-user workout and protein tracker that installs to the iOS home screen and works
offline. No backend, no auth, no accounts — everything lives in the phone's localStorage.

**Live:** https://JZ17392.github.io/justins-fitness-journey/ *(after the first deploy)*

## What it does

- **Today** — the day's workout as a one-tap checklist, plus protein against a daily target.
- **Progressive overload** — every exercise shows what you lifted last time and suggests the
  next weight using double progression: clear the target reps on every set and it adds one
  increment; miss any and it holds the weight.
- **Routines / History** — not built yet (phase B).

## Running it

```bash
npm install
npm run dev -- --host      # open the Network URL on your phone
```

Service workers require HTTPS, so **install and offline behavior can only be tested on the
deployed URL**, not over LAN dev. Desktop `localhost` is exempt if you want to check SW
registration locally via `npm run build && npm run preview`.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`. One-time setup: repo
**Settings → Pages → Source → GitHub Actions**. Without that the workflow succeeds and the
site still 404s.

`base` in `vite.config.js` must match the repo name. If you rename the repo, change it there
too or every asset 404s and you get a blank page.

## Layout

```
src/storage/driver.js        the only file that touches localStorage
src/storage/StoreProvider.jsx  hydrates everything into memory, exposes actions
src/storage/schema.js        data shapes + seed routine and food list
src/lib/progression.js       last performance, PRs, estimated 1RM, next-weight suggestion
src/screens/Today.jsx        the default view
public/sw.js                 app-shell service worker
scripts/gen-icons.mjs        generates the placeholder PNG icons
```

Storage is deliberately async even though localStorage isn't, so swapping in IndexedDB later
means rewriting `driver.js` and nothing else.

## Backups matter

iOS evicts localStorage for PWAs that go unused for about a week, and there is no server copy.
**Settings → Export JSON** is the only way to get your data back. Do it occasionally.

## Replacing the icons

`public/icons/*.png` are generated placeholders. Drop in your own PNGs at the same filenames
(192, 512, 512-maskable, and a 180px `apple-touch-icon.png`), or edit `scripts/gen-icons.mjs`
and run `npm run icons`.
