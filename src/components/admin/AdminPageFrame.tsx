import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

export interface AdminPageFrameProps {
  children: ReactNode
}

/**
 * The page wrapper every `/admin/*` route renders inside `AdminShell` (Task 857 R23), but the listing preview. Owner decision O1007-2 (2026-11-24): "All pages in the admin
 * must have the canonical width ... The width must be the full screen", so the frame caps nothing and takes no prop: the whole width the shell leaves, with the breakpoint
 * gutter `xl` (24px), `2xl` (32px) from `lg` (1024px). Admin page View Stories render inside the same frame (GR-3b, `docs/mantine-responsive-design-system.md` §7.3).
 */
export function AdminPageFrame({ children }: AdminPageFrameProps) {
  return <Box p={{ base: 'xl', lg: '2xl' }}>{children}</Box>
}
