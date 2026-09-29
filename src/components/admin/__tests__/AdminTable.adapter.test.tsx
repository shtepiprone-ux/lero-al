/**
 * AdminTable adapter — RTL test (Task 877, T2)
 *
 * Renders the REAL `AdminTable` adapter over the REAL `MantineDataTableToCards` (real Mantine provider) and
 * asserts on observable behavior:
 *   1. Enter (and Space) on a focused row calls `onRowClick` with the original row.
 *   2. Enter on a focused inner `button` inside a clickable row does NOT call `onRowClick` (review 1 §16.3).
 *   3. `visibility: 'md'` renders the column's cells with Mantine's `visibleFrom="md"`; `'always'` does not.
 *   4. With no `cardRow`, the synthesized card shows the column-0 cell as its title (cards below 640px).
 *   5. A card whose `cardRow` returns `trailing` shows it and NO automatic chevron; a card without `trailing`
 *      shows exactly one automatic chevron (review 1 §16.2 item 2, the legacy `trailing ?? chevron` rule).
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task877/):
 *   P1 — remove the Enter/Space handler in `MantineDataTableToCards` → case 1 fails.
 *   P2 — map `visibility` to nothing in `AdminTable` → case 3 fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { AdminTable, type AdminTableColumn } from '../AdminTable'

interface Row {
  id: number
  name: string
  city: string
  tag: string
}

const ROWS: Row[] = [
  { id: 1, name: 'Alpha', city: 'Tirana', tag: 'x' },
  { id: 2, name: 'Bravo', city: 'Durres', tag: 'y' },
]

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  stubMatchMedia(false)
})

const columns: AdminTableColumn<Row>[] = [
  { key: 'name', header: 'Name', cell: r => <span>{r.name}</span> },
  { key: 'city', header: 'City', cell: r => <button type="button">{`inner-${r.city}`}</button> },
  { key: 'tag', header: 'Tag', visibility: 'md', cell: r => <span>{`tag-${r.tag}`}</span> },
]

function renderTable(props: Partial<React.ComponentProps<typeof AdminTable<Row>>> = {}) {
  return render(
    <MantineProvider theme={theme} env="test">
      <AdminTable<Row>
        rows={ROWS}
        columns={columns}
        rowKey={r => String(r.id)}
        emptyState="empty"
        {...props}
      />
    </MantineProvider>,
  )
}

describe('AdminTable adapter (T2)', () => {
  it('case 1 — Enter and Space on a focused row call onRowClick with the original row', () => {
    const onRowClick = vi.fn()
    renderTable({ onRowClick })

    const row = screen.getByText('Alpha').closest('tr') as HTMLElement
    row.focus()
    fireEvent.keyDown(row, { key: 'Enter' })
    fireEvent.keyDown(row, { key: ' ' })

    expect(onRowClick).toHaveBeenCalledTimes(2)
    expect(onRowClick).toHaveBeenNthCalledWith(1, ROWS[0])
    expect(onRowClick).toHaveBeenNthCalledWith(2, ROWS[0])
  })

  it('case 2 — Enter on a focused inner button inside a clickable row does not call onRowClick', () => {
    const onRowClick = vi.fn()
    renderTable({ onRowClick })

    fireEvent.keyDown(screen.getByRole('button', { name: 'inner-Tirana' }), { key: 'Enter' })

    expect(onRowClick).not.toHaveBeenCalled()
  })

  it("case 3 — visibility 'md' renders the column with visibleFrom=md; 'always' does not", () => {
    renderTable()

    const md = screen.getByText('tag-x').closest('td') as HTMLElement
    const always = screen.getByText('Alpha').closest('td') as HTMLElement
    expect(md.className).toContain('mantine-visible-from-md')
    expect(always.className).not.toContain('mantine-visible-from')
  })

  it('case 4 — with no cardRow the synthesized card shows the column-0 title', async () => {
    stubMatchMedia(true) // below 640px → cards
    renderTable()

    await waitFor(() => expect(screen.queryByRole('table')).toBeNull())
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('inner-Tirana')).toBeTruthy()
  })

  it('case 5 — a card with `trailing` shows it and no automatic chevron; without `trailing` it shows one', async () => {
    stubMatchMedia(true)
    const chevrons = (el: HTMLElement) => el.querySelectorAll('.lucide-chevron-right').length

    const { unmount } = renderTable({
      onRowClick: () => {},
      cardRow: r => ({ title: r.name, trailing: <span data-testid="own-trailing">own</span> }),
    })
    await waitFor(() => expect(screen.getAllByTestId('own-trailing')).toHaveLength(ROWS.length))
    expect(chevrons(document.body)).toBe(0)
    unmount()

    renderTable({ onRowClick: () => {}, cardRow: r => ({ title: r.name }) })
    await waitFor(() => expect(screen.getByText('Alpha')).toBeTruthy())
    expect(chevrons(document.body)).toBe(ROWS.length)
    expect(within(screen.getByText('Alpha').closest('[role="button"]') as HTMLElement).queryAllByTestId('own-trailing')).toHaveLength(0)
  })
})
