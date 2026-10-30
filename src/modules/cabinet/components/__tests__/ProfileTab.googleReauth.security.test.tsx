/**
 * Task 927 (Amendment 2): the cabinet's Google re-confirmation. A Google-only account that asks for an e-mail change or for its deletion is answered `reauth_required`; the tab then
 * shows the Google button (no redirect of the page), and after a confirmation with the SAME account the action the person already asked for is repeated exactly once.
 * The REAL `ProfileTab`, `MantineDeleteConfirmModal`, `GoogleSignInButton`, `GoogleSignInSlot` and `googlePopup` render; the doubles are the cabinet server actions, the identity
 * context, the router, the toast, the browser auth wrapper and `window.open` (Amendment 10, D25: the button is our own and opens Google's window; the test plays Google's callback page
 * by posting the message that page sends to its opener, with the state read from the address the button gave `window.open`). The server's own recent-sign-in rule is covered by
 * reauthIdToken.security.test.ts.
 */
import { createHash } from 'node:crypto'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
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
const a = messages.auth
const CLIENT_ID = 'zz-synthetic-client.apps.googleusercontent.com'
const PROFILE = { id: 'user-1', name: 'Alba', phone: '', whatsapp: '', company_name: null, user_type: 'private', location_id: null, preferred_currency: 'ALL', avatar_url: null, pending_email: null }
const NEW_ADDRESS = 'new@example.com'

interface Attempt { state: string; hashedNonce: string; url: URL }

const base64url = (value: string) => Buffer.from(value, 'utf8').toString('base64url')
/** a credential shaped like a Google ID token: three base64url parts, the middle one a JSON payload (the signature is Supabase Auth's to check, not the tab's) */
const credentialFor = (email: string | undefined) => `${base64url('{"alg":"RS256"}')}.${base64url(JSON.stringify(email === undefined ? { sub: 'zz' } : { sub: 'zz', email }))}.${base64url('zz-signature')}`
const sha256Hex = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex')

const popup = { closed: false, close: vi.fn() }
let windowOpen: ReturnType<typeof vi.spyOn>
const signInButtons = (scope: ParentNode = document) => scope.querySelectorAll<HTMLButtonElement>('[data-google-sign-in]')
/** Waits, on real macrotasks, until `check` holds (the attempt hashes its nonce before it opens the window). */
async function until(check: () => boolean) {
  for (let turn = 0; turn < 500 && !check(); turn++) await new Promise<void>(resolve => setImmediate(resolve))
  expect(check()).toBe(true)
}
/** Lets the button finish preparing its attempt: its nonce is hashed on a worker thread as soon as it mounts, and a click opens Google's window only with a prepared attempt (Amendment 11). */
const flushPreparation = () => act(async () => { for (let turn = 0; turn < 20; turn++) await new Promise<void>(resolve => setImmediate(resolve)) })
/** Clicks the one Google button in `scope` and waits until the attempt has called `window.open`; returns what that attempt sent to Google. */
async function startAttempt(scope: ParentNode = document): Promise<Attempt> {
  const buttons = signInButtons(scope)
  expect(buttons, 'exactly one Google button is mounted').toHaveLength(1)
  await waitFor(() => expect(buttons[0].disabled, 'the button works again after the last attempt').toBe(false))
  const before = windowOpen.mock.calls.length
  await flushPreparation()
  await act(async () => {
    fireEvent.click(buttons[0])
    await until(() => windowOpen.mock.calls.length > before)
  })
  const url = new URL(windowOpen.mock.calls.at(-1)![0] as string)
  return { state: url.searchParams.get('state')!, hashedNonce: url.searchParams.get('nonce')!, url }
}
/** What Google's callback page does when the person picked an account: posts the ID token to its opener. */
async function pickAccount(attempt: Pick<Attempt, 'state'>, credential: string) {
  await act(async () => { window.dispatchEvent(new MessageEvent('message', { origin: window.location.origin, data: { type: 'lero:google-sign-in', state: attempt.state, credential } })) })
}

