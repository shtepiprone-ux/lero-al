// @vitest-environment node
/**
 * Task 1038 (AC9): the server's Cloudflare R2 client.
 *  - SEC-R2-SRV-ONLY: the module starts with `import 'server-only'`, so a client bundle that imports it fails to build, and no `NEXT_PUBLIC_` name is read.
 *  - SEC-R2-SIGN: a presigned PUT address is signed with the `R2_*` values (an independent AWS Signature V4 computation gives the same signature), expires in 300 s, signs
 *    `Content-Type`, `Content-Length` and the `Cache-Control` of the cache policy, and carries neither the secret key nor any other header value in its text.
 *  - SEC-R2-SSRF: every server call goes to `R2_ENDPOINT` only; `keyFromPublicUrl` accepts an address of `R2_PUBLIC_URL` only, in the exact form of a key.
 *  - SEC-1046-R2-MAIL (Task 1046 AC3): the mail functions sign with `R2_MAIL_*` and address `R2_MAIL_BUCKET_NAME` only; the listing functions never use a mail variable; a missing
 *    mail variable throws `R2ConfigError` before any call; a declared or real length above the limit throws `R2TooLargeError` without keeping the body.
 * The code under test is the real module. The only double is the network (`fetch`). Every value is synthetic.
 */
import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_CONTROL, PRESIGN_EXPIRES_SECONDS, R2ConfigError, R2TooLargeError, deleteMailObjects, deleteObjects, getMailObject, headObject, keyFromPublicUrl, presignPut, publicUrl, readHead } from '../r2'

const ENV = {
  R2_ACCESS_KEY_ID: 'AKTESTACCESSKEY1038',
  R2_SECRET_ACCESS_KEY: 'test-secret-key-1038-never-real',
  R2_ENDPOINT: 'https://0123456789abcdef.r2.cloudflarestorage.com',
  R2_BUCKET_NAME: 'lero-test-bucket',
  R2_PUBLIC_URL: 'https://media.lero.al',
  R2_ACCOUNT_ID: '0123456789abcdef',
  R2_MAIL_ACCESS_KEY_ID: 'AKTESTMAILKEY1046',
  R2_MAIL_SECRET_ACCESS_KEY: 'test-mail-secret-1046-never-real',
  R2_MAIL_BUCKET_NAME: 'lero-test-mail',
} as const
const OWNER = '22222222-2222-4222-8222-222222222222'
const FOLDER = '44444444-4444-4444-8444-444444444444'
const KEY = `${OWNER}/listings/${FOLDER}/full.webp`

