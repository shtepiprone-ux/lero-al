/**
 * AdminUsersTable — RTL smoke test (Task 483 — Epic MM.1)
 *
 * Verifies the Mantine-migrated AdminUsersTable still:
 *   1. Calls toggleUserVerified(userId, true)  when verify button clicked
 *   2. Calls toggleUserVerified(userId, false) when revoke button clicked
 *   3. Shows toast.success with the correct i18n key after toggle
 *   4. Renders detail href /admin/users/[id] correctly
 *   5. Fires navigate (router.push) for role / status / pagination controls
 *   6. Renders MantineDataTableToCards with correct columns + row data
 *   7. Applies rowClassName for loading state
 *
 * Planted-violation proof:
 *   Drop the `await toggleUserVerified(...)` call from the verify handler
 *   → test "verify button calls toggleUserVerified with correct args" FAILS
 *   (mockToggleUserVerified never called → expect.toHaveBeenCalledWith fails).
 *
 * Registry: toggleUserVerified / admin-users-list row added to docs/critical-flow-registry.md
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import type { AdminUser, VerifiedAgent } from '../AdminUsersTable'

// ── Server action mock ────────────────────────────────────────────────────────

const mockToggleUserVerified = vi.fn()
vi.mock('@/modules/admin/actions', () => ({
  toggleUserVerified: (...args: unknown[]) => mockToggleUserVerified(...args),
}))

// ── Next.js mocks ─────────────────────────────────────────────────────────────

const mockRouterPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => '/admin/users',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))

// ── i18n mock ─────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}))

// ── Toast mock ────────────────────────────────────────────────────────────────

const mockToastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}))

// ── Lucide icons (stubs) ──────────────────────────────────────────────────────

vi.mock('lucide-react', () => ({
  ShieldCheck: () => React.createElement('span', null, 'shield-check'),
  ShieldOff: () => React.createElement('span', null, 'shield-off'),
  Loader2: () => React.createElement('span', null, 'loader2'),
  MapPin: () => React.createElement('span', null, 'map-pin'),
  Search: () => React.createElement('span', null, 'search'),
  ChevronRight: () => React.createElement('span', null, 'chevron-right'),
}))

// ── Formatters mock ───────────────────────────────────────────────────────────

vi.mock('@/lib/formatters', () => ({
  formatDate: (date: string) => date.slice(0, 10),
}))

// ── Mantine hooks mock ────────────────────────────────────────────────────────
// Controls isMobile state; mock returns false (desktop) by default.

const mockUseMediaQuery = vi.fn().mockReturnValue(false)
vi.mock('@mantine/hooks', () => ({
  useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
}))

// ── Mantine core mock — renders as semantic HTML ──────────────────────────────
// Compound components (Tabs) bridge onChange via module-level context ref.

const tabContextRef: { onChange: ((val: string) => void) | null } = { onChange: null }

vi.mock('@mantine/core', () => {
  // Stack / Group / Text
  const Stack = ({ children, ...p }: any) => React.createElement('div', { 'data-mantine': 'stack', ...p }, children)
  const Group = ({ children, ...p }: any) => React.createElement('div', { 'data-mantine': 'group', ...p }, children)
  const Text = ({ children, ...p }: any) => React.createElement('span', { 'data-mantine': 'text', ...p }, children)

  // Badge
  const Badge = ({ children, color, ...p }: any) =>
    React.createElement('span', { 'data-testid': 'badge', 'data-color': color, ...p }, children)

  // Avatar
  const Avatar = ({ children, src, ...p }: any) =>
    React.createElement('div', { 'data-testid': 'avatar', 'data-src': src, ...p }, children)

  // Loader
  const Loader = ({ size }: any) =>
    React.createElement('span', { 'data-testid': 'loader', 'data-size': size })

  // Button — convert Mantine fullWidth prop to style so tests can assert it
  const Button = ({ children, onClick, disabled, fullWidth, ...p }: any) =>
    React.createElement('button', { onClick, disabled, type: 'button', style: fullWidth ? { width: '100%' } : undefined, ...p }, children)

  // ActionIcon
  const ActionIcon = ({ children, onClick, title, ...p }: any) =>
    React.createElement('button', { onClick, title, type: 'button', ...p }, children)

  // TextInput
  const TextInput = ({ value, onChange, placeholder, ...p }: any) =>
    React.createElement('input', { value, onChange, placeholder, type: 'text', ...p })

  // Tabs compound component with onChange bridging
  function Tabs({ children, value, onChange }: any) {
    tabContextRef.onChange = onChange
    return React.createElement('div', { 'data-testid': 'tabs', 'data-value': value }, children)
  }
  const TabsList = ({ children }: any) => React.createElement('div', { 'data-testid': 'tabs-list' }, children)
  const TabsTab = ({ children, value: tabVal }: any) =>
    React.createElement('button', {
      type: 'button',
      'data-testid': `tab-${tabVal}`,
      onClick: () => tabContextRef.onChange?.(tabVal),
    }, children)
  const TabsPanel = ({ children }: any) => React.createElement('div', null, children)
  Tabs.List = TabsList
  Tabs.Tab = TabsTab
  Tabs.Panel = TabsPanel

  // SegmentedControl — renders as <select> so fireEvent.change can drive onChange
  const SegmentedControl = ({ data, value, onChange, ...props }: any) =>
    React.createElement('select', {
      value,
      onChange: (e: any) => onChange?.(e.target.value),
      ...props,
    },
      (data as Array<{ value: string; label: string }>).map((d) =>
        React.createElement('option', { key: d.value, value: d.value }, d.label),
      ),
    )

  // ScrollArea — transparent wrapper
  const ScrollArea = ({ children, ...props }: any) =>
    React.createElement('div', { 'data-mantine': 'scroll-area', ...props }, children)

  // Box
  const Box = ({ children, ...props }: any) =>
    React.createElement('div', props, children)

  // Divider
  const Divider = (props: any) => React.createElement('hr', { 'data-mantine': 'divider', ...props })

  return { Stack, Group, Text, Badge, Avatar, Loader, Button, ActionIcon, TextInput, Tabs, SegmentedControl, ScrollArea, Box, Divider }
})

// ── MantineDataTableToCards mock ──────────────────────────────────────────────
// Renders column content AND card.actions so both table and card-actions paths are queryable.
// card.actions are rendered before columns inside each row (card-actions-{id} container).

vi.mock('@/design-system/mantine/patterns', () => ({
  MantineDataTableToCards: ({ columns, rows, emptyLabel, rowClassName, card }: {
    columns: Array<{ key: string; label: string; render?: (row: any) => React.ReactNode }>
    rows: any[]
    emptyLabel?: string
    rowClassName?: (row: any) => string
    card?: { actions?: (row: any) => React.ReactNode; [k: string]: unknown }
  }) => {
    if (rows.length === 0) {
      return React.createElement('div', { 'data-testid': 'empty-state' }, emptyLabel)
    }
    return React.createElement('div', { 'data-testid': 'data-table' },
      rows.map((row: any) =>
        React.createElement('div', {
          key: row.id,
          'data-testid': `row-${row.id}`,
          className: rowClassName?.(row) ?? '',
        },
          // Render card.actions first (card anatomy path)
          card?.actions
            ? React.createElement('div', { 'data-testid': `card-actions-${row.id}` }, card.actions(row))
            : null,
          // Always render column cells (desktop/generic path)
          columns.map((col) =>
            React.createElement('div', { key: col.key, 'data-testid': `cell-${row.id}-${col.key}` },
              col.render ? col.render(row) : String(row[col.key] ?? ''),
            ),
          ),
        ),
      ),
    )
  },
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_USER: AdminUser = {
  id: 'usr-001',
  public_id: 101,
  name: 'Arben',
  last_name: 'Krasniqi',
  phone: '+355691234567',
  role: 'agent',
  user_type: 'agent',
  is_verified: true,
  company_name: 'Tirana RE',
  status: 'active',
  location_request: null,
  created_at: '2026-01-15T09:00:00Z',
  last_seen_at: null,
  avatar_url: null,
}

const UNVERIFIED_USER: AdminUser = {
  ...BASE_USER,
  id: 'usr-002',
  name: 'Oksana',
  last_name: 'Petrenko',
  is_verified: false,
  status: 'active',
}

const VERIFIED_AGENT: VerifiedAgent = {
  id: 'usr-001',
  name: 'Arben Krasniqi',
  company_name: 'Tirana RE',
  created_at: '2026-01-15T09:00:00Z',
}

const DEFAULT_PROPS = {
  users: [BASE_USER, UNVERIFIED_USER],
  total: 2,
  page: 1,
  perPage: 25,
  activeRole: '',
  activeStatus: '',
  searchQuery: '',
  activeTab: 'all',
  verifiedAgents: [VERIFIED_AGENT],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockToggleUserVerified.mockResolvedValue(undefined)
  mockUseMediaQuery.mockReturnValue(false) // desktop default
  tabContextRef.onChange = null
})

// ── Core behavior: toggleUserVerified ─────────────────────────────────────────

describe('AdminUsersTable — verify/revoke handler (Task 483)', () => {
  it('revoke button calls toggleUserVerified(userId, false) for verified user + shows toast', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    // Find the revoke button inside the verified user's row cell
    const verifiedRow = container.querySelector('[data-testid="row-usr-001"]')!
    expect(verifiedRow).toBeTruthy()
    const revokeBtn = verifiedRow.querySelector('[data-testid="revoke-btn"]') as HTMLButtonElement
    expect(revokeBtn).toBeTruthy()

    await act(async () => { fireEvent.click(revokeBtn) })

    expect(mockToggleUserVerified).toHaveBeenCalledWith('usr-001', false)
    expect(mockToastSuccess).toHaveBeenCalledWith('revoke_success')
  })

  it('verify button calls toggleUserVerified(userId, true) for unverified user + shows toast', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const unverifiedRow = container.querySelector('[data-testid="row-usr-002"]')!
    expect(unverifiedRow).toBeTruthy()
    const verifyBtn = unverifiedRow.querySelector('[data-testid="verify-btn"]') as HTMLButtonElement
    expect(verifyBtn).toBeTruthy()

    await act(async () => { fireEvent.click(verifyBtn) })

    expect(mockToggleUserVerified).toHaveBeenCalledWith('usr-002', true)
    expect(mockToastSuccess).toHaveBeenCalledWith('verify_success')
  })

  it('server error on toggle → no success toast (error path preserved)', async () => {
    mockToggleUserVerified.mockRejectedValue(new Error('forbidden'))
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const revokeBtn = container.querySelector('[data-testid="revoke-btn"]') as HTMLButtonElement
    try {
      await act(async () => { fireEvent.click(revokeBtn) })
    } catch { /* expected rejection */ }

    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

