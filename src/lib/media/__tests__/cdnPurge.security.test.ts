// @vitest-environment node
/**
 * Task 1038 (AC12, owner decision O1038-5): the purge of a deleted photo from the Cloudflare CDN.
 *  - SEC-PURGE-SHAPE: `POST /zones/<zone>/purge_cache` with `{ prefixes }` only, each prefix `media.lero.al/<owner>/listings/<uuid>/` (no scheme, query, fragment, `..`),
 *    at most 100 per request, one request for a listing's photos; never `purge_everything`, never `files`.
 *  - SEC-PURGE-RETRY: a 429, a 5xx or a network failure is retried twice (after `Retry-After`, else 1 s then 4 s); a failure is returned and logged as `purge_failed`, never as `purged`.
 *  - SEC-PURGE-SECRET: the token and the zone id are in no log line and in no answer; the module is server-only.
 * The code under test is the real module; the only double is the network (`fetch`). Every value is synthetic.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { purgePhotoFolders } from '../cdnPurge'

const TOKEN = 'cf-token-1038-never-real'
const ZONE = 'zone1038abcdef0123456789abcdef01'
const OWNER = '22222222-2222-4222-8222-222222222222'
const folder = (n: number) => `media.lero.al/${OWNER}/listings/${String(n).padStart(8, '0')}-4444-4444-8444-444444444444/`
const OK = () => new Response(JSON.stringify({ success: true, errors: [], result: { id: 'purge-1' } }), { status: 200 })
const fail = (status: number, codes: number[], headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ success: false, errors: codes.map((code) => ({ code, message: 'x' })), result: null }), { status, headers })

type Call = { url: string; method: string; headers: Headers; body: unknown }
let calls: Call[] = []
let answers: (() => Response | Promise<Response>)[] = []
let logged: unknown[][] = []

beforeEach(() => {
  process.env.CLOUDFLARE_ZONE_ID = ZONE
  process.env.CLOUDFLARE_CACHE_PURGE_TOKEN = TOKEN
  calls = []
  answers = []
  logged = []
  vi.useFakeTimers()
  vi.stubGlobal('fetch', vi.fn(async (input: string | Request, init?: RequestInit) => {
    const request = typeof input === 'string' ? new Request(input, init) : input
    calls.push({ url: request.url, method: request.method, headers: request.headers, body: JSON.parse(await request.clone().text() || 'null') })
    const next = answers.shift() ?? OK
    return next()
  }))
  for (const level of ['error', 'warn', 'info', 'log'] as const) vi.spyOn(console, level).mockImplementation((...args: unknown[]) => { logged.push(args) })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete process.env.CLOUDFLARE_ZONE_ID
  delete process.env.CLOUDFLARE_CACHE_PURGE_TOKEN
})

const run = async (prefixes: string[]) => {
  const pending = purgePhotoFolders(prefixes)
  await vi.advanceTimersByTimeAsync(60_000)
  return pending
}

describe('what is asked of Cloudflare', () => {
  it('[SEC-PURGE-SHAPE] one POST to the zone purge_cache with the prefixes only, the token as a bearer header', async () => {
    const result = await run([folder(1), folder(2)])
    expect(result).toEqual({ outcome: 'purged', prefixes: [folder(1), folder(2)] })
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('POST')
    expect(calls[0].url).toBe(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`)
    expect(calls[0].headers.get('authorization')).toBe(`Bearer ${TOKEN}`)
    expect(calls[0].headers.get('content-type')).toContain('application/json')
    expect(calls[0].body).toEqual({ prefixes: [folder(1), folder(2)] })
  })

  it('[SEC-PURGE-SHAPE] the body never asks to purge everything or to purge by file, tag or host', async () => {
    await run([folder(1)])
    const text = JSON.stringify(calls[0].body)
    expect(text).not.toMatch(/purge_everything|"files"|"tags"|"hosts"/)
    expect(Object.keys(calls[0].body as object)).toEqual(['prefixes'])
  })

  it('[SEC-PURGE-SHAPE] the module has no purge_everything call in its source and is server-only', () => {
    const source = readFileSync(join(__dirname, '..', 'cdnPurge.ts'), 'utf8')
    expect(source.split(/\r?\n/)[0]).toBe("import 'server-only'")
    expect(source).not.toContain('purge_everything')
  })

  it('[SEC-PURGE-SHAPE] 250 prefixes go in three requests of at most 100; all of them are purged', async () => {
    const prefixes = Array.from({ length: 250 }, (_v, i) => folder(i))
    const result = await run(prefixes)
    expect(calls.map((c) => (c.body as { prefixes: string[] }).prefixes.length)).toEqual([100, 100, 50])
    expect(result.outcome).toBe('purged')
    expect(calls.flatMap((c) => (c.body as { prefixes: string[] }).prefixes)).toEqual(prefixes)
  })

  it('[SEC-PURGE-SHAPE] twenty photos of one listing are one request', async () => {
    await run(Array.from({ length: 20 }, (_v, i) => folder(i)))
    expect(calls).toHaveLength(1)
  })

  it('[SEC-PURGE-SHAPE] no prefix: nothing is asked and the outcome is purged', async () => {
    expect(await run([])).toEqual({ outcome: 'purged', prefixes: [] })
    expect(calls).toHaveLength(0)
  })

  it.each([
    ['a scheme', `https://${folder(1)}`],
    ['a query', `${folder(1)}?x=1`],
    ['a fragment', `${folder(1)}#x`],
    ['a .. segment', `media.lero.al/${OWNER}/listings/../x/`],
    ['another host', `evil.example/${OWNER}/listings/00000001-4444-4444-8444-444444444444/`],
    ['the bare host', 'media.lero.al/'],
    ['no trailing slash', folder(1).slice(0, -1)],
    ['a wildcard', 'media.lero.al/*'],
    ['an empty text', ''],
  ])('[SEC-PURGE-SHAPE] a prefix with %s is refused: nothing is asked, purge_failed', async (_label, prefix) => {
    const result = await run([folder(2), prefix])
    expect(result.outcome).toBe('purge_failed')
    expect(calls).toHaveLength(0)
  })
})

describe('retries and failures', () => {
  it('[SEC-PURGE-RETRY] a 429 is retried after its Retry-After seconds, and then the purge is reported as purged', async () => {
    answers = [() => fail(429, [971], { 'Retry-After': '7' }), OK]
    const pending = purgePhotoFolders([folder(1)])
    await vi.advanceTimersByTimeAsync(6_999)
    expect(calls).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(calls).toHaveLength(2)
    expect((await pending).outcome).toBe('purged')
  })

  it('[SEC-PURGE-RETRY] a 5xx without Retry-After is retried after 1 s and then after 4 s, and a third failure is purge_failed with the error codes', async () => {
    answers = [() => fail(503, [10001]), () => fail(502, [10002]), () => fail(500, [10003])]
    const pending = purgePhotoFolders([folder(1)])
    await vi.advanceTimersByTimeAsync(999)
    expect(calls).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(calls).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(3_999)
    expect(calls).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(calls).toHaveLength(3)
    const result = await pending
    expect(result).toMatchObject({ outcome: 'purge_failed', prefixes: [folder(1)] })
    expect((result as { codes: unknown[] }).codes).toEqual(expect.arrayContaining([10003]))
    expect(calls).toHaveLength(3)   // two retries, no more
  })

  it('[SEC-PURGE-RETRY] a network failure is retried twice, then purge_failed', async () => {
    answers = [() => { throw new TypeError('fetch failed') }, () => { throw new TypeError('fetch failed') }, () => { throw new TypeError('fetch failed') }]
    const result = await run([folder(1)])
    expect(calls).toHaveLength(3)
    expect(result.outcome).toBe('purge_failed')
  })

  it('[SEC-PURGE-RETRY] a failure followed by success on the last try is purged', async () => {
    answers = [() => fail(500, [1]), () => fail(500, [1]), OK]
    expect((await run([folder(1)])).outcome).toBe('purged')
    expect(calls).toHaveLength(3)
  })

  it('[SEC-PURGE-RETRY] a 4xx other than 429 is not retried: purge_failed with its codes', async () => {
    answers = [() => fail(403, [10000])]
    const result = await run([folder(1)])
    expect(calls).toHaveLength(1)
    expect(result).toMatchObject({ outcome: 'purge_failed', codes: [10000] })
  })

  it('[SEC-PURGE-RETRY] an answer of 200 with success=false is purge_failed, never purged', async () => {
    answers = [() => new Response(JSON.stringify({ success: false, errors: [{ code: 1999, message: 'x' }] }), { status: 200 })]
    const result = await run([folder(1)])
    expect(result).toMatchObject({ outcome: 'purge_failed', codes: [1999] })
  })

  it('[SEC-PURGE-RETRY] an answer that is not JSON is purge_failed, never purged', async () => {
    answers = [() => new Response('<html>', { status: 200 })]
    expect((await run([folder(1)])).outcome).toBe('purge_failed')
  })

  it('[SEC-PURGE-RETRY] when one of three requests fails for good, the whole outcome is purge_failed and names the prefixes of the failed request', async () => {
    const prefixes = Array.from({ length: 250 }, (_v, i) => folder(i))
    answers = [OK, () => fail(403, [10000]), OK]
    const result = await run(prefixes)
    expect(result.outcome).toBe('purge_failed')
    expect(result.prefixes).toEqual(prefixes.slice(100, 200))
  })

  it('[SEC-PURGE-RETRY] a missing zone id or token is purge_failed (not_configured) and nothing is asked', async () => {
    delete process.env.CLOUDFLARE_CACHE_PURGE_TOKEN
    expect(await run([folder(1)])).toMatchObject({ outcome: 'purge_failed', codes: ['not_configured'] })
    process.env.CLOUDFLARE_CACHE_PURGE_TOKEN = TOKEN
    delete process.env.CLOUDFLARE_ZONE_ID
    expect(await run([folder(1)])).toMatchObject({ outcome: 'purge_failed', codes: ['not_configured'] })
    expect(calls).toHaveLength(0)
  })

  it('[SEC-PURGE-RETRY] a failure is logged as purge_failed with the prefixes and the codes; a success is not logged as a failure', async () => {
    answers = [() => fail(403, [10000])]
    await run([folder(1)])
    const line = logged.find((args) => JSON.stringify(args).includes('purge_failed'))
    expect(line).toBeTruthy()
    expect(JSON.stringify(line)).toContain(folder(1))
    expect(JSON.stringify(line)).toContain('10000')
    logged = []
    await run([folder(1)])
    expect(JSON.stringify(logged)).not.toContain('purge_failed')
  })
})

describe('secrets', () => {
  it('[SEC-PURGE-SECRET] neither the token nor the zone id is in a log line or in an answer, on success or on failure', async () => {
    const results = []
    results.push(await run([folder(1)]))
    answers = [() => fail(500, [1]), () => fail(500, [1]), () => fail(500, [1])]
    results.push(await run([folder(1)]))
    answers = [() => { throw new TypeError(`fetch failed ${TOKEN} ${ZONE}`) }, () => { throw new TypeError('x') }, () => { throw new TypeError('x') }]
    results.push(await run([folder(1)]))
    answers = [() => fail(403, [10000])]
    results.push(await run([folder(1)]))
    const everything = JSON.stringify([results, logged])
    expect(everything).not.toContain(TOKEN)
    expect(everything).not.toContain(ZONE)
  })
})
