// @vitest-environment node
/**
 * Unit-test suite for scripts/check-css-var-resolvability.mjs (Task 700, Sprint 46.3;
 * ownership-snapshot suite added by Task 743, Sprint 75).
 *
 * Covers R3-R6/AC4/AC5's parser-level guarantees: comment stripping across all
 * required forms (CSS block, TS/TSX block, TS/TSX line, JSX), string/template
 * literal preservation, ownership extraction scoped to @theme/@theme inline/
 * :root, @property registration as a declaration (R5), the fallback split
 * (R10), and the dynamic-site prefix rule (R6). Task 743 adds: the snapshot
 * parser (valid/missing/malformed), drift computation, dropped-name
 * detection and writer-refusal coverage (R7).
 *
 * Run: npx vitest run scripts/__tests__/css-var-resolvability.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, mkdtempSync, rmSync, writeFileSync, mkdirSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  stripComments,
  extractOwnedNames,
  extractCssDeclaredNames,
  extractPropertyRegisteredNames,
  findVarReferences,
  findDynamicVarSites,
  parseSnapshotContent,
  loadSnapshot,
  serializeSnapshot,
  writeSnapshotFile,
  computeDrift,
  findDroppedNameRefs,
  performUpdateSnapshot,
} from '../check-css-var-resolvability.mjs'

describe('stripComments — CSS block comments (R4)', () => {
  it('strips a CSS block comment, incl. one that contains a declaration-shaped substring (globals.css:148 defect class, D2/C3)', () => {
    const css = `--space-0: 0px;
/* Named tokens --space-N mirror the Tailwind spacing step N.
   --spacing-N: var(--space-N) wires each p-N / m-N / gap-N / h-N
   utility to resolve through the named token. */
--space-1: 0.25rem;`
    const stripped = stripComments(css, true)
    expect(stripped).not.toContain('--spacing-N')
    expect(stripped).toContain('--space-0')
    expect(stripped).toContain('--space-1')
  })

  it('preserves line/column alignment (newline count unchanged)', () => {
    const css = `a: 1;\n/* comment\nspanning\nlines */\nb: 2;`
    const stripped = stripComments(css, true)
    expect(stripped.split('\n').length).toBe(css.split('\n').length)
  })

  it('CSS has no line-comment form — a literal `//` is left untouched', () => {
    const css = `content: "//not-a-comment"; /* real comment */`
    const stripped = stripComments(css, true)
    expect(stripped).toContain('"//not-a-comment"')
  })
})

describe('stripComments — TS/TSX line comments (R4, §0.3 E4 / control C3)', () => {
  it('strips a `//` line comment, incl. the exact theme.ts:280 shape (var(--button-hover, ...) after //)', () => {
    const ts = `const x = 1
      // Hover: \`--button-hover\` is the var Mantine's own compiled \`:hover\` rule reads
      // (\`background-color: var(--button-hover, ...)\` — verified via node_modules)
      const y = 2`
    const stripped = stripComments(ts, false)
    expect(stripped).not.toContain('--button-hover')
    expect(stripped).toContain('const x = 1')
    expect(stripped).toContain('const y = 2')
  })

  it('does not corrupt a `//` inside a string literal — https:// must survive (§0.3 E4)', () => {
    const ts = `const url = "https://example.com/var(--fake)"`
    const stripped = stripComments(ts, false)
    expect(stripped).toContain('https://example.com')
  })

  it('does not corrupt a `//` inside a single-quoted string literal', () => {
    const ts = `const url = 'https://example.com'`
    const stripped = stripComments(ts, false)
    expect(stripped).toContain("https://example.com")
  })
})

describe('stripComments — TS/TSX block comments and JSX comments (R4)', () => {
  it('strips a /* */ block comment in TS (LightboxView.tsx:33-42 shape)', () => {
    const ts = `/**
     * ActionIcon's rules (background: var(--ai-bg), color: var(--ai-color))
     * are unlayered.
     */
    const LIGHTBOX_ACTION_ICON_STYLE = { color: 'var(--color-overlay-foreground)' }`
    const stripped = stripComments(ts, false)
    expect(stripped).not.toContain('--ai-bg')
    expect(stripped).not.toContain('--ai-color')
    expect(stripped).toContain('--color-overlay-foreground') // real code, not commented
  })

  it('strips a JSX comment {/* ... */}, leaving the surrounding braces/code intact', () => {
    const tsx = `<div>{/* var(--fake-token) should not be scanned */}<span style={{ color: 'var(--color-overlay)' }} /></div>`
    const stripped = stripComments(tsx, false)
    expect(stripped).not.toContain('--fake-token')
    expect(stripped).toContain('--color-overlay') // real code, survives
    expect(stripped).toContain('<div>')
    expect(stripped).toContain('<span')
  })

  it('a JSDoc-style /** ... */ block comment mentioning a var name is stripped (mb-z-index shape)', () => {
    const ts = `/**
     * Mantine's Modal root Box carries the managed \`--mb-z-index\` CSS custom property inline
     */
    const real = 'var(--z-modal)'`
    const stripped = stripComments(ts, false)
    expect(stripped).not.toContain('--mb-z-index')
    expect(stripped).toContain('--z-modal')
  })
})

