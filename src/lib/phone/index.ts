/**
 * Shared phone-number utilities — single source of truth for every phone-entry
 * surface in the app (AuthSheet, RegisterForm, AdminUserCreate, AdminUserProfile,
 * ProfileTab/cabinet).
 *
 * Design:
 *   - COUNTRY_CODES is the ONLY country list. Each entry includes iso2 so
 *     validation can use libphonenumber-js with the correct country metadata.
 *   - validateNationalPhone() performs country-aware validation via
 *     libphonenumber-js, including domestic trunk-prefix handling (e.g. leading
 *     0 in FR/DE/GB/AT/IE) via a national-format fallback parse.
 *   - normalizePastedNational() handles full-international paste, stripping the
 *     selected country's dial code and detecting mismatched countries.
 *   - getPhonePlaceholder() returns a country-specific national format example.
 *   - All helpers are pure functions — safe to test and tree-shake.
 *
 * Task 158 / Sprint 4 · Task 375 (multi-country, trunk prefix, paste, placeholders)
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js/min'

// ── Country list ──────────────────────────────────────────────────────────────

export interface CountryEntry {
  iso2: string      // ISO 3166-1 alpha-2 used by libphonenumber-js
  dialCode: string  // e.g. "+355"
  flag: string      // emoji flag
  label: string     // English display name
}

// Albania first (default); remaining entries sorted A-Z by label.
// Russia and Belarus excluded per product policy. US included for Albanian diaspora.
export const COUNTRY_CODES: CountryEntry[] = [
  { iso2: 'AL', dialCode: '+355', flag: '🇦🇱', label: 'Albania' },
  { iso2: 'AD', dialCode: '+376', flag: '🇦🇩', label: 'Andorra' },
  { iso2: 'AM', dialCode: '+374', flag: '🇦🇲', label: 'Armenia' },
  { iso2: 'AT', dialCode: '+43',  flag: '🇦🇹', label: 'Austria' },
  { iso2: 'AZ', dialCode: '+994', flag: '🇦🇿', label: 'Azerbaijan' },
  { iso2: 'BE', dialCode: '+32',  flag: '🇧🇪', label: 'Belgium' },
  { iso2: 'BA', dialCode: '+387', flag: '🇧🇦', label: 'Bosnia' },
  { iso2: 'BG', dialCode: '+359', flag: '🇧🇬', label: 'Bulgaria' },
  { iso2: 'HR', dialCode: '+385', flag: '🇭🇷', label: 'Croatia' },
  { iso2: 'CY', dialCode: '+357', flag: '🇨🇾', label: 'Cyprus' },
  { iso2: 'CZ', dialCode: '+420', flag: '🇨🇿', label: 'Czech Republic' },
  { iso2: 'DK', dialCode: '+45',  flag: '🇩🇰', label: 'Denmark' },
  { iso2: 'EE', dialCode: '+372', flag: '🇪🇪', label: 'Estonia' },
  { iso2: 'FI', dialCode: '+358', flag: '🇫🇮', label: 'Finland' },
  { iso2: 'FR', dialCode: '+33',  flag: '🇫🇷', label: 'France' },
  { iso2: 'GE', dialCode: '+995', flag: '🇬🇪', label: 'Georgia' },
  { iso2: 'DE', dialCode: '+49',  flag: '🇩🇪', label: 'Germany' },
  { iso2: 'GR', dialCode: '+30',  flag: '🇬🇷', label: 'Greece' },
  { iso2: 'HU', dialCode: '+36',  flag: '🇭🇺', label: 'Hungary' },
  { iso2: 'IS', dialCode: '+354', flag: '🇮🇸', label: 'Iceland' },
  { iso2: 'IE', dialCode: '+353', flag: '🇮🇪', label: 'Ireland' },
  { iso2: 'IT', dialCode: '+39',  flag: '🇮🇹', label: 'Italy' },
  { iso2: 'XK', dialCode: '+383', flag: '🇽🇰', label: 'Kosovo' },
  { iso2: 'LV', dialCode: '+371', flag: '🇱🇻', label: 'Latvia' },
  { iso2: 'LI', dialCode: '+423', flag: '🇱🇮', label: 'Liechtenstein' },
  { iso2: 'LT', dialCode: '+370', flag: '🇱🇹', label: 'Lithuania' },
  { iso2: 'LU', dialCode: '+352', flag: '🇱🇺', label: 'Luxembourg' },
  { iso2: 'MT', dialCode: '+356', flag: '🇲🇹', label: 'Malta' },
  { iso2: 'MD', dialCode: '+373', flag: '🇲🇩', label: 'Moldova' },
  { iso2: 'MC', dialCode: '+377', flag: '🇲🇨', label: 'Monaco' },
  { iso2: 'ME', dialCode: '+382', flag: '🇲🇪', label: 'Montenegro' },
  { iso2: 'NL', dialCode: '+31',  flag: '🇳🇱', label: 'Netherlands' },
  { iso2: 'MK', dialCode: '+389', flag: '🇲🇰', label: 'North Macedonia' },
  { iso2: 'NO', dialCode: '+47',  flag: '🇳🇴', label: 'Norway' },
  { iso2: 'PL', dialCode: '+48',  flag: '🇵🇱', label: 'Poland' },
  { iso2: 'PT', dialCode: '+351', flag: '🇵🇹', label: 'Portugal' },
  { iso2: 'RO', dialCode: '+40',  flag: '🇷🇴', label: 'Romania' },
  { iso2: 'SM', dialCode: '+378', flag: '🇸🇲', label: 'San Marino' },
  { iso2: 'RS', dialCode: '+381', flag: '🇷🇸', label: 'Serbia' },
  { iso2: 'SK', dialCode: '+421', flag: '🇸🇰', label: 'Slovakia' },
  { iso2: 'SI', dialCode: '+386', flag: '🇸🇮', label: 'Slovenia' },
  { iso2: 'ES', dialCode: '+34',  flag: '🇪🇸', label: 'Spain' },
  { iso2: 'SE', dialCode: '+46',  flag: '🇸🇪', label: 'Sweden' },
  { iso2: 'CH', dialCode: '+41',  flag: '🇨🇭', label: 'Switzerland' },
  { iso2: 'TR', dialCode: '+90',  flag: '🇹🇷', label: 'Turkey' },
  { iso2: 'UA', dialCode: '+380', flag: '🇺🇦', label: 'Ukraine' },
  { iso2: 'GB', dialCode: '+44',  flag: '🇬🇧', label: 'United Kingdom' },
  { iso2: 'US', dialCode: '+1',   flag: '🇺🇸', label: 'United States' },
  { iso2: 'VA', dialCode: '+379', flag: '🇻🇦', label: 'Vatican City' },
]

export const DEFAULT_COUNTRY: CountryEntry = COUNTRY_CODES[0] // Albania

// ── Excluded countries (hard policy) ─────────────────────────────────────────
// Dial code prefixes that must be rejected in paste handling.
const EXCLUDED_DIAL_PREFIXES = [
  '7',   // Russia (+7)
  '375', // Belarus (+375)
]

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

/** Strip visual separators (spaces, dashes, parentheses, dots, NBSP) from a national number. */
export function normalizeNational(raw: string): string {
  return raw.replace(/[\s\-(). ​]/g, '')
}

