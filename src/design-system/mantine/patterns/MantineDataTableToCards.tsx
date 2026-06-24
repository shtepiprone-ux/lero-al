'use client'

import { Table, Card, Stack, Group, Text, Badge } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

export interface TableColumn {
  key: string
  label: string
  isBadge?: boolean
  badgeColor?: string
}

export interface TableRow {
  id: string
  [key: string]: string | number | undefined
}

export interface MantineDataTableToCardsProps {
  columns: TableColumn[]
  rows: TableRow[]
  emptyLabel?: string
}

/**
 * Canonical data table → card list responsive pattern.
 *
 * Mobile (<sm / 640px): renders as stacked Cards (one per row).
 *   Each card shows all columns in a label: value layout.
 * Desktop (sm+): renders as a full Table with thead/tbody.
 *
 * Responsive API: useMediaQuery('(max-width: 40em)') — Mantine hook.
 * Touch targets: Cards are touch-friendly (full-width tap areas).
 */
export function MantineDataTableToCards({
  columns,
  rows,
  emptyLabel = '—',
}: MantineDataTableToCardsProps) {
  const isMobile = useMediaQuery('(max-width: 40em)')

  if (rows.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {emptyLabel}
      </Text>
    )
  }

  if (isMobile) {
    return (
      <Stack gap="sm">
        {rows.map((row) => (
          <Card key={row.id} withBorder shadow="xs" padding="sm" radius="md">
            {columns.map((col) => {
              const value = row[col.key]
              return (
                <Group key={col.key} justify="space-between" py={4} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', minHeight: '2.75rem' }}>
                  <Text size="xs" c="dimmed" fw={500}>
                    {col.label}
                  </Text>
                  {col.isBadge ? (
                    <Badge color={col.badgeColor ?? 'gray'} variant="light" size="sm">
                      {value ?? '—'}
                    </Badge>
                  ) : (
                    <Text size="sm">{value ?? '—'}</Text>
                  )}
                </Group>
              )
            })}
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <Table highlightOnHover withTableBorder withColumnBorders={false}>
      <Table.Thead>
        <Table.Tr>
          {columns.map((col) => (
            <Table.Th key={col.key}>
              <Text size="xs" tt="uppercase" fw={600} c="dimmed">
                {col.label}
              </Text>
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.id}>
            {columns.map((col) => {
              const value = row[col.key]
              return (
                <Table.Td key={col.key}>
                  {col.isBadge ? (
                    <Badge color={col.badgeColor ?? 'gray'} variant="light" size="sm">
                      {value ?? '—'}
                    </Badge>
                  ) : (
                    <Text size="sm">{value ?? '—'}</Text>
                  )}
                </Table.Td>
              )
            })}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
