'use client'

import type { ReactNode } from 'react'
import { Alert, Box, Stack } from '@mantine/core'
import { Info } from 'lucide-react'
import { MantineDashboardHeader } from '@/design-system/mantine/patterns/MantineDashboardHeader'
import { theme } from '@/design-system/mantine/theme'

// Client component reading the token from the theme object, as `AdminPageFrame` does; `!` because `createTheme()`'s return type is deep-partial.
const iconSize = theme.other!.iconSize!

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
  /** Page-level info message under the header (Task 923 R139): the theme's info `Alert`, full width, on the header's `md` rhythm. */
  notice?: string
}

/**
 * Shared admin page header (Task 877, D78-8): a thin adapter over the canonical
 * `MantineDashboardHeader` (title `h4`/24px from `sm`, `gray.5` subtitle, `actions` slot). The props
 * are the legacy ones, so every admin page that renders it changes with the pattern and needs no edit.
 */
export function AdminPageHeader({ title, subtitle, action, notice }: Props) {
  return (
    <Box mb="xl">
      <Stack gap="md">
        <MantineDashboardHeader title={title} subtitle={subtitle} actions={action} />
        {notice && (
          <Alert color="blueLight" icon={<Info size={iconSize.standard} />}>
            {notice}
          </Alert>
        )}
      </Stack>
    </Box>
  )
}