// ── Country-specific placeholder examples ─────────────────────────────────────

// Representative national-format example numbers (without country code or trunk prefix).
// These are format examples only — not a prescriptive list of valid prefixes.
const PHONE_PLACEHOLDER_MAP: Record<string, string> = {
  AL: '67 123 4567',    AD: '31 23456',       AM: '55 123 456',
  AT: '664 123456',     AZ: '50 123 45 67',   BE: '470 12 34 56',
  BA: '61 123 456',     BG: '87 123 4567',    HR: '91 234 5678',
  CY: '96 123456',      CZ: '601 123 456',    DK: '20 12 34 56',
  EE: '51 234 567',     FI: '40 123 4567',    FR: '6 12 34 56 78',
  GE: '591 23 45 67',   DE: '151 12345678',   GR: '691 234 5678',
  HU: '20 123 4567',    IS: '611 1234',        IE: '83 123 4567',
  IT: '312 345 6789',   XK: '43 123 456',     LV: '21 234 567',
  LI: '660 1234',       LT: '612 34567',      LU: '621 123 456',
  MT: '9921 2345',      MD: '60 212 345',     MC: '6 12 34 56 78',
  ME: '67 123 456',     NL: '6 12345678',     MK: '70 123 456',
  NO: '406 12 345',     PL: '512 345 678',    PT: '912 345 678',
  RO: '712 345 678',    SM: '0549 123456',    RS: '601 234 567',
  SK: '903 123 456',    SI: '40 123 456',     ES: '612 345 678',
  SE: '701 234 567',    CH: '78 123 45 67',   TR: '501 234 5678',
  UA: '50 123 4567',    GB: '7700 900123',    US: '201 555 0123',
  VA: '06 6982 1234',
}

