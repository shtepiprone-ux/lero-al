'use client'

/**
 * PhoneField — shared two-field phone input (dial-code Combobox + national Input).
 *
 * Single canonical implementation used by AuthSheet, RegisterForm, AdminUserCreate,
 * AdminUserProfile, and ProfileTab/cabinet. Replaces four local copies.
 *
 * DOES NOT validate internally. Consumers call validateNationalPhone() from
 * @/lib/phone before submitting to get country-aware validation and the
 * normalized E.164 value.
 *
 * Mobile (<640px): dial-code Combobox and national Input stack full-width (P0).
 * Desktop (≥640px): Combobox fixed width, Input fills remaining space.
 *
 * Task 158 / Sprint 4 · Task 375 (multi-country, trunk prefix, paste, mobile full-width)
 */

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/shared/Combobox'
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
  /** 'default' → h-11 Combobox (cabinet/registration); 'sm' → h-10 (admin forms). */
  size?: 'default' | 'sm'
  /** Render Combobox dropdown via portal — use inside Sheet/Dialog/Table overflow contexts. */
  portal?: boolean
  /** Called with a localized error key when paste is rejected (mismatch/unsupported country). */
  onPasteError?: (errorKey: string) => void
}

export function PhoneField({
  value,
  onChange,
  label,
  error,
  size = 'default',
  portal = false,
  onPasteError,
}: PhoneFieldProps) {
  const t = useTranslations('phone')
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

  // Country selector: compact at all sizes — the PhoneField CONTAINER is full-width,
  // but within it the country code is always a compact fixed-width button.
  const countryClass = size === 'sm' ? 'w-24 shrink-0 pr-8' : 'w-28 shrink-0 pr-8'

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
  // sm: override Input's canonical h-11 to compact h-9 (matches Combobox sm)
  const inputClass = size === 'sm' ? 'h-9 rounded-xl' : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      {/* Always inline row: [compact country selector] [national input flex-1]
          The PhoneField container inherits its parent's full width. */}
      <div className="flex flex-row gap-2">
        <Combobox
          options={countryOptions}
          value={dialCode}
          onChange={handleCountryChange}
          variant="button"
          searchable
          searchPlaceholder={t('search_placeholder')}
          size={size === 'sm' ? 'sm' : 'default'}
          className={countryClass}
          triggerClassName={countryClass}
          portal={portal}
          dropdownMinWidth={240}
        />
        <Input
          type="tel"
          value={national}
          onChange={handleNationalChange}
          onPaste={handlePaste}
          placeholder={getPhonePlaceholder(iso2)}
          autoComplete="tel"
          className={cn('flex-1 min-w-0', inputClass)}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1 break-words">{error}</p>}
    </div>
  )
}
