// @vitest-environment node
/**
 * Security (Task 923 R66 (j)): no credential leaves in an error report, a streamed span or a log.
 *  - SEC-X-SRV-SENTRY-SCRUB: synthetic markers in a token field, a nested password, a percent-encoded token_hash, a span URL, an `extra` refresh token and a log message are all
 *    removed from the scrubbed event and log; none of the three Sentry configurations collects default PII (Sentry 11: the `dataCollection` baseline, no `sendDefaultPii`), each one
 *    scrubs logs, streamed spans (`beforeSendSpan`) and events.
 *  - SEC-X-SRV-SENTRY-SPAN-SCRUB (Task 987 Revision 1): a streamed span (its name, its attributes at any depth, its links' attributes, the `http.request.header.<name>` header attributes) and
 *    the span data of an error event keep no credential.
 * `scrubSentryEvent`, `scrubSentrySpan` and `scrubSentryLog` are the real functions; the three configuration files are read as text (they are loaded by Sentry, not importable in a test).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SENTRY_DATA_COLLECTION, scrubSentryEvent, scrubSentryLog, scrubSentrySpan } from './sentryScrub'

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

  // Revision 1 (F6, F7): Sentry 11 streams spans and sends request headers as the span attributes `http.request.header.<name>` (`@sentry/core` utils/request.js, httpHeadersToSpanAttributes)
  it('[SEC-X-SRV-SENTRY-SPAN-SCRUB] a streamed span and an event span keep no credential, and what is not a credential stays', () => {
    const span = {
      trace_id: 'a'.repeat(32),
      span_id: 'b'.repeat(16),
      name: 'GET /auth/confirm?token_hash=NAME-MARKER&type=email',
      start_timestamp: 1,
      status: 'ok' as const,
      is_segment: true,
      attributes: {
        'url.full': 'https://lero.al/auth/confirm?code=URL-FULL-MARKER&type=email',
        'url.query': 'code=URL-QUERY-MARKER&type=email',
        'url.fragment': 'access_token=URL-FRAGMENT-MARKER',
        'http.request.header.authorization': 'Bearer HEADER-AUTH-MARKER',
        'http.request.header.cookie': ['sb-access-token=HEADER-COOKIE-MARKER'],
        'http.response.header.set-cookie': ['sb=HEADER-SETCOOKIE-MARKER'],
        'http.request.header.user-agent': 'Mozilla',
        'app.form': { step: { password: 'NESTED-MARKER' } },
        'http.status_code': 200,
      },
      links: [{ trace_id: 'c'.repeat(32), span_id: 'd'.repeat(16), attributes: { 'url.full': 'https://lero.al/a?code=LINK-MARKER&x=1', kept: 'link-kept' } }],
    }
    const out = scrubSentrySpan(span)
    const sent = JSON.stringify(out)
    for (const marker of ['NAME-MARKER', 'URL-FULL-MARKER', 'URL-QUERY-MARKER', 'URL-FRAGMENT-MARKER', 'HEADER-AUTH-MARKER', 'HEADER-COOKIE-MARKER', 'HEADER-SETCOOKIE-MARKER', 'NESTED-MARKER', 'LINK-MARKER']) {
      expect(sent, `the span still holds ${marker}`).not.toContain(marker)
    }
    // the control: what is not a credential stays, and the same span object is returned so that it can be used directly as beforeSendSpan
    expect(out).toBe(span)
    expect(out.name).toContain('type=email')
    expect(out.attributes['http.request.header.user-agent']).toBe('Mozilla')
    expect(out.attributes['http.status_code']).toBe(200)
    expect(out.attributes['url.full']).toContain('type=email')
    expect(out.links[0].attributes.kept).toBe('link-kept')
    expect(out.trace_id).toBe('a'.repeat(32))

    // an error event whose span data holds the header attribute
    const e = scrubSentryEvent({ spans: [{ data: { 'http.request.header.authorization': 'Bearer EVENT-HEADER-MARKER', 'http.request.header.accept': 'text/html' } }] } as never) as { spans: { data: Record<string, unknown> }[] }
    expect(JSON.stringify(e), 'the event still holds EVENT-HEADER-MARKER').not.toContain('EVENT-HEADER-MARKER')
    expect(e.spans[0].data['http.request.header.accept']).toBe('text/html')
  })

  it('a span without attributes, links or a name is returned as it is', () => {
    expect(scrubSentrySpan({})).toEqual({})
    expect(scrubSentrySpan({ attributes: {}, links: [{}] })).toEqual({ attributes: {}, links: [{}] })
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

  it('the data collection baseline collects no user data, cookies, bodies, database values or queue arguments', () => {
    const deny = ['forwarded', '-ip', 'remote-', 'via', '-user']
    expect(SENTRY_DATA_COLLECTION).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { deny }, response: { deny } },
      httpBodies: [],
      urlQueryParams: { deny },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      graphQL: { document: false, variables: false },
    })
  })

  // the client alone first drops an error that lies wholly in Google's One Tap script (Task 987 R1-6); everything else goes through the scrubber
  it.each([
    ['sentry.server.config.ts', /beforeSend:\s*\(event\)\s*=>\s*scrubSentryEvent\(event\)/],
    ['sentry.edge.config.ts', /beforeSend:\s*\(event\)\s*=>\s*scrubSentryEvent\(event\)/],
    ['src/instrumentation-client.ts', /beforeSend:\s*\(event\)\s*=>\s*\(isGoogleIdentityScriptError\(event\)\s*\?\s*null\s*:\s*scrubSentryEvent\(event\)\)/],
  ])('%s collects no default PII and scrubs events, spans and logs', (file, beforeSend) => {
    const text = readFileSync(join(process.cwd(), file), 'utf8').replace(/\/\/.*$/gm, '')
    // Sentry 11 removed `sendDefaultPii` and `enableLogs`: a configuration that still names one sets nothing
    expect(text).not.toMatch(/sendDefaultPii/)
    expect(text).not.toMatch(/enableLogs/)
    expect(text).toMatch(/dataCollection:\s*SENTRY_DATA_COLLECTION\b/)
    // Revision 1: spans are streamed (the default) and scrubbed by `beforeSendSpan`; `beforeSendTransaction` is deprecated ("will be removed in v12") and `traceLifecycle: 'static'` only kept it alive
    expect(text).not.toMatch(/traceLifecycle/)
    expect(text).not.toMatch(/beforeSendTransaction/)
    expect(text).toMatch(beforeSend)
    expect(text).toMatch(/beforeSendSpan:\s*\(span\)\s*=>\s*scrubSentrySpan\(span\)/)
    expect(text).toMatch(/beforeSendLog:\s*\(log\)\s*=>\s*scrubSentryLog\(log\)/)
  })
})
