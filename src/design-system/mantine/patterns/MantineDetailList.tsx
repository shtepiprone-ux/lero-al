'use client'

import type { ReactNode } from 'react'
import { Paper, Stack, Text } from '@mantine/core'

export interface MantineDetailListItem {
  /** Task 859 R78: widened from `string` to `ReactNode` (adapters pass a translated node). */
  label: ReactNode
  value: ReactNode
}

export interface MantineDetailListProps {
  items: MantineDetailListItem[]
  /**
   * `panel` (default) is the tinted `Paper` of a dialog fact panel. `plain` has no panel: it is the same labelled
   * fields inside a record card (`MantineDataTableToCards`), where the card is the surface.
   */
  variant?: 'panel' | 'plain'
}

/**
 * The one owner of a labelled field (Task 859 R78, GR-3j `key-value-stack`, owner decision D4): every item is its
 * label on its own line and its complete value on the line(s) below, at every width, in both variants. The label is
 * 12px gray-500, the value 14px / 500 (TailAdmin `/profile`); label → value is `xs` (8px), field → field is `lg`
 * (20px, the measured TailAdmin field gap). A long value wraps and the field grows; a label never takes the value's
 * line, and nothing is clipped. Consumers pass `items` (and `variant`); they never lay a label and a value side by side.
 */
export function MantineDetailList({ items, variant = 'panel' }: MantineDetailListProps) {
  const fields = (
    <Stack gap="lg">
      {items.map((item, index) => (
        <Stack key={index} gap="xs">
          <Text component="div" size="xs" c="gray.5">{item.label}</Text>
          <Text component="div" size="sm" fw={500} miw={0}>{item.value}</Text>
        </Stack>
      ))}
    </Stack>
  )

  if (variant === 'plain') return fields

  return (
    <Paper bg="gray.0" radius="md" p="md">
      {fields}
    </Paper>
  )
}
