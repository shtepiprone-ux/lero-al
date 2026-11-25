// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the public contact form and the staff tools behind it.
 *  - the form is open to anybody, so every field is checked at runtime (the TypeScript types do not exist there), the address must be ONE plain address because it
 *    becomes the Reply-To of a message to our staff, and one IP gets 5 messages an hour;
 *  - the inquiry tools (status, reply) are for admin / moderator only, and a reply is e-mailed to the address the visitor gave, from the topic's mailbox.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let headerValues: Record<string, string> = {}
let notifyResult: { ok: true; id?: string } | { ok: false; reason: string } = { ok: true }
let replyResult: { ok: true; id?: string } | { ok: false; reason: string } = { ok: true }
const notified: Record<string, unknown>[] = []
const replied: Record<string, unknown>[] = []

vi.mock('next/headers', () => ({ headers: async () => ({ get: (n: string) => headerValues[n.toLowerCase()] ?? null }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/modules/notifications/lib/emails/contactInquiry', () => ({
  sendContactInquiryNotification: async (o: Record<string, unknown>) => { notified.push(o); return notifyResult },
  sendContactInquiryReply: async (o: Record<string, unknown>) => { replied.push(o); return replyResult },
}))
// Task 1044 AC11: the message id of a sent reply is read back from the provider
let sentMessageId: string | null = '<sent-1@eu-west-1.amazonses.com>'
const readIds: string[] = []
vi.mock('@/modules/notifications/lib/emails/send', () => ({ getSentMessageId: async (id: string) => { readIds.push(id); return sentMessageId } }))

import { sendInquiryReply, submitContactInquiry, updateInquiryStatus } from '../index'

const ENV = { ...process.env }
const valid = { topic: 'general', name: 'Ana Hoxha', email: 'Ana@Example.com', message: 'I would like to know more about advertising.' }

beforeEach(() => {
  process.env = { ...ENV, CONTACT_SUPPORT_EMAIL: 'support@lero.al', CONTACT_SALES_EMAIL: 'sales@lero.al' }
  db = createFakeDb({
    users: [{ id: 'adm', role: 'admin', status: 'active', name: 'Admin A' }, { id: 'mod', role: 'moderator', status: 'active', name: 'Mod M' }, { id: 'usr', role: 'user', status: 'active' }, { id: 'agt', role: 'agent', status: 'active' }],
    contact_inquiries: [{ id: 'q1', email: 'visitor@example.com', topic: 'sales', custom_subject: null, target_mailbox: 'sales@lero.al', status: 'new', reply_count: 0 }],
    contact_inquiry_replies: [],
    // a moderator reaches the inquiry tools only with the key (Task 923 R75)
    role_permissions: [{ role: 'moderator', permission_key: 'inquiries.manage', allowed: true }],
  })
  currentUser = null
  headerValues = { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }
  notifyResult = { ok: true }
  replyResult = { ok: true, id: 'resend-1' }
  sentMessageId = '<sent-1@eu-west-1.amazonses.com>'
  readIds.length = 0
  notified.length = 0
  replied.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('submitContactInquiry: input', () => {
  it('[SEC-1045-FORM-SAVED] stores a clean form row, answers {} and e-mails nobody (Task 1044 AC6, O1044-1)', async () => {
    expect(await submitContactInquiry(valid)).toEqual({})
    expect(db.tables.contact_inquiries.at(-1)).toMatchObject({ source: 'form', topic: 'general', name: 'Ana Hoxha', email: 'ana@example.com', target_mailbox: 'support@lero.al', requester_ip: '203.0.113.7', status: 'new' })
    expect(notified).toEqual([])
  })

  it.each([['sales', 'sales@lero.al'], ['partnership', 'sales@lero.al'], ['press', 'sales@lero.al'], ['support', 'support@lero.al'], ['other', 'support@lero.al']])('topic %s goes to %s', async (topic, mailbox) => {
    await submitContactInquiry({ ...valid, topic, customSubject: 'Subject' })
    expect(db.tables.contact_inquiries.at(-1)?.target_mailbox).toBe(mailbox)
  })

  it.each([[''], ['unknown'], ['GENERAL'], ['general '.repeat(2)], ['__proto__'], ['constructor']])('refuses the topic %j', async (topic) => {
    expect(await submitContactInquiry({ ...valid, topic })).toEqual({ error: 'validation' })
    expect(db.tables.contact_inquiries).toHaveLength(1)
  })

  it.each([
    ['a number as the topic', { topic: 5 }], ['an object as the name', { name: { a: 1 } }], ['an array as the e-mail', { email: ['a@b.cc'] }], ['null as the message', { message: null }],
    ['a number as the custom subject', { customSubject: 7 }], ['a missing name', { name: undefined }],
  ])('%s is a validation error, not a crash', async (_l, patch) => {
    expect(await submitContactInquiry({ ...valid, ...patch } as never)).toEqual({ error: 'validation' })
    expect(db.tables.contact_inquiries).toHaveLength(1)
  })

  it('refuses nothing at all', async () => {
    expect(await submitContactInquiry(undefined as never)).toEqual({ error: 'validation' })
    expect(await submitContactInquiry(null as never)).toEqual({ error: 'validation' })
  })

  it.each([
    ['empty name', { name: '   ' }], ['empty e-mail', { email: '' }], ['a message shorter than 20 characters', { message: 'too short' }], ['a message of only spaces', { message: ' '.repeat(40) }],
    ['"other" without a subject', { topic: 'other' }], ['"other" with a blank subject', { topic: 'other', customSubject: '   ' }],
  ])('refuses %s', async (_l, patch) => {
    expect(await submitContactInquiry({ ...valid, ...patch })).toEqual({ error: 'validation' })
    expect(db.tables.contact_inquiries).toHaveLength(1)
  })

  it.each([
    ['no at sign'], ['a@b'], ['a b@example.com'], ['a@example.com, b@example.com'], ['a@example.com;b@example.com'], ['Ana <a@example.com>'], ['a@example.com\r\nBcc: spy@evil.com'], ['"a"@example.com'],
    [`${'a'.repeat(300)}@example.com`],
  ])('refuses the e-mail %j: it would become a second recipient or a header of the staff message', async (email) => {
    expect(await submitContactInquiry({ ...valid, email })).toEqual({ error: 'validation' })
    expect(db.tables.contact_inquiries).toHaveLength(1)
    expect(notified).toEqual([])
  })

  it('cuts the name, message and subject to their limits', async () => {
    await submitContactInquiry({ ...valid, topic: 'other', name: 'N'.repeat(500), message: 'M'.repeat(9000), customSubject: 'S'.repeat(500) })
    const row = db.tables.contact_inquiries.at(-1)!
    expect((row.name as string).length).toBe(200)
    expect((row.message as string).length).toBe(5000)
    expect((row.custom_subject as string).length).toBe(200)
  })

  it('no topic and no subject sends a staff notification (Task 1044 AC6, O1044-1)', async () => {
    await submitContactInquiry({ ...valid, topic: 'other', customSubject: 'My subject' })
    await submitContactInquiry({ ...valid, topic: 'sales', customSubject: 'Ignored' })
    expect(db.tables.contact_inquiries.slice(-2).map((r) => r.custom_subject)).toEqual(['My subject', 'Ignored'])
    expect(notified).toEqual([])
  })

  it('text with markup is stored as typed, to be escaped when it is shown or mailed', async () => {
    const message = '<script>alert(1)</script> and more text to pass the length'
    await submitContactInquiry({ ...valid, message })
    expect(db.tables.contact_inquiries.at(-1)?.message).toBe(message)
  })
})

describe('submitContactInquiry: abuse limits and failures', () => {
  const makeInquiries = (n: number, ip: string, ageMs = 0) =>
    Array.from({ length: n }, (_, i) => ({ id: `old-${ip}-${i}`, source: 'form', requester_ip: ip, created_at: new Date(Date.now() - ageMs).toISOString() }))

  it('refuses the sixth message in an hour from one address, and stores nothing', async () => {
    db.tables.contact_inquiries.push(...makeInquiries(5, '203.0.113.7'))
    const before = db.tables.contact_inquiries.length
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })
    expect(db.tables.contact_inquiries).toHaveLength(before)
    expect(notified).toEqual([])
  })

  it('allows the fifth', async () => {
    db.tables.contact_inquiries.push(...makeInquiries(4, '203.0.113.7'))
    expect(await submitContactInquiry(valid)).toEqual({})
  })

  it('does not count messages older than an hour, or from another address', async () => {
    db.tables.contact_inquiries.push(...makeInquiries(5, '203.0.113.7', 61 * 60 * 1000), ...makeInquiries(5, '198.51.100.1'))
    expect(await submitContactInquiry(valid)).toEqual({})
  })

  it('takes the first address of x-forwarded-for, then x-real-ip', async () => {
    await submitContactInquiry(valid)
    headerValues = { 'x-real-ip': '192.0.2.9' }
    await submitContactInquiry(valid)
    expect(db.tables.contact_inquiries.slice(-2).map((r) => r.requester_ip)).toEqual(['203.0.113.7', '192.0.2.9'])
  })

  it('with no address at all no address is stored, and those requests share one bucket with the same limit (Task 923 R67 (b); the bucket is tested in contactFormLimit.security.test.ts)', async () => {
    headerValues = {}
    for (let i = 0; i < 5; i++) expect(await submitContactInquiry(valid)).toEqual({})
    expect(db.tables.contact_inquiries.slice(-5).every((r) => r.requester_ip === null)).toBe(true)
    expect(await submitContactInquiry(valid)).toEqual({ error: 'rate_limited' })
  })

  it('without the support mailbox configured it says so and stores nothing', async () => {
    delete process.env.CONTACT_SUPPORT_EMAIL
    delete process.env.CONTACT_SALES_EMAIL
    expect(await submitContactInquiry(valid)).toEqual({ error: 'no_mailbox' })
    expect(db.tables.contact_inquiries).toHaveLength(1)
  })

  it('sales falls back to the support mailbox', async () => {
    delete process.env.CONTACT_SALES_EMAIL
    await submitContactInquiry({ ...valid, topic: 'sales' })
    expect(db.tables.contact_inquiries.at(-1)?.target_mailbox).toBe('support@lero.al')
  })

  it('[SEC-1045-SAVE-FAILED] a database failure is "save_failed" and nobody is e-mailed', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'contact_inquiries') c.insert = () => ({ then: (r: (v: unknown) => void) => r({ error: { message: 'x' } }) })
      return c
    }) as never
    expect(await submitContactInquiry(valid)).toEqual({ error: 'save_failed' })
    expect(notified).toEqual([])
  })

  it('[SEC-1045-NO-NOTIFY] a saved message answers {} whatever the mail provider would answer: the form never depends on a staff e-mail (Task 1044 AC6)', async () => {
    for (const result of [{ ok: false as const, reason: 'unverified_sender' }, { ok: false as const, reason: 'transient' }]) {
      notifyResult = result
      expect(await submitContactInquiry(valid)).toEqual({})
    }
    expect(db.tables.contact_inquiries).toHaveLength(3)
    expect(notified).toEqual([])
  })

  it('received mail (source email) does not count toward the form limit of the visitors with no address (Task 1044 AC6)', async () => {
    headerValues = {}
    for (let i = 0; i < 10; i++) db.tables.contact_inquiries.push({ id: `mail-${i}`, source: 'email', requester_ip: null, created_at: new Date().toISOString() })
    expect(await submitContactInquiry(valid)).toEqual({})
  })
})

