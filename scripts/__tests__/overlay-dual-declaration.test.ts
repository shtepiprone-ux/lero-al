// @vitest-environment node
/**
 * Overlay single-source gate (Task 692, R1-R5; escalated by Task 693's review, F1; rewritten by
 * Task 695).
 *
 * Through Task 693, `--overlay`/`--overlay-foreground` were deliberately declared TWICE in
 * `src/app/globals.css` — once inside `@theme inline` (so Tailwind could statically resolve the
 * value and composite the alpha-blended static fallback tier for every `bg-overlay/*`/
 * `text-overlay-foreground/*` opacity utility) and once inside `:root` (so the variables were
 * emitted unconditionally for non-Tailwind consumers such as `LightboxView.tsx`'s inline style and
 * `MantineListingGalleryPattern.tsx`'s `c=` prop). This file's original form (Task 692) gated that
 * dual-declaration invariant: it failed the instant the two copies diverged in value, either copy
 * was removed, or `--color-overlay*` leaked into `:root`.
 *
 * Task 695 migrated the last seven non-Tailwind `var(--color-overlay*)` consumers to
 * `var(--overlay*)` directly, rewrote the one remaining Tailwind-scannable comment down to zero
 * generated overlay utilities, and then deleted the `@theme inline` copy entirely — there is no
 * longer a Tailwind opacity-modifier utility consuming it, so there is nothing left for that copy
 * to statically resolve. The invariant this file guards is now SINGLE-source, not dual-source. Per
 * this file's own prior NOTE (left by Task 692 for exactly this moment): rewritten, not deleted —
 * a resurrected `@theme` copy, an orphaned `:root` removal, or a revived `bg-overlay*` utility
 * would all be silent regressions with nothing else in the repo watching for them.
 *
 * Three invariants, each proven capable of failing on a planted violation (Task 695 kickoff AC5 —
 * the exact defect Task 748 spent three review rounds on is a check that could not have come out
 * wrong):
 *   1. `--overlay` and `--overlay-foreground` are each declared EXACTLY ONCE in the whole file,
 *      and that one declaration lives inside `:root` (not `@theme`, not `@theme inline`, not
 *      re-introduced anywhere else).
 *   2. `--color-overlay` and `--color-overlay-foreground` are declared NOWHERE in the file.
 *   3. Zero `bg-overlay*` / `text-overlay-foreground*` / `border-overlay*` rules are generated in
 *      the built bundle (`.next/static/css/*.css`) — the same census the kickoff's own §11 uses
 *      for AC3, reused here as a machine-enforced gate rather than a one-off manual command.
 *
 * The planted-violation assertions run against literal in-memory fixture strings, never the real
 * file — this file's job is to prove the CHECKING LOGIC reddens on the class of regression each
 * invariant exists to catch, independent of whatever the real tree currently looks like.
 *
 * Run: npx vitest run scripts/__tests__/overlay-dual-declaration.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const GLOBALS_CSS_PATH = join(ROOT, 'src', 'app', 'globals.css')
const CSS_DIR = join(ROOT, '.next', 'static', 'css')

function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS_PATH, 'utf8')
}

/**
 * Locates `openingLine {` and returns the text between it and its matching closing `}`, found by
 * brace-depth counting rather than a hard-coded line range (Task 692 A2) — the extraction must
 * keep working after an unrelated edit shifts every line number in the file. Returns null if the
 * opening line does not occur (used by invariant 1 to confirm `@theme inline` no longer exists).
 */
function extractBlock(content: string, openingLine: string): string | null {
  const openIndex = content.indexOf(`${openingLine} {`)
  if (openIndex === -1) return null
  const bodyStart = openIndex + openingLine.length + 2
  let depth = 1
  let i = bodyStart
  while (depth > 0) {
    if (i >= content.length) throw new Error(`${openingLine} {" never closes`)
    if (content[i] === '{') depth++
    else if (content[i] === '}') depth--
    i++
  }
  return content.slice(bodyStart, i - 1)
}

/** Every top-level declaration of `varName:` anywhere in the (whole, not block-scoped) content. */
function countDeclarationsAnywhere(content: string, varName: string): number {
  const escaped = varName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const re = new RegExp(`(?:^|[{;])\\s*${escaped}\\s*:`, 'gm')
  return [...content.matchAll(re)].length
}

/** Every `.{bg,text,border}-overlay*{...}` rule in a CSS text blob (Task 695 kickoff §11/§13). */
function countGeneratedOverlayUtilityRules(cssText: string): number {
  const m = cssText.match(/\.(?:bg|text|border)-overlay[^{]*\{[^}]*\}/g)
  return m ? m.length : 0
}

