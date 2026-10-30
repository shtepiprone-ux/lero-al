/**
 * MantineModal / responsiveBottomSheet — the one dialog that is a centred modal from 640px and a bottom sheet below it (Task 923 Revision 7).
 * Covers: the 639 / 640 boundary (compact is BELOW 640, 640 is the wide layout: `theme.other.mobileGate`), the pinned footer of the sheet, the dialog
 * anatomy, Escape / close control, `covered` (hidden from assistive technology and inert), focus returning to what opened the dialog also when the dialog
 * is unmounted instead of closed (WCAG 2.4.3), and the dialog taking the focus when no control can.
 */
import React, { useState } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import { MantineModal } from '../MantineModal'
import { renderApp, setViewport } from './viewportKit'

const baseProps = { opened: true, onClose: () => {}, title: 'Edit listing', children: <p>Body text</p> }

beforeEach(() => { setViewport(1024) })
afterEach(() => { vi.useRealTimers() })

describe('MantineModal — which presentation', () => {
  it('is a centred dialog at 1024 and at exactly 640', () => {
    for (const w of [1024, 640]) {
      setViewport(w)
      const { unmount } = renderApp(<MantineModal {...baseProps} />)
      expect(document.querySelector('.mantine-Modal-content'), `${w}px`).not.toBeNull()
      expect(document.querySelector('.mantine-Drawer-content'), `${w}px`).toBeNull()
      unmount()
    }
  })

  it('is a bottom sheet at 639 and at 320', () => {
    for (const w of [639, 320]) {
      setViewport(w)
      const { unmount } = renderApp(<MantineModal {...baseProps} />)
      expect(document.querySelector('.mantine-Drawer-content'), `${w}px`).not.toBeNull()
      expect(document.querySelector('.mantine-Modal-content'), `${w}px`).toBeNull()
      unmount()
    }
  })

  it('keeps the title and the body in both presentations', () => {
    for (const w of [1024, 320]) {
      setViewport(w)
      const { unmount } = renderApp(<MantineModal {...baseProps} />)
      expect(screen.getByText('Edit listing')).toBeInTheDocument()
      expect(screen.getByText('Body text')).toBeInTheDocument()
      unmount()
    }
  })
})

describe('MantineModal — footer', () => {
  it('the sheet pins the footer outside the scrolled body, under a divider', () => {
    setViewport(320)
    renderApp(<MantineModal {...baseProps} footer={<button type="button">Save</button>} />)
    const footer = screen.getByTestId('mantine-drawer-footer')
    expect(footer).toContainElement(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByTestId('mantine-drawer-scroll-content')).not.toContainElement(footer)
  })

  it('the centred dialog renders the footer outside the body that scrolls', () => {
    renderApp(<MantineModal {...baseProps} footer={<button type="button">Save</button>} />)
    const body = document.querySelector('.mantine-Modal-body') as HTMLElement
    expect(body).not.toContainElement(screen.getByRole('button', { name: 'Save' }))
  })
})

describe('MantineModal — structured anatomy', () => {
  const props = { ...baseProps, structured: true, description: 'Change the details', icon: <span data-testid="tile-icon" /> }

  it('shows icon, title and description, in the centred dialog and in the sheet', () => {
    for (const w of [1024, 320]) {
      setViewport(w)
      const { unmount } = renderApp(<MantineModal {...props} />)
      expect(screen.getByTestId('tile-icon')).toBeInTheDocument()
      expect(screen.getByText('Edit listing')).toBeInTheDocument()
      expect(screen.getByText('Change the details')).toBeInTheDocument()
      unmount()
    }
  })

  it('the centred dialog has a named close control that closes it; the sheet has none of its own', () => {
    const onClose = vi.fn()
    const { unmount } = renderApp(<MantineModal {...props} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    unmount()
    setViewport(320)
    renderApp(<MantineModal {...props} />)
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('Escape closes it in both presentations', () => {
    for (const w of [1024, 320]) {
      setViewport(w)
      const onClose = vi.fn()
      const { unmount } = renderApp(<MantineModal {...props} onClose={onClose} />)
      fireEvent.keyDown(document.body, { key: 'Escape' })
      expect(onClose, `${w}px`).toHaveBeenCalled()
      unmount()
    }
  })

  it('a covered dialog is hidden from assistive technology and inert, an uncovered one is not', () => {
    renderApp(<MantineModal {...props} covered />)
    const root = document.querySelector('.mantine-Modal-root') as HTMLElement
    expect(root.getAttribute('aria-hidden')).toBe('true')
    expect(root.hasAttribute('inert')).toBe(true)
  })

  it('an uncovered dialog carries neither', () => {
    renderApp(<MantineModal {...props} />)
    const root = document.querySelector('.mantine-Modal-root') as HTMLElement
    expect(root.hasAttribute('aria-hidden')).toBe(false)
    expect(root.hasAttribute('inert')).toBe(false)
  })
})

describe('MantineModal — focus', () => {
  function Host({ mountedAfterClose }: { mountedAfterClose: boolean }) {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <button type="button" data-testid="opener" onClick={() => setOpen(true)}>Open</button>
        {(mountedAfterClose || open) && (
          <MantineModal opened={open} onClose={() => setOpen(false)} title="T">
            <button type="button" data-testid="inside" onClick={() => setOpen(false)}>Done</button>
          </MantineModal>
        )}
      </div>
    )
  }

  it('focus returns to the opener when the dialog is UNMOUNTED instead of closed (WCAG 2.4.3)', () => {
    vi.useFakeTimers()
    renderApp(<Host mountedAfterClose={false} />)
    const opener = screen.getByTestId('opener')
    opener.focus()
    act(() => { fireEvent.click(opener) })
    act(() => { vi.advanceTimersByTime(50) })
    fireEvent.click(screen.getByTestId('inside'))
    act(() => { vi.advanceTimersByTime(400) })
    expect(document.activeElement).toBe(opener)
  })

  // The `DialogBody` fallback line itself cannot be isolated in jsdom (Mantine's focus trap puts the focus in the dialog here too); it is proved on the built
  // Storybook by the census rule `focus-open` / `focus-trap` on Story 244 (an upload in progress, every control disabled).
  it('the focus stays inside a dialog whose only control is disabled', () => {
    vi.useFakeTimers()
    renderApp(<MantineModal opened onClose={() => {}} title="Uploading"><button type="button" disabled>Cancel</button></MantineModal>)
    // the focus is on the page (what is left when every control is disabled), not inside the dialog
    ;(document.activeElement as HTMLElement | null)?.blur()
    expect(document.activeElement).toBe(document.body)
    act(() => { vi.advanceTimersByTime(400) })
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
