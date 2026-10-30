// @vitest-environment node
/**
 * Security (Task 923 R66 (j)): no credential leaves in an error report, a transaction or a log.
 *  - SEC-X-SRV-SENTRY-SCRUB: synthetic markers in a token field, a nested password, a percent-encoded token_hash, a span URL, an `extra` refresh token and a log message are all
 *    removed from the scrubbed event and log; none of the three Sentry configurations sends default PII, and each one scrubs logs as well as events.
 * `scrubSentryEvent` and `scrubSentryLog` are the real functions; the three configuration files are read as text (they are loaded by Sentry, not importable in a test).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scrubSentryEvent, scrubSentryLog } from './sentryScrub'

const MARKERS = ['TOKEN-MARKER', 'PASSWORD-MARKER', 'HASH-MARKER', 'SPAN-URL-MARKER', 'SPAN-CODE-MARKER', 'REFRESH-MARKER', 'LOG-ACCESS-MARKER', 'EXC-CODE-MARKER', 'CRUMB-MARKER', 'LOG-AUTH-MARKER', 'NESTED-ARRAY-MARKER', 'MSG-MARKER']

const event = () => ({
  message: 'sign-in failed for ?access_token=MSG-MARKER',
  request: { url: 'https://lero.al/a?next=/x', headers: { 'user-agent': 'Mozilla' } as Record<string, unknown> },
  extra: { refresh_token: 'REFRESH-MARKER', note: 'kept', deep: { list: [{ inner: { Password: 'NESTED-ARRAY-MARKER' } }] } },
  contexts: { auth: { token: 'TOKEN-MARKER', flow: 'recovery' }, form: { a: { b: { c: { password: 'PASSWORD-MARKER' } } } } },
  exception: { values: [{ type: 'Error', value: 'callback failed at /auth/callback?code=EXC-CODE-MARKER&next=/sq' }] },
  spans: [{ description: 'GET https://lero.al/api/x?access_token=SPAN-URL-MARKER', data: { 'http.url': 'https://lero.al/auth/confirm?code=SPAN-CODE-MARKER&type=email', status: 200 } }],
  breadcrumbs: [
    { message: 'navigated', data: { to: '/auth/confirm?next=%2Fcabinet%26token_hash%3DHASH-MARKER', from: '/y' } },
    { message: 'fetch', data: { nested: { secret: 'CRUMB-MARKER' } } },
  ],
})

describe('sentryScrub', () => {
  it('[SEC-X-SRV-SENTRY-SCRUB] every credential shape is removed', () => {
    const scrubbed = scrubSentryEvent(event())
    const sent = JSON.stringify(scrubbed)
    for (const marker of MARKERS) expect(sent, `the event still holds ${marker}`).not.toContain(marker)
    // a log message and its attributes
    const log = scrubSentryLog({ level: 'error', message: 'refresh failed access_token=LOG-ACCESS-MARKER for a user', attributes: { authorization: 'Bearer LOG-AUTH-MARKER', json: '{"refresh_token":"REFRESH-MARKER"}', route: '/auth/callback' } })
    const sentLog = JSON.stringify(log)
    for (const marker of ['LOG-ACCESS-MARKER', 'LOG-AUTH-MARKER', 'REFRESH-MARKER']) expect(sentLog, `the log still holds ${marker}`).not.toContain(marker)
    // the control: what is not a credential stays, so the report is still useful
    expect(scrubbed.extra.note).toBe('kept')
    expect(scrubbed.contexts.auth.flow).toBe('recovery')
    expect(scrubbed.request.url).toBe('https://lero.al/a?next=/x')
    expect(scrubbed.exception.values[0].value).toContain('next=/sq')
    expect(scrubbed.spans[0].data.status).toBe(200)
    expect(scrubbed.breadcrumbs[0].data.from).toBe('/y')
    expect(log.attributes.route).toBe('/auth/callback')
    expect(log.level).toBe('error')
  })

  it('a value under a credential key is replaced whatever its type, and an absent or null one is not invented', () => {
    const e = scrubSentryEvent({ extra: { token: 12345, password: { a: 1 }, code: ['x'], secret: null, apikey: undefined, Authorization: 'Bearer X', COOKIE: 'a=b', other: 7 } } as never) as { extra: Record<string, unknown> }
    expect(e.extra).toEqual({ token: '[redacted]', password: '[redacted]', code: '[redacted]', secret: null, apikey: undefined, Authorization: '[redacted]', COOKIE: '[redacted]', other: 7 })
  })

  it('a cyclic object and a very deep one are walked without a crash', () => {
    const cyclic: Record<string, unknown> = { a: 'b?token=CYCLE-MARKER' }
    cyclic.self = cyclic
    let deep: Record<string, unknown> = { password: 'DEEP-MARKER' }
    for (let i = 0; i < 60; i++) deep = { child: deep }
    const e = scrubSentryEvent({ extra: { cyclic, deep } } as never)
    expect(JSON.stringify((e as { extra: { cyclic: { a: string } } }).extra.cyclic.a)).toContain('token=[redacted]')
  })

  it.each(['sentry.server.config.ts', 'sentry.edge.config.ts', 'src/instrumentation-client.ts'])('%s sends no default PII and scrubs events, transactions and logs', (file) => {
    const text = readFileSync(join(process.cwd(), file), 'utf8').replace(/\/\/.*$/gm, '')
    expect(text).toMatch(/sendDefaultPii:\s*false/)
    expect(text).not.toMatch(/sendDefaultPii:\s*true/)
    expect(text).toMatch(/beforeSend:\s*\(event\)\s*=>\s*scrubSentryEvent\(event\)/)
    expect(text).toMatch(/beforeSendTransaction:\s*\(event\)\s*=>\s*scrubSentryEvent\(event\)/)
    expect(text).toMatch(/beforeSendLog:\s*\(log\)\s*=>\s*scrubSentryLog\(log\)/)
  })
})
