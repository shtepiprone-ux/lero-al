'use client'

import { Stack, Group, Flex, TextInput, Button, Badge, Text, ActionIcon, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { MantineDataTableToCards, type TableColumn, type TableRow, type CardConfig } from './MantineDataTableToCards'
import { MantinePagination } from './MantinePagination'

export interface AdminFilter {
  key: string
  label: string
  options?: string[]
}

export interface MantineAdminSurfacePatternProps<R extends { id: string } = TableRow> {
  title: string
  searchPlaceholder: string
  addLabel: string
  columns: TableColumn<R>[]
  rows: R[]
  totalPages?: number
  currentPage?: number
  onSearch?: (query: string) => void
  onAdd?: () => void
  onPageChange?: (page: number) => void
  searchValue?: string
  /** Per-row CSS class (forwarded to MantineDataTableToCards, e.g. 'opacity-50' for loading). */
  rowClassName?: (row: R) => string
  /** Structured card config for mobile — forwarded to MantineDataTableToCards.
   *  When provided, mobile renders the designed CardConfig hierarchy instead of generic label:value. */
  card?: CardConfig<R>
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
 * Extension (Task 483): generic over row type R and accepts `rowClassName`
 * for per-row loading/state styling. Forwards both to MantineDataTableToCards.
 *
 * Migration target: AdminListingsTable, AdminUsersTable, AdminReportsManager (Phase 4).
 */
export function MantineAdminSurfacePattern<R extends { id: string } = TableRow>({
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
  rowClassName,
  card,
}: MantineAdminSurfacePatternProps<R>) {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.other.mobileGate})`)

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

      {/* Task 785 (sites 1-2): the `styles={{root:{'@media...'}}}` blocks below never emitted CSS
          (docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md) —
          replaced with Flex's native `direction` responsive prop and Button's native `w` responsive
          prop, both gated at `sm` (theme.breakpoints.sm === theme.other.mobileGate, byte-identical).
          The Add button's mechanism is now `w` alone — the old `fullWidth={isMobile}` JS mechanism
          is removed so only one mechanism drives this button's width (task instruction: do not
          stack a working JS mechanism with the CSS one it was meant to complement). */}
      <Flex
        gap="sm"
        align="flex-end"
        wrap="wrap"
        direction={{ base: 'column', sm: 'row' }}
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
          w={{ base: '100%', sm: 'auto' }}
        >
          {addLabel}
        </Button>
      </Flex>

      <MantineDataTableToCards columns={columns} rows={rows} rowClassName={rowClassName} card={card} />

      {totalPages > 1 && (
        <Group justify={isMobile ? 'center' : 'flex-end'}>
          <MantinePagination
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
