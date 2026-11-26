/**
 * AdminPermissionsManager — RTL smoke test (Task 892, T1–T5)
 *
 * Renders the REAL container (which renders `AdminPermissionsView` on canonical Mantine) with the real `en`
 * messages, `setModeratorPermission` and the toast mocked, and asserts observable behavior:
 *   T1. Toggling `users.create` calls `setModeratorPermission('users.create', true)`; on success the switch is
 *       checked and `save_success` fires. While the action is pending the switch is disabled.
 *   T2. `{ noOp: true }` → `already_granted` info toast, the switch is unchanged.
 *   T3. `{ error: 'forbidden' }` → `error_forbidden` toast.
 *   T4. Every permission switch is reachable by its accessible name.
 *   T5. `events: null` shows `audit_unavailable`.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task892/):
 *   P1 — the container stops passing `savingKey` → the disabled-while-pending assertion in T1 fails.
 *   P2 — the View drops `aria-label` from `Switch` → T4 fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import sqMessages from '../../../../messages/sq.json'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'
import { ADMIN_PAGES, ADMIN_PAGE_KEYS, type AccessKey } from '@/lib/auth/adminPages'
import type { PermissionData, PermissionEvent } from '@/modules/admin/actions/permissions'
import { AdminPermissionsManager } from '../AdminPermissionsManager'
import { AdminPermissionsView } from '../AdminPermissionsView'

// ── Server action + toast mocks ───────────────────────────────────────────────

const mockSetPermission = vi.fn()
vi.mock('@/modules/admin/actions/permissions', () => ({
  setModeratorPermission: (...args: unknown[]) => mockSetPermission(...args),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastInfo = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  },
}))

const t = messages.admin.permissions
const keyLabel = (key: PermissionKey) => t.keys[key.replace('.', '_') as keyof typeof t.keys]

// Task 1007: a page switch is labelled with the page's sidebar label (`admin.sidebar.<labelKey>`)
const pageLabel = (labelKey: string) => messages.admin.sidebar[labelKey as keyof typeof messages.admin.sidebar]

const PERMISSIONS = Object.fromEntries(
  [...PERMISSION_KEYS, ...ADMIN_PAGE_KEYS].map(k => [k, { allowed: false, updated_at: null, updated_by_name: null }]),
) as Record<AccessKey, PermissionData>

const EVENTS: PermissionEvent[] = []

function renderManager(events: PermissionEvent[] | null = EVENTS) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminPermissionsManager permissions={PERMISSIONS} events={events} updatedDates={{}} eventDates={{}} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
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
  mockSetPermission.mockResolvedValue({})
})

describe('AdminPermissionsManager — toggle (Task 892)', () => {
  it('T1: toggling users.create saves, checks the switch and toasts success; switch is disabled while pending', async () => {
    let resolveAction!: (v: object) => void
    mockSetPermission.mockReturnValue(new Promise(res => { resolveAction = res }))
    renderManager()

    const sw = screen.getByRole('switch', { name: keyLabel('users.create') }) as HTMLInputElement
    expect(sw.checked).toBe(false)
    fireEvent.click(sw)

    expect(mockSetPermission).toHaveBeenCalledWith('users.create', true)
    await waitFor(() => expect(sw.disabled).toBe(true))

    resolveAction({})
    await waitFor(() => expect(sw.checked).toBe(true))
    expect(sw.disabled).toBe(false)
    expect(mockToastSuccess).toHaveBeenCalledWith(t.save_success)
  })

  it('T2: a no-op result shows the info toast and leaves the switch unchanged', async () => {
    mockSetPermission.mockResolvedValue({ noOp: true })
    renderManager()

    const sw = screen.getByRole('switch', { name: keyLabel('users.create') }) as HTMLInputElement
    fireEvent.click(sw)

    await waitFor(() => expect(mockToastInfo).toHaveBeenCalledWith(t.already_granted))
    expect(sw.checked).toBe(false)
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('T3: a forbidden result shows the forbidden error toast', async () => {
    mockSetPermission.mockResolvedValue({ error: 'forbidden' })
    renderManager()

    fireEvent.click(screen.getByRole('switch', { name: keyLabel('users.create') }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.error_forbidden))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

describe('AdminPermissionsManager — page switches (Task 1007)', () => {
  it('T8: toggling a page switch calls setModeratorPermission with the page key, then checks the switch and counts it among the pages', async () => {
    renderManager()
    const sw = screen.getByRole('switch', { name: pageLabel('item_users') }) as HTMLInputElement
    expect(sw.checked).toBe(false)
    fireEvent.click(sw)

    expect(mockSetPermission).toHaveBeenCalledWith('page.users', true)
    await waitFor(() => expect(sw.checked).toBe(true))
    expect(mockToastSuccess).toHaveBeenCalledWith(t.save_success)
    expect(document.body.textContent).toContain(`1 of ${ADMIN_PAGE_KEYS.length} allowed`)
    expect(document.body.textContent, 'the action count is not touched').toContain(`0 of ${PERMISSION_KEYS.length} allowed`)
  })
})

describe('AdminPermissionsManager — view states (Task 892)', () => {
  it('T4: every permission switch is reachable by its accessible name', () => {
    renderManager()
    for (const key of PERMISSION_KEYS) {
      expect(screen.getByRole('switch', { name: keyLabel(key) })).toBeTruthy()
    }
    expect(screen.getAllByRole('switch')).toHaveLength(PERMISSION_KEYS.length + ADMIN_PAGE_KEYS.length)
  })

  it('T6 (Task 1007): the section "Admin panel pages" has fifteen switches, each reachable by its sidebar label, with its path', () => {
    renderManager()
    expect(screen.getByText(t.pages_section_title)).toBeTruthy()
    expect(ADMIN_PAGES).toHaveLength(15)
    for (const page of ADMIN_PAGES) {
      expect(screen.getByRole('switch', { name: pageLabel(page.labelKey) }), `${page.key}: ${pageLabel(page.labelKey)}`).toBeTruthy()
      expect(screen.getAllByText(page.paths[0]).length, `${page.key}: its path is shown`).toBeGreaterThan(0)
    }
  })

  it('T7 (Task 1007): the counts show the actions and the pages separately', () => {
    renderManager()
    const text = document.body.textContent ?? ''
    expect(text).toContain(`0 of ${PERMISSION_KEYS.length} allowed`)
    expect(text).toContain(`0 of ${ADMIN_PAGE_KEYS.length} allowed`)
  })

  it('T5: a failed audit read shows the unavailable alert', () => {
    renderManager(null)
    expect(screen.getByText(t.audit_unavailable)).toBeTruthy()
  })
})

describe('AdminPermissionsView — dates come from the server (Task 988 R5-1)', () => {
  it('T9: in `sq` the view renders the passed date strings and never formats a date in the browser', () => {
    // Chrome has no Albanian date data (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]`), so a date formatted in the browser differs from the server's text: React #418
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl.DateTimeFormat called in the browser')
    })
    try {
      const updatedAt = '2026-11-20T14:05:00Z'
      const permissions = Object.fromEntries(
        [...PERMISSION_KEYS, ...ADMIN_PAGE_KEYS].map(k => [k, { allowed: false, updated_at: updatedAt, updated_by_name: 'Admin' }]),
      ) as Record<AccessKey, PermissionData>
      const updatedDates = Object.fromEntries(
        [...PERMISSION_KEYS, ...ADMIN_PAGE_KEYS].map(k => [k, '20 nën 2026']),
      ) as Partial<Record<AccessKey, string>>
      const events: PermissionEvent[] = [{
        id: 'ev-1',
        role: 'moderator',
        permission_key: 'reports.manage',
        old_allowed: false,
        new_allowed: true,
        actor_user_id: 'admin-1',
        actor_name: 'Admin',
        created_at: updatedAt,
      }]
      render(
        <NextIntlClientProvider locale="sq" messages={sqMessages}>
          <MantineProvider theme={theme} env="test">
            <AdminPermissionsView
              permissions={permissions}
              events={events}
              updatedDates={updatedDates}
              eventDates={{ 'ev-1': '20.11.2026, 14:05' }}
              allowedCount={0}
              allowedPagesCount={0}
              savingKey={null}
              onToggle={() => {}}
            />
          </MantineProvider>
        </NextIntlClientProvider>,
      )
      const text = document.body.textContent ?? ''
      expect(text.split('20 nën 2026').length - 1, 'every key shows its passed date').toBe(PERMISSION_KEYS.length + ADMIN_PAGE_KEYS.length)
      expect(text, 'the event shows its passed date').toContain('20.11.2026, 14:05')
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })
})
