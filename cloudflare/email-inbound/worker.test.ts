// @vitest-environment node
/**
 * Task 1044 AC8, Task 1046 AC1: the Cloudflare Email Worker hands every received message to the route through the private mail bucket and lets the sender know when it could not.
 *  - above 26 214 400 bytes the message is rejected ("Message too large") and nothing is written or posted;
 *  - otherwise the raw message is piped, never buffered, through a FixedLengthStream of exactly `rawSize` into INBOUND_BUCKET under `inbound/<uuid>.eml`, and only `{ key }` is
 *    POSTed once to INBOUND_URL with the bearer secret, `application/json` and both envelope addresses;
 *  - a failed put, a thrown fetch and every non-2xx answer delete the key (a failed delete is ignored) and reject the message with the temporary-failure text;
 *  - nothing but the status is logged (no address, secret, key or content).
 * The Workers runtime is doubled: `FixedLengthStream` (a TransformStream that errors when the byte count differs from its length, as Cloudflare's does) and the R2 binding.
 * Every value is synthetic.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import worker from './worker.js'

const MAX = 26_214_400
const BASE_ENV = { INBOUND_URL: 'https://lero.example/api/email/inbound', INBOUND_EMAIL_SECRET: 'S'.repeat(48) }
const TOO_LARGE = 'Message too large: the limit is 25 MB'
const TEMPORARY = 'Temporary failure: please send the message again later'
const KEY = /^inbound\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.eml$/

function message(bytes: Uint8Array<ArrayBuffer>, rawSize = bytes.byteLength) {
  return {
    from: 'ana@example.com',
    to: 'support@lero.al',
    rawSize,
    raw: new Response(bytes).body as ReadableStream<Uint8Array>,
    setReject: vi.fn(),
  }
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  for (let r = await reader.read(); !r.done; r = await reader.read()) chunks.push(r.value)
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0))
  let at = 0
  for (const c of chunks) { out.set(c, at); at += c.byteLength }
  return out
}

const streams: { length: number; readable: ReadableStream<Uint8Array> }[] = []
class FakeFixedLengthStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(length: number) {
    let seen = 0
    super({
      transform(chunk, controller) { seen += chunk.byteLength; controller.enqueue(chunk) },
      flush(controller) { if (seen !== length) controller.error(new Error('length mismatch')) },
    })
    streams.push({ length, readable: this.readable })
  }
}

function bucket() {
  const stored = new Map<string, Uint8Array>()
  return {
    stored,
    put: vi.fn(async (key: string, value: ReadableStream<Uint8Array>) => { stored.set(key, await readAll(value)); return {} }),
    delete: vi.fn(async (key: string) => { stored.delete(key) }),
  }
}

let fetchMock: ReturnType<typeof vi.fn>
let logged: unknown[][]
let bucketMock: ReturnType<typeof bucket>
let env: typeof BASE_ENV & { INBOUND_BUCKET: ReturnType<typeof bucket> }
let arrayBufferSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.restoreAllMocks()
  streams.length = 0
  vi.stubGlobal('FixedLengthStream', FakeFixedLengthStream)
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  bucketMock = bucket()
  env = { ...BASE_ENV, INBOUND_BUCKET: bucketMock }
  arrayBufferSpy = vi.spyOn(Response.prototype, 'arrayBuffer')
  logged = []
  for (const level of ['log', 'info', 'warn', 'error'] as const) vi.spyOn(console, level).mockImplementation((...a: unknown[]) => { logged.push(a) })
})

describe('the inbound Email Worker', () => {
  it('pipes the message into the mail bucket under inbound/<uuid>.eml and posts only { key } with the bearer, JSON and both envelope addresses', async () => {
    const bytes = new TextEncoder().encode('From: ana@example.com\r\nSubject: MARKER-SUBJECT\r\n\r\nMARKER-BODY')
    const m = message(bytes)
    await worker.email(m, env)

    expect(bucketMock.put).toHaveBeenCalledTimes(1)
    const [key, value] = bucketMock.put.mock.calls[0] as [string, ReadableStream<Uint8Array>]
    expect(key).toMatch(KEY)
    expect(streams).toHaveLength(1)
    expect(streams[0].length).toBe(bytes.byteLength)
    expect(value).toBe(streams[0].readable)
    expect(bucketMock.stored.get(key)).toEqual(bytes)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(BASE_ENV.INBOUND_URL)
    expect(init.method).toBe('POST')
    expect(init.redirect).toBe('manual')
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe(`Bearer ${BASE_ENV.INBOUND_EMAIL_SECRET}`)
    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('x-envelope-from')).toBe('ana@example.com')
    expect(headers.get('x-envelope-to')).toBe('support@lero.al')
    expect(JSON.parse(init.body as string)).toEqual({ key })
    expect(m.setReject).not.toHaveBeenCalled()
    expect(bucketMock.delete).not.toHaveBeenCalled()
  })

  it('[SEC-1046-WORKER-STREAM] never buffers the message: no arrayBuffer call, the bucket receives the FixedLengthStream itself', async () => {
    const m = message(new TextEncoder().encode('MARKER-BODY'))
    await worker.email(m, env)
    expect(arrayBufferSpy).not.toHaveBeenCalled()
    expect(readFileSync(join(__dirname, 'worker.js'), 'utf8')).not.toMatch(/arrayBuffer/)
    expect(bucketMock.put.mock.calls[0][1]).toBe(streams[0].readable)
  })

  it('each message gets its own key', async () => {
    await worker.email(message(new Uint8Array([1])), env)
    await worker.email(message(new Uint8Array([2])), env)
    const keys = bucketMock.put.mock.calls.map((c) => c[0])
    expect(keys[0]).not.toBe(keys[1])
  })

  it('[SEC-1044-WORKER-SIZE] rejects a message above 25 MB and writes or posts nothing; exactly 25 MB is stored and posted', async () => {
    const big = message(new Uint8Array(8), MAX + 1)
    await worker.email(big, env)
    expect(big.setReject).toHaveBeenCalledWith(TOO_LARGE)
    expect(bucketMock.put).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    const edge = message(new Uint8Array(MAX))
    await worker.email(edge, env)
    expect(edge.setReject).not.toHaveBeenCalled()
    expect(bucketMock.put).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('[SEC-1046-WORKER-CLEAN] a failed put deletes the key, posts nothing and rejects with the temporary failure', async () => {
    bucketMock.put.mockRejectedValueOnce(new Error('r2 down'))
    const m = message(new Uint8Array([1, 2, 3]))
    await worker.email(m, env)
    const key = bucketMock.put.mock.calls[0][0]
    expect(bucketMock.delete).toHaveBeenCalledWith(key)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(m.setReject).toHaveBeenCalledWith(TEMPORARY)
  })

  it('[SEC-1044-WORKER-FAIL] [SEC-1046-WORKER-CLEAN] a thrown fetch deletes the key and rejects the message with the temporary failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const m = message(new Uint8Array([1, 2, 3]))
    await worker.email(m, env)
    expect(bucketMock.delete).toHaveBeenCalledWith(bucketMock.put.mock.calls[0][0])
    expect(m.setReject).toHaveBeenCalledWith(TEMPORARY)
  })

  it.each([[401], [413], [422], [500], [503], [302]])('[SEC-1044-WORKER-FAIL] [SEC-1046-WORKER-CLEAN] an answer %i deletes the key and rejects the message with the temporary failure', async (status) => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status }))
    const m = message(new Uint8Array([1, 2, 3]))
    await worker.email(m, env)
    expect(bucketMock.delete).toHaveBeenCalledWith(bucketMock.put.mock.calls[0][0])
    expect(m.setReject).toHaveBeenCalledWith(TEMPORARY)
  })

  it('a failed delete is ignored: the message is still rejected with the temporary failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    bucketMock.delete.mockRejectedValueOnce(new Error('r2 down'))
    const m = message(new Uint8Array([1, 2, 3]))
    await expect(worker.email(m, env)).resolves.toBeUndefined()
    expect(m.setReject).toHaveBeenCalledWith(TEMPORARY)
  })

  it('logs the status only: no address, secret, key or content', async () => {
    await worker.email(message(new TextEncoder().encode('Subject: MARKER-SUBJECT\r\n\r\nMARKER-BODY')), env)
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    await worker.email(message(new TextEncoder().encode('MARKER-BODY')), env)
    fetchMock.mockRejectedValueOnce(new Error('MARKER-ERROR ana@example.com'))
    await worker.email(message(new TextEncoder().encode('MARKER-BODY')), env)
    bucketMock.put.mockRejectedValueOnce(new Error('MARKER-PUT'))
    await worker.email(message(new TextEncoder().encode('MARKER-BODY')), env)
    const text = JSON.stringify(logged)
    const keys = bucketMock.put.mock.calls.map((c) => c[0] as string)
    for (const secret of ['ana@example.com', 'support@lero.al', BASE_ENV.INBOUND_EMAIL_SECRET, 'MARKER-SUBJECT', 'MARKER-BODY', 'MARKER-ERROR', 'MARKER-PUT', BASE_ENV.INBOUND_URL, 'inbound/', ...keys]) expect(text).not.toContain(secret)
  })
})
