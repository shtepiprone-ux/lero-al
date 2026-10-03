'use client'

import type { ReactNode } from 'react'
import { Group, Paper, Stack, Text } from '@mantine/core'

export interface MantineDetailListItem {
  label: string
  value: ReactNode
}

export interface MantineDetailListProps {
  items: MantineDetailListItem[]
}

/**
 * Facts panel of a dialog (Task 857 R46, §23.7 "Facts"): a tinted panel with one row per fact, the label on the
 * left (14px dimmed) and the value on the right (14px / 500). A long value wraps under its own column and never
 * pushes the row wider than the panel. The row rhythm follows the label-left / value-right meta rows of
 * `MantineDataTableToCards`; this is the panel those rows lack.
 */
export function MantineDetailList({ items }: MantineDetailListProps) {
  return (
    <Paper bg="gray.0" radius="md" p="md">
      <Stack gap="sm">
        {items.map(item => (
          <Group key={item.label} justify="space-between" align="flex-start" wrap="nowrap" gap="md">
            <Text fz="sm" c="dimmed">{item.label}</Text>
            <Text component="div" fz="sm" fw={500} ta="right" miw={0}>{item.value}</Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  )
}
