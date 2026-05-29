#!/usr/bin/env node
/**
 * check-i18n-parity.mjs — Locale key-set parity guard + raw-enum leak detector.
 *
 * Part 1 — PARITY: Verifies that all four locale files (sq/en/uk/it) contain
 * identical key paths. Exits non-zero on any divergence.
 *
 * Part 2 — RAW-ENUM SCAN: Scans .tsx files for known raw enum codes rendered
 * directly as JSX text content (e.g. `>{u.role}<` or `{entry.new_status}`) and
 * reports suspicious patterns so reviewers can verify them. Does NOT fail the
 * build — it reports findings for manual review.
 *
 * Usage: node scripts/check-i18n-parity.mjs
 *        npm run check:i18n
 *
 * Added by Task 288 (2026-05-29). Mirrors check-schema-drift.mjs style.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const LOCALES = ['sq', 'en', 'uk', 'it']

// ── Part 1: Key-set parity ─────────────────────────────────────────────────────

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

const localeData = {}
for (const locale of LOCALES) {
  const filePath = resolve(ROOT, 'messages', `${locale}.json`)
  try {
    localeData[locale] = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (err) {
    console.error(`❌ Cannot read messages/${locale}.json: ${err.message}`)
    process.exit(1)
  }
}

const keySets = {}
for (const locale of LOCALES) {
  keySets[locale] = new Set(collectKeys(localeData[locale]))
}

const primary = 'sq'
const primaryKeys = keySets[primary]
let hasParityErrors = false

console.log('── Part 1: Locale key-set parity ──────────────────────────────')
for (const locale of LOCALES) {
  if (locale === primary) continue
  const localeKeys = keySets[locale]
  const missing = [...primaryKeys].filter(k => !localeKeys.has(k))
  const extra   = [...localeKeys].filter(k => !primaryKeys.has(k))

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✅ ${locale}  — ${localeKeys.size} keys (matches ${primary})`)
    continue
  }

  hasParityErrors = true
  console.log(`  ❌ ${locale}  — ${localeKeys.size} keys (${primary} has ${primaryKeys.size})`)
  if (missing.length > 0) {
    console.log(`     Missing in ${locale}:`)
    missing.slice(0, 20).forEach(k => console.log(`       - ${k}`))
    if (missing.length > 20) console.log(`       … and ${missing.length - 20} more`)
  }
  if (extra.length > 0) {
    console.log(`     Extra in ${locale}:`)
    extra.slice(0, 20).forEach(k => console.log(`       + ${k}`))
    if (extra.length > 20) console.log(`       … and ${extra.length - 20} more`)
  }
}

// ── Part 2: Raw-enum pattern scan ─────────────────────────────────────────────

console.log('')
console.log('── Part 2: Raw-enum leak scan ──────────────────────────────────')

// Patterns that indicate a raw enum being rendered without going through t()
const RAW_ENUM_PATTERNS = [
  // {x.role} {x.status} {x.plan} rendered directly without t()
  /\{[a-z_]+\.(role|status|plan|user_type)\}(?!\s*===)/g,
  // entry.new_status, entry.old_status etc. directly in JSX (outside t())
  /\{entry\.(new|old)_(status|value|role)\}/g,
  // capitalize CSS alongside a raw code expression
  /capitalize.*\{[a-z_]+\.(status|role|plan)\}/g,
]

function collectTsxFiles(dir) {
  const results = []
  try {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.next' || entry.endsWith('.test.tsx') || entry.endsWith('.stories.tsx')) continue
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) results.push(...collectTsxFiles(full))
      else if (entry.endsWith('.tsx')) results.push(full)
    }
  } catch {}
  return results
}

const srcDir = resolve(ROOT, 'src')
const tsxFiles = collectTsxFiles(srcDir)

const rawEnumFindings = []
for (const file of tsxFiles) {
  const content = readFileSync(file, 'utf8')
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip comments, imports, type definitions
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*') || line.includes('import ') || line.includes('type ') || line.includes('interface ')) continue
    // Skip lines where the pattern is inside a t() call or comparison
    for (const pattern of RAW_ENUM_PATTERNS) {
      pattern.lastIndex = 0
      if (pattern.test(line) && !line.includes('t(`') && !line.includes("t('") && !line.includes('t("') && !line.includes('===') && !line.includes('!==') && !line.includes('&&') && !line.includes('??')) {
        const rel = file.replace(ROOT, '').replace(/\\/g, '/')
        rawEnumFindings.push({ file: rel, line: i + 1, text: line.trim().slice(0, 120) })
      }
    }
  }
}

if (rawEnumFindings.length === 0) {
  console.log('  ✅ No suspicious raw-enum patterns detected in .tsx files.')
} else {
  console.log(`  ⚠️  ${rawEnumFindings.length} potential raw-enum rendering(s) detected (manual review required):`)
  rawEnumFindings.slice(0, 30).forEach(({ file, line, text }) => {
    console.log(`     ${file}:${line}`)
    console.log(`       ${text}`)
  })
  if (rawEnumFindings.length > 30) {
    console.log(`     … and ${rawEnumFindings.length - 30} more`)
  }
  console.log('  (These may be false positives. Verify each is inside a t() call or a code identifier context.)')
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('')
if (hasParityErrors) {
  console.log('❌ i18n parity check FAILED — locale key sets diverge.')
  console.log('   Add or remove the listed keys in all four locale files.')
  process.exit(1)
} else {
  console.log(`✅ Parity PASSED — all ${LOCALES.length} locale files have identical key sets (${primaryKeys.size} keys).`)
  if (rawEnumFindings.length > 0) {
    console.log('⚠️  Raw-enum scan found potential issues — see above for manual review.')
    console.log('   (Non-blocking — does not fail the build.)')
  }
}
