/**
 * PhoneField — RTL smoke test (Task 556, Mantine/TailAdmin migration)
 *
 * Registry: docs/critical-flow-registry.md → "Phone entry (registration/profile/admin)" (added
 * by this task — PhoneField previously had no automated component coverage; only the
 * UI-agnostic `src/lib/phone/__tests__/phone.test.ts` logic was tested).
 *
 * The migration is a presentational primitive-swap only (legacy `Combobox`/`Input`/`Label` →
 * `MantineCombobox`/Mantine `TextInput`/`InputLabel`) — this smoke proves the wiring between the
 * new primitives and the untouched phone logic (`parsePhoneValue`/`buildE164`/`emit`) survived:
 *   1. Country change rebuilds the E.164 value with the new dial code.
 *   2. National-number change emits an updated E.164 value.
 *   3. A rejected paste fires `onPasteError` and does NOT mutate the field content.
 *
 * Planted-violation proof (documented, not asserted here — see Task 556 session log): commenting
 * out the `emit(...)` call inside `handleNationalChange` makes test 2 below FAIL (onChange never
 * called on national-number typing).
 */

import React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { PhoneField } from '../PhoneField'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
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

function withProvider(children: React.ReactNode) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

describe('PhoneField — Mantine migration wiring (Task 556)', () => {
  it('country change rebuilds the E.164 value with the new dial code', () => {
    const onChange = vi.fn()
    render(withProvider(<PhoneField value="+355691234567" onChange={onChange} />))

    // Country trigger starts on Albania (+355, parsed from the initial value). The trigger is a
    // readOnly TextInput (value is an attribute, not text content) — target it via its aria-label
    // (`triggerAriaLabel`, the `phone.country` key, mocked to return the raw key "country").
    fireEvent.click(screen.getByRole('textbox', { name: 'country' }))
    fireEvent.click(screen.getByText('🇩🇪 Germany'))

    expect(onChange).toHaveBeenCalledWith({
      national: '691234567',
      dialCode: '+49',
      iso2: 'DE',
      e164: '+49691234567',
    })
  })

  it('national-number change emits an updated E.164 value', () => {
    const onChange = vi.fn()
    const { container } = render(withProvider(<PhoneField value="+355" onChange={onChange} />))

    const nationalInput = container.querySelector('input[type="tel"]')!
    fireEvent.change(nationalInput, { target: { value: '691234567' } })

    expect(onChange).toHaveBeenCalledWith({
      national: '691234567',
      dialCode: '+355',
      iso2: 'AL',
      e164: '+355691234567',
    })
  })

  it('rejected paste fires onPasteError and does not mutate the field', () => {
    const onChange = vi.fn()
    const onPasteError = vi.fn()
    const { container } = render(
      withProvider(<PhoneField value="+355" onChange={onChange} onPasteError={onPasteError} />),
    )

    const nationalInput = container.querySelector('input[type="tel"]') as HTMLInputElement
    // German number pasted while Albania (+355) is selected → mismatch, rejected
    fireEvent.paste(nationalInput, {
      clipboardData: { getData: () => '+4915112345678' },
    })

    expect(onPasteError).toHaveBeenCalledWith('error_phone_country_mismatch')
    expect(onChange).not.toHaveBeenCalled()
    expect(nationalInput.value).toBe('')
  })
})
