// @vitest-environment jsdom
/**
 * D69-19 replacement of theme.d69-18.test.ts (Task 784 Revision 4, I1).
 *
 * The prior test (Revision 3) duplicated every D69-18 value as a raw literal and forced the
 * theme through an unsafe `as MantineTheme` cast — a local hardcoded value catalogue, not a
 * contract test, per the kickoff's own diagnosis. This replacement:
 *
 *   1. Never casts the theme. `useMantineTheme()` is exercised through `renderHook` inside a
 *      real `<MantineProvider>`, which returns the library's own fully-resolved `MantineTheme`
 *      type — no `as`, no `any`, no index signature, no optional fallback anywhere in this file.
 *   2. Asserts EXISTENCE and PRIMITIVE KIND for every D69-18 named contract (string/number/array
 *      shape), never its numeric/string VALUE — the value itself lives in exactly one place,
 *      theme.ts, cited there to its provenance.
 *   3. Asserts OWNER EXCLUSIVITY by comparing two theme-sourced values against each other
 *      (never against a hardcoded literal) — e.g. `theme.other.tooltip.multilineWidth` must not
 *      equal `theme.other.boxSize.compactTrigger`.
 *   4. Verifies every mapped §13 consumer MECHANICALLY: (a) its source text contains a reference
 *      to the expected named contract or its emitted CSS variable, and (b) the project's own
 *      `scanContent()` detector — the same function `--scope=mantine` itself runs — reports zero
 *      raw-dimension findings for that file. Both checks read real files at test time; neither
 *      duplicates a raw design value.
 *
 * Exact visual fidelity (does the rendered computed style match this contract at runtime) is
 * intentionally OUT of scope for this jsdom test — jsdom has no real layout engine. That check is
 * performed by the real-browser evidence suite (I2) against a live Storybook build; see
 * `docs/sessions/evidence/task784/` for those artifacts and the session log §17.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderHook } from '@testing-library/react'
import { MantineProvider, useMantineTheme } from '@mantine/core'
import type { MantineTheme } from '@mantine/core'
import { theme } from '../theme'
import { scanContent } from '../../../../scripts/check-design-tokens.mjs'

const ROOT = resolve(__dirname, '../../../..')

// jsdom has no matchMedia — MantineProvider's color-scheme detection needs it (same stub as
// MantinePagination.smoke.test.tsx uses for the same reason).
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

function readSource(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), 'utf8')
}

/** No cast anywhere: `useMantineTheme()`'s own return type IS `MantineTheme`. Named without a
 *  `use` prefix on purpose — it is a plain helper that CALLS a hook via `renderHook`, not itself
 *  a hook, and `react-hooks/rules-of-hooks` mis-detects a `use`-prefixed wrapper as one. */
function resolveTheme(): MantineTheme {
  const { result } = renderHook(() => useMantineTheme(), {
    wrapper: ({ children }) => <MantineProvider theme={theme}>{children}</MantineProvider>,
  })
  return result.current
}