const saved: Record<string, string | undefined> = {}
beforeEach(() => {
  for (const [name, value] of Object.entries(ENV)) { saved[name] = process.env[name]; process.env[name] = value }
})
afterEach(() => {
  for (const name of Object.keys(ENV)) { if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name] }
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('the module is server-only', () => {
  const source = readFileSync(join(__dirname, '..', 'r2.ts'), 'utf8')
  it("[SEC-R2-SRV-ONLY] starts with import 'server-only'", () => {
    expect(source.split(/\r?\n/)[0]).toBe("import 'server-only'")
  })
  it('[SEC-R2-SRV-ONLY] reads only the server variables, never a NEXT_PUBLIC_ one', () => {
    expect(source).not.toMatch(/NEXT_PUBLIC_/)
    for (const name of Object.keys(ENV).filter((n) => n !== 'R2_ACCOUNT_ID')) expect(source).toContain(name)
  })
})

describe('presignPut', () => {
  const hmac = (key: Buffer | string, data: string) => createHmac('sha256', key).update(data).digest()
  /** AWS Signature V4 for a presigned S3 request, written out here, independent of aws4fetch */
  function expectedSignature(url: URL, headers: Record<string, string>): string {
    const query = new URLSearchParams(url.search)
    const amzDate = query.get('X-Amz-Date') as string
    const signedHeaders = (query.get('X-Amz-SignedHeaders') as string).split(';')
    const date = amzDate.slice(0, 8)
    const scope = `${date}/auto/s3/aws4_request`
    const canonicalQuery = [...query.entries()]
      .filter(([k]) => k !== 'X-Amz-Signature')
      .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)] as const)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    const canonicalHeaders = signedHeaders.map((h) => `${h}:${h === 'host' ? url.host : headers[h]}`).join('\n')
    const canonicalRequest = ['PUT', url.pathname, canonicalQuery, `${canonicalHeaders}\n`, signedHeaders.join(';'), 'UNSIGNED-PAYLOAD'].join('\n')
    const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, createHash('sha256').update(canonicalRequest).digest('hex')].join('\n')
    const kSigning = hmac(hmac(hmac(hmac(`AWS4${ENV.R2_SECRET_ACCESS_KEY}`, date), 'auto'), 's3'), 'aws4_request')
    return createHmac('sha256', kSigning).update(stringToSign).digest('hex')
  }

  it('[SEC-R2-SIGN] returns an address on R2_ENDPOINT for the bucket and the key, valid 300 seconds, credential of the R2 key id', async () => {
    const url = new URL(await presignPut(KEY, 'image/webp', 1234))
    expect(url.origin).toBe(ENV.R2_ENDPOINT)
    expect(url.pathname).toBe(`/${ENV.R2_BUCKET_NAME}/${KEY}`)
    expect(PRESIGN_EXPIRES_SECONDS).toBe(300)
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300')
    expect(url.searchParams.get('X-Amz-Algorithm')).toBe('AWS4-HMAC-SHA256')
    expect(url.searchParams.get('X-Amz-Credential')?.startsWith(`${ENV.R2_ACCESS_KEY_ID}/`)).toBe(true)
    expect(url.searchParams.get('X-Amz-Credential')?.endsWith('/auto/s3/aws4_request')).toBe(true)
  })

  it('[SEC-R2-SIGN] the content type, the content length and the cache policy are signed headers', async () => {
    const url = new URL(await presignPut(KEY, 'image/webp', 1234))
    const signed = (url.searchParams.get('X-Amz-SignedHeaders') as string).split(';')
    expect(signed).toEqual(['cache-control', 'content-length', 'content-type', 'host'])
    expect(CACHE_CONTROL).toBe('public, max-age=3600, s-maxage=31536000')
  })

  it('[SEC-R2-SIGN] the signature is the AWS Signature V4 of the R2 secret over those headers (an independent computation agrees)', async () => {
    const url = new URL(await presignPut(KEY, 'image/webp', 1234))
    const headers = { 'cache-control': CACHE_CONTROL, 'content-length': '1234', 'content-type': 'image/webp' }
    expect(url.searchParams.get('X-Amz-Signature')).toBe(expectedSignature(url, headers))
  })

  it.each([
    ['the content length', 'image/webp', 1235],
    ['the content type', 'image/jpeg', 1234],
  ])('[SEC-R2-SIGN] a different %s gives a different signature (so it cannot be changed after signing)', async (_label, type, length) => {
    vi.useFakeTimers({ toFake: ['Date'] })   // the same second, the same key: only the signed header differs
    vi.setSystemTime(new Date('2026-11-25T10:00:00Z'))
    const a = new URL(await presignPut(KEY, 'image/webp', 1234)).searchParams
    const b = new URL(await presignPut(KEY, type, length)).searchParams
    expect(b.get('X-Amz-Date')).toBe(a.get('X-Amz-Date'))
    expect(b.get('X-Amz-Signature')).not.toBe(a.get('X-Amz-Signature'))
  })

  it('[SEC-R2-SIGN] the address never carries the secret key', async () => {
    const text = await presignPut(KEY, 'image/webp', 1234)
    expect(text).not.toContain(ENV.R2_SECRET_ACCESS_KEY)
  })

  it.each(['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ENDPOINT', 'R2_BUCKET_NAME'])('[SEC-R2-SIGN] without %s nothing is signed (it throws)', async (name) => {
    delete process.env[name]
    await expect(presignPut(KEY, 'image/webp', 1234)).rejects.toThrow()
  })

  it.each([
    ['a .. segment', `${OWNER}/listings/../x/full.webp`],
    ['a leading slash', `/${KEY}`],
    ['an empty key', ''],
    ['a backslash', `${OWNER}\\listings\\x.webp`],
    ['a query', `${KEY}?x=1`],
    ['a fragment', `${KEY}#x`],
  ])('[SEC-R2-SIGN] refuses a key with %s', async (_label, key) => {
    await expect(presignPut(key, 'image/webp', 1234)).rejects.toThrow()
  })
})

