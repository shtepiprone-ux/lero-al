/**
 * Shared phone-number utilities — single source of truth for every phone-entry
 * surface in the app (AuthSheet, RegisterForm, AdminUserCreate, AdminUserProfile,
 * ProfileTab/cabinet).
 *
 * Design:
 *   - COUNTRY_CODES is the ONLY country list. Each entry includes iso2 so
 *     validation can use libphonenumber-js with the correct country metadata.
 *   - validateNationalPhone() performs country-aware validation via
 *     libphonenumber-js, preceded by a series of cheap guards (empty, "+",
 *     duplicated dial code) and followed by a final E.164 safety guard.
 *   - All helpers are pure functions — safe to test and tree-shake.
 *
 * Task 158 / Sprint 4
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

// ── Country list ──────────────────────────────────────────────────────────────

export interface CountryEntry {
  iso2: string      // ISO 3166-1 alpha-2 used by libphonenumber-js
  dialCode: string  // e.g. "+355"
  flag: string      // emoji flag
  label: string     // English display name
}

export const COUNTRY_CODES: CountryEntry[] = [
  { iso2: 'AL', dialCode: '+355', flag: '🇦🇱', label: 'Albania' },
  { iso2: 'UA', dialCode: '+380', flag: '🇺🇦', label: 'Ukraine' },
  { iso2: 'IT', dialCode: '+39',  flag: '🇮🇹', label: 'Italy' },
  { iso2: 'GB', dialCode: '+44',  flag: '🇬🇧', label: 'United Kingdom' },
  { iso2: 'US', dialCode: '+1',   flag: '🇺🇸', label: 'United States' },
  { iso2: 'DE', dialCode: '+49',  flag: '🇩🇪', label: 'Germany' },
  { iso2: 'FR', dialCode: '+33',  flag: '🇫🇷', label: 'France' },
  { iso2: 'TR', dialCode: '+90',  flag: '🇹🇷', label: 'Turkey' },
  { iso2: 'XK', dialCode: '+383', flag: '🇽🇰', label: 'Kosovo' },
  { iso2: 'ME', dialCode: '+382', flag: '🇲🇪', label: 'Montenegro' },
  { iso2: 'BA', dialCode: '+387', flag: '🇧🇦', label: 'Bosnia' },
  { iso2: 'RS', dialCode: '+381', flag: '🇷🇸', label: 'Serbia' },
  { iso2: 'MK', dialCode: '+389', flag: '🇲🇰', label: 'North Macedonia' },
]

export const DEFAULT_COUNTRY: CountryEntry = COUNTRY_CODES[0] // Albania

// ── Parse helpers ─────────────────────────────────────────────────────────────

export interface ParsedPhone {
  dialCode: string   // e.g. "+355"
  iso2: string       // e.g. "AL"
  national: string   // local number only, no dial code or spaces
}

/** Split an E.164 string into { dialCode, iso2, national }. Falls back to AL. */
export function parsePhoneValue(e164: string): ParsedPhone {
  if (!e164) return { ...DEFAULT_COUNTRY, national: '' }
  const match = COUNTRY_CODES.find(c => e164.startsWith(c.dialCode))
  if (match) {
    return { dialCode: match.dialCode, iso2: match.iso2, national: e164.slice(match.dialCode.length) }
  }
  return { dialCode: DEFAULT_COUNTRY.dialCode, iso2: DEFAULT_COUNTRY.iso2, national: e164.replace(/^\+/, '') }
}

/** Strip visual separators (spaces, dashes, parentheses, dots) from a national number. */
export function normalizeNational(raw: string): string {
  return raw.replace(/[\s\-().]/g, '')
}

// ── Validation ────────────────────────────────────────────────────────────────

export type PhoneErrorKey = 'error_phone_invalid' | 'error_phone_no_country_code'

export type PhoneValidationResult =
  | { ok: true;  e164: string }
  | { ok: false; errorKey: PhoneErrorKey }

// Final E.164 safety guard: + then 1-9, then 7–14 more digits (8–15 total).
const E164_GUARD = /^\+[1-9]\d{7,14}$/

/**
 * Validate the national (local) part of a phone number for the selected country.
 *
 * Validation steps (in order):
 *   a) non-empty rawNational
 *   b) no "+" in rawNational → "without country code"
 *   c) normalize visual separators; reject non-digit chars
 *   d) national must not start with the selected dial-code digits → "without country code"
 *   e) PRIMARY: libphonenumber-js validates the combined E.164 against the country metadata
 *   f) produce normalized E.164 from parsed result
 *   g) FINAL safety guard /^\+[1-9]\d{7,14}$/ (last check only)
 */
export function validateNationalPhone(params: {
  iso2: string    // kept in public API for call-site clarity; validation uses dialCode via libphonenumber-js
  dialCode: string
  rawNational: string
}): PhoneValidationResult {
  const { dialCode, rawNational } = params
  // a) Require non-empty national
  if (!rawNational.trim()) return { ok: false, errorKey: 'error_phone_invalid' }

  // b) Reject "+" in national input
  if (rawNational.includes('+')) return { ok: false, errorKey: 'error_phone_no_country_code' }

  // c) Normalize; reject non-digit characters
  const normalized = normalizeNational(rawNational)
  if (!/^\d+$/.test(normalized)) return { ok: false, errorKey: 'error_phone_invalid' }

  // d) Reject if national starts with the dial-code digits (e.g. user typed "355691234567")
  const dialDigits = dialCode.replace('+', '')
  if (normalized.startsWith(dialDigits)) return { ok: false, errorKey: 'error_phone_no_country_code' }

  // e) PRIMARY: libphonenumber-js validation
  const fullNumber = `${dialCode}${normalized}`
  let parsed: ReturnType<typeof parsePhoneNumberFromString>
  try {
    parsed = parsePhoneNumberFromString(fullNumber)
  } catch {
    return { ok: false, errorKey: 'error_phone_invalid' }
  }
  if (!parsed || !parsed.isValid()) {
    return { ok: false, errorKey: 'error_phone_invalid' }
  }

  // f) Produce E.164
  // Note: country-awareness comes from libphonenumber-js's metadata for the selected
  // dial code — isValid() already validates against that country's number rules.
  // An explicit parsed.country !== iso2 check is omitted because shared dial codes
  // (e.g. +44 for GB/GG/JE/IM) would cause false rejections for valid numbers.
  const e164 = parsed.format('E.164')

  // g) Final safety guard
  if (!E164_GUARD.test(e164)) return { ok: false, errorKey: 'error_phone_invalid' }

  return { ok: true, e164 }
}
