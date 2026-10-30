/**
 * The unsaved-changes guard (Task 923 Revision 7). While a form is dirty every way out must ask first (tab close, a link, the back button, a toolbar button),
 * and it must never trap the person where it cannot help: links to other sites, to the same page, to an anchor, to a mail or phone app, or a broken
 * address are left to the browser. Once the form is clean, nothing is intercepted and no listener is left behind.
 */
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard'

let anchor: HTMLAnchorElement
let inner: HTMLSpanElement

function link(href: string | null) {
  if (href === null) anchor.removeAttribute('href')
  else anchor.setAttribute('href', href)
}
function click(target: Element = anchor) {
  const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
  target.dispatchEvent(ev)
  return ev
}

beforeEach(() => {
  push.mockReset()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  anchor = document.createElement('a')
  inner = document.createElement('span')
  anchor.appendChild(inner)
  document.body.appendChild(anchor)
})
afterEach(() => { anchor.remove(); vi.restoreAllMocks() })

describe('while the form is clean', () => {
  it('nothing is intercepted and interceptHref lets the navigation go', () => {
    const onShow = vi.fn()
    const { result } = renderHook(() => useUnsavedChangesGuard(false, onShow))
    link('/other')
    expect(click().defaultPrevented).toBe(false)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(false)
    expect(result.current.interceptHref('/x')).toBe(true)
    expect(onShow).not.toHaveBeenCalled()
  })
})

describe('while the form is dirty', () => {
  it('closing the tab asks the browser to confirm', () => {
    renderHook(() => useUnsavedChangesGuard(true, vi.fn()))
    const unload = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(true)
  })

  it('a link to another page of the site is stopped, nobody else sees the click, and the dialog gets its address', () => {
    const onShow = vi.fn()
    renderHook(() => useUnsavedChangesGuard(true, onShow))
    const later = vi.fn()
    document.addEventListener('click', later, true)
    link('/listings/12?x=1')
    const ev = click()
    document.removeEventListener('click', later, true)
    expect(ev.defaultPrevented).toBe(true)
    expect(later).not.toHaveBeenCalled()
    expect(onShow).toHaveBeenCalledWith('/listings/12?x=1')
  })

  it('a click on something inside the link counts as a click on the link', () => {
    const onShow = vi.fn()
    renderHook(() => useUnsavedChangesGuard(true, onShow))
    link('/inside')
    expect(click(inner).defaultPrevented).toBe(true)
    expect(onShow).toHaveBeenCalledWith('/inside')
  })

  it('an absolute address of this same site is intercepted too', () => {
    const onShow = vi.fn()
    renderHook(() => useUnsavedChangesGuard(true, onShow))
    link(`${window.location.origin}/else`)
    expect(click().defaultPrevented).toBe(true)
    expect(onShow).toHaveBeenCalledWith(`${window.location.origin}/else`)
  })

  it.each([
    ['another site', 'https://evil.example/phish'],
    ['a protocol-relative address to another site', '//evil.example/phish'],
    ['the same page', window.location.pathname],
    ['an anchor on the page', '#section'],
    ['a mail app', 'mailto:a@example.com'],
    ['a phone app', 'tel:+355691234567'],
    ['a javascript: address', 'javascript:alert(1)'],
    ['a data: address', 'data:text/html,<b>x</b>'],
    ['an address that cannot be parsed', 'http://[::1'],
    ['an empty address', ''],
  ])('%s is left alone', (_label, href) => {
    const onShow = vi.fn()
    renderHook(() => useUnsavedChangesGuard(true, onShow))
    link(href)
    expect(click().defaultPrevented).toBe(false)
    expect(onShow).not.toHaveBeenCalled()
  })

  it('a link with no address and a click that is not on a link are left alone', () => {
    const onShow = vi.fn()
    renderHook(() => useUnsavedChangesGuard(true, onShow))
    link(null)
    expect(click().defaultPrevented).toBe(false)
    expect(click(document.body).defaultPrevented).toBe(false)
    expect(onShow).not.toHaveBeenCalled()
  })

  it('the back button keeps the address, asks, and "leave" goes back two steps once', () => {
    const onShow = vi.fn()
    const pushState = vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const { result } = renderHook(() => useUnsavedChangesGuard(true, onShow))
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(pushState).toHaveBeenCalledTimes(1)
    expect(onShow).toHaveBeenCalledWith(null)

    result.current.confirmLeave(null)
    expect(go).toHaveBeenCalledWith(-2)
    // the popstate our own go(-2) causes must not open the dialog again
    onShow.mockClear()
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(onShow).not.toHaveBeenCalled()
    // and the guard asks again for the next real one
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(onShow).toHaveBeenCalledWith(null)
  })

  it('leaving with an address goes there through the router, not through history', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})
    const { result } = renderHook(() => useUnsavedChangesGuard(true, vi.fn()))
    result.current.confirmLeave('/dashboard')
    expect(push).toHaveBeenCalledWith('/dashboard')
    expect(go).not.toHaveBeenCalled()
  })

  it('a toolbar navigation is refused and shows the dialog', () => {
    const onShow = vi.fn()
    const { result } = renderHook(() => useUnsavedChangesGuard(true, onShow))
    expect(result.current.interceptHref('/toolbar')).toBe(false)
    expect(onShow).toHaveBeenCalledWith('/toolbar')
  })
})

describe('listeners', () => {
  it('stop working when the form becomes clean again', () => {
    const onShow = vi.fn()
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty, onShow), { initialProps: { dirty: true } })
    link('/a')
    expect(click().defaultPrevented).toBe(true)
    rerender({ dirty: false })
    onShow.mockClear()
    expect(click().defaultPrevented).toBe(false)
    const unload = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(unload)
    expect(unload.defaultPrevented).toBe(false)
    expect(onShow).not.toHaveBeenCalled()
  })

  it('are all removed when the component goes away', () => {
    const onShow = vi.fn()
    const remove = vi.spyOn(document, 'removeEventListener')
    const removeWin = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useUnsavedChangesGuard(true, onShow))
    unmount()
    expect(remove).toHaveBeenCalledWith('click', expect.any(Function), true)
    expect(removeWin).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    expect(removeWin).toHaveBeenCalledWith('popstate', expect.any(Function))
    link('/a')
    expect(click().defaultPrevented).toBe(false)
  })
})
