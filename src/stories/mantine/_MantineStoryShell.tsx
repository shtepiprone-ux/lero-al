import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

export interface MantineStoryShellProps {
  children: ReactNode
}

/**
 * Task 536 / §6m (docs/tailadmin-style-reference.md) — single-source TailAdmin showcase-page
 * shell for every `Mantine/Primitives/*` story. Replaces the bare `<Box p="xl">`/
 * `<Box px={{base:'md',sm:'xl'}} py="md">` wrapper every story previously used directly.
 *
 * `<640` (P0 mobile gate — byte-identical to the wrapper every story used BEFORE this task,
 * zero regression risk): page background transparent, no card chrome, `px="md"` (16px) /
 * `py="md"` (16px) gutter only — full-bleed edge-to-edge otherwise.
 *
 * `≥640` (§6m, new): page background `gray.0` (`#f9fafb`, zip-cited `--color-gray-50`), content
 * capped to `1536px` (zip-cited `--breakpoint-2xl`) and centered (`mx="auto"`), primitive demo
 * wrapped in white card chrome — `1px solid` `gray.2` border (`#e4e7ec`), `2xl` radius (16px), no
 * shadow — byte-identical to the existing §6 Card/Paper token, nothing invented.
 *
 * Overlay primitives (Drawer/Modal/Popover/DropdownMenu/NavigationMenu/Select/Tooltip): only the
 * TRIGGER sits inside this shell. The popup/sheet itself renders via a portal (Mantine's own
 * `Portal`/`FloatingPortal`) and is completely unaffected by this shell's `overflow`/`max-width` —
 * it is not a descendant of the capped column at the point it actually paints.
 */
export function MantineStoryShell({ children }: MantineStoryShellProps) {
  return (
    <Box bg={{ base: 'transparent', sm: 'gray.0' }} mih="100%">
      <Box maw={{ base: '100%', sm: 1536 }} mx="auto" py={{ base: 'md', sm: 'xl' }}>
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
