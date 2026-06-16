/**
 * Guard smoke — ResetPasswordClient mount + submit behavior (Task 441 / AC3).
 *
 * Key invariant (Task 439 fix): when the reset-password page receives `tokenHash` and
 * `otpType='recovery'` as props (from the URL query params), the component MUST show
 * the reset form WITHOUT calling verifyOtp. verifyOtp is only called inside handleSubmit
 * (on explicit user gesture), never on component mount.
 *
 * This ensures a scanner GET on the link does not consume the one-time token.
 *
 * ## Why Vitest + jsdom (not Playwright)
 * All behavioral contracts (verifyOtp timing, success/expired state transitions) are at
 * action/function call level — not pixel-level UI. RTL renders the component tree in
 * jsdom, fires real DOM events, and awaits async state updates via act(). No running
 * server needed; contracts are fully exercised deterministically. Playwright would add
 * infra complexity (full Next.js server, live Supabase) without covering any new contract.
 *
 * ## Stubbing approach
 * All external I/O is isolated at the module boundary:
 * - @/lib/auth/browser (verifyOtp, getSession, updatePassword, signOut) → vi.fn()
 *   Each mock is configured per-test in beforeEach / individual test to control exactly
 *   which path is exercised without Supabase credentials or network.
 * - UI components (Button, Label, Alert, PasswordInput, lucide icons) → thin wrappers
 *   that render as standard HTML elements so RTL can find and interact with them.
 *   These are visual-only; no business logic lives in them.
 * - next-intl / next/navigation → minimal stubs; translation keys returned as-is so
 *   assertions on visible text remain locale-independent.
 *
 * ## No disposable live test user needed
 * verifyOtp is a one-way token-consume call that requires a live Supabase project and
 * a valid one-time token. Stubbing it at the module boundary gives the same behavioral
 * contract: the test proves verifyOtp is called (or not) at the right moment, and that
 * the component reacts correctly to success or error. Whether the real Supabase call
 * would succeed is a concern for integration / E2E; the component's responsibility is
 * only to route control correctly to verifyOtp + updatePassword on submit.
 *
 * ## What remains manual-only
 * The full PKCE roundtrip (OAuth Google) and magic-link (real email → live token) cannot
 * be replicated without a live Supabase project and real provider session. These are
 * documented as manual-only in the Task 441 session log. They are exempt per kickoff.
 *
 * Planted-violation proof (see session log for transcript):
 *   Add `verifyOtp({token_hash: tokenHash!, type: 'recovery'})` call inside the
 *   `if (tokenHash && otpType === 'recovery')` branch of useEffect (pre-Task-439 bug) →
 *   expect(mockVerifyOtp).not.toHaveBeenCalled() FAILS.
 *   Revert → PASS.
 *
 * Command: npx vitest run src/modules/auth/components/__tests__/ResetPasswordClient.smoke.test.ts
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, fireEvent } from '@testing-library/react'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockVerifyOtp      = vi.fn()
const mockGetSession     = vi.fn()
const mockUpdatePassword = vi.fn()
const mockBrowserSignOut = vi.fn()

vi.mock('@/lib/auth/browser', () => ({
  verifyOtp:      (...args: unknown[]) => mockVerifyOtp(...args),
  getSession:     (...args: unknown[]) => mockGetSession(...args),
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
  signOut:        (...args: unknown[]) => mockBrowserSignOut(...args),
}))

vi.mock('@/modules/auth/actions/recovery', () => ({
  logPasswordRecoveryCompletion: vi.fn().mockResolvedValue(undefined),
  logPasswordRecoveryRequest:    vi.fn().mockResolvedValue(undefined),
}))

// UI stubs — thin wrappers so RTL can find and interact with DOM elements
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children, onClick, type, disabled,
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode; size?: string; variant?: string }) =>
    React.createElement('button', { onClick, type, disabled }, children),
}))
vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children?: React.ReactNode; htmlFor?: string }) =>
    React.createElement('label', { htmlFor }, children),
}))
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { role: 'alert' }, children),
  AlertDescription: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('p', null, children),
}))
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))
vi.mock('@/components/ui/PasswordInput', () => ({
  PasswordInput: (props: React.InputHTMLAttributes<HTMLInputElement> & { inputState?: string }) =>
    React.createElement('input', { ...props, inputState: undefined }),
}))
vi.mock('@/components/ui/PasswordRequirementsHint', () => ({
  PasswordRequirementsHint: () => null,
  allPasswordRulesMet: (pw: string) => pw.length >= 8,
}))
vi.mock('lucide-react', () => ({
  Loader2:      () => null,
  CheckCircle2: () => null,
  XCircle:      () => null,
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  // Default: no pre-existing session (legacy path → expired state)
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  // Default success stubs (overridden per-test when testing failure paths)
  mockVerifyOtp.mockResolvedValue({ data: { user: { id: 'uid', email: 'u@e.com' } }, error: null })
  mockUpdatePassword.mockResolvedValue({ error: null })
  mockBrowserSignOut.mockResolvedValue({})
})

// ── Mount-behavior tests ──────────────────────────────────────────────────────

describe('ResetPasswordClient — mount behavior smoke (AC3, Task 441)', () => {
  it('tokenHash + type=recovery: shows form WITHOUT calling verifyOtp on mount', async () => {
    const { ResetPasswordClient } = await import('../ResetPasswordClient')

    await act(async () => {
      render(
        React.createElement(ResetPasswordClient, {
          locale: 'sq',
          tokenHash: 'test-recovery-hash',
          otpType: 'recovery',
        })
      )
    })

    // Critical invariant: verifyOtp must NOT be called on mount.
    // If it were, a scanner GET would consume the one-time token (pre-439 bug).
    expect(mockVerifyOtp).not.toHaveBeenCalled()
    // No session check needed in the token_hash branch (avoids unnecessary async call)
    expect(mockGetSession).not.toHaveBeenCalled()
  })

  it('no tokenHash: calls getSession (legacy session path), verifyOtp NOT called on mount', async () => {
    const { ResetPasswordClient } = await import('../ResetPasswordClient')

    await act(async () => {
      render(React.createElement(ResetPasswordClient, { locale: 'sq' }))
    })

    // verifyOtp must never be called on mount — regardless of path
    expect(mockVerifyOtp).not.toHaveBeenCalled()
    // In the legacy path, getSession IS called to check for a pre-established session
    expect(mockGetSession).toHaveBeenCalledOnce()
  })
})

// ── Submit-path tests ─────────────────────────────────────────────────────────

describe('ResetPasswordClient — submit behavior smoke (AC3, Task 441)', () => {
  it('form submit: verifyOtp called with correct token_hash + type — NOT on mount', async () => {
    const { ResetPasswordClient } = await import('../ResetPasswordClient')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(
        React.createElement(ResetPasswordClient, {
          locale: 'sq',
          tokenHash: 'submit-test-hash',
          otpType: 'recovery',
        })
      ))
    })

    // Not called on mount
    expect(mockVerifyOtp).not.toHaveBeenCalled()

    // Fill password field (length ≥ 8 so allPasswordRulesMet = true → button enabled)
    const input = container!.querySelector('input')!
    await act(async () => {
      fireEvent.change(input, { target: { value: 'NewP@ss123' } })
    })

    // Submit the form
    await act(async () => {
      fireEvent.submit(container!.querySelector('form')!)
    })

    // NOW verifyOtp must be called, only after user gesture
    expect(mockVerifyOtp).toHaveBeenCalledOnce()
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: 'submit-test-hash',
      type: 'recovery',
    })
    // updatePassword called after successful verify
    expect(mockUpdatePassword).toHaveBeenCalledWith('NewP@ss123')
  })

  it('success path: verifyOtp ok → updatePassword → success state shown (link usable post-mount)', async () => {
    // This proves the link remains usable after a GET/mount without token consumption:
    // mount → form shown (no verifyOtp) → submit → verifyOtp ok → password changed → success.
    const { ResetPasswordClient } = await import('../ResetPasswordClient')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(
        React.createElement(ResetPasswordClient, {
          locale: 'sq',
          tokenHash: 'valid-once-hash',
          otpType: 'recovery',
        })
      ))
    })

    // Guard: link not burned on mount
    expect(mockVerifyOtp).not.toHaveBeenCalled()
    // Form is present after mount (link is usable)
    expect(container!.querySelector('form')).toBeTruthy()

    const input = container!.querySelector('input')!
    await act(async () => {
      fireEvent.change(input, { target: { value: 'NewP@ss123' } })
    })
    await act(async () => {
      fireEvent.submit(container!.querySelector('form')!)
    })

    // verifyOtp called on submit only; updatePassword follows
    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: 'valid-once-hash', type: 'recovery' })
    expect(mockUpdatePassword).toHaveBeenCalledWith('NewP@ss123')
    // Success state: t('reset_password_success_title') is in the DOM
    // (useTranslations mock returns key as-is, so text = 'reset_password_success_title')
    expect(container!.textContent).toContain('reset_password_success_title')
    // signOut called after success (session cleanup)
    expect(mockBrowserSignOut).toHaveBeenCalled()
  })

  it('expired/used token on submit → expired state + request-new CTA rendered', async () => {
    // verifyOtp returns error (expired/already-used token) → component shows expired UI with
    // request-new CTA. This is the N2 failure path documented in the component.
    mockVerifyOtp.mockResolvedValue({ data: {}, error: { message: 'Token has expired or already been used' } })

    const { ResetPasswordClient } = await import('../ResetPasswordClient')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(
        React.createElement(ResetPasswordClient, {
          locale: 'sq',
          tokenHash: 'expired-hash',
          otpType: 'recovery',
        })
      ))
    })

    const input = container!.querySelector('input')!
    await act(async () => {
      fireEvent.change(input, { target: { value: 'NewP@ss123' } })
    })
    await act(async () => {
      fireEvent.submit(container!.querySelector('form')!)
    })

    // verifyOtp was invoked (submit path worked)
    expect(mockVerifyOtp).toHaveBeenCalledOnce()
    // updatePassword must NOT be called when verifyOtp fails
    expect(mockUpdatePassword).not.toHaveBeenCalled()
    // Expired state: t('reset_password_request_new') in DOM = the request-new CTA
    expect(container!.textContent).toContain('reset_password_request_new')
    // Also: expired title shown
    expect(container!.textContent).toContain('reset_password_expired_title')
  })
})