describe('stripComments — template literals (R4)', () => {
  it('preserves a var() reference inside a template literal', () => {
    const ts = 'const s = `var(--space-4)`'
    const stripped = stripComments(ts, false)
    expect(stripped).toContain('var(--space-4)')
  })

  it('preserves a dynamic construction site inside a template literal interpolation', () => {
    const ts = 'const s = `var(--mantine-color-${color}-5)`'
    const stripped = stripComments(ts, false)
    expect(stripped).toContain('var(--mantine-color-${color}-5)')
  })
})

describe('stripComments — regex-literal awareness (§3.5.1)', () => {
  it('does not misread a block-comment opener inside a regex literal as starting a real comment', () => {
    // A regex literal containing the two characters "/*" is not itself a
    // comment opener — the tokenizer must not treat it as one and swallow
    // the rest of the line.
    const ts = "const re = /a\\/\\*b/; const real = 'var(--space-4)'"
    const stripped = stripComments(ts, false)
    expect(stripped).toContain("var(--space-4)")
  })
})

describe('extractCssDeclaredNames + extractPropertyRegisteredNames (R5)', () => {
  it('finds a declaration anywhere in CSS content, not selector-scoped', () => {
    const css = `:where(.x,.y){--color-foo:red;--color-bar:blue}`
    const names = extractCssDeclaredNames(css)
    expect(names.has('--color-foo')).toBe(true)
    expect(names.has('--color-bar')).toBe(true)
  })

  it('@property --x counts as a declaration (R5) — the --tw-shadow family', () => {
    const css = `@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}`
    const registered = extractPropertyRegisteredNames(css)
    expect(registered.has('--tw-shadow')).toBe(true)
  })

  it('a name inside a CSS block comment is not counted as declared (comment stripping)', () => {
    const css = `/* --fake-token: 1px; */ --real-token: 2px;`
    const names = extractCssDeclaredNames(css)
    expect(names.has('--fake-token')).toBe(false)
    expect(names.has('--real-token')).toBe(true)
  })

  it('is robust against Tailwind-style backslash-escaped selector punctuation (the extractCssDeclaredNames rewrite fix)', () => {
    // Mirrors the real e55fe1d775976885.css shape that broke a naive
    // quote/paren-depth walk: an arbitrary-value selector backslash-escapes
    // its own apostrophes/parens as literal selector characters.
    const css = `.\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-3{width:1rem}:root{--radius:.75rem;--muted:#eee}`
    const names = extractCssDeclaredNames(css)
    expect(names.has('--radius')).toBe(true)
    expect(names.has('--muted')).toBe(true)
  })
})

