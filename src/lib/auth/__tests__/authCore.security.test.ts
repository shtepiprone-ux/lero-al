// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the core of authentication and authorisation.
 *  - getBlockedError: a blocked or suspended person cannot write; an expired suspension is lifted for that person only;
 *  - getStaffRole: only admin / moderator count as staff, decided from the SESSION's user id with the service-role client;
 *  - server.ts: the session helpers never throw, and ensureUserProfile does not let a self-chosen metadata field decide role, verification, type or id;
 *  - openAuthSheet: a harmless browser event, and a no-op on the server.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let lookupError: { code: string } | null = null
let sessionUser: { id: string; user_metadata?: Record<string, unknown> } | null = null
let authThrows = false
const upserts: { values: Record<string, unknown>; options: Record<string, unknown> }[] = []
const authCalls: string[] = []

function serverClient() {
  if (authThrows) throw new Error('cookies unavailable')
  const base = db.client.from
  return {
    auth: {
      getUser: async () => { if (authThrows) throw new Error('boom'); return { data: { user: sessionUser } } },
      getSession: async () => ({ data: { session: sessionUser ? { access_token: 't' } : null } }),
      exchangeCodeForSession: async (code: string) => { authCalls.push(`exchange:${code}`); return { data: {}, error: null } },
      verifyOtp: async (p: unknown) => { authCalls.push(`otp:${JSON.stringify(p)}`); return { data: {}, error: null } },
    },
    from(table: string) {
      const chain = base(table) as Record<string, unknown>
      if (lookupError && table === 'users') {
        const failing: Record<string, unknown> = { ...chain }
        failing.select = () => failing
        failing.eq = () => failing
        failing.single = async () => ({ data: null, error: lookupError })
        return failing
      }
      chain.upsert = (values: Record<string, unknown>, options: Record<string, unknown>) => { upserts.push({ values, options }); return Promise.resolve({ error: null }) }
      return chain
    },
  }
}
/** the service-role read of `users` while the database reports an error (Task 923 R44 (d): the status and the role are read through this client) */
function failingUsersRead(error: { code: string }) {
  const failing: Record<string, unknown> = {}
  failing.select = () => failing
  failing.eq = () => failing
  failing.single = async () => ({ data: null, error })
  failing.maybeSingle = async () => ({ data: null, error })
  return failing
}
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => serverClient() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => (lookupError && t === 'users' ? failingUsersRead(lookupError) : db.client.from(t)) }) }))

import { getBlockedError } from '../blockCheck'
import { getStaffRole } from '../staff'
import { ensureUserProfile, exchangeCodeForSession, getSession, getUser, resolveSession, verifyOtp } from '../server'
import { AUTH_SHEET_EVENT, openAuthSheet } from '../authSheet'

const NOW = new Date('2026-10-17T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  db = createFakeDb({
    users: [
      { id: 'active', status: 'active', suspended_until: null, role: 'user' },
      { id: 'perm', status: 'blocked', suspended_until: null, block_reason: 'fraud', role: 'user' },
      { id: 'future', status: 'blocked', suspended_until: '2026-10-18T00:00:00.000Z', block_reason: 'spam', role: 'user' },
      { id: 'past', status: 'blocked', suspended_until: '2026-10-16T00:00:00.000Z', block_reason: 'spam', role: 'user' },
      { id: 'edge', status: 'blocked', suspended_until: NOW.toISOString(), block_reason: 'spam', role: 'user' },
      { id: 'garbage', status: 'blocked', suspended_until: 'not-a-date', block_reason: 'spam', role: 'user' },
      { id: 'bystander', status: 'blocked', suspended_until: '2026-10-16T00:00:00.000Z', block_reason: 'other', role: 'user' },
      // the staff and non-staff accounts are active: `requireViewer()` (Task 923 R44) reads the role from the row of an account that has access
      { id: 'adm', role: 'admin', status: 'active' }, { id: 'mod', role: 'moderator', status: 'active' }, { id: 'agt', role: 'agent', status: 'active' },
      { id: 'usr', role: 'user', status: 'active' }, { id: 'ADM', role: 'Admin', status: 'active' }, { id: 'nul', role: null, status: 'active' },
    ],
  })
  lookupError = null
  sessionUser = null
  authThrows = false
  upserts.length = 0
  authCalls.length = 0
})
afterEach(() => { vi.useRealTimers() })