// ── Detail link href ───────────────────────────────────────────────────────────

describe('AdminUsersTable — detail links', () => {
  it('user detail link href is /admin/users/[id]', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const detailLinks = container.querySelectorAll('[data-testid="user-detail-link"]')
    expect(detailLinks.length).toBeGreaterThan(0)
    expect(detailLinks[0].getAttribute('href')).toBe('/admin/users/usr-001')
  })
})

// ── Navigation: tab / role / status / pagination ───────────────────────────────

describe('AdminUsersTable — navigation via navigate()', () => {
  it('clicking verified tab calls router.push with tab=verified', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const verifiedTabBtn = document.querySelector('[data-testid="tab-verified"]') as HTMLButtonElement
    expect(verifiedTabBtn).toBeTruthy()
    fireEvent.click(verifiedTabBtn)

    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('tab=verified'))
  })

  it('clicking all tab calls router.push without tab param', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    render(React.createElement(AdminUsersTable, { ...DEFAULT_PROPS, activeTab: 'verified' }))

    const allTabBtn = document.querySelector('[data-testid="tab-all"]') as HTMLButtonElement
    fireEvent.click(allTabBtn)

    // tab=all is removed from URL when navigating to the default tab
    const call = mockRouterPush.mock.calls[0]?.[0] ?? ''
    expect(call).not.toContain('tab=all')
  })

  it('role SegmentedControl change calls router.push with role=agent', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const roleCtrl = container.querySelector('[data-testid="role-segmented-control"]') as HTMLSelectElement
    expect(roleCtrl).toBeTruthy()
    fireEvent.change(roleCtrl, { target: { value: 'agent' } })

    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('role=agent'))
  })

  it('status SegmentedControl change calls router.push with status=blocked', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const statusCtrl = container.querySelector('[data-testid="status-segmented-control"]') as HTMLSelectElement
    expect(statusCtrl).toBeTruthy()
    fireEvent.change(statusCtrl, { target: { value: 'blocked' } })

    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('status=blocked'))
  })

  it('next page button calls router.push with page=2', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, { ...DEFAULT_PROPS, total: 50, perPage: 10 }))

    const nextBtn = container.querySelector('[data-testid="next-page"]') as HTMLButtonElement
    expect(nextBtn).toBeTruthy()
    expect(nextBtn.disabled).toBe(false)
    fireEvent.click(nextBtn)

    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('page=2'))
  })

  it('prev page button is disabled on page 1', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, { ...DEFAULT_PROPS, total: 50, perPage: 10 }))

    const prevBtn = container.querySelector('[data-testid="prev-page"]') as HTMLButtonElement
    expect(prevBtn.disabled).toBe(true)
  })

  it('next page button is disabled on last page', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    // total=20, perPage=10 → totalPages=2; page=2 is the last page → next disabled
    const { container } = render(React.createElement(AdminUsersTable, { ...DEFAULT_PROPS, total: 20, perPage: 10, page: 2 }))

    const nextBtn = container.querySelector('[data-testid="next-page"]') as HTMLButtonElement
    expect(nextBtn).toBeTruthy()
    expect(nextBtn.disabled).toBe(true)
  })
})