describe('staff tools: only admin and moderator', () => {
  const calls: [string, () => Promise<unknown>][] = [
    ['updateInquiryStatus', () => updateInquiryStatus('q1', 'closed')],
    ['sendInquiryReply', () => sendInquiryReply('q1', 'Thanks, we will call you.')],
  ]

  describe.each([['anonymous', null], ['a plain user', { id: 'usr' }], ['an agent', { id: 'agt' }], ['a user with no profile row', { id: 'ghost' }]])('%s', (_l, user) => {
    beforeEach(() => { currentUser = user })
    it.each(calls)('%s is refused and changes nothing', async (_n, call) => {
      expect(await call()).toMatchObject({ error: 'forbidden' })
      expect(db.log.filter((l) => l.table !== 'users' && l.op !== 'select')).toEqual([])
      expect(replied).toEqual([])
      expect(db.tables.contact_inquiries[0].status).toBe('new')
    })
  })

  describe.each([['an admin', 'adm'], ['a moderator', 'mod']])('%s', (_l, id) => {
    beforeEach(() => { currentUser = { id } })

    it('sets a valid status and records who handled it', async () => {
      expect(await updateInquiryStatus('q1', 'closed')).toEqual({})
      expect(db.tables.contact_inquiries[0]).toMatchObject({ status: 'closed', handled_by: id })
    })

    it.each([[''], ['deleted'], ['CLOSED'], ['new; drop'], [undefined as unknown as string]])('refuses the status %j', async (status) => {
      expect(await updateInquiryStatus('q1', status)).toEqual({ error: 'invalid_status' })
      expect(db.tables.contact_inquiries[0].status).toBe('new')
    })

    it('a reply is saved, counted, moves a new inquiry to in progress, and is mailed to the visitor from the topic\'s mailbox', async () => {
      const res = await sendInquiryReply('q1', '  Thanks, we will call you.  ')
      expect(res.error).toBeUndefined()
      expect(res.reply).toMatchObject({ inquiry_id: 'q1', body: 'Thanks, we will call you.', replied_by: id })
      expect(db.tables.contact_inquiries[0]).toMatchObject({ status: 'in_progress', reply_count: 1, handled_by: id })
      expect(replied[0]).toMatchObject({ to: 'visitor@example.com', fromMailbox: 'sales@lero.al', displaySubject: 'sales', replyBody: 'Thanks, we will call you.', locale: 'sq' })
    })

    it.each([[''], ['   '], ['hey']])('refuses a reply of %j', async (body) => {
      expect(await sendInquiryReply('q1', body)).toEqual({ error: 'validation' })
      expect(db.tables.contact_inquiry_replies).toEqual([])
    })

    it('an inquiry that does not exist is "not_found" and nothing is mailed', async () => {
      expect(await sendInquiryReply('nope', 'A long enough reply')).toEqual({ error: 'not_found' })
      expect(replied).toEqual([])
    })

    it('a failed e-mail still returns the saved reply and says the e-mail failed', async () => {
      replyResult = { ok: false, reason: 'transient' }
      const res = await sendInquiryReply('q1', 'A long enough reply')
      expect(res.error).toBe('reply_email_failed')
      expect(res.reply?.body).toBe('A long enough reply')
    })
  })

  it('a reply to an "other" inquiry uses its custom subject', async () => {
    currentUser = { id: 'adm' }
    db.tables.contact_inquiries.push({ id: 'q2', email: 'v@example.com', topic: 'other', custom_subject: 'Billing', target_mailbox: 'support@lero.al', status: 'in_progress', reply_count: 2 })
    await sendInquiryReply('q2', 'A long enough reply')
    expect(replied[0].displaySubject).toBe('Billing')
    expect(db.tables.contact_inquiries.find((q) => q.id === 'q2')).toMatchObject({ status: 'in_progress', reply_count: 3 })
  })
})

