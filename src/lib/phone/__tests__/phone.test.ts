import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateNationalPhone, parsePhoneValue, normalizeNational, normalizePastedNational, getPhonePlaceholder, COUNTRY_CODES } from '../index'

// ── Unit tests — validateNationalPhone ────────────────────────────────────────

describe('validateNationalPhone — Albania (AL +355)', () => {
  const al = { iso2: 'AL', dialCode: '+355' }

  it('rejects AL/+355 national "693" (too short)', () => {
    expect(validateNationalPhone({ ...al, rawNational: '693' }).ok).toBe(false)
  })

  it('accepts AL/+355 national "691234567" and normalizes to +355691234567', () => {
    const result = validateNationalPhone({ ...al, rawNational: '691234567' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toBe('+355691234567')
  })

  it('rejects national input containing "+"', () => {
    const result = validateNationalPhone({ ...al, rawNational: '+691234567' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_no_country_code')
  })

  it('rejects national duplicating dial code digits "355691234567"', () => {
    const result = validateNationalPhone({ ...al, rawNational: '355691234567' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_no_country_code')
  })

  it('rejects empty national', () => {
    expect(validateNationalPhone({ ...al, rawNational: '' }).ok).toBe(false)
  })

  it('rejects national with letters → error_phone_digits_only', () => {
    const result = validateNationalPhone({ ...al, rawNational: '69abc456' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_digits_only')
  })

  it('rejects national with symbols → error_phone_digits_only', () => {
    const result = validateNationalPhone({ ...al, rawNational: '69@#456' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_digits_only')
  })

  it('rejects national with Cyrillic letters → error_phone_digits_only', () => {
    const result = validateNationalPhone({ ...al, rawNational: '69аб456' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_digits_only')
  })

  it('accepts national with spaces (normalized) — 9 digits for Albania', () => {
    const result = validateNationalPhone({ ...al, rawNational: '69 123 4567' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toBe('+355691234567')
  })

  it('accepts placeholder format "691 234 567" — Albanian mobile (9-digit, Task 244/267)', () => {
    const result = validateNationalPhone({ ...al, rawNational: '691 234 567' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toBe('+355691234567')
  })

  it('rejects a too-long number that would exceed E.164 max', () => {
    // +355 + 15 digits = 18 chars → exceeds E.164 max of 15 digits total
    const result = validateNationalPhone({ ...al, rawNational: '691234567890123' })
    expect(result.ok).toBe(false)
  })
})

describe('validateNationalPhone — validates via iso2, not dial code alone', () => {
  it('rejects a US number entered when Albania (+355) is selected', () => {
    // A valid US 10-digit format but country selected is Albania
    const result = validateNationalPhone({ iso2: 'AL', dialCode: '+355', rawNational: '2125551234' })
    // libphonenumber-js should not validate this as a valid AL number
    expect(result.ok).toBe(false)
  })
})

describe('validateNationalPhone — Italy (IT +39)', () => {
  const it_ = { iso2: 'IT', dialCode: '+39' }

  it('accepts valid Italian mobile number', () => {
    // Italian mobile: 3xx xxxxxxx (10 digits)
    const result = validateNationalPhone({ ...it_, rawNational: '3401234567' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+39/)
  })

  it('rejects too-short Italian number', () => {
    expect(validateNationalPhone({ ...it_, rawNational: '340' }).ok).toBe(false)
  })

  it('rejects national duplicating +39 dial code "393401234567"', () => {
    const result = validateNationalPhone({ ...it_, rawNational: '393401234567' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_no_country_code')
  })
})

describe('validateNationalPhone — UK (GB +44)', () => {
  it('accepts valid UK mobile number', () => {
    // 7890123456 → +447890123456, libphonenumber-js/min confirms valid GB number
    const result = validateNationalPhone({ iso2: 'GB', dialCode: '+44', rawNational: '7890123456' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+44/)
  })
})

// ── Integration: invalid phone BLOCKS signUp(), valid phone passes ─────────────

describe('integration — phone validation blocks signUp()', () => {
  const mockSignUp = vi.fn()

  beforeEach(() => {
    mockSignUp.mockClear()
  })

  async function simulateRegister(national: string) {
    const iso2 = 'AL'
    const dialCode = '+355'
    const result = validateNationalPhone({ iso2, dialCode, rawNational: national })
    if (!result.ok) return { error: result.errorKey }
    await mockSignUp({ phone: result.e164 })
    return { ok: true }
  }

  it('invalid phone BLOCKS signUp (incomplete Albanian number)', async () => {
    await simulateRegister('693')
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('valid phone calls signUp with normalized E.164', async () => {
    await simulateRegister('691234567')
    expect(mockSignUp).toHaveBeenCalledWith({ phone: '+355691234567' })
  })
})

// ── Unit tests — helpers ──────────────────────────────────────────────────────

describe('normalizeNational', () => {
  // ── Albanian landline / generic 8-digit inputs ────────────────────────────
  it('strips spaces (8-digit input)',       () => expect(normalizeNational('69 123 456')).toBe('69123456'))
  it('strips dashes (8-digit input)',       () => expect(normalizeNational('69-123-456')).toBe('69123456'))
  it('strips parentheses (8-digit input)', () => expect(normalizeNational('(69)123456')).toBe('69123456'))
  it('strips dots (8-digit input)',         () => expect(normalizeNational('69.123.456')).toBe('69123456'))

  // ── Albanian mobile 9-digit inputs (placeholder format: 691 234 567) ─────
  // Task 267 / CC.3 — follow-up from Task 244 (placeholder changed to 9-digit)
  it('strips spaces — Albanian mobile (9-digit)',       () => expect(normalizeNational('691 234 567')).toBe('691234567'))
  it('strips dashes — Albanian mobile (9-digit)',       () => expect(normalizeNational('691-234-567')).toBe('691234567'))
  it('strips dots — Albanian mobile (9-digit)',         () => expect(normalizeNational('691.234.567')).toBe('691234567'))
  it('strips parentheses — Albanian mobile (9-digit)', () => expect(normalizeNational('(691)234567')).toBe('691234567'))
})

describe('parsePhoneValue', () => {
  it('parses AL E.164 correctly', () => {
    const p = parsePhoneValue('+355691234567')
    expect(p.dialCode).toBe('+355')
    expect(p.iso2).toBe('AL')
    expect(p.national).toBe('691234567')
  })

  it('falls back to AL for empty string', () => {
    const p = parsePhoneValue('')
    expect(p.iso2).toBe('AL')
    expect(p.national).toBe('')
  })

  it('parses IT E.164 correctly', () => {
    const p = parsePhoneValue('+393401234567')
    expect(p.dialCode).toBe('+39')
    expect(p.iso2).toBe('IT')
  })
})

// ── Multi-country validation — representative European countries ───────────────

describe('validateNationalPhone — France (FR +33)', () => {
  const fr = { iso2: 'FR', dialCode: '+33' }

  it('accepts valid French mobile without trunk 0 (national format)', () => {
    const result = validateNationalPhone({ ...fr, rawNational: '612345678' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+33/)
  })

  it('accepts French mobile with trunk prefix 0 (domestic format)', () => {
    // France uses 0 as domestic trunk prefix; libphonenumber-js handles via iso2 context
    const result = validateNationalPhone({ ...fr, rawNational: '0612345678' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+33/)
  })

  it('rejects too-short French number', () => {
    expect(validateNationalPhone({ ...fr, rawNational: '61234' }).ok).toBe(false)
  })
})

describe('validateNationalPhone — Germany (DE +49)', () => {
  const de = { iso2: 'DE', dialCode: '+49' }

  it('accepts valid German mobile without trunk 0', () => {
    const result = validateNationalPhone({ ...de, rawNational: '15112345678' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+49/)
  })

  it('accepts German mobile with trunk prefix 0 (domestic format)', () => {
    const result = validateNationalPhone({ ...de, rawNational: '015112345678' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+49/)
  })

  it('rejects German number duplicating dial code "4915112345678"', () => {
    const result = validateNationalPhone({ ...de, rawNational: '4915112345678' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_no_country_code')
  })
})

describe('validateNationalPhone — Ukraine (UA +380)', () => {
  const ua = { iso2: 'UA', dialCode: '+380' }

  it('accepts valid Ukrainian mobile number', () => {
    const result = validateNationalPhone({ ...ua, rawNational: '501234567' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+380/)
  })

  it('rejects too-short Ukrainian number', () => {
    expect(validateNationalPhone({ ...ua, rawNational: '50123' }).ok).toBe(false)
  })
})

describe('validateNationalPhone — Poland (PL +48)', () => {
  it('accepts valid Polish mobile number', () => {
    const result = validateNationalPhone({ iso2: 'PL', dialCode: '+48', rawNational: '512345678' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+48/)
  })
})

describe('validateNationalPhone — Spain (ES +34)', () => {
  it('accepts valid Spanish mobile number', () => {
    const result = validateNationalPhone({ iso2: 'ES', dialCode: '+34', rawNational: '612345678' })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.e164).toMatch(/^\+34/)
  })
})

// ── normalizePastedNational ────────────────────────────────────────────────────

describe('normalizePastedNational — Albania (+355)', () => {
  const dialCode = '+355'

  it('normalizes full international paste "+355691234567" to national "691234567"', () => {
    const result = normalizePastedNational('+355691234567', dialCode)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.national).toBe('691234567')
  })

  it('normalizes "00355691234567" (00-prefix international) to national "691234567"', () => {
    const result = normalizePastedNational('00355691234567', dialCode)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.national).toBe('691234567')
  })

  it('returns mismatch error for a German number "+4915112345678" when AL selected', () => {
    const result = normalizePastedNational('+4915112345678', dialCode)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_country_mismatch')
  })

  it('rejects Russian number "+79161234567" as mismatch (RU excluded)', () => {
    const result = normalizePastedNational('+79161234567', dialCode)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_country_mismatch')
  })

  it('rejects Belarusian number "+375291234567" as mismatch (BY excluded)', () => {
    const result = normalizePastedNational('+375291234567', dialCode)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errorKey).toBe('error_phone_country_mismatch')
  })

  it('returns national as-is for plain national paste "691234567"', () => {
    const result = normalizePastedNational('691234567', dialCode)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.national).toBe('691234567')
  })

  it('strips visual separators from international paste "+355 69 123 45 67"', () => {
    const result = normalizePastedNational('+355 69 123 45 67', dialCode)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.national).toBe('691234567')
  })
})

// ── getPhonePlaceholder ────────────────────────────────────────────────────────

describe('getPhonePlaceholder', () => {
  it('returns Albania-specific placeholder for AL', () => {
    expect(getPhonePlaceholder('AL')).toBe('67 123 4567')
  })

  it('returns UK-specific placeholder for GB', () => {
    expect(getPhonePlaceholder('GB')).toBe('7700 900123')
  })

  it('returns Ukraine-specific placeholder for UA', () => {
    expect(getPhonePlaceholder('UA')).toBe('50 123 4567')
  })

  it('returns generic fallback for unknown iso2', () => {
    expect(getPhonePlaceholder('ZZ')).toBe('XX XXX XXXX')
  })

  it('every COUNTRY_CODES entry has a non-empty placeholder', () => {
    for (const c of COUNTRY_CODES) {
      const p = getPhonePlaceholder(c.iso2)
      expect(p.length).toBeGreaterThan(0)
    }
  })
})

// ── COUNTRY_CODES ─────────────────────────────────────────────────────────────

describe('COUNTRY_CODES', () => {
  it('contains 49 countries (Task 375 added AM/AZ/GE/SM/VA; Task 280 removed excluded entry; Task 187 expanded)', () => expect(COUNTRY_CODES).toHaveLength(49))
  it('every entry has iso2, dialCode, flag, label', () => {
    for (const c of COUNTRY_CODES) {
      expect(c.iso2).toBeTruthy()
      expect(c.dialCode.startsWith('+')).toBe(true)
      expect(c.flag).toBeTruthy()
      expect(c.label).toBeTruthy()
    }
  })
  it('AL has iso2 AL and dialCode +355', () => {
    const al = COUNTRY_CODES.find(c => c.iso2 === 'AL')
    expect(al?.dialCode).toBe('+355')
  })
  it('excludes BY (excluded per product policy)', () => {
    expect(COUNTRY_CODES.find(c => c.iso2 === 'BY')).toBeUndefined()
  })
  it('excludes RU (excluded per product policy)', () => {
    expect(COUNTRY_CODES.find(c => c.iso2 === 'RU')).toBeUndefined()
  })
})
