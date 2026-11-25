// @vitest-environment node
/**
 * Security (Task 1044 AC1): POST /api/email/inbound is reached by anyone, and only the Cloudflare Email Worker knows the secret.
 *  - SEC-1044-INBOUND-DENY: no bearer, a wrong one and a too-short one answer 401; nothing is read, parsed or written. The right bearer is processed (the control).
 *  - no INBOUND_EMAIL_SECRET configured answers 503 and reads nothing (fail closed);
 *  - a body above 4 194 304 bytes answers 413, by its Content-Length and by its real length;
 *  - a recipient other than support@ or sales@ of the domain of CONTACT_SUPPORT_EMAIL or a subdomain of it answers 422;
 *  - the answer of processInboundEmail is passed on: 200 only for a stored or deliberately dropped message, a failed write is 500, a thrown error is 500.
 * Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const processSpy = vi.fn()
vi.mock('@/modules/contacts/lib/inboundEmail', () => ({ processInboundEmail: (...a: unknown[]) => processSpy(...a) }))

import { POST } from '../route'

const SECRET = 'S'.repeat(48)
const ENV = { ...process.env }
const MAX = 4_194_304

function request(o: { auth?: string | null; to?: string | null; from?: string; body?: Uint8Array<ArrayBuffer>; length?: string } = {}): Request {
  const headers = new Headers({ 'content-type': 'message/rfc822' })
  if (o.auth !== null) headers.set('authorization', o.auth ?? `Bearer ${SECRET}`)
  if (o.to !== null) headers.set('x-envelope-to', o.to ?? 'support@lero.al')
  headers.set('x-envelope-from', o.from ?? 'ana@example.com')
  if (o.length) headers.set('content-length', o.length)
  return new Request('https://lero.al/api/email/inbound', { method: 'POST', headers, body: o.body ?? new TextEncoder().encode('From: a@example.com\r\n\r\nhi') })
}

beforeEach(() => {
  process.env = { ...ENV, INBOUND_EMAIL_SECRET: SECRET, CONTACT_SUPPORT_EMAIL: 'support@lero.al', CONTACT_SALES_EMAIL: 'sales@lero.al' }
  processSpy.mockReset()
  processSpy.mockResolvedValue({ status: 200, outcome: 'stored' })
  vi.spyOn(console, 'error').mockImplementation(() => {})
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

    const res = await POST(request({ body: new TextEncoder().encode('RAW-MIME'), from: 'Ana@Example.com', to: 'Support@Lero.al' }))
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
  })

  it('a body above 4 MB answers 413, by its declared length and by its real length; exactly 4 MB is accepted', async () => {
    const declared = request({ length: String(MAX + 1) })
    expect((await POST(declared)).status).toBe(413)
    expect(declared.bodyUsed).toBe(false)
    expect((await POST(request({ body: new Uint8Array(MAX + 1) }))).status).toBe(413)
    expect(processSpy).not.toHaveBeenCalled()
    expect((await POST(request({ body: new Uint8Array(MAX) }))).status).toBe(200)
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
