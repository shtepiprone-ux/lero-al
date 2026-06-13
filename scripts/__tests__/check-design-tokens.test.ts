// @vitest-environment node
/**
 * Detector test suite for scripts/check-design-tokens.mjs (Task 408, §E).
 *
 * For every blind spot closed in Task 408 (JSX-comment false positive, inline
 * zIndex detection + suppressibility, negative-offset shadow / function-wrapped /
 * var() arbitrary-value audit), this suite plants a violating case (must be
 * caught) and a valid/commented/var case (must NOT be caught), plus the marker
 * semantics (missing-reason / stale-marker) that gate strict mode.
 *
 * Run: npx vitest run scripts/__tests__/check-design-tokens.test.ts
 */

import { describe, it, expect } from 'vitest'
import { scanContent, stripJsxComments, parseInlineMarkers } from '../check-design-tokens.mjs'

// A fixture path that does not match any scripts/design-tokens-allowlist.json
// path-prefix entry, so allowlist short-circuiting never hides a planted finding.
const FIXTURE_PATH = 'src/components/ui/__fixture-task408__.tsx'

function findingsOf(content: string) {
  return scanContent(content, FIXTURE_PATH, {})
}

function regular(content: string) {
  return findingsOf(content).filter(f => f.cat !== 'missing-reason' && f.cat !== 'stale-marker')
}

describe('§A — JSX comment {/* ... */} stripping (blind spot 1)', () => {
  it('flags a live arbitrary className', () => {
    const findings = regular(`<div className="text-[10px]">Hi</div>`)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'length', match: 'text-[10px]' })
  })

  it('does NOT flag a single-line JSX-commented-out className', () => {
    const findings = regular(`{/* className="text-[10px]" */}`)
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag a multi-line JSX-commented-out className', () => {
    const content = [
      'const x = 1',
      '{/*',
      '  className="text-[10px]"',
      '*/}',
      'const y = 2',
    ].join('\n')
    expect(regular(content)).toHaveLength(0)
  })

  it('still flags a real value on a line with a trailing {/* ... */} comment', () => {
    const findings = regular(
      `<div className="text-[10px]"> {/* old: className="text-[20px]" */}`
    )
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'length', match: 'text-[10px]' })
  })

  it('existing // comment-only line skipping is unchanged', () => {
    expect(regular(`// className="text-[10px]" — old approach, removed`)).toHaveLength(0)
  })

  it('existing /* */ and leading-* comment-line skipping is unchanged', () => {
    expect(regular(`/* className="text-[10px]" */`)).toHaveLength(0)
    expect(regular(` * className="text-[10px]"`)).toHaveLength(0)
  })

  it('stripJsxComments preserves line count and non-comment content', () => {
    const content = [
      'const x = 1',
      '{/*',
      '  className="text-[10px]"',
      '*/}',
      'const y = 2',
    ].join('\n')
    const stripped = stripJsxComments(content)
    expect(stripped.split('\n')).toHaveLength(5)
    expect(stripped).not.toContain('text-[10px]')
    expect(stripped).toContain('const x = 1')
    expect(stripped).toContain('const y = 2')
  })

  it('a design-tokens-allow marker placed INSIDE a {/* ... */} JSX comment still suppresses (AdminTable convention)', () => {
    const findings = regular(
      `<thead className="sticky top-0 z-[2] bg-card"> {/* design-tokens-allow: z-[2] — local sticky-cell stacking */}`
    )
    expect(findings).toHaveLength(0)
  })
})

describe('§B — inline zIndex detection + suppressibility (blind spot 2)', () => {
  it('flags a raw numeric zIndex with no marker', () => {
    const findings = regular(`const style = { zIndex: 9999 }`)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'z-index', match: 'zIndex: 9999' })
  })

  it('flags a raw numeric "z-index" string-key form', () => {
    const findings = regular(`const style = { 'z-index': 50 }`)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'z-index' })
  })

  it('suppresses a raw numeric zIndex with a matching marker + reason', () => {
    const findings = regular(
      `const style = { zIndex: 9999 } // design-tokens-allow: zIndex: 9999 — needed above modal overlay`
    )
    expect(findings).toHaveLength(0)
  })

  it('a marker missing its reason is a missing-reason error AND does not suppress', () => {
    const all = findingsOf(`const style = { zIndex: 9999 } // design-tokens-allow: zIndex: 9999`)
    expect(all.some(f => f.cat === 'missing-reason')).toBe(true)
    expect(all.some(f => f.cat === 'z-index')).toBe(true)
  })

  it('a stale marker (value not present on the line) is reported AND the real value remains flagged', () => {
    const all = findingsOf(
      `const style = { zIndex: 9999 } // design-tokens-allow: zIndex: 8888 — wrong value`
    )
    expect(all.some(f => f.cat === 'stale-marker')).toBe(true)
    expect(all.some(f => f.cat === 'z-index' && f.match === 'zIndex: 9999')).toBe(true)
  })

  it('does NOT flag zIndex bound to a var(--token)', () => {
    expect(regular(`const style = { zIndex: 'var(--z-toast)' }`)).toHaveLength(0)
  })

  it('does NOT flag zIndex bound to an identifier', () => {
    expect(regular(`const style = { zIndex: Z_TOKEN }`)).toHaveLength(0)
  })
})