// ── Verified tab — revoke in verified agents list ──────────────────────────────

describe('AdminUsersTable — verified tab revoke', () => {
  it('revoke in verified agents tab calls toggleUserVerified(userId, false)', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, {
      ...DEFAULT_PROPS,
      activeTab: 'verified',
    }))

    const revokeBtn = container.querySelector('[data-testid="revoke-btn"]') as HTMLButtonElement
    expect(revokeBtn).toBeTruthy()

    await act(async () => { fireEvent.click(revokeBtn) })

    expect(mockToggleUserVerified).toHaveBeenCalledWith('usr-001', false)
    expect(mockToastSuccess).toHaveBeenCalledWith('revoke_success')
  })
})

// ── Card actions (mobile card anatomy path) ────────────────────────────────────
// The MantineDataTableToCards mock renders card.actions in card-actions-{id} container.

describe('AdminUsersTable — card actions (mobile card anatomy)', () => {
  it('card actions revoke-btn calls toggleUserVerified(userId, false) for verified user', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const cardActions = container.querySelector('[data-testid="card-actions-usr-001"]')!
    expect(cardActions).toBeTruthy()
    const revokeBtn = cardActions.querySelector('[data-testid="revoke-btn"]') as HTMLButtonElement
    expect(revokeBtn).toBeTruthy()

    await act(async () => { fireEvent.click(revokeBtn) })

    expect(mockToggleUserVerified).toHaveBeenCalledWith('usr-001', false)
    expect(mockToastSuccess).toHaveBeenCalledWith('revoke_success')
  })

  it('card actions user-detail-link has correct href', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const cardActions = container.querySelector('[data-testid="card-actions-usr-001"]')!
    expect(cardActions).toBeTruthy()
    const detailLink = cardActions.querySelector('[data-testid="user-detail-link"]') as HTMLAnchorElement
    expect(detailLink).toBeTruthy()
    expect(detailLink.getAttribute('href')).toBe('/admin/users/usr-001')
  })
})

