/**
 * Security (Task 923 R80, owner decision D54): the cabinet's account deletion asks for the PASSWORD, not the typed word DELETE.
 *  - SEC-X-FE-DELETE-PASSWORD: the REAL ProfileTab opens the canonical `MantineDeleteConfirmModal` in its password mode. The primary waits for a password; a wrong one shows
 *    `invalid_password` under the field and the dialog stays open; the right one calls the action once and signs out; an account with no password sends none and, when the
 *    server asks for a new Google sign-in, is offered Google's own confirmation button (Task 927). The e-mail form asks for the password too and sends it.
 * The server actions, the identity context, the router, the toast and the Google sign-in start are doubles; everything the person sees is real.
 */
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'

const mocks = vi.hoisted(() => ({
  deleteOwnAccount: vi.fn(),
  getReauthMethod: vi.fn(),
  initiateEmailChange: vi.fn(),
  signOut: vi.fn(),
  signInWithGoogleIdToken: vi.fn(),
  toastSuccess: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/modules/cabinet/actions', () => ({
  updateCabinetProfile: vi.fn(),
  deleteOwnAccount: mocks.deleteOwnAccount,
  getReauthMethod: mocks.getReauthMethod,
  initiateEmailChange: mocks.initiateEmailChange,
  resendEmailVerification: vi.fn(),
}))
vi.mock('@/modules/auth/context/AuthContext', () => ({ useAuth: () => ({ signOut: mocks.signOut, refreshUser: vi.fn() }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push, refresh: vi.fn() }) }))
vi.mock('@/lib/toast', () => ({ toast: { success: mocks.toastSuccess, error: vi.fn() } }))
vi.mock('@/lib/auth/browser', () => ({ signInWithGoogleIdToken: mocks.signInWithGoogleIdToken }))
vi.mock('@/hooks/useUnsavedChangesGuard', () => ({ useUnsavedChangesGuard: () => ({ confirmLeave: vi.fn() }) }))
vi.mock('@/modules/currency/hooks/useCurrencies', () => ({ useCurrencies: () => ({ currencies: [] }) }))
vi.mock('@/components/shared/PhoneField', () => ({ PhoneField: () => null }))
vi.mock('@/components/shared/LocationCombobox', () => ({ LocationCombobox: () => null }))
vi.mock('@/components/shared/Combobox', () => ({ Combobox: () => null }))
vi.mock('@/components/admin/AdminUserAvatar', () => ({ AdminUserAvatar: () => null }))
vi.mock('@/modules/cabinet/components/CabinetPasswordSection', () => ({ CabinetPasswordSection: () => null }))

import { ProfileTab } from '../ProfileTab'

const t = messages.cabinet
const PROFILE = { id: 'user-1', name: 'Alba', phone: '', whatsapp: '', company_name: null, user_type: 'private', location_id: null, preferred_currency: 'ALL', avatar_url: null, pending_email: null }

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })   // jsdom has none; the Google slot measures its width with Mantine's useElementSize
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  for (const mock of Object.values(mocks)) mock.mockReset()
  mocks.getReauthMethod.mockResolvedValue('password')
  // no client ID: the Google slot shows its deterministic unavailable state and asks Google for nothing
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', undefined)
  mocks.signOut.mockImplementation((then?: () => void) => then?.())
})
afterEach(() => { cleanup(); vi.unstubAllEnvs() })

function renderTab() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>
        <ProfileTab profile={PROFILE as never} locale="en" cities={[]} regions={[]} email="person@example.com" />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

async function openDialog() {
  renderTab()
  await waitFor(() => expect(mocks.getReauthMethod).toHaveBeenCalled())
  fireEvent.click(screen.getByRole('button', { name: t.delete_account }))
  return screen.findByRole('dialog')
}
// the trigger on the page and the primary of the dialog carry the same words: the dialog's own queries stay inside it
const dialog = () => within(screen.getByRole('dialog'))
const confirmButton = () => dialog().getByRole('button', { name: t.delete_account_confirm }) as HTMLButtonElement
const passwordField = () => dialog().getByLabelText(t.delete_account_password_confirm) as HTMLInputElement