function renderTab() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>
        <ProfileTab profile={PROFILE as never} locale="en" cities={[]} regions={[]} email="person@example.com" />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

/** the e-mail section: type the new address, press Save, the server asks for Google; the Google button appears under the error line */
async function askEmailChange() {
  renderTab()
  await waitFor(() => expect(mocks.getReauthMethod).toHaveBeenCalled())
  await waitFor(() => expect(screen.queryByLabelText(t.password_current_label)).toBeNull())
  fireEvent.change(screen.getByRole('textbox', { name: new RegExp('^' + t.email_new_label) }), { target: { value: NEW_ADDRESS } })
  mocks.initiateEmailChange.mockResolvedValueOnce({ error: 'Sign in with Google again to change your email.', reason: 'reauth_required' })
  fireEvent.click(screen.getByRole('button', { name: messages.common.save }))
  expect(await screen.findByText('Sign in with Google again to change your email.')).toBeTruthy()
  await waitFor(() => expect(signInButtons()).toHaveLength(1))
}

/** the deletion dialog: type the word, press the red primary, the server asks for Google; the Google button appears in the dialog's Google section. Returns the dialog. */
async function askDeletion(): Promise<HTMLElement> {
  renderTab()
  await waitFor(() => expect(mocks.getReauthMethod).toHaveBeenCalled())
  fireEvent.click(screen.getByRole('button', { name: t.delete_account }))
  const dialog = await screen.findByRole('dialog')
  mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'reauth_required' })
  fireEvent.change(await within(dialog).findByLabelText(t.delete_account_type_confirm), { target: { value: 'DELETE' } })   // Task 927 D17: an account with no password types the word first
  fireEvent.click(within(dialog).getByRole('button', { name: t.delete_account_confirm }))
  expect(await within(dialog).findByText(t.delete_account_google_required)).toBeTruthy()
  await waitFor(() => expect(signInButtons(dialog)).toHaveLength(1))
  return dialog
}
const inDialog = () => within(screen.getByRole('dialog'))

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })   // jsdom has none
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', CLIENT_ID)
  for (const mock of Object.values(mocks)) mock.mockReset()
  popup.closed = false; popup.close.mockReset()
  windowOpen = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window)
  mocks.getReauthMethod.mockResolvedValue('google')
  mocks.signOut.mockImplementation((then?: () => void) => then?.())
  mocks.signInWithGoogleIdToken.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('[SEC-927-FE-REAUTH-ALLOW] a Google-only person who confirms with the Google account of the profile gets the e-mail change and the deletion they asked for, each once', async () => {
  // the e-mail change
  await askEmailChange()
  const mailAttempt = await startAttempt()
  expect(mailAttempt.url.searchParams.get('login_hint'), 'Google preselects the profile\'s own account').toBe('person@example.com')
  expect(mailAttempt.url.searchParams.get('client_id')).toBe(CLIENT_ID)
  mocks.initiateEmailChange.mockResolvedValueOnce({ pendingEmail: NEW_ADDRESS })
  await pickAccount(mailAttempt, credentialFor('Person@Example.com'))   // the same account, in another case

  await waitFor(() => expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(2))
  expect(mocks.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
  const [credential, nonce] = mocks.signInWithGoogleIdToken.mock.calls[0] as [string, string]
  expect(credential).toBe(credentialFor('Person@Example.com'))
  expect(mailAttempt.hashedNonce, 'Google got the SHA-256 hex of the raw nonce Supabase got').toBe(sha256Hex(nonce))
  expect(mocks.initiateEmailChange).toHaveBeenNthCalledWith(1, { newEmail: NEW_ADDRESS, locale: 'en' })
  expect(mocks.initiateEmailChange, 'the same new address, repeated once').toHaveBeenNthCalledWith(2, { newEmail: NEW_ADDRESS, locale: 'en' })
  expect(await screen.findByText(t.email_change_resend), 'the change is pending now').toBeTruthy()
  expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(2)

  // the deletion
  cleanup()
  mocks.signInWithGoogleIdToken.mockClear()
  const dialog = await askDeletion()
  const deleteAttempt = await startAttempt(dialog)
  expect(deleteAttempt.url.searchParams.get('login_hint')).toBe('person@example.com')
  expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(1)
  expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({})
  mocks.deleteOwnAccount.mockResolvedValueOnce({})
  await pickAccount(deleteAttempt, credentialFor('person@example.com'))

  await waitFor(() => expect(mocks.deleteOwnAccount).toHaveBeenCalledTimes(2))
  expect(mocks.deleteOwnAccount).toHaveBeenLastCalledWith({})
  expect(mocks.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1))
  expect(mocks.push, 'the person leaves only after the deletion succeeded').toHaveBeenCalledWith('/en')
  expect(mocks.toastSuccess).toHaveBeenCalledWith(t.delete_account_success)
  expect(mocks.deleteOwnAccount, 'the deletion ran exactly twice: the refused attempt and the repeat').toHaveBeenCalledTimes(2)
})

