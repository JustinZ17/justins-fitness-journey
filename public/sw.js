/**
 * App-shell service worker.
 *
 * Deliberately not a generated precache manifest: Vite emits content-hashed
 * filenames that change on every build, so a hardcoded list of asset URLs goes
 * stale the moment you deploy twice. Instead:
 *
 *   navigations  -> network-first, falling back to the cached shell.
 *                   Keeps a new deploy's hashed asset URLs reachable instead of
 *                   pinning you to a stale index.html forever.
 *   /assets/*    -> cache-first. Hashed filenames are immutable, so this is
 *                   both safe and the thing that makes the gym basement work.
 *
 * Bump CACHE_VERSION to evict everything on the next activate.
 */
const CACHE_VERSION = 'v1'
const CACHE_NAME = `fitness-shell-${CACHE_VERSION}`

// Resolved against the SW's own location, so this works under the GitHub Pages
// base path without hardcoding it.
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
].map((p) => new URL(p, self.location).href)

const SHELL_ROOT = new URL('./', self.location).href

/**
 * Cache the shell plus whatever hashed assets the built index.html references.
 *
 * Reading the asset URLs out of the HTML at install time is what makes the app
 * work offline after ONE visit. Without it the SW isn't controlling the page
 * during its own first load, so the JS and CSS only get cached on the second
 * visit — and "it worked at home but not in the basement" is exactly the bug
 * that would produce.
 */
/** Asset URLs the currently deployed index.html points at. */
async function currentAssets() {
  const html = await (await fetch(new URL('./index.html', self.location), { cache: 'reload' })).text()
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => new URL(m[1], self.location).href)
    .filter((url) => url.includes('/assets/'))
}

async function precache() {
  const cache = await caches.open(CACHE_NAME)
  // Individually, so one missing icon can't fail the whole install.
  await Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))

  try {
    const assets = await currentAssets()
    await Promise.all(assets.map((url) => cache.add(url).catch(() => {})))
  } catch (err) {
    // Offline at install time. The runtime handler will fill the cache later.
  }
}

/**
 * Drop hashed assets from previous deploys.
 *
 * Every build emits new filenames, so without this the cache accumulates one
 * dead JS+CSS pair per deploy forever — bad anywhere, worse on iOS where
 * storage pressure is already what evicts this app's data.
 */
async function pruneStaleAssets() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const keep = new Set(await currentAssets())
    const stale = (await cache.keys()).filter(
      (req) => req.url.includes('/assets/') && !keep.has(req.url)
    )
    await Promise.all(stale.map((req) => cache.delete(req)))
  } catch (err) {
    // Offline during activation — the next activate will catch up.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => pruneStaleAssets())
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_ROOT, copy))
          return response
        })
        .catch(() => caches.match(SHELL_ROOT).then((hit) => hit || caches.match('./index.html')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit
      return fetch(request).then((response) => {
        // Only cache real, complete same-origin responses.
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
