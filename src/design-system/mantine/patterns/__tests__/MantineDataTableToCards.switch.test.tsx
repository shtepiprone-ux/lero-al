/**
 * MantineDataTableToCards — the table / cards switch and the row interaction (Task 923 Revision 7, R47).
 * Covers: the default `cardsBelow` is `md` (record cards below 768px, owner decision D36) and `lg` is the named exception; every value renders the cards
 * and the table together, each in a box Mantine hides from / shows from the breakpoint with CSS, so the markup does not depend on the viewport (no
 * first-paint flash); the empty label; a clickable row is operable from the keyboard (Enter and Space); a table is never the only way to read a record
 * on a phone (every column value is in the card).
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import { MantineDataTableToCards, type TableColumn, type TableRow } from '../MantineDataTableToCards'
import { renderApp, setViewport } from './viewportKit'

const COLUMNS: TableColumn<TableRow>[] = [{ key: 'name', label: 'Name' }, { key: 'city', label: 'City' }]
const ROWS: TableRow[] = [{ id: '1', name: 'Alba Krasniqi', city: 'Tirana' }, { id: '2', name: 'Besnik Hoxha', city: 'Durres' }]

beforeEach(() => { setViewport(1024) })

function renderTable(extra: Partial<React.ComponentProps<typeof MantineDataTableToCards>> = {}) {
  return renderApp(<MantineDataTableToCards columns={COLUMNS} rows={ROWS} ariaLabel="People" {...extra} />)
}

const box = (kind: 'hidden' | 'visible', bp: string) => document.querySelector(`.mantine-${kind}-from-${bp}`) as HTMLElement | null

describe('cardsBelow default (md, 768px, D36) — both layouts, CSS chooses', () => {
  it('renders the cards in a box hidden from md and the table in a box visible from md', () => {
    for (const w of [1024, 320]) {
      setViewport(w)
      const { unmount } = renderTable()
      const cards = box('hidden', 'md')
      const table = box('visible', 'md')
      expect(cards, `${w}px cards box`).not.toBeNull()
      expect(table, `${w}px table box`).not.toBeNull()
      expect(cards!.querySelector('.mantine-Card-root'), `${w}px cards`).not.toBeNull()
      expect(cards!.querySelector('table'), `${w}px no table in the cards box`).toBeNull()
      expect(table!.querySelector('table'), `${w}px table`).not.toBeNull()
      unmount()
    }
  })

  it('does not use the 640px gate: no box is hidden from or visible from sm', () => {
    renderTable()
    expect(box('hidden', 'sm')).toBeNull()
    expect(box('visible', 'sm')).toBeNull()
  })

  it('does not depend on the viewport to decide (the same markup at 320, 767, 768 and 1440)', () => {
    const html: string[] = []
    for (const w of [320, 767, 768, 1440]) {
      setViewport(w)
      const { container, unmount } = renderTable()
      html.push(container.innerHTML)
      unmount()
    }
    expect(new Set(html).size).toBe(1)
  })

  it('every value of every row is on the page in both presentations', () => {
    setViewport(1024)
    const { unmount } = renderTable()
    for (const scope of [box('hidden', 'md')!, box('visible', 'md')!]) {
      for (const r of ROWS) {
        expect(within(scope).getByText(String(r.name))).toBeInTheDocument()
        expect(within(scope).getByText(String(r.city))).toBeInTheDocument()
      }
    }
    unmount()
  })
})

describe('cardsBelow="lg" — the named exception, both layouts, CSS chooses', () => {
  it('renders the cards in a box hidden from lg and the table in a box visible from lg, and uses no md box', () => {
    for (const w of [1024, 320]) {
      setViewport(w)
      const { unmount } = renderTable({ cardsBelow: 'lg' })
      expect(box('hidden', 'lg'), `${w}px cards box`).not.toBeNull()
      expect(box('visible', 'lg'), `${w}px table box`).not.toBeNull()
      expect(box('visible', 'lg')!.querySelector('table'), `${w}px table`).not.toBeNull()
      expect(box('hidden', 'md'), `${w}px`).toBeNull()
      expect(box('visible', 'md'), `${w}px`).toBeNull()
      unmount()
    }
  })

  it('does not depend on the viewport to decide (the same markup at 320 and at 1440)', () => {
    const html: string[] = []
    for (const w of [320, 1440]) {
      setViewport(w)
      const { container, unmount } = renderTable({ cardsBelow: 'lg' })
      html.push(container.innerHTML)
      unmount()
    }
    expect(html[0]).toBe(html[1])
  })
})

describe('empty and clickable', () => {
  it('shows the empty label instead of an empty table', () => {
    renderTable({ rows: [], emptyLabel: 'No people yet' })
    expect(screen.getByText('No people yet')).toBeInTheDocument()
    expect(document.querySelector('table')).toBeNull()
  })

  it('a clickable table row is reachable and operable with Enter and Space', () => {
    const onRowClick = vi.fn()
    renderTable({ onRowClick })
    const rows = document.querySelectorAll('tbody tr[tabindex="0"]')
    expect(rows).toHaveLength(2)
    fireEvent.keyDown(rows[0], { key: 'Enter' })
    fireEvent.keyDown(rows[1], { key: ' ' })
    expect(onRowClick).toHaveBeenCalledTimes(2)
    expect(onRowClick).toHaveBeenNthCalledWith(1, ROWS[0])
    expect(onRowClick).toHaveBeenNthCalledWith(2, ROWS[1])
  })

  it('without onRowClick a row is not a tab stop', () => {
    renderTable()
    expect(document.querySelectorAll('tbody tr[tabindex="0"]')).toHaveLength(0)
  })

  it('a clicked card calls onRowClick with its row', () => {
    setViewport(320)
    const onRowClick = vi.fn()
    renderTable({ onRowClick })
    // both trees are in the DOM (CSS chooses): the click is made inside the cards box
    fireEvent.click(within(box('hidden', 'md')!).getByText('Besnik Hoxha'))
    expect(onRowClick).toHaveBeenCalledWith(ROWS[1])
  })
})
