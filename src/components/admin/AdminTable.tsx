'use client'

import { type ReactNode } from 'react'
import { Group, Text, type MantineBreakpoint } from '@mantine/core'
import {
  MantineDataTableToCards,
  type CardConfig,
  type TableColumn,
} from '@/design-system/mantine/patterns/MantineDataTableToCards'

export type AdminTableColumn<Row> = {
  key: string
  /** Column label rendered in the header. Pass a string; ReactNode is accepted for advanced cases. */
  header: ReactNode
  cell: (row: Row) => ReactNode
  /** Desktop-table breakpoint from which the column is shown; `'always'` (default) shows it everywhere. */
  visibility?: 'always' | 'sm' | 'md' | 'lg' | 'xl'
  align?: 'left' | 'right' | 'center'
  /**
   * @deprecated Accepted only so the two consumers that still pass a width utility typecheck; NOT
   * forwarded (Task 877 §5 item 3). Widths belong to `TableColumn.width` in each manager's migration.
   */
  className?: string
}

export type AdminTableCard = {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  trailing?: ReactNode
}

type AdminTableProps<Row> = {
  rows: Row[]
  columns: AdminTableColumn<Row>[]
  rowKey: (row: Row) => string
  onRowClick?: (row: Row) => void
  rowClassName?: (row: Row) => string
  stickyColumnIndex?: number
  cardRow?: (row: Row) => AdminTableCard
  emptyState: ReactNode
  ariaLabel?: string
}

// `MantineDataTableToCards` needs a string `id`; the original row is kept for every callback.
interface WrappedRow<Row> {
  id: string
  row: Row
}

function visibleFrom(visibility: AdminTableColumn<unknown>['visibility']): MantineBreakpoint | undefined {
  return visibility && visibility !== 'always' ? visibility : undefined
}

/**
 * Shared admin data list (Task 877, D78-8): a thin adapter over the canonical `MantineDataTableToCards`
 * pattern — cards below 640px, the TailAdmin §6b table above. It keeps the legacy `AdminTable` props
 * (minus the sorting/hiding/loading/error ones no production consumer ever passed) so the five admin
 * managers that render it change with the pattern and need no edit.
 *
 * Without `cardRow` the card is synthesized: the sticky column is the title, the first two always-visible
 * columns the subtitle, the rest the detail row. Column `className` is not forwarded (widths belong to
 * `TableColumn.width` in each manager's own migration).
 */
export function AdminTable<Row>({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowClassName,
  stickyColumnIndex = 0,
  cardRow,
  emptyState,
  ariaLabel,
}: AdminTableProps<Row>) {
  function synthesizeCard(row: Row): AdminTableCard {
    const stickyCol = columns[stickyColumnIndex]
    const otherAlways = columns.filter(
      (c, i) => i !== stickyColumnIndex && (c.visibility ?? 'always') === 'always',
    )
    const mdVisible = columns.filter(c => c.visibility === 'sm' || c.visibility === 'md')
    const subtitleCols = otherAlways.slice(0, 2)
    const metaCols = [...otherAlways.slice(2), ...mdVisible]
    return {
      title: stickyCol ? stickyCol.cell(row) : null,
      subtitle: subtitleCols.length > 0 ? (
        <Group component="span" gap="xs" wrap="wrap">
          {subtitleCols.map(c => <span key={c.key}>{c.cell(row)}</span>)}
        </Group>
      ) : undefined,
      meta: metaCols.length > 0 ? (
        <Group gap="xs" wrap="wrap">
          {metaCols.map(c => <span key={c.key}>{c.cell(row)}</span>)}
        </Group>
      ) : undefined,
    }
  }

  const resolveCard = cardRow ?? synthesizeCard

  const wrappedRows: WrappedRow<Row>[] = rows.map(row => ({ id: rowKey(row), row }))

  // Review 1 §16.2 item 4 (P3): each row's card (`cardRow` or the synthesized one, with every cell
  // renderer) is computed once per render; the four `CardConfig` callbacks below read this map.
  const cards = new Map<string, AdminTableCard>(wrappedRows.map(w => [w.id, resolveCard(w.row)]))
  const cardOf = (w: WrappedRow<Row>): AdminTableCard => cards.get(w.id) ?? resolveCard(w.row)

  const tableColumns: TableColumn<WrappedRow<Row>>[] = columns.map(col => ({
    key: col.key,
    label: col.header,
    align: col.align,
    visibleFrom: visibleFrom(col.visibility),
    render: w => col.cell(w.row),
  }))

  const card: CardConfig<WrappedRow<Row>> = {
    title: w => <Text size="sm" fw={500} c="gray.7" component="div">{cardOf(w).title}</Text>,
    subtitle: w => cardOf(w).subtitle,
    detail: w => cardOf(w).meta,
    actions: w => cardOf(w).trailing,
  }

  return (
    <div data-testid="admin-table">
      <MantineDataTableToCards<WrappedRow<Row>>
        columns={tableColumns}
        rows={wrappedRows}
        emptyLabel={emptyState}
        rowClassName={rowClassName ? w => rowClassName(w.row) : undefined}
        card={card}
        onRowClick={onRowClick ? w => onRowClick(w.row) : undefined}
        stickyColumnIndex={stickyColumnIndex}
        ariaLabel={ariaLabel}
      />
    </div>
  )
}
