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
 * `≥640`, `width="constrained"` (Table + Tabs ONLY, Task 540 exemption): Task 536's original
 * `1536px` centered (`mx="auto"`) column, unchanged.
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
        px={isConstrained ? undefined : { base: 0, sm: 'md', md: 'xl' }}
        py={{ base: 'md', sm: 'xl' }}
      >
        <Box
          bg={{ base: 'transparent', sm: 'white' }}
          bd={{ base: 'none', sm: '1px solid var(--mantine-color-gray-2)' }}
          bdrs={{ base: 0, sm: '2xl' }}
          px={{ base: 'md', sm: 'xl' }}
          py={{ base: 0, sm: 'xl' }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