/** Return a country-specific national-format example for use as input placeholder. */
export function getPhonePlaceholder(iso2: string): string {
  return PHONE_PLACEHOLDER_MAP[iso2] ?? 'XX XXX XXXX'
}

// ── Localized country names — CLDR-sourced static table ──────────────────────
//
// Pre-computed from Node.js Intl.DisplayNames (CLDR data) to guarantee consistent
// results across all environments (Node, Chrome, Firefox, Safari, Edge).
// Covers all 4 project locales: sq (Albanian) · en (English) · uk (Ukrainian) · it (Italian)
// Re-generate via: node -e "const dn=(l)=>new Intl.DisplayNames([l],{type:'region'})..."

const COUNTRY_NAMES_I18N: Record<string, Partial<Record<'sq' | 'en' | 'uk' | 'it', string>>> = {
  AL: { sq: 'Shqipëri', en: 'Albania', uk: 'Албанія', it: 'Albania' },
  AD: { sq: 'Andorrë', en: 'Andorra', uk: 'Андорра', it: 'Andorra' },
  AM: { sq: 'Armeni', en: 'Armenia', uk: 'Вірменія', it: 'Armenia' },
  AT: { sq: 'Austri', en: 'Austria', uk: 'Австрія', it: 'Austria' },
  AZ: { sq: 'Azerbajxhan', en: 'Azerbaijan', uk: 'Азербайджан', it: 'Azerbaigian' },
  BE: { sq: 'Belgjikë', en: 'Belgium', uk: 'Бельгія', it: 'Belgio' },
  BA: { sq: 'Bosnjë-Hercegovinë', en: 'Bosnia & Herzegovina', uk: 'Боснія і Герцеговина', it: 'Bosnia ed Erzegovina' },
  BG: { sq: 'Bullgari', en: 'Bulgaria', uk: 'Болгарія', it: 'Bulgaria' },
  HR: { sq: 'Kroaci', en: 'Croatia', uk: 'Хорватія', it: 'Croazia' },
  CY: { sq: 'Qipro', en: 'Cyprus', uk: 'Кіпр', it: 'Cipro' },
  CZ: { sq: 'Çeki', en: 'Czechia', uk: 'Чехія', it: 'Cechia' },
  DK: { sq: 'Danimarkë', en: 'Denmark', uk: 'Данія', it: 'Danimarca' },
  EE: { sq: 'Estoni', en: 'Estonia', uk: 'Естонія', it: 'Estonia' },
  FI: { sq: 'Finlandë', en: 'Finland', uk: 'Фінляндія', it: 'Finlandia' },
  FR: { sq: 'Francë', en: 'France', uk: 'Франція', it: 'Francia' },
  GE: { sq: 'Gjeorgji', en: 'Georgia', uk: 'Грузія', it: 'Georgia' },
  DE: { sq: 'Gjermani', en: 'Germany', uk: 'Німеччина', it: 'Germania' },
  GR: { sq: 'Greqi', en: 'Greece', uk: 'Греція', it: 'Grecia' },
  HU: { sq: 'Hungari', en: 'Hungary', uk: 'Угорщина', it: 'Ungheria' },
  IS: { sq: 'Islandë', en: 'Iceland', uk: 'Ісландія', it: 'Islanda' },
  IE: { sq: 'Irlandë', en: 'Ireland', uk: 'Ірландія', it: 'Irlanda' },
  IT: { sq: 'Itali', en: 'Italy', uk: 'Італія', it: 'Italia' },
  XK: { sq: 'Kosovë', en: 'Kosovo', uk: 'Косово', it: 'Kosovo' },
  LV: { sq: 'Letoni', en: 'Latvia', uk: 'Латвія', it: 'Lettonia' },
  LI: { sq: 'Lihtenshtajn', en: 'Liechtenstein', uk: 'Ліхтенштейн', it: 'Liechtenstein' },
  LT: { sq: 'Lituani', en: 'Lithuania', uk: 'Литва', it: 'Lituania' },
  LU: { sq: 'Luksemburg', en: 'Luxembourg', uk: 'Люксембург', it: 'Lussemburgo' },
  MT: { sq: 'Maltë', en: 'Malta', uk: 'Мальта', it: 'Malta' },
  MD: { sq: 'Moldavi', en: 'Moldova', uk: 'Молдова', it: 'Moldavia' },
  MC: { sq: 'Monako', en: 'Monaco', uk: 'Монако', it: 'Monaco' },
  ME: { sq: 'Mal i Zi', en: 'Montenegro', uk: 'Чорногорія', it: 'Montenegro' },
  NL: { sq: 'Holandë', en: 'Netherlands', uk: 'Нідерланди', it: 'Paesi Bassi' },
  MK: { sq: 'Maqedonia e Veriut', en: 'North Macedonia', uk: 'Північна Македонія', it: 'Macedonia del Nord' },
  NO: { sq: 'Norvegji', en: 'Norway', uk: 'Норвегія', it: 'Norvegia' },
  PL: { sq: 'Poloni', en: 'Poland', uk: 'Польща', it: 'Polonia' },
  PT: { sq: 'Portugali', en: 'Portugal', uk: 'Португалія', it: 'Portogallo' },
  RO: { sq: 'Rumani', en: 'Romania', uk: 'Румунія', it: 'Romania' },
  SM: { sq: 'San-Marino', en: 'San Marino', uk: 'Сан-Марино', it: 'San Marino' },
  RS: { sq: 'Serbi', en: 'Serbia', uk: 'Сербія', it: 'Serbia' },
  SK: { sq: 'Sllovaki', en: 'Slovakia', uk: 'Словаччина', it: 'Slovacchia' },
  SI: { sq: 'Slloveni', en: 'Slovenia', uk: 'Словенія', it: 'Slovenia' },
  ES: { sq: 'Spanjë', en: 'Spain', uk: 'Іспанія', it: 'Spagna' },
  SE: { sq: 'Suedi', en: 'Sweden', uk: 'Швеція', it: 'Svezia' },
  CH: { sq: 'Zvicër', en: 'Switzerland', uk: 'Швейцарія', it: 'Svizzera' },
  TR: { sq: 'Turqi', en: 'Türkiye', uk: 'Туреччина', it: 'Turchia' },
  UA: { sq: 'Ukrainë', en: 'Ukraine', uk: 'Україна', it: 'Ucraina' },
  GB: { sq: 'Mbretëria e Bashkuar', en: 'United Kingdom', uk: 'Велика Британія', it: 'Regno Unito' },
  US: { sq: 'SHBA', en: 'United States', uk: 'Сполучені Штати', it: 'Stati Uniti' },
  VA: { sq: 'Vatikan', en: 'Vatican City', uk: 'Ватикан', it: 'Città del Vaticano' },
} as const

