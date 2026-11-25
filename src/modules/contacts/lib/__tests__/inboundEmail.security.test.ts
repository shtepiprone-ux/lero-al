// @vitest-environment node
/**
 * Security (Task 1044): a received mail becomes an inquiry, or joins one, only on proof; everything else is dropped or refused, and nothing is acknowledged before it is stored.
 *  - AC2: the same Message-ID twice stores one row and answers 200 both times, also when the second write hits the unique index (the pre-check missed it);
 *         log lines carry outcomes and codes only, never an address, a subject or a body.
 *  - AC3: an answer joins its inquiry only with a stored id (of the inquiry or of a reply), from the inquiry's own address, with `dmarc=pass` in the TOPMOST
 *         `Authentication-Results` header written by `mx.cloudflare.net`; anything less opens a new inquiry and the other one is unchanged.
 *  - AC4: the sixth mail of a sender in an hour and the 101st mail in 24 hours are dropped (sliding windows).
 *  - AC5: mail from lero.al or a subdomain, and automatic answers, are dropped; no inbound path sends a mail.
 *  - AC7: an HTML-only mail is stored as text (no tag, no attribute, no script text).
 *  - AC8: a failed write answers 500, and nothing half-written answers 200.
 * The real processInboundEmail and the real MIME parser run against an in-memory database. Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb, type Row } from '@/tests/fakeSupabase'

let db = createFakeDb()
/** the duplicate pre-check does not see the stored ids (a concurrent delivery), so only the unique index can stop the second row */
let raceDuplicate = false
/** the insert of this table fails with a non-unique error */
let failInsert: string | null = null
/** the update of this table fails */
let failUpdate: string | null = null
/** a count of this table fails */
let failCount: string | null = null

const UNIQUE = ['contact_inquiries', 'contact_inquiry_replies']

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => {
      const chain = db.client.from(t) as Record<string, (...a: unknown[]) => unknown>
      const filters: [string, unknown][] = []
      const eq = chain.eq
      chain.eq = (c: unknown, v: unknown) => { filters.push([c as string, v]); return eq(c, v) }
      const inFilter = chain.in
      chain.in = (c: unknown, v: unknown) => { filters.push([c as string, v]); return inFilter(c, v) }
      const select = chain.select
      chain.select = (cols: unknown, opts: unknown) => {
        if (failCount === t && (opts as { head?: boolean } | undefined)?.head) {
          const failing: Record<string, unknown> = {}
          for (const k of ['eq', 'gte', 'in', 'is']) failing[k] = () => failing
          failing.then = (r: (v: unknown) => void) => r({ count: null, data: null, error: { code: 'XX000', message: 'MARKER-COUNT' } })
          return failing
        }
        return select(cols, opts)
      }
      const then = chain.then
      chain.then = (r: unknown) => {
        // the race: the pre-check reads no row for a message id
        if (raceDuplicate && filters.some(([c]) => c === 'message_id')) return (r as (v: unknown) => void)({ data: [], error: null })
        return then(r)
      }
      const insert = chain.insert
      chain.insert = (v: unknown) => {
        const row = v as Row
        if (failInsert === t) return { select: () => ({ then: (r: (x: unknown) => void) => r({ data: null, error: { code: 'XX000', message: 'MARKER-INSERT' } }) }), then: (r: (x: unknown) => void) => r({ data: null, error: { code: 'XX000', message: 'MARKER-INSERT' } }) }
        // the unique index on message_id where it is not null, one per table
        if (UNIQUE.includes(t) && row.message_id != null && (db.tables[t] ?? []).some((x) => x.message_id === row.message_id)) {
          const dup = { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } }
          return { select: () => ({ then: (r: (x: unknown) => void) => r(dup) }), then: (r: (x: unknown) => void) => r(dup) }
        }
        return insert(v)
      }
      const update = chain.update
      chain.update = (v: unknown) => {
        if (failUpdate === t) {
          const failing: Record<string, unknown> = {}
          failing.eq = () => failing
          failing.then = (r: (x: unknown) => void) => r({ data: null, error: { code: 'XX000', message: 'MARKER-UPDATE' } })
          return failing
        }
        return update(v)
      }
      return chain
    },
  }),
}))

