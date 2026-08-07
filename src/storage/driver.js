/**
 * The ONLY module that knows where data physically lives.
 *
 * The API is async even though localStorage is synchronous. That is deliberate:
 * swapping in IndexedDB later means rewriting this file and nothing else.
 * Retrofitting async into synchronous call sites is the migration that hurts,
 * so we pay for it up front — it costs nothing today.
 */
const PREFIX = 'jfj:'

export const driver = {
  async get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return fallback
      return JSON.parse(raw)
    } catch (err) {
      // Corrupt JSON or Safari private mode. Don't take the app down over it.
      console.warn(`[storage] failed to read "${key}"`, err)
      return fallback
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch (err) {
      console.error(`[storage] failed to write "${key}"`, err)
      return false
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch (err) {
      console.warn(`[storage] failed to remove "${key}"`, err)
    }
  },
}
