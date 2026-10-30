// @vitest-environment node
/**
 * Security (Task 923 R159, R66 (i), owner D93, case SEC-X-SRV-ADMIN-INVITE): a staff-made account is created by an invitation. The e-mailed link signs the person in and
 * opens the set-password page, so no temporary password exists and nothing guessable is generated. When the invitation fails the administrator gets an error, never a success.
 *
 * The action is the REAL `createAdminUser` with the REAL permission guards over an in-memory database. Doubles: the identity and the Auth admin API, whose every call is recorded
 * (it answers `inviteUserByEmail` as the real API does and would record a call to `createUser` or `generateLink`, which the action must no longer make). Every value is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

type AuthAnswer = { data: { user: { id: string } | null }; error: { message: string } | null }

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  calls: [] as { name: string; args: unknown[] }[],
  inviteAnswer: null as unknown as AuthAnswer,
}))

let db = createFakeDb()
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: db.from,
    auth: {
      admin: {
        inviteUserByEmail: async (...args: unknown[]) => { state.calls.push({ name: 'inviteUserByEmail', args }); return state.inviteAnswer },
        createUser: async (...args: unknown[]) => { state.calls.push({ name: 'createUser', args }); return { data: { user: { id: 'created-with-password' } }, error: null } },
        generateLink: async (...args: unknown[]) => { state.calls.push({ name: 'generateLink', args }); return { data: {}, error: null } },
        deleteUser: async (...args: unknown[]) => { state.calls.push({ name: 'deleteUser', args }); return { data: {}, error: null } },
      },
    },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@/lib/auth/accountAccess', async (orig) => ({ ...(await orig<typeof import('@/lib/auth/accountAccess')>()), syncAccountAccess: async () => ({ ok: true }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { createAdminUser } from '../index'

const ADMIN = '00000000-0000-4000-8000-0000000000a1'
const INVITED = '00000000-0000-4000-8000-0000000000b1'
const NEW_ACCOUNT = { firstName: '  Ana  ', lastName: 'Hoxha', email: 'ana@example.com', profileType: 'private' as const, phone: '+355691234567', locationId: 1 }

const authCalls = (name: string) => state.calls.filter((c) => c.name === name)
const profile = () => db.tables.users.find((u) => u.id === INVITED)

beforeEach(() => {
  db = createFakeDb({ users: [{ id: ADMIN, role: 'admin', user_type: 'private', name: 'Admin', status: 'active' }] })
  state.user = { id: ADMIN }
  state.calls = []
  state.inviteAnswer = { data: { user: { id: INVITED } }, error: null }
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('createAdminUser', () => {
  it('[SEC-X-SRV-ADMIN-INVITE] the new account is invited and a failed invitation is reported', async () => {
    const random = vi.spyOn(Math, 'random')

    // allow: one invitation to the given address, carrying the trimmed name and the set-password destination
    expect(await createAdminUser(NEW_ACCOUNT)).toEqual({ userId: INVITED })
    expect(state.calls.map((c) => c.name), 'one invitation and nothing else reached Auth').toEqual(['inviteUserByEmail'])
    const [email, options] = authCalls('inviteUserByEmail')[0].args as [string, { data: Record<string, unknown>; redirectTo: string }]
    expect(email).toBe('ana@example.com')
    expect(options.data).toEqual({ name: 'Ana' })
    expect(options.redirectTo).toMatch(/^https?:\/\/[^/]+\/auth\/callback\?next=\/sq\/auth\/reset-password$/)
    expect(Object.keys(options).sort(), 'no password (or any other field) is passed with the invitation').toEqual(['data', 'redirectTo'])
    expect(authCalls('createUser'), 'no account is created with a password').toEqual([])
    expect(authCalls('generateLink'), 'no unsent recovery link').toEqual([])
    expect(random, 'no Math.random value is drawn for the account').not.toHaveBeenCalled()
    expect(profile(), 'the staff-made profile is stored for the invited account').toMatchObject({ id: INVITED, name: 'Ana', last_name: 'Hoxha', phone: '+355691234567', role: 'user', status: 'active', is_verified: false })

    // deny: the invitation fails, so the error is returned, no success and no profile
    db = createFakeDb({ users: [{ id: ADMIN, role: 'admin', user_type: 'private', name: 'Admin', status: 'active' }] })
    state.calls = []
    state.inviteAnswer = { data: { user: null }, error: { message: 'Error sending invite email' } }
    expect(await createAdminUser(NEW_ACCOUNT), 'a failed invitation is create_failed').toEqual({ error: 'create_failed' })
    expect(db.tables.users.map((u) => u.id), 'no profile row exists for an account that was not invited').toEqual([ADMIN])

    // an address that already has an account keeps its own error
    state.inviteAnswer = { data: { user: null }, error: { message: 'A user with this email address has already been registered' } }
    expect(await createAdminUser(NEW_ACCOUNT)).toEqual({ error: 'email_already_exists' })
    expect(db.tables.users.map((u) => u.id)).toEqual([ADMIN])
    expect(authCalls('createUser')).toEqual([])
    expect(random).not.toHaveBeenCalled()
    random.mockRestore()
  })
})
