// @vitest-environment jsdom
/**
 * Start-up wiring (Task 923 Revision 7): which Sentry configuration loads in which runtime, and that every Sentry configuration removes credentials from what it
 * sends (finding S57). `i18n/request.ts` is here too: it builds a file path from the language, so only the four known languages may reach that path.
 * The environment is jsdom (it was node before Task 987 Revision 1): the Google One Tap cases below start the real Next.js client SDK, which needs `document` and `window`.
 */
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type InitOptions = {
  dsn?: string; sendDefaultPii?: boolean; tracesSampleRate?: number; enableLogs?: boolean; traceLifecycle?: string; dataCollection?: unknown
  beforeSend?: (e: Record<string, unknown>) => Record<string, unknown>
  beforeSendTransaction?: (e: Record<string, unknown>) => Record<string, unknown>
  beforeSendSpan?: (s: Record<string, unknown>) => Record<string, unknown>
  beforeSendLog?: (l: Record<string, unknown>) => Record<string, unknown>
}

// What the Sentry 11 migration guide (MIGRATION.md, "If you want to keep the v10 default behavior") names as the baseline equal to the v10 default `sendDefaultPii` off
const V10_DEFAULT = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] }, response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] } },
  httpBodies: [],
  urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  graphQL: { document: false, variables: false },
}
const inits: InitOptions[] = []
const captureRequestError = vi.fn()
const captureRouterTransitionStart = vi.fn()
// The Google One Tap cases set `bridge.real`: `init` then also starts the real Next.js client SDK with the same options and a transport that keeps the envelopes (Task 987 R1-6)
const bridge = vi.hoisted(() => ({ real: null as null | { init: (o: unknown) => unknown; captureException: (e: unknown) => unknown }, envelopes: [] as unknown[] }))
vi.mock('@sentry/nextjs', () => ({
  init: (o: InitOptions) => {
    inits.push(o)
    bridge.real?.init({ ...o, transport: () => ({ send: async (envelope: unknown) => { bridge.envelopes.push(envelope); return {} }, flush: async () => true }) })
  },
  captureRequestError,
  captureRouterTransitionStart,
}))

const loaded: string[] = []

const ENV = { ...process.env }
beforeEach(() => { inits.length = 0; loaded.length = 0; vi.resetModules() })
afterEach(() => { process.env = { ...ENV } })

describe('instrumentation.register', () => {
  // only these tests replace the two configurations by recorders; the tests below load the real files
  beforeEach(() => {
    vi.doMock('../../sentry.server.config', () => { loaded.push('server'); return {} })
    vi.doMock('../../sentry.edge.config', () => { loaded.push('edge'); return {} })
  })
  afterEach(() => {
    vi.doUnmock('../../sentry.server.config')
    vi.doUnmock('../../sentry.edge.config')
  })

  it('loads the server configuration in the Node runtime and nothing else', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    const { register } = await import('../instrumentation')
    await register()
    expect(loaded).toEqual(['server'])
  })

  it('loads the edge configuration in the edge runtime and nothing else', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    const { register } = await import('../instrumentation')
    await register()
    expect(loaded).toEqual(['edge'])
  })

  it('loads nothing in any other runtime', async () => {
    process.env.NEXT_RUNTIME = 'browser'
    const { register } = await import('../instrumentation')
    await register()
    delete process.env.NEXT_RUNTIME
    await register()
    expect(loaded).toEqual([])
  })

  it('reports request errors through Sentry', async () => {
    const mod = await import('../instrumentation')
    expect(mod.onRequestError).toBe(captureRequestError)
  })
})

const report = () => ({
  request: { cookies: { 'sb-access-token': 'SECRET' }, headers: { cookie: 'sb=SECRET', authorization: 'Bearer SECRET', 'user-agent': 'UA' }, url: 'https://lero.al/a?code=ONETIME&x=1', data: { password: 'hunter2' } },
})

