/**
 * Security (Task 923 R100, R69 (d), case SEC-X-FE-PROFILE-BOUNDS): a refused over-long name is shown in the save-error slot, not saved.
 *  - the REAL `AdminUserProfile` (admin editing a person's profile): when `updateUserProfileFull` answers `name_too_long`, the page shows the localized text in its error
 *    banner (never the bare code), raises the save-error toast, stays in edit mode and does not show the success toast or refresh the page as a saved profile;
 *  - the REAL cabinet `ProfileTab` (the person's own profile): when `updateCabinetProfile` answers `name_too_long`, the save-error slot shows the localized name text, not
 *    the generic one and not the "profile updated" text; any other refusal still shows the generic text (the control).
 * The server actions, the identity context, the router and the toast are doubles; everything the person sees is real, in the real `en` messages.
 */
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { FIXTURE_CHANGE_LOG, FIXTURE_CITIES, FIXTURE_PROFILE_USER_AGENT, FIXTURE_REGIONS, FIXTURE_STATUS_HISTORY } from '@/stories/fixtures/admin.fixtures'

const mocks = vi.hoisted(() => ({
  updateUserProfileFull: vi.fn(),
  updateCabinetProfile: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/modules/admin/actions', () => ({
  updateUserProfileFull: mocks.updateUserProfileFull,
  deactivateUser: vi.fn(),
  reactivateUser: vi.fn(),
  hardDeleteUser: vi.fn(),
  createAdminUser: vi.fn(),
  addLocation: vi.fn(),
  approveLocationRequest: vi.fn(),
  rejectLocationRequest: vi.fn(),
  removeUserAvatar: vi.fn(),
}))
vi.mock('@/modules/admin/actions/clearHistory', () => ({ clearHistoryRow: vi.fn(), clearHistoryForEntity: vi.fn() }))
vi.mock('@/modules/cabinet/actions', () => ({
  updateCabinetProfile: mocks.updateCabinetProfile,
  deleteOwnAccount: vi.fn(),
  getReauthMethod: vi.fn().mockResolvedValue('password'),
  initiateEmailChange: vi.fn(),
  resendEmailVerification: vi.fn(),
}))
vi.mock('@/lib/toast', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError, info: vi.fn() } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  usePathname: () => '/admin/users/usr-001',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/modules/auth/context/AuthContext', () => ({ useAuth: () => ({ signOut: vi.fn(), refreshUser: vi.fn() }) }))
vi.mock('@/lib/auth/browser', () => ({ signInWithGoogleIdToken: vi.fn() }))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({ useCurrencies: () => ({ currencies: [] }) }))
vi.mock('@/components/shared/LocationCombobox', () => ({ LocationCombobox: () => null }))
vi.mock('@/components/shared/Combobox', () => ({ Combobox: () => null }))
vi.mock('@/components/admin/AdminUserAvatar', () => ({ AdminUserAvatar: () => null }))
vi.mock('@/modules/cabinet/components/CabinetPasswordSection', () => ({ CabinetPasswordSection: () => null }))

import { AdminUserProfile } from '../AdminUserProfile'
import { ProfileTab } from '@/modules/cabinet/components/ProfileTab'

const admin = messages.admin.user_profile
const cabinet = messages.cabinet
const OVER_LONG = 'x'.repeat(101)
const PROFILE = { id: 'user-1', name: 'Alba', phone: '', whatsapp: '', company_name: null, user_type: 'private', location_id: null, preferred_currency: 'ALL', avatar_url: null, pending_email: null }

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', undefined)
  for (const mock of Object.values(mocks)) mock.mockReset()
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

function renderAdminProfile() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminUserProfile
          user={FIXTURE_PROFILE_USER_AGENT}
          email="arben@example.com"
          emailConfirmedAt="2026-01-15T09:00:00Z"
          cities={FIXTURE_CITIES}
          regions={FIXTURE_REGIONS}
          changeLog={FIXTURE_CHANGE_LOG}
          statusHistory={FIXTURE_STATUS_HISTORY}
          isAdmin
          canClearHistory
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

function renderCabinetTab() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>
        <ProfileTab profile={PROFILE as never} locale="en" cities={[]} regions={[]} email="person@example.com" />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

describe('AdminUserProfile and ProfileTab', () => {
  it('[SEC-X-FE-PROFILE-BOUNDS] a refused over-long name is shown, not saved', async () => {
    // the admin page: edit mode, an over-long first name, save
    mocks.updateUserProfileFull.mockResolvedValue({ error: 'name_too_long' })
    renderAdminProfile()
    fireEvent.click(screen.getByRole('button', { name: admin.actions.edit_profile }))
    fireEvent.change(screen.getByLabelText(admin.fields.first_name), { target: { value: OVER_LONG } })
    fireEvent.click(screen.getByRole('button', { name: admin.actions.save }))
    await waitFor(() => expect(mocks.updateUserProfileFull).toHaveBeenCalledTimes(1))
    expect(mocks.updateUserProfileFull.mock.calls[0][1], 'the over-long name is what was sent').toMatchObject({ firstName: OVER_LONG })
    // the localized text is in the error banner, never the bare code; the save-error toast fires; nothing counts as saved
    expect(await screen.findByText(admin.validation.name_too_long)).toBeTruthy()
    expect(screen.queryByText('name_too_long')).toBeNull()
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(admin.feedback.save_error))
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.refresh, 'no refresh as of a saved profile').not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: admin.actions.save }), 'the form stays in edit mode').toBeTruthy()
    cleanup()

    // the cabinet tab: an over-long name, save
    mocks.updateCabinetProfile.mockResolvedValue({ error: 'name_too_long' })
    renderCabinetTab()
    fireEvent.change(document.getElementById('name') as HTMLInputElement, { target: { value: OVER_LONG } })
    fireEvent.click(screen.getByRole('button', { name: cabinet.save_changes }))
    await waitFor(() => expect(mocks.updateCabinetProfile).toHaveBeenCalledTimes(1))
    expect(mocks.updateCabinetProfile.mock.calls[0][0], 'the over-long name is what was sent').toMatchObject({ name: OVER_LONG })
    expect(await screen.findByText(cabinet.error_name_too_long)).toBeTruthy()
    expect(screen.queryByText(cabinet.error_saving), 'not the generic text').toBeNull()
    expect(screen.queryByText(cabinet.profile_updated), 'not the success text').toBeNull()
    cleanup()

    // the control: any other refusal of the cabinet save still shows the generic text
    mocks.updateCabinetProfile.mockReset()
    mocks.updateCabinetProfile.mockResolvedValue({ error: 'save_failed' })
    renderCabinetTab()
    fireEvent.click(screen.getByRole('button', { name: cabinet.save_changes }))
    expect(await screen.findByText(cabinet.error_saving)).toBeTruthy()
    expect(screen.queryByText(cabinet.error_name_too_long)).toBeNull()
  })
})
