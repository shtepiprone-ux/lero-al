// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isE164, isPlainEmail, isUuid } from '../inputs'

describe('isUuid', () => {
  it.each(['123e4567-e89b-12d3-a456-426614174000', '123E4567-E89B-12D3-A456-426614174000'])('accepts %s', (v) => expect(isUuid(v)).toBe(true))

  it.each([
    [''], ['abc'], ['123e4567-e89b-12d3-a456-42661417400'], ['123e4567-e89b-12d3-a456-4266141740000'], ['123e4567e89b12d3a456426614174000'],
    ['123e4567-e89b-12d3-a456-42661417400g'], [' 123e4567-e89b-12d3-a456-426614174000'], ['123e4567-e89b-12d3-a456-426614174000\n'],
    ['123e4567-e89b-12d3-a456-426614174000,other'], ['1" or "1"="1'], [null], [undefined], [42], [{}], [['123e4567-e89b-12d3-a456-426614174000']],
  ])('refuses %j', (v) => expect(isUuid(v)).toBe(false))
})

describe('isPlainEmail', () => {
  it.each(['ana@example.com', 'ana.hoxha+test@mail.example.al', "o'brien@example.com", 'a@b.co'])('accepts %s', (v) => expect(isPlainEmail(v)).toBe(true))

  it.each([
    [''], ['no-at'], ['a@b'], ['a@b.c'], ['a b@example.com'], ['a@example.com, b@example.com'], ['a@example.com;b@example.com'], ['Ana <a@example.com>'],
    ['"a"@example.com'], ['a@@example.com'], ['a@b@example.com'], ['a@example.com\r\nBcc: x@y.zz'], ['a\\@example.com'], ['(c)a@example.com'],
    [`${'a'.repeat(250)}@example.com`], [null], [undefined], [5], [{ toString: () => 'a@example.com' }],
  ])('refuses %j', (v) => expect(isPlainEmail(v)).toBe(false))

  it('allows exactly 254 characters and refuses 255', () => {
    const domain = '@example.com'
    expect(isPlainEmail('a'.repeat(254 - domain.length) + domain)).toBe(true)
    expect(isPlainEmail('a'.repeat(255 - domain.length) + domain)).toBe(false)
  })
})

describe('isE164', () => {
  it.each(['+355691234567', '+12025550123', '+1234567', '+123456789012345'].filter((v) => v.length >= 9))('accepts %s', (v) => expect(isE164(v)).toBe(true))
  it.each([['+1234567'], ['+1234567890123456']])('the length limits: %s is refused', (v) => expect(isE164(v)).toBe(false))
  it.each([[''], ['355691234567'], ['+0355691234567'], ['+355 69 123 4567'], ['+355-69-1234567'], ['(+355)691234567'], ['+355691234567 '], ['+355691234567\n'], ['+35569123456a'], ['00355691234567'], [null], [undefined], [355691234567], [{}]])('refuses %j', (v) => expect(isE164(v)).toBe(false))
  it('accepts the shortest and the longest allowed', () => {
    expect(isE164('+12345678')).toBe(true)
    expect(isE164('+123456789012345')).toBe(true)
    expect(isE164('+1234567')).toBe(false)
    expect(isE164('+1234567890123456')).toBe(false)
  })
})

// Task 923 R38 (cases SEC-S50-SRV-DENY, SEC-S54-SRV-DENY)
it('[SEC-S50-SRV-DENY] Listing and account text is trimmed before it is validated', async () => {
  const { listingSchema } = await import('@/modules/listings/validations')
  const { registerSchema } = await import('@/modules/auth/validations')
  const title = listingSchema.safeParse({ title: '          ', price: 1, currency: 'EUR', listing_type: 'sale', property_type: 'apartment' })
  expect(title.success).toBe(false)                                        // spaces only are not a title of 10 characters
  expect(registerSchema.safeParse({ name: '      ', email: 'ana@example.com', password: 'secret1', user_type: 'private' }).success).toBe(false)
  expect(registerSchema.safeParse({ name: '  Ana  ', email: 'ana@example.com', password: 'secret1', user_type: 'private' }).success).toBe(true)   // the control
})

it('[SEC-S54-SRV-DENY] A stored phone number is E.164: + and 8-15 digits', () => {
  for (const phone of ['0691234567', '+1', '+12345678901234567890']) expect(isE164(phone), phone).toBe(false)
  expect(isE164('+355691234567')).toBe(true)
})
