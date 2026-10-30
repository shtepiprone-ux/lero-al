/**
 * Security (Task 923 R66 (m)): a retry after a failed password update completes with the live recovery session.
 *  - SEC-X-FE-RESET-RETRY: the REAL `ResetPasswordClient` runs in the token path against a doubled browser auth module. The one-time token is verified (the recovery session
 *    is now live), the password update fails once, and the person presses the button again. The retry calls ONLY `updatePassword`: the token is not verified a second time
 *    (it is spent and would send the person to the "expired" page although the session is alive), and the flow ends on success, the completion notice and the sign-out.
 * The reproduction was run first: before the fix the second press called `verifyOtp` again and ended on the expired page.
 */
import React from 'react'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../messages/en.json'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const calls: string[] = []
const browser = vi.hoisted(() => ({ getSession: vi.fn(), updatePassword: vi.fn(), signOut: vi.fn(), verifyOtp: vi.fn() }))
vi.mock('@/lib/auth/browser', () => ({
  getSession: (...a: unknown[]) => { calls.push('getSession'); return browser.getSession(...a) },
  updatePassword: (...a: unknown[]) => { calls.push('updatePassword'); return browser.updatePassword(...a) },
  signOut: (...a: unknown[]) => { calls.push('signOut'); return browser.signOut(...a) },
  verifyOtp: (...a: unknown[]) => { calls.push('verifyOtp'); return browser.verifyOtp(...a) },
}))
const logRecovery = vi.fn()
vi.mock('@/modules/auth/actions/recovery', () => ({ logPasswordRecoveryCompletion: (...a: unknown[]) => { calls.push('log'); return logRecovery(...a) } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { ResetPasswordClient } from './ResetPasswordClient'

const STRONG = 'Str0ng!Passw0rd'
const a = messages.auth

setViewport(1024)
beforeEach(() => {
  calls.length = 0
  Object.values(browser).forEach((f) => f.mockReset())
  logRecovery.mockReset()
  browser.getSession.mockResolvedValue({ data: { session: null } })
  browser.verifyOtp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  browser.updatePassword.mockResolvedValue({ error: null })
  browser.signOut.mockResolvedValue({ error: null })
})
afterEach(() => cleanup())

const field = () => screen.getByLabelText(new RegExp(a.reset_password_new_label)) as HTMLInputElement
const submitBtn = () => screen.getByRole('button', { name: a.reset_password_submit })

async function ready() {
  renderApp(<ResetPasswordClient locale="sq" tokenHash="hash123" otpType="recovery" />)
  await screen.findByLabelText(new RegExp(a.reset_password_new_label))
  fireEvent.change(field(), { target: { value: STRONG } })
}
const press = async () => { fireEvent.click(submitBtn()); await vi.waitFor(() => expect(submitBtn() ?? null).not.toBeNull()) }

describe('ResetPasswordClient', () => {
  it('[SEC-X-FE-RESET-RETRY] a retry after a failed update succeeds', async () => {
    browser.updatePassword.mockResolvedValueOnce({ error: { message: 'temporary failure' } })
    // the one-time token verifies once; a second verification of the same token is refused, as Supabase Auth does for a spent token
    browser.verifyOtp.mockReset()
    browser.verifyOtp
      .mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null })
      .mockResolvedValue({ data: { user: null }, error: { message: 'Token has expired or is invalid' } })
    await ready()

    // first press: the token is verified, the update fails: the person stays on the form with the generic error
    fireEvent.click(submitBtn())
    await screen.findByText(a.reset_password_error_generic)
    expect(calls).toEqual(['verifyOtp', 'updatePassword'])
    expect(screen.queryByText(a.reset_password_expired_title)).toBeNull()

    // second press: ONLY updatePassword runs, with the live recovery session; the token is not verified again
    fireEvent.click(submitBtn())
    await vi.waitFor(() => expect(calls).toContain('signOut'))
    expect(calls).toEqual(['verifyOtp', 'updatePassword', 'updatePassword', 'log', 'signOut'])
    expect(browser.verifyOtp).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(a.reset_password_expired_title)).toBeNull()
    expect(logRecovery).toHaveBeenCalledTimes(1)
  })

  it('a token that cannot be verified still sends the person to the expired page, and a first-time success is unchanged (the controls)', async () => {
    browser.verifyOtp.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Token has expired or is invalid' } })
    await ready()
    fireEvent.click(submitBtn())
    await screen.findByText(a.reset_password_expired_title)
    expect(calls).toEqual(['verifyOtp'])

    cleanup()
    calls.length = 0
    await ready()
    fireEvent.click(submitBtn())
    await vi.waitFor(() => expect(calls).toContain('signOut'))
    expect(calls).toEqual(['verifyOtp', 'updatePassword', 'log', 'signOut'])
  })
})

void press