// Task 1044 AC11: a staff reply joins the customer's conversation in the customer's mail program, and its own id is stored so the customer's answer can join back.
describe('staff reply threading (Task 1044 AC11)', () => {
  const at = (m: number) => new Date(Date.parse('2026-11-20T10:00:00Z') + m * 60_000).toISOString()

  beforeEach(() => {
    currentUser = { id: 'adm' }
    db.tables.contact_inquiries.push({ id: 'qm', source: 'email', email: 'ana@example.com', topic: 'other', custom_subject: 'Flat in Tiranë', target_mailbox: 'support@lero.al', status: 'new', reply_count: 0, message_id: '<origin@example.com>', created_at: at(0) })
  })

  it('[SEC-1044-THREAD] In-Reply-To is the newest stored id of the thread, References every stored id oldest first; the sent id is stored', async () => {
    db.tables.contact_inquiry_replies.push(
      { id: 'r-b', inquiry_id: 'qm', direction: 'inbound', from_email: 'ana@example.com', message_id: '<answer@example.com>', created_at: at(20) },
      { id: 'r-a', inquiry_id: 'qm', direction: 'outbound', replied_by: 'adm', message_id: '<staff-a@eu-west-1.amazonses.com>', created_at: at(10) },
      { id: 'r-n', inquiry_id: 'qm', direction: 'outbound', replied_by: 'adm', message_id: null, created_at: at(15) },
      { id: 'r-x', inquiry_id: 'other', direction: 'outbound', replied_by: 'adm', message_id: '<foreign@eu-west-1.amazonses.com>', created_at: at(30) },
    )
    const res = await sendInquiryReply('qm', 'Yes, it is still free.')
    expect(res.error).toBeUndefined()
    expect(replied[0]).toMatchObject({
      to: 'ana@example.com', fromMailbox: 'support@lero.al', subject: 'Re: Flat in Tiranë',
      headers: { 'In-Reply-To': '<answer@example.com>', References: '<origin@example.com> <staff-a@eu-west-1.amazonses.com> <answer@example.com>' },
    })
    expect(readIds).toEqual(['resend-1'])
    const stored = db.tables.contact_inquiry_replies.find((r) => r.id === res.reply?.id)
    expect(stored?.message_id).toBe('<sent-1@eu-west-1.amazonses.com>')
  })

  it('References carries the last 20 stored ids only', async () => {
    for (let i = 1; i <= 25; i++) db.tables.contact_inquiry_replies.push({ id: `r-${i}`, inquiry_id: 'qm', direction: 'outbound', replied_by: 'adm', message_id: `<id-${i}@example.com>`, created_at: at(i) })
    await sendInquiryReply('qm', 'Yes, it is still free.')
    const refs = (replied[0].headers as { References: string }).References.split(' ')
    expect(refs).toHaveLength(20)
    expect(refs[0]).toBe('<id-6@example.com>')
    expect(refs.at(-1)).toBe('<id-25@example.com>')
    expect((replied[0].headers as Record<string, string>)['In-Reply-To']).toBe('<id-25@example.com>')
  })

  it('a thread with no stored id sends no threading header; a form inquiry keeps the template subject', async () => {
    await sendInquiryReply('q1', 'Thanks, we will call you.')
    expect('headers' in replied[0]).toBe(false)
    expect('subject' in replied[0]).toBe(false)
    expect(replied[0]).toMatchObject({ displaySubject: 'sales' })
  })

  it('a failed read of the sent id leaves it empty and the reply stays sent', async () => {
    sentMessageId = null
    const res = await sendInquiryReply('qm', 'Yes, it is still free.')
    expect(res.error).toBeUndefined()
    expect(db.tables.contact_inquiry_replies.find((r) => r.id === res.reply?.id)?.message_id ?? null).toBeNull()
  })

  it('a reply whose e-mail failed reads no id', async () => {
    replyResult = { ok: false, reason: 'transient' }
    const res = await sendInquiryReply('qm', 'Yes, it is still free.')
    expect(res.error).toBe('reply_email_failed')
    expect(readIds).toEqual([])
  })
})

// Task 923 R38 (case SEC-S37-SRV-DENY)
it('[SEC-S37-SRV-DENY] submitContactInquiry accepts only typed fields and one plain e-mail address', async () => {
  const before = db.tables.contact_inquiries.length
  for (const patch of [{ topic: 5 }, { name: { a: 1 } }, { message: null }, { email: ['a@b.cc'] }, { email: 'a@example.com, b@example.com' }, { email: 'a@example.com\r\nBcc: spy@evil.com' }]) {
    expect(await submitContactInquiry({ ...valid, ...patch } as never), JSON.stringify(patch)).toEqual({ error: 'validation' })
  }
  expect(db.tables.contact_inquiries).toHaveLength(before)
  expect(notified).toEqual([])
  expect(await submitContactInquiry(valid)).toEqual({})                    // the control
})
