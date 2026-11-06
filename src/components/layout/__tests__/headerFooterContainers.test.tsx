/**
 * The Header and Footer containers (Task 923 Revision 7). Header: it wires the sign-in sheet to a global event, switches language without losing the page and without
 * trusting a path that only looks like a language, opens the admin app in a new tab without handing it the opener, and signs out to the right page. Footer: the
 * database content wins field by field, an empty list or a failing footer service falls back to the built-in links, and the site name is split into brand and domain.
 */
import type { FooterViewProps } from '../FooterView'
import React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ── Header ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
type ViewProps = Record<string, unknown> & {
  onOpenAuth: (v: string) => void; onSwitchLocale: (l: string) => void; onNavigate: (p: string) => void; onOpenAdmin: () => void; onLogout: () => void
  onOpenMobile: () => void; onCloseMobile: () => void; mobileOpen: boolean; user: unknown; isAuthenticated: boolean; isSigningOut: boolean
  notificationSlot?: React.ReactNode; authSheetSlot: React.ReactElement<{ open: boolean; onOpenChange: (o: boolean) => void; initialView: string }>
}
let view: ViewProps
let userState: { user: unknown; signOut: (cb: () => void) => void; isSigningOut: boolean }
let pathname = '/en/listings/abc'
const push = vi.fn()
const refresh = vi.fn()
const setAdminLocale = vi.fn()

vi.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }), usePathname: () => pathname }))
vi.mock('@/modules/auth/hooks/useUser', () => ({ useUser: () => userState }))
vi.mock('@/modules/admin/actions/locale', () => ({ setAdminLocale: (l: string) => setAdminLocale(l) }))
vi.mock('@/modules/notifications/components/NotificationBell', () => ({ NotificationBell: () => <span data-testid="bell" /> }))
vi.mock('@/components/layout/HeaderView', () => ({ HeaderView: (p: ViewProps) => { view = p; return null } }))
vi.mock('@/modules/auth/components/AuthSheet', () => ({ AuthSheet: () => null }))

import { AUTH_SHEET_CLOSED_EVENT, openAuthSheet } from '@/lib/auth/authSheet'
import { Header } from '../Header'

