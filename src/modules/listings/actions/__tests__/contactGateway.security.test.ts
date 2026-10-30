// @vitest-environment node
/**
 * Task 923 R110–R112 (R86): a listing owner's phone or WhatsApp number, and a message to the owner, reach a visitor only through the server, after a session that Supabase
 * Auth verified and after a human check that Cloudflare verified for THIS action and THIS site. The REAL `revealListingContact`, `submitListingInquiry`, `requireViewer`,
 * `contactHumanCheck`, `verifyTurnstile` and `trackListingContactEvent` run. The doubles are the I/O only: the session source (`getUser`), the database client (it records
 * which client is used, every read, every contact-function call and every write), Cloudflare's siteverify (`fetch`), the request headers, the e-mail provider and the
 * notification service. Each denial is proven by the returned answer AND by the absence of the contact function call, of every write, e-mail and notification.
 * The real-Auth/database/Cloudflare controls are src/tests/integration/contactGateway.integration.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SITE_URL } from '@/lib/siteUrl'

const VIEWER = '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
const OTHER = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d'
const OWNER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LISTING = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b'
const PHONE = '+355 69 111 2222'
const WHATSAPP = '+355 68 333 4444'
const SITE_HOST = new URL(SITE_URL).hostname

type Row = Record<string, unknown>
const state = vi.hoisted(() => ({
  session: null as null | { id: string },
  sessionThrows: false,
  getUserCalls: 0,
  profiles: {} as Record<string, Record<string, unknown> | null>,
  profileError: false,
  reads: [] as string[],
  sessionClientCalls: 0,
  rpc: [] as Array<{ name: string; args: Record<string, unknown> }>,
  rpcResult: { data: null, error: null } as { data: unknown; error: { code?: string; message: string } | null },
  rpcThrows: false,
  events: [] as Row[],
  inquiries: [] as Row[],
  // the reveal record (R125): the stored rows, the rows as the gateway sent them, every operation on it, and the fault to answer
  reveals: { rows: [] as Row[], inserts: [] as Row[], ops: [] as string[], fault: null as null | { on: 'rows' | 'count' | 'insert' | 'delete' | 'verified'; nth: number; as: 'error' | 'null' | 'throw' | 'missing' }, seen: { rows: 0, count: 0, delete: 0 }, verified: false },
  requestHeaders: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' } as Record<string, string>,
  userLookups: [] as string[],
  emails: [] as Row[],
  notifications: [] as Row[],
  fetches: [] as Array<{ url: string; body: URLSearchParams }>,
  siteverify: (() => ({})) as () => unknown,
}))

/**
 * The double of `public.listing_contact_reveals` (R128 (c)). It keeps the reveal rows in their own list, applies the filters the gateway may use (`eq`, `is(null)`, `gte`, `lt`) to
 * those rows, and fails loudly on any other operation. It does NOT claim to be PostgreSQL: the table's grants and row level security are SEC-X-INT-REVEAL-TABLE-*.
 * `state.reveals.fault` answers an error, a null result, a thrown error or (for the verified flag) a missing row at the nth call of one operation.
 */
