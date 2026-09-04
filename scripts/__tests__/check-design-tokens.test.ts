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
import { readFileSync } from 'node:fs'
import {
  scanContent,
  scanCanonicalMantineStoryContent,
  stripJsxComments,
  parseInlineMarkers,
  REPORT_ONLY_CATEGORIES,
  extractCssCustomPropertyDefinitions,
} from '../check-design-tokens.mjs'

// Task 718: the REAL src/app/globals.css definitions, read once — used as the
// default globalsDefinedProps for the shared CSS helpers below so that
// pre-existing fixtures referencing real tokens (--space-6, --border,
// --foreground, --primary, etc.) resolve exactly as they do in production,
// instead of every one of them becoming a spurious css-undefined-var finding
// under the new category. This is not a "filesystem fixture" in the §23.5
// sense (planted CONTENT stays in-memory strings) — it is the same resolution
// source run() itself reads, so the test harness matches real behavior.
const REAL_GLOBALS_DEFINED_PROPS = extractCssCustomPropertyDefinitions(
  readFileSync('src/app/globals.css', 'utf8')
)

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
  return scanContent(content, CSS_FIXTURE_PATH, {}, REAL_GLOBALS_DEFINED_PROPS)
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
    expect(regularCss('.x { width: calc(var(--space-6) * 2); }')).toHaveLength(0)
  })

  it('does NOT flag zero values (0, 0px, 0rem)', () => {
    expect(regularCss('.x { margin: 0; }')).toHaveLength(0)
    expect(regularCss('.x { padding: 0px; }')).toHaveLength(0)
    expect(regularCss('.x { top: 0rem; }')).toHaveLength(0)
  })

  it('does NOT flag 100% (not a px/rem/em length)', () => {
    expect(regularCss('.x { width: 100%; }')).toHaveLength(0)
  })

  it('does NOT flag the approved 1px hairline-border value when it IS the whole declaration value (A3 decision, single-value only — see Task 716 §E for the shorthand case, which is a finding as of Task 716 A3/AC1)', () => {
    expect(regularCss('.x { border-top-width: 1px; }')).toHaveLength(0)
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

  it('a css-length marker with no — separator is a missing-reason error, not stale-marker (Task 716 R4 fix — corrects the Task 714 defect where the trailing */ was captured into rawValue and the marker misreported as stale-marker)', () => {
    const all = findingsOfCss(
      '.fabLabel {\n  font-size: 10px; /* design-tokens-allow: font-size: 10px */\n}'
    )
    expect(all.some(f => f.cat === 'missing-reason' && f.match === 'font-size: 10px')).toBe(true)
    expect(all.some(f => f.cat === 'stale-marker')).toBe(false)
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

  it('strips a trailing */ from a reason-less CSS block-comment marker (Task 716 R4 fix)', () => {
    expect(parseInlineMarkers('/* design-tokens-allow: font-size: 10px */'))
      .toEqual([{ rawValue: 'font-size: 10px', hasReason: false }])
  })

  it('does NOT strip */ when a reason is present (only the no-reason branch is touched)', () => {
    expect(parseInlineMarkers('/* design-tokens-allow: font-size: 10px — reason */'))
      .toEqual([{ rawValue: 'font-size: 10px', hasReason: true }])
  })
})

describe('§E — shorthand/function-wrapped CSS declaration coverage (Task 716)', () => {
  it('flags a raw length inside a multi-value shorthand list (R1 — AC1)', () => {
    const findings = regularCss('.x {\n  border-bottom: 1px solid var(--border);\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'border-bottom: 1px' })
  })

  it('flags a raw length inside a CSS function (R2 — AC2)', () => {
    const findings = regularCss('.x {\n  filter: blur(8px);\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'filter: 8px' })
  })

  it('flags every raw literal in a plain multi-value list (margin: 4px 8px)', () => {
    const findings = regularCss('.x {\n  margin: 4px 8px;\n}')
    expect(findings).toHaveLength(2)
    expect(findings.map(f => f.match).sort()).toEqual(['margin: 4px', 'margin: 8px'])
  })

  it('flags both raw durations in a comma-separated transition shorthand (real MantineListingCardPattern shape)', () => {
    const findings = regularCss('.x {\n  transition: transform 300ms ease-out, box-shadow 300ms ease-out;\n}')
    expect(findings).toHaveLength(2)
    expect(findings.every(f => f.cat === 'css-duration')).toBe(true)
  })

  it('does NOT flag a shorthand where every literal is token-anchored (R3 — top-level var siblings, no raw literal present)', () => {
    expect(regularCss('.x { padding: var(--space-2) var(--space-4); }')).toHaveLength(0)
  })

  it('does NOT flag a calc() built entirely from a var() and a unitless number (R3)', () => {
    expect(regularCss('.x { width: calc(var(--space-6) * 2); }')).toHaveLength(0)
  })

  it('does NOT flag zero/unitless/keyword multi-value forms (A2)', () => {
    expect(regularCss('.x { margin: 0 auto; }')).toHaveLength(0)
    expect(regularCss('.x { flex: 1 1 0; }')).toHaveLength(0)
    expect(regularCss('.x { border: 0; }')).toHaveLength(0)
    expect(regularCss('.x { line-height: 1.5; }')).toHaveLength(0)
    expect(regularCss('.x { scale: 0.95; }')).toHaveLength(0)
  })

  it('a shorthand mixing a raw literal AND a var() flags only the raw one (R1/A1)', () => {
    const findings = regularCss('.x {\n  border-bottom: 1px solid var(--border);\n}')
    expect(findings.map(f => f.match)).toEqual(['border-bottom: 1px'])
  })

  it('exempts a literal inside a function whose SAME function also contains a var() reference (A4 nested — matches the frozen Task 408 rounded-[calc(var(--radius)-5px)] precedent)', () => {
    expect(regularCss('.x { width: calc(var(--space-6) + 2px); }')).toHaveLength(0)
  })

  it('flags every unit literal in a var()-free nested function (A4 — clamp with no token anchor)', () => {
    const findings = regularCss('.x {\n  width: clamp(1rem, 2vw, 3rem);\n}')
    expect(findings).toHaveLength(2)
    expect(findings.map(f => f.match).sort()).toEqual(['width: 1rem', 'width: 3rem'])
  })

  it('does NOT flag a var()-only function with no unit literal present (color-mix)', () => {
    expect(regularCss('.x { background: color-mix(in oklab, var(--primary) 90%, transparent); }')).toHaveLength(0)
  })

  it('flags raw lengths in a --* custom-property shorthand declaration (A5 decision — real --tw-shadow shape, MobileBottomNavView.module.css:60)', () => {
    // The fixture's hex fallback also trips the unrelated, pre-existing `color`
    // category (expected, not this test's concern) — scope to css-length only.
    const findings = regularCss(
      '.x {\n  --tw-shadow: 0 -2px 16px var(--tw-shadow-color, #00000014);\n}'
    ).filter(f => f.cat === 'css-length')
    expect(findings).toHaveLength(2)
    expect(findings.map(f => f.match).sort()).toEqual(['--tw-shadow: -2px', '--tw-shadow: 16px'])
  })

  it('the 1px hairline exemption is single-value-only — 1px in a shorthand list IS a finding (A3 decision)', () => {
    expect(regularCss('.x { border-top-width: 1px; }')).toHaveLength(0)
    const shorthand = regularCss('.x { border-bottom: 1px solid var(--border); }')
    expect(shorthand).toHaveLength(1)
    expect(shorthand[0]).toMatchObject({ cat: 'css-length', match: 'border-bottom: 1px' })
  })

  it('does NOT double-count a single-bare-token value already reported by the single-value pattern', () => {
    const findings = regularCss('.x {\n  font-size: 10px;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'font-size: 10px' })
  })

  it('does NOT flag a length inside an @media prelude even with shorthand scanning active (A5 regression)', () => {
    expect(regularCss('@media (min-width: 40rem) {\n  .foo { color: var(--foreground); }\n}')).toHaveLength(0)
  })

  it('does NOT flag a length inside an @supports prelude even with shorthand scanning active (A5 regression)', () => {
    expect(regularCss('@supports (min-width: 40rem) {\n  .foo { color: var(--foreground); }\n}')).toHaveLength(0)
  })

  it('does NOT run shorthand css-length/duration/zindex scanning on a .tsx file (R9 — zero TSX behavior change)', () => {
    const findings = scanContent(
      '.x {\n  border-bottom: 1px solid var(--border);\n}',
      'src/components/ui/__fixture-task716b__.tsx',
      {}
    )
    expect(findings.filter(f => f.cat === 'css-length')).toHaveLength(0)
  })

  it('a same-line design-tokens-allow marker suppresses a shorthand css-length finding', () => {
    const suppressed = regularCss(
      '.x {\n  border-bottom: 1px solid var(--border); /* design-tokens-allow: border-bottom: 1px — hairline divider inside a shorthand, no scale token */\n}'
    )
    expect(suppressed).toHaveLength(0)
  })
})

describe('§G — REPORT_ONLY_CATEGORIES strict flip (Task 715 R4)', () => {
  it('is empty — css-length/css-duration/css-zindex are no longer report-only', () => {
    expect(REPORT_ONLY_CATEGORIES.size).toBe(0)
    expect(REPORT_ONLY_CATEGORIES.has('css-length')).toBe(false)
    expect(REPORT_ONLY_CATEGORIES.has('css-duration')).toBe(false)
    expect(REPORT_ONLY_CATEGORIES.has('css-zindex')).toBe(false)
  })

  it('a raw css-length literal is a regular (blocking) finding, not filtered as report-only', () => {
    const findings = regularCss('.x {\n  margin-top: 5px;\n}')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-length', match: 'margin-top: 5px' })
    expect(REPORT_ONLY_CATEGORIES.has(findings[0].cat)).toBe(false)
  })
})

describe('§F — reason-less CSS marker reports missing-reason, not stale-marker (Task 716 R4)', () => {
  it('a reason-less block-comment marker is missing-reason, not stale-marker (the fix)', () => {
    const all = findingsOfCss(
      '.fabLabel {\n  font-size: 10px; /* design-tokens-allow: font-size: 10px */\n}'
    )
    expect(all.some(f => f.cat === 'missing-reason' && f.match === 'font-size: 10px')).toBe(true)
    expect(all.some(f => f.cat === 'stale-marker')).toBe(false)
  })

  it('a reasoned block-comment marker still suppresses (unchanged)', () => {
    const suppressed = regularCss(
      '.fabLabel {\n  font-size: 10px; /* design-tokens-allow: font-size: 10px — interactive/mobile-critical nav text */\n}'
    )
    expect(suppressed).toHaveLength(0)
  })

  it('a genuinely stale marker (value absent from the line) still reports stale-marker, not missing-reason (regression)', () => {
    const all = findingsOfCss(
      '.fabLabel {\n  color: var(--foreground); /* design-tokens-allow: font-size: 10px — declaration removed */\n}'
    )
    expect(all.some(f => f.cat === 'stale-marker' && f.match === 'font-size: 10px')).toBe(true)
    expect(all.some(f => f.cat === 'missing-reason')).toBe(false)
  })

  it('the equivalent reason-less TSX marker is unaffected — still missing-reason (unchanged path)', () => {
    const all = findingsOf(`const style = { zIndex: 9999 } // design-tokens-allow: zIndex: 9999`)
    expect(all.some(f => f.cat === 'missing-reason')).toBe(true)
    expect(all.some(f => f.cat === 'stale-marker')).toBe(false)
  })
})

describe('§H — undefined CSS custom-property reference coverage (Task 718, R4)', () => {
  // These arms call scanContent directly (not the shared findingsOfCss/regularCss
  // helpers) so each test controls its own globalsDefinedProps input explicitly —
  // hermetic per-arm proof of each of R4's three resolution sources, rather than
  // relying on the shared helper's REAL_GLOBALS_DEFINED_PROPS default.

  it('flags a var() reference with no resolvable definition anywhere (R4/AC4 branch: undefined)', () => {
    const findings = scanContent('.x { z-index: var(--z-does-not-exist); }', CSS_FIXTURE_PATH, {})
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'css-undefined-var', match: 'var(--z-does-not-exist)' })
  })

  it('does NOT flag a var() reference defined in globals.css (R4/AC4 branch: globals-defined)', () => {
    const findings = scanContent(
      '.x { color: var(--brand-only-in-globals); }',
      CSS_FIXTURE_PATH,
      {},
      new Set(['--brand-only-in-globals'])
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag a var() reference defined locally in the same file (R4/AC4 branch: same-file-defined)', () => {
    const findings = scanContent(
      ':root {\n  --local-only: 4px;\n}\n.x {\n  gap: var(--local-only);\n}',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag var(--tw-...) or var(--mantine-...) — measured external prefixes (R4/AC4 branch: external-prefix, R6)', () => {
    const findings = scanContent(
      '.x {\n  color: var(--tw-ring-color);\n  background: var(--mantine-color-red-6);\n}',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag the measured Tailwind exact-name externals --spacing / --default-transition-timing-function (R6)', () => {
    const findings = scanContent(
      '.x {\n  width: calc(var(--spacing) * 4);\n  transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n}',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag a var() reference inside a CSS comment (R4/AC4 branch: in-comment, A3)', () => {
    const findings = scanContent(
      '.x {\n  /* color: var(--totally-phantom-token); */\n  color: red;\n}',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('does NOT flag var(--x, fallback) even when --x is undefined (R4/AC4 branch: with-fallback, A5 decision)', () => {
    const findings = scanContent(
      '.x { color: var(--totally-phantom-token, red); }',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('DOES flag the same phantom token once its fallback is removed (control for the fallback arm above)', () => {
    const findings = scanContent(
      '.x { color: var(--totally-phantom-token); }',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('var(--totally-phantom-token)')
  })

  it('a var() used as ANOTHER var()\'s fallback is still independently resolved (real MobileBottomNavView.module.css:92 shape)', () => {
    const findings = scanContent(
      '.x { transition-timing-function: var(--tw-ease, var(--totally-phantom-token)); }',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('var(--totally-phantom-token)')
  })

  it('a path the path-level allowlist short-circuits is not scanned for css-undefined-var either (A4 — 717 owns narrowing this)', () => {
    const findings = scanContent(
      '.x { color: var(--totally-phantom-token); }',
      'src/design-system/mantine/patterns/__fixture-task718__.module.css',
      { 'src/design-system/mantine': 'test allowlist entry' }
    )
    expect(findings).toHaveLength(0)
  })

  it('does NOT run css-undefined-var on a .tsx file (cssOnly — zero non-CSS behavior change)', () => {
    const findings = scanContent(
      'const x = "var(--totally-phantom-token)"',
      'src/components/ui/__fixture-task718b__.tsx',
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('a same-line design-tokens-allow marker suppresses a css-undefined-var finding', () => {
    const suppressed = scanContent(
      '.x { color: var(--totally-phantom-token); /* design-tokens-allow: var(--totally-phantom-token) — legacy override pending cleanup */ }',
      CSS_FIXTURE_PATH,
      {}
    ).filter(f => f.cat === 'css-undefined-var')
    expect(suppressed).toHaveLength(0)
  })

  it('an orphaned design-tokens-allow marker on a css-undefined-var value is a stale-marker', () => {
    const all = scanContent(
      '.x { color: red; /* design-tokens-allow: var(--totally-phantom-token) — declaration removed */ }',
      CSS_FIXTURE_PATH,
      {}
    )
    expect(all.some(f => f.cat === 'stale-marker' && f.match === 'var(--totally-phantom-token)')).toBe(true)
  })

  it('flags an uppercase VAR(--missing) reference the same as var(--missing) — CSS function names are case-insensitive (718R R1)', () => {
    const findings = scanContent('.w { color: VAR(--phantom-f); }', CSS_FIXTURE_PATH, {})
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('VAR(--phantom-f)')
  })

  it('DOES flag a var() reference on a line whose first non-space character is "*" — Task 719 closed the cross-category shouldSkipLine blind spot (§23.6.c)', () => {
    const findings = scanContent('*, *::before { color: var(--phantom-b); }', CSS_FIXTURE_PATH, {})
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('var(--phantom-b)')
  })

  it('does NOT flag a var(...) call split across physical lines — the scan is line-based by design (§3.4); documented architectural limitation, unowned (§23.6.c)', () => {
    const findings = scanContent('.z { color: var(\n  --phantom-e\n ); }', CSS_FIXTURE_PATH, {})
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  it('extractCssCustomPropertyDefinitions finds a custom property regardless of indentation/block nesting', () => {
    const defs = extractCssCustomPropertyDefinitions('@theme inline {\n  --z-base: 0;\n  --z-toast: 100;\n}\n')
    expect(defs.has('--z-base')).toBe(true)
    expect(defs.has('--z-toast')).toBe(true)
    expect(defs.has('--z-sticky')).toBe(false)
  })

  it('extractCssCustomPropertyDefinitions ignores a definition-shaped string inside a comment', () => {
    const defs = extractCssCustomPropertyDefinitions('/* --z-commented: 5; */\n.x { color: red; }')
    expect(defs.has('--z-commented')).toBe(false)
  })

  it('the real src/app/globals.css defines all 7 --z-* tokens at their §22.3 values (R1 regression lock)', () => {
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-base')).toBe(true)
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-dropdown')).toBe(true)
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-sticky')).toBe(true)
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-overlay')).toBe(true)
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-modal')).toBe(true)
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-popover')).toBe(true)
    expect(REAL_GLOBALS_DEFINED_PROPS.has('--z-toast')).toBe(true)
  })
})

describe('§I — universal-selector line skip: shouldSkipLine cross-category blind spot (Task 719, R1-R3)', () => {
  // R2 — one planted arm per category shouldSkipLine blinded (§3.2 of the kickoff). Each
  // fails before R1 lands (the leading `*` on a universal-selector line is treated as a
  // comment, so scanContent never reaches the declaration) and passes after (the .css skip
  // decision consults the CSS-comment-stripped line instead of guessing from the raw one).

  it('flags css-length on a universal-selector line (R2 arm 1)', () => {
    const findings = findingsOfCss('* { margin: 10px; }').filter(f => f.cat === 'css-length')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('margin: 10px')
  })

  it('flags css-duration on a universal-selector line (R2 arm 2)', () => {
    const findings = findingsOfCss('* { transition-duration: 250ms; }').filter(f => f.cat === 'css-duration')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('transition-duration: 250ms')
  })

  it('flags css-zindex on a universal-selector line (R2 arm 3)', () => {
    const findings = findingsOfCss('* { z-index: 42; }').filter(f => f.cat === 'css-zindex')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('z-index: 42')
  })

  it('flags css-undefined-var on a universal-selector line (R2 arm 4)', () => {
    const findings = scanContent('* { color: var(--phantom); }', CSS_FIXTURE_PATH, {})
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('var(--phantom)')
  })

  // R3 — regression lock. The fix asks the CSS-comment stripper whether a line is blank
  // (A3/A4); it must not start scanning a genuine comment continuation line, and it must
  // not move the .ts/.tsx path at all (A2).

  it('does NOT flag a value written on a .css multi-line comment continuation line (R3 arm 1, A4)', () => {
    const content = [
      '/*',
      ' * old rule, do not use: margin: 999px;',
      ' */',
      '.a { margin: 10px; }',
    ].join('\n')
    const findings = findingsOfCss(content).filter(f => f.cat === 'css-length')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('margin: 10px')
  })

  it('does NOT flag a .tsx JSDoc continuation line — the .ts/.tsx path is unchanged (R3 arm 2, A2)', () => {
    const content = [
      '/**',
      ' * Example: className="text-[10px]"',
      ' */',
      'function f() {}',
    ].join('\n')
    expect(regular(content)).toHaveLength(0)
  })
})

describe('§J — extractCssCustomPropertyDefinitions: line-anchored definitions (Task 720, R1-R4)', () => {
  // R4(a) — end-to-end: a same-line define-and-use must not produce a phantom
  // css-undefined-var finding. Before the fix, "--local:" is not the first token on its
  // physical line (".x { " precedes it), so the line-anchored regex never registers it.

  it('(a) a same-line define-and-use does not produce a phantom css-undefined-var finding', () => {
    const findings = findingsOfCss('.x { --local: 1px; width: var(--local); }')
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(0)
  })

  // R4(b) — a second same-line declaration must be registered too, and case stays
  // significant. Before the fix, `exec`'s `^`-anchored /gm walk advances past the first
  // match and the second declaration on the same line is never reached.

  it('(b) two different-case custom properties on the same line are both registered, distinctly', () => {
    const defs = extractCssCustomPropertyDefinitions('--Foo: 1px; --foo: 2px')
    expect(defs.has('--Foo')).toBe(true)
    expect(defs.has('--foo')).toBe(true)
    expect(defs.size).toBe(2)
  })

  // R4(c) — the guard against the rejected naive fix (§3.4). This already passes against
  // today's line-anchored regex (neither literal starts a line) — it must keep passing
  // after the fix too, or the declaration-aware scan is the rejected "delete the ^" repair
  // wearing a disguise.

  it('(c) a declaration-shaped literal inside a value is not registered — content string and data-URI', () => {
    expect(
      extractCssCustomPropertyDefinitions('.x {\n  content: "--fake: 1px";\n}').has('--fake')
    ).toBe(false)
    expect(
      extractCssCustomPropertyDefinitions(
        '.x {\n  background: url("data:image/svg+xml,<svg style=%27--fake2: 1%27/>");\n}'
      ).has('--fake2')
    ).toBe(false)
  })

  it('a var() differing only in case from a defined property is still a finding (R3 — case stays significant)', () => {
    const findings = findingsOfCss('.x { --Foo: 1px; width: var(--foo); }')
      .filter(f => f.cat === 'css-undefined-var')
    expect(findings).toHaveLength(1)
    expect(findings[0].match).toBe('var(--foo)')
  })
})

describe('raw-dimension-prop — Task 782 detector, expanded layout coverage', () => {
  it('flags a raw numeric size prop', () => {
    const findings = regular(`<Icon size={16} />`)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ cat: 'raw-dimension-prop', match: 'size={16}' })
  })

  it('flags each of miw/maw/mih/mah/w/h with a raw number', () => {
    const findings = regular(
      `<Box miw={192} maw={360} mih={44} mah={220} w={280} h={112} />`
    )
    expect(findings.filter(f => f.cat === 'raw-dimension-prop')).toHaveLength(6)
  })

  it('flags raw layout and component dimensions but not data props', () => {
    const findings = regular(
      `<Box gap={16} spacing={40} mt={48} separatorMargin={6} width={320} triggerWidth={150} count={12} maxLength={80} />`
    )
    expect(findings.filter(f => f.cat === 'raw-dimension-prop')).toHaveLength(6)
    expect(findings.map(f => f.match)).toEqual(expect.arrayContaining([
      'gap={16}', 'spacing={40}', 'mt={48}', 'separatorMargin={6}', 'width={320}', 'triggerWidth={150}',
    ]))
  })

  it('does NOT flag ={0} — reset/flex behavior is not a design dimension', () => {
    expect(regular(`<Box miw={0} gap={0} mt={0} width={0} />`)).toHaveLength(0)
  })

  it('does NOT flag a string token (already canonical)', () => {
    expect(regular(`<ThemeIcon size="md" />`)).toHaveLength(0)
  })

  it('does NOT flag a token-reference expression (not a bare integer literal)', () => {
    expect(regular(`<Icon size={theme.other.iconSize.standard} />`)).toHaveLength(0)
  })

  it('does NOT flag inside a JSX comment', () => {
    expect(regular(`{/* <Icon size={16} /> */}`)).toHaveLength(0)
  })

  it('two-armed plant: introducing then removing a raw value flips the finding', () => {
    const planted = `<ActionIcon w={16} onClick={onClose} />`
    const reverted = `<ActionIcon onClick={onClose} />`
    expect(regular(planted).some(f => f.cat === 'raw-dimension-prop' && f.match === 'w={16}')).toBe(true)
    expect(regular(reverted).filter(f => f.cat === 'raw-dimension-prop')).toHaveLength(0)
  })

  it('flags raw unit-bearing JSX props, including compound and calc values', () => {
    const findings = regular(`<Box mih="2.75rem" gap="0.25rem 0.75rem" w="calc(100vw - 2rem)" />`)
    expect(findings.filter(f => f.cat === 'raw-dimension-prop')).toHaveLength(3)
  })

  it('flags non-zero inline-style dimensions while retaining zero resets', () => {
    const findings = regular(
      `<Box style={{ maxHeight: 480, marginTop: 2, lineHeight: '1.25rem', letterSpacing: '0.05em', minWidth: 0, flexShrink: 0 }} />`
    )
    expect(findings.filter(f => f.cat === 'raw-inline-dimension')).toHaveLength(4)
    expect(regular(`<Box style={{ maxHeight: 0, marginTop: 0 }} />`)).toHaveLength(0)
  })
})

describe('canonical Mantine stories — Tailwind dimension utilities', () => {
  const STORY_PATH = 'src/stories/mantine/primitives/__fixture__.stories.tsx'

  it('flags named Tailwind size/spacing utilities in a canonical Mantine story', () => {
    const findings = scanCanonicalMantineStoryContent(
      `<Icon className="h-4 w-4 gap-2" />`,
      STORY_PATH,
      {},
    )
    expect(findings.map(f => f.match)).toEqual(['className="h-4 w-4 gap-2"'])
    expect(findings.every(f => f.cat === 'tailwind-dimension-utility')).toBe(true)
  })

  it('does not scan non-canonical stories or non-dimension fixture classes', () => {
    expect(scanCanonicalMantineStoryContent(
      `<Icon className="flex items-center text-muted-foreground" />`,
      STORY_PATH,
      {},
    )).toHaveLength(0)
    expect(scanCanonicalMantineStoryContent(
      `<Icon className="h-4" />`,
      'src/stories/legacy/__fixture__.stories.tsx',
      {},
    )).toHaveLength(0)
  })
})