type SupportedLocale = 'sq' | 'en' | 'uk' | 'it'

/**
 * Return the display name of a country in the given locale.
 * Uses the CLDR-sourced static table for the 4 supported project locales;
 * falls back to Intl.DisplayNames for other locales.
 */
export function getCountryDisplayName(iso2: string, locale: string): string {
  const names = COUNTRY_NAMES_I18N[iso2]
  if (names) {
    const name = names[locale as SupportedLocale]
    if (name) return name
  }
  // Fallback: Intl.DisplayNames (for locales outside the 4-locale table)
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'region' })
    const name = dn.of(iso2)
    if (name && name !== iso2) return name
  } catch {}
  return COUNTRY_CODES.find(c => c.iso2 === iso2)?.label ?? iso2
}

/**
 * Build a space-joined string of the country's name in all 4 supported locales.
 * Used as `searchText` in the country-code Combobox: users can type in sq/en/uk/it
 * and get correct results regardless of the currently displayed locale.
 */
export function getAllCountrySearchText(iso2: string): string {
  const names = COUNTRY_NAMES_I18N[iso2]
  if (names) {
    // Deduplicate (e.g. some names are identical across locales)
    return [...new Set(Object.values(names).filter(Boolean))].join(' ')
  }
  // Fallback for countries not in the static table
  return COUNTRY_CODES.find(c => c.iso2 === iso2)?.label ?? iso2
}

// ── Validation ────────────────────────────────────────────────────────────────