// a streamed span as Sentry 11 hands it to `beforeSendSpan`: the request headers are attributes named `http.request.header.<name>`
const span = () => ({
  trace_id: 'a'.repeat(32),
  span_id: 'b'.repeat(16),
  name: 'GET /auth/callback?code=ONETIME&x=1',
  start_timestamp: 1,
  status: 'ok',
  is_segment: true,
  attributes: { 'http.request.header.authorization': 'Bearer SECRET', 'http.request.header.cookie': ['sb=SECRET'], 'http.request.header.user-agent': 'UA', 'url.full': 'https://lero.al/a?token=SECRET&x=1' },
  links: [{ trace_id: 'c'.repeat(32), span_id: 'd'.repeat(16), attributes: { 'url.full': 'https://lero.al/a?code=SECRET' } }],
})

describe.each([
  ['sentry.server.config', () => import('../../sentry.server.config')],
  ['sentry.edge.config', () => import('../../sentry.edge.config')],
  ['instrumentation-client', () => import('../instrumentation-client')],
])('%s', (_name, load) => {
  it('removes credentials from an error report', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    await load()
    expect(inits).toHaveLength(1)
    const out = JSON.stringify(inits[0].beforeSend!(report() as never))
    expect(out).not.toContain('SECRET')
    expect(out).not.toContain('ONETIME')
    expect(out).not.toContain('hunter2')
    expect(out).toContain('UA')
    expect(out).toContain('x=1')
  })

  // Task 987 Revision 1: Sentry 11 streams spans and its `beforeSendSpan` is the hook that runs on every span
  it('removes credentials from a streamed span', async () => {
    await load()
    expect(typeof inits[0].beforeSendSpan).toBe('function')
    const out = JSON.stringify(inits[0].beforeSendSpan!(span() as never))
    expect(out).not.toContain('SECRET')
    expect(out).not.toContain('ONETIME')
    expect(out).toContain('UA')
    expect(out).toContain('x=1')
  })

  it('has a DSN', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    await load()
    expect(String(inits[0].dsn)).toMatch(/^https:\/\/[0-9a-z]+@.+\.ingest\.(de\.)?sentry\.io\/\d+$/)
  })

  // Task 923 R66 (j) set `sendDefaultPii: false` in all three configurations (S57). Sentry 11 removed that option, so a configuration that kept it would set nothing, and an unset
  // `dataCollection` collects cookies, request bodies and the IP address: each configuration sets the v10 baseline instead
  it('does not collect personal data such as the IP address, cookies or bodies by default (S57, R66 (j))', async () => {
    await load()
    expect(inits[0].dataCollection).toEqual(V10_DEFAULT)
    expect(inits[0]).not.toHaveProperty('sendDefaultPii')
  })

  // Sentry 11 streams spans by default and ignores `beforeSendTransaction` then; the option is deprecated ("will be removed in v12") and `traceLifecycle: 'static'` only kept it alive
  it('streams spans (the default) and sets neither the deprecated beforeSendTransaction nor traceLifecycle', async () => {
    await load()
    expect(inits[0]).not.toHaveProperty('beforeSendTransaction')
    expect(inits[0]).not.toHaveProperty('traceLifecycle')
  })

  // Sentry 11 removed `enableLogs`; the log hook stays
  it('scrubs a log and no longer sets the removed enableLogs option', async () => {
    await load()
    expect(inits[0]).not.toHaveProperty('enableLogs')
    const out = JSON.stringify(inits[0].beforeSendLog!({ message: 'refresh failed access_token=SECRET', attributes: { authorization: 'Bearer SECRET', route: '/auth/callback' } }))
    expect(out).not.toContain('SECRET')
    expect(out).toContain('/auth/callback')
  })
})

describe('instrumentation-client', () => {
  it('hands router transitions to Sentry', async () => {
    const mod = await import('../instrumentation-client')
    expect(mod.onRouterTransitionStart).toBe(captureRouterTransitionStart)
  })
})

