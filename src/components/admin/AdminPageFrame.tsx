import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'

// Server-safe: the width tokens are read straight from the theme object (same precedent as the admin
// `page.tsx` files); `!` because `createTheme()`'s return type is deep-partial.
const layout = theme.other!.layout!

export type AdminPageFrameWidth = 'page' | 'shell' | 'narrow' | 'panel' | 'form'

const MAX_WIDTH: Record<AdminPageFrameWidth, string | undefined> = {
  page: layout.adminPageMaxWidth,
  shell: layout.adminPageShellMaxWidth,
  narrow: layout.adminPageNarrowMaxWidth,
  panel: layout.adminPagePanelMaxWidth,
  form: layout.adminPageFormMaxWidth,
}

export interface AdminPageFrameProps {
  /** Which `theme.other.layout.adminPage*MaxWidth` caps the page. */
  width: AdminPageFrameWidth
  /** `responsive` (default) = `xl`, then `2xl` from `lg`; `xl` = a fixed `xl` gutter. */
  gutter?: 'responsive' | 'xl'
  /** `true` (default) centres the frame (`mx="auto"`). */
  centered?: boolean
  children: ReactNode
}

/**
 * The page wrapper every `/admin/*` route renders inside `AdminShell` (Task 857 R23): the gutter and the
 * width cap the ten routes used to hand-write as a `Box`. Admin page View Stories render inside the same
 * frame (GR-3b, `docs/mantine-responsive-design-system.md` §7.3).
 */
export function AdminPageFrame({ width, gutter = 'responsive', centered = true, children }: AdminPageFrameProps) {
  return (
    <Box
      p={gutter === 'xl' ? 'xl' : { base: 'xl', lg: '2xl' }}
      maw={MAX_WIDTH[width]}
      mx={centered ? 'auto' : undefined}
    >
      {children}
    </Box>
  )
}
