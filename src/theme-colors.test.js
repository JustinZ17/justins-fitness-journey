import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { THEMES } from './storage/schema.js'

/**
 * index.html hardcodes the status bar colours so it can set them before first
 * paint, which means they duplicate --theme-color in themes.css. Duplication
 * that nothing checks is duplication that drifts, and the failure mode is
 * quiet: a mismatched band across the top of the phone that only shows up on
 * an installed iOS app.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(join(root, 'index.html'), 'utf8')
const css = readFileSync(join(root, 'src/styles/themes.css'), 'utf8')

/** The THEME_COLORS object out of the inline bootstrap script. */
function colorsFromHtml() {
  const block = html.match(/var THEME_COLORS = \{([\s\S]*?)\}/)
  assert.ok(block, 'index.html should declare a THEME_COLORS map')
  return Object.fromEntries(
    [...block[1].matchAll(/(\w+):\s*'(#[0-9a-fA-F]{3,8})'/g)].map((m) => [m[1], m[2].toLowerCase()])
  )
}

/** --theme-color declared in each [data-theme='...'] block. */
function colorsFromCss() {
  const out = {}
  for (const m of css.matchAll(/\[data-theme='(\w+)'\]\s*\{([\s\S]*?)\n\}/g)) {
    const found = m[2].match(/--theme-color:\s*([^;]+);/)
    if (found) out[m[1]] = found[1].trim().toLowerCase()
  }
  return out
}

describe('status bar colours', () => {
  const fromHtml = colorsFromHtml()
  const fromCss = colorsFromCss()

  test('every theme declares --theme-color in CSS', () => {
    for (const theme of THEMES) {
      assert.ok(fromCss[theme.id], `themes.css is missing --theme-color for "${theme.id}"`)
    }
  })

  test('every theme is in the pre-paint map in index.html', () => {
    for (const theme of THEMES) {
      assert.ok(fromHtml[theme.id], `index.html THEME_COLORS is missing "${theme.id}"`)
    }
  })

  test('the two agree, so the iOS status bar matches the app', () => {
    for (const theme of THEMES) {
      assert.equal(
        fromHtml[theme.id],
        fromCss[theme.id],
        `"${theme.id}": index.html says ${fromHtml[theme.id]}, themes.css says ${fromCss[theme.id]}`
      )
    }
  })

  test('the map has no themes that no longer exist', () => {
    const known = new Set(THEMES.map((t) => t.id))
    for (const id of Object.keys(fromHtml)) {
      assert.ok(known.has(id), `index.html lists unknown theme "${id}"`)
    }
  })
})
