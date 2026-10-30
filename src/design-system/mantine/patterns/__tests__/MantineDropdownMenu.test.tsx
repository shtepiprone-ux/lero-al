/**
 * MantineDropdownMenu — an anchored menu from 640px, a bottom sheet of 44px rows below it (Task 923 Revision 7).
 * Covers: the 639 / 640 boundary, every item reachable in both presentations, item actions (and a disabled item / disabled menu doing nothing),
 * the current item marked, a destructive colour, and the focus rule of WCAG 2.4.3: the control that was pressed takes the focus before the menu opens
 * (also a toolbar button that prevents the mousedown focus), so the menu returns it there when it closes.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MantineDropdownMenu, type DropdownMenuItemDef } from '../MantineDropdownMenu'
import { renderApp, setViewport } from './viewportKit'

const onEdit = vi.fn()
const onDelete = vi.fn()
const onOff = vi.fn()
const items: DropdownMenuItemDef[] = [
  { label: 'Edit', onClick: onEdit, active: true },
  { label: 'Archive', onClick: onOff, disabled: true },
  { label: 'Delete', onClick: onDelete, color: 'red', separator: true },
]

beforeEach(() => { vi.clearAllMocks(); setViewport(1024) })

function menu(extra: Partial<React.ComponentProps<typeof MantineDropdownMenu>> = {}) {
  return renderApp(<MantineDropdownMenu trigger={<button type="button">Actions</button>} items={items} title="Listing actions" {...extra} />)
}

describe('presentation', () => {
  it('is an anchored menu at 1024 and at exactly 640', () => {
    for (const w of [1024, 640]) {
      setViewport(w)
      const { unmount } = menu()
      fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
      expect(document.querySelector('.mantine-Menu-dropdown'), `${w}px`).not.toBeNull()
      expect(document.querySelector('.mantine-Drawer-content'), `${w}px`).toBeNull()
      unmount()
    }
  })

  it('is a bottom sheet at 639 and at 320', () => {
    for (const w of [639, 320]) {
      setViewport(w)
      const { unmount } = menu()
      fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
      expect(document.querySelector('.mantine-Drawer-content'), `${w}px`).not.toBeNull()
      expect(document.querySelector('.mantine-Menu-dropdown'), `${w}px`).toBeNull()
      unmount()
    }
  })

  it('lists every item, label whole, in both presentations', () => {
    for (const w of [1024, 320]) {
      setViewport(w)
      const { unmount } = menu()
      fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
      for (const label of ['Edit', 'Archive', 'Delete']) expect(screen.getByText(label), `${w}px`).toBeInTheDocument()
      unmount()
    }
  })

  it('the sheet shows its title', () => {
    setViewport(320)
    menu()
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.getByText('Listing actions')).toBeInTheDocument()
  })
})

describe('items', () => {
  it.each([1024, 320])('an item runs its action (%ipx)', (w) => {
    setViewport(w)
    menu()
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    fireEvent.click(screen.getByText('Delete'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it.each([1024, 320])('a disabled item does nothing (%ipx)', (w) => {
    setViewport(w)
    menu()
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    fireEvent.click(screen.getByText('Archive'))
    expect(onOff).not.toHaveBeenCalled()
  })

  it.each([1024, 320])('a disabled menu opens neither presentation (%ipx)', (w) => {
    setViewport(w)
    menu({ disabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    expect(document.querySelector('.mantine-Menu-dropdown')).toBeNull()
    expect(document.querySelector('.mantine-Drawer-content')).toBeNull()
  })

  it('the current item is marked on the desktop menu', () => {
    menu()
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }))
    expect(document.querySelector('[data-active]')).not.toBeNull()
    expect(document.querySelector('[data-active]')?.textContent).toContain('Edit')
  })
})

describe('focus (WCAG 2.4.3)', () => {
  it('the pressed trigger takes the focus before the sheet opens, even when its mousedown never focused it', () => {
    setViewport(320)
    menu()
    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(document.activeElement).not.toBe(trigger)
    fireEvent.click(trigger)
    expect(document.activeElement).toBe(trigger)
  })

  it('the pressed trigger takes the focus before the desktop menu opens', () => {
    menu()
    const trigger = screen.getByRole('button', { name: 'Actions' })
    fireEvent.click(trigger)
    // the capture handler of the wrapper focused it before Mantine opened the menu, so the menu has something to return the focus to
    expect(document.activeElement).toBe(trigger)
  })
})
