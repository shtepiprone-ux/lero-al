// @vitest-environment node
/**
 * Start-up wiring (Task 923 Revision 7): which Sentry configuration loads in which runtime, and that every Sentry configuration removes credentials from what it
 * sends (finding S57). `i18n/request.ts` is here too: it builds a file path from the language, so only the four known languages may reach that path.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type InitOptions = {
  dsn?: string; sendDefaultPii?: boolean; tracesSampleRate?: number; enableLogs?: boolean
  beforeSend?: (e: Record<string, unknown>) => Record<string, unknown>
  beforeSendTransaction?: (e: Record<string, unknown>) => Record<string, unknown>
}
const inits: InitOptions[] = []
const captureRequestError = vi.fn()
const captureRouterTransitionStart = vi.fn()
vi.mock('@sentry/nextjs', () => ({ init: (o: InitOptions) => { inits.push(o) }, captureRequestError, captureRouterTransitionStart }))

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

describe.each([
  ['sentry.server.config', () => import('../../sentry.server.config')],
  ['sentry.edge.config', () => import('../../sentry.edge.config')],
  ['instrumentation-client', () => import('../instrumentation-client')],
])('%s', (_name, load) => {
  it('removes credentials from an error report and from a trace', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    await load()
    expect(inits).toHaveLength(1)
    for (const hook of [inits[0].beforeSend, inits[0].beforeSendTransaction]) {
      const out = JSON.stringify(hook!(report() as never))
      expect(out).not.toContain('SECRET')
      expect(out).not.toContain('ONETIME')
      expect(out).not.toContain('hunter2')
      expect(out).toContain('UA')
      expect(out).toContain('x=1')
    }
  })

  it('has a DSN', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/1'
    await load()
    expect(String(inits[0].dsn)).toMatch(/^https:\/\/[0-9a-z]+@.+\.ingest\.(de\.)?sentry\.io\/\d+$/)
  })

  // Task 923 R66 (j) set `sendDefaultPii: false` in all three configurations; this was a characterisation of the vulnerability (S57) and is now its regression
  it('does not send personal data such as the IP address by default (S57, R66 (j))', async () => {
    await load()
    expect(inits[0].sendDefaultPii).toBe(false)
  })
})

describe('instrumentation-client', () => {
  it('hands router transitions to Sentry', async () => {
    const mod = await import('../instrumentation-client')
    expect(mod.onRouterTransitionStart).toBe(captureRouterTransitionStart)
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