describe('ProfileTab.deletePassword', () => {
  it('[SEC-X-FE-DELETE-PASSWORD] the cabinet deletion asks for the password', async () => {
    await openDialog()
    // the password field replaces the word: no DELETE field, no DELETE placeholder, and the primary waits for a password
    expect(dialog().queryByLabelText(t.delete_account_type_confirm)).toBeNull()
    expect(dialog().queryByPlaceholderText('DELETE')).toBeNull()
    expect(passwordField().type).toBe('password')
    expect(confirmButton().disabled).toBe(true)
    fireEvent.click(confirmButton())
    expect(mocks.deleteOwnAccount, 'a deletion is never sent without a password').not.toHaveBeenCalled()

    // a wrong password: the action is called with it, the field shows the error, the dialog stays open, nothing is signed out
    mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'invalid_password' })
    fireEvent.change(passwordField(), { target: { value: 'wrong-password' } })
    expect(confirmButton().disabled).toBe(false)
    fireEvent.click(confirmButton())
    expect(await dialog().findByText(t.password_error_invalid_current)).toBeTruthy()
    expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(1)
    expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({ password: 'wrong-password' })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()

    // typing again clears the error; the right password deletes, shows the success and signs out to the home page
    mocks.deleteOwnAccount.mockResolvedValueOnce({})
    fireEvent.change(passwordField(), { target: { value: 'Right-Passw0rd!' } })
    expect(dialog().queryByText(t.password_error_invalid_current)).toBeNull()
    fireEvent.click(confirmButton())
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1))
    expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(2)
    expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({ password: 'Right-Passw0rd!' })
    expect(mocks.toastSuccess).toHaveBeenCalledWith(t.delete_account_success)
    expect(mocks.push).toHaveBeenCalledWith('/en')
  })

  it('Auth\'s sign-in limit is shown under the field, and a failed deletion shows the error in the dialog without a sign-out', async () => {
    await openDialog()
    fireEvent.change(passwordField(), { target: { value: 'any-password' } })
    mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'rate_limited' })
    fireEvent.click(confirmButton())
    expect(await dialog().findByText(t.password_error_rate_limited)).toBeTruthy()
    mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'delete_failed' })
    fireEvent.click(confirmButton())
    expect(await dialog().findByRole('alert')).toBeTruthy()
    expect(dialog().getByText(t.error_deleting)).toBeTruthy()
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
  })

  it('the password is empty again each time the dialog opens', async () => {
    await openDialog()
    fireEvent.change(passwordField(), { target: { value: 'left-over' } })
    fireEvent.click(dialog().getByRole('button', { name: tCancel() }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    fireEvent.click(screen.getByRole('button', { name: t.delete_account }))
    await screen.findByRole('dialog')
    expect(passwordField().value).toBe('')
  })

  it('an account with no password sends none, and when the server asks for a new Google sign-in it is offered the Google confirmation button', async () => {
    mocks.getReauthMethod.mockResolvedValue('google')
    await openDialog()
    expect(dialog().queryByLabelText(t.delete_account_password_confirm)).toBeNull()
    expect(dialog().queryByText(t.delete_account_google_required)).toBeNull()
    mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'reauth_required' })
    // Task 927 D17: an account with no password types DELETE; the primary waits for it
    const typedField = await dialog().findByLabelText(t.delete_account_type_confirm) as HTMLInputElement
    expect(confirmButton().disabled, 'the primary waits for the typed word').toBe(true)
    fireEvent.change(typedField, { target: { value: 'delete' } })
    expect(confirmButton().disabled).toBe(false)
    fireEvent.click(confirmButton())
    expect(await dialog().findByText(t.delete_account_google_required)).toBeTruthy()
    expect(mocks.deleteOwnAccount).toHaveBeenCalledWith({})
    expect(mocks.signOut).not.toHaveBeenCalled()
    // Task 927: Google's own button (here its unavailable state, with no client ID) stands where the redirect button was, inside the dialog's Google section
    expect(await dialog().findByText(messages.auth.google_reauth_unavailable)).toBeTruthy()
    expect(dialog().queryByRole('button', { name: 'Confirm with Google' }), 'the redirect button is gone').toBeNull()
    expect(mocks.signInWithGoogleIdToken).not.toHaveBeenCalled()
  })

  it('the e-mail form asks for the current password and sends it; a wrong one is shown and nothing is pending', async () => {
    renderTab()
    await waitFor(() => expect(mocks.getReauthMethod).toHaveBeenCalled())
    const address = screen.getByRole('textbox', { name: new RegExp('^' + t.email_new_label) }) as HTMLInputElement
    const password = () => screen.getByLabelText(t.password_current_label) as HTMLInputElement
    const save = () => screen.getByRole('button', { name: messages.common.save }) as HTMLButtonElement
    expect(password().type).toBe('password')
    fireEvent.change(address, { target: { value: 'new@example.com' } })
    expect(save().disabled, 'the action waits for the password').toBe(true)
    fireEvent.change(password(), { target: { value: 'wrong-password' } })
    mocks.initiateEmailChange.mockResolvedValueOnce({ error: 'Current password is incorrect.', reason: 'invalid_password' })
    fireEvent.click(save())
    expect(await screen.findByText('Current password is incorrect.')).toBeTruthy()
    expect(mocks.initiateEmailChange).toHaveBeenLastCalledWith({ newEmail: 'new@example.com', locale: 'en', currentPassword: 'wrong-password' })
    expect(screen.queryByText(t.email_change_resend), 'nothing is pending').toBeNull()
    mocks.initiateEmailChange.mockResolvedValueOnce({ pendingEmail: 'new@example.com' })
    fireEvent.change(password(), { target: { value: 'Right-Passw0rd!' } })
    fireEvent.click(save())
    expect(await screen.findByText(t.email_change_resend), 'the change is now pending').toBeTruthy()
    expect(mocks.initiateEmailChange).toHaveBeenLastCalledWith({ newEmail: 'new@example.com', locale: 'en', currentPassword: 'Right-Passw0rd!' })
  })

  it('an account with no password has no password field in the e-mail form; reauth_required offers the Google sign-in', async () => {
    mocks.getReauthMethod.mockResolvedValue('google')
    renderTab()
    await waitFor(() => expect(mocks.getReauthMethod).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByLabelText(t.password_current_label)).toBeNull())
    fireEvent.change(screen.getByRole('textbox', { name: new RegExp('^' + t.email_new_label) }), { target: { value: 'new@example.com' } })
    mocks.initiateEmailChange.mockResolvedValueOnce({ error: 'Sign in with Google again to change your email.', reason: 'reauth_required' })
    fireEvent.click(screen.getByRole('button', { name: messages.common.save }))
    expect(await screen.findByText('Sign in with Google again to change your email.')).toBeTruthy()
    expect(mocks.initiateEmailChange).toHaveBeenLastCalledWith({ newEmail: 'new@example.com', locale: 'en' })
    // Task 927: Google's own button (here its unavailable state, with no client ID) stands where the redirect button was, under the error line
    expect(await screen.findByText(messages.auth.google_reauth_unavailable)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Confirm with Google' }), 'the redirect button is gone').toBeNull()
    expect(mocks.signInWithGoogleIdToken).not.toHaveBeenCalled()
  })

  // Task 923 R81 (f): the two cases that describe the cabinet deletion since D54 (the typed word is gone from the cabinet)
  it('[SEC-DEL-FE-DENY] no deletion without the password', async () => {
    await openDialog()
    expect(dialog().queryByLabelText(t.delete_account_type_confirm), 'no typed-word field in the cabinet').toBeNull()
    expect(dialog().queryByPlaceholderText('DELETE')).toBeNull()
    expect(confirmButton().disabled, 'the primary is disabled while the field is empty').toBe(true)
    fireEvent.click(confirmButton())
    expect(mocks.deleteOwnAccount, 'an empty field sends nothing').not.toHaveBeenCalled()
    fireEvent.change(passwordField(), { target: { value: 'DELETE' } })          // the old word is just a (wrong) password now
    mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'invalid_password' })
    fireEvent.click(confirmButton())
    expect(await dialog().findByText(t.password_error_invalid_current)).toBeTruthy()
    expect(mocks.deleteOwnAccount, 'only the attempt with a password reached the action').toHaveBeenCalledTimes(1)
    expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({ password: 'DELETE' })
    expect(mocks.toastSuccess, 'no success toast on invalid_password').not.toHaveBeenCalled()
    expect(mocks.signOut, 'no sign-out on invalid_password').not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('[SEC-DEL-FE-ALLOW] the password deletes the account and a failure is shown', async () => {
    await openDialog()
    fireEvent.change(passwordField(), { target: { value: 'Right-Passw0rd!' } })
    mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'delete_failed' })
    fireEvent.click(confirmButton())
    // a failed deletion: the error is in the dialog, which stays open; no success, no sign-out
    expect(await dialog().findByRole('alert')).toBeTruthy()
    expect(dialog().getByText(t.error_deleting)).toBeTruthy()
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
    // the action answers ok: success toast, sign-out to the home page
    mocks.deleteOwnAccount.mockResolvedValueOnce({})
    fireEvent.click(confirmButton())
    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1))
    expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(2)
    expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({ password: 'Right-Passw0rd!' })
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(1)
    expect(mocks.toastSuccess).toHaveBeenCalledWith(t.delete_account_success)
    expect(mocks.push).toHaveBeenCalledWith('/en')
  })
})

