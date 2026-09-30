#!/usr/bin/env node
/**
 * check-type-responsive.mjs — no static large text reaches a phone (Task 886, GR-3c).
 *
 * The Mantine theme's `headings.sizes` are one fixed value at every width (h1 48 / h2 36 / h3 30 /
 * h4 24px), so a `<Title size="h3">` renders 30px at 320px. GR-3c forbids that; `TITLE_FZ`
 * (`src/design-system/mantine/typography.ts`) is the canonical breakpoint-keyed scale. This gate makes
 * the rule structural instead of remembered.
 *
 * Arm A (Mantine) — a violation is:
 *   - a `<Title>` whose effective size (`fz`, else `size`, else `h{order}`, default order 1) is `h1`-`h4`
 *     and whose `fz` is neither an object literal `{{ ... }}` nor an identifier / member imported from
 *     `typography.ts` (`TITLE_FZ.h4`, `SECTION_HEADING_FZ`);
 *   - any other element with a static `fz` or `size` of `"h1"`-`"h4"`, or an `fz`/`size` bound to a
 *     `theme.headings.sizes.*` expression (a static large size hidden behind a theme expression) —
 *     unless that element carries a responsive `fz`.
 * Arm A has no baseline: it must be 0.
 *
 * Arm B (legacy Tailwind) — a `className` string literal that holds a bare `text-(2xl..9xl|title-*)`
 * token with no `sm:`/`md:`/`lg:`/`xl:`/`2xl:` `text-` token in the same literal is a violation unless its
 * `path :: token` is in `scripts/type-responsive-baseline.json`. The baseline can shrink but never grow:
 * an entry that no longer matches anything is STALE and fails.
 *
 * Usage:
 *   node scripts/check-type-responsive.mjs                 # gate (CI default)
 *   npm run check:type-responsive
 *   npm run check:type-responsive:verify                   # CI-safe self-test (--verify-gate)
 *
 * Exit codes: 0 clean · 1 violation or stale baseline entry · 2 usage or parse error.
 *
 * Docs: docs/golden-rules.md GR-3c, docs/mantine-responsive-design-system.md §7.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, join, dirname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASELINE_PATH = join(ROOT, 'scripts', 'type-responsive-baseline.json')

const LARGE_HEADING = /^h[1-4]$/
const LARGE_TW = /^text-(?:2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|title-[a-z0-9]+)$/
const TW_STEP = /^(?:sm|md|lg|xl|2xl):text-/

// ── Source scanning ──────────────────────────────────────────────────────────

/** Blank out comments, keeping every newline and offset so line numbers stay exact. */
export function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  return src.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[ \t])\/\/[^\n]*/g, (m, lead) => lead + blank(m.slice(lead.length)))
}

function lineOf(src, index) {
  let n = 1
  for (let i = 0; i < index; i++) if (src.charCodeAt(i) === 10) n++
  return n
}

/** Index of the `>` that closes the opening tag that starts at `i`, or -1. */
function tagEnd(src, i) {
  let depth = 0
  let quote = null
  for (let k = i; k < src.length; k++) {
    const c = src[k]
    if (quote) {
      if (c === quote) quote = null
      continue
    }
    if (depth === 0 && (c === '"' || c === "'")) {
      quote = c
      continue
    }
    if (c === '`') {
      quote = c
      continue
    }
    if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0) return k
  }
  return -1
}

function balanced(text, i, open, close) {
  let depth = 0
  let quote = null
  for (let k = i; k < text.length; k++) {
    const c = text[k]
    if (quote) {
      if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      continue
    }
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return k
    }
  }
  return -1
}

/** Top-level attributes of an opening tag: { name -> { kind: 'string'|'expr'|'bool', value } }. */
function parseAttributes(tagText, afterName) {
  const attrs = {}
  let i = afterName
  while (i < tagText.length) {
    while (i < tagText.length && /\s/.test(tagText[i])) i++
    if (i >= tagText.length || tagText[i] === '>' || tagText[i] === '/') break
    if (tagText[i] === '{') {
      const end = balanced(tagText, i, '{', '}')
      if (end < 0) break
      i = end + 1
      continue
    }
    const m = /^[A-Za-z_$][\w$:.-]*/.exec(tagText.slice(i))
    if (!m) {
      i++
      continue
    }
    const name = m[0]
    i += name.length
    if (tagText[i] !== '=') {
      attrs[name] = { kind: 'bool', value: true }
      continue
    }
    i++
    const q = tagText[i]
    if (q === '"' || q === "'") {
      const end = tagText.indexOf(q, i + 1)
      if (end < 0) break
      attrs[name] = { kind: 'string', value: tagText.slice(i + 1, end) }
      i = end + 1
    } else if (q === '{') {
      const end = balanced(tagText, i, '{', '}')
      if (end < 0) break
      attrs[name] = { kind: 'expr', value: tagText.slice(i + 1, end).trim() }
      i = end + 1
    } else {
      break
    }
  }
  return attrs
}

