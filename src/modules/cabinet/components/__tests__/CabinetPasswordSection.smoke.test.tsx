/**
 * Guard smoke — CabinetPasswordSection behavior (Task 873, new coverage — this component
 * previously had none; only the UI-agnostic action logic could be exercised indirectly).
 *
 * Covers the container's own decision logic, unchanged by the Task 873 container/View split:
 *   1. Same-password guard: submit is disabled when current === new, even when the new
 *      password meets every rule (`isSamePassword` in `CabinetPasswordSection.tsx`).
 *   2. `invalid_current` error mapping shows the localized alert.
 *   3. A successful change calls `signOut('global')` (session cleanup after a password change).
 *   4. (Review 1, §16.3, AC5′) The new-password field's Mantine `description` link: the input has
 *      a non-empty `aria-describedby` that resolves to a `<div>` containing all five
 *      `password_rule_*` keys — the accessibility link the owner (D81-5) required be preserved.
 *   5. (Review 1, §16.2) Both reveal toggles carry a real accessible name (no `aria-hidden`) and
 *      toggle the input's `type` on click.
 *
 * ## Stubbing approach
 * `CabinetPasswordSection` renders `CabinetPasswordSectionView` (real, unmocked Mantine tree)
 * inside a `<MantineProvider>` — same convention as `ResetPasswordClient.smoke.test.ts` and
 * `PhoneField.smoke.test.tsx`. External I/O isolated at the module boundary:
 * - @/modules/cabinet/actions (changeCabinetPassword) → vi.fn()
 * - @/lib/auth/browser (signOut) → vi.fn()
 * - @/lib/toast → vi.fn() (Mantine notifications store is not mounted in this tree)
 * - next-intl → minimal stub; translation keys returned as-is.
 *
 * Planted-violation proofs (Task 873 session log has the transcripts):
 * - comment out the `currentPassword.length === 0 || isSamePassword` disjuncts inside
 *   `submitDisabled`'s computation in `CabinetPasswordSection.tsx` → the "same-password guard"
 *   test below FAILS (submit button no longer disabled for identical passwords). Revert → PASS.
 * - (§16.6 P3) remove `description` from the new-password `PasswordInput` in
 *   `CabinetPasswordSectionView.tsx` → the AC5′ test FAILS (empty `aria-describedby`). Revert → PASS.
 * - (§16.6 P4) remove `visibilityToggleButtonProps` from the new-password `PasswordInput` → the
 *   §16.2 toggle test FAILS (`aria-hidden="true"`, no accessible name). Revert → PASS.
 *
 * Command: npx vitest run src/modules/cabinet/components/__tests__/CabinetPasswordSection.smoke.test.tsx
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, act, fireEvent, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'

const mockChangeCabinetPassword = vi.fn()
vi.mock('@/modules/cabinet/actions', () => ({
  changeCabinetPassword: (...args: unknown[]) => mockChangeCabinetPassword(...args),
}))

const mockSignOut = vi.fn()
vi.mock('@/lib/auth/browser', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

const mockToastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

beforeEach(() => {
  vi.clearAllMocks()
  mockChangeCabinetPassword.mockResolvedValue({ ok: true })
  mockSignOut.mockResolvedValue({})
})

function withProvider(children: React.ReactNode) {
  return <MantineProvider theme={theme} env="test">{children}</MantineProvider>
}

describe('CabinetPasswordSection — same-password guard (Task 873)', () => {
  it('submit stays disabled when current and new password are identical', async () => {
    const { CabinetPasswordSection } = await import('../CabinetPasswordSection')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(withProvider(<CabinetPasswordSection />)))
    })

    const current = container!.querySelector<HTMLInputElement>('#cabinet-current-password')!
    const next = container!.querySelector<HTMLInputElement>('#cabinet-new-password')!
    const submit = container!.querySelector<HTMLButtonElement>('button[type="submit"]')!

    await act(async () => {
      fireEvent.change(current, { target: { value: 'Sample123!' } })
      fireEvent.change(next, { target: { value: 'Sample123!' } })
    })

    expect(submit.disabled).toBe(true)
    expect(container!.textContent).toContain('password_error_same')

    await act(async () => {
      fireEvent.submit(container!.querySelector('form')!)
    })
    expect(mockChangeCabinetPassword).not.toHaveBeenCalled()
  })
})

describe('CabinetPasswordSection — server error mapping (Task 873)', () => {
  it('invalid_current reason shows the localized alert', async () => {
    mockChangeCabinetPassword.mockResolvedValue({ ok: false, reason: 'invalid_current' })
    const { CabinetPasswordSection } = await import('../CabinetPasswordSection')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(withProvider(<CabinetPasswordSection />)))
    })

    const current = container!.querySelector<HTMLInputElement>('#cabinet-current-password')!
    const next = container!.querySelector<HTMLInputElement>('#cabinet-new-password')!

    await act(async () => {
      fireEvent.change(current, { target: { value: 'WrongPass1!' } })
      fireEvent.change(next, { target: { value: 'Sample123!' } })
    })
    await act(async () => {
      fireEvent.submit(container!.querySelector('form')!)
    })

    expect(mockChangeCabinetPassword).toHaveBeenCalledWith({
      currentPassword: 'WrongPass1!',
      newPassword: 'Sample123!',
    })
    expect(container!.textContent).toContain('password_error_invalid_current')
    expect(mockSignOut).not.toHaveBeenCalled()
  })
})

describe('CabinetPasswordSection — success path (Task 873)', () => {
  it('a successful change calls signOut("global")', async () => {
    mockChangeCabinetPassword.mockResolvedValue({ ok: true })
    const { CabinetPasswordSection } = await import('../CabinetPasswordSection')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(withProvider(<CabinetPasswordSection />)))
    })

    const current = container!.querySelector<HTMLInputElement>('#cabinet-current-password')!
    const next = container!.querySelector<HTMLInputElement>('#cabinet-new-password')!

    await act(async () => {
      fireEvent.change(current, { target: { value: 'OldPass123!' } })
      fireEvent.change(next, { target: { value: 'Sample123!' } })
    })
    await act(async () => {
      fireEvent.submit(container!.querySelector('form')!)
    })

    expect(mockChangeCabinetPassword).toHaveBeenCalledWith({
      currentPassword: 'OldPass123!',
      newPassword: 'Sample123!',
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('password_changed_success')
    expect(mockSignOut).toHaveBeenCalledWith('global')
  })
})

describe('CabinetPasswordSection — new-password hint stays linked (Task 873, §16.3, AC5′, owner D81-5)', () => {
  it('the new-password field has a non-empty aria-describedby resolving to a div with all five rule keys', async () => {
    const { CabinetPasswordSection } = await import('../CabinetPasswordSection')

    await act(async () => {
      render(withProvider(<CabinetPasswordSection />))
    })

    // Found by its label (the mocked `password_new_label` key-echo), not by its `id` — the id is
    // this component's own implementation detail, not the accessibility contract under test.
    const newInput = screen.getByLabelText(/password_new_label/) as HTMLInputElement
    const describedBy = newInput.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()

    const descriptionNode = document.getElementById(describedBy!)
    expect(descriptionNode).toBeTruthy()
    expect(descriptionNode!.tagName).toBe('DIV')
    for (const key of [
      'password_rule_length',
      'password_rule_uppercase',
      'password_rule_lowercase',
      'password_rule_digit',
      'password_rule_special',
    ]) {
      expect(descriptionNode!.textContent).toContain(key)
    }
  })
})

describe('CabinetPasswordSection — reveal toggles have an accessible name (Task 873, §16.2)', () => {
  it('both toggles are not aria-hidden and carry a localized label; clicking toggles the input type', async () => {
    const { CabinetPasswordSection } = await import('../CabinetPasswordSection')
    let container: HTMLElement

    await act(async () => {
      ;({ container } = render(withProvider(<CabinetPasswordSection />)))
    })

    const currentRoot = container!.querySelector('#cabinet-current-password')!.closest('.mantine-PasswordInput-root')!
    const newRoot = container!.querySelector('#cabinet-new-password')!.closest('.mantine-PasswordInput-root')!
    const currentToggle = currentRoot.querySelector<HTMLButtonElement>('.mantine-PasswordInput-visibilityToggle')!
    const newToggle = newRoot.querySelector<HTMLButtonElement>('.mantine-PasswordInput-visibilityToggle')!

    for (const toggle of [currentToggle, newToggle]) {
      expect(toggle.getAttribute('aria-hidden')).not.toBe('true')
      expect(toggle.getAttribute('aria-label')).toBe('show_password')
    }

    const newInput = container!.querySelector<HTMLInputElement>('#cabinet-new-password')!
    expect(newInput.type).toBe('password')

    // Mantine's PasswordInput toggle handles onMouseDown (preventDefault) and onTouchEnd, not
    // onClick — a real click event never reaches its toggle handler.
    await act(async () => {
      fireEvent.mouseDown(newToggle)
    })

    expect(newToggle.getAttribute('aria-label')).toBe('hide_password')
    expect(newInput.type).toBe('text')
  })
})
