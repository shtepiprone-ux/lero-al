/**
 * MantineDataTableToCards — table header top line (Task 857 R69/R70, D78-11, GR-3g).
 *
 * The `thead` top line is drawn only when `tableHeader` sits above the header row. Flush with the card's
 * top edge, the card's own rounded border is the line: a second straight line would double it and be cut
 * by the card's rounded clip (`border-collapse` ignores a radius). The bottom line is always drawn.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineDataTableToCards, type TableColumn, type TableRow } from '../MantineDataTableToCards'

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

const COLUMNS: TableColumn<TableRow>[] = [{ key: 'name', label: 'Name' }]
const ROWS: TableRow[] = [{ id: '1', name: 'Row one' }]

function renderTable(tableHeader?: React.ReactNode) {
  const view = render(
    <MantineProvider theme={theme}>
      <MantineDataTableToCards columns={COLUMNS} rows={ROWS} tableHeader={tableHeader} />
    </MantineProvider>,
  )
  const thead = view.container.querySelector('thead')
  if (!thead) throw new Error('thead not rendered')
  return thead as HTMLElement
}

describe('MantineDataTableToCards thead top line (Task 857 R69)', () => {
  it('without tableHeader the thead has no top line and keeps its bottom line', () => {
    const thead = renderTable()
    expect(thead.style.borderTop).toBe('')
    expect(thead.style.borderBottom).toBe('1px solid var(--mantine-color-gray-1)')
  })

  it('with tableHeader the thead keeps the TailAdmin §6b top line and its bottom line', () => {
    const thead = renderTable(<span>Header block</span>)
    expect(thead.style.borderTop).toBe('1px solid var(--mantine-color-gray-1)')
    expect(thead.style.borderBottom).toBe('1px solid var(--mantine-color-gray-1)')
  })
})

describe('MantineDataTableToCards sticky header cell (Task 857 R73/R74, D78-12)', () => {
  it('the sticky column header cell is white like the rest (body token)', () => {
    const view = render(
      <MantineProvider theme={theme}>
        <MantineDataTableToCards columns={COLUMNS} rows={ROWS} stickyColumnIndex={0} />
      </MantineProvider>,
    )
    const th = view.container.querySelector('thead th') as HTMLElement
    expect(th.style.background).toBe('var(--mantine-color-body)')
  })

  it('the component sets no thead background of its own (the project theme Table entry is a separate source)', () => {
    // Rendered with the project theme minus its `Table` entry: that entry also sets `thead.backgroundColor` (§6b,
    // gray-0, out of scope for Revision 12), so only this render isolates what the component itself contributes.
    const view = render(
      <MantineProvider theme={{ ...theme, components: { ...theme.components, Table: {} } }}>
        <MantineDataTableToCards columns={COLUMNS} rows={ROWS} stickyColumnIndex={0} />
      </MantineProvider>,
    )
    const thead = view.container.querySelector('thead') as HTMLElement
    expect(thead.style.backgroundColor).toBe('')
  })
})
