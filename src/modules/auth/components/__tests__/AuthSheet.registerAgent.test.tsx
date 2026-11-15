/**
 * The agent sign-up company picker (Task 926, owner decisions D1 and D2 of 2026-10-18). What it protects:
 * - the sign-up only PICKS an existing company: no "add company" option, panel, name field or logo chooser is rendered (D1);
 * - the owner's note ("If you did not find your company, you can create it in your cabinet") is the picker's field description: it follows the input in the DOM
 *   and the input points at it with `aria-describedby` (D2);
 * - the company input has an accessible name, the picker's label (the `InputLabel` above it has no `htmlFor`).
 * The REAL `AuthSheet`, `MantineCombobox` and `MantineProvider` render; only the data hooks, the captcha widget and the two other pickers are doubles.
 */
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../../../../../messages/en.json'
import it_ from '../../../../../messages/it.json'
import sq from '../../../../../messages/sq.json'
import uk from '../../../../../messages/uk.json'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

vi.mock('@/lib/auth/browser', () => ({ signIn: vi.fn(), signInWithGoogleIdToken: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/modules/auth/actions/recovery', () => ({ logPasswordRecoveryRequest: vi.fn() }))
vi.mock('@/modules/auth/actions/captcha', () => ({ signUpWithCaptcha: vi.fn(), requestPasswordResetWithCaptcha: vi.fn() }))
vi.mock('@/modules/companies/hooks/useCompanies', () => ({ useCompanies: () => ({ companies: [{ id: 'c1', name: 'ACME' }], refetch: vi.fn() }) }))
vi.mock('@/modules/locations/hooks/useLocations', () => ({ useLocations: () => ({ locations: [] }) }))
vi.mock('@/components/shared/LocationCombobox', () => ({ LocationCombobox: () => <div data-testid="city" /> }))
vi.mock('@/components/shared/PhoneField', () => ({ PhoneField: () => <div data-testid="phone" /> }))
vi.mock('@/components/auth/CaptchaWidget', () => ({ CaptchaWidget: () => <div data-testid="captcha" /> }))

import { AuthSheet } from '../AuthSheet'

const LOCALES = { sq, en, uk, it: it_ } as const
/** the owner's note, verbatim (D2, translated by the owner into Ukrainian) */
const OWNER_NOTE_UK = 'Якщо ви не знайшли свою компанію, ви можете її створити у своєму кабінеті'

function openAgentSignUp(locale: keyof typeof LOCALES) {
  return render(
    <NextIntlClientProvider locale={locale} messages={LOCALES[locale] as never}>
      <MantineProvider theme={theme} env="test"><AuthSheet open onOpenChange={() => {}} initialView="register-agent" /></MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => { setViewport(1024) })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('agent sign-up: the company picker (Task 926)', () => {
  it('uk carries the owner text verbatim', () => {
    expect(uk.auth.company_not_found_hint).toBe(OWNER_NOTE_UK)
  })

  it.each(['uk', 'sq'] as const)('%s: the note is the picker description, after the input, and the input is named by the picker label', (locale) => {
    openAgentSignUp(locale)
    const messages = LOCALES[locale].auth
    const note = screen.getByText(messages.company_not_found_hint)
    const input = screen.getByLabelText(messages.company) as HTMLInputElement

    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('aria-describedby')).toBe(note.id)
    expect(note.id).not.toBe('')
    expect(input.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it.each(['uk', 'sq', 'en', 'it'] as const)('%s: every locale has its own note text, not the key and not another locale\'s text', (locale) => {
    const text = LOCALES[locale].auth.company_not_found_hint
    expect(text.length).toBeGreaterThan(20)
    for (const other of (['uk', 'sq', 'en', 'it'] as const).filter((l) => l !== locale)) expect(text).not.toBe(LOCALES[other].auth.company_not_found_hint)
  })

  it.each(['uk', 'sq', 'en', 'it'] as const)('%s: there is no way to add a company: no "+" button, no name field for a new company, no logo chooser', (locale) => {
    const view = openAgentSignUp(locale)
    expect(screen.queryByRole('button', { name: /^\+\s*\p{L}/u })).toBeNull()
    expect(document.querySelector('input[type="file"]')).toBeNull()
    expect(view.baseElement.querySelector('input[maxlength="120"]')).toBeNull()
    // the picker itself is still there
    expect(screen.getByLabelText(LOCALES[locale].auth.company)).toBeInTheDocument()
  })
})
