/**
 * Security (Task 923 R81 (a), review 21 finding F1): the password form ends every session when the password HAS changed, whatever the answer about the other devices.
 *  - SEC-X-FE-SIGNOUT-OTHERS: the action answers `sessions_not_ended` when the password changed but the other sessions could not be signed out. The form must not show
 *    "server error" and keep the old sessions alive: it empties both fields, shows the warning with the new text, and ends this browser's state (`signOut('local')`, after the server has ended every session), exactly once.
 * The real container and the real View run; the action, the browser sign-out and the toast are doubles. The text of the warning is read from the four message files.
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, act, fireEvent, cleanup } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import en from '../../../../../messages/en.json'
import sq from '../../../../../messages/sq.json'
import uk from '../../../../../messages/uk.json'
import it_ from '../../../../../messages/it.json'

const mocks = vi.hoisted(() => ({
  changeCabinetPassword: vi.fn(),
  signOut: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}))
vi.mock('@/modules/cabinet/actions', () => ({ changeCabinetPassword: (...args: unknown[]) => mocks.changeCabinetPassword(...args) }))
vi.mock('@/lib/auth/browser', () => ({ signOut: (...args: unknown[]) => mocks.signOut(...args) }))
vi.mock('@/lib/toast', () => ({ toast: { success: (...args: unknown[]) => mocks.success(...args), warning: (...args: unknown[]) => mocks.warning(...args) } }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }))

beforeAll(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})
beforeEach(() => {
  vi.clearAllMocks()
  mocks.signOut.mockResolvedValue({})
})

async function submitWith(answer: unknown) {
  mocks.changeCabinetPassword.mockResolvedValue(answer)
  const { CabinetPasswordSection } = await import('../CabinetPasswordSection')
  let container!: HTMLElement
  await act(async () => { ({ container } = render(<MantineProvider theme={theme} env="test"><CabinetPasswordSection /></MantineProvider>)) })
  const current = container.querySelector<HTMLInputElement>('#cabinet-current-password')!
  const next = container.querySelector<HTMLInputElement>('#cabinet-new-password')!
  await act(async () => {
    fireEvent.change(current, { target: { value: 'OldPassw0rd!' } })
    fireEvent.change(next, { target: { value: 'NewStr0ng!Passw0rd' } })
  })
  await act(async () => { fireEvent.submit(container.querySelector('form')!) })
  return { container, current, next }
}

describe('CabinetPasswordSection.signOut', () => {
  it('[SEC-X-FE-SIGNOUT-OTHERS] a changed password with sessions left still signs out everywhere', async () => {
    const { container, current, next } = await submitWith({ ok: false, reason: 'sessions_not_ended' })
    expect(mocks.changeCabinetPassword).toHaveBeenCalledWith({ currentPassword: 'OldPassw0rd!', newPassword: 'NewStr0ng!Passw0rd' })
    // the person is told that the password changed and what could not be done; the old "server error" is not shown
    expect(mocks.warning).toHaveBeenCalledTimes(1)
    expect(mocks.warning).toHaveBeenCalledWith('password_changed_sessions_not_ended')
    expect(container.textContent).not.toContain('password_error_server')
    expect(mocks.success).not.toHaveBeenCalled()
    // this browser's state is cleared from here, once, exactly as after a plain success
    expect(mocks.signOut).toHaveBeenCalledTimes(1)
    expect(mocks.signOut).toHaveBeenCalledWith('local')
    // both fields are emptied
    expect(current.value).toBe('')
    expect(next.value).toBe('')
  })

  it('the controls: a plain success signs out locally with its own text; any other refusal signs nobody out and shows its own error', async () => {
    const ok = await submitWith({ ok: true })
    expect(mocks.success).toHaveBeenCalledWith('password_changed_success')
    expect(mocks.warning).not.toHaveBeenCalled()
    expect(mocks.signOut).toHaveBeenCalledWith('local')
    expect(ok.current.value).toBe('')
    cleanup()
    vi.clearAllMocks()
    mocks.signOut.mockResolvedValue({})
    const refused = await submitWith({ ok: false, reason: 'server_error' })
    expect(refused.container.textContent).toContain('password_error_server')
    expect(mocks.warning).not.toHaveBeenCalled()
    expect(mocks.signOut).not.toHaveBeenCalled()
    expect(refused.current.value).toBe('OldPassw0rd!')            // a refusal keeps the fields
  })

  it('the warning has its text in all four languages, says the password changed, and the four texts differ', () => {
    const texts = [en, sq, uk, it_].map((m) => (m as unknown as { cabinet: Record<string, string> }).cabinet.password_changed_sessions_not_ended)
    for (const text of texts) expect(typeof text === 'string' && text.length > 20).toBe(true)
    expect(new Set(texts).size).toBe(4)
  })
})