describe('overlay single-source gate (Task 692 origin, Task 695 rewrite)', () => {
  it('invariant 1 — --overlay and --overlay-foreground are each declared exactly once, inside :root only', () => {
    const content = readGlobalsCss()
    const rootBlock = extractBlock(content, ':root')
    if (rootBlock === null) throw new Error(`${GLOBALS_CSS_PATH}: no top-level :root block found`)

    for (const name of ['--overlay', '--overlay-foreground']) {
      const totalCount = countDeclarationsAnywhere(content, name)
      expect(
        totalCount,
        `${GLOBALS_CSS_PATH}: expected exactly 1 declaration of "${name}" in the whole file, found ${totalCount}. ` +
          `The single source of truth is :root (Task 695 closed D19) — a second declaration anywhere ` +
          `(a resurrected @theme copy, a duplicate :root block) is a regression.`
      ).toBe(1)

      const inRootCount = countDeclarationsAnywhere(rootBlock, name)
      expect(
        inRootCount,
        `${GLOBALS_CSS_PATH}: "${name}"'s one declaration must live inside :root, but :root contains ${inRootCount} of them.`
      ).toBe(1)
    }
  })

  it('invariant 1 (planted) — a resurrected second declaration is detected', () => {
    const plantedContent = `
:root {
  --overlay: oklch(0 0 0);
  --overlay-foreground: oklch(1 0 0);
}
/* a resurrected @theme copy — must be caught */
@theme inline {
  --overlay: oklch(0 0 0);
}
`
    const totalCount = countDeclarationsAnywhere(plantedContent, '--overlay')
    expect(totalCount, 'planted double declaration must NOT be silently accepted as 1').toBe(2)
    expect(totalCount).not.toBe(1)
  })

  it('invariant 2 — --color-overlay and --color-overlay-foreground are declared nowhere', () => {
    const content = readGlobalsCss()
    for (const name of ['--color-overlay', '--color-overlay-foreground']) {
      const count = countDeclarationsAnywhere(content, name)
      expect(
        count,
        `${GLOBALS_CSS_PATH}: "${name}" must not be declared anywhere (Task 695 removed the last ` +
          `Tailwind consumer that justified it) but was found ${count} time(s).`
      ).toBe(0)
    }
  })

  it('invariant 2 (planted) — a re-introduced --color-overlay declaration is detected', () => {
    const plantedContent = `
:root {
  --overlay: oklch(0 0 0);
  --overlay-foreground: oklch(1 0 0);
  --color-overlay-foreground: var(--overlay-foreground);
}
`
    const count = countDeclarationsAnywhere(plantedContent, '--color-overlay-foreground')
    expect(count, 'planted re-introduction of --color-overlay-foreground must NOT read as 0').toBe(1)
    expect(count).not.toBe(0)
  })

  it('invariant 3 — zero bg|text|border-overlay* rules are generated in the built bundle', () => {
    if (!existsSync(CSS_DIR)) {
      throw new Error(`${CSS_DIR} not found — run "npm run build" first (this gate reads the shipped bundle, not source).`)
    }
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'))
    expect(cssFiles.length, `no .css files found under ${CSS_DIR} — stale or missing build`).toBeGreaterThan(0)

    let total = 0
    const offenders: string[] = []
    for (const f of cssFiles) {
      const text = readFileSync(join(CSS_DIR, f), 'utf8')
      const n = countGeneratedOverlayUtilityRules(text)
      if (n > 0) {
        total += n
        offenders.push(`${f}: ${n}`)
      }
    }
    expect(
      total,
      `expected 0 generated bg|text|border-overlay* rules in the built bundle, found ${total} ` +
        `(${offenders.join(', ') || 'n/a'}). A Tailwind-scannable comment or literal className ` +
        `re-introduced an overlay utility candidate — see docs/sessions/2026-07-30-task690-overlay-root-relocation.md ` +
        `and Task 695's session log for why this must stay 0.`
    ).toBe(0)
  })

  it('invariant 3 (planted) — a generated overlay utility rule is detected', () => {
    const plantedCss = `.foo{color:red}.bg-overlay\\/95{background-color:color-mix(in oklab,var(--overlay) 95%,transparent)}`
    const count = countGeneratedOverlayUtilityRules(plantedCss)
    expect(count, 'planted generated overlay utility rule must NOT read as 0').toBe(1)
    expect(count).not.toBe(0)
  })
})
