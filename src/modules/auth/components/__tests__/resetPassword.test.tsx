/**
 * The password reset page (Task 923 Revision 7). The one-time token from the e-mail is spent only when the person presses the button, never on page load (a mail
 * scanner opening the link must not use it up) and never on a password that breaks the rules; an expired or used link is explained; a wrong update does not look
 * like success; and after success the recovery session is ended so the link cannot be used to stay signed in.
 */
import React from 'react'
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../../messages/en.json'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const calls: string[] = []
const browser = vi.hoisted(() => ({
  getSession: vi.fn(), updatePassword: vi.fn(), signOut: vi.fn(), verifyOtp: vi.fn(),
}))
vi.mock('@/lib/auth/browser', () => ({
  getSession: (...a: unknown[]) => { calls.push('getSession'); return browser.getSession(...a) },
  updatePassword: (...a: unknown[]) => { calls.push('updatePassword'); return browser.updatePassword(...a) },
  signOut: (...a: unknown[]) => { calls.push('signOut'); return browser.signOut(...a) },
  verifyOtp: (...a: unknown[]) => { calls.push('verifyOtp'); return browser.verifyOtp(...a) },
}))
const logRecovery = vi.fn()
vi.mock('@/modules/auth/actions/recovery', () => ({ logPasswordRecoveryCompletion: (...a: unknown[]) => { calls.push('log'); return logRecovery(...a) } }))
const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import { ResetPasswordClient } from '../ResetPasswordClient'
import { ResetPasswordView, type ResetPasswordViewProps } from '../ResetPasswordView'

const STRONG = 'Str0ng!Passw0rd'
const a = messages.auth

setViewport(1024)
beforeEach(() => {
  calls.length = 0
  Object.values(browser).forEach((f) => f.mockReset())
  logRecovery.mockReset(); push.mockReset()
  browser.getSession.mockResolvedValue({ data: { session: null } })
  browser.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  browser.updatePassword.mockResolvedValue({ error: null })
  browser.signOut.mockResolvedValue({ error: null })
})
afterEach(() => cleanup())

const field = () => screen.getByLabelText(new RegExp(a.reset_password_new_label)) as HTMLInputElement
const submitBtn = () => screen.getByRole('button', { name: a.reset_password_submit })
async function type(value: string) { fireEvent.change(field(), { target: { value } }) }
async function ready(props: { tokenHash?: string; otpType?: string } = { tokenHash: 'hash123', otpType: 'recovery' }) {
  renderApp(<ResetPasswordClient locale="sq" {...props} />)
  await screen.findByLabelText(new RegExp(a.reset_password_new_label))
}

describe('ResetPasswordClient: opening the link', () => {
  it('a recovery link shows the form at once and does not touch the token or the session', async () => {
    await ready()
    expect(calls).toEqual([])
  })

  it.each([[undefined], ['signup'], ['magiclink'], ['RECOVERY'], ['']])('a token with the type %j is not a recovery link: the session path is used', async (otpType) => {
    renderApp(<ResetPasswordClient locale="sq" tokenHash="hash123" otpType={otpType} />)
    await screen.findByText(a.reset_password_expired_title)
    expect(calls).toEqual(['getSession'])
    expect(browser.verifyOtp).not.toHaveBeenCalled()
  })

  it('no token but a live session shows the form', async () => {
    browser.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'a@example.com' } } } })
    await ready({})
    expect(calls).toEqual(['getSession'])
  })

  it('no token and no session says the link has expired, and offers a new one that goes to the language home', async () => {
    renderApp(<ResetPasswordClient locale="sq" />)
    expect(await screen.findByText(a.reset_password_expired_title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: a.reset_password_request_new }))
    expect(push).toHaveBeenCalledWith('/sq')
  })

  it('shows a loader first', () => {
    browser.getSession.mockReturnValue(new Promise(() => {}))
    renderApp(<ResetPasswordClient locale="sq" />)
    expect(screen.queryByLabelText(new RegExp(a.reset_password_new_label))).toBeNull()
    expect(screen.queryByText(a.reset_password_expired_title)).toBeNull()
  })
})