/** Names imported from a `typography` module (`@/design-system/mantine/typography`, relative, ...). */
function typographyImports(src) {
  const names = new Set()
  const re = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(src))) {
    if (!/(^|\/)typography(\.ts)?$/.test(m[2])) continue
    for (const part of m[1].split(',')) {
      const seg = part.trim().split(/\s+as\s+/)
      const local = (seg[1] ?? seg[0]).trim()
      if (local) names.add(local)
    }
  }
  return names
}

/** 'object' | 'imported' | 'theme-static' | 'other' for an `fz` expression. */
function classifyFzExpr(expr, imports) {
  if (expr.startsWith('{')) return 'object'
  if (/headings\.sizes/.test(expr)) return 'theme-static'
  const ref = /^([A-Za-z_$][\w$]*)(?:\.[\w$]+|\[[^\]]+\])*$/.exec(expr)
  if (ref && imports.has(ref[1])) return 'imported'
  return 'other'
}

/**
 * Pure: analyse one source file. Returns Arm A violations and every bare large Tailwind token.
 * `unparsed` lists the opening tags this scanner could not close: the gate cannot classify them, so the
 * real run treats each as a parse error (exit 2) rather than skipping it.
 */
export function analyzeSource(relPath, rawSrc) {
  const src = stripComments(rawSrc)
  const imports = typographyImports(src)
  const armA = []
  const twTokens = []
  const unparsed = []

  const tagRe = /<([A-Z][\w.]*)(?=[\s/>])/g
  let m
  while ((m = tagRe.exec(src))) {
    if (m.index > 0 && /[\w$)\].]/.test(src[m.index - 1])) continue // a TS generic, not a JSX tag
    const end = tagEnd(src, m.index)
    if (end < 0) {
      unparsed.push({ path: relPath, line: lineOf(src, m.index), name: m[1] })
      continue
    }
    const name = m[1]
    const tagText = src.slice(m.index, end + 1)
    const attrs = parseAttributes(tagText, 1 + name.length)
    const line = lineOf(src, m.index)
    const fz = attrs.fz
    const size = attrs.size

    const fzResponsive =
      fz?.kind === 'expr' && (classifyFzExpr(fz.value, imports) === 'object' || classifyFzExpr(fz.value, imports) === 'imported')

    if (name === 'Title') {
      if (fzResponsive) continue
      let effective = null
      if (fz?.kind === 'string') effective = fz.value
      else if (size?.kind === 'string') effective = size.value
      else if (fz?.kind === 'expr' && classifyFzExpr(fz.value, imports) === 'theme-static') effective = 'h3'
      else if (!attrs.order) effective = 'h1'
      else if (attrs.order.kind === 'expr' && /^\d$/.test(attrs.order.value)) effective = `h${attrs.order.value}`
      else if (attrs.order.kind === 'string' && /^\d$/.test(attrs.order.value)) effective = `h${attrs.order.value}`
      if (fz?.kind === 'expr' && !fzResponsive && !(effective && LARGE_HEADING.test(effective))) {
        // an unseen fz expression on a Title whose size we cannot prove small is treated as large only when size says so
        effective = size?.kind === 'string' ? size.value : effective
      }
      if (effective && LARGE_HEADING.test(effective)) {
        armA.push({
          path: relPath,
          line,
          message: `<Title> effective size ${effective} is static (fixed at every width). ${effective === 'h1' ? 'TITLE_FZ has no h1 row: use a breakpoint-keyed fz object built from theme keys.' : `Add fz={TITLE_FZ.${effective}} (src/design-system/mantine/typography.ts) or a breakpoint-keyed fz object.`}`,
        })
      }
      continue
    }

    if (fzResponsive) continue
    const bad = []
    if (fz?.kind === 'string' && LARGE_HEADING.test(fz.value)) bad.push(`fz="${fz.value}"`)
    if (size?.kind === 'string' && LARGE_HEADING.test(size.value)) bad.push(`size="${size.value}"`)
    if (fz?.kind === 'expr' && classifyFzExpr(fz.value, imports) === 'theme-static') bad.push(`fz={${fz.value}}`)
    if (size?.kind === 'expr' && /headings\.sizes/.test(size.value)) bad.push(`size={${size.value}}`)
    if (bad.length > 0) {
      armA.push({
        path: relPath,
        line,
        message: `<${name}> has a static large size ${bad.join(' ')}. Use a breakpoint-keyed fz built from theme keys (TITLE_FZ).`,
      })
    }
  }

  const classRe = /className\s*=\s*(?:\{\s*)?(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g
  while ((m = classRe.exec(src))) {
    const literal = m[1] ?? m[2] ?? m[3] ?? ''
    const tokens = literal.split(/\s+/).filter(Boolean)
    if (tokens.some((t) => TW_STEP.test(t))) continue
    const line = lineOf(src, m.index)
    for (const token of tokens) {
      if (LARGE_TW.test(token)) twTokens.push({ path: relPath, line, token, key: `${relPath} :: ${token}` })
    }
  }

  return { armA, twTokens, unparsed }
}

/**
 * Pure: the whole decision. `files` — [{ path, src }]. `baselineEntries` — [{ key, reason }].
 * A baseline key covers exactly one occurrence; an extra occurrence of the same key is new.
 */
export function evaluate(files, baselineEntries) {
  const armA = []
  const allTw = []
  const unparsed = []
  for (const f of files) {
    const r = analyzeSource(f.path, f.src)
    armA.push(...r.armA)
    allTw.push(...r.twTokens)
    unparsed.push(...r.unparsed)
  }
  const remaining = new Map()
  for (const e of baselineEntries) remaining.set(e.key, (remaining.get(e.key) ?? 0) + 1)
  const newTw = []
  const matched = new Set()
  for (const t of allTw) {
    const left = remaining.get(t.key) ?? 0
    if (left > 0) {
      remaining.set(t.key, left - 1)
      matched.add(t.key)
    } else {
      newTw.push(t)
    }
  }
  const stale = baselineEntries.filter((e) => !matched.has(e.key)).map((e) => e.key)
  return { armA, newTw, stale, baselined: allTw.length - newTw.length, unparsed }
}

/**
 * Pure: the exit-code decision, called by the real run and by the self-test's wiring check.
 * A tag the gate cannot close is a parse error (2) and wins over a finding (1): a gate that cannot
 * read part of the tree must not report on the rest as if it had.
 */
export function evaluateGateExitCode({ armACount, newTwCount, staleCount, unparsedCount = 0 }) {
  if (unparsedCount > 0) return 2
  return armACount > 0 || newTwCount > 0 || staleCount > 0 ? 1 : 0
}

// ── Real tree ────────────────────────────────────────────────────────────────

const EXCLUDED_DIRS = new Set(['node_modules', '.next', '__tests__'])

function walk(dirAbs, out) {
  for (const name of readdirSync(dirAbs)) {
    const abs = join(dirAbs, name)
    const rel = relative(ROOT, abs).split(sep).join('/')
    const st = statSync(abs)
    if (st.isDirectory()) {
      if (EXCLUDED_DIRS.has(name) || rel === 'src/stories') continue
      walk(abs, out)
    } else if (name.endsWith('.tsx') && !/\.(stories|test)\.tsx$/.test(name)) {
      out.push({ path: rel, abs })
    }
  }
}

export function listSourceFiles() {
  const out = []
  walk(join(ROOT, 'src'), out)
  return out.sort((a, b) => (a.path < b.path ? -1 : 1))
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return { error: `Baseline missing: ${relative(ROOT, BASELINE_PATH)}` }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  } catch (err) {
    return { error: `Cannot read/parse ${relative(ROOT, BASELINE_PATH)}: ${err.message}` }
  }
  if (!parsed || !Array.isArray(parsed.entries) || parsed.entries.some((e) => typeof e.key !== 'string' || typeof e.reason !== 'string' || !e.reason)) {
    return { error: `${relative(ROOT, BASELINE_PATH)} must be { "entries": [{ "key": "path :: token", "reason": "..." }] }, each with a reason.` }
  }
  return { entries: parsed.entries }
}

