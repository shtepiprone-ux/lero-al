/**
 * Task 953 (AC3), components and hooks of the findings list that had no test of their own: the behaviour the React Compiler rules touched, pinned BEFORE the
 * findings were fixed and kept green after. The real component renders with the real `en` messages; only the server actions, the router, the toast and the
 * network are doubles. Assertions are on what a person sees or a caller receives.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../messages/en.json'

const state = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams(),
  searchUsers: vi.fn(),
  submitContact: vi.fn(),
  updateLastViewed: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: state.push, refresh: state.refresh, replace: vi.fn() }),
  usePathname: () => '/en/test',
  useSearchParams: () => state.searchParams,
}))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }))
vi.mock('@/modules/admin/actions', () => ({
  createPage: vi.fn(), updatePage: vi.fn(), deletePage: vi.fn(),
  createLocation: vi.fn(), updateLocation: vi.fn(), deleteLocation: vi.fn(), toggleLocationFeatured: vi.fn(),
  searchUsersForPicker: (...args: unknown[]) => state.searchUsers(...args),
}))
vi.mock('@/modules/contacts/actions', () => ({ submitContactInquiry: (...args: unknown[]) => state.submitContact(...args) }))
vi.mock('@/modules/cabinet/actions', () => ({
  updateLastViewed: (...args: unknown[]) => state.updateLastViewed(...args),
  deleteSavedSearch: vi.fn(), updateSavedSearchNotify: vi.fn(), updateSavedSearchFrequency: vi.fn(), deleteAllSavedSearches: vi.fn(),
}))

vi.mock('@/hooks/useExchangeRate', () => ({ useExchangeRate: () => ({ rates: null, rate: null, loading: false }) }))
vi.mock('@/hooks/usePropertyTypes', () => ({ usePropertyTypes: () => ({ propertyTypes: [], loading: false }) }))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({ useCurrencies: () => ({ currencies: [], loading: false }) }))

import { AdminLegalManager } from '@/components/admin/AdminLegalManager'
import { AdminLocationsManager, type Location } from '@/components/admin/AdminLocationsManager'
import { UserPickerField } from '@/components/admin/UserPickerField'
import { SavedSearchesTab } from '@/modules/cabinet/components/SavedSearchesTab'
import { ListingBackButton } from '@/modules/listings/components/ListingBackButton'
import { ContactForm } from '@/modules/contacts/components/ContactForm'
import { Combobox } from '@/components/shared/Combobox'
import { useHomepageFilters } from '@/components/shared/useHomepageFilters'
import type { SavedSearch } from '@/types/database'

beforeEach(() => {
  state.searchParams = new URLSearchParams()
  state.push.mockReset()
  state.searchUsers.mockReset()
  state.submitContact.mockReset()
  state.updateLastViewed.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  window.sessionStorage.clear()
})
// setup.ts installs the guarded `fetch` with vi.stubGlobal; unstubbing my own stubs would drop it too, so it is put back.
const guardedFetch = global.fetch
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.stubGlobal('fetch', guardedFetch)
})

const wrap = (node: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <MantineProvider theme={theme} env="test">{node}</MantineProvider>
  </NextIntlClientProvider>
)

// ── src/components/admin/AdminLegalManager.tsx (set-state-in-effect) ─────────────────────────────────────────────────────────────

describe('AdminLegalManager', () => {
  const page = (id: number, title: string) => ({ id, title, slug: `slug-${id}`, is_published: true, content: {}, updated_at: '2026-09-27T14:30:00.000Z' })

  it('shows the pages it was given and replaces them when the server sends a new list', () => {
    const view = render(wrap(<AdminLegalManager pages={[page(1, 'Terms of use'), page(2, 'Privacy policy')]} />))
    expect(screen.getByText('Terms of use')).toBeInTheDocument()
    expect(screen.getByText('Privacy policy')).toBeInTheDocument()
    view.rerender(wrap(<AdminLegalManager pages={[page(2, 'Privacy policy')]} />))
    expect(screen.queryByText('Terms of use')).toBeNull()
    expect(screen.getByText('Privacy policy')).toBeInTheDocument()
  })

  it('shows the empty state when the server sends no pages', () => {
    const view = render(wrap(<AdminLegalManager pages={[page(1, 'Terms of use')]} />))
    view.rerender(wrap(<AdminLegalManager pages={[]} />))
    expect(screen.getByText(messages.admin.legal.empty_text)).toBeInTheDocument()
  })
})

// ── src/components/admin/AdminLocationsManager.tsx (set-state-in-effect) ─────────────────────────────────────────────────────────

describe('AdminLocationsManager', () => {
  const loc = (id: number, name: string): Location => ({ id, name_al: name, name_en: null, type: 'city', slug: `l-${id}` })

  it('shows the locations it was given and replaces them when the server sends a new list', () => {
    const view = render(wrap(<AdminLocationsManager locations={[loc(1, 'Tirana'), loc(2, 'Durres')]} parents={[]} activeType="" />))
    expect(screen.getByText('Tirana')).toBeInTheDocument()
    expect(screen.getByText('Durres')).toBeInTheDocument()
    view.rerender(wrap(<AdminLocationsManager locations={[loc(2, 'Durres'), loc(3, 'Vlore')]} parents={[]} activeType="" />))
    expect(screen.queryByText('Tirana')).toBeNull()
    expect(screen.getByText('Vlore')).toBeInTheDocument()
  })

  it('shows "nothing found" when the server sends no locations', () => {
    const view = render(wrap(<AdminLocationsManager locations={[loc(1, 'Tirana')]} parents={[]} activeType="" />))
    view.rerender(wrap(<AdminLocationsManager locations={[]} parents={[]} activeType="" />))
    expect(screen.getByText(messages.admin.locations.nothing_found)).toBeInTheDocument()
  })
})

// ── src/components/admin/UserPickerField.tsx (set-state-in-effect) ───────────────────────────────────────────────────────────────

describe('UserPickerField', () => {
  const USER = { id: 'a1', name: 'Agim', last_name: 'Krasniqi', phone: null, role: 'agent', status: 'active', company_name: null }

  function mountPicker(onChange = vi.fn()) {
    render(wrap(<UserPickerField label="Reporter" icon="user" value={null} onChange={onChange} placeholder="Search a user" />))
    return { onChange, input: () => screen.getByPlaceholderText('Search a user') }
  }

  it('searches after 300 ms for two or more characters and lists the answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    state.searchUsers.mockResolvedValue([USER])
    const { input } = mountPicker()
    fireEvent.change(input(), { target: { value: 'a' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(400) })
    expect(state.searchUsers).not.toHaveBeenCalled()
    fireEvent.change(input(), { target: { value: 'ag' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(100) })
    expect(state.searchUsers).not.toHaveBeenCalled()
    await act(async () => { await vi.advanceTimersByTimeAsync(250) })
    expect(state.searchUsers).toHaveBeenCalledWith('ag')
    expect(await screen.findByRole('option', { name: /Agim Krasniqi/ })).toBeInTheDocument()
  })

  it('selects a result and clears the list', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    state.searchUsers.mockResolvedValue([USER])
    const { input, onChange } = mountPicker()
    fireEvent.change(input(), { target: { value: 'ag' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(400) })
    fireEvent.click(await screen.findByRole('option', { name: /Agim Krasniqi/ }))
    expect(onChange).toHaveBeenCalledWith(USER)
    expect(screen.queryByRole('option', { name: /Agim Krasniqi/ })).toBeNull()
  })

  it('drops the list when the query is shortened below two characters', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    state.searchUsers.mockResolvedValue([USER])
    const { input } = mountPicker()
    fireEvent.change(input(), { target: { value: 'ag' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(400) })
    expect(await screen.findByRole('option', { name: /Agim Krasniqi/ })).toBeInTheDocument()
    fireEvent.change(input(), { target: { value: 'a' } })
    expect(screen.queryByRole('option', { name: /Agim Krasniqi/ })).toBeNull()
  })
})

// ── src/modules/cabinet/components/SavedSearchesTab.tsx (set-state-in-effect) ────────────────────────────────────────────────────

describe('SavedSearchesTab', () => {
  const search = (id: string, name: string, newCount = 0): SavedSearch => ({
    id, user_id: 'u1', name, filters: {}, filters_hash: null, notify_email: false, notify_frequency: 'daily', last_checked_at: null, last_viewed_at: null,
    new_count: newCount, updated_at: '2026-09-27T14:30:00.000Z', created_at: '2026-09-27T14:30:00.000Z',
  })

  it('shows the searches it was given and replaces them when the server sends a new list', () => {
    const view = render(wrap(<SavedSearchesTab savedSearches={[search('s1', 'Flats in Tirana'), search('s2', 'Houses in Durres')]} />))
    expect(screen.getByText('Flats in Tirana')).toBeInTheDocument()
    view.rerender(wrap(<SavedSearchesTab savedSearches={[search('s2', 'Houses in Durres')]} />))
    expect(screen.queryByText('Flats in Tirana')).toBeNull()
    expect(screen.getByText('Houses in Durres')).toBeInTheDocument()
    view.rerender(wrap(<SavedSearchesTab savedSearches={[]} />))
    expect(screen.getByText(messages.saved_search.empty_state)).toBeInTheDocument()
  })

  it('opening a search navigates, clears its "new" badge at once and keeps it cleared while the server list is the same one', async () => {
    const searches = [search('s1', 'Flats in Tirana', 3)]
    const view = render(wrap(<SavedSearchesTab savedSearches={searches} />))
    expect(screen.getByText(/3/, { selector: 'span' })).toBeInTheDocument()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: messages.saved_search.open_search })) })
    expect(state.push).toHaveBeenCalledTimes(1)
    expect(state.updateLastViewed).toHaveBeenCalledWith('s1')
    view.rerender(wrap(<SavedSearchesTab savedSearches={searches} />))
    expect(screen.queryByText(/3 new/i)).toBeNull()
  })
})

// ── src/modules/listings/components/ListingBackButton.tsx (set-state-in-effect) ──────────────────────────────────────────────────

describe('ListingBackButton', () => {
  it('goes back to the listings page of the locale when nothing was saved', () => {
    render(wrap(<ListingBackButton locale="en" label="Back" />))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(state.push).toHaveBeenCalledWith('/en/listings')
  })

  it('goes back to the saved URL of the search the person came from', () => {
    sessionStorage.setItem('listings_restore', JSON.stringify({ returnUrl: '/en/listings?page=3', slug: 'flat', extraPage: 0 }))
    render(wrap(<ListingBackButton locale="en" label="Back" />))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(state.push).toHaveBeenCalledWith('/en/listings?page=3')
  })

  it('ignores a saved value that is not JSON, and scrolls to the top on mount', () => {
    sessionStorage.setItem('listings_restore', 'not json')
    render(wrap(<ListingBackButton locale="sq" label="Back" />))
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(state.push).toHaveBeenCalledWith('/sq/listings')
  })

  it('does not consume the saved value (the listings page reads and removes it)', () => {
    sessionStorage.setItem('listings_restore', JSON.stringify({ returnUrl: '/en/listings', slug: 'x', extraPage: 0 }))
    render(wrap(<ListingBackButton locale="en" label="Back" />))
    expect(sessionStorage.getItem('listings_restore')).not.toBeNull()
  })
})

// ── src/modules/contacts/components/ContactForm.tsx (incompatible-library: react-hook-form watch) ────────────────────────────────

describe('ContactForm', () => {
  const c = messages.contact

  async function chooseTopic(label: string) {
    fireEvent.click(screen.getByRole('button', { name: c.topic_placeholder }))
    fireEvent.mouseDown(await screen.findByRole('option', { name: label }))
  }

  it('shows the custom subject field only while the topic is "Other"', async () => {
    render(wrap(<ContactForm />))
    expect(screen.queryByLabelText(c.custom_subject_label)).toBeNull()
    await chooseTopic(c.topics.other)
    expect(await screen.findByLabelText(c.custom_subject_label)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: c.topics.other }))
    fireEvent.mouseDown(await screen.findByRole('option', { name: c.topics.general }))
    await waitFor(() => expect(screen.queryByLabelText(c.custom_subject_label)).toBeNull())
  })

  it('refuses to send "Other" without a custom subject, and sends the typed values otherwise', async () => {
    state.submitContact.mockResolvedValue({})
    render(wrap(<ContactForm />))
    await chooseTopic(c.topics.other)
    fireEvent.change(screen.getByLabelText(c.name_label), { target: { value: 'Blerina' } })
    fireEvent.change(screen.getByLabelText(c.email_label), { target: { value: 'blerina@example.com' } })
    fireEvent.change(screen.getByLabelText(c.message_label), { target: { value: 'A long enough message for the form to accept it.' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: c.submit })) })
    expect(await screen.findByText(c.validation_custom_subject_required)).toBeInTheDocument()
    expect(state.submitContact).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(c.custom_subject_label), { target: { value: 'Invoice question' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: c.submit })) })
    await waitFor(() => expect(state.submitContact).toHaveBeenCalledTimes(1))
    expect(state.submitContact).toHaveBeenCalledWith({
      topic: 'other', customSubject: 'Invoice question', name: 'Blerina', email: 'blerina@example.com', message: 'A long enough message for the form to accept it.',
    })
  })
})

// ── src/components/shared/Combobox.tsx (set-state-in-effect) ─────────────────────────────────────────────────────────────────────

describe('Combobox', () => {
  const OPTIONS = [{ value: 'tirana', label: 'Tirana' }, { value: 'durres', label: 'Durres' }, { value: 'vlore', label: 'Vlore' }]

  function Controlled({ initial = '', ...rest }: { initial?: string } & Partial<React.ComponentProps<typeof Combobox>>) {
    const [value, setValue] = React.useState(initial)
    return (
      <>
        <button type="button" data-testid="clear" onClick={() => setValue('')}>clear</button>
        <Combobox options={OPTIONS} value={value} onChange={setValue} placeholder="City" {...rest} />
      </>
    )
  }

  it('filters the options by what is typed, and shows the choice by its label', () => {
    render(wrap(<Controlled />))
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'du' } })
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['Durres'])
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Durres' }))
    expect(screen.getByRole('combobox')).toHaveValue('Durres')
  })

  it('forgets the typed text when the value is cleared from outside', () => {
    render(wrap(<Controlled initial="tirana" />))
    expect(screen.getByRole('combobox')).toHaveValue('Tirana')
    fireEvent.click(screen.getByTestId('clear'))
    expect(screen.getByRole('combobox')).toHaveValue('')
  })

  it('clears the search typed inside a searchable dropdown when it closes', () => {
    vi.useFakeTimers()
    render(wrap(<Controlled variant="button" searchable searchPlaceholder="Search city" />))
    const trigger = screen.getByRole('button', { name: 'City' })
    fireEvent.click(trigger)
    fireEvent.change(screen.getByPlaceholderText('Search city'), { target: { value: 'vl' } })
    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['Vlore'])
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Vlore' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vlore' }))
    expect(screen.getByPlaceholderText('Search city')).toHaveValue('')
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('opens a portal dropdown at a fixed position under the trigger', () => {
    render(wrap(<Controlled variant="button" portal />))
    fireEvent.click(screen.getByRole('button', { name: 'City' }))
    const listbox = screen.getByRole('listbox')
    const panel = listbox.parentElement as HTMLElement
    expect(panel.style.position).toBe('fixed')
    expect(panel.parentElement).toBe(document.body)
  })

  it('opens already positioned when it starts open in a portal', () => {
    render(wrap(<Controlled variant="button" portal defaultOpen />))
    const panel = screen.getByRole('listbox').parentElement as HTMLElement
    expect(panel.style.position).toBe('fixed')
  })
})

// ── src/components/shared/useHomepageFilters.ts (set-state-in-effect) ────────────────────────────────────────────────────────────

describe('useHomepageFilters', () => {
  const setup = (values: Record<string, unknown>) =>
    renderHook(({ v }) => useHomepageFilters({ values: v as never, onChange: vi.fn(), onApply: vi.fn(), onClose: vi.fn(), locations: [] }), { initialProps: { v: values } })

  it('starts from the values of the parent, and takes new values the parent applies', () => {
    const view = setup({ property_type: 'apartment' })
    expect(view.result.current.local).toMatchObject({ property_type: 'apartment' })
    view.rerender({ v: { property_type: 'house' } })
    expect(view.result.current.local).toMatchObject({ property_type: 'house' })
  })

  it('keeps a draft edit while the parent values stay the same object', () => {
    const values = { property_type: 'apartment' }
    const view = setup(values)
    act(() => view.result.current.update({ property_type: 'land' }))
    expect(view.result.current.local).toMatchObject({ property_type: 'land' })
    view.rerender({ v: values })
    expect(view.result.current.local).toMatchObject({ property_type: 'land' })
  })
})