describe('extractOwnedNames (R3, A2) — scoped to @theme / @theme inline / :root', () => {
  it('parses a minimal fixture correctly, excluding .dark and comment-only text', () => {
    const css = `
@theme {
  --breakpoint-notification-compact: 24.375rem;
}
@theme inline {
  --color-foo: var(--foo);
  /* --spacing-N: var(--space-N) is prose, not a declaration */
}
:root {
  --foo: red;
  --bar: blue;
}
.dark {
  --foo: green;
  --baz: purple;
}`
    const owned = extractOwnedNames(css)
    expect(owned.has('--breakpoint-notification-compact')).toBe(true)
    expect(owned.has('--color-foo')).toBe(true)
    expect(owned.has('--foo')).toBe(true)
    expect(owned.has('--bar')).toBe(true)
    expect(owned.has('--spacing-N')).toBe(false) // comment-only — R4
    expect(owned.has('--baz')).toBe(false) // .dark-only — A2, never scanned
  })

  it('an empty theme/:root fixture yields an empty owned set (R3 — no vacuous pass)', () => {
    const owned = extractOwnedNames('@theme inline { }')
    expect(owned.size).toBe(0)
  })

  it('matches the committed ownership snapshot (Task 743 Rev 1) — no hardcoded count', () => {
    // The owned count is no longer asserted as a literal number: Revision 0
    // hardcoded it (259 -> 257 -> 256 -> 297 across Tasks 695/749/743) and it
    // went stale twice, most recently breaking this exact test and verify-gate
    // C3 the moment an unrelated task added a token to globals.css. The
    // snapshot (scripts/css-var-ownership-snapshot.json) is now the single
    // source of truth for "what should be owned"; this test asserts the live
    // extraction matches it exactly, in both directions, so a real
    // add/drop still fails loudly (via drift, R3) without a second
    // hand-maintained number to also keep in sync.
    const raw = readFileSync('src/app/globals.css', 'utf8')
    const owned = extractOwnedNames(raw)
    const snapshot = loadSnapshot('scripts/css-var-ownership-snapshot.json')
    expect(snapshot.ok).toBe(true)
    const snapshotNames = snapshot.names!
    const added = [...owned].filter((n) => !snapshotNames.has(n))
    const dropped = [...snapshotNames].filter((n) => !owned.has(n))
    expect({ added, dropped }).toEqual({ added: [], dropped: [] })
    // --spacing-N is prose inside a comment at globals.css:146-150 (draft 1's
    // own D2 defect) — must never be counted.
    expect(owned.has('--spacing-N')).toBe(false)
    // --overlay-foreground is declared once, in :root only, since Task 695
    // deleted the @theme inline copy — still exactly one entry in the owned
    // set either way (A2 dedupes by name, not by declaration site).
    expect(owned.has('--overlay-foreground')).toBe(true)
  })
})

describe('findVarReferences — literal references + fallback split (R10)', () => {
  it('finds a plain var() reference with no fallback', () => {
    const refs = findVarReferences('a { color: var(--color-foo); }')
    expect(refs).toHaveLength(1)
    expect(refs[0]).toMatchObject({ name: '--color-foo', hasFallback: false })
  })

  it('finds a fallback-bearing reference and flags hasFallback', () => {
    const refs = findVarReferences('a { color: var(--color-foo, red); }')
    expect(refs).toHaveLength(1)
    expect(refs[0]).toMatchObject({ name: '--color-foo', hasFallback: true })
  })

  it('finds BOTH the outer and nested reference in a nested fallback (var(--tw-ease, var(--default-transition-timing-function)))', () => {
    const refs = findVarReferences(
      'a { transition-timing-function: var(--tw-ease, var(--default-transition-timing-function)); }'
    )
    const names = refs.map((r) => r.name).sort()
    expect(names).toEqual(['--default-transition-timing-function', '--tw-ease'])
    const outer = refs.find((r) => r.name === '--tw-ease')
    expect(outer?.hasFallback).toBe(true)
  })

  it('does NOT match a dynamic construction site as a literal reference', () => {
    const refs = findVarReferences('const s = `var(--mantine-color-${color}-5)`')
    expect(refs.find((r) => r.name.startsWith('--mantine-color'))).toBeUndefined()
  })

  it('reports the correct 1-based line number', () => {
    const refs = findVarReferences('a\nb\nc { color: var(--x); }')
    expect(refs[0].line).toBe(3)
  })
})