// ── Loading state ─────────────────────────────────────────────────────────────

describe('AdminUsersTable — loading state', () => {
  it('row gets opacity-50 class while toggle is in flight', async () => {
    let resolveAction!: () => void
    mockToggleUserVerified.mockReturnValue(new Promise<void>(res => { resolveAction = res }))

    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const revokeBtn = container.querySelector('[data-testid="revoke-btn"]') as HTMLButtonElement

    // Start the action (don't await it yet)
    act(() => { fireEvent.click(revokeBtn) })

    // Row should have opacity-50 while loading
    const row = container.querySelector('[data-testid="row-usr-001"]')!
    expect(row.className).toContain('opacity-50')

    // Resolve the action
    await act(async () => { resolveAction() })

    // Row class should clear after loading
    expect(row.className).not.toContain('opacity-50')
  })
})

// ── Mobile vs desktop layout ───────────────────────────────────────────────────

describe('AdminUsersTable — responsive layout (via useMediaQuery mock)', () => {
  it('role SegmentedControl renders and includes all role options', async () => {
    // SegmentedControl is always rendered regardless of isMobile;
    // overflow handled by ScrollArea scrollbars="x" at <40em.
    mockUseMediaQuery.mockReturnValue(false)

    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    const roleCtrl = container.querySelector('[data-testid="role-segmented-control"]') as HTMLSelectElement
    expect(roleCtrl).toBeTruthy()
    const options = Array.from(roleCtrl.querySelectorAll('option')).map(o => (o as HTMLOptionElement).value)
    // '' (all) + user + agent + moderator + admin = 5
    expect(options).toContain('')
    expect(options).toContain('agent')
    expect(options).toContain('moderator')
    expect(options).toContain('admin')
  })

  it('on mobile (isMobile=true) pagination buttons are full-width', async () => {
    mockUseMediaQuery.mockReturnValue(true)

    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, {
      ...DEFAULT_PROPS, total: 50, perPage: 10,
    }))

    const nextBtn = container.querySelector('[data-testid="next-page"]') as HTMLButtonElement
    expect(nextBtn).toBeTruthy()
    // fullWidth=true on mobile → converted to style.width='100%' in Button mock
    expect(nextBtn.style.width).toBe('100%')
  })
})

