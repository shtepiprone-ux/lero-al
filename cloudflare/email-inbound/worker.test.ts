// @vitest-environment node
/**
 * Task 1044 AC8: the Cloudflare Email Worker hands every received message to the route and lets the sender know when it could not.
 *  - above 4 194 304 bytes the message is rejected ("Message too large") and nothing is posted;
 *  - otherwise the raw bytes are POSTed once to INBOUND_URL with the bearer secret, `message/rfc822` and both envelope addresses;
 *  - a thrown fetch and every non-2xx answer reject the message with the temporary-failure text, so the sending server tells the sender;
 *  - nothing but the status is logged (no address, secret or content).
 * Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import worker from './worker.js'

const MAX = 4_194_304
const ENV = { INBOUND_URL: 'https://lero.example/api/email/inbound', INBOUND_EMAIL_SECRET: 'MARKER-SECRET-0123456789abcdef0123456789' }
const TOO_LARGE = 'Message too large: the limit is 4 MB'
const TEMPORARY = 'Temporary failure: please send the message again later'

function message(bytes: Uint8Array<ArrayBuffer>, rawSize = bytes.byteLength) {
  return {
    from: 'ana@example.com',
    to: 'support@lero.al',
    rawSize,
    raw: new Response(bytes).body as ReadableStream<Uint8Array>,
    setReject: vi.fn(),
  }
}

let fetchMock: ReturnType<typeof vi.fn>
let logged: unknown[][]

beforeEach(() => {
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  logged = []
  for (const level of ['log', 'info', 'warn', 'error'] as const) vi.spyOn(console, level).mockImplementation((...a: unknown[]) => { logged.push(a) })
})

describe('the inbound Email Worker', () => {
  it('posts the raw bytes once with the bearer, the type and both envelope addresses', async () => {
    const bytes = new TextEncoder().encode('From: ana@example.com\r\nSubject: MARKER-SUBJECT\r\n\r\nMARKER-BODY')
    const m = message(bytes)
    await worker.email(m, ENV)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(ENV.INBOUND_URL)
    expect(init.method).toBe('POST')
    const headers = new Headers(init.headers)
    expect(headers.get('authorization')).toBe(`Bearer ${ENV.INBOUND_EMAIL_SECRET}`)
    expect(headers.get('content-type')).toBe('message/rfc822')
    expect(headers.get('x-envelope-from')).toBe('ana@example.com')
    expect(headers.get('x-envelope-to')).toBe('support@lero.al')
    expect(new Uint8Array(init.body as ArrayBuffer)).toEqual(bytes)
    expect(m.setReject).not.toHaveBeenCalled()
  })

  it('[SEC-1044-WORKER-SIZE] rejects a message above 4 MB and posts nothing; exactly 4 MB is posted', async () => {
    const big = message(new Uint8Array(8), MAX + 1)
    await worker.email(big, ENV)
    expect(big.setReject).toHaveBeenCalledWith(TOO_LARGE)
    expect(fetchMock).not.toHaveBeenCalled()
    const edge = message(new Uint8Array(8), MAX)
    await worker.email(edge, ENV)
    expect(edge.setReject).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('[SEC-1044-WORKER-FAIL] a thrown fetch rejects the message with the temporary failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const m = message(new Uint8Array([1, 2, 3]))
    await worker.email(m, ENV)
    expect(m.setReject).toHaveBeenCalledWith(TEMPORARY)
  })

  it.each([[401], [413], [422], [500], [503], [302]])('[SEC-1044-WORKER-FAIL] an answer %i rejects the message with the temporary failure', async (status) => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status }))
    const m = message(new Uint8Array([1, 2, 3]))
    await worker.email(m, ENV)
    expect(m.setReject).toHaveBeenCalledWith(TEMPORARY)
  })

  it('logs the status only: no address, secret or content', async () => {
    await worker.email(message(new TextEncoder().encode('Subject: MARKER-SUBJECT\r\n\r\nMARKER-BODY')), ENV)
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }))
    await worker.email(message(new TextEncoder().encode('MARKER-BODY')), ENV)
    fetchMock.mockRejectedValueOnce(new Error('MARKER-ERROR ana@example.com'))
    await worker.email(message(new TextEncoder().encode('MARKER-BODY')), ENV)
    const text = JSON.stringify(logged)
    for (const secret of ['ana@example.com', 'support@lero.al', 'MARKER-SECRET', 'MARKER-SUBJECT', 'MARKER-BODY', 'MARKER-ERROR', ENV.INBOUND_URL]) expect(text).not.toContain(secret)
  })
})
