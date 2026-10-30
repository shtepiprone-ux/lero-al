// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S57): an error report must not carry the visitor's cookies, authorization header, request body or the one-time tokens in
 * the address of a sign-in or recovery link.
 */
import { describe, expect, it } from 'vitest'
import { scrubSentryEvent } from '../sentryScrub'

const report = () => ({
  request: {
    url: 'https://lero.al/auth/callback?code=ABC123&next=/sq/cabinet#access_token=eyJhbGciOi&type=recovery',
    query_string: 'token_hash=HASH&next=/x&password=hunter2',
    headers: { Cookie: 'sb-access-token=SECRET', 'user-agent': 'Mozilla', Authorization: 'Bearer SECRET', 'X-Api-Key': 'K', referer: 'https://lero.al/a?token=T1&page=2' } as Record<string, unknown>,
    cookies: { 'sb-access-token': 'SECRET' },
    data: { email: 'a@b.cc', password: 'hunter2' },
  },
  breadcrumbs: [{ message: 'GET /reset?access_token=XYZ&x=1', data: { url: '/a?refresh_token=R&b=2', status: 200 } }],
})

describe('scrubSentryEvent', () => {
  it('removes the cookies, the body and every credential header, whatever the case of the name', () => {
    const e = scrubSentryEvent(report())
    expect(e.request.cookies).toBeUndefined()
    expect(e.request.data).toBeUndefined()
    expect(Object.keys(e.request.headers).map((h) => h.toLowerCase())).toEqual(['user-agent', 'referer'])
    expect(JSON.stringify(e)).not.toContain('SECRET')
    expect(JSON.stringify(e)).not.toContain('hunter2')
  })

  it('blanks the credentials in the address, the query string, other headers and the breadcrumbs, and keeps the rest', () => {
    const e = scrubSentryEvent(report())
    expect(e.request.url).toBe('https://lero.al/auth/callback?code=[redacted]&next=/sq/cabinet#access_token=[redacted]&type=recovery')
    expect(e.request.query_string).toBe('token_hash=[redacted]&next=/x&password=[redacted]')
    expect(e.request.headers.referer).toBe('https://lero.al/a?token=[redacted]&page=2')
    expect(e.breadcrumbs[0]).toEqual({ message: 'GET /reset?access_token=[redacted]&x=1', data: { url: '/a?refresh_token=[redacted]&b=2', status: 200 } })
  })

  it('a query string that is an object is dropped rather than kept with unknown content', () => {
    const e = scrubSentryEvent({ request: { query_string: { token: 'T' } } })
    expect(e.request.query_string).toBeUndefined()
  })

  it.each([['access_token'], ['refresh_token'], ['id_token'], ['token'], ['token_hash'], ['code'], ['code_verifier'], ['apikey'], ['api_key'], ['password'], ['new_password'], ['secret'], ['key']])('the parameter %s is blanked', (name) => {
    const e = scrubSentryEvent({ request: { url: `https://x/y?a=1&${name}=VALUE&b=2` } })
    expect(e.request.url).toBe(`https://x/y?a=1&${name}=[redacted]&b=2`)
  })

  it('a parameter that only ends with a sensitive word is not touched', () => {
    const e = scrubSentryEvent({ request: { url: 'https://x/y?barcode=1&monkey=2&passcode=3' } })
    expect(e.request.url).toBe('https://x/y?barcode=1&monkey=2&passcode=3')
  })

  it('a report with no request or no breadcrumbs is returned as it is', () => {
    expect(scrubSentryEvent({})).toEqual({})
    expect(scrubSentryEvent({ request: {} })).toEqual({ request: {} })
    expect(scrubSentryEvent({ breadcrumbs: [{}] })).toEqual({ breadcrumbs: [{}] })
  })

  it('values that are not text are left alone', () => {
    const e = scrubSentryEvent({ request: { headers: { 'content-length': 12 as unknown } }, breadcrumbs: [{ data: { n: 5, o: { a: 1 } } }] })
    expect(e.request.headers['content-length']).toBe(12)
    expect(e.breadcrumbs[0].data).toEqual({ n: 5, o: { a: 1 } })
  })

  it('returns the same object, so it can be used directly as beforeSend', () => {
    const e = report()
    expect(scrubSentryEvent(e)).toBe(e)
  })
})

// Task 923 R38 (case SEC-S57-SRV-DENY)
it('[SEC-S57-SRV-DENY] An error event leaves the server without cookies, authorization headers, request bodies or one-time tokens', () => {
  const e = scrubSentryEvent(report())
  expect(e.request.cookies).toBeUndefined()
  expect(e.request.data).toBeUndefined()
  expect(Object.keys(e.request.headers).map((h) => h.toLowerCase())).not.toContain('authorization')
  expect(Object.keys(e.request.headers).map((h) => h.toLowerCase())).not.toContain('cookie')
  const sent = JSON.stringify(e)
  for (const secret of ['SECRET', 'hunter2', 'ABC123', 'eyJhbGciOi', 'HASH', 'T1', 'XYZ']) expect(sent, secret).not.toContain(secret)
  expect(e.request.url).toContain('next=/sq/cabinet')       // the control: what is not a credential stays
})