export type PhoneErrorKey =
  | 'error_phone_invalid'
  | 'error_phone_no_country_code'
  | 'error_phone_digits_only'
  | 'error_phone_country_mismatch'

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
 *   e) PRIMARY: libphonenumber-js validates the E.164 against the country metadata.
 *      Falls back to national-format parse (iso2 context) to handle domestic trunk
 *      prefix (e.g. leading 0 in FR/DE/GB/AT/IE/NL).
 *   f) produce normalized E.164 from parsed result
 *   g) FINAL safety guard /^\+[1-9]\d{7,14}$/
 */
export function validateNationalPhone(params: {
  iso2: string
  dialCode: string
  rawNational: string
}): PhoneValidationResult {
  const { iso2, dialCode, rawNational } = params

  // a) Require non-empty national
  if (!rawNational.trim()) return { ok: false, errorKey: 'error_phone_invalid' }

  // b) Reject "+" in national input
  if (rawNational.includes('+')) return { ok: false, errorKey: 'error_phone_no_country_code' }

  // c) Normalize; reject non-digit characters
  const normalized = normalizeNational(rawNational)
  if (!/^\d+$/.test(normalized)) return { ok: false, errorKey: 'error_phone_digits_only' }

  // d) Reject if national starts with the dial-code digits (user typed the country code)
  const dialDigits = dialCode.replace('+', '')
  if (normalized.startsWith(dialDigits)) return { ok: false, errorKey: 'error_phone_no_country_code' }

  // e) PRIMARY: libphonenumber-js validation
  // Attempt 1: international format (+dialCode + normalized)
  // Attempt 2: national format with iso2 context — handles domestic trunk prefix (e.g. leading 0 in FR/DE/GB)
  let parsed: ReturnType<typeof parsePhoneNumberFromString>

  try {
    parsed = parsePhoneNumberFromString(`${dialCode}${normalized}`)
    if (!parsed?.isValid() && normalized.startsWith('0')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nationalParsed = parsePhoneNumberFromString(normalized, iso2 as any)
      if (nationalParsed?.isValid()) parsed = nationalParsed
    }
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed = parsePhoneNumberFromString(normalized, iso2 as any)
    } catch {
      return { ok: false, errorKey: 'error_phone_invalid' }
    }
  }

  if (!parsed || !parsed.isValid()) return { ok: false, errorKey: 'error_phone_invalid' }

  // f) Produce E.164
  const e164 = parsed.format('E.164')

  // g) Final safety guard
  if (!E164_GUARD.test(e164)) return { ok: false, errorKey: 'error_phone_invalid' }

  return { ok: true, e164 }
}

// ── Paste normalization ────────────────────────────────────────────────────────

export type PasteResult =
  | { ok: true;  national: string }
  | { ok: false; errorKey: PhoneErrorKey }

/**
 * Normalize a pasted value against the selected country.
 *
 * - Full international (+dialCode or 00dialCode): strip country code → return national part.
 * - Excluded countries (RU/BY) in paste: reject as mismatch.
 * - Mismatched country: reject as mismatch.
 * - National/local format: return stripped digits as-is.
 */
export function normalizePastedNational(
  pasted: string,
  selectedDialCode: string,
): PasteResult {
  // Strip visual separators and non-breaking spaces
  const stripped = pasted.replace(/[\s\-(). ​]/g, '').trim()

  // Check for international format: starts with "+" or "00"
  let international: string | null = null
  if (stripped.startsWith('+')) {
    international = stripped.slice(1)
  } else if (stripped.startsWith('00')) {
    international = stripped.slice(2)
  }

  if (international !== null) {
    // Reject excluded countries (RU/BY)
    for (const prefix of EXCLUDED_DIAL_PREFIXES) {
      if (international.startsWith(prefix)) {
        return { ok: false, errorKey: 'error_phone_country_mismatch' }
      }
    }

    const dialDigits = selectedDialCode.replace('+', '')
    if (international.startsWith(dialDigits)) {
      // Matches selected country → strip country code, return national
      const national = international.slice(dialDigits.length)
      return { ok: true, national }
    }
    // International number for a different country
    return { ok: false, errorKey: 'error_phone_country_mismatch' }
  }

  // National/local format — return stripped digits
  const digitsOnly = stripped.replace(/\D/g, '')
  return { ok: true, national: digitsOnly || stripped }
}