function revealQuery() {
  type Predicate = (row: Row) => boolean
  const predicates: Predicate[] = []
  let mode: 'rows' | 'count' | 'delete' = 'rows'
  let columns: string[] = []
  const faultAt = (on: 'rows' | 'count' | 'insert' | 'delete', nth: number) => (state.reveals.fault?.on === on && state.reveals.fault.nth === nth ? state.reveals.fault.as : null)
  const query: Record<string, unknown> = {}
  query.select = (selected: string, options?: { count?: string; head?: boolean }) => {
    columns = selected.split(',').map(column => column.trim())
    if (options?.count === 'exact' && options.head === true) mode = 'count'
    else if (options !== undefined) throw new Error('the reveal double supports select(columns) and select(columns, { count: "exact", head: true }) only')
    return query
  }
  query.delete = () => { mode = 'delete'; return query }
  query.eq = (column: string, value: unknown) => { predicates.push(row => row[column] === value); return query }
  query.is = (column: string, value: unknown) => {
    if (value !== null) throw new Error('the reveal double supports is(column, null) only')
    predicates.push(row => row[column] === null)
    return query
  }
  query.gte = (column: string, value: string) => { predicates.push(row => Date.parse(row[column] as string) >= Date.parse(value)); return query }
  query.lt = (column: string, value: string) => { predicates.push(row => Date.parse(row[column] as string) < Date.parse(value)); return query }
  query.insert = async (row: Row) => {
    state.reveals.ops.push('insert')
    state.reveals.inserts.push(row)
    const fault = faultAt('insert', 1)
    if (fault === 'throw') throw new Error('database down')
    if (fault) return { error: { code: 'XX000', message: 'insert failed' } }
    state.reveals.rows.push({ ...row, created_at: new Date().toISOString() })
    return { error: null }
  }
  query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
    try {
      const matching = () => state.reveals.rows.filter(row => predicates.every(predicate => predicate(row)))
      if (mode === 'delete') {
        state.reveals.ops.push('delete')
        const fault = faultAt('delete', ++state.reveals.seen.delete)
        if (fault === 'throw') throw new Error('database down')
        if (fault) return resolve({ error: { code: 'XX000', message: 'delete failed' } })
        const doomed = new Set(matching())
        state.reveals.rows = state.reveals.rows.filter(row => !doomed.has(row))
        return resolve({ error: null })
      }
      state.reveals.ops.push('select')
      if (mode === 'count') {
        const fault = faultAt('count', ++state.reveals.seen.count)
        if (fault === 'throw') throw new Error('database down')
        if (fault === 'error') return resolve({ count: null, error: { code: 'XX000', message: 'count failed' } })
        if (fault === 'null') return resolve({ count: null, error: null })
        return resolve({ count: matching().length, error: null })
      }
      const fault = faultAt('rows', ++state.reveals.seen.rows)
      if (fault === 'throw') throw new Error('database down')
      if (fault === 'error') return resolve({ data: null, error: { code: 'XX000', message: 'read failed' } })
      if (fault === 'null') return resolve({ data: null, error: null })
      return resolve({ data: matching().map(row => Object.fromEntries(columns.map(column => [column, row[column]]))), error: null })
    } catch (err) {
      return reject(err)
    }
  }
  return query
}

/** the viewer's `users.is_verified` (R126 (c)): the flag of `state.reveals.verified`, or the fault of the test */
function verifiedRead() {
  state.reveals.ops.push('verified-flag')
  const fault = state.reveals.fault?.on === 'verified' ? state.reveals.fault.as : null
  if (fault === 'throw') throw new Error('database down')
  if (fault === 'error') return { data: null, error: { code: 'XX000', message: 'read failed' } }
  if (fault === 'missing') return { data: null, error: null }
  return { data: { is_verified: state.reveals.verified }, error: null }
}

vi.mock('@/lib/auth/server', () => ({
  getUser: async () => { state.getUserCalls++; if (state.sessionThrows) throw new Error('auth down'); return state.session },
}))
// the cookie-bound (session) client must never reach a contact function
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => { state.sessionClientCalls++; throw new Error('the session client must not be used') } }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc: async (name: string, args: Record<string, unknown>) => {
      state.rpc.push({ name, args })
      if (state.rpcThrows) throw new Error('database down')
      return state.rpcResult
    },
    auth: { admin: { getUserById: async (id: string) => { state.userLookups.push(id); return { data: { user: { email: `${id}@example.com` } }, error: null } } } },
    from: (table: string) => {
      if (table === 'listing_contact_reveals') return revealQuery()
      state.reads.push(table)
      const filters: Record<string, unknown> = {}
      const chain: Record<string, unknown> = {}
      let columns = ''
      for (const m of ['eq', 'is', 'in', 'gte', 'limit']) chain[m] = (column: string, value: unknown) => { filters[column] = value; return chain }
      chain.select = (selected?: string) => { columns = selected ?? ''; return chain }
      chain.insert = async (row: Row) => { (table === 'listing_contact_events' ? state.events : state.inquiries).push(row); return { error: null } }
      chain.maybeSingle = async () => {
        // the viewer's verified flag (R126 (c)): its own read, answered with that column only
        if (table === 'users' && columns === 'is_verified') return verifiedRead()
        if (table === 'users') return { data: state.profileError ? null : (state.profiles[filters.id as string] ?? null), error: state.profileError ? { message: 'db error' } : null }
        if (table === 'listings') return { data: { id: LISTING, user_id: OWNER, title: 'A flat in Tirana', status: 'active', slug: 'a-flat' }, error: null }
        throw new Error(`unexpected maybeSingle on ${table}`)
      }
      chain.then = (resolve: (value: unknown) => unknown) => resolve(table === 'listing_inquiries' ? { count: 0, data: null, error: null } : { data: [], error: null })
      return chain
    },
  }),
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers(state.requestHeaders) }))
vi.mock('@/modules/notifications/lib/emails/listingInquiry', () => ({ sendListingInquiryNotification: async (mail: Row) => { state.emails.push(mail); return { ok: true } } }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async (note: Row) => { state.notifications.push(note) } }))