const { sendEmailSpy } = vi.hoisted(() => ({ sendEmailSpy: vi.fn(async () => ({ id: 'never' })) }))
vi.mock('@/modules/notifications/lib/emails/send', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/notifications/lib/emails/send')>()),
  sendEmail: sendEmailSpy,
}))

import { processInboundEmail } from '../inboundEmail'

const ENV = { ...process.env }
const CF_PASS = 'mx.cloudflare.net; dkim=pass header.d=example.com; spf=pass smtp.mailfrom=example.com; dmarc=pass header.from=example.com'
const CF_FAIL = 'mx.cloudflare.net; dkim=fail header.d=example.com; spf=fail smtp.mailfrom=example.com; dmarc=fail header.from=example.com'

interface MailOptions {
  from?: string
  subject?: string
  messageId?: string | null
  inReplyTo?: string
  references?: string
  auth?: string[]
  extra?: string[]
  text?: string
  html?: string
  attachments?: { filename: string; type: string; bytes: number }[]
}

/** a raw RFC 5322 message, CRLF line ends */
function mail(o: MailOptions = {}): Uint8Array {
  const head: string[] = []
  for (const a of o.auth ?? [CF_PASS]) head.push(`Authentication-Results: ${a}`)
  head.push(`From: ${o.from ?? '"Ana Hoxha" <ana@example.com>'}`, 'To: support@lero.al', `Subject: ${o.subject ?? 'Question about a listing'}`)
  if (o.messageId !== null) head.push(`Message-ID: ${o.messageId ?? `<m-${Math.random().toString(36).slice(2)}@example.com>`}`)
  if (o.inReplyTo) head.push(`In-Reply-To: ${o.inReplyTo}`)
  if (o.references) head.push(`References: ${o.references}`)
  head.push(...(o.extra ?? []), 'MIME-Version: 1.0')
  const parts: string[] = []
  if (o.html !== undefined) parts.push(`Content-Type: text/html; charset=utf-8\r\n\r\n${o.html}`)
  else parts.push(`Content-Type: text/plain; charset=utf-8\r\n\r\n${o.text ?? 'Hello, is the flat still available?'}`)
  for (const a of o.attachments ?? []) {
    parts.push(`Content-Type: ${a.type}\r\nContent-Disposition: attachment; filename="${a.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.alloc(a.bytes, 7).toString('base64')}`)
  }
  const body = `Content-Type: multipart/mixed; boundary="b1044"\r\n\r\n${parts.map((p) => `--b1044\r\n${p}\r\n`).join('')}--b1044--\r\n`
  return new TextEncoder().encode(`${head.join('\r\n')}\r\n${body}`)
}

const env = (over: Partial<{ from: string; to: string }> = {}) => ({ from: 'ana@example.com', to: 'support@lero.al', ...over })
const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString()

let info: ReturnType<typeof vi.spyOn>
let error: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  process.env = { ...ENV, CONTACT_SUPPORT_EMAIL: 'support@lero.al', CONTACT_SALES_EMAIL: 'sales@lero.al' }
  db = createFakeDb({
    contact_inquiries: [
      { id: 'q1', source: 'form', topic: 'sales', email: 'visitor@example.com', status: 'closed', message_id: null, created_at: minutesAgo(600) },
    ],
    contact_inquiry_replies: [
      { id: 'r1', inquiry_id: 'q1', direction: 'outbound', replied_by: 'adm', body: 'Our answer', message_id: '<staff-1@eu-west-1.amazonses.com>', created_at: minutesAgo(500) },
    ],
  })
  raceDuplicate = false
  failInsert = null
  failUpdate = null
  failCount = null
  sendEmailSpy.mockClear()
  info = vi.spyOn(console, 'info').mockImplementation(() => {})
  error = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

