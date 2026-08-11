import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ar } from '../src/i18n/ar.js'
import { en } from '../src/i18n/en.js'

function flatten(value, prefix = '', output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, path, output)
    else output.set(path, child)
  }
  return output
}

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) result.push(...await sourceFiles(full))
    else if (/\.(?:js|jsx)$/.test(entry.name)) result.push(full)
  }
  return result
}

test('Arabic and English dictionaries expose the same leaf keys', () => {
  const arabic = flatten(ar)
  const english = flatten(en)
  assert.deepEqual([...arabic.keys()].sort(), [...english.keys()].sort())
})

test('literal t() keys used by the React UI exist in both dictionaries', async () => {
  const arabic = flatten(ar)
  const english = flatten(en)
  const missing = []
  for (const file of await sourceFiles(fileURLToPath(new URL('../src', import.meta.url)))) {
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
      const key = match[1]
      if (!arabic.has(key) || !english.has(key)) missing.push(`${file}: ${key}`)
    }
  }
  assert.deepEqual(missing, [])
})

test('site/tour language bridge supports both directions', async () => {
  const wrapper = await readFile(new URL('../src/components/ThreeJSTempleViewer.jsx', import.meta.url), 'utf8')
  const tour = await readFile(new URL('../public/bastet-threejs-tour/main.js', import.meta.url), 'utf8')
  for (const marker of ['SET_LANGUAGE', 'LANGUAGE_CHANGED', 'TOUR_READY', 'EXIT_TOUR']) {
    assert.match(wrapper + tour, new RegExp(marker))
  }
  for (const storageKey of ['bastet_lang', 'bastet_tour_lang', 'bastet-language']) assert.match(tour, new RegExp(storageKey))
})
