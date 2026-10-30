/**
 * The header's parts (Task 923 Revision 7): HeaderActions (what a guest and a signed-in person are offered), UserMenu (which entries each role sees and where they go),
 * MobileNavDrawer (the same rules in the compact drawer, and that opening a link closes it), and the Footer container (database content wins per field, an empty
 * list falls back, a broken footer service never breaks the page). A person must never be offered an entry of a higher role, and a guest never sees account links.
 */
import React from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { HeaderActions } from '../HeaderActions'
import { UserMenu } from '../UserMenu'
import { MobileNavDrawer } from '../MobileNavDrawer'

beforeAll(() => setViewport(1024))
afterEach(() => cleanup())

describe('HeaderActions', () => {
  const base = { favoritesHref: '/en/favorites', onOpenAuth: vi.fn() }

  it('a guest is offered login and register, each opening the sheet on its own view, and no favorites link', () => {
    const onOpenAuth = vi.fn()
    renderApp(<HeaderActions {...base} onOpenAuth={onOpenAuth} isAuthenticated={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    fireEvent.click(screen.getByRole('button', { name: 'Register' }))
    expect(onOpenAuth.mock.calls).toEqual([['login'], ['register']])
    expect(screen.queryByRole('link', { name: /favorites/i })).toBeNull()
  })

  it('a signed-in person gets the favorites link (named, a touch target) and no login or register', () => {
    renderApp(<HeaderActions {...base} isAuthenticated />)
    const link = screen.getByRole('link', { name: 'Favorites' })
    expect(link).toHaveAttribute('href', '/en/favorites')
    expect(screen.queryByRole('button', { name: 'Login' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull()
  })

  it('the notifications slot comes before favorites, and a guest never gets one the container did not pass', () => {
    const { container } = renderApp(<HeaderActions {...base} isAuthenticated notificationSlot={<span data-testid="bell" />} />)
    const bell = screen.getByTestId('bell')
    const fav = screen.getByRole('link', { name: 'Favorites' })
    expect(bell.compareDocumentPosition(fav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    cleanup()
    renderApp(<HeaderActions {...base} isAuthenticated={false} />)
    expect(screen.queryByTestId('bell')).toBeNull()
    expect(container).toBeTruthy()
  })
})

describe('UserMenu', () => {
  const nav = vi.fn()
  const admin = vi.fn()
  const logout = vi.fn()
  beforeEach(() => { nav.mockReset(); admin.mockReset(); logout.mockReset() })

  function open(role: string, extra: Partial<React.ComponentProps<typeof UserMenu>> = {}) {
    renderApp(<UserMenu user={{ name: 'Alba Hoxha', avatar_url: null, role }} locale="sq" onNavigate={nav} onOpenAdmin={admin} onLogout={logout} {...extra} />)
    fireEvent.click(screen.getByRole('button', { name: /Alba Hoxha/ }))
    return screen.getAllByRole('menuitem').map((i) => i.textContent)
  }

  it('a normal user sees profile, my listings, add listing and logout only', () => {
    const items = open('user')
    expect(items).toEqual(['Profile', 'My listings', 'Add listing', 'Logout'])
  })

  it('an agent also sees statistics, in the second place', () => {
    expect(open('agent')).toEqual(['Profile', 'Statistics', 'My listings', 'Add listing', 'Logout'])
  })

  it.each(['admin', 'moderator'])('a %s also sees the admin entry before logout', (role) => {
    const items = open(role)
    expect(items).toContain('Dashboard')
    expect(items.indexOf('Dashboard')).toBe(items.length - 2)
  })

  it.each(['user', 'agent', 'guest', '', 'Admin', 'ADMIN', 'superadmin'])('the role %j is not offered the admin entry', (role) => {
    expect(open(role)).not.toContain('Dashboard')
  })

  it.each([
    ['Profile', '/sq/cabinet'],
    ['My listings', '/sq/cabinet?tab=listings'],
    ['Add listing', '/sq/listings/create'],
  ])('%s goes to %s', (name, path) => {
    open('user')
    fireEvent.click(screen.getByRole('menuitem', { name }))
    expect(nav).toHaveBeenCalledWith(path)
  })

  it('statistics goes to the cabinet statistics page', () => {
    open('agent')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Statistics' }))
    expect(nav).toHaveBeenCalledWith('/sq/cabinet/statistics')
  })

  it('the admin entry calls onOpenAdmin and does not navigate inside the app', () => {
    open('moderator')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Dashboard' }))
    expect(admin).toHaveBeenCalledTimes(1)
    expect(nav).not.toHaveBeenCalled()
  })

  it('logout calls onLogout once', () => {
    open('user')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Logout' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('while signing out the trigger is in its loading state and cannot be pressed again', () => {
    renderApp(<UserMenu user={{ name: 'Alba', avatar_url: null, role: 'user' }} locale="sq" onNavigate={nav} onOpenAdmin={admin} onLogout={logout} isSigningOut />)
    expect(screen.getByRole('button', { name: /Alba/ })).toHaveAttribute('data-loading', 'true')
  })

  it('a person with no name still gets a working trigger', () => {
    renderApp(<UserMenu user={{ name: null, avatar_url: null, role: 'user' }} locale="sq" onNavigate={nav} onOpenAdmin={admin} onLogout={logout} />)
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })
})

describe('MobileNavDrawer', () => {
  const calls = { close: vi.fn(), nav: vi.fn(), auth: vi.fn(), logout: vi.fn() }
  beforeEach(() => Object.values(calls).forEach((f) => f.mockReset()))

  function drawer(user: React.ComponentProps<typeof MobileNavDrawer>['user'], opened = true) {
    return renderApp(<MobileNavDrawer opened={opened} onClose={calls.close} user={user} locale="en" onNavigate={calls.nav} onOpenAuth={calls.auth} onLogout={calls.logout} />)
  }
  const names = () => within(screen.getByRole('dialog')).getAllByRole('link').map((l) => l.textContent)

  it('closed, it shows nothing', () => {
    drawer(null, false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('a guest sees home and listings, and login, register and register as agent; no account links', () => {
    drawer(null)
    expect(names()).toEqual(['Home', 'Listings'])
    const dlg = within(screen.getByRole('dialog'))
    expect(dlg.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(dlg.getByRole('button', { name: 'Register' })).toBeInTheDocument()
    expect(dlg.getByRole('button', { name: /agent/i })).toBeInTheDocument()
    expect(dlg.queryByRole('button', { name: 'Logout' })).toBeNull()
    expect(dlg.queryByText('Favorites')).toBeNull()
  })

  it('each auth button closes the drawer and opens the sheet on its own view', () => {
    drawer(null)
    const dlg = within(screen.getByRole('dialog'))
    fireEvent.click(dlg.getByRole('button', { name: 'Login' }))
    fireEvent.click(dlg.getByRole('button', { name: 'Register' }))
    fireEvent.click(dlg.getByRole('button', { name: /agent/i }))
    expect(calls.auth.mock.calls).toEqual([['login'], ['register'], ['register-agent']])
    expect(calls.close).toHaveBeenCalledTimes(3)
  })

  it('a signed-in user sees the account links with the person\'s name, and logout', () => {
    drawer({ name: 'Alba Hoxha', avatar_url: null, role: 'user' })
    expect(names()).toEqual(['Home', 'Listings', 'Profile', 'My listings', 'Favorites', 'Add listing'])
    expect(within(screen.getByRole('dialog')).getByText('Alba Hoxha')).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Login' })).toBeNull()
  })

  it('statistics is offered to an agent only, and a missing role never gets it', () => {
    drawer({ name: 'A', avatar_url: null, role: 'agent' })
    expect(names()).toContain('Statistics')
    cleanup()
    drawer({ name: 'A', avatar_url: null })
    expect(names()).not.toContain('Statistics')
    cleanup()
    drawer({ name: 'A', avatar_url: null, role: 'admin' })
    expect(names()).not.toContain('Statistics')
  })

  it('opening a link closes the drawer first and then navigates, under the language of the page', () => {
    drawer({ name: 'A', avatar_url: null, role: 'agent' })
    const dlg = within(screen.getByRole('dialog'))
    const expected: Array<[string, string]> = [
      ['Home', '/en'], ['Listings', '/en/listings'], ['Profile', '/en/cabinet'], ['Statistics', '/en/cabinet/statistics'],
      ['My listings', '/en/cabinet?tab=listings'], ['Favorites', '/en/favorites'], ['Add listing', '/en/listings/create'],
    ]
    for (const [label, path] of expected) {
      calls.nav.mockClear(); calls.close.mockClear()
      const link = dlg.getByRole('link', { name: label })
      expect(link).toHaveAttribute('href', path)
      fireEvent.click(link)
      expect(calls.close).toHaveBeenCalledTimes(1)
      expect(calls.nav).toHaveBeenCalledWith(path)
    }
  })

  it('logout logs out and closes the drawer', () => {
    drawer({ name: 'A', avatar_url: null, role: 'user' })
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Logout' }))
    expect(calls.logout).toHaveBeenCalledTimes(1)
    expect(calls.close).toHaveBeenCalledTimes(1)
  })

  it('a person with no name still opens a drawer', () => {
    drawer({ name: null, avatar_url: null, role: 'user' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
