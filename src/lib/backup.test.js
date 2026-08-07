import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { isBackupStale, BACKUP_STALE_DAYS } from './backup.js'

/**
 * Decides whether to prompt for an export. Too eager and the prompt becomes
 * wallpaper; too shy and the only copy of the data goes unprotected.
 */

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('isBackupStale', () => {
  test('stays quiet when there is nothing worth losing', () => {
    // A fresh install has only seed data; prompting would be noise.
    assert.equal(isBackupStale({}, false), false)
    assert.equal(isBackupStale({ lastExportAt: null }, false), false)
  })

  test('prompts when data exists but has never been exported', () => {
    assert.equal(isBackupStale({}, true), true)
  })

  test('stays quiet just after a backup', () => {
    assert.equal(isBackupStale({ lastExportAt: daysAgo(0) }, true), false)
    assert.equal(isBackupStale({ lastExportAt: daysAgo(BACKUP_STALE_DAYS - 1) }, true), false)
  })

  test('prompts once the threshold is reached', () => {
    assert.equal(isBackupStale({ lastExportAt: daysAgo(BACKUP_STALE_DAYS) }, true), true)
    assert.equal(isBackupStale({ lastExportAt: daysAgo(BACKUP_STALE_DAYS + 20) }, true), true)
  })

  test('survives missing or malformed settings', () => {
    assert.equal(isBackupStale(undefined, true), true)
    assert.equal(isBackupStale(null, false), false)
  })
})
