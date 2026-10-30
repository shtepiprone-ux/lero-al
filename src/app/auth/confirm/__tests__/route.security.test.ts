// @vitest-environment node
/**
 * Security (Task 923 Revision 7, findings S5 / S14): GET /auth/confirm.
 * It must never redirect off the site, must refuse an unknown token type, must not log a person in without a valid one-time token, and must create the
 * profile with the least privilege (role `user`, unverified) whatever the sign-up metadata says.
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
      chain.update = (v: unknown) => { rec.op = 'update'; rec.values = v; writes.push(rec); return chain }
      chain.eq = (...a: unknown[]) => { rec.filters.push(a); return chain }
      chain.is = (...a: unknown[]) => { rec.filters.push(a); return Promise.resolve({}) }
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

describe('the profile created after a good token', () => {
  it('has the least privilege: role "user", not verified, private, whatever the metadata says', async () => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: { role: 'admin', is_verified: true, user_type: 'agent', full_name: 'Alba' } } } }
    await get('token_hash=h&type=signup')
    const upsert = writes.find((w) => w.op === 'upsert')
    expect(upsert?.table).toBe('users')
    expect(upsert?.values).toMatchObject({ id: 'u1', name: 'Alba', role: 'user', is_verified: false, user_type: 'private' })
  })

  it('an unknown preferred locale falls back to the default', async () => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: { preferred_locale: 'xx<script>' } } } }
    await get('token_hash=h&type=signup')
    expect(writes.find((w) => w.op === 'upsert')?.values).toMatchObject({ preferred_locale: 'sq' })
  })

  it('a supported preferred locale is kept', async () => {
    verifyResult = { error: null, data: { user: { id: 'u1', user_metadata: { preferred_locale: 'uk' } } } }
    await get('token_hash=h&type=signup')
    expect(writes.find((w) => w.op === 'upsert')?.values).toMatchObject({ preferred_locale: 'uk' })
  })
})
