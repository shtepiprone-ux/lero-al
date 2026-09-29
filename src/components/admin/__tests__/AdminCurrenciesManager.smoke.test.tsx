/**
 * AdminCurrenciesManager — RTL smoke test (Task 877, T1)
 *
 * Renders the REAL container (which renders `AdminCurrenciesView`, `CurrencyDetailDialogView` and
 * `CurrencyFormDialogView` on the shared `AdminTable` adapter) with `FIXTURE_CURRENCIES` and the real `en`
 * messages, and asserts on observable behavior:
 *   1. Create: the typed payload reaches `createCurrency` (code upper-cased) and the new row appears.
 *   2. Validation: empty code / empty symbol → the required toasts, no action called.
 *   3. Duplicate code: `duplicate_code` → `error_code_duplicate` toast.
 *   4. Toggle: `toggleCurrencyActive(id, !is_active)`; deactivating the default → `error_default_required`.
 *   5. Set default: `setDefaultCurrency(id)` and the "default" badge moves to that row.
 *   6. Delete: the confirm names the currency; confirming calls `deleteCurrency(id)` and removes the row;
 *      a `default_currency` refusal → `delete_blocked` toast.
 *   7. Detail: the footer actions follow the default/active conditions; search with no match → empty text.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task877/):
 *   P3 — drop `setDefaultCurrency`'s state update in the container → case 5 fails.
 *   P4 — drop the `default_currency` mapping in `handleDelete` → case 6's refusal assertion fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { FIXTURE_CURRENCIES } from '@/stories/fixtures/admin.fixtures'
import { AdminCurrenciesManager } from '../AdminCurrenciesManager'

// ── Server actions + toast mocks ──────────────────────────────────────────────

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockToggle = vi.fn()
const mockSetDefault = vi.fn()
vi.mock('@/modules/admin/actions/currencies', () => ({
  createCurrency: (...args: unknown[]) => mockCreate(...args),
  updateCurrency: (...args: unknown[]) => mockUpdate(...args),
  deleteCurrency: (...args: unknown[]) => mockDelete(...args),
  toggleCurrencyActive: (...args: unknown[]) => mockToggle(...args),
  setDefaultCurrency: (...args: unknown[]) => mockSetDefault(...args),
}))

const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

const t = messages.admin.currency.currencies
// FIXTURE_CURRENCIES: [0] ALL (default, active) · [1] EUR (active) · [2] USD (inactive).
const [ALL, EUR, USD] = FIXTURE_CURRENCIES

function renderManager() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminCurrenciesManager initialCurrencies={FIXTURE_CURRENCIES} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

/** Opens a currency's detail dialog through its code button and returns the dialog. */
async function openDetail(code: string) {
  fireEvent.click(screen.getAllByRole('button', { name: code })[0])
  return screen.findByRole('dialog')
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
  mockSetDefault.mockResolvedValue({})
})