// Task 927 Amendment 5 (owner decision D15): a deleted account is no longer remembered on this device; a refused deletion keeps the record.
it('[SEC-927-FE-REMEMBER-DELETE] a deleted account is forgotten on this device, and a refused deletion keeps it', async () => {
  const KEY = 'lero:google-account'
  const record = JSON.stringify({ sub: '000000000000000000001', name: 'Arta Krasniqi', maskedEmail: 'ar•••••@example.com', picture: null })
  localStorage.setItem(KEY, record)
  let storedWhenToasted: string | null = 'not toasted'
  mocks.toastSuccess.mockImplementation(() => { storedWhenToasted = localStorage.getItem(KEY) })

  await openDialog()
  fireEvent.change(passwordField(), { target: { value: 'wrong-password' } })
  mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'invalid_password' })
  fireEvent.click(confirmButton())
  expect(await dialog().findByText(t.password_error_invalid_current)).toBeTruthy()
  expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(1)
  expect(localStorage.getItem(KEY), 'a refused deletion keeps the record').toBe(record)

  mocks.deleteOwnAccount.mockResolvedValueOnce({})
  fireEvent.change(passwordField(), { target: { value: 'Right-Passw0rd!' } })
  fireEvent.click(confirmButton())
  await waitFor(() => expect(mocks.toastSuccess).toHaveBeenCalledTimes(1))
  expect(localStorage.getItem(KEY), 'the deleted account is forgotten').toBeNull()
  expect(storedWhenToasted, 'the record is already gone when the success is shown').toBeNull()
  expect(mocks.signOut).toHaveBeenCalledTimes(1)
  localStorage.clear()
})

