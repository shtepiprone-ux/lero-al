// @vitest-environment node
/**
 * Security (Task 1044 AC1, Task 1046 AC2): POST /api/email/inbound is reached by anyone, and only the Cloudflare Email Worker knows the secret. The Worker stores the raw message
 * in the private mail bucket and posts its key; the route reads the message from that bucket, processes it and deletes it.
 *  - SEC-1044-INBOUND-DENY: no bearer, a wrong one and a too-short one answer 401; nothing is read, parsed or written. The right bearer is processed (the control).
 *  - no INBOUND_EMAIL_SECRET configured answers 503 and reads nothing (fail closed);
 *  - a body above 1 024 bytes answers 413, by its Content-Length and by its real length;
 *  - a recipient other than support@ or sales@ of the domain of CONTACT_SUPPORT_EMAIL or a subdomain of it answers 422;
 *  - SEC-1046-KEY-DENY: only a body `{ "key": "inbound/<uuid v4>.eml" }` reaches the mail bucket; any other key or shape answers 422 and calls nothing;
 *  - SEC-1046-RAW: an object above 26 214 400 bytes answers 413 and is deleted, a missing one 422, a failed read 500; the object's bytes reach processInboundEmail, and the
 *    object is deleted after every answer of it; a failed delete is logged as its outcome code only;
 *  - the answer of processInboundEmail is passed on: 200 only for a stored or deliberately dropped message, a failed write is 500, a thrown error is 500.
 * Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { processSpy, getSpy, deleteSpy, TooLarge } = vi.hoisted(() => {
  class TooLarge extends Error {
    constructor() { super('R2 object too large'); this.name = 'R2TooLargeError' }
  }
  return { processSpy: vi.fn(), getSpy: vi.fn(), deleteSpy: vi.fn(), TooLarge }
})
vi.mock('@/modules/contacts/lib/inboundEmail', () => ({ processInboundEmail: (...a: unknown[]) => processSpy(...a) }))
vi.mock('@/lib/media/r2', () => ({
  R2TooLargeError: TooLarge,
  getMailObject: (...a: unknown[]) => getSpy(...a),
  deleteMailObjects: (...a: unknown[]) => deleteSpy(...a),
}))

import { POST } from '../route'

const SECRET = 'S'.repeat(48)
const ENV = { ...process.env }
const MAX_MESSAGE = 26_214_400
const MAX_BODY = 1024
const KEY = 'inbound/0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2b.eml'

function request(o: { auth?: string | null; to?: string | null; from?: string; body?: Uint8Array<ArrayBuffer> | string; length?: string } = {}): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (o.auth !== null) headers.set('authorization', o.auth ?? `Bearer ${SECRET}`)
  if (o.to !== null) headers.set('x-envelope-to', o.to ?? 'support@lero.al')
  headers.set('x-envelope-from', o.from ?? 'ana@example.com')
  if (o.length) headers.set('content-length', o.length)
  return new Request('https://lero.al/api/email/inbound', { method: 'POST', headers, body: o.body ?? JSON.stringify({ key: KEY }) })
}

let errors: unknown[][]
beforeEach(() => {
  process.env = { ...ENV, INBOUND_EMAIL_SECRET: SECRET, CONTACT_SUPPORT_EMAIL: 'support@lero.al', CONTACT_SALES_EMAIL: 'sales@lero.al' }
  processSpy.mockReset()
  processSpy.mockResolvedValue({ status: 200, outcome: 'stored' })
  getSpy.mockReset()
  getSpy.mockResolvedValue(new TextEncoder().encode('From: a@example.com\r\n\r\nhi'))
  deleteSpy.mockReset()
  deleteSpy.mockResolvedValue(undefined)
  errors = []
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { errors.push(a) })
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('AC1 the route', () => {
  it('[SEC-1044-INBOUND-DENY] no, a wrong and a too-short bearer answer 401 and nothing is read or processed; the right bearer is processed', async () => {
    for (const auth of [null, '', 'Bearer', `Bearer ${'X'.repeat(48)}`, `Bearer ${SECRET.slice(0, 47)}`, `Bearer ${SECRET}x`, SECRET, `bearer ${SECRET}`, `Basic ${SECRET}`]) {
      const req = request({ auth })
      const res = await POST(req)
      expect(res.status, String(auth)).toBe(401)
      expect(req.bodyUsed, String(auth)).toBe(false)
    }
    expect(processSpy).not.toHaveBeenCalled()
    expect(getSpy).not.toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalled()

    getSpy.mockResolvedValueOnce(new TextEncoder().encode('RAW-MIME'))
    const res = await POST(request({ from: 'Ana@Example.com', to: 'Support@Lero.al' }))
    expect(res.status).toBe(200)
    expect(processSpy).toHaveBeenCalledTimes(1)
    const [raw, envelope] = processSpy.mock.calls[0] as [ArrayBuffer | Uint8Array, { from: string; to: string }]
    expect(new TextDecoder().decode(raw)).toBe('RAW-MIME')
    expect(envelope).toEqual({ from: 'ana@example.com', to: 'support@lero.al' })
  })

  it('without INBOUND_EMAIL_SECRET every call answers 503 and nothing is read', async () => {
    for (const value of [undefined, '']) {
      if (value === undefined) delete process.env.INBOUND_EMAIL_SECRET
      else process.env.INBOUND_EMAIL_SECRET = value
      const req = request({ auth: 'Bearer ' })
      expect((await POST(req)).status).toBe(503)
      expect(req.bodyUsed).toBe(false)
      expect((await POST(request())).status).toBe(503)
    }
    expect(processSpy).not.toHaveBeenCalled()
    expect(getSpy).not.toHaveBeenCalled()
  })

  it('a body above 1 024 bytes answers 413, by its declared length and by its real length; exactly 1 024 bytes is accepted', async () => {
    const declared = request({ length: String(MAX_BODY + 1) })
    expect((await POST(declared)).status).toBe(413)
    expect(declared.bodyUsed).toBe(false)
    const padded = (n: number) => JSON.stringify({ key: KEY }).padEnd(n, ' ')
    expect((await POST(request({ body: padded(MAX_BODY + 1) }))).status).toBe(413)
    expect(getSpy).not.toHaveBeenCalled()
    expect(processSpy).not.toHaveBeenCalled()
    expect((await POST(request({ body: padded(MAX_BODY) }))).status).toBe(200)
  })

  it.each([
    ['another local part', 'info@lero.al'],
    ['another domain', 'support@example.com'],
    ['a look-alike domain', 'support@notlero.al'],
    ['our domain as a prefix', 'support@lero.al.evil.example'],
    ['a local part that only starts with support', 'supportx@lero.al'],
    ['two addresses', 'support@lero.al, sales@lero.al'],
    ['no recipient', null],
    ['an empty recipient', ''],
  ])('[SEC-1044-RECIPIENT] %s answers 422 and nothing is processed', async (_l, to) => {
    const req = request({ to })
    expect((await POST(req)).status).toBe(422)
    expect(req.bodyUsed).toBe(false)
    expect(processSpy).not.toHaveBeenCalled()
    expect(getSpy).not.toHaveBeenCalled()
  })

  it.each([['support@lero.al'], ['sales@lero.al'], ['support+abc@lero.al'], ['sales@mailtest.lero.al'], ['SALES@LERO.AL']])('%s is accepted', async (to) => {
    expect((await POST(request({ to }))).status).toBe(200)
  })

  it('without CONTACT_SUPPORT_EMAIL no recipient is ours: 422', async () => {
    delete process.env.CONTACT_SUPPORT_EMAIL
    expect((await POST(request())).status).toBe(422)
    expect(processSpy).not.toHaveBeenCalled()
  })

  it('[SEC-1044-ROUTE-WRITE] the outcome is passed on: dropped is 200, a failed write is 500, an invalid sender 422, a thrown error 500', async () => {
    processSpy.mockResolvedValueOnce({ status: 200, outcome: 'dropped_auto' })
    expect((await POST(request())).status).toBe(200)
    processSpy.mockResolvedValueOnce({ status: 500, outcome: 'write_failed' })
    expect((await POST(request())).status).toBe(500)
    processSpy.mockResolvedValueOnce({ status: 422, outcome: 'invalid_sender' })
    expect((await POST(request())).status).toBe(422)
    processSpy.mockRejectedValueOnce(new Error('MARKER-THROWN'))
    const res = await POST(request())
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('MARKER-THROWN')
  })
})

describe('AC2 the key and the raw message in the mail bucket', () => {
  const UUID = '0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2b'
  it.each([
    ['a .. segment', { key: `inbound/../${UUID}.eml` }],
    ['a .. after the key', { key: `${KEY}/../x.eml` }],
    ['another prefix', { key: `outbound/${UUID}.eml` }],
    ['no prefix', { key: `${UUID}.eml` }],
    ['a leading slash', { key: `/${KEY}` }],
    ['a listing key', { key: '22222222-2222-4222-8222-222222222222/listings/44444444-4444-4444-8444-444444444444/full.webp' }],
    ['a non-v4 id', { key: 'inbound/0f8e4c1a-2b3d-1e5f-9a6b-7c8d9e0f1a2b.eml' }],
    ['a wrong variant', { key: 'inbound/0f8e4c1a-2b3d-4e5f-ca6b-7c8d9e0f1a2b.eml' }],
    ['upper-case hex', { key: 'inbound/0F8E4C1A-2B3D-4E5F-9A6B-7C8D9E0F1A2B.eml' }],
    ['another extension', { key: `inbound/${UUID}.txt` }],
    ['a trailing newline', { key: `${KEY}\n` }],
    ['a query', { key: `${KEY}?x=1` }],
    ['an empty key', { key: '' }],
    ['a number', { key: 5 }],
    ['an array', { key: [KEY] }],
    ['null', { key: null }],
    ['no key', {}],
    ['a second field', { key: KEY, bucket: 'lero-listing' }],
    ['an array body', [KEY]],
    ['a string body', KEY],
    ['a null body', null],
  ])('[SEC-1046-KEY-DENY] %s answers 422 key and calls nothing', async (_l, body) => {
    const res = await POST(request({ body: JSON.stringify(body) }))
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'key' })
    expect(getSpy).not.toHaveBeenCalled()
    expect(deleteSpy).not.toHaveBeenCalled()
    expect(processSpy).not.toHaveBeenCalled()
  })

  it.each([['text that is not JSON', 'not json'], ['an empty body', ''], ['an inherited key', '{"__proto__":{"key":"inbound/0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2b.eml"}}']])(
    '[SEC-1046-KEY-DENY] %s answers 422 key and calls nothing',
    async (_l, body) => {
      const res = await POST(request({ body }))
      expect(res.status).toBe(422)
      expect(getSpy).not.toHaveBeenCalled()
      expect(processSpy).not.toHaveBeenCalled()
    },
  )

  it('[SEC-1046-KEY-DENY] the Worker\'s own key shape is read from the mail bucket with the 25 MB limit', async () => {
    const key = `inbound/${crypto.randomUUID()}.eml`
    expect((await POST(request({ body: JSON.stringify({ key }) }))).status).toBe(200)
    expect(getSpy).toHaveBeenCalledWith(key, MAX_MESSAGE)
  })

  it('[SEC-1046-RAW] the object\'s bytes reach processInboundEmail and the object is deleted after a 200', async () => {
    const bytes = new TextEncoder().encode('From: a@example.com\r\nSubject: MARKER\r\n\r\nhi')
    getSpy.mockResolvedValueOnce(bytes)
    expect((await POST(request())).status).toBe(200)
    expect(processSpy.mock.calls[0][0]).toBe(bytes)
    expect(deleteSpy).toHaveBeenCalledWith([KEY])
    expect(deleteSpy.mock.invocationCallOrder[0]).toBeGreaterThan(processSpy.mock.invocationCallOrder[0])
  })

  it.each([
    ['a 500 answer', () => processSpy.mockResolvedValueOnce({ status: 500, outcome: 'write_failed' }), 500],
    ['a 422 answer', () => processSpy.mockResolvedValueOnce({ status: 422, outcome: 'invalid_sender' }), 422],
    ['a thrown error', () => processSpy.mockRejectedValueOnce(new Error('boom')), 500],
  ])('[SEC-1046-RAW] the object is deleted after %s', async (_l, arrange, status) => {
    arrange()
    expect((await POST(request())).status).toBe(status)
    expect(deleteSpy).toHaveBeenCalledWith([KEY])
  })

  it('[SEC-1046-RAW] an object above 26 214 400 bytes answers 413, is deleted and is never processed', async () => {
    getSpy.mockRejectedValueOnce(new TooLarge())
    expect((await POST(request())).status).toBe(413)
    expect(deleteSpy).toHaveBeenCalledWith([KEY])
    expect(processSpy).not.toHaveBeenCalled()
  })

  it('[SEC-1046-RAW] a missing object answers 422 missing and nothing is processed', async () => {
    getSpy.mockResolvedValueOnce(null)
    const res = await POST(request())
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'missing' })
    expect(processSpy).not.toHaveBeenCalled()
  })

  it('[SEC-1046-RAW] a failed read answers 500 without its text and nothing is processed', async () => {
    getSpy.mockRejectedValueOnce(new Error(`MARKER-READ ${KEY}`))
    const res = await POST(request())
    expect(res.status).toBe(500)
    expect(await res.text()).not.toContain('MARKER-READ')
    expect(processSpy).not.toHaveBeenCalled()
  })

  it('[SEC-1046-RAW] a failed delete keeps the answer and logs only its outcome code: no key, address or content', async () => {
    deleteSpy.mockRejectedValueOnce(new Error(`MARKER-DELETE ${KEY}`))
    expect((await POST(request())).status).toBe(200)
    expect(errors).toContainEqual(['[inbound-email]', { outcome: 'raw_delete_failed' }])
    const text = JSON.stringify(errors)
    for (const secret of [KEY, 'MARKER-DELETE', 'ana@example.com', 'support@lero.al', SECRET]) expect(text).not.toContain(secret)
  })
})
