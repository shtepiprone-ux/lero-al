// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S9): the website saved on an agent profile is later put into a link that an administrator clicks. A `javascript:` value
 * written by a moderator would run in the administrator's session. Only https addresses are stored: the `users` CHECK of hardening v8b (Task 956) requires the `https://` prefix.
 * Task 956 AC13: the administrator never has to type the scheme, so `lero.al`, `https://lero.al` and `http://lero.al` are stored alike as `https://lero.al/`; `javascript:` and `data:` stay refused.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'staff-1' }) }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'moderator' } }) }) }) }) }),
}))

const written: { table: string; op: string; values: Record<string, unknown> }[] = []
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.eq = () => chain
      // the rank read (Task 923 R66 (a), fail-closed): the acting moderator and an ordinary target, answered for exactly the ids that were asked for
      let rankIds: string[] | null = null
      chain.in = (_column: string, ids: string[]) => { rankIds = ids; return chain }
      chain.single = async () => ({ data: { role: 'user', user_type: 'private', status: 'active' } })
      // the acting moderator's own row, read by the real `requireViewer()` (Task 923 R44)
      chain.maybeSingle = async () => ({ data: { role: 'moderator', status: 'active', suspended_until: null, deleted_at: null }, error: null })
      chain.update = (values: Record<string, unknown>) => { written.push({ table, op: 'update', values }); return chain }
      chain.upsert = (values: Record<string, unknown>) => { written.push({ table, op: 'upsert', values }); return Promise.resolve({ error: null }) }
      chain.insert = (values: Record<string, unknown>) => { written.push({ table, op: 'insert', values }); return Promise.resolve({ error: null }) }
      chain.then = (resolve: (v: unknown) => void) => resolve(
        table === 'users' && rankIds
          ? { error: null, data: rankIds.map((id) => ({ id, role: id === 'staff-1' ? 'moderator' : 'user' })) }
          : { error: null, data: null },
      )
      return chain
    },
    // Task 923 R159: a staff-made account is invited (the double answers as `createUser` did); `createUser` and `generateLink` are no longer called, so neither is defined
    auth: { admin: { inviteUserByEmail: async () => ({ data: { user: { id: 'new-user' } }, error: null }), deleteUser: async () => ({}) } },
  }),
}))
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: async () => false,
  assertPermission: async () => undefined,
  roleHasPermission: async (_role: string, key: string) => key === 'users.edit',   // the acting moderator holds the key of the full profile form (Task 923 R75)
}))
// This suite is about the website field; the Auth ban that follows a status change is tested in ../accountBan.security.test.ts (ids here are not UUIDs)
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }))

import { createAdminUser, updateUserProfileFull } from '../index'
import { displayWebsite } from '@/lib/security/safeUrl'

const BASE = { firstName: 'Alba', phone: '+355691234567', locationId: 1, profileType: 'agent' as const, companyName: 'Agency', status: 'active' as const }
const userWrites = () => written.filter((w) => w.table === 'users' && (w.op === 'update' || w.op === 'upsert'))

beforeEach(() => { written.length = 0; vi.spyOn(console, 'error').mockImplementation(() => {}) })

/** the three ways to type one address (Task 956 AC13) */
const THREE_FORMS = ['lero.al', 'https://lero.al', 'http://lero.al']

const ATTACKS = ['javascript:alert(document.cookie)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', '//evil.example', 'https://user:pw@evil.example/']

