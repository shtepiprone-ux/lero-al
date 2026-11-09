// @vitest-environment node
/**
 * Phone helpers (Task 923 Revision 7). A number that passes `validateNationalPhone` is stored and later put into `tel:` and `wa.me/` addresses, so the function
 * must return a clean E.164 string or an error key, never a half-cleaned input; a pasted number must not silently switch the country.
 */
import { describe, expect, it } from 'vitest'
import {
  COUNTRY_CODES, DEFAULT_COUNTRY, getAllCountrySearchText, getCountryDisplayName, getPhonePlaceholder, normalizeNational, normalizePastedNational, parsePhoneValue, validateNationalPhone,
} from '../index'

const AL = { iso2: 'AL', dialCode: '+355' }
const check = (rawNational: string, country = AL) => validateNationalPhone({ ...country, rawNational })

describe('the country list', () => {
  it('starts with Albania, has unique codes, and every dial code starts with +', () => {
    expect(DEFAULT_COUNTRY.iso2).toBe('AL')
    expect(new Set(COUNTRY_CODES.map((c) => c.iso2)).size).toBe(COUNTRY_CODES.length)
    expect(COUNTRY_CODES.every((c) => /^\+\d{1,3}$/.test(c.dialCode))).toBe(true)
  })

  it('does not offer Russia or Belarus', () => {
    expect(COUNTRY_CODES.some((c) => c.dialCode === '+7' || c.dialCode === '+375')).toBe(false)
  })

  it('every country has a placeholder and a name in each of the four languages', () => {
    for (const c of COUNTRY_CODES) {
      expect(getPhonePlaceholder(c.iso2), c.iso2).not.toBe('XX XXX XXXX')
      for (const locale of ['sq', 'en', 'uk', 'it']) expect(getCountryDisplayName(c.iso2, locale).length, `${c.iso2} ${locale}`).toBeGreaterThan(1)
    }
  })
})

describe('parsePhoneValue', () => {
  it('an empty value is the default country with no number', () => {
    expect(parsePhoneValue('')).toEqual({ ...DEFAULT_COUNTRY, national: '' })
  })

  it.each([['+355691234567', 'AL', '691234567'], ['+447911123456', 'GB', '7911123456'], ['+12025550123', 'US', '2025550123'], ['+38343123456', 'XK', '43123456']])('%s is %s %s', (value, iso2, national) => {
    expect(parsePhoneValue(value)).toMatchObject({ iso2, national })
  })

  it('a number with no known country code stays as digits in the default country', () => {
    expect(parsePhoneValue('+999123')).toMatchObject({ iso2: 'AL', dialCode: '+355', national: '999123' })
    expect(parsePhoneValue('0691234567')).toMatchObject({ iso2: 'AL', national: '0691234567' })
  })
})

describe('normalizeNational', () => {
  it('removes spaces, dashes, dots, brackets, the non-breaking space and the zero-width space', () => {
    expect(normalizeNational('69 12-34.5(67)\u00A0\u200B')).toBe('691234567')
  })
  it('keeps letters and plus signs (the validator refuses those later)', () => {
    expect(normalizeNational('+69a')).toBe('+69a')
  })
})

describe('placeholders and names', () => {
  it('an unknown country gets the generic placeholder and falls back to its code', () => {
    expect(getPhonePlaceholder('ZZ')).toBe('XX XXX XXXX')
    // an invalid region code is refused by the browser's name list too, so the code itself is shown
    expect(getCountryDisplayName('XXX', 'en')).toBe('XXX')
  })
  it('the name is localised; an unknown language falls back to the browser\'s region names', () => {
    expect(getCountryDisplayName('AL', 'sq')).toBe('Shqipëri')
    expect(getCountryDisplayName('AL', 'uk')).toBe('Албанія')
    expect(getCountryDisplayName('DE', 'it')).toBe('Germania')
    expect(getCountryDisplayName('DE', 'fr').length).toBeGreaterThan(1)
  })
  it('search text holds every language once', () => {
    expect(getAllCountrySearchText('AL')).toBe('Shqipëri Albania Албанія')
    expect(getAllCountrySearchText('ZZ')).toBe('ZZ')
  })
})