const inquiries = () => db.tables.contact_inquiries
const replies = () => db.tables.contact_inquiry_replies

describe('a new mail opens an inquiry', () => {
  it('stores the named fields of an e-mail inquiry and answers 200', async () => {
    const res = await processInboundEmail(mail({ messageId: '<new-1@example.com>', subject: 'Question\r\n about a flat', attachments: [{ filename: 'plan.pdf', type: 'application/pdf', bytes: 3000 }] }), env())
    expect(res).toEqual({ status: 200, outcome: 'stored' })
    expect(inquiries()).toHaveLength(2)
    expect(inquiries()[1]).toMatchObject({
      source: 'email', topic: 'other', custom_subject: 'Question about a flat', name: 'Ana Hoxha', email: 'ana@example.com',
      message: 'Hello, is the flat still available?', target_mailbox: 'support@lero.al', requester_ip: null, status: 'new', message_id: '<new-1@example.com>',
      attachments: [{ filename: 'plan.pdf', size: 3000, content_type: 'application/pdf' }],
    })
  })

  it('a mail to sales@ (also with a +tag) goes to the sales mailbox; the name falls back to the local part', async () => {
    await processInboundEmail(mail({ from: 'bora@example.com' }), env({ from: 'bora@example.com', to: 'sales+offers@lero.al' }))
    expect(inquiries()[1]).toMatchObject({ target_mailbox: 'sales@lero.al', name: 'bora', email: 'bora@example.com' })
  })

  it('a From that is not one plain address is refused with 422 and nothing is stored', async () => {
    for (const from of ['undisclosed-recipients:;', '"x" <a@b>', 'only a name']) {
      expect((await processInboundEmail(mail({ from }), env())).status, from).toBe(422)
    }
    expect(inquiries()).toHaveLength(1)
  })

  it('keeps no attachment content and at most 20 file names of at most 200 characters', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ filename: `${'n'.repeat(250)}-${i}.txt`, type: 'text/plain', bytes: 10 }))
    await processInboundEmail(mail({ attachments: many }), env())
    const stored = inquiries()[1].attachments as { filename: string; size: number; content_type: string }[]
    expect(stored).toHaveLength(20)
    expect(stored.every((a) => a.filename.length <= 200 && Object.keys(a).sort().join() === 'content_type,filename,size')).toBe(true)
  })
})

describe('AC2 duplicates', () => {
  it('[SEC-1044-DUPLICATE] the same Message-ID twice stores one row and answers 200 both times', async () => {
    const raw = mail({ messageId: '<dup-1@example.com>' })
    expect(await processInboundEmail(raw, env())).toEqual({ status: 200, outcome: 'stored' })
    expect(await processInboundEmail(raw, env())).toEqual({ status: 200, outcome: 'duplicate' })
    expect(inquiries().filter((r) => r.message_id === '<dup-1@example.com>')).toHaveLength(1)
  })

  it('an id already stored on a reply (either direction) is a duplicate too', async () => {
    expect(await processInboundEmail(mail({ messageId: '<staff-1@eu-west-1.amazonses.com>' }), env())).toEqual({ status: 200, outcome: 'duplicate' })
    expect(inquiries()).toHaveLength(1)
  })

  it('[SEC-1044-DUPLICATE-INDEX] when the pre-check misses it, the unique index refuses the second row and the answer is still 200', async () => {
    const raw = mail({ messageId: '<dup-2@example.com>' })
    expect((await processInboundEmail(raw, env())).status).toBe(200)
    raceDuplicate = true
    expect(await processInboundEmail(raw, env())).toEqual({ status: 200, outcome: 'duplicate' })
    expect(inquiries().filter((r) => r.message_id === '<dup-2@example.com>')).toHaveLength(1)
  })

  it('log lines carry the outcome and codes only: no address, subject, body or id', async () => {
    await processInboundEmail(mail({ messageId: '<log-1@example.com>', subject: 'MARKER-SUBJECT', text: 'MARKER-BODY text' }), env())
    await processInboundEmail(mail({ messageId: '<log-1@example.com>', subject: 'MARKER-SUBJECT', text: 'MARKER-BODY text' }), env())
    failInsert = 'contact_inquiries'
    await processInboundEmail(mail({ messageId: '<log-2@example.com>', subject: 'MARKER-SUBJECT', text: 'MARKER-BODY text' }), env())
    const logged = JSON.stringify([...info.mock.calls, ...error.mock.calls])
    for (const secret of ['ana@example.com', 'MARKER-SUBJECT', 'MARKER-BODY', 'log-1@', 'MARKER-INSERT', 'Ana Hoxha']) expect(logged).not.toContain(secret)
    expect(logged).toContain('stored')
    expect(logged).toContain('duplicate')
  })
})