describe('§C — negative-offset shadow / function-wrapped / var() audit (blind spot 3)', () => {
  it('flags a negative-Y-offset arbitrary shadow (resolves the evasion ambiguity: CAUGHT)', () => {
    const findings = regular(`className="shadow-[0_-2px_12px_rgba(0,0,0,0.1)]"`)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'shadow', match: 'shadow-[0_-2px_12px_rgba(0,0,0,0.1)]' })
  })

  it('does NOT flag the approved *-[var(--token)] consumption form (h-[var(--listing-gallery-h-mobile)])', () => {
    expect(regular(`className="h-[var(--listing-gallery-h-mobile)] sm:h-[var(--listing-gallery-h-tablet)]"`)).toHaveLength(0)
  })

  it('does NOT flag a generic *-[var(--token)] arbitrary value', () => {
    expect(regular(`className="w-[var(--some-token)]"`)).toHaveLength(0)
  })
})

describe('§C row 2 — function-wrapped (calc/min/max/clamp) raw px/rem (Task 408 rework)', () => {
  it('flags a pure-literal calc() with raw px/rem (no var)', () => {
    const findings = regular(`className="w-[calc(100px+2rem)]"`)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'length', match: 'w-[calc(100px+2rem)]' })
  })

  it('flags viewport-relative literal calc() forms — no broad viewport exemption', () => {
    const minH = regular(`className="min-h-[calc(100vh-4rem)]"`)
    expect(minH).toHaveLength(1)
    expect(minH[0]).toMatchObject({ cat: 'length', match: 'min-h-[calc(100vh-4rem)]' })

    const maxW = regular(`className="max-w-[calc(100vw-2rem)]"`)
    expect(maxW).toHaveLength(1)
    expect(maxW[0]).toMatchObject({ cat: 'length', match: 'max-w-[calc(100vw-2rem)]' })
  })

  it('does NOT flag var()-anchored function forms even when they contain a px literal', () => {
    expect(regular(`className="rounded-[min(var(--radius-md),10px)]"`)).toHaveLength(0)
    expect(regular(`className="rounded-[calc(var(--radius)-5px)]"`)).toHaveLength(0)
  })

  it('an in-tree pure-literal form with a marker is suppressed; missing-reason and stale-marker still gate', () => {
    const suppressed = regular(
      `className="h-[calc(100%-1px)]" // design-tokens-allow: h-[calc(100%-1px)] — tab trigger fills list height minus border, no scale token`
    )
    expect(suppressed).toHaveLength(0)

    const missingReason = findingsOf(
      `className="h-[calc(100%-1px)]" // design-tokens-allow: h-[calc(100%-1px)]`
    )
    expect(missingReason.some(f => f.cat === 'missing-reason')).toBe(true)
    expect(missingReason.some(f => f.cat === 'length' && f.match === 'h-[calc(100%-1px)]')).toBe(true)

    const stale = findingsOf(
      `className="h-[calc(100%-1px)]" // design-tokens-allow: h-[calc(100%-2px)] — wrong value`
    )
    expect(stale.some(f => f.cat === 'stale-marker')).toBe(true)
    expect(stale.some(f => f.cat === 'length' && f.match === 'h-[calc(100%-1px)]')).toBe(true)
  })
})

describe('parseInlineMarkers — value extraction (Task 408 widening for spaced values)', () => {
  it('extracts a single-token value (existing className/shadow form)', () => {
    expect(parseInlineMarkers('// design-tokens-allow: rounded-[4px] — 4px corner, no scale token'))
      .toEqual([{ rawValue: 'rounded-[4px]', hasReason: true }])
  })

  it('extracts a spaced value (zIndex: 9999 form)', () => {
    expect(parseInlineMarkers('// design-tokens-allow: zIndex: 9999 — needed above modal overlay'))
      .toEqual([{ rawValue: 'zIndex: 9999', hasReason: true }])
  })

  it('flags missing reason (nothing after —)', () => {
    expect(parseInlineMarkers('// design-tokens-allow: zIndex: 9999'))
      .toEqual([{ rawValue: 'zIndex: 9999', hasReason: false }])
  })
})
