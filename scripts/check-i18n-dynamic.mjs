#!/usr/bin/env node
/**
 * check-i18n-dynamic.mjs — Dynamic-t() resolved-key coverage scanner.
 *
 * Verifies that every `namespace.key` pair enumerated in
 * scripts/i18n-dynamic-manifest.json (the reviewable, human-maintained list of
 * keys reachable from a dynamic `t()` call site — seeded from the Task 316
 * audit §2) exists in all 4 locale files (messages/{sq,en,uk,it}.json).
 *
 * Misses listed in scripts/i18n-dynamic-baseline.json are known debt → WARN
 * (exit 0 contribution). Non-baselined misses → ERROR (non-zero exit).
 *
 * Usage: node scripts/check-i18n-dynamic.mjs
 *        node scripts/check-i18n-dynamic.mjs --report           (advisory, always exit 0)
 *        node scripts/check-i18n-dynamic.mjs --update-baseline  (regenerate baseline from current misses)
 *
 * Added by Task 317 (2026-06-13). Mirrors check-i18n-parity.mjs's collectKeys()
 * and check-hardcoded-i18n.mjs's --report/--update-baseline baseline-diff pattern.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const LOCALES = ['sq', 'en', 'uk', 'it']
const MANIFEST_PATH = resolve(__dirname, 'i18n-dynamic-manifest.json')
const BASELINE_PATH = resolve(__dirname, 'i18n-dynamic-baseline.json')

const args = process.argv.slice(2)
const REPORT_ONLY = args.includes('--report')
const UPDATE_BASELINE = args.includes('--update-baseline')

// Sentinel written by --update-baseline for newly-discovered misses (decision 5,
// single source of truth shared by the validator below and the --update-baseline writer).
const PLACEHOLDER_OWNER = 'UPDATE ME — owning task'
const PLACEHOLDER_OWNER_RE = /UPDATE ME/i

// ── flatten helper (mirrors check-i18n-parity.mjs collectKeys) ────────────────

function collectKeys(obj, prefix = '') {
  const keys = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value, path))
    } else {
      keys.push(path)
    }
  }
  return keys
}

// ── load locale files ───────────────────────────────────────────────────────

const keySets = {}
for (const locale of LOCALES) {
  const filePath = resolve(ROOT, 'messages', `${locale}.json`)
  if (!existsSync(filePath)) {
    console.error(`❌ check:i18n-dynamic — messages/${locale}.json not found.`)
    process.exit(1)
  }
  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (err) {
    console.error(`❌ check:i18n-dynamic — messages/${locale}.json is not valid JSON: ${err.message}`)
    process.exit(1)
  }
  keySets[locale] = new Set(collectKeys(data))
}

// ── load manifest ───────────────────────────────────────────────────────────

if (!existsSync(MANIFEST_PATH)) {
  console.error('❌ check:i18n-dynamic — scripts/i18n-dynamic-manifest.json not found / unreadable.')
  process.exit(1)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
} catch (err) {
  console.error(`❌ check:i18n-dynamic — scripts/i18n-dynamic-manifest.json is not valid JSON: ${err.message}`)
  process.exit(1)
}

if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
  console.error('❌ check:i18n-dynamic — scripts/i18n-dynamic-manifest.json must contain a non-empty "entries" array.')
  process.exit(1)
}

const seenManifestIds = new Set()
for (const entry of manifest.entries) {
  if (typeof entry.id !== 'string' || !entry.id) {
    console.error(`❌ check:i18n-dynamic — malformed manifest entry ${JSON.stringify(entry)}: "id" must be a non-empty string.`)
    process.exit(1)
  }
  if (seenManifestIds.has(entry.id)) {
    console.error(`❌ check:i18n-dynamic — duplicate manifest entry id "${entry.id}".`)
    process.exit(1)
  }
  seenManifestIds.add(entry.id)
  if (typeof entry.site !== 'string' || !entry.site) {
    console.error(`❌ check:i18n-dynamic — malformed manifest entry "${entry.id}": "site" must be a non-empty string.`)
    process.exit(1)
  }
  if (typeof entry.namespace !== 'string' || !entry.namespace) {
    console.error(`❌ check:i18n-dynamic — malformed manifest entry "${entry.id}": "namespace" must be a non-empty string.`)
    process.exit(1)
  }
  if (!Array.isArray(entry.keys) || entry.keys.length === 0 || !entry.keys.every((k) => typeof k === 'string' && k)) {
    console.error(`❌ check:i18n-dynamic — malformed manifest entry "${entry.id}": "keys" must be a non-empty array of non-empty strings.`)
    process.exit(1)
  }
}

// ── load baseline ───────────────────────────────────────────────────────────

if (!existsSync(BASELINE_PATH)) {
  console.error('❌ check:i18n-dynamic — scripts/i18n-dynamic-baseline.json not found / unreadable.')
  process.exit(1)
}

let baseline
try {
  baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
} catch (err) {
  console.error(`❌ check:i18n-dynamic — scripts/i18n-dynamic-baseline.json is not valid JSON: ${err.message}`)
  process.exit(1)
}

for (const [fullKey, info] of Object.entries(baseline)) {
  if (!info || typeof info.owner !== 'string' || !info.owner) {
    console.error(`❌ check:i18n-dynamic — baseline entry "${fullKey}" must have a non-empty "owner".`)
    process.exit(1)
  }
  if (PLACEHOLDER_OWNER_RE.test(info.owner)) {
    console.error(`❌ check:i18n-dynamic — baseline entry "${fullKey}" still has the placeholder owner — assign an owning task.`)
    process.exit(1)
  }
}

// ── build distinct namespace.key set ────────────────────────────────────────

const fullKeys = new Set()
for (const entry of manifest.entries) {
  for (const key of entry.keys) {
    fullKeys.add(`${entry.namespace}.${key}`)
  }
}

console.log(`check:i18n-dynamic — ${manifest.entries.length} manifest entries, ${fullKeys.size} distinct namespace.key pairs, ${LOCALES.length} locales`)
if (manifest.source) console.log(`  Source: ${manifest.source}`)
console.log('')

// ── scan: find missing (namespace.key, locale) cells ────────────────────────

const missingByKey = {} // fullKey -> [locale, ...]
for (const fullKey of fullKeys) {
  const missingLocales = LOCALES.filter((locale) => !keySets[locale].has(fullKey))
  if (missingLocales.length > 0) {
    missingByKey[fullKey] = missingLocales
  }
}

const errors = []
const warns = []
for (const [fullKey, missingLocales] of Object.entries(missingByKey)) {
  const base = baseline[fullKey]
  for (const locale of missingLocales) {
    if (base && Array.isArray(base.locales) && base.locales.includes(locale)) {
      warns.push({ fullKey, locale, owner: base.owner })
    } else {
      errors.push({ fullKey, locale })
    }
  }
}

// ── report (grouped: namespace.key -> missing locales) ──────────────────────

const sortedMissing = Object.keys(missingByKey).sort()
if (sortedMissing.length === 0) {
  console.log('  All manifest-resolved keys present in all 4 locale files.')
} else {
  for (const fullKey of sortedMissing) {
    const base = baseline[fullKey]
    for (const locale of missingByKey[fullKey]) {
      const isWarn = base && Array.isArray(base.locales) && base.locales.includes(locale)
      const tag = isWarn ? `WARN  (baselined — ${base.owner ?? 'no owner'})` : 'ERROR'
      console.log(`  ${tag}  ${fullKey}  [${locale}]`)
    }
  }
}
console.log('')

// ── stale baseline entries (key now present, advisory only) ─────────────────

const staleEntries = []
for (const [fullKey, info] of Object.entries(baseline)) {
  if (!info || !Array.isArray(info.locales)) continue
  const stillMissing = missingByKey[fullKey] ?? []
  const staleLocales = info.locales.filter((locale) => !stillMissing.includes(locale))
  if (staleLocales.length > 0) {
    staleEntries.push({ fullKey, staleLocales, owner: info.owner })
  }
}

if (staleEntries.length > 0) {
  console.log('  INFO — stale baseline entries (key now present, remove from baseline):')
  for (const { fullKey, staleLocales, owner } of staleEntries) {
    console.log(`    ${fullKey}  [${staleLocales.join(', ')}]  (owner: ${owner ?? 'unknown'})`)
  }
  console.log('')
}

// ── summary ──────────────────────────────────────────────────────────────────

console.log(`Summary: ${fullKeys.size} keys checked · ${LOCALES.length} locales · ${warns.length} baselined-warn(s) · ${errors.length} error(s)`)
console.log('')

// ── modes ────────────────────────────────────────────────────────────────────

if (UPDATE_BASELINE) {
  const newBaseline = {}
  let placeholderCount = 0
  for (const [fullKey, missingLocales] of Object.entries(missingByKey)) {
    const existingOwner = baseline[fullKey]?.owner
    const owner = existingOwner ?? PLACEHOLDER_OWNER
    if (PLACEHOLDER_OWNER_RE.test(owner)) placeholderCount++
    newBaseline[fullKey] = {
      locales: missingLocales,
      owner,
    }
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2) + '\n', 'utf8')
  console.log(`Baseline written -> scripts/i18n-dynamic-baseline.json (${Object.keys(newBaseline).length} entries).`)
  if (placeholderCount > 0) {
    console.log(`${placeholderCount} new entry(ies) written with placeholder owner — assign an owning task before the gate will pass.`)
  }
  process.exit(0)
}

if (REPORT_ONLY) {
  console.log('Report-only mode (--report): exiting 0 regardless of findings.')
  process.exit(0)
}

if (errors.length === 0) {
  console.log('check:i18n-dynamic PASSED.')
  process.exit(0)
}

console.error(`check:i18n-dynamic FAILED — ${errors.length} non-baselined missing key(s) (see ERROR lines above).`)
console.error('Fix: add the key to messages/{sq,en,uk,it}.json, or, if intentional debt, add it to')
console.error('scripts/i18n-dynamic-baseline.json with an owning task. Docs: docs/i18n-rules.md')
process.exit(1)
