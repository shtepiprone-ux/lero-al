// @vitest-environment node
/**
 * Overlay dual-declaration sync gate (Task 692, R1–R5; escalated by the Task 693 review, F1).
 *
 * `--overlay`/`--overlay-foreground` are deliberately declared twice in `src/app/globals.css` —
 * once inside `@theme inline` (so Tailwind can statically resolve the value and composite the
 * alpha-blended static fallback tier for every `bg-overlay/*`/`text-overlay-foreground/*` opacity
 * utility) and once inside `:root` (so the variables are emitted unconditionally for non-Tailwind
 * consumers such as `LightboxView.tsx`'s inline style and `MantineListingGalleryPattern.tsx`'s
 * `c=` prop, independent of whether any Tailwind utility survives the source scan). Task 690
 * deleted the `@theme` copy and silently degraded the fallback tier; Task 693 restored the pair
 * but the invariant was protected by a code comment only. This gate makes it machine-enforced: it
 * fails the instant the two copies diverge in value, either copy is removed, or `--color-overlay*`
 * — which must stay `@theme`-only (Task 693 R2) — leaks into `:root`.
 *
 * NOTE for Task 695: once the last `bg-overlay*`/`text-overlay-foreground*` Tailwind utility is
 * migrated away, the `@theme` copy of `--overlay`/`--overlay-foreground` becomes legitimately
 * deletable. When that happens, UPDATE this gate to match the new single-declaration invariant —
 * do not delete it outright, or a resurrected `@theme` copy (or a `:root` copy left behind) would
 * again go unguarded.
 *
 * Run: npx vitest run scripts/__tests__/overlay-dual-declaration.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const GLOBALS_CSS_PATH = join(ROOT, 'src', 'app', 'globals.css')

function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS_PATH, 'utf8')
}

/**
 * Locates `openingLine {` and returns the text between it and its matching closing `}`, found by
 * brace-depth counting rather than a hard-coded line range (Task 692 A2) — the extraction must
 * keep working after an unrelated edit shifts every line number in the file.
 */
function extractBlock(content: string, openingLine: string, blockLabel: string): string {
  const openIndex = content.indexOf(`${openingLine} {`)
  if (openIndex === -1) {
    throw new Error(`${GLOBALS_CSS_PATH}: could not find opening line "${openingLine} {" for ${blockLabel}`)
  }
  const bodyStart = openIndex + openingLine.length + 2
  let depth = 1
  let i = bodyStart
  while (depth > 0) {
    if (i >= content.length) {
      throw new Error(`${GLOBALS_CSS_PATH}: ${blockLabel} starting at "${openingLine} {" never closes`)
    }
    if (content[i] === '{') depth++
    else if (content[i] === '}') depth--
    i++
  }
  return content.slice(bodyStart, i - 1)
}

/**
 * Returns the trimmed value of `varName: value;` inside `block`, requiring exactly one
 * declaration. Comparison is on the value only, not the trailing comment or column alignment
 * (Task 692 A1) — a reworded comment is not a regression, a changed value is.
 */
function extractSingleDeclarationValue(block: string, varName: string, blockLabel: string): string {
  const re = new RegExp(`^\\s*${varName}:\\s*([^;]+);`, 'gm')
  const matches = [...block.matchAll(re)]
  if (matches.length !== 1) {
    throw new Error(
      `${GLOBALS_CSS_PATH}: expected exactly one "${varName}" declaration inside ${blockLabel}, found ` +
        `${matches.length}.`
    )
  }
  return matches[0]![1]!.trim()
}

function countDeclarations(block: string, varName: string): number {
  const re = new RegExp(`^\\s*${varName}:`, 'gm')
  return [...block.matchAll(re)].length
}

describe('overlay dual-declaration sync gate (Task 692, R1–R3)', () => {
  it('--overlay and --overlay-foreground are declared exactly once per block and byte-identical in value between @theme inline and :root', () => {
    const content = readGlobalsCss()
    const themeBlock = extractBlock(content, '@theme inline', '@theme inline')
    const rootBlock = extractBlock(content, ':root', ':root')

    const themeOverlay = extractSingleDeclarationValue(themeBlock, '--overlay', '@theme inline')
    const rootOverlay = extractSingleDeclarationValue(rootBlock, '--overlay', ':root')
    expect(
      themeOverlay,
      `${GLOBALS_CSS_PATH}: --overlay diverged between the two declarations — ` +
        `@theme inline='${themeOverlay}' vs :root='${rootOverlay}'. These must stay value-identical ` +
        `(Task 693/D19); see the comments above each block for why the pair is duplicated.`
    ).toBe(rootOverlay)

    const themeOverlayFg = extractSingleDeclarationValue(themeBlock, '--overlay-foreground', '@theme inline')
    const rootOverlayFg = extractSingleDeclarationValue(rootBlock, '--overlay-foreground', ':root')
    expect(
      themeOverlayFg,
      `${GLOBALS_CSS_PATH}: --overlay-foreground diverged between the two declarations — ` +
        `@theme inline='${themeOverlayFg}' vs :root='${rootOverlayFg}'. These must stay value-identical ` +
        `(Task 693/D19); see the comments above each block for why the pair is duplicated.`
    ).toBe(rootOverlayFg)
  })

  it('--color-overlay and --color-overlay-foreground stay @theme-only and are never duplicated into :root', () => {
    const content = readGlobalsCss()
    const rootBlock = extractBlock(content, ':root', ':root')

    const colorOverlayInRoot = countDeclarations(rootBlock, '--color-overlay')
    expect(
      colorOverlayInRoot,
      `${GLOBALS_CSS_PATH}: --color-overlay must stay @theme-only (Task 693 R2) but was found ` +
        `${colorOverlayInRoot} time(s) inside :root.`
    ).toBe(0)

    const colorOverlayFgInRoot = countDeclarations(rootBlock, '--color-overlay-foreground')
    expect(
      colorOverlayFgInRoot,
      `${GLOBALS_CSS_PATH}: --color-overlay-foreground must stay @theme-only (Task 693 R2) but was found ` +
        `${colorOverlayFgInRoot} time(s) inside :root.`
    ).toBe(0)
  })
})
