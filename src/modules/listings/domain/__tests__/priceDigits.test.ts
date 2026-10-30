import { describe, expect, it } from 'vitest'
import { parsePriceDigits } from '../priceDigits'

describe('parsePriceDigits', () => {
  it('keeps the digits of a price written with spaces', () => {
    expect(parsePriceDigits('20 000 000 000')).toBe(20_000_000_000)
  })

  it('keeps the digits of a price written with a no-break space (U+00A0)', () => {
    expect(parsePriceDigits('20 000 000 000')).toBe(20_000_000_000)
  })

  it('keeps the digits of a price written with a narrow no-break space (U+202F)', () => {
    expect(parsePriceDigits('20 000 000 000')).toBe(20_000_000_000)
  })

  it('keeps the digits of a price written with dots', () => {
    expect(parsePriceDigits('20.000.000.000')).toBe(20_000_000_000)
  })

  it('keeps the digits of a price written with commas, signs and letters among them', () => {
    expect(parsePriceDigits('-1,234 EUR')).toBe(1234)
  })

  it('answers undefined when no digit is typed', () => {
    expect(parsePriceDigits('abc')).toBeUndefined()
    expect(parsePriceDigits('')).toBeUndefined()
  })

  it('removes leading zeros', () => {
    expect(parsePriceDigits('000123')).toBe(123)
  })

  it('answers undefined for zeros only', () => {
    expect(parsePriceDigits('000')).toBeUndefined()
  })

  it('keeps the first 15 digits of a longer input', () => {
    expect(parsePriceDigits('1234567890123456')).toBe(123_456_789_012_345)
    expect(parsePriceDigits('99999999999999999999')).toBe(999_999_999_999_999)
  })

  it('keeps a number of 15 digits exact', () => {
    expect(Number.isSafeInteger(parsePriceDigits('999999999999999'))).toBe(true)
  })
})