describe('getBlockedError', () => {
  it('lets an active person write and changes nothing', async () => {
    expect(await getBlockedError('active')).toBeNull()
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('a permanent block is "account_blocked"', async () => {
    expect(await getBlockedError('perm')).toBe('account_blocked')
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('a running suspension is "account_suspended" and is not lifted early', async () => {
    expect(await getBlockedError('future')).toBe('account_suspended')
    expect(db.tables.users.find((u) => u.id === 'future')?.status).toBe('blocked')
  })

  it('an expired suspension is lifted: active again, reason cleared, for THAT person only', async () => {
    expect(await getBlockedError('past')).toBeNull()
    expect(db.tables.users.find((u) => u.id === 'past')).toMatchObject({ status: 'active', suspended_until: null, block_reason: null })
    expect(db.tables.users.find((u) => u.id === 'bystander')).toMatchObject({ status: 'blocked', block_reason: 'other' })
    const update = db.log.find((l) => l.op === 'update')!
    // Task 923 R66 (k): the lift is a compare-and-set on the status and the end date that were read
    expect(update.filters).toEqual([['id', 'eq', 'past'], ['status', 'eq', 'blocked'], ['suspended_until', 'eq', '2026-10-16T00:00:00.000Z']])
  })

  it('the very moment of expiry already counts as expired', async () => {
    expect(await getBlockedError('edge')).toBeNull()
  })

  it('a suspension end date that cannot be read keeps the person suspended (fails closed)', async () => {
    expect(await getBlockedError('garbage')).toBe('account_suspended')
    expect(db.tables.users.find((u) => u.id === 'garbage')?.status).toBe('blocked')
  })

  // Task 923 R37 / SEC-D9-SRV-MISSING-DENY: this was a characterisation of the vulnerability (a missing profile row counted as "not blocked") and is now its regression
  it('a person with no profile row has no access', async () => {
    expect(await getBlockedError('nobody')).toBe('account_blocked')
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  // Task 923 R37 (owner decision S32 reversed): a database error while reading the status of an ACTIVE person is no access, never "allowed"
  it('a database error while reading the status is no access (fails closed)', async () => {
    lookupError = { code: 'XX000' }
    expect(await getBlockedError('active')).toBe('account_blocked')
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })
})

describe('getStaffRole', () => {
  it.each([['adm', 'admin'], ['mod', 'moderator']])('%s is staff (%s)', async (id, role) => {
    sessionUser = { id }
    expect(await getStaffRole()).toBe(role)
  })

  it.each([['agt'], ['usr'], ['ADM'], ['nul'], ['nobody']])('%s is not staff', async (id) => {
    sessionUser = { id }
    expect(await getStaffRole()).toBeNull()
  })

  it('an anonymous visitor is not staff and the database is not even asked', async () => {
    sessionUser = null
    expect(await getStaffRole()).toBeNull()
    expect(db.log).toEqual([])
  })

  it('the role is looked up by the SESSION\'s id, nothing else', async () => {
    sessionUser = { id: 'usr', user_metadata: { role: 'admin' } } as never
    expect(await getStaffRole()).toBeNull()
    expect(db.log[0].filters).toEqual([['id', 'eq', 'usr']])
  })
})

describe('session helpers never throw', () => {
  it('return the user, the session and the profile', async () => {
    sessionUser = { id: 'usr' }
    expect(await getUser()).toEqual({ id: 'usr' })
    expect(await getSession()).toEqual({ access_token: 't' })
    expect(await resolveSession()).toEqual({ user: db.tables.users.find((u) => u.id === 'usr') })
  })

  it('give null / empty when nobody is signed in or the profile is missing', async () => {
    expect(await getUser()).toBeNull()
    expect(await getSession()).toBeNull()
    expect(await resolveSession()).toEqual({ user: null })
    sessionUser = { id: 'no-profile' }
    expect(await resolveSession()).toEqual({ user: null })
  })

  it('collapse a failure of the client itself to null / empty', async () => {
    authThrows = true
    expect(await getUser()).toBeNull()
    expect(await getSession()).toBeNull()
    expect(await resolveSession()).toEqual({ user: null })
  })

  it('pass the code and the token hash to Supabase unchanged', async () => {
    await exchangeCodeForSession('abc')
    await verifyOtp({ token_hash: 'h', type: 'recovery' })
    expect(authCalls).toEqual(['exchange:abc', 'otp:{"token_hash":"h","type":"recovery"}'])
  })
})

describe('ensureUserProfile', () => {
  it('does nothing for an anonymous visitor', async () => {
    await ensureUserProfile()
    expect(upserts).toEqual([])
  })

  it('creates a plain, unverified private user and never overwrites an existing profile', async () => {
    sessionUser = { id: 'new-1', user_metadata: { full_name: 'Alba Hoxha' } }
    await ensureUserProfile()
    expect(upserts).toHaveLength(1)
    expect(upserts[0].values).toEqual({ id: 'new-1', name: 'Alba Hoxha', user_type: 'private', role: 'user', is_verified: false, preferred_locale: 'sq' })
    expect(upserts[0].options).toEqual({ onConflict: 'id', ignoreDuplicates: true })
  })

  it('a self-chosen metadata field cannot decide role, verification, account type, status or id', async () => {
    sessionUser = { id: 'new-2', user_metadata: { role: 'admin', is_verified: true, user_type: 'agent', status: 'active', id: 'victim', email: 'x@y.z', suspended_until: null } }
    await ensureUserProfile()
    expect(upserts[0].values).toMatchObject({ id: 'new-2', role: 'user', is_verified: false, user_type: 'private' })
    expect(Object.keys(upserts[0].values).sort()).toEqual(['id', 'is_verified', 'name', 'preferred_locale', 'role', 'user_type'])
  })

  it.each([['it', 'it'], ['uk', 'uk'], ['xx', 'sq'], ['', 'sq'], ['SQ', 'sq'], ['en; DROP', 'sq'], ['__proto__', 'sq']])('preferred locale %j is stored as %s', async (meta, stored) => {
    sessionUser = { id: 'new-3', user_metadata: { preferred_locale: meta } }
    await ensureUserProfile()
    expect(upserts[0].values.preferred_locale).toBe(stored)
  })

  it('takes the name from full_name, then name, else null', async () => {
    sessionUser = { id: 'n1', user_metadata: { name: 'Only Name' } }
    await ensureUserProfile()
    sessionUser = { id: 'n2', user_metadata: {} }
    await ensureUserProfile()
    expect(upserts.map((u) => u.values.name)).toEqual(['Only Name', null])
  })

  it('sets the company only on the person\'s own row and only while it is empty', async () => {
    db.tables.users.push({ id: 'agent-1', company_id: null, role: 'user' })
    sessionUser = { id: 'agent-1', user_metadata: { company_id: 'c-7' } }
    await ensureUserProfile()
    const update = db.log.find((l) => l.op === 'update')!
    expect(update.values).toEqual({ company_id: 'c-7' })
    expect(update.filters).toEqual([['id', 'eq', 'agent-1'], ['company_id', 'is', null]])
    expect(db.tables.users.find((u) => u.id === 'agent-1')?.company_id).toBe('c-7')
  })

  it('does not move a person who already has a company', async () => {
    db.tables.users.push({ id: 'agent-2', company_id: 'c-1', role: 'user' })
    sessionUser = { id: 'agent-2', user_metadata: { company_id: 'c-9' } }
    await ensureUserProfile()
    expect(db.tables.users.find((u) => u.id === 'agent-2')?.company_id).toBe('c-1')
  })

  it('without a company in the metadata there is no update at all', async () => {
    sessionUser = { id: 'new-4', user_metadata: {} }
    await ensureUserProfile()
    expect(db.log.filter((l) => l.op === 'update')).toEqual([])
  })

  it('never throws', async () => {
    authThrows = true
    await expect(ensureUserProfile()).resolves.toBeUndefined()
  })
})

describe('openAuthSheet', () => {
  it('is a no-op on the server', () => {
    expect(() => openAuthSheet('register')).not.toThrow()
  })

  it('dispatches one event with the requested view, "login" by default', () => {
    const target = new EventTarget()
    vi.stubGlobal('window', target)
    const seen: unknown[] = []
    target.addEventListener(AUTH_SHEET_EVENT, (e) => seen.push((e as CustomEvent).detail))
    openAuthSheet()
    openAuthSheet('register-agent')
    vi.unstubAllGlobals()
    expect(seen).toEqual([{ view: 'login' }, { view: 'register-agent' }])
  })
})
