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
 * Task 158 / Sprint 4
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/shared/Combobox'
import { COUNTRY_CODES, parsePhoneValue } from '@/lib/phone'

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
}

export function PhoneField({
  value,
  onChange,
  label,
  error,
  size = 'default',
  portal = false,
}: PhoneFieldProps) {
  const parsed = parsePhoneValue(value)
  const [dialCode, setDialCode] = useState(parsed.dialCode)
  const [iso2, setIso2] = useState(parsed.iso2)
  const [national, setNational] = useState(parsed.national)

  function emit(newDialCode: string, newIso2: string, newNational: string) {
    const cleaned = newNational.replace(/\s/g, '')
    onChange({
      national: newNational,
      dialCode: newDialCode,
      iso2: newIso2,
      e164: cleaned ? `${newDialCode}${cleaned}` : '',
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
    const raw = e.target.value
    setNational(raw)
    emit(dialCode, iso2, raw)
  }

  const comboboxSize = size === 'sm' ? 'sm' : 'default'
  const comboboxWidth = size === 'sm' ? 'w-20 shrink-0' : 'w-[90px] shrink-0'
  const inputClass = size === 'sm' ? 'h-10 rounded-xl' : undefined

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Combobox
          options={COUNTRY_CODES.map(c => ({ value: c.dialCode, label: `${c.flag} ${c.dialCode}`, description: c.label }))}
          value={dialCode}
          onChange={handleCountryChange}
          variant="input"
          size={comboboxSize}
          triggerClassName={comboboxWidth}
          className={comboboxWidth}
          portal={portal}
          dropdownMinWidth={200}
        />
        <Input
          type="tel"
          value={national}
          onChange={handleNationalChange}
          placeholder="69 123 456"
          autoComplete="tel"
          className={inputClass}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