describe('ResetPasswordClient: setting the password (token path)', () => {
  it('the button is disabled until every rule is met', async () => {
    await ready()
    expect(submitBtn()).toBeDisabled()
    await type('short')
    expect(submitBtn()).toBeDisabled()
    await type(STRONG)
    expect(submitBtn()).toBeEnabled()
  })

  it('spends the token on the button, then sets the password, records it, shows success and ends the session — in that order', async () => {
    await ready()
    await type(STRONG)
    fireEvent.click(submitBtn())
    expect(await screen.findByText(a.reset_password_success_title)).toBeInTheDocument()
    expect(calls).toEqual(['verifyOtp', 'updatePassword', 'log', 'signOut'])
    expect(browser.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash123', type: 'recovery' })
    expect(browser.updatePassword).toHaveBeenCalledWith(STRONG)
    fireEvent.click(screen.getByRole('button', { name: a.reset_password_go_login }))
    expect(push).toHaveBeenCalledWith('/sq/auth/login')
  })

  it('a form submitted around the disabled button with a weak password spends nothing', async () => {
    await ready()
    await type('weakpass')
    fireEvent.submit(field().closest('form')!)
    await act(async () => { await Promise.resolve() })
    expect(calls).toEqual([])
    expect(screen.queryByText(a.reset_password_success_title)).toBeNull()
  })

  it('an expired or used token says so, and the password is not set', async () => {
    browser.verifyOtp.mockResolvedValue({ data: { user: null }, error: { message: 'Token has expired or is invalid' } })
    await ready()
    await type(STRONG)
    fireEvent.click(submitBtn())
    expect(await screen.findByText(a.reset_password_expired_title)).toBeInTheDocument()
    expect(browser.updatePassword).not.toHaveBeenCalled()
    expect(logRecovery).not.toHaveBeenCalled()
  })

  it('a failed update shows a generic error, is not recorded as done, keeps the person signed in the recovery state, and lets them try again', async () => {
    browser.updatePassword.mockResolvedValue({ error: { message: 'New password should be different' } })
    await ready()
    await type(STRONG)
    fireEvent.click(submitBtn())
    expect(await screen.findByText(a.reset_password_error_generic)).toBeInTheDocument()
    expect(logRecovery).not.toHaveBeenCalled()
    expect(browser.signOut).not.toHaveBeenCalled()
    expect(screen.queryByText(a.reset_password_success_title)).toBeNull()
    expect(submitBtn()).toBeEnabled()
  })

  it('the completion is not recorded when verification returned no user', async () => {
    browser.verifyOtp.mockResolvedValue({ data: { user: null }, error: null })
    await ready()
    await type(STRONG)
    fireEvent.click(submitBtn())
    expect(await screen.findByText(a.reset_password_success_title)).toBeInTheDocument()
    expect(logRecovery).not.toHaveBeenCalled()
  })

  it('pressing the button twice spends the token once', async () => {
    let release!: (v: unknown) => void
    browser.verifyOtp.mockReturnValue(new Promise((r) => { release = r }))
    await ready()
    await type(STRONG)
    const form = field().closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(browser.verifyOtp).toHaveBeenCalledTimes(1)
    await act(async () => { release({ data: { user: { id: 'u1' } }, error: null }); await Promise.resolve() })
    await screen.findByText(a.reset_password_success_title)
  })

  it('the error clears when the person tries again', async () => {
    browser.updatePassword.mockResolvedValueOnce({ error: { message: 'x' } }).mockResolvedValue({ error: null })
    await ready()
    await type(STRONG)
    fireEvent.click(submitBtn())
    await screen.findByText(a.reset_password_error_generic)
    fireEvent.click(submitBtn())
    await screen.findByText(a.reset_password_success_title)
    expect(screen.queryByText(a.reset_password_error_generic)).toBeNull()
  })
})

describe('ResetPasswordClient: setting the password (session path)', () => {
  const session = (id: string | null) => ({ data: { session: id ? { user: { id, email: 'a@example.com' } } : null } })

  it('sets the password for the session, records it and ends the session; the token is never used', async () => {
    browser.getSession.mockResolvedValue(session('u9'))
    await ready({})
    await type(STRONG)
    fireEvent.click(submitBtn())
    await screen.findByText(a.reset_password_success_title)
    expect(calls).toEqual(['getSession', 'updatePassword', 'log', 'signOut'])
    expect(browser.verifyOtp).not.toHaveBeenCalled()
  })

  it('a failed update shows the error and does not record or sign out', async () => {
    browser.getSession.mockResolvedValue(session('u9'))
    browser.updatePassword.mockResolvedValue({ error: { message: 'x' } })
    await ready({})
    await type(STRONG)
    fireEvent.click(submitBtn())
    await screen.findByText(a.reset_password_error_generic)
    expect(logRecovery).not.toHaveBeenCalled()
    expect(browser.signOut).not.toHaveBeenCalled()
  })

  it('a weak password spends nothing on this path either', async () => {
    browser.getSession.mockResolvedValue(session('u9'))
    await ready({})
    await type('weak')
    fireEvent.submit(field().closest('form')!)
    await act(async () => { await Promise.resolve() })
    expect(browser.updatePassword).not.toHaveBeenCalled()
  })
})

describe('ResetPasswordView', () => {
  const base: ResetPasswordViewProps = {
    pageState: 'form', password: '', errorKey: null, submitting: false, allMet: false, passwordVisible: false,
    onPasswordChange: vi.fn(), onVisibilityChange: vi.fn(), onSubmit: vi.fn(), onRequestNew: vi.fn(), onGoLogin: vi.fn(),
  }
  const view = (over: Partial<ResetPasswordViewProps> = {}) => renderApp(<ResetPasswordView {...base} {...over} />)

  it('the form field asks the browser for a NEW password (so a manager offers a generated one, not the old one) and is required', () => {
    view()
    expect(field()).toHaveAttribute('autocomplete', 'new-password')
    expect(field()).toBeRequired()
    expect(field()).toHaveAttribute('type', 'password')
  })

  it('the visibility toggle is named for what it does and reports the change', () => {
    const onVisibilityChange = vi.fn()
    const { unmount } = view({ onVisibilityChange })
    fireEvent.mouseDown(screen.getByRole('button', { name: messages.common.show_password }))
    expect(onVisibilityChange).toHaveBeenCalledWith(true)
    unmount()
    view({ passwordVisible: true })
    expect(field()).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: messages.common.hide_password })).toBeInTheDocument()
  })

  it('submit is disabled while rules are unmet and while submitting; enabled otherwise', () => {
    const { unmount } = view({ allMet: false })
    expect(submitBtn()).toBeDisabled(); unmount()
    const b = view({ allMet: true, submitting: true })
    expect(submitBtn()).toBeDisabled(); b.unmount()
    view({ allMet: true })
    expect(submitBtn()).toBeEnabled()
  })

  it('an error key shows its translated text in an alert, and none shows no alert', () => {
    const { unmount } = view({ errorKey: 'reset_password_error_generic' })
    expect(screen.getByText(a.reset_password_error_generic)).toBeInTheDocument(); unmount()
    view()
    expect(screen.queryByText(a.reset_password_error_generic)).toBeNull()
  })

  it('typing reports the change and submitting reports the event', () => {
    const onPasswordChange = vi.fn(); const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    view({ onPasswordChange, onSubmit, allMet: true, password: STRONG })
    fireEvent.change(field(), { target: { value: STRONG + '1' } })
    expect(onPasswordChange).toHaveBeenCalled()
    fireEvent.submit(field().closest('form')!)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('the loading, expired and success states show only their own content with a working action', () => {
    const onRequestNew = vi.fn(); const onGoLogin = vi.fn()
    const l = view({ pageState: 'loading' })
    expect(screen.queryByRole('button')).toBeNull(); l.unmount()
    const e = view({ pageState: 'expired', onRequestNew })
    expect(screen.getByRole('heading', { level: 1, name: a.reset_password_expired_title })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: a.reset_password_request_new }))
    expect(onRequestNew).toHaveBeenCalledTimes(1); e.unmount()
    view({ pageState: 'success', onGoLogin })
    const heading = screen.getByRole('heading', { level: 1, name: a.reset_password_success_title })
    expect(within(heading.parentElement!).getByText(a.reset_password_success_body)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: a.reset_password_go_login }))
    expect(onGoLogin).toHaveBeenCalledTimes(1)
  })

  it('decorative icons are hidden from assistive technology', () => {
    view({ pageState: 'expired' })
    expect(document.querySelectorAll('svg[aria-hidden="true"]').length).toBeGreaterThan(0)
  })
})

// Task 923 R38 (case SEC-RP-FE-ERR)
it('[SEC-RP-FE-ERR] A password that breaks the rules never spends the one-time recovery token', async () => {
  await ready()
  await type('weakpass')
  expect(submitBtn()).toBeDisabled()                                   // the button waits for every rule
  fireEvent.submit(field().closest('form')!)                          // a submit around the disabled button
  await act(async () => { await Promise.resolve() })
  expect(browser.verifyOtp).not.toHaveBeenCalled()                    // the recovery token is not consumed
  expect(browser.updatePassword).not.toHaveBeenCalled()               // updateUser is not called
  expect(calls).toEqual([])
})