// Task 987 R1-6 (Sentry issue LERO-AL-2J): `Error: pa` thrown inside Google's One Tap script was reported as our code, because the client rewrites every frame address to `app://<path>`.
// The real client SDK runs here (its frame normalization and its event processors in their real order); fake timers keep its timers out of the pending-timer guard.
describe('instrumentation-client: an error thrown inside Google\'s One Tap script', () => {
  const GOOGLE = 'https://accounts.google.com/gsi/client'
  const OURS = 'https://lero.al/_next/static/chunks/app/page.js'
  const stackOf = (message: string, ...addresses: string[]) => {
    const error = new Error(message)
    error.stack = `Error: ${message}\n${addresses.map((address, i) => `    at fn${i} (${address}:${10 + i}:20)`).join('\n')}`
    return error
  }
  // the events that reached the transport: [message, frame filenames] each
  const sentEvents = () =>
    bridge.envelopes.flatMap((envelope) => (envelope as [unknown, [{ type?: string }, { exception?: { values?: { value?: string; stacktrace?: { frames?: { filename?: string }[] } }[] } }][]])[1])
      .filter(([header]) => header.type === 'event')
      .map(([, event]) => [event.exception?.values?.[0]?.value, event.exception?.values?.[0]?.stacktrace?.frames?.map((frame) => frame.filename)])

  const capture = async (...errors: Error[]) => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    const real = createRequire(import.meta.url)(join(process.cwd(), 'node_modules/@sentry/nextjs/build/cjs/client/index.js'))
    bridge.real = real
    await import('../instrumentation-client')
    for (const error of errors) real.captureException(error)
    await vi.advanceTimersByTimeAsync(100)
    return sentEvents()
  }

  beforeEach(() => { bridge.envelopes.length = 0; vi.useFakeTimers() })
  afterEach(() => { bridge.real = null; vi.useRealTimers() })

  it('an error of our code reaches the transport with its frames rewritten to app:///<path>, so the real client runs (the control of the next cases)', async () => {
    const sent = await capture(stackOf('own failure', OURS))
    expect(sent).toEqual([['own failure', ['app:///_next/static/chunks/app/page.js']]])
  })

  it.each([[GOOGLE], [`${GOOGLE}?hl=sq`]])('is not sent when every frame lies in the script (%s)', async (address) => {
    expect(await capture(stackOf('pa', address, address))).toEqual([])
  })

  it('is sent when a frame of our code calls into the script', async () => {
    const sent = await capture(stackOf('called from ours', GOOGLE, OURS))
    expect(sent).toHaveLength(1)
    expect(sent[0][0]).toBe('called from ours')
    // the script's frame reached the filter as `app:///gsi/client` (the rewrite of the issue), next to a frame of our code
    expect(sent[0][1]).toEqual(['app:///_next/static/chunks/app/page.js', 'app:///gsi/client'])
  })

  it('a script frame written with the query of the loader URL (?hl=) is rewritten the same way and kept next to our code', async () => {
    const sent = await capture(stackOf('called from ours with hl', `${GOOGLE}?hl=sq`, OURS))
    expect(sent).toHaveLength(1)
    expect(sent[0][1]).toEqual(['app:///_next/static/chunks/app/page.js', 'app:///gsi/client?hl=sq'])
  })

  it('is sent when the script calls back into our code', async () => {
    const sent = await capture(stackOf('thrown in ours', OURS, GOOGLE))
    expect(sent).toHaveLength(1)
    expect(sent[0][0]).toBe('thrown in ours')
  })

  it('an error of our code alone is sent and still scrubbed', async () => {
    const sent = await capture(stackOf('failed at /auth/callback?code=ONETIME&next=/sq', OURS))
    expect(sent).toHaveLength(1)
    expect(JSON.stringify(sent)).not.toContain('ONETIME')
  })
})

describe('i18n/request', () => {
  vi.mock('next-intl/server', () => ({ getRequestConfig: (fn: unknown) => fn }))

  const config = async (requestLocale: Promise<string | undefined>) => {
    const mod = await import('../i18n/request')
    return (mod.default as unknown as (a: { requestLocale: Promise<string | undefined> }) => Promise<{ locale: string; messages: Record<string, unknown> }>)({ requestLocale })
  }

  it.each(['sq', 'en', 'uk', 'it'])('the language %s loads its own messages', async (locale) => {
    const res = await config(Promise.resolve(locale))
    expect(res.locale).toBe(locale)
    expect(Object.keys(res.messages).length).toBeGreaterThan(10)
  })

  it.each([[undefined], [''], ['xx'], ['EN'], ['../../package'], ['../secrets'], ['sq/../en'], ['en.json'], ['__proto__']])('the language %j is replaced by the default and never reaches the file path', async (locale) => {
    const res = await config(Promise.resolve(locale))
    expect(res.locale).toBe('sq')
    expect(res.messages).toBeDefined()
  })
})
