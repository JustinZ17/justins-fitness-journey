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

/**
 * How long a navigation waits for the network before falling back to cache.
 *
 * Clean offline fails instantly, so it was never the problem. One bar of
 * signal is: the request hangs rather than erroring, and the app appears to
 * freeze on launch — in exactly the basement this thing was built for. Losing
 * a deploy's freshness for one launch beats a five-second white screen.
 */
const NAV_TIMEOUT_MS = 3000

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
/** Hashed asset URLs referenced by a page of HTML. */
function assetsFromHtml(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => new URL(m[1], self.location).href)
    .filter((url) => url.includes('/assets/'))
}

/** Asset URLs the currently deployed index.html points at. */
async function currentAssets() {
  const res = await fetch(new URL('./index.html', self.location), { cache: 'reload' })
  return assetsFromHtml(await res.text())
}

/** Delete cached assets that `keep` doesn't mention. */
async function dropAssetsExcept(keep) {
  const cache = await caches.open(CACHE_NAME)
  const keepSet = new Set(keep)
  const stale = (await cache.keys()).filter(
    (req) => req.url.includes('/assets/') && !keepSet.has(req.url)
  )
  await Promise.all(stale.map((req) => cache.delete(req)))
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
    await dropAssetsExcept(await currentAssets())
  } catch (err) {
    // Offline — the next successful navigation prunes instead.
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
    // Reject rather than resolve, so a slow network falls into the same .catch
    // as a dead one and serves the cached shell.
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('network too slow')), NAV_TIMEOUT_MS)
    )

    event.respondWith(
      Promise.race([fetch(request), timeout])
        .then((response) => {
          const forCache = response.clone()
          const forScan = response.clone()

          // A successful navigation is the one moment we hold proof of what the
          // current deploy references, so it's also where the cache gets swept.
          // Doing this only in `activate` would almost never run: sw.js is
          // byte-identical across app-only deploys, so no new worker installs.
          event.waitUntil(
            (async () => {
              const cache = await caches.open(CACHE_NAME)
              await cache.put(SHELL_ROOT, forCache)
              try {
                await dropAssetsExcept(assetsFromHtml(await forScan.text()))
              } catch (err) {
                /* non-HTML or unreadable body — leave the cache alone */
              }
            })()
          )
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
