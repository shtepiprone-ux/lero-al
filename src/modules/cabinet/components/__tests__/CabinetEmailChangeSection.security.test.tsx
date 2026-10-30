/**
 * Security (Task 923 R83): the cabinet e-mail change section.
 *  - SEC-X-FE-EMAIL-SECTION-DENY: no change without the proof. With the password field empty the submit is disabled and `initiateEmailChange` is not called, not even by a form submit;
 *    `invalid_password` shows its text in the red alert, keeps the address in the field and shows no waiting notice; Google's control mounts only after the server asked for it and
 *    only while the page allows it (`googleAllowed`), so two Google buttons are never mounted at once.
 *  - SEC-X-FE-EMAIL-SECTION-ALLOW: a proven change waits for its confirmation: one call with the address, the locale and the password; the waiting notice names the new address; no field
 *    keeps the password; the resend calls `resendEmailVerification` once.
 * The REAL container and View render; the doubles are the two cabinet server actions and the tab's Google handler (a prop). Google's control renders in its deterministic
 * unavailable state (no client ID): jsdom neither loads Google's script nor draws its button.
 */
import { type ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../../messages/en.json'

const mocks = vi.hoisted(() => ({
  initiateEmailChange: vi.fn(),
  resendEmailVerification: vi.fn(),
}))

vi.mock('@/modules/cabinet/actions', () => ({
  initiateEmailChange: mocks.initiateEmailChange,
  resendEmailVerification: mocks.resendEmailVerification,
}))

import { CabinetEmailChangeSection } from '../CabinetEmailChangeSection'

const t = messages.cabinet
const a = messages.auth
type SectionProps = ComponentProps<typeof CabinetEmailChangeSection>

const NEW_ADDRESS = 'new@example.com'
const defaults = (): SectionProps => ({
  email: 'person@example.com',
  initialPendingEmail: null,
  locale: 'en',
  reauthMethod: 'password',
  googleAllowed: true,
  onGoogleCredential: vi.fn(),
})

function renderSection(props: Partial<SectionProps> = {}) {
  const ui = (override: Partial<SectionProps>) => (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme}>
        <CabinetEmailChangeSection {...defaults()} {...props} {...override} />
      </MantineProvider>
    </NextIntlClientProvider>
  )
  const view = render(ui({}))
  return { ...view, rerenderWith: (override: Partial<SectionProps>) => view.rerender(ui(override)) }
}