describe('AC3 joining an answer to its inquiry', () => {
  const answer = (o: MailOptions = {}) => mail({ from: 'Visitor <Visitor@Example.com>', inReplyTo: '<staff-1@eu-west-1.amazonses.com>', subject: 'Re: Our answer', ...o })

  it('[SEC-1044-JOIN] a stored id, the inquiry\'s own address and the topmost mx.cloudflare.net dmarc=pass join it; a closed inquiry becomes new', async () => {
    const res = await processInboundEmail(answer({ messageId: '<ans-1@example.com>', attachments: [{ filename: 'photo.jpg', type: 'image/jpeg', bytes: 2048 }] }), env({ from: 'visitor@example.com' }))
    expect(res).toEqual({ status: 200, outcome: 'joined' })
    expect(inquiries()).toHaveLength(1)
    expect(inquiries()[0].status).toBe('new')
    expect(replies()).toHaveLength(2)
    expect(replies()[1]).toMatchObject({
      inquiry_id: 'q1', direction: 'inbound', from_email: 'visitor@example.com', body: 'Hello, is the flat still available?', message_id: '<ans-1@example.com>',
      attachments: [{ filename: 'photo.jpg', size: 2048, content_type: 'image/jpeg' }],
    })
    expect(replies()[1].replied_by ?? null).toBeNull()
  })

  it('the id may be the inquiry\'s own and may come from References only', async () => {
    inquiries()[0].message_id = '<q1-origin@example.com>'
    const res = await processInboundEmail(answer({ inReplyTo: undefined, references: '<other@example.net> <q1-origin@example.com>' }), env({ from: 'visitor@example.com' }))
    expect(res.outcome).toBe('joined')
  })

  it.each([
    ['no stored id', { inReplyTo: '<unknown@example.com>' }],
    ['no In-Reply-To or References at all', { inReplyTo: undefined }],
    ['another sender address', { from: 'Mallory <mallory@example.com>' }],
    ['dmarc other than pass', { auth: [CF_FAIL] }],
    ['dmarc=pass only in a LOWER header (the topmost says fail)', { auth: [CF_FAIL, CF_PASS] }],
    ['dmarc=pass under another authserv-id', { auth: ['mx.evil.example; dkim=pass; dmarc=pass'] }],
    ['dmarc=pass under a look-alike authserv-id', { auth: ['mx.cloudflare.net.evil.example; dmarc=pass'] }],
    ['the topmost header is the sender\'s, the cloudflare result lower', { auth: ['mx.evil.example; dmarc=pass', CF_PASS] }],
    ['no Authentication-Results at all', { auth: [] }],
    ['dmarc=passed (not the token pass)', { auth: ['mx.cloudflare.net; dmarc=passed'] }],
  ])('[SEC-1044-JOIN-DENY] %s opens a new inquiry and leaves the other unchanged', async (_l, patch) => {
    const res = await processInboundEmail(answer(patch as MailOptions), env({ from: 'visitor@example.com' }))
    expect(res).toEqual({ status: 200, outcome: 'stored' })
    expect(inquiries()).toHaveLength(2)
    expect(inquiries()[0].status).toBe('closed')
    expect(replies()).toHaveLength(1)
    expect(inquiries()[1]).toMatchObject({ source: 'email', status: 'new' })
  })
})