const USER = { id: 'u1', name: 'Alba', role: 'user' }
beforeEach(() => {
  push.mockReset(); refresh.mockReset(); setAdminLocale.mockReset()
  userState = { user: USER, signOut: (cb) => cb(), isSigningOut: false }
  pathname = '/en/listings/abc'
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('Header', () => {
  it('a signed-in person gets the bell and is authenticated; a guest gets neither', () => {
    render(<Header />)
    expect(view.isAuthenticated).toBe(true)
    expect(view.notificationSlot).toBeTruthy()
    cleanup()
    userState = { user: null, signOut: vi.fn(), isSigningOut: false }
    render(<Header />)
    expect(view.isAuthenticated).toBe(false)
    expect(view.notificationSlot).toBeUndefined()
  })

  it('the global sign-in event opens the sheet on the requested view, "login" when none is given, and closing reports it', () => {
    render(<Header />)
    expect(view.authSheetSlot.props.open).toBe(false)
    act(() => openAuthSheet('register-agent'))
    expect(view.authSheetSlot.props.open).toBe(true)
    expect(view.authSheetSlot.props.initialView).toBe('register-agent')
    const closed = vi.fn()
    window.addEventListener(AUTH_SHEET_CLOSED_EVENT, closed)
    act(() => view.authSheetSlot.props.onOpenChange(false))
    expect(view.authSheetSlot.props.open).toBe(false)
    expect(closed).toHaveBeenCalledTimes(1)
    act(() => { window.dispatchEvent(new CustomEvent('lero:open-auth-sheet')) })
    expect(view.authSheetSlot.props.initialView).toBe('login')
    act(() => view.authSheetSlot.props.onOpenChange(true))
    expect(closed).toHaveBeenCalledTimes(1)
    window.removeEventListener(AUTH_SHEET_CLOSED_EVENT, closed)
  })

  it('the global listener is removed with the header', () => {
    const { unmount } = render(<Header />)
    unmount()
    expect(() => act(() => openAuthSheet('login'))).not.toThrow()
  })

  it('opening from the header\'s own buttons uses the view they ask for', () => {
    render(<Header />)
    act(() => view.onOpenAuth('register'))
    expect(view.authSheetSlot.props.initialView).toBe('register')
  })

  it('the mobile drawer opens and closes', () => {
    render(<Header />)
    expect(view.mobileOpen).toBe(false)
    act(() => view.onOpenMobile())
    expect(view.mobileOpen).toBe(true)
    act(() => view.onCloseMobile())
    expect(view.mobileOpen).toBe(false)
  })

  it('navigation goes through the router', () => {
    render(<Header />)
    view.onNavigate('/en/cabinet')
    expect(push).toHaveBeenCalledWith('/en/cabinet')
  })

  describe('switching language', () => {
    function switchFrom(path: string, to: string) {
      window.history.pushState(null, '', path)
      render(<Header />)
      view.onSwitchLocale(to)
    }
    it('keeps the rest of the address and syncs the admin language', () => {
      switchFrom('/en/listings/abc', 'sq')
      expect(push).toHaveBeenCalledWith('/sq/listings/abc')
      expect(setAdminLocale).toHaveBeenCalledWith('sq')
    })
    it('the bare language address goes to the new language home', () => {
      switchFrom('/uk', 'it')
      expect(push).toHaveBeenCalledWith('/it/')
    })
    it('a segment that only STARTS like a language is kept whole', () => {
      switchFrom('/english-guide', 'sq')
      expect(push).toHaveBeenCalledWith('/sq/english-guide')
      push.mockClear(); cleanup()
      switchFrom('/italy/x', 'en')
      expect(push).toHaveBeenCalledWith('/en/italy/x')
    })
    it('the query string and hash are not copied into the new path', () => {
      switchFrom('/en/listings?evil=//x.com', 'sq')
      expect(push).toHaveBeenCalledWith('/sq/listings')
    })
    it('an address with a double slash stays inside the site (it is always under the language)', () => {
      switchFrom('/en//evil.example/x', 'sq')
      const target = push.mock.calls[0][0] as string
      expect(target.startsWith('/sq/')).toBe(true)
    })
  })

  it('the admin app opens in a new tab with no opener and no referrer', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<Header />)
    view.onOpenAdmin()
    expect(open).toHaveBeenCalledWith('/admin', '_blank', 'noopener,noreferrer')
  })

  it('signing out from a page that needs a session goes to the language home; from a public page it just refreshes', () => {
    pathname = '/en/cabinet'
    render(<Header />)
    view.onLogout()
    expect(push).toHaveBeenCalledWith('/en')
    expect(refresh).not.toHaveBeenCalled()
    cleanup(); push.mockClear()
    pathname = '/en/listings/abc'
    render(<Header />)
    view.onLogout()
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it('during sign-out the header keeps showing the person it had, then follows the real user', () => {
    const { rerender } = render(<Header />)
    expect((view.user as { id: string }).id).toBe('u1')
    userState = { user: null, signOut: vi.fn(), isSigningOut: true }
    rerender(<Header />)
    expect((view.user as { id: string }).id).toBe('u1')
    expect(view.isAuthenticated).toBe(true)
    expect(view.isSigningOut).toBe(true)
    userState = { user: null, signOut: vi.fn(), isSigningOut: false }
    rerender(<Header />)
    expect(view.user).toBeNull()
    expect(view.isAuthenticated).toBe(false)
  })
})

// ── Footer ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
describe('Footer', () => {
  async function footer(siteName: string, content: unknown) {
    vi.resetModules()
    vi.doMock('next-intl/server', () => ({
      getLocale: async () => 'sq',
      getTranslations: async () => (k: string) => `t:${k}`,
    }))
    // `Footer` reads both the site name and the footer content from `lib/settings`
    vi.doMock('@/modules/admin/lib/settings', () => ({
      getSetting: async () => siteName,
      getFooterContent: () => (content instanceof Error ? Promise.reject(content) : Promise.resolve(content)),
    }))
    vi.doMock('../FooterView', () => ({ FooterView: () => null }))
    const { Footer } = await import('../Footer')
    return (await Footer()).props as FooterViewProps
  }
  const link = (id: string, enabled = true) => ({ id, label: id, url: `/${id}`, enabled, order: 0 })

  it('splits the site name into brand and domain', async () => {
    expect(await footer('Lero.al', null)).toMatchObject({ brand: 'Lero', tld: '.al' })
    expect(await footer('My.Site.co', null)).toMatchObject({ brand: 'My', tld: '.Site.co' })
    expect(await footer('Lero', null)).toMatchObject({ brand: 'Lero', tld: '' })
  })

  it('without database content every field comes from the translations and the built-in links', async () => {
    const p = await footer('Lero.al', null)
    expect(p).toMatchObject({ tagline: 't:tagline', navTitle: 't:navigation', infoTitle: 't:information', socialTitle: 't:follow_us', locale: 'sq' })
    expect(p.navLinks.map((l) => l.url)).toEqual(['/', '/listings', '/listings/create'])
    expect(p.infoLinks.map((l) => l.url)).toEqual(['/about', '/contact', '/privacy-policy', '/terms-of-service'])
    expect(p.socialLinks.map((l) => l.url)).toEqual(['https://facebook.com', 'https://instagram.com'])
    expect(p.copyright).toBe(`© ${new Date().getFullYear()} Lero.al — t:all_rights`)
  })

  it('a failing footer service gives the same page as no content, not an error', async () => {
    const p = await footer('Lero.al', new Error('db down'))
    expect(p.tagline).toBe('t:tagline')
    expect(p.navLinks).toHaveLength(3)
  })

  it('database text wins field by field; an empty field falls back on its own', async () => {
    const p = await footer('Lero.al', { tagline: 'Our tagline', nav_section_title: '', info_section_title: 'Info', social_section_title: undefined, copyright_template: '', nav_links: [], info_links: [], social_links: [] })
    expect(p.tagline).toBe('Our tagline')
    expect(p.navTitle).toBe('t:navigation')
    expect(p.infoTitle).toBe('Info')
    expect(p.socialTitle).toBe('t:follow_us')
  })

  it('the copyright template gets the current year in every place it is written', async () => {
    const p = await footer('Lero.al', { copyright_template: '© {year} Lero. All rights {year}.', nav_links: [], info_links: [], social_links: [] })
    const y = String(new Date().getFullYear())
    expect(p.copyright).toBe(`© ${y} Lero. All rights ${y}.`)
  })

  it('only enabled links are shown; a list with none enabled falls back to the built-in ones', async () => {
    const p = await footer('Lero.al', { nav_links: [link('a'), link('b', false)], info_links: [link('c', false)], social_links: [link('d', false), link('e', false)] })
    expect(p.navLinks.map((l) => l.id)).toEqual(['a'])
    expect(p.infoLinks).toHaveLength(4)
    expect(p.socialLinks.map((l) => l.id)).toEqual(['social-facebook', 'social-instagram'])
  })

  it('a database record with no lists at all still renders', async () => {
    const p = await footer('Lero.al', {})
    expect(p.navLinks).toHaveLength(3)
  })
})