import { revealListingContact } from '../contactGateway'
import { submitListingInquiry } from '../submitListingInquiry'

const ACTIVE = { status: 'active', suspended_until: null, deleted_at: null, role: 'user' }
const input = (over: Record<string, unknown> = {}) => ({ listingId: LISTING, channel: 'call' as 'call' | 'whatsapp', captchaToken: 'tok-valid', locale: 'sq', ...over })
const inquiry = (over: Record<string, unknown> = {}) => ({ listingId: LISTING, name: 'Ana Hoxha', email: 'ana@example.com', message: 'Hello, is the flat still available for a viewing?', captchaToken: 'tok-valid', ...over })
/** Cloudflare's answer for a human who solved the widget of `action` on this site */
const verified = (action: string, over: Record<string, unknown> = {}) => ({ success: true, action, hostname: SITE_HOST, ...over })
const signedIn = (id = VIEWER, profile: Row = ACTIVE) => { state.session = { id }; state.profiles[id] = { ...profile } }
/** what only a verified, permitted reveal may ever cause */
const effects = () => ({ rpc: state.rpc, events: state.events, inquiries: state.inquiries, emails: state.emails, notifications: state.notifications, revealOps: state.reveals.ops })
/** `revealOps` is every read or write of a reveal row or of the verified flag: a refusal before the number lookup causes none */
const noEffects = { rpc: [], events: [], inquiries: [], emails: [], notifications: [], revealOps: [] }
const ENV = { ...process.env }