describe('AC4 floods', () => {
  const seedSender = (n: number, ageMin: number) => {
    for (let i = 0; i < n; i++) inquiries().push({ id: `s-${ageMin}-${i}`, source: 'email', email: 'ana@example.com', created_at: minutesAgo(ageMin), message_id: null })
  }

  it('[SEC-1044-LIMIT-SENDER] the sixth mail of one sender in an hour is dropped; the window slides', async () => {
    seedSender(4, 10)
    expect((await processInboundEmail(mail(), env())).outcome).toBe('stored')       // the fifth
    expect(await processInboundEmail(mail(), env())).toEqual({ status: 200, outcome: 'dropped_limit' })
    expect(inquiries().filter((r) => r.email === 'ana@example.com')).toHaveLength(5)
    for (const r of inquiries()) if (r.email === 'ana@example.com') r.created_at = minutesAgo(61)
    expect((await processInboundEmail(mail(), env())).outcome).toBe('stored')
  })

  it('inbound answers of the sender count toward the same limit', async () => {
    seedSender(3, 5)
    for (let i = 0; i < 2; i++) replies().push({ id: `in-${i}`, inquiry_id: 'q1', direction: 'inbound', from_email: 'ana@example.com', created_at: minutesAgo(5), message_id: null })
    expect((await processInboundEmail(mail(), env())).outcome).toBe('dropped_limit')
  })

  it('[SEC-1044-LIMIT-ALL] the 101st mail in 24 hours is dropped; the window slides', async () => {
    for (let i = 0; i < 99; i++) inquiries().push({ id: `g-${i}`, source: 'email', email: `p${i}@example.org`, created_at: minutesAgo(60 * 23), message_id: null })
    expect((await processInboundEmail(mail(), env())).outcome).toBe('stored')        // the 100th
    expect(await processInboundEmail(mail({ from: 'other@example.com' }), env({ from: 'other@example.com' }))).toEqual({ status: 200, outcome: 'dropped_limit' })
    for (const r of inquiries()) if (String(r.id).startsWith('g-')) r.created_at = minutesAgo(60 * 24 + 1)
    expect((await processInboundEmail(mail({ from: 'other@example.com' }), env({ from: 'other@example.com' }))).outcome).toBe('stored')
  })

  it('form rows do not count toward the mail limits', async () => {
    for (let i = 0; i < 10; i++) inquiries().push({ id: `f-${i}`, source: 'form', email: 'ana@example.com', created_at: minutesAgo(1), message_id: null })
    expect((await processInboundEmail(mail(), env())).outcome).toBe('stored')
  })

  it('a count that cannot be read answers 500 and stores nothing', async () => {
    failCount = 'contact_inquiries'
    expect((await processInboundEmail(mail(), env())).status).toBe(500)
    expect(inquiries()).toHaveLength(1)
  })
})

