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
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'
import type { PermissionData, PermissionEvent } from '@/modules/admin/actions/permissions'
import { AdminPermissionsManager } from '../AdminPermissionsManager'

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

const PERMISSIONS = Object.fromEntries(
  PERMISSION_KEYS.map(k => [k, { allowed: false, updated_at: null, updated_by_name: null }]),
) as Record<PermissionKey, PermissionData>

const EVENTS: PermissionEvent[] = []

function renderManager(events: PermissionEvent[] | null = EVENTS) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminPermissionsManager permissions={PERMISSIONS} events={events} />
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

describe('AdminPermissionsManager — view states (Task 892)', () => {
  it('T4: every permission switch is reachable by its accessible name', () => {
    renderManager()
    for (const key of PERMISSION_KEYS) {
      expect(screen.getByRole('switch', { name: keyLabel(key) })).toBeTruthy()
    }
    expect(screen.getAllByRole('switch')).toHaveLength(PERMISSION_KEYS.length)
  })

  it('T5: a failed audit read shows the unavailable alert', () => {
    renderManager(null)
    expect(screen.getByText(t.audit_unavailable)).toBeTruthy()
  })
})