it('[SEC-927-FE-REAUTH-DENY-ACCOUNT] a Google confirmation with another account or an unreadable credential is refused before Supabase and repeats nothing', async () => {
  const wrongAccount = t.reauth_google_wrong_account.replace('{email}', 'person@example.com')

  await askEmailChange()
  await pickAccount(await startAttempt(), credentialFor('other@example.com'))
  expect(await screen.findByText(wrongAccount)).toBeTruthy()
  await pickAccount(await startAttempt(), 'this-is-not-a-jwt')
  await pickAccount(await startAttempt(), credentialFor(undefined))
  expect(screen.getByText(wrongAccount)).toBeTruthy()
  expect(mocks.signInWithGoogleIdToken, 'no Supabase sign-in with another account').not.toHaveBeenCalled()
  expect(mocks.initiateEmailChange, 'only the first, refused attempt').toHaveBeenCalledTimes(1)

  cleanup()
  const dialog = await askDeletion()
  await pickAccount(await startAttempt(dialog), credentialFor('other@example.com'))
  expect(await inDialog().findByText(wrongAccount)).toBeTruthy()
  await pickAccount(await startAttempt(dialog), 'a.b')
  expect(mocks.signInWithGoogleIdToken).not.toHaveBeenCalled()
  expect(mocks.deleteOwnAccount, 'only the first, refused attempt').toHaveBeenCalledTimes(1)
  expect(mocks.signOut).not.toHaveBeenCalled()
})

it('[SEC-927-FE-REAUTH-DENY-SWITCH] when the confirmation returns another account\'s session the person is signed out and nothing is repeated', async () => {
  mocks.signInWithGoogleIdToken.mockResolvedValue({ data: { user: { id: 'user-2' } }, error: null })

  await askEmailChange()
  await pickAccount(await startAttempt(), credentialFor('person@example.com'))
  await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1))
  expect(mocks.push).toHaveBeenCalledWith('/en')
  expect(mocks.initiateEmailChange, 'the e-mail change was not run for user-2').toHaveBeenCalledTimes(1)

  cleanup()
  mocks.signOut.mockClear(); mocks.push.mockClear()
  const dialog = await askDeletion()
  await pickAccount(await startAttempt(dialog), credentialFor('person@example.com'))
  await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1))
  expect(mocks.push).toHaveBeenCalledWith('/en')
  expect(mocks.deleteOwnAccount, 'the deletion was not run for user-2').toHaveBeenCalledTimes(1)
  expect(mocks.toastSuccess).not.toHaveBeenCalled()
})

