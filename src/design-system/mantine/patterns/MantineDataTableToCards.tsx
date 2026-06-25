'use client'

import { type ReactNode } from 'react'
import { Table, Card, Stack, Group, Box, Text, Badge, Divider, Paper, ScrollArea } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

/**
 * Structured card layout config for mobile admin surfaces.
 *
 * When provided as `card` prop, mobile renders the designed card hierarchy:
 *   - Header: id (muted xs, left) | actions (right, ≥44px targets)
 *   - Divider
 *   - Primary row: avatar + title (medium fw=500) + subtitle (dimmed) | badge (top-aligned)
 *   - Divider (ONE, above meta — no per-field dividers)
 *   - Meta: edge-anchored `Group justify="space-between"` rows (label left / value right)
 *
 * When absent, falls back to the generic 38%/62% aligned label:value layout (backward-compatible).
 * Null returns from value functions are skipped (row not rendered).
 */
export interface CardConfig<R> {
  /** Header left — row identifier (e.g. "#101"). */
  id?: (row: R) => ReactNode
  /** Header right — action buttons (verify/revoke, detail). Must have ≥44px touch targets. */
  actions?: (row: R) => ReactNode
  /** Primary row left — entity avatar or icon. */
  avatar?: (row: R) => ReactNode
  /** Primary row — main name or title. */
  title: (row: R) => ReactNode
  /** Primary row under title — muted secondary line (company, email). */
  subtitle?: (row: R) => ReactNode
  /** Primary row right — status badge, top-aligned. */
  badge?: (row: R) => ReactNode
  /** Compact meta rows below ONE divider. Null/undefined returns are skipped. */
  meta?: { label: string; value: (row: R) => ReactNode }[]
}

export interface TableColumn<R = TableRow> {
  key: string
  label: string
  isBadge?: boolean
  badgeColor?: string
  /** Horizontal alignment for this column's header and cells. */
  align?: 'left' | 'center' | 'right'
  /** Width for the desktop table column (e.g. '20%', 120). */
  width?: string | number
  /** Rich cell renderer — takes precedence over key-based value lookup when provided. */
  render?: (row: R) => ReactNode
}

export interface TableRow {
  id: string
  [key: string]: string | number | undefined
}

export interface MantineDataTableToCardsProps<R extends { id: string } = TableRow> {
  columns: TableColumn<R>[]
  rows: R[]
  emptyLabel?: string
  /** Per-row CSS class (e.g. 'opacity-50' for per-row loading state). */
  rowClassName?: (row: R) => string
  /** Structured card config for mobile.
   *  When provided, mobile renders the designed admin card anatomy.
   *  When absent, the generic aligned label:value layout is used (simple consumers).
   *  Backward-compatible: omitting this prop keeps the existing layout. */
  card?: CardConfig<R>
  /** Optional header slot rendered above the table inside the card (title + actions). */
  tableHeader?: ReactNode
}

/**
 * Canonical data table → card list responsive pattern.
 *
 * Mobile (<sm / 640px): stacked Cards.
 *   With `card` prop: designed hierarchy (header / primary / meta) per CardConfig.
 *   Without `card` prop: generic aligned label:value rows (38%/62% rhythm).
 *   All spacing via theme tokens — no raw px.
 *   Touch target: mih="2.75rem" on generic rows (rem — touch-target exemption).
 *
 * Desktop (sm+): TailAdmin CRM card-wrapped Table (§6b).
 *   Paper(radius 2xl, gray-2 border, overflow hidden) > ScrollArea > Table.
 *   verticalSpacing/horizontalSpacing from theme (sm=12px / xl=24px per §6b).
 *   Thead: bg-gray-50 + border-y gray-100. Th: 12px fw=500 gray-500, NOT uppercase.
 *   Td: 14px gray-700, whitespace-nowrap. Row dividers gray-100, hover gray-50.
 *
 * Responsive API: useMediaQuery('(max-width: 40em)').
 * SSR caveat: returns false on first render; admin pages are auth-gated, no visible flash.
 *
 * Spacing rule (§7.1): ALL spacing uses theme tokens. Raw px forbidden (touch-target rem exempt).
 * Card anatomy rule (§7.2): CardConfig is the ONLY canonical admin card design.
 */