// Task 927 Amendment 7 (owner decision D17): an account with no password types DELETE in the profile's deletion dialog; an account with a password confirms with its password and has no typed field (Task 923 D54).
it('[SEC-927-FE-DELETE-TYPED] an account with no password deletes only after typing DELETE; an account with a password has no typed field', async () => {
  mocks.getReauthMethod.mockResolvedValue('google')
  await openDialog()
  await waitFor(() => expect(dialog().queryByLabelText(t.delete_account_password_confirm)).toBeNull())   // the method is known: no password field
  expect(confirmButton().disabled, 'nothing typed yet: the primary waits for the word').toBe(true)
  const typedField = dialog().getByLabelText(t.delete_account_type_confirm) as HTMLInputElement

  for (const typed of ['', 'DELET', 'REMOVE']) {
    fireEvent.change(typedField, { target: { value: typed } })
    expect(confirmButton().disabled, `"${typed}" does not enable the primary`).toBe(true)
    fireEvent.click(confirmButton())
    expect(mocks.deleteOwnAccount, `"${typed}" sends nothing`).not.toHaveBeenCalled()
    expect(mocks.signOut, `"${typed}" signs nobody out`).not.toHaveBeenCalled()
    expect(mocks.toastSuccess, `"${typed}" shows no success`).not.toHaveBeenCalled()
  }

  // the word is compared trimmed and in any case: the deletion then runs once, with no password
  mocks.deleteOwnAccount.mockResolvedValueOnce({})
  fireEvent.change(typedField, { target: { value: ' delete ' } })
  expect(confirmButton().disabled).toBe(false)
  fireEvent.click(confirmButton())
  await waitFor(() => expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(1))
  expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({})

  // an account with a password: the dialog asks for the password and has no typed field
  cleanup()
  mocks.getReauthMethod.mockReset()
  mocks.getReauthMethod.mockResolvedValue('password')
  await openDialog()
  expect(dialog().queryByLabelText(t.delete_account_type_confirm), 'no typed field for an account with a password').toBeNull()
  expect(passwordField().type).toBe('password')
})

function tCancel() { return messages.common.cancel }
