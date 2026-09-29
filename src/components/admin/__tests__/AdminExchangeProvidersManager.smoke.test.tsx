/**
 * AdminExchangeProvidersManager — RTL smoke test (Task 874, T1)
 *
 * Renders the REAL container (which renders `AdminExchangeProvidersView` / `ProviderFormDialogView`)
 * with `FIXTURE_PROVIDERS` and the real `en` messages, and asserts on observable behavior:
 *   1. Create: API-key field is masked, its reveal toggle is labelled and flips the input type,
 *      submit calls `createExchangeProvider` once with the typed payload.
 *   2. Validation: empty name → `toast.error(error_name_required)`, no action called.
 *   3. Delete: the confirm shows the provider name; confirming calls `deleteExchangeProvider(id)`
 *      and the row disappears.
 *   4. Toggle: calls `toggleExchangeProviderEnabled(id, !is_enabled)`.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task874/):
 *   P1 — drop `api_key` from the submitted input in the container → case 1 fails.
 *   P2 — remove `visibilityToggleButtonProps` in ProviderFormDialogView → case 1's toggle-name assertion fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { FIXTURE_PROVIDERS } from '@/stories/fixtures/admin.fixtures'
import { AdminExchangeProvidersManager } from '../AdminExchangeProvidersManager'

// ── Server actions + toast mocks ──────────────────────────────────────────────

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockToggle = vi.fn()
vi.mock('@/modules/admin/actions/exchangeProviders', () => ({
  createExchangeProvider: (...args: unknown[]) => mockCreate(...args),
  updateExchangeProvider: (...args: unknown[]) => mockUpdate(...args),
  deleteExchangeProvider: (...args: unknown[]) => mockDelete(...args),
  toggleExchangeProviderEnabled: (...args: unknown[]) => mockToggle(...args),
}))

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

const t = messages.admin.currency.providers

function renderManager() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminExchangeProvidersManager initialProviders={FIXTURE_PROVIDERS} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
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
  mockCreate.mockResolvedValue({ id: 99 })
  mockUpdate.mockResolvedValue({})
  mockDelete.mockResolvedValue({})
  mockToggle.mockResolvedValue({})
})

describe('AdminExchangeProvidersManager (T1)', () => {
  it('case 1 — create: masked API key with a labelled reveal toggle, submit sends the typed payload', async () => {
    renderManager()

    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')

    const apiKey = within(dialog).getByLabelText(t.api_key) as HTMLInputElement
    expect(apiKey.type).toBe('password')

    // Mantine's PasswordInput toggles on mouse-down (a click alone never fires it).
    fireEvent.mouseDown(within(dialog).getByRole('button', { name: messages.common.show_password }))
    expect(apiKey.type).toBe('text')
    expect(within(dialog).getByRole('button', { name: messages.common.hide_password })).toBeTruthy()

    fireEvent.change(within(dialog).getByLabelText(t.name), { target: { value: 'NewProvider' } })
    fireEvent.change(within(dialog).getByLabelText(t.endpoint), { target: { value: 'https://new.example/rates' } })
    fireEvent.change(apiKey, { target: { value: 'secret-key' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate).toHaveBeenCalledWith({
      name: 'NewProvider',
      endpoint_url: 'https://new.example/rates',
      api_key: 'secret-key',
      refresh_interval_min: 60,
      priority: 10,
      mode: 'auto',
      notes: undefined,
    })
  })

  it('case 2 — validation: empty name shows the required-name error and calls no action', async () => {
    renderManager()

    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))

    expect(mockToastError).toHaveBeenCalledWith(t.error_name_required)
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('case 3 — delete: confirm shows the provider name; confirming deletes it and removes the row', async () => {
    renderManager()
    const target = FIXTURE_PROVIDERS[0]

    fireEvent.click(screen.getAllByRole('button', { name: t.delete })[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(target.name)).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: messages.common.delete }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(target.id))
    await waitFor(() => expect(screen.queryByText(target.name)).toBeNull())
  })

  it('case 4 — toggle: calls toggleExchangeProviderEnabled with the flipped state', async () => {
    renderManager()
    const target = FIXTURE_PROVIDERS[0] // enabled → the toggle action is labelled "Disable"

    fireEvent.click(screen.getAllByRole('button', { name: t.disable })[0])

    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith(target.id, !target.is_enabled))
  })
})
