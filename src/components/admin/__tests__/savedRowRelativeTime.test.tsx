/**
 * Task 965 Revision 1, AC7 (R1-1, Review 1 F1) — a row saved in the browser reads "less than a minute ago" on a page that was rendered 12 minutes earlier.
 *
 * The three managers print `RelativeTime date={row timestamp} baseDate={now}`, where `now` is the instant the SERVER rendered the page (so the server HTML and the
 * browser's first render agree, error 418 otherwise). A row saved from the dialog gets `created_at` / `updated_at` from the BROWSER clock, so measured against the page's old
 * `now` it read "in 12 minutes". Each manager keeps the instant its relative times use in state, starting from the page's `now` (the hydrating render is unchanged),
 * and moves it to the saved row's own timestamp when the row is inserted or replaced.
 *
 * The clock is faked (`Date` only): the page `now` is 12 minutes before it, the server actions are mocks that answer success.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { AdminCompaniesManager } from '../AdminCompaniesManager'
import { AdminCurrenciesManager } from '../AdminCurrenciesManager'
import { AdminPropertyTypesManager } from '../AdminPropertyTypesManager'
import type { DBCurrency, DBPropertyType } from '@/types/database'

const mockCreateCompany = vi.fn()
const mockUpdateCompany = vi.fn()
vi.mock('@/modules/companies/actions', () => ({
  createCompanyAction: (...args: unknown[]) => mockCreateCompany(...args),
  updateCompanyAction: (...args: unknown[]) => mockUpdateCompany(...args),
  deleteCompanyAction: vi.fn(),
}))

const mockCreateCurrency = vi.fn()
const mockUpdateCurrency = vi.fn()
vi.mock('@/modules/admin/actions/currencies', () => ({
  createCurrency: (...args: unknown[]) => mockCreateCurrency(...args),
  updateCurrency: (...args: unknown[]) => mockUpdateCurrency(...args),
  deleteCurrency: vi.fn(),
  toggleCurrencyActive: vi.fn(),
  setDefaultCurrency: vi.fn(),
}))

const mockCreateType = vi.fn()
const mockUpdateType = vi.fn()
vi.mock('@/modules/admin/actions/propertyTypes', () => ({
  createPropertyType: (...args: unknown[]) => mockCreateType(...args),
  updatePropertyType: (...args: unknown[]) => mockUpdateType(...args),
  deletePropertyType: vi.fn(),
  togglePropertyTypeActive: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/admin/page',
  useSearchParams: () => new URLSearchParams(),
}))

/** The browser clock when the row is saved, and the instant the server rendered the page: 12 minutes earlier. */
const CLOCK = new Date('2026-11-12T10:12:00.000Z')
const PAGE_NOW = new Date(CLOCK.getTime() - 12 * 60 * 1000).toISOString()
const LONG_AGO = '2026-10-01T09:00:00.000Z'

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(CLOCK)
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  class IntersectionObserverStub { observe() {} unobserve() {} disconnect() {} }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
  mockCreateCompany.mockResolvedValue({ id: 'co-new' })
  mockUpdateCompany.mockResolvedValue({})
  mockCreateCurrency.mockResolvedValue({ id: 99 })
  mockUpdateCurrency.mockResolvedValue({})
  mockCreateType.mockResolvedValue({ id: 99 })
  mockUpdateType.mockResolvedValue({})
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="Europe/Tirane">
      <MantineProvider theme={theme} env="test">{children}</MantineProvider>
    </NextIntlClientProvider>
  )
}

/** Every relative time printed in the page: the text of each `<time>` element. */
const printedTimes = () => Array.from(document.body.querySelectorAll('time')).map(node => node.textContent ?? '')

function expectSavedRowReadsJustNow() {
  const printed = printedTimes()
  // never a time in the future: the page's old `now` against the browser clock's timestamp
  expect(printed.filter(text => /^in /.test(text))).toEqual([])
  expect(document.body.textContent).not.toContain('in 12 minutes')
  expect(printed.some(text => text === 'less than a minute ago')).toBe(true)
}