describe('the server calls', () => {
  function stubFetch(handler: (request: Request) => Response | Promise<Response>) {
    const seen: Request[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: Request) => { seen.push(input); return handler(input) }))
    return seen
  }

  it('[SEC-R2-SSRF] headObject asks R2_ENDPOINT only, with a HEAD, and returns the length and the type', async () => {
    const seen = stubFetch(() => new Response(null, { status: 200, headers: { 'content-length': '4321', 'content-type': 'image/webp' } }))
    await expect(headObject(KEY)).resolves.toEqual({ contentLength: 4321, contentType: 'image/webp' })
    expect(seen).toHaveLength(1)
    expect(seen[0].method).toBe('HEAD')
    expect(new URL(seen[0].url).origin).toBe(ENV.R2_ENDPOINT)
    expect(new URL(seen[0].url).pathname).toBe(`/${ENV.R2_BUCKET_NAME}/${KEY}`)
    expect(seen[0].headers.get('authorization')).toContain(`Credential=${ENV.R2_ACCESS_KEY_ID}/`)
    expect(seen[0].headers.get('authorization')).not.toContain(ENV.R2_SECRET_ACCESS_KEY)
  })

  it('[SEC-R2-SSRF] headObject answers null for a missing object and throws for any other failure (never "missing" on a guess)', async () => {
    stubFetch(() => new Response(null, { status: 404 }))
    await expect(headObject(KEY)).resolves.toBeNull()
    stubFetch(() => new Response(null, { status: 403 }))
    await expect(headObject(KEY)).rejects.toThrow()
    stubFetch(() => new Response(null, { status: 500 }))
    await expect(headObject(KEY)).rejects.toThrow()
  })

  it('[SEC-R2-SSRF] readHead asks only the first bytes (a ranged GET) and returns them', async () => {
    const seen = stubFetch(() => new Response(new Uint8Array([0x52, 0x49, 0x46, 0x46]), { status: 206 }))
    const bytes = await readHead(KEY, 16)
    expect(seen[0].method).toBe('GET')
    expect(seen[0].headers.get('range')).toBe('bytes=0-15')
    expect([...bytes]).toEqual([0x52, 0x49, 0x46, 0x46])
  })

  it('[SEC-R2-SSRF] readHead throws when the object cannot be read', async () => {
    stubFetch(() => new Response(null, { status: 404 }))
    await expect(readHead(KEY, 16)).rejects.toThrow()
  })

  it('[SEC-R2-SSRF] deleteObjects sends one DELETE per key to R2_ENDPOINT; a missing object is not a failure; any other failure throws', async () => {
    const seen = stubFetch(() => new Response(null, { status: 204 }))
    await deleteObjects([KEY, `${OWNER}/listings/${FOLDER}/thumb.webp`])
    expect(seen.map((r) => r.method)).toEqual(['DELETE', 'DELETE'])
    expect(seen.map((r) => new URL(r.url).pathname)).toEqual([`/${ENV.R2_BUCKET_NAME}/${KEY}`, `/${ENV.R2_BUCKET_NAME}/${OWNER}/listings/${FOLDER}/thumb.webp`])
    stubFetch(() => new Response(null, { status: 404 }))
    await expect(deleteObjects([KEY])).resolves.toBeUndefined()
    stubFetch(() => new Response(null, { status: 403 }))
    await expect(deleteObjects([KEY])).rejects.toThrow()
  })

  it('[SEC-R2-SSRF] deleteObjects with no key calls nothing', async () => {
    const seen = stubFetch(() => new Response(null, { status: 204 }))
    await deleteObjects([])
    expect(seen).toHaveLength(0)
  })

  it('[SEC-R2-SSRF] an error text never carries the secret key', async () => {
    stubFetch(() => new Response('denied', { status: 403 }))
    const error = await headObject(KEY).catch((e: unknown) => e)
    expect(String(error instanceof Error ? error.message : error)).not.toContain(ENV.R2_SECRET_ACCESS_KEY)
  })
})