describe('AC5 loops and automatic answers', () => {
  it.each([
    ['From lero.al', { from: 'noreply@lero.al' }, {}],
    ['From a subdomain', { from: 'bounce@send.lero.al' }, {}],
    ['From upper case', { from: 'Support <SUPPORT@LERO.AL>' }, {}],
    ['an envelope sender of lero.al', {}, { from: 'bounces@lero.al' }],
    ['an envelope sender of a subdomain', {}, { from: 'x@mailtest.lero.al' }],
  ])('[SEC-1044-LOOP] %s is dropped', async (_l, m, e) => {
    expect(await processInboundEmail(mail(m), env(e))).toEqual({ status: 200, outcome: 'dropped_loop' })
    expect(inquiries()).toHaveLength(1)
  })

  it('a look-alike domain is not ours', async () => {
    expect((await processInboundEmail(mail({ from: 'a@notlero.al' }), env({ from: 'a@notlero.al' }))).outcome).toBe('stored')
  })

  it.each([
    ['Auto-Submitted: auto-replied'], ['Auto-Submitted: auto-generated'], ['Precedence: bulk'], ['Precedence: junk'], ['Precedence: list'], ['Precedence: auto_reply'],
    ['X-Autoreply: yes'], ['X-Autorespond: on'],
  ])('[SEC-1044-AUTO] %s is dropped', async (header) => {
    expect(await processInboundEmail(mail({ extra: [header] }), env())).toEqual({ status: 200, outcome: 'dropped_auto' })
    expect(inquiries()).toHaveLength(1)
  })

  it('Auto-Submitted: no is a person\'s mail', async () => {
    expect((await processInboundEmail(mail({ extra: ['Auto-Submitted: no'] }), env())).outcome).toBe('stored')
  })

  it('no inbound path sends a mail', async () => {
    await processInboundEmail(mail(), env())
    await processInboundEmail(mail({ from: 'Visitor <visitor@example.com>', inReplyTo: '<staff-1@eu-west-1.amazonses.com>' }), env({ from: 'visitor@example.com' }))
    await processInboundEmail(mail({ from: 'noreply@lero.al' }), env())
    await processInboundEmail(mail({ extra: ['Precedence: bulk'] }), env())
    expect(sendEmailSpy).not.toHaveBeenCalled()
  })
})

describe('AC7 HTML is stored as text', () => {
  it('[SEC-1044-TEXT] an HTML-only mail keeps no tag, attribute or script text', async () => {
    await processInboundEmail(mail({ html: '<p>Hello <b>World</b> &amp; Co</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">link</a> &lt;i&gt;' }), env())
    const message = inquiries()[1].message as string
    expect(message).not.toMatch(/<script|<img|onerror|javascript:|alert\(1\)|<b>|<p>|<a /)
    expect(message).toContain('Hello World & Co')
    expect(message).toContain('link')
    expect(message).toContain('<i>')                                                         // an entity the sender wrote is decoded to text, shown as text
  })

  it('a long body is cut to 20 000 characters', async () => {
    await processInboundEmail(mail({ text: 'x'.repeat(30_000) }), env())
    expect((inquiries()[1].message as string).length).toBe(20_000)
  })
})

describe('AC8 nothing is acknowledged before it is stored', () => {
  it('[SEC-1044-WRITE] a failed insert of a new inquiry answers 500', async () => {
    failInsert = 'contact_inquiries'
    expect(await processInboundEmail(mail(), env())).toMatchObject({ status: 500 })
    expect(inquiries()).toHaveLength(1)
  })

  it('a failed insert of a joined answer answers 500', async () => {
    failInsert = 'contact_inquiry_replies'
    expect(await processInboundEmail(mail({ from: 'visitor@example.com', inReplyTo: '<staff-1@eu-west-1.amazonses.com>' }), env({ from: 'visitor@example.com' }))).toMatchObject({ status: 500 })
    expect(replies()).toHaveLength(1)
  })

  it('a failed status update of a joined inquiry answers 500 and writes no answer row', async () => {
    failUpdate = 'contact_inquiries'
    expect(await processInboundEmail(mail({ from: 'visitor@example.com', inReplyTo: '<staff-1@eu-west-1.amazonses.com>' }), env({ from: 'visitor@example.com' }))).toMatchObject({ status: 500 })
    expect(replies()).toHaveLength(1)
  })

  it('a message the parser cannot read is refused, never acknowledged', async () => {
    const res = await processInboundEmail(new TextEncoder().encode('not a mail at all'), env())
    expect(res.status).not.toBe(200)
    expect(inquiries()).toHaveLength(1)
  })
})
