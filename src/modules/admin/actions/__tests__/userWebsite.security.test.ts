// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S9): the website saved on an agent profile is later put into a link that an administrator clicks. A `javascript:` value
 * written by a moderator would run in the administrator's session. Only http(s) addresses are stored (a bare host such as `example.com` is stored as https).
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

const BASE = { firstName: 'Alba', phone: '+355691234567', locationId: 1, profileType: 'agent' as const, companyName: 'Agency', status: 'active' as const }
const userWrites = () => written.filter((w) => w.table === 'users' && (w.op === 'update' || w.op === 'upsert'))

beforeEach(() => { written.length = 0; vi.spyOn(console, 'error').mockImplementation(() => {}) })

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
})