describe('publicUrl and keyFromPublicUrl', () => {
  it('publicUrl joins R2_PUBLIC_URL and the key', () => {
    expect(publicUrl(KEY)).toBe(`https://media.lero.al/${KEY}`)
    process.env.R2_PUBLIC_URL = 'https://media.lero.al/'
    expect(publicUrl(KEY)).toBe(`https://media.lero.al/${KEY}`)
  })

  it('[SEC-R2-SSRF] keyFromPublicUrl gives the key of an address on R2_PUBLIC_URL', () => {
    expect(keyFromPublicUrl(`https://media.lero.al/${KEY}`)).toBe(KEY)
  })

  it.each([
    ['another host', `https://evil.example/${KEY}`],
    ['a host that only starts like it', `https://media.lero.al.evil.example/${KEY}`],
    ['user-info', `https://media.lero.al@evil.example/${KEY}`],
    ['credentials', `https://user:pw@media.lero.al/${KEY}`],
    ['a port', `https://media.lero.al:8443/${KEY}`],
    ['plain http', `http://media.lero.al/${KEY}`],
    ['a query', `https://media.lero.al/${KEY}?x=1`],
    ['an empty query', `https://media.lero.al/${KEY}?`],
    ['a fragment', `https://media.lero.al/${KEY}#x`],
    ['a .. segment', `https://media.lero.al/${OWNER}/listings/../x/full.webp`],
    ['a . segment', `https://media.lero.al/${OWNER}/./listings/x/full.webp`],
    ['an encoded dot', `https://media.lero.al/${OWNER}/listings/%2e%2e/full.webp`],
    ['an encoded slash', `https://media.lero.al/${OWNER}%2flistings/x/full.webp`],
    ['an encoded backslash', `https://media.lero.al/${OWNER}%5clistings/full.webp`],
    ['a backslash', `https://media.lero.al/${OWNER}\\listings\\full.webp`],
    ['an empty segment', `https://media.lero.al/${OWNER}//listings/full.webp`],
    ['no key', 'https://media.lero.al/'],
    ['no key and no slash', 'https://media.lero.al'],
    ['a data address', 'data:image/svg+xml;base64,PHN2Zz4='],
    ['a javascript address', 'javascript:alert(1)'],
    ['a relative path', `/${KEY}`],
    ['text that is not an address', 'not a url'],
  ])('[SEC-R2-SSRF] keyFromPublicUrl refuses %s', (_label, url) => {
    expect(keyFromPublicUrl(url)).toBeNull()
  })

  it.each([[null], [undefined], [5], [{}], [['x']]])('[SEC-R2-SSRF] keyFromPublicUrl refuses the non-string %j', (value) => {
    expect(keyFromPublicUrl(value as never)).toBeNull()
  })

  it('[SEC-R2-SSRF] without R2_PUBLIC_URL no address is accepted', () => {
    delete process.env.R2_PUBLIC_URL
    expect(keyFromPublicUrl(`https://media.lero.al/${KEY}`)).toBeNull()
  })
})

