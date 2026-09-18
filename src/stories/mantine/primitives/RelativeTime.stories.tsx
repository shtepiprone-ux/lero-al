import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Stack, Text, Anchor } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/RelativeTime',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

// `formatDistanceToNow` (kept exactly, per Task 844's kickoff) always measures from the real
// `Date.now()` INSIDE `RelativeTime` at render time — it takes no reference-date parameter,
// unlike date-fns' `formatDistance(date, baseDate)`. The Storybook preview clock is FROZEN,
// though (`.storybook/preview-head.html:15`, Task 698, D25): `new Date()` with no arguments
// always resolves to `2026-07-30T00:00:00.000Z` inside the preview iframe, so the *displayed*
// relative text does NOT drift in a Storybook capture — it is fully deterministic there. Review
// finding K1 (2026-09-18): this file's `FIXTURE_ANCHOR` must equal that same frozen instant, or
// every offset below renders in the FUTURE relative to the preview clock, which date-fns then
// prints as "in about 2 months" instead of "2 months ago".
// `check:stories`' wall-clock-fixture-value rule (§14.10) still governs how the FIXTURE DATE
// ITSELF is constructed in this file's source: it must not read `Date.now()`/bare `new Date()`
// here, so a rendered-capture diff isn't chasing a source-level moving target. `FIXTURE_ANCHOR`
// is that frozen, named constant; only its offsets below are computed, never the live clock.
const FIXTURE_ANCHOR = new Date('2026-07-30T00:00:00.000Z')
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function fixtureDate(msAgo: number): string {
  return new Date(FIXTURE_ANCHOR.getTime() - msAgo).toISOString()
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('relative_time_section_plain')}
            </Text>
            <Stack gap="sm">
              <Text size="sm">
                <RelativeTime date={fixtureDate(5 * MINUTE)} />
              </Text>
              <Text size="sm">
                <RelativeTime date={fixtureDate(3 * HOUR)} />
              </Text>
              <Text size="sm">
                <RelativeTime date={fixtureDate(2 * DAY)} />
              </Text>
              <Text size="sm">
                <RelativeTime date={fixtureDate(60 * DAY)} />
              </Text>
            </Stack>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('relative_time_section_absolute')}
            </Text>
            <Stack gap="sm">
              <Text size="sm">
                <RelativeTime date={fixtureDate(3 * HOUR)} absoluteLabel="29.07.2026 23:00" />
              </Text>
            </Stack>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('relative_time_section_inherit')}
            </Text>
            <Stack gap="sm">
              <Text size="xs" c="gray.5">
                <RelativeTime date={fixtureDate(2 * DAY)} />
              </Text>
              <Text size="sm" fw={600} c="gray.8">
                <RelativeTime date={fixtureDate(2 * DAY)} />
              </Text>
            </Stack>
          </Stack>

          {/* Review G2 (2026-09-18) — nested inside an already-interactive ancestor (a link, as
              in MantineDashboardWorkList's row), `focusable={false}` keeps the `aria-label`
              (still reaches assistive tech via the anchor's own composite accessible name) but
              adds no separate tab stop: the <time> below carries no `tabindex` attribute at all,
              so tabbing through this anchor is exactly one stop, not two. */}
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              {t('relative_time_section_nested_link')}
            </Text>
            <Anchor href="#" underline="never" data-testid="nested-link-demo">
              <RelativeTime date={fixtureDate(3 * HOUR)} absoluteLabel="29.07.2026 23:00" focusable={false} />
            </Anchor>
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC5 — keyboard focus reaches the standalone <time> element (absoluteLabel makes it
  // tabIndex=0) and its aria-label carries both the relative and absolute text. The floating
  // tooltip bubble itself is a portal-rendered Mantine internal and not asserted here; the
  // accessible-name contract is.
  play: async ({ canvasElement }) => {
    const timeElements = canvasElement.querySelectorAll('time[tabindex]')
    expect(timeElements.length).toBe(1) // only the standalone "with absoluteLabel" demo is focusable
    const el = timeElements[0] as HTMLElement
    el.focus()
    expect(document.activeElement).toBe(el)
    const ariaLabel = el.getAttribute('aria-label') ?? ''
    expect(ariaLabel).toContain('29.07.2026 23:00')
    expect(ariaLabel.length).toBeGreaterThan('29.07.2026 23:00'.length) // relative text is also present

    // Review G2 — the nested-link demo's <time> has no tabindex of its own (one tab stop per
    // row: the anchor), but its aria-label still carries the absolute time.
    const nestedLink = canvasElement.querySelector('[data-testid="nested-link-demo"]') as HTMLElement
    const nestedTime = nestedLink.querySelector('time')!
    expect(nestedTime.hasAttribute('tabindex')).toBe(false)
    expect(nestedTime.getAttribute('aria-label') ?? '').toContain('29.07.2026 23:00')
  },
}
