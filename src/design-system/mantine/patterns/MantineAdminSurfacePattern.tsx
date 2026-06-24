'use client'

import { Stack, Group, TextInput, Button, Badge, Text, Paper, ActionIcon, Pagination } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { MantineDataTableToCards, type TableColumn, type TableRow } from './MantineDataTableToCards'

export interface AdminFilter {
  key: string
  label: string
  options?: string[]
}

export interface MantineAdminSurfacePatternProps {
  title: string
  searchPlaceholder: string
  addLabel: string
  columns: TableColumn[]
  rows: TableRow[]
  totalPages?: number
  currentPage?: number
  onSearch?: (query: string) => void
  onAdd?: () => void
  onPageChange?: (page: number) => void
  searchValue?: string
}

/**
 * Canonical admin surface pattern — search + table/cards + pagination.
 *
 * Mobile (<sm / 640px):
 *   - Search input is full-width.
 *   - Add button is full-width below search.
 *   - Table renders as stacked cards (via MantineDataTableToCards).
 *   - Pagination: compact, full-width.
 *
 * Desktop (sm+):
 *   - Search + add button in a row.
 *   - Full Table with column headers.
 *   - Pagination at the right.
 *
 * Responsive API:
 *   - Group direction="column" at base, "row" at sm+ for the toolbar.
 *   - MantineDataTableToCards handles table→cards flip.
 *
 * Migration target: AdminListingsTable, AdminUsersTable, AdminReportsManager (Phase 4).
 */
export function MantineAdminSurfacePattern({
  title,
  searchPlaceholder,
  addLabel,
  columns,
  rows,
  totalPages = 1,
  currentPage = 1,
  onSearch,
  onAdd,
  onPageChange,
  searchValue = '',
}: MantineAdminSurfacePatternProps) {
  const isMobile = useMediaQuery('(max-width: 40em)')

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" gap="xs">
        <Text fw={700} size="lg">
          {title}
        </Text>
        <Badge color="gray" variant="light" size="lg">
          {rows.length}
        </Badge>
      </Group>

      <Group
        gap="sm"
        align="flex-end"
        style={{ flexDirection: 'column' }}
        styles={{ root: { '@media (min-width: 40em)': { flexDirection: 'row' } } }}
      >
        <TextInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearch?.(e.currentTarget.value)}
          style={{ flex: 1, width: '100%' }}
          rightSection={
            <ActionIcon variant="subtle" color="gray" size="sm" aria-label={searchPlaceholder}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </ActionIcon>
          }
        />
        <Button
          color="brand"
          onClick={onAdd}
          fullWidth={isMobile}
          styles={{ root: { '@media (min-width: 40em)': { width: 'auto' } } }}
        >
          {addLabel}
        </Button>
      </Group>

      <Paper shadow="xs" radius="md" withBorder style={{ overflow: 'hidden' }}>
        <MantineDataTableToCards columns={columns} rows={rows} />
      </Paper>

      {totalPages > 1 && (
        <Group justify={isMobile ? 'center' : 'flex-end'}>
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={onPageChange}
            color="brand"
            size={isMobile ? 'sm' : 'md'}
          />
        </Group>
      )}
    </Stack>
  )
}