it('[SEC-927-FE-REAUTH-ERR] a failed Google confirmation or an unavailable Google script shows an error and repeats nothing', async () => {
  const sinks = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined))
  await askEmailChange()
  mocks.signInWithGoogleIdToken.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Bad ID token' } })
  await pickAccount(await startAttempt(), credentialFor('person@example.com'))
  expect(await screen.findByText(t.reauth_google_failed)).toBeTruthy()
  mocks.signInWithGoogleIdToken.mockRejectedValueOnce(new Error('network'))
  await pickAccount(await startAttempt(), credentialFor('person@example.com'))
  await waitFor(() => expect(mocks.signInWithGoogleIdToken).toHaveBeenCalledTimes(2))
  expect(screen.getByText(t.reauth_google_failed)).toBeTruthy()
  expect(mocks.initiateEmailChange, 'nothing was repeated').toHaveBeenCalledTimes(1)

  // the browser refuses Google's window: the slot's own notice, without advice to use a password, and no loader left
  windowOpen.mockReturnValue(null)
  await startAttempt()
  const notice = await screen.findByText(a.google_popup_blocked)
  expect(notice.textContent).not.toMatch(/password/i)
  expect(screen.queryByRole('status')).toBeNull()
  expect(signInButtons()[0].hasAttribute('data-loading'), 'no loader is left on the button').toBe(false)
  expect(mocks.signInWithGoogleIdToken).toHaveBeenCalledTimes(2)   // only the two earlier attempts
  expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(1)
  expect(JSON.stringify(sinks.flatMap(sink => sink.mock.calls.map(call => call.map(String)))), 'no credential in the console').not.toContain(credentialFor('person@example.com'))
})

it('[SEC-927-FE-REAUTH-ONE-CONFIG] after the deletion dialog with its own Google button closes, a confirmation in the e-mail section still repeats the e-mail change once', async () => {
  // the tab mounts only one Google button at a time, so the answer of a dialog's attempt can never finish the e-mail section's
  await askEmailChange()
  expect(signInButtons(), 'the e-mail section\'s button').toHaveLength(1)

  // the deletion dialog opens and its deletion needs Google too: the e-mail section's button is gone, the dialog's button is the only one
  fireEvent.click(screen.getByRole('button', { name: t.delete_account }))
  const dialog = await screen.findByRole('dialog')
  mocks.deleteOwnAccount.mockResolvedValueOnce({ error: 'reauth_required' })
  fireEvent.change(await within(dialog).findByLabelText(t.delete_account_type_confirm), { target: { value: 'DELETE' } })   // Task 927 D17: an account with no password types the word first
  fireEvent.click(within(dialog).getByRole('button', { name: t.delete_account_confirm }))
  expect(await within(dialog).findByText(t.delete_account_google_required)).toBeTruthy()
  await waitFor(() => expect(signInButtons(), 'two Google buttons are never mounted at once').toHaveLength(1))
  expect(signInButtons(dialog), 'and it is the dialog\'s').toHaveLength(1)
  const dialogAttempt = await startAttempt(dialog)   // Google's window of the dialog is open

  // the dialog closes: the e-mail section's button is mounted again, and the dialog's attempt can no longer finish anything
  fireEvent.click(within(dialog).getByRole('button', { name: messages.common.cancel }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  await waitFor(() => expect(signInButtons(), 'the dialog\'s button is gone, the e-mail section\'s is mounted').toHaveLength(1))
  const mailAttempt = await startAttempt()
  expect(mailAttempt.state).not.toBe(dialogAttempt.state)

  await pickAccount(dialogAttempt, credentialFor('person@example.com'))   // the dialog's attempt answers late
  expect(mocks.signInWithGoogleIdToken, 'a message of the dialog\'s attempt completes nothing').not.toHaveBeenCalled()
  expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(1)

  mocks.initiateEmailChange.mockResolvedValueOnce({ pendingEmail: NEW_ADDRESS })
  await pickAccount(mailAttempt, credentialFor('person@example.com'))
  await waitFor(() => expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(2))
  expect(mocks.signInWithGoogleIdToken).toHaveBeenCalledTimes(1)
  expect(mocks.initiateEmailChange, 'the same new address, repeated once').toHaveBeenNthCalledWith(2, { newEmail: NEW_ADDRESS, locale: 'en' })
  expect(mocks.deleteOwnAccount, 'the deletion was not repeated').toHaveBeenCalledTimes(1)
})
