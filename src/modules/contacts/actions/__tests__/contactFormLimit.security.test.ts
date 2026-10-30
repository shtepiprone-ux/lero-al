// @vitest-environment node
/**
 * Security (Task 923 R67 (b)): the contact-form limit never fails open.
 *  - SEC-X-SRV-CONTACT-LIMIT: the REAL submitContactInquiry runs against an in-memory database. Requests with no address at all (no `x-forwarded-for`, no `x-real-ip`)
 *    share one bucket with the same limit of five an hour, so the sixth is refused with no inquiry stored and no e-mail sent; a count that cannot be read refuses as well.
 * The controls: the fifth request of an unknown address passes, and addresses are separate buckets. Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let headerValues: Record<string, string> = {}
let countFails = false
const notified: Record<string, unknown>[] = []

const failingCount: unknown = new Proxy(function () {}, {
  get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ count: null, error: { message: 'MARKER-DB-MESSAGE', code: 'XX000' } }) : failingCount),
  apply: () => failingCount,
})

vi.mock('next/headers', () => ({ headers: async () => ({ get: (n: string) => headerValues[n.toLowerCase()] ?? null }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    ...db.client,
    from: (t: string) => {
      const chain = db.client.from(t) as Record<string, (...a: unknown[]) => unknown>
      if (countFails && t === 'contact_inquiries') {
        const select = chain.select.bind(chain)
        chain.select = (cols: unknown, opts?: unknown) => ((opts as { head?: boolean } | undefined)?.head ? failingCount : select(cols, opts))
      }
      return chain
    },
  }),
}))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: false, reason: 'unauthenticated' }) }))
vi.mock('@/modules/notifications/lib/emails/contactInquiry', () => ({
  sendContactInquiryNotification: async (o: Record<string, unknown>) => { notified.push(o); return { ok: true } },
  sendContactInquiryReply: async () => ({ ok: true }),
}))

import { submitContactInquiry } from '../index'

const valid = { topic: 'general', name: 'Ana Hoxha', email: 'ana@example.com', message: 'I would like to know more about advertising.' }
const ENV = { ...process.env }

beforeEach(() => {
  process.env = { ...ENV, CONTACT_SUPPORT_EMAIL: 'support@lero.al', CONTACT_SALES_EMAIL: 'sales@lero.al' }
  db = createFakeDb({ contact_inquiries: [] })
  headerValues = {}
  countFails = false
  notified.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('contactFormLimit', () => {
  it('[SEC-X-SRV-CONTACT-LIMIT] an unknown IP shares one bucket and a failed count refuses', async () => {
    // six requests with no address: five pass (the control), the sixth is refused and nothing is stored or sent for it
    for (let i = 0; i < 5; i++) expect(await submitContactInquiry(valid), `request ${i + 1}`).toEqual({})
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })
    expect(db.tables.contact_inquiries).toHaveLength(5)
    expect(notified).toHaveLength(5)
    expect(db.tables.contact_inquiries.every((r) => r.requester_ip === null)).toBe(true)

    // the window moves: rows older than an hour leave the bucket
    for (const r of db.tables.contact_inquiries) r.created_at = new Date(Date.now() - 61 * 60 * 1000).toISOString()
    expect(await submitContactInquiry(valid)).toEqual({})

    // a count that cannot be read refuses, for an unknown address and for a known one, and stores and sends nothing
    db = createFakeDb({ contact_inquiries: [] })
    notified.length = 0
    countFails = true
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })
    headerValues = { 'x-forwarded-for': '203.0.113.7' }
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })
    expect(db.tables.contact_inquiries).toEqual([])
    expect(notified).toEqual([])
  })

  it('addresses are separate buckets: a full bucket of unknown senders does not block a known address, and the reverse (the controls)', async () => {
    for (let i = 0; i < 5; i++) await submitContactInquiry(valid)
    headerValues = { 'x-forwarded-for': '203.0.113.7' }
    expect(await submitContactInquiry(valid)).toEqual({})
    for (let i = 0; i < 4; i++) await submitContactInquiry(valid)
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })
    headerValues = {}
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })      // the unknown bucket is still full
  })
})
