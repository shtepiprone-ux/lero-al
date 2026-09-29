'use client'

import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { MantineDashboardHeader } from '@/design-system/mantine/patterns/MantineDashboardHeader'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

/**
 * Shared admin page header (Task 877, D78-8): a thin adapter over the canonical
 * `MantineDashboardHeader` (title `h4`/24px from `sm`, `gray.5` subtitle, `actions` slot). The props
 * are the legacy ones, so every admin page that renders it changes with the pattern and needs no edit.
 */
export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <Box mb="xl">
      <MantineDashboardHeader title={title} subtitle={subtitle} actions={action} />
    </Box>
  )
}
