/**
 * Task 953 (incompatible-library): AdminUserCreate reads the form values it renders from (profile type, "use the main phone", the phone, the city) with
 * react-hook-form. The values must reach the screen and the action the same way after the reads moved to `useWatch`.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'

const mocks = vi.hoisted(() => ({ create: vi.fn(), push: vi.fn(), addLocation: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, refresh: vi.fn() }) }))
vi.mock('@/modules/admin/actions', () => ({
  createAdminUser: (...args: unknown[]) => mocks.create(...args),
  addLocation: (...args: unknown[]) => mocks.addLocation(...args),
}))

import { AdminUserCreate } from '../AdminUserCreate'

const t = messages.admin.user_profile
const CITIES = [{ id: 1, name_al: 'Tirana', region_id: 10 }, { id: 2, name_al: 'Durres', region_id: 11 }]
const REGIONS = [{ id: 10, name_al: 'Tirana County' }, { id: 11, name_al: 'Durres County' }]

const mount = () => render(
  <NextIntlClientProvider locale="en" messages={messages}>
    <MantineProvider theme={theme} env="test"><AdminUserCreate cities={CITIES} regions={REGIONS} /></MantineProvider>
  </NextIntlClientProvider>,
)

beforeEach(() => {
  mocks.create.mockReset().mockResolvedValue({ userId: 'new-user' })
  mocks.push.mockReset()
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
})
const guardedFetch = global.fetch
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.stubGlobal('fetch', guardedFetch) })

async function chooseFrom(triggerName: string | RegExp, optionName: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name: triggerName }))
  fireEvent.mouseDown(await screen.findByRole('option', { name: optionName }))
}

describe('AdminUserCreate', () => {
  it('shows the chosen profile type', async () => {
    mount()
    expect(screen.getByRole('button', { name: t['profile_types'].private })).toBeInTheDocument()
    await chooseFrom(t['profile_types'].private, t['profile_types'].agent)
    expect(screen.getByRole('button', { name: t['profile_types'].agent })).toBeInTheDocument()
  })

  it('hides the WhatsApp number while "use the main phone" is checked, and shows it again when it is cleared', () => {
    mount()
    const phoneFieldsBefore = screen.getAllByRole('textbox').length
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getAllByRole('textbox').length).toBeLessThan(phoneFieldsBefore)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getAllByRole('textbox').length).toBe(phoneFieldsBefore)
  })

  it('shows the region of the chosen city', async () => {
    mount()
    expect(screen.queryByText(/Tirana County/)).toBeNull()
    const city = screen.getByPlaceholderText(t.placeholders.city_search)
    fireEvent.click(city)
    fireEvent.click(await screen.findByRole('option', { name: /Tirana/ }))
    expect(await screen.findByText('Tirana County')).toBeInTheDocument()
  })

  it('sends the main phone as the WhatsApp number when "use the main phone" is checked', async () => {
    mount()
    fireEvent.change(document.getElementById('firstName')!, { target: { value: 'Arta' } })
    fireEvent.change(document.getElementById('email')!, { target: { value: 'arta@example.com' } })
    const phoneInput = screen.getAllByRole('textbox').find(el => (el as HTMLInputElement).type === 'tel') as HTMLInputElement
    fireEvent.change(phoneInput, { target: { value: '691234567' } })
    fireEvent.click(screen.getByRole('checkbox'))
    const city = screen.getByPlaceholderText(t.placeholders.city_search)
    fireEvent.click(city)
    fireEvent.click(await screen.findByRole('option', { name: /Tirana/ }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t.actions.create_user })) })
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    const sent = mocks.create.mock.calls[0][0] as { phone: string; whatsapp: string; locationId: number; profileType: string; email: string }
    expect(sent.phone).toBe('+355691234567')
    expect(sent.whatsapp).toBe('+355691234567')
    expect(sent.locationId).toBe(1)
    expect(sent.profileType).toBe('private')
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/admin/users/new-user'))
  })

  it('refuses a missing first name and city and sends nothing', async () => {
    mount()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t.actions.create_user })) })
    expect(await screen.findByText(t.validation.firstName_required)).toBeInTheDocument()
    expect(mocks.create).not.toHaveBeenCalled()
    expect(within(document.body).queryByText(t.validation.email_invalid)).toBeTruthy()
  })
})