describe('D69-18 theme contracts — existence and primitive kind (no duplicated values)', () => {
  it('theme.spacing has the three sub-`xs` string keys (micro/tight/compact)', () => {
    const t = resolveTheme()
    expect(typeof t.spacing.micro).toBe('string')
    expect(typeof t.spacing.tight).toBe('string')
    expect(typeof t.spacing.compact).toBe('string')
  })

  it('theme.fontSizes has the `micro` string key', () => {
    const t = resolveTheme()
    expect(typeof t.fontSizes.micro).toBe('string')
  })

  it('theme.lineHeights has the `listingDescription` string key', () => {
    const t = resolveTheme()
    expect(typeof t.lineHeights.listingDescription).toBe('string')
  })

  it('theme.other.letterSpacing.filterHeading exists as a string', () => {
    const t = resolveTheme()
    expect(typeof t.other.letterSpacing.filterHeading).toBe('string')
  })

  it('theme.other.tooltip has inlinePadding and multilineWidth as strings', () => {
    const t = resolveTheme()
    expect(typeof t.other.tooltip.inlinePadding).toBe('string')
    expect(typeof t.other.tooltip.multilineWidth).toBe('string')
  })

  it('theme.other.listingSkeleton.mediaRatio is a positive number', () => {
    const t = resolveTheme()
    expect(typeof t.other.listingSkeleton.mediaRatio).toBe('number')
    expect(t.other.listingSkeleton.mediaRatio).toBeGreaterThan(0)
  })

  it('theme.other.listingSkeleton.featured has the documented shape', () => {
    const t = resolveTheme()
    const { featured } = t.other.listingSkeleton
    expect(Array.isArray(featured.lineHeights)).toBe(true)
    expect(featured.lineHeights).toHaveLength(5)
    expect(featured.lineHeights.every((n) => typeof n === 'number')).toBe(true)
    expect(typeof featured.firstLineWidth).toBe('number')
    expect(typeof featured.thirdLineWidthPercent).toBe('string')
    expect(typeof featured.fourthLineWidth).toBe('number')
  })

  it('theme.other.listingSkeleton.latest has the documented shape', () => {
    const t = resolveTheme()
    const { latest } = t.other.listingSkeleton
    expect(Array.isArray(latest.lineHeights)).toBe(true)
    expect(latest.lineHeights).toHaveLength(4)
    expect(latest.lineHeights.every((n) => typeof n === 'number')).toBe(true)
    expect(typeof latest.firstLineWidth).toBe('number')
    expect(typeof latest.thirdLineWidth).toBe('number')
  })

  it('theme.other.layout has all four one-off geometry keys as numbers', () => {
    const t = resolveTheme()
    expect(typeof t.other.layout.authFormMaxWidth).toBe('number')
    expect(typeof t.other.layout.emptyStateMinBlockSize).toBe('number')
    expect(typeof t.other.layout.listingContactStickyOffset).toBe('number')
    expect(typeof t.other.layout.footerGridGap).toBe('number')
  })

  it('theme.other.overlay.dragHandle has width/height as strings', () => {
    const t = resolveTheme()
    expect(typeof t.other.overlay.dragHandle.width).toBe('string')
    expect(typeof t.other.overlay.dragHandle.height).toBe('string')
  })
})

describe('D69-18 owner exclusivity — theme-sourced comparisons, never a hardcoded literal', () => {
  it('theme.other.tooltip.multilineWidth is NOT theme.other.boxSize.compactTrigger (different owners)', () => {
    const t = resolveTheme()
    expect(t.other.tooltip.multilineWidth).not.toBe(t.other.boxSize.compactTrigger)
  })

  it('the three spacing sub-rungs are pairwise distinct', () => {
    const t = resolveTheme()
    const values = [t.spacing.micro, t.spacing.tight, t.spacing.compact]
    expect(new Set(values).size).toBe(3)
  })
})