describe('the mail bucket (Task 1046)', () => {
  const MAIL_KEY = 'inbound/0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2b.eml'
  const MAIL_VARIABLES = ['R2_MAIL_ACCESS_KEY_ID', 'R2_MAIL_SECRET_ACCESS_KEY', 'R2_MAIL_BUCKET_NAME'] as const
  const LISTING_VARIABLES = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const

  function stubFetch(handler: (request: Request) => Response | Promise<Response>) {
    const seen: Request[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: Request) => { seen.push(input); return handler(input) }))
    return seen
  }

  /** a body of `chunks` chunks of `size` bytes that counts what was pulled from it and whether it was cancelled */
  function countedBody(chunks: number, size: number) {
    const state = { pulled: 0, cancelled: false }
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (state.pulled >= chunks) { controller.close(); return }
        state.pulled += 1
        controller.enqueue(new Uint8Array(size))
      },
      cancel() { state.cancelled = true },
    }, { highWaterMark: 0 })
    return { body, state }
  }

  it('[SEC-1046-R2-MAIL] getMailObject GETs the key from R2_MAIL_BUCKET_NAME on R2_ENDPOINT with the mail key id and returns the bytes', async () => {
    const seen = stubFetch(() => new Response(new TextEncoder().encode('RAW-MIME'), { status: 200 }))
    const bytes = await getMailObject(MAIL_KEY, 100)
    expect(new TextDecoder().decode(bytes as Uint8Array)).toBe('RAW-MIME')
    expect(seen).toHaveLength(1)
    expect(seen[0].method).toBe('GET')
    expect(new URL(seen[0].url).origin).toBe(ENV.R2_ENDPOINT)
    expect(new URL(seen[0].url).pathname).toBe(`/${ENV.R2_MAIL_BUCKET_NAME}/${MAIL_KEY}`)
    expect(seen[0].headers.get('authorization')).toContain(`Credential=${ENV.R2_MAIL_ACCESS_KEY_ID}/`)
    expect(seen[0].headers.get('authorization')).not.toContain(ENV.R2_ACCESS_KEY_ID)
  })

  it('[SEC-1046-R2-MAIL] the mail signature comes from R2_MAIL_SECRET_ACCESS_KEY and never from the listing secret', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T10:00:00Z'))
    const seen = stubFetch(() => new Response(new Uint8Array(1), { status: 200 }))
    await getMailObject(MAIL_KEY, 100)
    process.env.R2_SECRET_ACCESS_KEY = 'another-listing-secret'
    await getMailObject(MAIL_KEY, 100)
    process.env.R2_MAIL_SECRET_ACCESS_KEY = 'another-mail-secret'
    await getMailObject(MAIL_KEY, 100)
    const [a, b, c] = seen.map((r) => r.headers.get('authorization'))
    expect(b).toBe(a)
    expect(c).not.toBe(a)
  })

  it('[SEC-1046-R2-MAIL] the mail functions work without the listing variables', async () => {
    for (const name of LISTING_VARIABLES) delete process.env[name]
    const seen = stubFetch(() => new Response(new Uint8Array(1), { status: 200 }))
    await expect(getMailObject(MAIL_KEY, 100)).resolves.toHaveLength(1)
    await expect(deleteMailObjects([MAIL_KEY])).resolves.toBeUndefined()
    expect(seen).toHaveLength(2)
  })

  it('[SEC-1046-R2-MAIL] the listing functions never use a mail variable: without the listing variables they throw and call nothing', async () => {
    for (const name of LISTING_VARIABLES) delete process.env[name]
    const seen = stubFetch(() => new Response(null, { status: 200 }))
    await expect(presignPut(KEY, 'image/webp', 1234)).rejects.toBeInstanceOf(R2ConfigError)
    await expect(headObject(KEY)).rejects.toBeInstanceOf(R2ConfigError)
    await expect(readHead(KEY, 16)).rejects.toBeInstanceOf(R2ConfigError)
    await expect(deleteObjects([KEY])).rejects.toBeInstanceOf(R2ConfigError)
    expect(seen).toHaveLength(0)
  })

  it('[SEC-1046-R2-MAIL] the listing functions keep the listing key id and bucket while the mail variables are set', async () => {
    const seen = stubFetch(() => new Response(null, { status: 204 }))
    await deleteObjects([KEY])
    expect(new URL(seen[0].url).pathname).toBe(`/${ENV.R2_BUCKET_NAME}/${KEY}`)
    expect(seen[0].headers.get('authorization')).toContain(`Credential=${ENV.R2_ACCESS_KEY_ID}/`)
  })

  it.each([...MAIL_VARIABLES, 'R2_ENDPOINT'])('[SEC-1046-R2-MAIL] without %s the mail functions throw R2ConfigError before any call', async (name) => {
    delete process.env[name]
    const seen = stubFetch(() => new Response(null, { status: 200 }))
    await expect(getMailObject(MAIL_KEY, 100)).rejects.toBeInstanceOf(R2ConfigError)
    await expect(deleteMailObjects([MAIL_KEY])).rejects.toBeInstanceOf(R2ConfigError)
    expect(seen).toHaveLength(0)
  })

  it('[SEC-1046-R2-MAIL] getMailObject answers null for a missing object and throws for any other failure', async () => {
    stubFetch(() => new Response(null, { status: 404 }))
    await expect(getMailObject(MAIL_KEY, 100)).resolves.toBeNull()
    stubFetch(() => new Response(null, { status: 403 }))
    await expect(getMailObject(MAIL_KEY, 100)).rejects.toThrow()
  })

  it('[SEC-1046-R2-MAIL] a declared length above the limit throws R2TooLargeError without reading the body', async () => {
    const { body, state } = countedBody(10, 64)
    stubFetch(() => new Response(body, { status: 200, headers: { 'content-length': '101' } }))
    await expect(getMailObject(MAIL_KEY, 100)).rejects.toBeInstanceOf(R2TooLargeError)
    expect(state.pulled).toBe(0)
    expect(state.cancelled).toBe(true)
  })

  it('[SEC-1046-R2-MAIL] a real length above the limit throws R2TooLargeError and stops reading; exactly the limit is returned', async () => {
    const over = countedBody(1000, 64)
    stubFetch(() => new Response(over.body, { status: 200 }))
    await expect(getMailObject(MAIL_KEY, 100)).rejects.toBeInstanceOf(R2TooLargeError)
    expect(over.state.pulled).toBeLessThanOrEqual(3)
    expect(over.state.cancelled).toBe(true)
    const edge = countedBody(2, 50)
    stubFetch(() => new Response(edge.body, { status: 200 }))
    await expect(getMailObject(MAIL_KEY, 100)).resolves.toHaveLength(100)
  })

  it('[SEC-1046-R2-MAIL] deleteMailObjects sends one DELETE per key to the mail bucket with the mail key id; a missing object is not a failure; any other failure throws', async () => {
    const seen = stubFetch(() => new Response(null, { status: 204 }))
    await deleteMailObjects([MAIL_KEY])
    expect(seen.map((r) => r.method)).toEqual(['DELETE'])
    expect(new URL(seen[0].url).origin).toBe(ENV.R2_ENDPOINT)
    expect(new URL(seen[0].url).pathname).toBe(`/${ENV.R2_MAIL_BUCKET_NAME}/${MAIL_KEY}`)
    expect(seen[0].headers.get('authorization')).toContain(`Credential=${ENV.R2_MAIL_ACCESS_KEY_ID}/`)
    stubFetch(() => new Response(null, { status: 404 }))
    await expect(deleteMailObjects([MAIL_KEY])).resolves.toBeUndefined()
    stubFetch(() => new Response(null, { status: 403 }))
    await expect(deleteMailObjects([MAIL_KEY])).rejects.toThrow()
  })

  it.each([['a .. segment', 'inbound/../x.eml'], ['a leading slash', `/${MAIL_KEY}`], ['an empty key', '']])('[SEC-1046-R2-MAIL] the mail functions refuse a key with %s and call nothing', async (_l, key) => {
    const seen = stubFetch(() => new Response(null, { status: 200 }))
    await expect(getMailObject(key, 100)).rejects.toThrow()
    await expect(deleteMailObjects([key])).rejects.toThrow()
    expect(seen).toHaveLength(0)
  })
})
