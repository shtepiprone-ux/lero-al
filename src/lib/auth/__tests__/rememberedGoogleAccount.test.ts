/**
 * Task 927 Amendment 5: the remembered Google account (owner decision D15). The real module with a synthetic Google ID token: it keeps only the Google id, the name, the masked
 * e-mail and a Google picture URL; a hostile or malformed record is never returned; blocked storage never throws.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  REMEMBERED_GOOGLE_ACCOUNT_KEY,
  forgetRememberedGoogleAccount,
  maskEmail,
  readRememberedGoogleAccount,
  rememberedAccountFromCredential,
  saveRememberedGoogleAccount,
} from '../rememberedGoogleAccount'

const base64url = (value: unknown) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const token = (claims: Record<string, unknown>) => `${base64url({ alg: 'RS256' })}.${base64url(claims)}.zz-synthetic-signature`
const CLAIMS = { sub: '000000000000000000001', name: 'Arta Krasniqi', email: 'arta.synthetic@example.com', picture: 'https://lh3.googleusercontent.com/a/zz-synthetic' }

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

it('[SEC-927-FE-UNIT-REMEMBER] the remembered-account module masks the e-mail, keeps only Google pictures and four fields, and survives blocked storage', () => {
  // masking
  expect(maskEmail('arta.synthetic@example.com')).toBe('ar•••••@example.com')
  expect(maskEmail('a@example.com')).toBe('a•••••@example.com')
  expect(maskEmail('ab@example.com')).toBe('a•••••@example.com')
  expect(maskEmail('  Arta.Synthetic@Example.com ')).toBe('ar•••••@example.com')
  expect(maskEmail('no-at-sign')).toBeNull()
  expect(maskEmail('two@at@example.com')).toBeNull()
  expect(maskEmail('@example.com')).toBeNull()
  expect(maskEmail('arta@')).toBeNull()

  // the credential: only a signed-shape token with a usable sub and e-mail is remembered, and only four fields leave it
  expect(rememberedAccountFromCredential(token(CLAIMS))).toEqual({
    sub: '000000000000000000001', name: 'Arta Krasniqi', maskedEmail: 'ar•••••@example.com', picture: 'https://lh3.googleusercontent.com/a/zz-synthetic',
  })
  expect(rememberedAccountFromCredential('not.a-token')).toBeNull()
  expect(rememberedAccountFromCredential('a.b.c.d')).toBeNull()
  expect(rememberedAccountFromCredential(token({ ...CLAIMS, sub: undefined }))).toBeNull()
  expect(rememberedAccountFromCredential(token({ ...CLAIMS, sub: 'has a space' }))).toBeNull()
  expect(rememberedAccountFromCredential(token({ ...CLAIMS, email: 'no-at-sign' }))).toBeNull()

  // a name over 200 characters falls back to the masked e-mail
  expect(rememberedAccountFromCredential(token({ ...CLAIMS, name: 'n'.repeat(201) }))?.name).toBe('ar•••••@example.com')
  expect(rememberedAccountFromCredential(token({ ...CLAIMS, name: 'n'.repeat(200) }))?.name).toBe('n'.repeat(200))

  // only Google's own https image host is kept as a picture
  for (const picture of ['http://lh3.googleusercontent.com/a', 'https://evil.example/p.png', 'https://googleusercontent.com.evil.example/p.png', 'javascript:alert(1)']) {
    expect(rememberedAccountFromCredential(token({ ...CLAIMS, picture }))?.picture, picture).toBeNull()
  }
  expect(rememberedAccountFromCredential(token({ ...CLAIMS, picture: 'https://googleusercontent.com/a' }))?.picture).toBe('https://googleusercontent.com/a')

  // exactly the four keys are written
  const account = rememberedAccountFromCredential(token(CLAIMS))!
  saveRememberedGoogleAccount({ ...account, credential: 'zz.must.not.be.stored', email: 'arta.synthetic@example.com' } as typeof account)
  const stored: unknown = JSON.parse(localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY)!)
  expect(Object.keys(stored as object).sort()).toEqual(['maskedEmail', 'name', 'picture', 'sub'])
  expect(localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY)).not.toContain('arta.synthetic@example.com')
  expect(readRememberedGoogleAccount()).toEqual(account)

  // forgetting erases it
  forgetRememberedGoogleAccount()
  expect(localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY)).toBeNull()
  expect(readRememberedGoogleAccount()).toBeNull()

  // a hostile or malformed record is never returned and is removed
  for (const record of ['not json at all', '[]', JSON.stringify({ ...account, credential: 'x' }), JSON.stringify({ ...account, sub: undefined }), JSON.stringify({ ...account, picture: 'javascript:alert(1)' }), JSON.stringify({ ...account, maskedEmail: 'arta@example.com' })]) {
    localStorage.setItem(REMEMBERED_GOOGLE_ACCOUNT_KEY, record)
    expect(readRememberedGoogleAccount(), record).toBeNull()
    expect(localStorage.getItem(REMEMBERED_GOOGLE_ACCOUNT_KEY), record).toBeNull()
  }

  // blocked storage: reading gives null, writing and removing do not throw
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
  expect(readRememberedGoogleAccount()).toBeNull()
  expect(() => saveRememberedGoogleAccount(account)).not.toThrow()
  expect(() => forgetRememberedGoogleAccount()).not.toThrow()
})
