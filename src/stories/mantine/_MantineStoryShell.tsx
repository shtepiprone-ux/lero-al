import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

export interface MantineStoryShellProps {
  children: ReactNode
  /**
   * Task 540 (owner override, 2026-07-03) — `'full'` (default, 21 primitive stories): `≥640`
   * drops the Task 536 `1536px` cap, content spans full viewport width minus the §6m-cited
   * gutter (16px `<768`, 24px `≥768`, `p-4 md:p-6`). `'constrained'` (Table + Tabs ONLY):
   * keeps Task 536's `1536px` centered column exactly. See §6m + §8.1 for the override record.
   */
  width?: 'full' | 'constrained'
}

/**
 * Task 536 / §6m (docs/tailadmin-style-reference.md) — single-source TailAdmin showcase-page
 * shell for every `Mantine/Primitives/*` story. Replaces the bare `<Box p="xl">`/
 * `<Box px={{base:'md',sm:'xl'}} py="md">` wrapper every story previously used directly.
 *
 * `<640` (P0 mobile gate — byte-identical to the wrapper every story used BEFORE this task,
 * zero regression risk, unchanged by Task 540): page background transparent, no card chrome,
 * `px="md"` (16px) / `py="md"` (16px) gutter only — full-bleed edge-to-edge otherwise.
 *
 * `≥640`, `width="full"` (default — Task 540 owner override of §6m's 1536 cap, story-harness
 * layer ONLY, does not change any product surface): page background `gray.0` (`#f9fafb`,
 * zip-cited `--color-gray-50`), NO max-width cap — content spans full viewport width minus a
 * symmetric §6m-cited gutter (16px `<768` / 24px `≥768`, `p-4 md:p-6`), wrapped in white card
 * chrome — `1px solid` `gray.2` border (`#e4e7ec`), `2xl` radius (16px), no shadow — byte-
 * identical to the existing §6 Card/Paper token, nothing invented.
 *
 * The inner "white card chrome" Box's `px`/`bd` step at `md` (768px), NOT at `sm` (640px) —
 * deliberately offset from the outer Box's own `sm`→`md` gutter ladder above. `bg`/`bdrs`/`py`
 * stay keyed to `sm`, unchanged from before Task 809's remediation, because Revision 6 (owner
 * classification, 2026-09-11) narrowed the fix to load-bearing properties only: only `px`
 * (horizontal padding, both sides) and `bd` (a 1px border, both sides) consume the horizontal
 * width the grid's column math depends on; `bg`, `bdrs` and `py` cost zero horizontal width and
 * have no bearing on the defect below, so deferring them too (the 2026-09-11 remediation's first
 * pass) was an unnecessarily wide fix — correct in layer and method, but wider than the constraint
 * required. This file's own header comment is what the follow-up revision cites verbatim.
 *
 * Before the fix, both Boxes stepped at `sm` simultaneously: the outer Box's own `0 → 'md'` gutter
 * jump ALONE (32px combined, both sides) already exceeds the ~31px of slack `MantineListingCardTrack`'s
 * `.grid` (`repeat(auto-fill, minmax(280px, 1fr))`, `--listing-card-min` `globals.css:393`) has at a
 * 639px viewport, and the inner Box's own `md → 'xl'` padding bump plus its `1px` border landed on the
 * SAME 640px breakpoint, compounding to a measured 50px content-width loss (`gridContentBoxWidth`:
 * 607px at 639px viewport → 558px at 640px, live Playwright capture) — enough to drop
 * `Mantine/Primitives/FavoritesShell → Populated` from 2 columns to 1, then back to 2 once the
 * viewport regrew past the new, smaller deficit (measured 663-664px). A real regression, not a
 * hand-derived one: increasing viewport width must never decrease a grid's column count, and
 * stacking two independent Box components' padding steps on the identical breakpoint is what broke
 * that invariant. Deferring only `px`/`bd` to `md` leaves outer's own jump as the only width-bearing
 * change at 640px (32px combined vs. the track's ~31px slack — an exact, verified fit, see
 * `scripts/task809-favorites-parity-probe.mjs`'s `measureStorybookColumnMonotonicity`), and `px`/`bd`'s
 * own combined step now lands at 768px, where the track already has ~94px of slack before the next
 * column-count threshold — verified live, not assumed. `bg`/`bdrs`/`py` return to `sm` because none of
 * the three affects this math; keeping them deferred to `md` would have been an unreviewed cosmetic
 * change to every `Mantine/Primitives/*` story using `width="full"`, shifting the white-card moment
 * from 640px to 768px for no width-budget reason.
 *
 * `≥640`, `width="constrained"` (Table + Tabs ONLY, Task 540 exemption): Task 536's `1536px` centered
 * (`mx="auto"`) column — PLUS the same §6m outer edge gutter as `full` (Task 543 fix: constrained
 * previously had 0px edge below the 1536 cap, so Tabs/Table touched the screen edges at e.g. 773px).
 *
 * Overlay primitives (Drawer/Modal/Popover/DropdownMenu/NavigationMenu/Select/Tooltip): only the
 * TRIGGER sits inside this shell. The popup/sheet itself renders via a portal (Mantine's own
 * `Portal`/`FloatingPortal`) and is completely unaffected by this shell's `overflow`/`max-width` —
 * it is not a descendant of the capped column at the point it actually paints.
 */
export function MantineStoryShell({ children, width = 'full' }: MantineStoryShellProps) {
  const isConstrained = width === 'constrained'
  return (
    <Box bg={{ base: 'transparent', sm: 'gray.0' }} mih="100%">
      <Box
        maw={isConstrained ? { base: '100%', sm: 1536 } : undefined}
        mx={isConstrained ? 'auto' : undefined}
        // Task 543 (2026-07-04): the §6m outer gutter (16px `sm` / 24px `md`, `p-4 md:p-6`) applies in
        // BOTH modes. Previously `constrained` passed `undefined` here, so below the 1536 cap (e.g. 773px)
        // the Table + Tabs cards touched the screen edges at 0px while every `full` story had the gutter.
        // maw/mx stay constrained-only (cap + centering); `<640` base:0 full-bleed is unchanged.
        px={{ base: 0, sm: 'md', md: 'xl' }}
        py={{ base: 'md', sm: 'xl' }}
      >
        <Box
          bg={{ base: 'transparent', sm: 'white' }}
          bd={{ base: 'none', md: '1px solid var(--mantine-color-gray-2)' }}
          bdrs={{ base: 0, sm: '2xl' }}
          px={{ base: 'md', md: 'xl' }}
          py={{ base: 0, sm: 'xl' }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