beforeEach(() => {
  state.session = null; state.sessionThrows = false; state.getUserCalls = 0
  state.profiles = { [OWNER]: { ...ACTIVE } }; state.profileError = false
  state.reads = []; state.sessionClientCalls = 0
  state.rpc = []; state.rpcResult = { data: [{ phone: PHONE, whatsapp: WHATSAPP }], error: null }; state.rpcThrows = false
  state.events = []; state.inquiries = []; state.userLookups = []; state.emails = []; state.notifications = []
  state.reveals = { rows: [], inserts: [], ops: [], fault: null, seen: { rows: 0, count: 0, delete: 0 }, verified: false }
  state.requestHeaders = { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }
  state.fetches = []; state.siteverify = () => verified('contact_reveal')
  // no unit runner sets a Turnstile secret: this suite sets one, so the development shortcut is off and every token goes to the (doubled) siteverify
  process.env.TURNSTILE_SECRET_KEY = 'test-secret-key'
  vi.stubGlobal('fetch', async (url: string, init: { body: URLSearchParams }) => {
    state.fetches.push({ url, body: init.body })
    return { json: async () => state.siteverify() }
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { process.env = { ...ENV }; vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

describe('contactGateway', () => {
  it('[SEC-X-SRV-CONTACT-BOT-DENY] no contact without a verified human check', async () => {
    signedIn()
    const refused: Array<[string, Row, () => unknown]> = [
      ['no token', { captchaToken: undefined }, () => verified('contact_reveal')],
      ['an empty token', { captchaToken: '' }, () => verified('contact_reveal')],
      ['a token longer than Cloudflare issues', { captchaToken: 'x'.repeat(2049) }, () => verified('contact_reveal')],
      ['a token Cloudflare refuses', {}, () => ({ success: false, 'error-codes': ['invalid-input-response'] })],
      ['a replayed token', {}, () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] })],
      ['a token solved for the message path', {}, () => verified('contact_inquiry')],
      ['a token solved for another site', {}, () => verified('contact_reveal', { hostname: 'elsewhere.example' })],
      ['a token with no action', {}, () => verified('contact_reveal', { action: undefined })],
    ]
    for (const [label, patch, answer] of refused) {
      state.rpc = []; state.events = []
      state.siteverify = answer
      expect(await revealListingContact(input(patch) as never), label).toEqual({ ok: false, reason: 'bot_check_failed' })
      expect(effects(), `${label}: no contact function call, no event`).toEqual({ ...noEffects, rpc: [] })
    }
    // the same for WhatsApp, which would also have recorded an event
    state.siteverify = () => ({ success: false, 'error-codes': ['invalid-input-response'] })
    expect(await revealListingContact(input({ channel: 'whatsapp' }) as never)).toEqual({ ok: false, reason: 'bot_check_failed' })
    expect(effects()).toEqual(noEffects)

    // Cloudflare's testing-key answer is for tests only: it opens nothing in production
    vi.stubEnv('NODE_ENV', 'production')
    state.siteverify = () => ({ success: true, hostname: 'example.com', metadata: { result_with_testing_key: true } })
    expect(await revealListingContact(input() as never)).toEqual({ ok: false, reason: 'bot_check_failed' })
    expect(effects()).toEqual(noEffects)
    expect(state.sessionClientCalls, 'the session client was never used').toBe(0)
  })

  it('[SEC-X-SRV-CONTACT-BOT-ALLOW] a verified reveal returns the number once', async () => {
    signedIn()
    state.siteverify = () => verified('contact_reveal')

    // Call: only the phone, no event, through the service role with the verified viewer's id
    const call = await revealListingContact(input({ channel: 'call' }))
    expect(call).toEqual({ ok: true, number: PHONE })
    expect(JSON.stringify(call)).not.toContain(WHATSAPP)
    expect(state.rpc).toEqual([{ name: 'get_listing_owner_contact_as', args: { p_caller: VIEWER, listing_id_param: LISTING } }])
    expect(state.events, 'a phone reveal records no event').toEqual([])

    // WhatsApp: only the WhatsApp number and exactly one event of this viewer
    const whatsapp = await revealListingContact(input({ channel: 'whatsapp' }))
    expect(whatsapp).toEqual({ ok: true, number: WHATSAPP })
    expect(JSON.stringify(whatsapp)).not.toContain(PHONE)
    expect(state.rpc).toHaveLength(2)
    expect(state.events).toHaveLength(1)
    expect(state.events[0]).toMatchObject({ listing_id: LISTING, listing_owner_id: OWNER, actor_user_id: VIEWER, channel: 'whatsapp', source: 'listing_detail_contact_card', locale: 'sq', is_owner_click: false })

    // Cloudflare was asked once per reveal, with the caller's address from the first forwarded entry and the token as a form value
    expect(state.fetches).toHaveLength(2)
    expect(state.fetches[0].url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(state.fetches[0].body.get('response')).toBe('tok-valid')
    expect(state.fetches[0].body.get('remoteip')).toBe('203.0.113.9')
    expect(state.sessionClientCalls, 'the session client was never used').toBe(0)
  })

  it('[SEC-X-SRV-CONTACT-BOT-ERR] an unverifiable check fails closed', async () => {
    signedIn()
    const unverifiable: Array<[string, () => unknown]> = [
      ['Turnstile is unreachable', () => { throw new Error('offline') }],
      ['the answer says success with the string "true"', () => ({ success: 'true', action: 'contact_reveal', hostname: SITE_HOST })],
      ['the answer is not an object', () => null],
    ]
    for (const [label, answer] of unverifiable) {
      state.siteverify = answer
      expect(await revealListingContact(input() as never), label).toEqual({ ok: false, reason: 'bot_check_failed' })
      expect(effects(), label).toEqual(noEffects)
    }
    // a body that is not JSON
    vi.stubGlobal('fetch', async () => ({ json: async () => { throw new SyntaxError('html') } }))
    expect(await revealListingContact(input() as never)).toEqual({ ok: false, reason: 'bot_check_failed' })
    expect(effects()).toEqual(noEffects)

    // the human check passes and the contact function fails: load_failed, with nothing of the error in the answer and no event
    vi.stubGlobal('fetch', async () => ({ json: async () => verified('contact_reveal') }))
    state.rpcResult = { data: null, error: { code: 'XX000', message: 'relation "secret_table" does not exist' } }
    const failed = await revealListingContact(input({ channel: 'whatsapp' }))
    expect(failed).toEqual({ ok: false, reason: 'load_failed' })
    expect(JSON.stringify(failed)).not.toContain('secret_table')
    state.rpcThrows = true
    expect(await revealListingContact(input({ channel: 'whatsapp' }))).toEqual({ ok: false, reason: 'load_failed' })
    expect(state.events, 'no event without a number').toEqual([])

    // a listing with no row, or no number for the requested channel, is not available
    state.rpcThrows = false
    state.rpcResult = { data: [], error: null }
    expect(await revealListingContact(input())).toEqual({ ok: false, reason: 'not_available' })
    state.rpcResult = { data: [{ phone: null, whatsapp: WHATSAPP }], error: null }
    expect(await revealListingContact(input({ channel: 'call' }))).toEqual({ ok: false, reason: 'not_available' })
    expect(state.events).toEqual([])
  })

  it('[SEC-X-SRV-INQUIRY-BOT-DENY] no inquiry without a verified human check', async () => {
    signedIn()
    const refused: Array<[string, Row, () => unknown]> = [
      ['no token', { captchaToken: undefined }, () => verified('contact_inquiry')],
      ['a token Cloudflare refuses', {}, () => ({ success: false, 'error-codes': ['invalid-input-response'] })],
      ['a token solved for the reveal path', {}, () => verified('contact_reveal')],
    ]
    for (const [label, patch, answer] of refused) {
      state.reads = []; state.userLookups = []
      state.siteverify = answer
      expect(await submitListingInquiry(inquiry(patch) as never), label).toEqual({ error: 'bot_check_failed' })
      expect(effects(), `${label}: no inquiry row, no e-mail, no notification`).toEqual(noEffects)
      // refused right after the session check: neither the sender, the listing nor the owner was read
      expect(state.reads, label).toEqual(['users'])
      expect(state.userLookups, label).toEqual([])
    }
    // the positive control: a token solved for the message path sends exactly one inquiry
    state.siteverify = () => verified('contact_inquiry')
    expect(await submitListingInquiry(inquiry() as never)).toEqual({})
    expect(state.inquiries).toHaveLength(1)
    expect(state.emails).toHaveLength(1)
    expect(state.notifications).toHaveLength(1)
  })

  it('[SEC-X-SRV-CONTACT-SESSION-DENY] only a verified caller, by its own id', async () => {
    state.siteverify = () => verified('contact_reveal')
    const callers: Array<[string, () => void]> = [
      ['a guest', () => { state.session = null }],
      ['a session that was ended (Auth answers no user)', () => { state.session = null; state.profiles[VIEWER] = { ...ACTIVE } }],
      ['a session without a profile', () => { state.session = { id: VIEWER }; state.profiles[VIEWER] = null }],
      ['a blocked account', () => signedIn(VIEWER, { ...ACTIVE, status: 'blocked' })],
      ['a deleted profile', () => signedIn(VIEWER, { ...ACTIVE, deleted_at: '2026-10-01T00:00:00Z' })],
    ]
    for (const [label, arrange] of callers) {
      state.fetches = []; state.rpc = []; state.events = []
      arrange()
      expect(await revealListingContact(input({ channel: 'whatsapp' }) as never), label).toEqual({ ok: false, reason: 'unauthenticated' })
      expect(state.fetches, `${label}: Turnstile is not asked before the session check`).toEqual([])
      expect(effects(), label).toEqual(noEffects)
    }

    // a caller who adds another person's id to the input is still served as themselves
    state.fetches = []
    signedIn()
    const forged = { ...input({ channel: 'call' }), p_caller: OTHER, userId: OTHER, caller: OTHER, viewerId: OTHER }
    expect(await revealListingContact(forged as never)).toEqual({ ok: true, number: PHONE })
    expect(state.rpc).toEqual([{ name: 'get_listing_owner_contact_as', args: { p_caller: VIEWER, listing_id_param: LISTING } }])
    expect(JSON.stringify(state.rpc)).not.toContain(OTHER)

    // a listing id that is not a UUID, a channel outside the two, and an input that is not an object: not_available before any lookup
    state.rpc = []; state.fetches = []; state.reads = []; state.getUserCalls = 0
    const malformed: unknown[] = [
      input({ listingId: 'not-an-id' }), input({ listingId: `${LISTING},${LISTING}` }), input({ listingId: "1' OR '1'='1" }), input({ listingId: undefined }), input({ listingId: { id: LISTING } }),
      input({ channel: 'sms' }), input({ channel: undefined }), null, undefined, 'a string', 42,
    ]
    for (const bad of malformed) expect(await revealListingContact(bad as never), JSON.stringify(bad)).toEqual({ ok: false, reason: 'not_available' })
    expect(state.getUserCalls, 'the session was not even asked').toBe(0)
    expect(state.reads).toEqual([])
    expect(state.fetches).toEqual([])
    expect(state.rpc).toEqual([])

    // an outage of the session source or of the profile read is a retryable failure, never a pass
    state.sessionThrows = true
    expect(await revealListingContact(input() as never)).toEqual({ ok: false, reason: 'load_failed' })
    state.sessionThrows = false
    state.profileError = true
    state.session = { id: VIEWER }
    expect(await revealListingContact(input() as never)).toEqual({ ok: false, reason: 'load_failed' })
    expect(state.rpc).toEqual([])
    expect(state.sessionClientCalls).toBe(0)
  })

  // Task 923 R126, R129 (owner D77, D79, D80): the number of reveals is limited per account, per verified account and per IP address, over rolling windows of one hour and 24 hours.
  const MINUTE = 60_000
  const HOUR = 60 * MINUTE
  const REQUEST_IP = '203.0.113.9'
  const OTHER_LISTING = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const LIMITED = { ok: false, reason: 'rate_limited' }
  /** `count` stored reveals of `who`, each on its own other listing, `ageMs` old, from `ip` (an address that is not the request's unless the case says so) */
  const seed = (count: number, ageMs: number, who = VIEWER, ip: string | null = '198.51.100.7') => {
    for (let i = 0; i < count; i++) {
      state.reveals.rows.push({ viewer_id: who, listing_id: `00000000-0000-4000-8000-${String(state.reveals.rows.length).padStart(12, '0')}`, channel: 'call', requester_ip: ip, created_at: new Date(Date.now() - ageMs).toISOString() })
    }
  }
  /** a fresh sub-case: no stored rows, no recorded operation, no fault, no earlier answer */
  const fresh = (verifiedAccount = false) => {
    state.reveals = { rows: [], inserts: [], ops: [], fault: null, seen: { rows: 0, count: 0, delete: 0 }, verified: verifiedAccount }
    state.requestHeaders = { 'x-forwarded-for': `${REQUEST_IP}, 10.0.0.1` }
    state.rpc = []; state.events = []; state.fetches = []
  }
  /** the answer carries no part of either number, and a refused reveal left no row and no WhatsApp event */
  const refusedWithNothing = (answer: unknown, label: string) => {
    expect(answer, label).toEqual(LIMITED)
    expect(JSON.stringify(answer), `${label}: no number in the answer`).not.toMatch(/\+355/)
    expect(state.reveals.inserts, `${label}: no reveal row written`).toEqual([])
    expect(state.reveals.ops, `${label}: nothing deleted either`).not.toContain('delete')
    expect(state.events, `${label}: no WhatsApp event`).toEqual([])
  }

  it('[SEC-X-SRV-REVEAL-LIMIT] the account limits of D77 and D79', async () => {
    signedIn()
    state.siteverify = () => verified('contact_reveal')
    // [label, verified account, rows, their age, allowed]
    const matrix: Array<[string, boolean, number, number, boolean]> = [
      ['a standard viewer with 19 rows in the last hour', false, 19, 10 * MINUTE, true],
      ['a standard viewer with 20 rows in the last hour', false, 20, 10 * MINUTE, false],
      ['a standard viewer with 20 rows that are 61 minutes old (outside the hour)', false, 20, 61 * MINUTE, true],
      ['a standard viewer with 59 rows in 24 hours and none in the last hour', false, 59, 2 * HOUR, true],
      ['a standard viewer with 60 rows in 24 hours and none in the last hour', false, 60, 2 * HOUR, false],
      ['a standard viewer with 60 rows that are 25 hours old (outside the day)', false, 60, 25 * HOUR, true],
      ['a verified viewer with 34 rows in the last hour', true, 34, 10 * MINUTE, true],
      ['a verified viewer with 35 rows in the last hour', true, 35, 10 * MINUTE, false],
      ['a verified viewer with 119 rows in 24 hours and none in the last hour', true, 119, 2 * HOUR, true],
      ['a verified viewer with 120 rows in 24 hours and none in the last hour', true, 120, 2 * HOUR, false],
    ]
    for (const [label, verifiedAccount, count, age, allowed] of matrix) {
      for (const channel of ['call', 'whatsapp'] as const) {
        fresh(verifiedAccount)
        seed(count, age)
        const answer = await revealListingContact(input({ channel }))
        const name = `${label}, ${channel}`
        if (allowed) {
          expect(answer, name).toEqual({ ok: true, number: channel === 'call' ? PHONE : WHATSAPP })
          // exactly one new row: the verified id, the listing, the channel and the first forwarded address
          expect(state.reveals.inserts, name).toEqual([{ viewer_id: VIEWER, listing_id: LISTING, channel, requester_ip: REQUEST_IP }])
          expect(state.events, name).toHaveLength(channel === 'whatsapp' ? 1 : 0)
        } else {
          refusedWithNothing(answer, name)
          // the lookup came first, but its number is not returned
          expect(state.rpc, name).toHaveLength(1)
        }
      }
    }

    // the rows of another account never count against this one
    fresh(false)
    seed(100, 10 * MINUTE, OTHER)
    expect(await revealListingContact(input()), 'a standard viewer, 100 rows of another account').toEqual({ ok: true, number: PHONE })

    // a refusal does not depend on the verified flag being read first: the flag read is the one that sets 35/120 rather than 20/60
    fresh(false)
    seed(20, 10 * MINUTE)
    refusedWithNothing(await revealListingContact(input()), 'the flag is false')
    fresh(true)
    seed(20, 10 * MINUTE)
    expect(await revealListingContact(input()), 'the same 20 rows, flag true').toEqual({ ok: true, number: PHONE })

    // retention: an allowed reveal deletes the rows older than 48 hours and keeps the others
    fresh(false)
    seed(3, 50 * HOUR, OTHER)
    seed(2, 47 * HOUR, OTHER)
    expect(await revealListingContact(input())).toEqual({ ok: true, number: PHONE })
    expect(state.reveals.rows.filter(row => row.viewer_id === OTHER)).toHaveLength(2)
    expect(state.reveals.ops.filter(op => op === 'delete')).toHaveLength(1)
  })

  it('[SEC-X-SRV-REVEAL-IP] the IP limit of D80 and the shared bucket', async () => {
    signedIn()
    state.siteverify = () => verified('contact_reveal')
    // a viewer with no rows of their own; the rows of the address belong to other accounts
    const ipMatrix: Array<[string, number, number, boolean]> = [
      ['59 rows of the address in the last hour', 59, 10 * MINUTE, true],
      ['60 rows of the address in the last hour', 60, 10 * MINUTE, false],
      ['199 rows of the address in 24 hours and none in the last hour', 199, 2 * HOUR, true],
      ['200 rows of the address in 24 hours and none in the last hour', 200, 2 * HOUR, false],
    ]
    for (const [label, count, age, allowed] of ipMatrix) {
      fresh(false)
      seed(count, age, OTHER, REQUEST_IP)
      const answer = await revealListingContact(input())
      if (allowed) {
        expect(answer, label).toEqual({ ok: true, number: PHONE })
        expect(state.reveals.inserts, label).toEqual([{ viewer_id: VIEWER, listing_id: LISTING, channel: 'call', requester_ip: REQUEST_IP }])
      } else refusedWithNothing(answer, label)
    }

    // without both headers the null bucket is used: 60 rows of the null bucket refuse; 60 rows of a real address do not count against it
    fresh(false)
    state.requestHeaders = {}
    seed(60, 10 * MINUTE, OTHER, null)
    refusedWithNothing(await revealListingContact(input()), 'no headers, 60 rows in the null bucket')
    fresh(false)
    state.requestHeaders = {}
    seed(60, 10 * MINUTE, OTHER, REQUEST_IP)
    expect(await revealListingContact(input()), 'no headers, 60 rows of a real address').toEqual({ ok: true, number: PHONE })
    expect(state.reveals.inserts, 'the row is written into the null bucket').toEqual([{ viewer_id: VIEWER, listing_id: LISTING, channel: 'call', requester_ip: null }])

    // x-real-ip is used when x-forwarded-for is absent; the first forwarded entry wins when both are sent
    fresh(false)
    state.requestHeaders = { 'x-real-ip': '198.51.100.20' }
    seed(60, 10 * MINUTE, OTHER, '198.51.100.20')
    refusedWithNothing(await revealListingContact(input()), 'x-real-ip only, 60 rows of that address')
    fresh(false)
    state.requestHeaders = { 'x-forwarded-for': `  ${REQUEST_IP}  , 10.0.0.1`, 'x-real-ip': '198.51.100.20' }
    seed(60, 10 * MINUTE, OTHER, '198.51.100.20')
    expect(await revealListingContact(input()), 'both headers, 60 rows of the x-real-ip address').toEqual({ ok: true, number: PHONE })
    expect(state.reveals.inserts[0]?.requester_ip, 'the first forwarded entry, trimmed').toBe(REQUEST_IP)
  })

  it('[SEC-X-SRV-REVEAL-REPEAT] a repeat reveal of a listing is free', async () => {
    signedIn()
    state.siteverify = () => verified('contact_reveal')
    // every limit is reached: the account (20 in the hour, 60 in the day), and the address (60 in the hour, 200 in the day)
    const atEveryLimit = () => {
      fresh(false)
      seed(19, 10 * MINUTE)
      state.reveals.rows.push({ viewer_id: VIEWER, listing_id: LISTING, channel: 'call', requester_ip: REQUEST_IP, created_at: new Date(Date.now() - 30 * MINUTE).toISOString() })
      seed(40, 2 * HOUR)
      seed(60, 10 * MINUTE, OTHER, REQUEST_IP)
      seed(140, 2 * HOUR, OTHER, REQUEST_IP)
    }
    for (const channel of ['call', 'whatsapp'] as const) {
      atEveryLimit()
      const before = state.reveals.rows.length
      expect(await revealListingContact(input({ channel })), `a repeat ${channel} reveal`).toEqual({ ok: true, number: channel === 'call' ? PHONE : WHATSAPP })
      expect(state.reveals.inserts, 'no row is written').toEqual([])
      expect(state.reveals.rows, 'nothing is deleted').toHaveLength(before)
      expect(state.reveals.ops, 'only the viewer\'s rows were read: no flag, no IP count, no delete').toEqual(['select'])
    }

    // the control: in the same state another listing is refused
    atEveryLimit()
    refusedWithNothing(await revealListingContact(input({ listingId: OTHER_LISTING })), 'another listing in the same state')

    // a reveal of this listing 25 hours ago is outside the window and is not free
    atEveryLimit()
    state.reveals.rows = state.reveals.rows.filter(row => row.listing_id !== LISTING)
    state.reveals.rows.push({ viewer_id: VIEWER, listing_id: LISTING, channel: 'call', requester_ip: REQUEST_IP, created_at: new Date(Date.now() - 25 * HOUR).toISOString() })
    refusedWithNothing(await revealListingContact(input()), 'a reveal of this listing 25 hours ago')
  })

  it('[SEC-X-SRV-REVEAL-FAILCLOSED] a limit that cannot be read refuses', async () => {
    signedIn()
    state.siteverify = () => verified('contact_reveal')
    type Fault = NonNullable<typeof state.reveals.fault>
    const faults: Array<[string, Fault]> = [
      ['the read of the viewer\'s rows answers an error', { on: 'rows', nth: 1, as: 'error' }],
      ['the read of the viewer\'s rows answers no data', { on: 'rows', nth: 1, as: 'null' }],
      ['the read of the viewer\'s rows throws', { on: 'rows', nth: 1, as: 'throw' }],
      ['the verified flag answers an error', { on: 'verified', nth: 1, as: 'error' }],
      ['the viewer has no users row', { on: 'verified', nth: 1, as: 'missing' }],
      ['the verified flag read throws', { on: 'verified', nth: 1, as: 'throw' }],
      ['the IP count of the hour answers an error', { on: 'count', nth: 1, as: 'error' }],
      ['the IP count of the hour is null', { on: 'count', nth: 1, as: 'null' }],
      ['the IP count of the day answers an error', { on: 'count', nth: 2, as: 'error' }],
      ['the IP count of the day is null', { on: 'count', nth: 2, as: 'null' }],
      ['an IP count throws', { on: 'count', nth: 1, as: 'throw' }],
      ['the insert answers an error', { on: 'insert', nth: 1, as: 'error' }],
      ['the insert throws', { on: 'insert', nth: 1, as: 'throw' }],
    ]
    for (const [label, fault] of faults) {
      for (const channel of ['call', 'whatsapp'] as const) {
        fresh(false)
        state.reveals.fault = fault
        const answer = await revealListingContact(input({ channel }))
        expect(answer, `${label}, ${channel}`).toEqual({ ok: false, reason: 'load_failed' })
        expect(JSON.stringify(answer), `${label}, ${channel}: no number`).not.toMatch(/\+355/)
        expect(state.events, `${label}, ${channel}: no WhatsApp event`).toEqual([])
        expect(state.reveals.rows, `${label}, ${channel}: no reveal row stored`).toEqual([])
      }
    }

    // the control: with no fault the same viewer is served
    fresh(false)
    expect(await revealListingContact(input())).toEqual({ ok: true, number: PHONE })

    // the one failure that changes nothing: the retention delete. The reveal is recorded and answered, and the failure is logged
    for (const as of ['error', 'throw'] as const) {
      fresh(false)
      state.reveals.fault = { on: 'delete', nth: 1, as }
      expect(await revealListingContact(input()), `a failed retention delete (${as})`).toEqual({ ok: true, number: PHONE })
      expect(state.reveals.inserts).toHaveLength(1)
    }
    expect(console.error).toHaveBeenCalledWith('[contact] old reveal rows could not be deleted', expect.anything())

    // a refusal by the human check or by a missing number reads and writes no reveal row (the existing deny cases assert the same through `noEffects`)
    fresh(false)
    state.siteverify = () => ({ success: false, 'error-codes': ['invalid-input-response'] })
    expect(await revealListingContact(input())).toEqual({ ok: false, reason: 'bot_check_failed' })
    state.siteverify = () => verified('contact_reveal')
    state.rpcResult = { data: [], error: null }
    expect(await revealListingContact(input())).toEqual({ ok: false, reason: 'not_available' })
    expect(state.reveals.ops).toEqual([])
  })
})