function printScope() {
  console.log('check:type-responsive — no static large text reaches a phone (Task 886, GR-3c)')
  console.log('    Scanned: src/**/*.tsx, excluding *.stories.tsx, *.test.tsx, __tests__/ and src/stories/.')
  console.log('    Arm A: <Title> of effective size h1-h4 without a responsive fz; any other element with a static')
  console.log('           fz/size h1-h4 or an fz/size bound to theme.headings.sizes.*.')
  console.log('    Arm B: bare Tailwind text-2xl..9xl / text-title-* in a className literal, unless baselined.')
  console.log('    Cannot see (stated, never implicit):')
  console.log('      - font-size in CSS modules or in theme.ts component `styles`;')
  console.log('      - a className composed across variables or cn()/clsx() arguments;')
  console.log('      - fz passed through a variable that is not imported from typography.ts;')
  console.log('      - the values of an fz object literal: it is accepted without checking them (the GR-3c measurement closes it);')
  console.log('      - size/fz written as any other expression (e.g. size={\'h3\'}, a ternary): it is not read as static;')
  console.log('      - computed sizes: the GR-3c measurement at 320/390/768/1440 stays binding.')
  console.log('')
}

function realRun() {
  printScope()
  const loaded = loadBaseline()
  if (loaded.error) {
    console.error(`ERROR ${loaded.error}`)
    process.exit(2)
  }
  const files = []
  try {
    for (const f of listSourceFiles()) files.push({ path: f.path, src: readFileSync(f.abs, 'utf8') })
  } catch (err) {
    console.error(`ERROR cannot read the source tree: ${err.message}`)
    process.exit(2)
  }
  const r = evaluate(files, loaded.entries)
  console.log(`    Files scanned: ${files.length}`)
  console.log(`    Arm A violations: ${r.armA.length}`)
  console.log(`    Arm B: ${r.baselined} baselined, ${r.newTw.length} new, ${r.stale.length} stale`)
  console.log(`    Opening tags this scanner could not close (parse error): ${r.unparsed.length}`)
  console.log('')
  for (const u of r.unparsed) console.error(`ERROR  ${u.path}:${u.line}  opening <${u.name}> tag could not be closed — the gate cannot classify it`)
  for (const v of r.armA) console.error(`FAIL  Arm A  ${v.path}:${v.line}  ${v.message}`)
  for (const t of r.newTw) {
    console.error(`FAIL  Arm B  ${t.path}:${t.line}  static \`${t.token}\` with no sm:/md:/lg: text- step and no baseline entry. Migrate the surface to Mantine (TITLE_FZ), or add a responsive step.`)
  }
  for (const k of r.stale) console.error(`FAIL  stale baseline entry "${k}" — the site was fixed or removed; delete the entry from scripts/type-responsive-baseline.json.`)
  const code = evaluateGateExitCode({ armACount: r.armA.length, newTwCount: r.newTw.length, staleCount: r.stale.length, unparsedCount: r.unparsed.length })
  if (code === 0) console.log('PASS  check:type-responsive — no static large Title/fz/size; Arm B equals the baseline exactly.')
  process.exit(code)
}