describe('validateNationalPhone', () => {
  it.each([
    ['69 123 4567', '+355691234567'], ['0691234567', '+355691234567'], ['691234567', '+355691234567'], ['(69) 123-4567', '+355691234567'], ['672345678', '+355672345678'],
  ])('%s gives %s', (raw, e164) => expect(check(raw)).toEqual({ ok: true, e164 }))

  it('works for other countries', () => {
    expect(check('7911 123456', { iso2: 'GB', dialCode: '+44' })).toEqual({ ok: true, e164: '+447911123456' })
    expect(check('151 23456789', { iso2: 'DE', dialCode: '+49' })).toEqual({ ok: true, e164: '+4915123456789' })
  })

  it('an empty number is invalid', () => {
    expect(check('')).toEqual({ ok: false, errorKey: 'error_phone_invalid' })
    expect(check('   ')).toEqual({ ok: false, errorKey: 'error_phone_invalid' })
  })

  it('a "+" means the country code was typed into the number field', () => {
    expect(check('+355691234567')).toEqual({ ok: false, errorKey: 'error_phone_no_country_code' })
  })

  it('so does a number that starts with the dial code digits', () => {
    expect(check('355691234567')).toEqual({ ok: false, errorKey: 'error_phone_no_country_code' })
  })

  it.each([['69a1234567'], ['69 123 45 6x'], ['69/1234567'], ['<script>'], ['1234567;']])('%j is "digits only"', (raw) => {
    expect(check(raw)).toEqual({ ok: false, errorKey: 'error_phone_digits_only' })
  })

  it.each([['123'], ['0000000000'], ['6912345'], ['69123456789012']])('%j is not a valid Albanian number', (raw) => {
    expect(check(raw)).toEqual({ ok: false, errorKey: 'error_phone_invalid' })
  })

  it('line breaks and tabs inside a pasted number are removed like spaces', () => {
    expect(check('69\n123\t4567')).toEqual({ ok: true, e164: '+355691234567' })
  })

  it('the result is always strict E.164', () => {
    for (const raw of ['691234567', '0691234567', '69 123 4567']) {
      const r = check(raw)
      expect(r.ok && /^\+[1-9]\d{7,14}$/.test(r.e164)).toBe(true)
    }
  })
})

describe('normalizePastedNational', () => {
  it('cuts the selected country\'s dial code off a number pasted with + or 00', () => {
    expect(normalizePastedNational('+355 69 123 4567', '+355')).toEqual({ ok: true, national: '691234567' })
    expect(normalizePastedNational('00355691234567', '+355')).toEqual({ ok: true, national: '691234567' })
  })

  it('a number from another country is refused instead of being attached to the selected one', () => {
    expect(normalizePastedNational('+44 7911 123456', '+355')).toEqual({ ok: false, errorKey: 'error_phone_country_mismatch' })
    expect(normalizePastedNational('0044 7911 123456', '+355')).toEqual({ ok: false, errorKey: 'error_phone_country_mismatch' })
  })

  it.each([['+7 912 345 67 89'], ['+375 29 123 45 67'], ['007 912 3456789'], ['00375291234567']])('Russia and Belarus (%s) are refused', (pasted) => {
    expect(normalizePastedNational(pasted, '+355')).toEqual({ ok: false, errorKey: 'error_phone_country_mismatch' })
    expect(normalizePastedNational(pasted, '+7')).toEqual({ ok: false, errorKey: 'error_phone_country_mismatch' })
  })

  it('Belarus is refused even when its code is the selected one', () => {
    expect(normalizePastedNational('+375 29 123 45 67', '+375')).toEqual({ ok: false, errorKey: 'error_phone_country_mismatch' })
    expect(normalizePastedNational('00375291234567', '+375')).toEqual({ ok: false, errorKey: 'error_phone_country_mismatch' })
  })

  it('a national number is cleaned to digits', () => {
    expect(normalizePastedNational('(069) 123-4567', '+355')).toEqual({ ok: true, national: '0691234567' })
    expect(normalizePastedNational('abc', '+355')).toEqual({ ok: true, national: 'abc' })
    expect(normalizePastedNational('', '+355')).toEqual({ ok: true, national: '' })
  })
})