describe('findDynamicVarSites — prefix rule (R6, §3.4)', () => {
  it('extracts the literal prefix between var(-- and the first ${', () => {
    const sites = findDynamicVarSites('const s = `var(--mantine-color-${color}-5)`')
    expect(sites).toHaveLength(1)
    expect(sites[0].prefix).toBe('mantine-color-')
  })

  it('extracts a --space- prefix (the P4 plant shape)', () => {
    const sites = findDynamicVarSites('const s = `var(--space-${n})`')
    expect(sites).toHaveLength(1)
    expect(sites[0].prefix).toBe('space-')
  })

  it('does not misfire on a plain static var() reference', () => {
    const sites = findDynamicVarSites('const s = `var(--space-4)`')
    expect(sites).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Task 743 — ownership snapshot (R1-R4/R7). The parser/serializer/drift/
// dropped-name functions below are pure and filesystem-free (parseSnapshotContent,
// computeDrift, findDroppedNameRefs) except where a test is specifically about
// the file-reading seam (loadSnapshot) or the writer (performUpdateSnapshot),
// which get a real mkdtempSync fixture tree, torn down after each test.
// ═══════════════════════════════════════════════════════════════════════════
describe('parseSnapshotContent (R1) — valid / malformed', () => {
  it('parses a valid { version: 1, names: [...] } document', () => {
    const result = parseSnapshotContent('{"version":1,"names":["--a","--b"]}')
    expect(result.ok).toBe(true)
    expect(result.names!.has('--a')).toBe(true)
    expect(result.names!.has('--b')).toBe(true)
    expect(result.names!.size).toBe(2)
  })

  it('rejects invalid JSON as malformed', () => {
    const result = parseSnapshotContent('{not json')
    expect(result.ok).toBe(false)
    expect(result.kind).toBe('malformed')
  })

  it('rejects a document with the wrong version', () => {
    const result = parseSnapshotContent('{"version":2,"names":["--a"]}')
    expect(result.ok).toBe(false)
    expect(result.kind).toBe('malformed')
  })

  it('rejects a document whose "names" is not an array', () => {
    const result = parseSnapshotContent('{"version":1,"names":"--a"}')
    expect(result.ok).toBe(false)
    expect(result.kind).toBe('malformed')
  })

  it('rejects a document containing a non-custom-property name entry', () => {
    const result = parseSnapshotContent('{"version":1,"names":["--a","not-a-var"]}')
    expect(result.ok).toBe(false)
    expect(result.kind).toBe('malformed')
  })

  it('rejects a bare JSON array (not an object)', () => {
    const result = parseSnapshotContent('["--a"]')
    expect(result.ok).toBe(false)
    expect(result.kind).toBe('malformed')
  })
})

describe('loadSnapshot (R1) — missing file', () => {
  it('reports kind "missing" for a path that does not exist, never throws', () => {
    const dir = mkdtempSync(join(tmpdir(), 'css-var-snapshot-test-'))
    try {
      const result = loadSnapshot(join(dir, 'does-not-exist.json'))
      expect(result.ok).toBe(false)
      expect(result.kind).toBe('missing')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('loads a real, present, valid snapshot file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'css-var-snapshot-test-'))
    try {
      const path = join(dir, 'snapshot.json')
      writeFileSync(path, '{"version":1,"names":["--x"]}', 'utf8')
      const result = loadSnapshot(path)
      expect(result.ok).toBe(true)
      expect(result.names!.has('--x')).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reports kind "malformed" for a present-but-corrupt file (distinct from "missing")', () => {
    const dir = mkdtempSync(join(tmpdir(), 'css-var-snapshot-test-'))
    try {
      const path = join(dir, 'snapshot.json')
      writeFileSync(path, 'not json at all', 'utf8')
      const result = loadSnapshot(path)
      expect(result.ok).toBe(false)
      expect(result.kind).toBe('malformed')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('serializeSnapshot (R1/§10.4) — canonical on-disk form', () => {
  it('sorts names with localeCompare, 2-space indent, trailing newline, version 1', () => {
    const text = serializeSnapshot(new Set(['--zeta', '--alpha', '--beta']))
    expect(text).toBe('{\n  "version": 1,\n  "names": [\n    "--alpha",\n    "--beta",\n    "--zeta"\n  ]\n}\n')
    expect(text.endsWith('\n')).toBe(true)
    expect(text.includes('\r')).toBe(false)
  })

  it('round-trips through parseSnapshotContent', () => {
    const names = new Set(['--one', '--two', '--three'])
    const parsed = parseSnapshotContent(serializeSnapshot(names))
    expect(parsed.ok).toBe(true)
    expect([...parsed.names!].sort()).toEqual([...names].sort())
  })
})

describe('computeDrift (R3) — owned set vs. snapshot, as pure sets', () => {
  it('reports no drift when the sets are identical', () => {
    const drift = computeDrift(new Set(['--a', '--b']), new Set(['--a', '--b']))
    expect(drift.added).toEqual([])
    expect(drift.dropped).toEqual([])
  })

  it('reports an added name present in owned but not the snapshot', () => {
    const drift = computeDrift(new Set(['--a', '--b']), new Set(['--a']))
    expect(drift.added).toEqual(['--b'])
    expect(drift.dropped).toEqual([])
  })

  it('reports a dropped name present in the snapshot but not owned', () => {
    const drift = computeDrift(new Set(['--a']), new Set(['--a', '--b']))
    expect(drift.added).toEqual([])
    expect(drift.dropped).toEqual(['--b'])
  })

  it('sorts added/dropped with localeCompare and handles both directions at once', () => {
    const drift = computeDrift(new Set(['--z', '--new']), new Set(['--z', '--old']))
    expect(drift.added).toEqual(['--new'])
    expect(drift.dropped).toEqual(['--old'])
  })
})

describe('findDroppedNameRefs (R2) — fallback-less vs. fallback-bearing split', () => {
  it('classifies a fallback-less reference to a dropped name as a violation', () => {
    const allRefs = [{ name: '--gone', line: 5, hasFallback: false, file: 'a.css' }]
    const result = findDroppedNameRefs(allRefs, new Set(['--gone']), 'B')
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toMatchObject({ arm: 'B', file: 'a.css', line: 5, name: '--gone' })
    expect(result.fallbackReports).toHaveLength(0)
  })

  it('classifies a fallback-bearing reference to a dropped name as non-blocking', () => {
    const allRefs = [{ name: '--gone', line: 5, hasFallback: true, file: 'a.css' }]
    const result = findDroppedNameRefs(allRefs, new Set(['--gone']), 'B')
    expect(result.violations).toHaveLength(0)
    expect(result.fallbackReports).toHaveLength(1)
  })

  it('ignores a reference whose name is not in the dropped set', () => {
    const allRefs = [{ name: '--still-owned', line: 5, hasFallback: false, file: 'a.css' }]
    const result = findDroppedNameRefs(allRefs, new Set(['--gone']), 'B')
    expect(result.violations).toHaveLength(0)
    expect(result.fallbackReports).toHaveLength(0)
  })
})

describe('performUpdateSnapshot (R4) — writer refusal and success, against a real fixture tree', () => {
  function makeFixtureTree() {
    const base = mkdtempSync(join(tmpdir(), 'css-var-writer-test-'))
    const cssDir = join(base, 'css')
    const srcDir = join(base, 'src')
    mkdirSync(cssDir, { recursive: true })
    mkdirSync(srcDir, { recursive: true })
    writeFileSync(join(base, 'globals.css'), ':root {\n  --kept: 1px;\n}\n', 'utf8')
    writeFileSync(join(cssDir, 'shipped.css'), ':root{--kept:1px}', 'utf8')
    // checkFreshness compares the shipped-CSS mtime against globals.css/src's
    // newest mtime — bump the shipped file forward so a fast test run never
    // ties (or loses to) a later fixture write in the same call (mirrors the
    // script's own touchCssDir rationale).
    const future = new Date(Date.now() + 60_000)
    utimesSync(join(cssDir, 'shipped.css'), future, future)
    return { base, cssDir, srcDir, globalsPath: join(base, 'globals.css') }
  }

  it('bootstraps from a missing snapshot file (first-run flow, §13)', () => {
    const tree = makeFixtureTree()
    try {
      const snapshotPath = join(tree.base, 'snapshot.json')
      const result = performUpdateSnapshot({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath })
      expect(result.refused).toBe(false)
      expect(result.written).toBe(true)
      const written = loadSnapshot(snapshotPath)
      expect(written.ok).toBe(true)
      expect(written.names!.has('--kept')).toBe(true)
    } finally {
      rmSync(tree.base, { recursive: true, force: true })
    }
  })

  it('refuses when a dropped name still has a fallback-less reference, and leaves the file byte-unchanged', () => {
    const tree = makeFixtureTree()
    try {
      const snapshotPath = join(tree.base, 'snapshot.json')
      // Prior snapshot owned BOTH --kept and --dropped-but-referenced; globals.css
      // (above) only declares --kept now, and a live source file still reads the
      // other one without a fallback.
      writeSnapshotFile(snapshotPath, new Set(['--kept', '--dropped-but-referenced']))
      const before = readFileSync(snapshotPath, 'utf8')
      writeFileSync(join(tree.srcDir, 'consumer.tsx'), "const s = { color: 'var(--dropped-but-referenced)' }\n", 'utf8')
      const result = performUpdateSnapshot({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath })
      expect(result.refused).toBe(true)
      expect(result.droppedViolations!.some((v) => v.name === '--dropped-but-referenced')).toBe(true)
      const after = readFileSync(snapshotPath, 'utf8')
      expect(after).toBe(before)
    } finally {
      rmSync(tree.base, { recursive: true, force: true })
    }
  })

  it('succeeds when a dropped name has zero references anywhere', () => {
    const tree = makeFixtureTree()
    try {
      const snapshotPath = join(tree.base, 'snapshot.json')
      writeSnapshotFile(snapshotPath, new Set(['--kept', '--dropped-unreferenced']))
      const result = performUpdateSnapshot({ cssDir: tree.cssDir, globalsPath: tree.globalsPath, srcDir: tree.srcDir, snapshotPath })
      expect(result.refused).toBe(false)
      expect(result.written).toBe(true)
      const written = loadSnapshot(snapshotPath)
      expect(written.names!.has('--dropped-unreferenced')).toBe(false)
      expect(written.names!.has('--kept')).toBe(true)
    } finally {
      rmSync(tree.base, { recursive: true, force: true })
    }
  })
})