// ── Self-test (--verify-gate) ────────────────────────────────────────────────

function runSelfTest() {
  console.log('check:type-responsive gate self-test (--verify-gate, Task 886) — running 13 arms + exit wiring\n')
  let failed = 0
  const IMPORT = "import { TITLE_FZ } from '@/design-system/mantine/typography'\n"
  const file = (src) => [{ path: 'src/fake/Verify.tsx', src }]
  const verdict = (files, baseline = []) => {
    const r = evaluate(files, baseline)
    return { fail: r.armA.length + r.newTw.length + r.stale.length > 0, r }
  }
  const arm = (n, label, expectFail, src, baseline) => {
    const { fail } = verdict(file(src), baseline)
    const ok = fail === expectFail
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  Arm ${n} — ${label} -> ${fail ? 'fail' : 'pass'} (expected ${expectFail ? 'fail' : 'pass'})`)
    if (!ok) failed++
  }
  arm(1, 'static <Title order={1}>', true, 'export const A = () => <Title order={1}>x</Title>\n')
  arm(2, '<Title size="h3">', true, 'export const A = () => <Title size="h3">x</Title>\n')
  arm(3, '<Title order={2} size="h4" fz={TITLE_FZ.h4}>', false, `${IMPORT}export const A = () => <Title order={2} size="h4" fz={TITLE_FZ.h4}>x</Title>\n`)
  arm(4, "<Title fz={{ base: 'h5', md: 'h3' }}>", false, "export const A = () => <Title fz={{ base: 'h5', md: 'h3' }}>x</Title>\n")
  arm(5, '<Title order={5}>', false, 'export const A = () => <Title order={5}>x</Title>\n')
  arm(6, '<Text fz="h2">', true, 'export const A = () => <Text fz="h2">x</Text>\n')
  arm(7, 'new className="text-3xl"', true, 'export const A = () => <h1 className="text-3xl">x</h1>\n')
  arm(8, 'className="text-xl sm:text-2xl"', false, 'export const A = () => <h1 className="text-xl sm:text-2xl">x</h1>\n')
  arm(9, 'a baselined literal', false, 'export const A = () => <h1 className="text-2xl font-bold">x</h1>\n', [{ key: 'src/fake/Verify.tsx :: text-2xl', reason: 'verify' }])
  arm(10, 'a stale baseline entry', true, 'export const A = () => <h1 className="text-xl">x</h1>\n', [{ key: 'src/fake/Verify.tsx :: text-2xl', reason: 'verify' }])

  // Extra arms beyond the ten: the theme-expression site (Task 853 review 1) and the exit wiring.
  {
    const { fail } = verdict(file('export const A = () => <Text fz={theme.headings.sizes.h3.fontSize}>x</Text>\n'))
    const ok = fail
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  Arm 11 — fz bound to theme.headings.sizes.* -> ${fail ? 'fail' : 'pass'} (expected fail)`)
    if (!ok) failed++
  }
  {
    const dirty = evaluateGateExitCode({ armACount: 1, newTwCount: 0, staleCount: 0 })
    const dirtyTw = evaluateGateExitCode({ armACount: 0, newTwCount: 1, staleCount: 0 })
    const dirtyStale = evaluateGateExitCode({ armACount: 0, newTwCount: 0, staleCount: 1 })
    const clean = evaluateGateExitCode({ armACount: 0, newTwCount: 0, staleCount: 0 })
    const parseError = evaluateGateExitCode({ armACount: 0, newTwCount: 0, staleCount: 0, unparsedCount: 1 })
    const parseErrorWins = evaluateGateExitCode({ armACount: 1, newTwCount: 0, staleCount: 0, unparsedCount: 1 })
    const ok = dirty === 1 && dirtyTw === 1 && dirtyStale === 1 && clean === 0 && parseError === 2 && parseErrorWins === 2
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  Arm 12 — exit-code wiring: any finding -> 1, unparsed tag -> 2 (wins over a finding), clean -> 0`)
    if (!ok) failed++
  }
  {
    // Arm 13 — an opening tag with no closing `>` must surface as a parse error, never be skipped.
    const r = evaluate(file('export const A = () => <Title order={2}'), [])
    const code = evaluateGateExitCode({ armACount: r.armA.length, newTwCount: r.newTw.length, staleCount: r.stale.length, unparsedCount: r.unparsed.length })
    const ok = r.unparsed.length === 1 && code === 2
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  Arm 13 — unclosable <Title order={2} -> parse error, exit ${code} (expected 2)`)
    if (!ok) failed++
  }

  console.log(`\nSelf-test: ${13 - failed} passed, ${failed} failed`)
  if (failed > 0) {
    console.error('FAIL  check:type-responsive:verify — the gate self-test found a broken arm.')
    process.exit(1)
  }
  console.log('PASS  check:type-responsive:verify — all arms behave correctly.')
  process.exit(0)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const args = process.argv.slice(2)
  const unknown = args.filter((a) => a !== '--verify-gate')
  if (unknown.length > 0) {
    console.error(`ERROR unknown argument: ${unknown.join(' ')}\nUsage: node scripts/check-type-responsive.mjs [--verify-gate]`)
    process.exit(2)
  }
  if (args.includes('--verify-gate')) runSelfTest()
  else realRun()
}
