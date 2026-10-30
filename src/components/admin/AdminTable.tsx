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
  visibility?: 'always' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
  align?: 'left' | 'right' | 'center'
  /** Desktop-table column width (e.g. `theme.other.layout.tableTitleColumnWidth`; a percentage width is forbidden, §7.3 rule 6), forwarded unchanged to `TableColumn.width` (Task 857 R15). */
  width?: string | number
  /** `true` lets the cell content wrap (e.g. a clamped title) instead of the table's `nowrap`; forwarded to `TableColumn.wrap` (Task 857 R15). */
  wrap?: boolean
  /**
   * @deprecated Accepted only so the two consumers that still pass a width utility typecheck; NOT
   * forwarded (Task 877 §5 item 3). Use `width` / `wrap` instead.
   */
  className?: string
}

export type AdminTableCard = {
  title: ReactNode
  /** Muted text line under the title. Text only: badges go in `badges` (GR-3h). */
  subtitle?: ReactNode
  /** A row of badges (or text mixed with badges) under the title, one rhythm step of the card (Task 859 R69). */
  badges?: ReactNode
  /**
   * Labelled fields (Task 859 R80, GR-3j): each is its label with its complete value below it, forwarded to
   * `CardConfig.meta`. An empty value skips its field.
   */
  fields?: { label: ReactNode; value: ReactNode }[]
  /** Free text that is not a field (no label), shown below the fields. */
  meta?: ReactNode
  /** The card's actions: its last block. */
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
 * pattern — record cards below 768px (`md`, the pattern's own default: §7.3 rule 2, owner decision D36, Task 923 R47), the TailAdmin §6b
 * table from 768px. It has no breakpoint prop of its own. It keeps the legacy `AdminTable` props
 * (minus the sorting/hiding/loading/error ones no production consumer ever passed) so the five admin
 * managers that render it change with the pattern and need no edit.
 *
 * Without `cardRow` the card is synthesized: the sticky column is the title, the first two always-visible
 * columns the badges row (Task 859 R69), the rest labelled fields (label = the column `header`, value = the cell; R80). Column `className` is not forwarded; `width` and `wrap`
 * are (Task 857 R15), and omitted they leave today's output unchanged.
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
      // R69(d): the first two always-visible cells are objects (badges), so they are the card's badges row, not its subtitle.
      badges: subtitleCols.length > 0 ? (
        <Group gap="xs" wrap="wrap">
          {subtitleCols.map(c => <span key={c.key}>{c.cell(row)}</span>)}
        </Group>
      ) : undefined,
      fields: metaCols.length > 0 ? metaCols.map(c => ({ label: c.header, value: c.cell(row) })) : undefined,
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
    width: col.width,
    wrap: col.wrap,
    visibleFrom: visibleFrom(col.visibility),
    render: w => col.cell(w.row),
  }))

  const card: CardConfig<WrappedRow<Row>> = {
    title: w => <Text size="sm" fw={500} c="gray.7" component="div">{cardOf(w).title}</Text>,
    subtitle: w => cardOf(w).subtitle,
    badges: w => cardOf(w).badges,
    meta: w => cardOf(w).fields ?? [],
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
