import type { MantineTheme } from '@mantine/core'

const ROOT_FONT_PX = 16

/**
 * Media query that matches only BELOW the project's mobile gate (`theme.other.mobileGate` = 40em = 640px).
 *
 * `shared/mobile-adaptation-contract.md`: "the compact composition is required below 640px and the 640px layout is the transition
 * boundary to the wider composition". `(max-width: 40em)` is inclusive and still matches at exactly 640px, so a component that
 * switched on it showed its compact form at 640px (Task 923, R33). Mantine's own "smaller than a breakpoint" is the breakpoint less
 * 0.1px (`smallerThan` / `hiddenFrom`); this is that form, for the `useMediaQuery` exception, in one place. Pure string work (no
 * `@mantine/core` runtime import), so a test that mocks `@mantine/core` still resolves it.
 */
export function belowMobileGateQuery(theme: Pick<MantineTheme, 'other'>): string {
  const gate = String(theme.other.mobileGate)
  const em = /^([\d.]+)em$/.exec(gate)
  return em ? `(max-width: ${Number(em[1]) - 0.1 / ROOT_FONT_PX}em)` : `(max-width: calc(${gate} - 0.1px))`
}
