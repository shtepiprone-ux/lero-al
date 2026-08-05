import { useEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack, Text } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { RangeDatePicker, type DateRange } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta = {
  title: 'Mantine/Primitives/RangeDatePicker',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

/**
 * Forces the calendar panel OPEN (Task 554 open-overlay pattern, same mechanism as
 * `LocationComboboxSubPanel.stories.tsx`). `RangeDatePicker` has no prop to force the panel open
 * (by design — "do NOT add a force-open prop to the product component", carried over from Task
 * 553's kickoff). This wrapper finds the real trigger `<input readOnly>` and clicks it.
 *
 * **Why a `setTimeout(0)`-deferred `useEffect`, not a synchronous `useLayoutEffect` (Task 561
 * fix — the Task 558 version used `useLayoutEffect` and silently never opened the MOBILE sheet):**
 * `MantinePopover`/`MantineCombobox` resolve `isMobile` via `useMediaQuery` with Mantine's default
 * `getInitialValueInEffect:true` — the FIRST render is always the desktop branch; `isMobile` only
 * flips to `true` after that hook's own effect runs and triggers a re-render (documented in
 * `MantinePopover.tsx`'s SSR/hydration comment: "No user interaction is possible before this
 * switch so the transition is imperceptible" — true for a REAL user, who can only click after the
 * page has painted, by which point the flip has already happened). A synchronous
 * `useLayoutEffect` click fires BEFORE that flip resolves, so at `<640` it always lands on the
 * transient DESKTOP render — opening `MantinePopover`'s internal `desktopOpened` state instead of
 * `drawerOpened` — and once the branch flips to mobile moments later, the (unrelated,
 * already-initialized-false) `drawerOpened` state is still false, so the bottom sheet never
 * visibly opens (confirmed via a throwaway Playwright probe against the built story: 0 of 5
 * `.mantine-Drawer-content` nodes existed even after the click). Deferring the click via
 * `setTimeout(0)` inside a normal `useEffect` yields to the event loop, letting `isMobile`'s own
 * state update (and the resulting re-render) finish first — same mechanism a real user's click
 * benefits from, just made deterministic in a synchronous test harness. Re-verified via the same
 * probe after this fix: `.mantine-Drawer-content` renders with a non-null bounding box.
 */
function RangeDatePickerOpen({
  value,
  maxDate,
  disablePastDates,
  placeholder,
}: {
  value: DateRange
  maxDate?: Date
  disablePastDates?: boolean
  placeholder: string
}) {
  const [current, setCurrent] = useState<DateRange>(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      containerRef.current?.querySelector('input')?.click()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={containerRef} style={{ maxWidth: 480 }}>
      <RangeDatePicker
        value={current}
        onChange={setCurrent}
        maxDate={maxDate}
        disablePastDates={disablePastDates}
        placeholder={placeholder}
      />
    </div>
  )
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const t = (key: string) => storyT(locale, `storybook.mantine.${key}`)

    // Fixed dates (no Math.random()/new Date() wall-clock in fixtures per Storybook governance §14) —
    // '2026-01-28' → '2026-02-05' spans a month boundary so the inRange fill's cross-month
    // continuity is visible; maxDate mid-February disables the tail of the right/Feb month grid.
    const spanningRange: DateRange = { from: '2026-01-28', to: '2026-02-05' }
    const boundedMaxDate = new Date(2026, 1, 10)

    return (
      <MantineStoryShell>
        <Stack gap="xl">
          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              empty — trigger shows placeholder, no clear affordance
            </Text>
            <RangeDatePickerRow placeholder={t('range_placeholder')} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              staged range spanning two months — trigger shows dd.MM.yyyy — dd.MM.yyyy + clear-X
            </Text>
            <RangeDatePickerRow value={spanningRange} placeholder={t('range_placeholder')} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              maxDate-bounded — prop accepted, trigger unaffected while closed
            </Text>
            <RangeDatePickerRow maxDate={boundedMaxDate} placeholder={t('range_placeholder')} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              disablePastDates — prop accepted, trigger unaffected while closed (forcing this OPEN
              too, alongside the section below, made two floating panels collide on screen — a
              story-layout artifact confirmed via a rendered-gate probe, not a component defect;
              see the session log&apos;s Rendered evidence for an isolated open capture of this prop)
            </Text>
            <RangeDatePickerRow disablePastDates placeholder={t('range_placeholder')} />
          </Stack>

          <Stack gap="xs">
            <Text size="xs" c="gray.5" fw={500}>
              forced open (real RangeDatePicker, Task 561 mobile rework) — ≥640: two-month
              consecutive pair + shared header (arrows + month/year dropdowns + gray right-month
              label) + range summary + Clear/Cancel/Apply; &lt;640: FIXED header with month + year
              dropdowns (no duplicate month label), vertically-scrolling month list where each
              section is Title → Monday-first weekday row → 39px day grid, and a FIXED bottom bar
              (range summary + full-width Confirm) that does not scroll with the list. inRange fill
              + maxDate disabled tail both visible. ONE forced-open instance only — a second
              simultaneous one was tried and reverted (see the row above).
            </Text>
            <RangeDatePickerOpen value={spanningRange} maxDate={boundedMaxDate} placeholder={t('range_placeholder')} />
          </Stack>
        </Stack>
      </MantineStoryShell>
    )
  },
}

function RangeDatePickerRow({
  value,
  maxDate,
  disablePastDates,
  placeholder,
}: {
  value?: DateRange
  maxDate?: Date
  disablePastDates?: boolean
  placeholder: string
}) {
  const [current, setCurrent] = useState<DateRange>(value ?? { from: undefined, to: undefined })
  return (
    <div style={{ maxWidth: 480 }}>
      <RangeDatePicker
        value={current}
        onChange={setCurrent}
        maxDate={maxDate}
        disablePastDates={disablePastDates}
        placeholder={placeholder}
      />
    </div>
  )
}