describe('Task 965 R1-1 AC7 — a row saved in the browser reads "less than a minute ago"', () => {
  it('the hydrating render is unchanged: the rows are measured against the page now (companies)', () => {
    render(
      <Providers>
        <AdminCompaniesManager companies={[{ id: 'co-1', name: 'Tirana Group', logo_url: null, created_at: PAGE_NOW, agentCount: 1 }]} now={PAGE_NOW} />
      </Providers>,
    )
    // a company created at the page instant reads "less than a minute ago" against the page instant, whatever the browser clock says
    expect(printedTimes()).toContain('less than a minute ago')
  })

  it('companies: a created company', async () => {
    render(
      <Providers>
        <AdminCompaniesManager companies={[{ id: 'co-1', name: 'Tirana Group', logo_url: null, created_at: LONG_AGO, agentCount: 1 }]} now={PAGE_NOW} />
      </Providers>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: messages.admin.companies.new_btn })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: 'Alpha Estates' } })
    fireEvent.click(within(dialog).getByRole('button', { name: messages.common.save }))
    await waitFor(() => expect(mockCreateCompany).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getAllByText('Alpha Estates').length).toBeGreaterThan(0))
    expectSavedRowReadsJustNow()
  })

  it('companies: an edited company keeps its own created time and the page is measured against the save', async () => {
    render(
      <Providers>
        <AdminCompaniesManager companies={[{ id: 'co-1', name: 'Tirana Group', logo_url: null, created_at: LONG_AGO, agentCount: 1 }]} now={PAGE_NOW} />
      </Providers>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tirana Group' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^Name/), { target: { value: 'Tirana Group Ltd' } })
    fireEvent.click(within(dialog).getByRole('button', { name: messages.common.save }))
    await waitFor(() => expect(mockUpdateCompany).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getAllByText('Tirana Group Ltd').length).toBeGreaterThan(0))
    // an edit does not touch `created_at`: it still reads as a time in the past, never in the future
    expect(printedTimes().filter(text => /^in /.test(text))).toEqual([])
    expect(printedTimes().some(text => /ago$/.test(text))).toBe(true)
  })

  it('currencies: a created currency', async () => {
    const existing: DBCurrency = {
      id: 1, code: 'ALL', symbol: 'L', name_sq: 'Lek', name_en: 'Lek', name_uk: 'Лек', name_it: 'Lek', is_active: true, is_default: true, decimals: 0, created_at: LONG_AGO, updated_at: LONG_AGO,
    }
    const t = messages.admin.currency.currencies
    render(
      <Providers>
        <AdminCurrenciesManager initialCurrencies={[existing]} now={PAGE_NOW} />
      </Providers>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(t.code), { target: { value: 'chf' } })
    fireEvent.change(within(dialog).getByLabelText(t.symbol), { target: { value: 'Fr' } })
    fireEvent.change(within(dialog).getByLabelText(t.name_en), { target: { value: 'Swiss Franc' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))
    await waitFor(() => expect(mockCreateCurrency).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'CHF' }).length).toBeGreaterThan(0))
    expectSavedRowReadsJustNow()
  })

  it('currencies: an edited currency', async () => {
    const existing: DBCurrency = {
      id: 1, code: 'EUR', symbol: '€', name_sq: 'Euro', name_en: 'Euro', name_uk: 'Євро', name_it: 'Euro', is_active: true, is_default: false, decimals: 2, created_at: LONG_AGO, updated_at: LONG_AGO,
    }
    const t = messages.admin.currency.currencies
    render(
      <Providers>
        <AdminCurrenciesManager initialCurrencies={[existing]} now={PAGE_NOW} />
      </Providers>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'EUR' })[0])
    const detail = await screen.findByRole('dialog')
    fireEvent.click(within(detail).getByRole('button', { name: t.edit }))
    const form = await screen.findByRole('dialog', { name: t.edit })
    fireEvent.change(within(form).getByLabelText(t.name_en), { target: { value: 'Euro (EU)' } })
    fireEvent.click(within(form).getByRole('button', { name: t.save }))
    await waitFor(() => expect(mockUpdateCurrency).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getAllByText('Euro (EU)').length).toBeGreaterThan(0))
    expectSavedRowReadsJustNow()
  })

  it('property types: a created type', async () => {
    const existing: DBPropertyType = { id: 1, slug: 'apartment', name_sq: 'Apartament', name_en: 'Apartment', name_uk: 'Квартира', name_it: 'Appartamento', is_active: true, sort_order: 1, created_at: LONG_AGO, updated_at: LONG_AGO }
    const t = messages.admin.property_types
    render(
      <Providers>
        <AdminPropertyTypesManager initialTypes={[existing]} searchQuery="" now={PAGE_NOW} />
      </Providers>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: t.new })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getAllByRole('textbox')[0], { target: { value: 'Garazh' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))
    await waitFor(() => expect(mockCreateType).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getAllByText('Garazh').length).toBeGreaterThan(0))
    expectSavedRowReadsJustNow()
  })

  it('property types: an edited type', async () => {
    const existing: DBPropertyType = { id: 1, slug: 'apartment', name_sq: 'Apartament', name_en: 'Apartment', name_uk: 'Квартира', name_it: 'Appartamento', is_active: true, sort_order: 1, created_at: LONG_AGO, updated_at: LONG_AGO }
    const t = messages.admin.property_types
    render(
      <Providers>
        <AdminPropertyTypesManager initialTypes={[existing]} searchQuery="" now={PAGE_NOW} />
      </Providers>,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Apartament' })[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getAllByRole('textbox')[0], { target: { value: 'Apartament i ri' } })
    fireEvent.click(within(dialog).getByRole('button', { name: t.save }))
    await waitFor(() => expect(mockUpdateType).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getAllByText('Apartament i ri').length).toBeGreaterThan(0))
    // an edit keeps `created_at` (the column this page prints): a time in the past, never in the future
    expect(printedTimes().filter(text => /^in /.test(text))).toEqual([])
  })
})
