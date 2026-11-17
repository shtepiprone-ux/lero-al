// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S5 / S14): GET /auth/confirm.
 * It must never redirect off the site, must refuse an unknown token type, must not log a person in without a valid one-time token, and must write no profile row with the session
 * (Task 956 AC15: no permissive INSERT policy exists on `users`, `handle_new_user` makes the row), whatever the sign-up metadata says; the company of a new agent is the service role's write.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let verifyResult: { error: unknown; data: { user: { id: string; user_metadata?: Record<string, unknown> } | null } } = { error: null, data: { user: { id: 'u1', user_metadata: {} } } }
const verified: { token_hash: string; type: string }[] = []
const writes: { table: string; op: string; values: unknown; filters: unknown[] }[] = []
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { verifyOtp: async (a: { token_hash: string; type: string }) => { verified.push(a); return verifyResult } },
    from: (table: string) => {
      const rec = { table, op: '', values: undefined as unknown, filters: [] as unknown[] }
      const chain: Record<string, unknown> = {}
      chain.upsert = (v: unknown) => { rec.op = 'upsert'; rec.values = v; writes.push(rec); return Promise.resolve({}) }
      chain.insert = (v: unknown) => { rec.op = 'insert'; rec.values = v; writes.push(rec); return Promise.resolve({}) }
      chain.update = (v: unknown) => { rec.op = 'update'; rec.values = v; writes.push(rec); return chain }
      chain.eq = (...a: unknown[]) => { rec.filters.push(a); return chain }
      chain.is = (...a: unknown[]) => { rec.filters.push(a); return Promise.resolve({}) }
      return chain
    },
  }),
}))
// Task 956: a session may not write `users.company_id` (the column grant is revoked by hardening v8b); the write is the server's, through the service role
const adminWrites: { table: string; op: string; values: unknown; filters: unknown[] }[] = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const rec = { table, op: '', values: undefined as unknown, filters: [] as unknown[] }
      const chain: Record<string, unknown> = {}
      chain.update = (v: unknown) => { rec.op = 'update'; rec.values = v; adminWrites.push(rec); return chain }
      chain.upsert = (v: unknown) => { rec.op = 'upsert'; rec.values = v; adminWrites.push(rec); return Promise.resolve({ error: null }) }
      chain.insert = (v: unknown) => { rec.op = 'insert'; rec.values = v; adminWrites.push(rec); return Promise.resolve({ error: null }) }
      chain.eq = (...a: unknown[]) => { rec.filters.push(a); return chain }
      chain.is = (...a: unknown[]) => { rec.filters.push(a); return Promise.resolve({ error: null }) }
      return chain
    },
  }),
}))

import { GET } from '../route'

const ORIGIN = 'https://lero.al'
const BS = String.fromCharCode(92)
const get = (qs: string) => GET(new NextRequest(`${ORIGIN}/auth/confirm?${qs}`))
const location = (r: Response) => new URL(r.headers.get('location') ?? '', ORIGIN)

beforeEach(() => {
  verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: {} } } }
  verified.length = 0
  writes.length = 0
  adminWrites.length = 0
})

describe('redirect target', () => {
  it('a good token goes to the requested path of this site', async () => {
    const res = await get('token_hash=h&type=magiclink&next=/en/cabinet')
    expect(location(res).href).toBe(`${ORIGIN}/en/cabinet`)
  })

  it('with no next it goes to the default "verified" page', async () => {
    expect(location(await get('token_hash=h&type=signup')).pathname).toBe('/sq/auth/verified')
  })

  it.each([['@evil.example'], ['.evil.example'], ['//evil.example'], [`/${BS}evil.example`], ['https://evil.example'], ['javascript:alert(1)']])('never leaves the site for next=%j', async (next) => {
    const res = await get(`token_hash=h&type=magiclink&next=${encodeURIComponent(next)}`)
    expect(location(res).host).toBe('lero.al')
  })

  it('a failed verification goes to the site failure page, also with an attack in next', async () => {
    verifyResult = { error: { message: 'expired' }, data: { user: null } }
    const res = await get(`token_hash=h&type=magiclink&next=${encodeURIComponent('@evil.example')}`)
    expect(location(res).host).toBe('lero.al')
    expect(location(res).searchParams.get('error')).toBe('confirm_failed')
  })
})

describe('token and type', () => {
  it.each([['type=magiclink'], ['token_hash=h'], ['token_hash=&type=magiclink'], ['token_hash=h&type=admin'], ['token_hash=h&type=__proto__'], ['token_hash=h&type=MAGICLINK']])('refuses %s without calling Supabase', async (qs) => {
    const res = await get(qs)
    expect(location(res).searchParams.get('error')).toBe('auth_callback_failed')
    expect(verified).toEqual([])
    expect(writes).toEqual([])
  })

  it.each(['signup', 'invite', 'recovery', 'magiclink', 'email_change', 'email'])('verifies a %s token once, with the hash from the link', async (type) => {
    await get(`token_hash=abc123&type=${type}`)
    expect(verified).toEqual([{ token_hash: 'abc123', type }])
  })

  it('a rejected token creates no profile and sets no session', async () => {
    verifyResult = { error: { message: 'invalid' }, data: { user: null } }
    const res = await get('token_hash=bad&type=magiclink')
    expect(writes).toEqual([])
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

// Task 956 AC15 (Review 4): `users` has no permissive INSERT policy (only the RESTRICTIVE `blocked_account_no_insert`), so the session upsert of this route never wrote a row; the profile row is made by
// public.handle_new_user() (trigger on_auth_user_created on auth.users). The route writes nothing into `users` with the session. The only write is the company of a new agent, through the service role.
describe('the profile after a good token', () => {
  it.each([
    ['a self-chosen role, verification and type', { role: 'admin', is_verified: true, user_type: 'agent', full_name: 'Alba' }],
    ['an unknown preferred locale', { preferred_locale: 'xx<script>' }],
    ['a supported preferred locale', { preferred_locale: 'uk' }],
    ['no metadata', {}],
  ])('writes no row of any table with the session, whatever the metadata says (%s)', async (_label, user_metadata) => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata } } }
    await get('token_hash=h&type=signup')
    expect(writes, 'the session client is asked for no insert, no upsert and no update').toEqual([])
    expect(adminWrites, 'nothing needs the service role either').toEqual([])
  })

  it('redirects to the requested page after a good token whatever the profile does', async () => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: { full_name: 'Alba' } } } }
    const res = await get('token_hash=h&type=signup&next=/en/cabinet')
    expect(location(res).href).toBe(`${ORIGIN}/en/cabinet`)
  })

  // Task 956 AC4: the company of a new agent is written by the server (service role) on the person's own row and only while it is empty; the session writes no company
  it('the company from the metadata is written through the service role, on the own row, only while empty', async () => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: { company_id: 'c-7' } } } }
    await get('token_hash=h&type=signup')
    expect(adminWrites).toEqual([{ table: 'users', op: 'update', values: { company_id: 'c-7' }, filters: [['id', 'u1'], ['company_id', null]] }])
    expect(writes, 'the session client writes nothing into users').toEqual([])
  })

  it('without a company in the metadata the service role writes nothing', async () => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: { full_name: 'Alba' } } } }
    await get('token_hash=h&type=signup')
    expect(adminWrites).toEqual([])
  })
})
