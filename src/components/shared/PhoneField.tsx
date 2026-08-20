'use client'

/**
 * PhoneField — shared two-field phone input (dial-code MantineCombobox + national TextInput).
 *
 * Single canonical implementation used by AuthSheet, RegisterForm, AdminUserCreate,
 * AdminUserProfile, and ProfileTab/cabinet. Replaces four local copies.
 *
 * DOES NOT validate internally. Consumers call validateNationalPhone() from
 * @/lib/phone before submitting to get country-aware validation and the
 * normalized E.164 value.
 *
 * Always an inline row at every breakpoint: [compact country trigger] [national input flex-1].
 * The row itself is full-width (clause 11); the country trigger is the ONE documented compact
 * exemption (a fixed-width dial-code button, not a text field) via `triggerWidth` below. The
 * dropdown/sheet is a full-width bottom sheet `<640` (MantineCombobox default).
 *
 * Task 158 / Sprint 4 · Task 375 (multi-country, trunk prefix, paste, mobile full-width) ·
 * Task 556 (Mantine/TailAdmin migration — presentational swap only, all phone LOGIC unchanged)
 */

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Group, InputLabel, Stack, TextInput } from '@mantine/core'
import { MantineCombobox } from '@/design-system/mantine/patterns'
import {
  COUNTRY_CODES,
  parsePhoneValue,
  getPhonePlaceholder,
  normalizePastedNational,
  getCountryDisplayName,
  getAllCountrySearchText,
} from '@/lib/phone'

export interface PhoneFieldValue {
  national: string   // raw local number as entered (no dial code, no spaces stripped)
  dialCode: string   // e.g. "+355"
  iso2: string       // e.g. "AL"
  e164: string       // combined E.164 or "" when national is empty
}

interface PhoneFieldProps {
  /** Current value as E.164 string (e.g. "+355691234567") or empty string. */
  value: string
  onChange: (v: PhoneFieldValue) => void
  label?: string
  error?: string
  /**
   * Documented no-op (Task 556, STOP-AND-ASK precedent from Task 552's `YearCombobox`):
   * `MantineCombobox`'s dropdown/sheet always renders via a portal (`Combobox.Dropdown`'s
   * `withinPortal` defaults `true`; the mobile path is a portaled bottom sheet), so it never
   * clips inside an `overflow:hidden/auto` container regardless of this flag. Kept on the public
   * API only so every existing call site stays byte-identical.
   */
  portal?: boolean
  /** Called with a localized error key when paste is rejected (mismatch/unsupported country). */
  onPasteError?: (errorKey: string) => void
}

export function PhoneField({
  value,
  onChange,
  label,
  error,
  onPasteError,
}: PhoneFieldProps) {
  const t = useTranslations('phone')
  const tc = useTranslations('common')
  const locale = useLocale()
  const parsed = parsePhoneValue(value)
  const [dialCode, setDialCode] = useState(parsed.dialCode)
  const [iso2, setIso2] = useState(parsed.iso2)
  const [national, setNational] = useState(parsed.national)

  function buildE164(dc: string, nat: string) {
    const cleaned = nat.replace(/\s/g, '')
    return cleaned ? `${dc}${cleaned}` : ''
  }

  function emit(newDialCode: string, newIso2: string, newNational: string) {
    onChange({
      national: newNational,
      dialCode: newDialCode,
      iso2: newIso2,
      e164: buildE164(newDialCode, newNational),
    })
  }

  function handleCountryChange(newDialCode: string | null | undefined) {
    if (!newDialCode) return
    const entry = COUNTRY_CODES.find(c => c.dialCode === newDialCode)
    if (!entry) return
    setDialCode(entry.dialCode)
    setIso2(entry.iso2)
    emit(entry.dialCode, entry.iso2, national)
  }

  function handleNationalChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Block non-phone characters: allow digits + standard phone formatting chars.
    // "+" belongs in the dial-code slot only.
    const raw = e.target.value.replace(/[^\d\s\-().]/g, '')
    setNational(raw)
    emit(dialCode, iso2, raw)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text')
    if (!pasted) return

    const result = normalizePastedNational(pasted, dialCode)
    if (!result.ok) {
      e.preventDefault()
      onPasteError?.(result.errorKey)
      return
    }

    // If normalization extracted a national value, replace the field content
    const pastedNational = result.national.replace(/[^\d\s\-().]/g, '')
    if (pastedNational !== pasted.replace(/[^\d\s\-().]/g, '')) {
      // Normalization changed the value (e.g., stripped country code from full intl paste)
      e.preventDefault()
      setNational(pastedNational)
      emit(dialCode, iso2, pastedNational)
    }
    // Otherwise let the default paste + handleNationalChange handle it
  }

  // Country options:
  //  label        → compact trigger text: "🇦🇱 +355"
  //  dropdownLabel → localized name shown in dropdown items: "🇦🇱 Shqipëri" (sq) / "🇦🇱 Албанія" (uk)
  //  description  → dial code shown as muted secondary text in dropdown
  //  searchText   → all 4 locale names concatenated for cross-language search
  const countryOptions = useMemo(() =>
    COUNTRY_CODES.map(c => ({
      value: c.dialCode,
      label: `${c.flag} ${c.dialCode}`,
      dropdownLabel: `${c.flag} ${getCountryDisplayName(c.iso2, locale)}`,
      description: c.dialCode,
      searchText: getAllCountrySearchText(c.iso2),
    })),
    [locale]
  )

  return (
    <Stack gap={6}>
      {label && <InputLabel>{label}</InputLabel>}
      {/* Always inline row: [compact country selector] [national input flex-1]
          The PhoneField container inherits its parent's full width (clause 11) — the
          country trigger is the ONE documented compact exemption (Task 556). */}
      {/* align="stretch" replicates the original plain `<div className="flex flex-row gap-2">`'s
          browser-default align-items:stretch — Group's own default is align="center", which
          visually sank the country trigger when the sibling TextInput grew taller (error state). */}
      <Group gap="xs" wrap="nowrap" align="stretch">
        <MantineCombobox
          options={countryOptions}
          value={dialCode}
          onChange={handleCountryChange}
          variant="button"
          searchable
          searchPlaceholder={t('search_placeholder')}
          noResultsLabel={tc('no_results')}
          triggerAriaLabel={t('country')}
          sheetTitle={t('country')}
          triggerWidth={{ base: '7rem', sm: '7rem' }} // design-tokens-allow: : '7rem' — owner-specified (Task 556 STOP-AND-ASK #1), matches the legacy w-28 compact country-trigger width (112px = 7rem) verbatim
          dropdownMinWidth={240}
        />
        <TextInput
          type="tel"
          value={national}
          onChange={handleNationalChange}
          onPaste={handlePaste}
          placeholder={getPhonePlaceholder(iso2)}
          autoComplete="tel"
          error={error}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Group>
    </Stack>
  )
}