// ── Empty state ───────────────────────────────────────────────────────────────

describe('AdminUsersTable — empty state', () => {
  it('renders empty-state when no users', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, {
      ...DEFAULT_PROPS,
      users: [],
      total: 0,
    }))

    expect(container.querySelector('[data-testid="empty-state"]')).toBeTruthy()
  })
})

// ── Data rendering ────────────────────────────────────────────────────────────

describe('AdminUsersTable — data rendering', () => {
  it('renders user rows from the users prop', async () => {
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, DEFAULT_PROPS))

    expect(container.querySelector('[data-testid="row-usr-001"]')).toBeTruthy()
    expect(container.querySelector('[data-testid="row-usr-002"]')).toBeTruthy()
  })

  it('location request badge renders in user row when location_request is set', async () => {
    const userWithLocationRequest: AdminUser = {
      ...UNVERIFIED_USER,
      id: 'usr-003',
      location_request: { city: 'Tirana' },
    }
    const { AdminUsersTable } = await import('../AdminUsersTable')
    const { container } = render(React.createElement(AdminUsersTable, {
      ...DEFAULT_PROPS,
      users: [userWithLocationRequest],
      total: 1,
    }))

    const row = container.querySelector('[data-testid="row-usr-003"]')!
    expect(row.textContent).toContain('location_request_badge')
  })
})
