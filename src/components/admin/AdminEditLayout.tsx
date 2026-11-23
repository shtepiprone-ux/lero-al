'use client'

import type { ReactNode } from 'react'
import { Flex, Stack, useMantineTheme } from '@mantine/core'

/**
 * Reusable two-column admin edit-screen pattern (Task 957 Revision 2, R2-1: on Mantine; the geometry is the legacy Tailwind one, `git show HEAD:src/components/admin/AdminEditLayout.tsx`).
 * Main content on the left (fills the row), sticky sidebar on the right (fixed width); one column below `lg` (1024px). The sidebar is 288px from `lg` and 320px from `xl` (1280px) and
 * sticks 80px from the top from `lg`; the gap between the columns is `xl` (24px, legacy `gap-6`), the one inside each column `xl` for the main column and `md` (16px, legacy `gap-4`) for the sidebar.
 * The three sizes are `theme.other.layout.editLayoutSidebarWidth`, `editLayoutSidebarWidthWide` and `editLayoutSidebarStickyTop`.
 */
interface Props {
  main: ReactNode
  sidebar: ReactNode
}

export function AdminEditLayout({ main, sidebar }: Props) {
  const layout = useMantineTheme().other.layout

  return (
    <Flex direction={{ base: 'column', lg: 'row' }} gap="xl" align="flex-start">
      <Stack gap="xl" flex={1} miw={0} w={{ base: '100%', lg: 'auto' }}>{main}</Stack>
      <Stack
        gap="md"
        flex="none"
        w={{ base: '100%', lg: layout.editLayoutSidebarWidth, xl: layout.editLayoutSidebarWidthWide }}
        pos={{ base: 'static', lg: 'sticky' }}
        top={{ lg: layout.editLayoutSidebarStickyTop }}
      >
        {sidebar}
      </Stack>
    </Flex>
  )
}