export function MantineDataTableToCards<R extends { id: string } = TableRow>({
  columns,
  rows,
  emptyLabel = '—',
  rowClassName,
  card,
  tableHeader,
}: MantineDataTableToCardsProps<R>) {
  const isMobile = useMediaQuery('(max-width: 40em)')

  if (rows.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {emptyLabel}
      </Text>
    )
  }

  function renderCell(col: TableColumn<R>, row: R): ReactNode {
    if (col.render) return col.render(row)
    const value = (row as TableRow)[col.key]
    if (col.isBadge) {
      return (
        <Badge color={col.badgeColor ?? 'gray'} variant="light" size="sm">
          {value ?? '—'}
        </Badge>
      )
    }
    return <Text size="sm" c="gray.7">{value ?? '—'}</Text>
  }

  function renderDesignedCard(row: R): ReactNode {
    const cfg = card!
    const hasHeader = !!(cfg.id || cfg.actions)
    const subtitleContent = cfg.subtitle?.(row)
    const badgeContent = cfg.badge?.(row)

    return (
      <Card
        key={row.id}
        withBorder
        radius="2xl"
        padding="lg"
        className={rowClassName?.(row)}
      >
        <Stack gap="sm">
          {/* HEADER: id → left edge ↔ actions → right edge */}
          {hasHeader && (
            <Group justify="space-between" wrap="nowrap" align="center">
              <Text size="xs" c="gray.5">{cfg.id?.(row)}</Text>
              <Group gap="xs" wrap="nowrap">{cfg.actions?.(row)}</Group>
            </Group>
          )}
          {hasHeader && <Divider color="gray.1" />}

          {/* PRIMARY: avatar+title+subtitle → left ↔ status badge → right (top-aligned) */}
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              {cfg.avatar?.(row)}
              <Stack gap={2} style={{ minWidth: 0 }}>
                {cfg.title(row)}
                {subtitleContent != null && (
                  <Text size="xs" c="gray.5" truncate="end">{subtitleContent}</Text>
                )}
              </Stack>
            </Group>
            {badgeContent != null && (
              <div style={{ flexShrink: 0 }}>{badgeContent}</div>
            )}
          </Group>

          {/* META: ONE divider above; each row label → left edge ↔ value → right edge */}
          {cfg.meta && cfg.meta.length > 0 && (
            <>
              <Divider color="gray.1" />
              <Stack gap="xs">
                {cfg.meta.map((m) => {
                  const val = m.value(row)
                  if (val == null) return null
                  return (
                    <Group key={m.label} justify="space-between" wrap="nowrap" align="center" gap="md">
                      <Text size="xs" c="gray.5" style={{ flexShrink: 0 }}>{m.label}</Text>
                      <div style={{ textAlign: 'right', minWidth: 0 }}>{val}</div>
                    </Group>
                  )
                })}
              </Stack>
            </>
          )}
        </Stack>
      </Card>
    )
  }

  if (isMobile) {
    return (
      <Stack gap="sm">
        {rows.map((row) =>
          card
            ? renderDesignedCard(row)
            : (
              <Card
                key={row.id}
                withBorder
                className={rowClassName?.(row)}
              >
                {columns.map((col, idx) => (
                  <Group
                    key={col.key}
                    gap="sm"
                    wrap="nowrap"
                    align="center"
                    py="xs"
                    mih="2.75rem"
                    style={
                      idx < columns.length - 1
                        ? { borderBottom: '1px solid var(--mantine-color-gray-2)' }
                        : undefined
                    }
                  >
                    <Text size="xs" c="dimmed" fw={500} style={{ width: '38%', flexShrink: 0 }}>
                      {col.label}
                    </Text>
                    <Box
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          col.align === 'left'
                            ? 'flex-start'
                            : col.align === 'center'
                              ? 'center'
                              : 'flex-end',
                      }}
                    >
                      {renderCell(col, row)}
                    </Box>
                  </Group>
                ))}
              </Card>
            )
        )}
      </Stack>
    )
  }

  // Desktop: TailAdmin CRM card-wrapped table (§6b).
  // Paper provides rounded-2xl card with gray-2 border; Table fills it edge-to-edge
  // so thead border-y spans the full card width. Cell padding (xl×sm = 24×12) provides visual inset.
  return (
    <Paper
      withBorder
      style={{
        overflow: 'hidden',
        '--mantine-color-default-border': 'var(--mantine-color-gray-2)',
      } as React.CSSProperties}
    >
      {tableHeader && (
        <Box px="xl" py="lg">
          {tableHeader}
        </Box>
      )}
      <ScrollArea>
        <Table
          withRowBorders
          withColumnBorders={false}
          styles={{
            thead: {
              backgroundColor: 'var(--mantine-color-gray-0)',
              borderTop: '1px solid var(--mantine-color-gray-1)',
              borderBottom: '1px solid var(--mantine-color-gray-1)',
            },
            td: { whiteSpace: 'nowrap' },
            th: { whiteSpace: 'nowrap' },
            table: { '--table-border-color': 'var(--mantine-color-gray-1)' } as React.CSSProperties,
          }}
        >
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                >
                  <Text size="xs" fw={500} c="gray.5">
                    {col.label}
                  </Text>
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id} className={rowClassName?.(row)}>
                {columns.map((col) => (
                  <Table.Td
                    key={col.key}
                    style={{ textAlign: col.align ?? 'left' }}
                  >
                    {renderCell(col, row)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  )
}