describe('AdminCurrenciesManager (T1)', () => {
  it('case 1 — create: submit sends the typed payload (code upper-cased) and the new row appears', async () => {
    renderManager()

    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(t.code), { target: { value: 'chf' } })
    fireEvent.change(within(dialog).getByLabelText(t.symbol), { target: { value: 'Fr' } })
    fireEvent.change(within(dialog).getByLabelText(t.name_en), { target: { value: 'Swiss Franc' } })
    fireEvent.change(within(dialog).getByLabelText(t.decimals), { target: { value: '2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate).toHaveBeenCalledWith({
      code: 'CHF',
      symbol: 'Fr',
      name_sq: '',
      name_en: 'Swiss Franc',
      name_uk: '',
      name_it: '',
      decimals: 2,
    })
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'CHF' }).length).toBeGreaterThan(0))
    expect(mockToastSuccess).toHaveBeenCalledWith(t.success_created)
  })

  it('case 2 — validation: empty code, then empty symbol, show the required errors and call no action', async () => {
    renderManager()

    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))
    expect(mockToastError).toHaveBeenLastCalledWith(t.error_code_required)

    fireEvent.change(within(dialog).getByLabelText(t.code), { target: { value: 'CHF' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))
    expect(mockToastError).toHaveBeenLastCalledWith(t.error_symbol_required)

    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('case 3 — duplicate code: the duplicate_code refusal shows error_code_duplicate', async () => {
    mockCreate.mockResolvedValue({ error: 'Currency code already exists', code: 'duplicate_code' })
    renderManager()

    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(t.code), { target: { value: 'EUR' } })
    fireEvent.change(within(dialog).getByLabelText(t.symbol), { target: { value: '€' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.error_code_duplicate))
  })

  it('case 4 — toggle: flips the state; deactivating the default shows error_default_required', async () => {
    renderManager()

    const eurDialog = await openDetail(EUR.code)
    fireEvent.click(within(eurDialog).getByRole('button', { name: t.deactivate }))
    await waitFor(() => expect(mockToggle).toHaveBeenCalledWith(EUR.id, !EUR.is_active))
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(t.success_deactivated))

    mockToggle.mockResolvedValueOnce({ error: 'Cannot deactivate the default currency', code: 'default_currency' })
    const allDialog = await openDetail(ALL.code)
    fireEvent.click(within(allDialog).getByRole('button', { name: t.deactivate }))
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.error_default_required))
  })

  it('case 5 — set default: calls setDefaultCurrency and the default badge moves to that row', async () => {
    renderManager()
    const rowOf = (code: string) => screen.getAllByRole('button', { name: code })[0].closest('tr') as HTMLElement
    expect(within(rowOf(ALL.code)).queryByText(t.default_badge)).not.toBeNull()
    expect(within(rowOf(EUR.code)).queryByText(t.default_badge)).toBeNull()

    const dialog = await openDetail(EUR.code)
    fireEvent.click(within(dialog).getByRole('button', { name: t.set_default }))

    await waitFor(() => expect(mockSetDefault).toHaveBeenCalledWith(EUR.id))
    await waitFor(() => expect(within(rowOf(EUR.code)).queryByText(t.default_badge)).not.toBeNull())
    expect(within(rowOf(ALL.code)).queryByText(t.default_badge)).toBeNull()
  })

  it('case 6 — delete: the confirm names the currency, confirming removes the row; a default refusal shows delete_blocked', async () => {
    renderManager()

    const detail = await openDetail(USD.code)
    fireEvent.click(within(detail).getByRole('button', { name: t.delete }))
    const confirm = await screen.findByRole('dialog')
    expect(within(confirm).getByText(`${USD.code} — ${USD.name_en}`)).toBeTruthy()
    fireEvent.click(within(confirm).getByRole('button', { name: messages.common.delete }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(USD.id))
    await waitFor(() => expect(screen.queryAllByRole('button', { name: USD.code })).toHaveLength(0))

    mockDelete.mockResolvedValueOnce({ error: 'Cannot delete the default currency', code: 'default_currency' })
    const eurDetail = await openDetail(EUR.code)
    fireEvent.click(within(eurDetail).getByRole('button', { name: t.delete }))
    const eurConfirm = await screen.findByRole('dialog')
    fireEvent.click(within(eurConfirm).getByRole('button', { name: messages.common.delete }))
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(t.delete_blocked))
  })

  it('case 7 — detail: footer actions follow the default/active conditions; a search with no match shows the empty text', async () => {
    renderManager()

    const allDialog = await openDetail(ALL.code) // default: no "set default", no "delete"
    expect(within(allDialog).queryByRole('button', { name: t.set_default })).toBeNull()
    expect(within(allDialog).queryByRole('button', { name: t.delete })).toBeNull()
    // Revision 5: the footer's "Close" button is gone; the dialog closes with Escape.
    expect(within(allDialog).queryByRole('button', { name: messages.common.close })).toBeNull()
    fireEvent.keyDown(allDialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    const eurDialog = await openDetail(EUR.code) // active, not default: both actions
    expect(within(eurDialog).getByRole('button', { name: t.set_default })).toBeTruthy()
    expect(within(eurDialog).getByRole('button', { name: t.delete })).toBeTruthy()
    fireEvent.keyDown(eurDialog, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    fireEvent.change(screen.getByPlaceholderText(t.search_placeholder), { target: { value: 'zzz' } })
    expect(screen.getByText(t.empty)).toBeTruthy()
  })
})