// ── Mechanical consumer verification ──────────────────────────────────────────
// Each row: the consumer file, the substring its source MUST contain (the named contract or its
// emitted CSS variable — never a value), per the exact §13 map row that names it.
const CONTRACT_CONSUMERS: Array<{ contract: string; file: string; mustContain: string[] }> = [
  {
    contract: 'theme.spacing.micro/tight/compact',
    file: 'src/design-system/mantine/patterns/MantineListingCardPattern.tsx',
    mustContain: ['"tight"', '"compact"', 'var(--mantine-spacing-micro)'],
  },
  {
    contract: 'theme.spacing.micro/tight/compact',
    file: 'src/design-system/mantine/patterns/MantineListingContactPattern.tsx',
    mustContain: ['"micro"', '"compact"'],
  },
  {
    contract: 'theme.spacing.micro/tight/compact',
    file: 'src/design-system/mantine/patterns/MantineListingDetailPattern.tsx',
    mustContain: ['"tight"', '"micro"'],
  },
  {
    contract: 'theme.fontSizes.micro / theme.spacing.micro',
    file: 'src/design-system/mantine/patterns/MantineNotificationPattern.tsx',
    mustContain: ['var(--mantine-font-size-micro)', '"micro"'],
  },
  {
    contract: 'theme.spacing.tight',
    file: 'src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx',
    mustContain: ['"tight"'],
  },
  {
    contract: 'theme.spacing.compact',
    file: 'src/design-system/mantine/patterns/MantineProgress.tsx',
    mustContain: ['"compact"'],
  },
  {
    contract: 'theme.spacing.compact',
    file: 'src/modules/listings/components/ListingsPageFrame.tsx',
    mustContain: ['"compact"'],
  },
  {
    contract: 'theme.spacing.micro',
    file: 'src/modules/listings/components/ListingsSortBar.tsx',
    mustContain: ['"micro"'],
  },
  {
    contract: 'theme.spacing.micro',
    file: 'src/modules/locations/components/PopularLocationsView.tsx',
    mustContain: ['"micro"'],
  },
  {
    contract: 'theme.spacing.tight',
    file: 'src/components/shared/LocationCombobox.tsx',
    mustContain: ['"tight"'],
  },
  {
    contract: 'theme.lineHeights.listingDescription',
    file: 'src/design-system/mantine/patterns/MantineListingDetailPattern.tsx',
    mustContain: ['var(--mantine-line-height-listingDescription)'],
  },
  {
    contract: 'theme.other.letterSpacing.filterHeading',
    file: 'src/design-system/mantine/patterns/MantineFilterSection.tsx',
    mustContain: ['theme.other.letterSpacing.filterHeading'],
  },
  {
    contract: 'theme.other.letterSpacing.filterHeading',
    file: 'src/modules/listings/components/ListingsFilters.tsx',
    mustContain: ['theme.other.letterSpacing.filterHeading'],
  },
  {
    contract: 'theme.other.tooltip.inlinePadding/multilineWidth',
    file: 'src/design-system/mantine/patterns/MantineTooltip.tsx',
    mustContain: ['theme.other.tooltip.multilineWidth', 'theme.other.tooltip.inlinePadding'],
  },
  {
    contract: 'theme.other.listingSkeleton.featured/mediaRatio',
    file: 'src/modules/listings/components/FeaturedListingsView.tsx',
    mustContain: ['theme.other.listingSkeleton', 'AspectRatio'],
  },
  {
    contract: 'theme.other.listingSkeleton.latest/mediaRatio',
    file: 'src/modules/listings/components/LatestListingsView.tsx',
    mustContain: ['theme.other.listingSkeleton', 'AspectRatio'],
  },
  {
    contract: 'theme.other.layout.authFormMaxWidth',
    file: 'src/design-system/mantine/patterns/MantineAuthFormPattern.tsx',
    mustContain: ['theme.other.layout.authFormMaxWidth'],
  },
  {
    contract: 'theme.other.layout.emptyStateMinBlockSize',
    file: 'src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx',
    mustContain: ['theme.other.layout.emptyStateMinBlockSize'],
  },
  {
    contract: 'theme.other.layout.listingContactStickyOffset',
    file: 'src/design-system/mantine/patterns/MantineListingContactPattern.tsx',
    mustContain: ['theme.other.layout.listingContactStickyOffset', 'theme.breakpoints.lg'],
  },
  {
    contract: 'theme.other.layout.footerGridGap',
    file: 'src/components/layout/FooterView.tsx',
    mustContain: ['theme.other.layout.footerGridGap'],
  },
  {
    contract: 'theme.other.overlay.dragHandle',
    file: 'src/design-system/mantine/patterns/responsiveBottomSheet.tsx',
    mustContain: ['theme.other.overlay.dragHandle.width', 'theme.other.overlay.dragHandle.height'],
  },
  {
    contract: 'theme.other.overlay.dragHandle',
    file: 'src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx',
    mustContain: ['theme.other.overlay.dragHandle.width', 'theme.other.overlay.dragHandle.height'],
  },
]

describe('D69-18 §13 consumers — each resolves its named contract (mechanical source check)', () => {
  for (const { contract, file, mustContain } of CONTRACT_CONSUMERS) {
    it(`${file} resolves ${contract}`, () => {
      const source = readSource(file)
      for (const needle of mustContain) {
        expect(source).toContain(needle)
      }
    })
  }
})

describe('D69-18 §13 consumers — zero raw-dimension findings (same detector --scope=mantine runs)', () => {
  const files = [...new Set(CONTRACT_CONSUMERS.map((c) => c.file))]

  for (const file of files) {
    it(`${file} has zero raw-dimension-prop/raw-inline-dimension findings`, () => {
      const source = readSource(file)
      const findings = scanContent(source, file, {})
      const regular = findings.filter(
        (f: { cat: string }) => f.cat !== 'missing-reason' && f.cat !== 'stale-marker',
      )
      expect(regular).toEqual([])
    })
  }
})

describe('D69-18 compactTrigger exclusivity — MantineTooltip.tsx no longer uses it (Revision 3 defect)', () => {
  // A historical-note comment quoting "theme.other.boxSize.compactTrigger" (documenting the
  // Revision 2→3 fix) is expected and legitimate — this asserts no LIVE property-access
  // expression `theme.other.boxSize.compactTrigger` (or `.boxSize.compactTrigger`) remains
  // outside comment text, by stripping `//` and `/* */` comment spans before matching.
  it('MantineTooltip.tsx has no live theme.other.boxSize.compactTrigger property access', () => {
    const source = readSource('src/design-system/mantine/patterns/MantineTooltip.tsx')
    const withoutLineComments = source.replace(/\/\/.*$/gm, '')
    const withoutBlockComments = withoutLineComments.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(withoutBlockComments).not.toContain('boxSize.compactTrigger')
  })
})