const address = () => screen.getByRole('textbox', { name: /^New email/ }) as HTMLInputElement
const password = () => screen.getByLabelText(t.password_current_label) as HTMLInputElement
const submit = () => screen.getByRole('button', { name: t.email_change_submit }) as HTMLButtonElement

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })   // jsdom has none; Google's slot measures its width with Mantine's useElementSize
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '')
  for (const mock of Object.values(mocks)) mock.mockReset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('CabinetEmailChangeSection', () => {
  it('[SEC-X-FE-EMAIL-SECTION-DENY] no e-mail change without the proof', async () => {
    // a password account: the action waits for the password and nothing is sent without it
    renderSection()
    fireEvent.change(address(), { target: { value: NEW_ADDRESS } })
    expect(submit().disabled, 'the submit waits for the password').toBe(true)
    fireEvent.click(submit())
    fireEvent.submit(address().closest('form') as HTMLFormElement)
    expect(mocks.initiateEmailChange, 'no call without the password, not even by a form submit').not.toHaveBeenCalled()

    // a wrong password: the refusal is shown, the address stays, nothing is waiting
    fireEvent.change(password(), { target: { value: 'wrong-password' } })
    expect(submit().disabled).toBe(false)
    mocks.initiateEmailChange.mockResolvedValueOnce({ error: 'Current password is incorrect.', reason: 'invalid_password' })
    fireEvent.click(submit())
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('Current password is incorrect.')
    expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(1)
    expect(mocks.initiateEmailChange).toHaveBeenLastCalledWith({ newEmail: NEW_ADDRESS, locale: 'en', currentPassword: 'wrong-password' })
    expect(address().value, 'the address stays in the field').toBe(NEW_ADDRESS)
    expect(screen.queryByText(t.email_change_pending_title), 'no waiting notice after a refusal').toBeNull()
    expect(screen.queryByText(t.email_change_resend)).toBeNull()
    expect(screen.queryByText(a.google_reauth_unavailable), 'invalid_password does not offer Google').toBeNull()

    // an unknown method asks for the password too
    cleanup()
    renderSection({ reauthMethod: null })
    fireEvent.change(address(), { target: { value: NEW_ADDRESS } })
    expect(password().type).toBe('password')
    expect(submit().disabled).toBe(true)

    // a Google-only account: no password is sent, Google's control mounts only after the server asked, and only while the page allows it
    cleanup()
    mocks.initiateEmailChange.mockClear()
    const google = renderSection({ reauthMethod: 'google' })
    expect(screen.queryByLabelText(t.password_current_label), 'a Google-only account has no password field').toBeNull()
    expect(screen.queryByText(a.google_reauth_unavailable), 'not mounted before the server asked').toBeNull()
    fireEvent.change(address(), { target: { value: NEW_ADDRESS } })
    mocks.initiateEmailChange.mockResolvedValueOnce({ error: 'Sign in with Google again to change your email.', reason: 'reauth_required' })
    fireEvent.click(submit())
    expect(await screen.findByText('Sign in with Google again to change your email.')).toBeTruthy()
    expect(mocks.initiateEmailChange).toHaveBeenLastCalledWith({ newEmail: NEW_ADDRESS, locale: 'en' })
    expect(await screen.findByText(a.google_reauth_unavailable), 'mounted once the server asked').toBeTruthy()
    google.rerenderWith({ googleAllowed: false })
    expect(screen.queryByText(a.google_reauth_unavailable), 'the deletion dialog owns the only Google button').toBeNull()
    google.rerenderWith({ googleAllowed: true })
    expect(await screen.findByText(a.google_reauth_unavailable), 'mounted again when the dialog is gone').toBeTruthy()
    expect(mocks.initiateEmailChange, 'nothing else was sent').toHaveBeenCalledTimes(1)
  })

  it('[SEC-X-FE-EMAIL-SECTION-ALLOW] the proven change waits for confirmation', async () => {
    renderSection()
    fireEvent.change(address(), { target: { value: `  ${NEW_ADDRESS}  ` } })
    fireEvent.change(password(), { target: { value: 'Right-Passw0rd!' } })
    mocks.initiateEmailChange.mockResolvedValueOnce({ pendingEmail: NEW_ADDRESS })
    fireEvent.click(submit())

    expect(await screen.findByText(t.email_change_pending_title), 'the waiting notice').toBeTruthy()
    expect(screen.getByText(t.email_change_pending.replace('{email}', NEW_ADDRESS))).toBeTruthy()
    expect(mocks.initiateEmailChange).toHaveBeenCalledTimes(1)
    expect(mocks.initiateEmailChange).toHaveBeenCalledWith({ newEmail: NEW_ADDRESS, locale: 'en', currentPassword: 'Right-Passw0rd!' })
    expect(screen.queryByLabelText(t.password_current_label), 'no field keeps the password').toBeNull()
    expect(screen.queryByRole('textbox', { name: /^New email/ }), 'the form is replaced by the notice').toBeNull()
    expect(document.body.innerHTML).not.toContain('Right-Passw0rd!')

    mocks.resendEmailVerification.mockResolvedValueOnce({})
    fireEvent.click(screen.getByRole('button', { name: t.email_change_resend }))
    await waitFor(() => expect(mocks.resendEmailVerification).toHaveBeenCalledTimes(1))
    expect(mocks.resendEmailVerification).toHaveBeenCalledWith({ locale: 'en' })
    expect(await screen.findByRole('button', { name: t.email_change_resend }), 'the resend is available again').toBeTruthy()
    expect(mocks.initiateEmailChange, 'no second request').toHaveBeenCalledTimes(1)
  })

  // behaviour carried over from the block of the profile tab
  it('an address that does not look like one is refused by the section itself, and a refused resend is shown', async () => {
    renderSection({ reauthMethod: 'google' })
    fireEvent.change(address(), { target: { value: 'alba.k@example' } })
    fireEvent.click(submit())
    expect((await screen.findByRole('alert')).textContent).toBe(t.error_email_invalid)
    expect(mocks.initiateEmailChange, 'nothing is sent for an address that does not look like one').not.toHaveBeenCalled()
    expect(address().placeholder, 'the hint is said once, by the description').toBe('')

    cleanup()
    renderSection({ initialPendingEmail: 'waiting@example.com' })
    expect(screen.getByText(t.email_change_pending.replace('{email}', 'waiting@example.com'))).toBeTruthy()
    mocks.resendEmailVerification.mockResolvedValueOnce({ error: 'Too many requests. Please try again in one hour.' })
    fireEvent.click(screen.getByRole('button', { name: t.email_change_resend }))
    expect(await screen.findByText('Too many requests. Please try again in one hour.'), 'the refusal is shown next to the waiting notice').toBeTruthy()
    expect(screen.getByText(t.email_change_pending_title), 'the notice stays').toBeTruthy()
  })
})
