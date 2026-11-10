// @vitest-environment node
/**
 * Task 951 (CodeQL js/clear-text-logging, scripts/check-hydration-console.mjs): text from the page under test is redacted before it is logged.
 */
import { describe, expect, it } from 'vitest'
import { cookieValues, redactSensitive } from '../redact-log.mjs'

// built from parts so that the file holds no complete token (the file check refuses one)
const JWT = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0', 'c2lnbmF0dXJl'].join('.')
// the same for a key in a query string: a whole one is what the secret scan reports (Task 970)
const API_KEY = ['ANONKEY', '9876543'].join('')

describe('redactSensitive', () => {
  it.each([
    ['credentials in a URL', 'GET https://admin:hunter22@staging.example/x failed', 'hunter22'],
    ['a bearer token', 'request failed: Authorization: Bearer abcdef1234567890abcdef', 'abcdef1234567890abcdef'],
    ['a JWT', `session ${JWT} end`, 'eyJhbGciOiJIUzI1NiJ9'],
    ['an access token in a query string', 'GET /cb?access_token=SECRETVALUE123&next=/x', 'SECRETVALUE123'],
    ['an api key in a query string', `https://x.supabase.co/rest/v1/a?apikey=${API_KEY}`, API_KEY],
    ['a password parameter', 'form password=correct-horse-battery', 'correct-horse-battery'],
  ])('removes %s', (_label, text, secret) => {
    const out = redactSensitive(text)
    expect(out).not.toContain(secret)
    expect(out).toContain('[redacted')
  })

  it('removes the exact values it is given (a session cookie value)', () => {
    expect(redactSensitive('cookie sb-abc-auth-token=base64-0123456789abcdef was rejected', ['base64-0123456789abcdef'])).not.toContain('0123456789abcdef')
  })

  it('leaves an ordinary hydration message as it is', () => {
    const message = 'Hydration failed because the server rendered text did not match the client. See https://react.dev/link/hydration-mismatch'
    expect(redactSensitive(message)).toBe(message)
  })

  it('accepts a value that is not a string', () => {
    expect(redactSensitive(undefined)).toBe('undefined')
  })
})

describe('cookieValues', () => {
  it('reads the values of a Playwright cookie array', () => {
    expect(cookieValues('[{"name":"a","value":"v-1234567890"},{"name":"b","value":"w-1234567890"}]')).toEqual(['v-1234567890', 'w-1234567890'])
  })

  it.each([['not json'], ['{"a":1}'], ['[null,{"name":"x"}]'], ['']])('gives an empty list for %j', (json) => {
    expect(cookieValues(json)).toEqual([])
  })
})
