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

// A .css fixture path that does not match any scripts/design-tokens-allowlist.json
// path-prefix entry, so allowlist short-circuiting never hides a planted finding.
const CSS_FIXTURE_PATH = 'src/components/ui/__fixture-task714__.css'

function findingsOfCss(content: string) {
  return scanContent(content, CSS_FIXTURE_PATH, {})
}

function regularCss(content: string) {
  return findingsOfCss(content).filter(f => f.cat !== 'missing-reason' && f.cat !== 'stale-marker')
}

describe('§D — plain CSS declaration coverage: length/duration/z-index (Task 714)', () => {
  it('flags a raw px length in a plain CSS declaration', () => {
    const findings = regularCss('.fabLabel {\n  font-size: 10px;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'font-size: 10px' })
  })

  it('flags a raw rem length in a plain CSS declaration', () => {
    const findings = regularCss('.bar {\n  gap: 1.5rem;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'gap: 1.5rem' })
  })

  it('flags a scientific-notation px length', () => {
    const findings = regularCss('.fab {\n  border-radius: 3.40282e38px;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'border-radius: 3.40282e38px' })
  })

  it('flags a raw duration (leading-dot seconds) in a plain CSS declaration', () => {
    const findings = regularCss('.fab {\n  transition-duration: .15s;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-duration', match: 'transition-duration: .15s' })
  })

  it('flags a raw duration in milliseconds', () => {
    const findings = regularCss('.card {\n  transition-duration: 300ms;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-duration', match: 'transition-duration: 300ms' })
  })

  it('flags a raw unitless z-index in a plain CSS declaration', () => {
    const findings = regularCss('.navBar {\n  z-index: 30;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-zindex', match: 'z-index: 30' })
  })

  it('does NOT flag a var(--token) length declaration', () => {
    expect(regularCss('.x { gap: var(--space-6); }')).toHaveLength(0)
  })

  it('does NOT flag a calc(var(...)) length declaration', () => {
    expect(regularCss('.x { width: calc(var(--x) * 2); }')).toHaveLength(0)
  })

  it('does NOT flag zero values (0, 0px, 0rem)', () => {
    expect(regularCss('.x { margin: 0; }')).toHaveLength(0)
    expect(regularCss('.x { padding: 0px; }')).toHaveLength(0)
    expect(regularCss('.x { top: 0rem; }')).toHaveLength(0)
  })

  it('does NOT flag 100% (not a px/rem/em length)', () => {
    expect(regularCss('.x { width: 100%; }')).toHaveLength(0)
  })

  it('does NOT flag the approved 1px hairline-border value (A3 decision)', () => {
    expect(regularCss('.x { border-top-width: 1px; }')).toHaveLength(0)
    expect(regularCss('.x { border-bottom: 1px solid var(--border); }')).toHaveLength(0)
  })

  it('does NOT flag a literal inside a CSS comment', () => {
    expect(regularCss('.x {\n  /* font-size: 10px; */\n  color: var(--foreground);\n}')).toHaveLength(0)
  })

  it('does NOT flag a length inside an @media prelude (A5)', () => {
    const findings = regularCss('@media (min-width: 40rem) {\n  .foo { color: var(--foreground); }\n}')
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag a length inside an @supports prelude (A5)', () => {
    const findings = regularCss('@supports (min-width: 40rem) {\n  .foo { color: var(--foreground); }\n}')
    expect(findings).toHaveLength(0)
  })

  it('does NOT run css-length/duration/zindex patterns on a .tsx file (R9 — zero TSX behavior change)', () => {
    const findings = scanContent('.fabLabel {\n  font-size: 10px;\n}', 'src/components/ui/__fixture-task714b__.tsx', {})
    expect(findings.filter(f => f.cat === 'css-length')).toHaveLength(0)
  })

  it('a same-line design-tokens-allow marker suppresses a css-length detection (R5 arm 1)', () => {
    const suppressed = regularCss(
      '.fabLabel {\n  font-size: 10px; /* design-tokens-allow: font-size: 10px — interactive/mobile-critical nav text (MobileBottomNav protection) */\n}'
    )
    expect(suppressed).toHaveLength(0)
  })

  it('an orphaned design-tokens-allow marker on a css-length value is a stale-marker (R5 arm 2)', () => {
    const all = findingsOfCss(
      '.fabLabel {\n  color: var(--foreground); /* design-tokens-allow: font-size: 10px — declaration removed */\n}'
    )
    expect(all.some(f => f.cat === 'stale-marker' && f.match === 'font-size: 10px')).toBe(true)
  })

  it('a css-length marker with no — separator does not silently suppress (pre-existing parseInlineMarkers behavior for block comments, unchanged by this task: the trailing */ is captured into rawValue, so it never matches the detected value and surfaces as stale-marker rather than missing-reason)', () => {
    const all = findingsOfCss(
      '.fabLabel {\n  font-size: 10px; /* design-tokens-allow: font-size: 10px */\n}'
    )
    expect(all.some(f => f.cat === 'stale-marker')).toBe(true)
    expect(all.some(f => f.cat === 'css-length' && f.match === 'font-size: 10px')).toBe(true)
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