describe('updateUserProfileFull', () => {
  it.each(ATTACKS)('refuses the website %j and writes nothing', async (website) => {
    const res = await updateUserProfileFull('u1', { ...BASE, website })
    expect(res).toEqual({ error: 'invalid_website' })
    expect(userWrites()).toEqual([])
  })

  it('stores a valid address in its normalised form', async () => {
    const res = await updateUserProfileFull('u1', { ...BASE, website: 'https://agency.example/team' })
    expect(res.error).toBeUndefined()
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBe('https://agency.example/team')
  })

  it('stores a bare host as https', async () => {
    await updateUserProfileFull('u1', { ...BASE, website: 'agency.example' })
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBe('https://agency.example/')
  })

  // Task 956 AC13: the administrator types a host; the scheme is never asked for, so the three spellings are one address, stored as https (the database holds https addresses only)
  it.each(THREE_FORMS)('stores %j as https://lero.al/ (the same address however it is typed)', async (typed) => {
    const res = await updateUserProfileFull('u1', { ...BASE, website: typed })
    expect(res.error).toBeUndefined()
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBe('https://lero.al/')
  })

  it('an http address is stored as https and keeps its path and query', async () => {
    await updateUserProfileFull('u1', { ...BASE, website: 'http://agency.example/team?x=1' })
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBe('https://agency.example/team?x=1')
  })

  it('saving the field again with what the form shows (lero.al) changes nothing: the stored value is the same string', async () => {
    await updateUserProfileFull('u1', { ...BASE, website: 'lero.al' })
    const first = userWrites().find((w) => w.op === 'update')?.values.website
    written.length = 0
    await updateUserProfileFull('u1', { ...BASE, website: displayWebsite(first as string) })
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBe(first)
    expect(first).toBe('https://lero.al/')
  })

  it('the 200 character bound holds after the normalisation (an http address gains one character)', async () => {
    // `http://` + 191 characters of host = 198 characters typed, `https://` + host + `/` = 200 stored
    const host = `${'a'.repeat(188)}.al`
    expect(`https://${host}/`).toHaveLength(200)
    expect((await updateUserProfileFull('u1', { ...BASE, website: `http://${host}` })).error).toBeUndefined()
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBe(`https://${host}/`)
    written.length = 0
    expect(await updateUserProfileFull('u1', { ...BASE, website: `http://a${host}` })).toEqual({ error: 'invalid_website' })
    expect(userWrites()).toEqual([])
  })

  it('an http script address is still refused: javascript: and data: after http-looking text', async () => {
    for (const website of ['http://javascript:alert(1)', 'http://user:pw@evil.example/']) {
      expect(await updateUserProfileFull('u1', { ...BASE, website }), website).toEqual({ error: 'invalid_website' })
    }
    expect(userWrites()).toEqual([])
  })

  it('an empty website is stored as nothing', async () => {
    await updateUserProfileFull('u1', { ...BASE, website: '   ' })
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBeNull()
  })

  it('a private profile stores no website at all, whatever was sent', async () => {
    await updateUserProfileFull('u1', { ...BASE, profileType: 'private', website: 'https://agency.example' })
    expect(userWrites().find((w) => w.op === 'update')?.values.website).toBeNull()
  })

  it('a private profile is not refused for a script value it will not store', async () => {
    const res = await updateUserProfileFull('u1', { ...BASE, profileType: 'private', website: 'javascript:alert(1)' })
    expect(res.error).toBeUndefined()
  })
})

describe('createAdminUser', () => {
  const NEW = { ...BASE, email: 'agent@example.com' }

  it.each(ATTACKS)('refuses the website %j before creating the account', async (website) => {
    const res = await createAdminUser({ ...NEW, website })
    expect(res).toEqual({ error: 'invalid_website' })
    expect(written).toEqual([])
  })

  it('stores a valid address', async () => {
    const res = await createAdminUser({ ...NEW, website: 'https://agency.example' })
    expect(res.error).toBeUndefined()
    expect(userWrites().find((w) => w.op === 'upsert')?.values.website).toBe('https://agency.example/')
  })

  it.each(THREE_FORMS)('stores %j as https://lero.al/ (the same address however it is typed)', async (typed) => {
    const res = await createAdminUser({ ...NEW, website: typed })
    expect(res.error).toBeUndefined()
    expect(userWrites().find((w) => w.op === 'upsert')?.values.website).toBe('https://lero.al/')
  })
})
