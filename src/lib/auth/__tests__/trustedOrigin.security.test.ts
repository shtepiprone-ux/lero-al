// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S17): the origin of an e-mailed link is ours, whatever `redirect_to` says.
 */
import { describe, expect, it } from 'vitest'
import { allowedAppOrigins, trustedAppOrigin } from '../trustedOrigin'

const PROD = { NEXT_PUBLIC_SITE_URL: 'https://lero.al', NODE_ENV: 'production' }
const DEV = { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000', NODE_ENV: 'development' }

describe('trustedAppOrigin', () => {
  it.each([
    ['https://evil.example/auth/confirm'],
    ['https://lero.al.evil.example/'],
    ['https://evil.example/https://lero.al'],
    ['https://lero.al@evil.example/'],
    ['http://lero.al/'],
    ['//evil.example'],
    ['javascript:alert(1)'],
    ['data:text/html,x'],
    ['not a url'],
    [''],
    [null],
    [undefined],
  ])('uses our own origin for the redirect_to %j', (redirectTo) => {
    expect(trustedAppOrigin(redirectTo as string, PROD)).toBe('https://lero.al')
  })

  it('keeps our production origins', () => {
    expect(trustedAppOrigin('https://lero.al/sq?next=/sq/auth/verified', PROD)).toBe('https://lero.al')
    expect(trustedAppOrigin('https://www.lero.al/x', PROD)).toBe('https://www.lero.al')
  })

  it('keeps the configured site origin', () => {
    expect(trustedAppOrigin('https://staging.lero.al/x', { NEXT_PUBLIC_SITE_URL: 'https://staging.lero.al', NODE_ENV: 'production' })).toBe('https://staging.lero.al')
  })

  it('in production a localhost redirect_to is NOT trusted', () => {
    expect(trustedAppOrigin('http://localhost:3000/x', PROD)).toBe('https://lero.al')
  })

  it('in development a localhost redirect_to is trusted, another host is not', () => {
    expect(trustedAppOrigin('http://localhost:3001/x', DEV)).toBe('http://localhost:3001')
    expect(trustedAppOrigin('http://127.0.0.1:3000/x', DEV)).toBe('http://127.0.0.1:3000')
    expect(trustedAppOrigin('https://evil.example/x', DEV)).toBe('http://localhost:3000')
  })

  it('without a configured site URL the fallback is the production domain', () => {
    expect(trustedAppOrigin('https://evil.example', { NODE_ENV: 'production' })).toBe('https://lero.al')
  })

  it('whatever it is given, the result is always one of the allowed origins (or localhost outside production)', () => {
    const inputs = ['https://evil.example', 'https://lero.al', 'http://localhost:9', '', 'x', 'ftp://lero.al']
    for (const i of inputs) {
      const out = trustedAppOrigin(i, PROD)
      expect(allowedAppOrigins(PROD)).toContain(out)
    }
  })
})
