/**
 * MantineAppShellFoundation — the side navigation is a fixed sidebar from its breakpoint and a drawer below it (Task 923 Revision 7).
 * Covers: below `navbarBreakpoint` (default `sm` = 640px, `lg` = 1024px for the admin shell) the navigation is mounted in the Drawer only, at and above
 * it in the navbar only - exactly one instance either way (R28), the burger opens it, the Drawer's close control is named and meets the touch token, Escape
 * closes it, and a nav link closes it.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { MantineAppShellFoundation, type MantineAppShellFoundationProps } from '../MantineAppShellFoundation'
import { renderApp, setViewport } from './viewportKit'

const nav = [{ label: 'Dashboard', href: '/admin', active: true }, { label: 'Listings', href: '/admin/listings' }]

function shell(extra: Partial<MantineAppShellFoundationProps> = {}) {
  return renderApp(
    <MantineAppShellFoundation siteName="Lero.al" navItems={nav} userName="Alba" burgerAriaLabel="Open menu" drawerCloseLabel="Close menu" opened={false} onToggle={() => {}} {...extra}>
      <p>Page body</p>
    </MantineAppShellFoundation>,
  )
}

beforeEach(() => { setViewport(1440) })

describe('where the navigation lives', () => {
  it('at 640 and above (default sm) it is in the navbar, once, and there is no drawer', () => {
    for (const w of [1440, 640]) {
      setViewport(w)
      const { unmount } = shell()
      expect(screen.getAllByText('Listings'), `${w}px`).toHaveLength(1)
      expect(document.querySelector('.mantine-AppShell-navbar [href="/admin/listings"]'), `${w}px`).not.toBeNull()
      expect(document.querySelector('.mantine-Drawer-root'), `${w}px`).toBeNull()
      unmount()
    }
  })

  it('at 639 and below it is in the drawer, once, and not in the navbar', () => {
    for (const w of [639, 320]) {
      setViewport(w)
      const { unmount } = shell()
      expect(screen.getAllByText('Listings', { selector: 'span' }).length, `${w}px`).toBe(1)
      expect(document.querySelector('.mantine-AppShell-navbar [href="/admin/listings"]'), `${w}px`).toBeNull()
      expect(document.querySelector('.mantine-Drawer-root [href="/admin/listings"]'), `${w}px`).not.toBeNull()
      unmount()
    }
  })

  it('with navbarBreakpoint="lg" the switch is at 1024: drawer at 1023, navbar at 1024', () => {
    setViewport(1023)
    let r = shell({ navbarBreakpoint: 'lg' })
    expect(document.querySelector('.mantine-Drawer-root [href="/admin/listings"]')).not.toBeNull()
    r.unmount()
    setViewport(1024)
    r = shell({ navbarBreakpoint: 'lg' })
    expect(document.querySelector('.mantine-AppShell-navbar [href="/admin/listings"]')).not.toBeNull()
    expect(document.querySelector('.mantine-Drawer-root')).toBeNull()
  })

  it('a consumer navbarContent replaces the default list, in the same single place', () => {
    shell({ navbarContent: <div data-testid="custom-nav">Custom</div> })
    expect(screen.getAllByTestId('custom-nav')).toHaveLength(1)
    expect(screen.queryByText('Listings')).toBeNull()
  })
})

describe('the drawer', () => {
  beforeEach(() => { setViewport(320) })

  it('the burger is named and asks to toggle', () => {
    const onToggle = vi.fn()
    shell({ onToggle })
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('there is no burger once the sidebar is fixed', () => {
    setViewport(1440)
    shell()
    expect(screen.getByRole('button', { name: 'Open menu', hidden: true }).className).toMatch(/mantine-hidden-from-sm/)
  })

  it('when open it is a named dialog with a named close control that meets the touch token', () => {
    shell({ opened: true })
    const close = screen.getByRole('button', { name: 'Close menu' })
    expect(close).toBeInTheDocument()
    const style = getComputedStyle(close)
    expect(style.minWidth).toBe('2.75rem')
    expect(style.minHeight).toBe('2.75rem')
  })

  it('the close control, Escape and a nav link each ask to close it, once', () => {
    const onToggle = vi.fn()
    shell({ opened: true, onToggle })
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    onToggle.mockClear()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(onToggle).toHaveBeenCalledTimes(1)
    onToggle.mockClear()
    fireEvent.click(document.querySelector('.mantine-Drawer-root [href="/admin/listings"]') as HTMLElement)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('stays mounted while closed (display none) so the single instance is stable', () => {
    shell({ opened: false })
    expect(document.querySelector('.mantine-Drawer-root')).not.toBeNull()
  })
})
