// @vitest-environment node
/**
 * Security (Task 923 R70 (b), R156): the password change reads the answer of its sign-out.
 *  - SEC-X-SRV-SIGNOUT-OTHERS: the SDK answers `{ error }` instead of throwing; a failed sign-out of the other sessions is reported as `sessions_not_ended` (the password
 *    HAS changed, the e-mail notice still goes out) and is never presented as a full success.
 * The REAL action runs. Auth, the SDK's verify client and the mail are doubles.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  signOutAnswer: 'ok' as 'ok' | 'error' | 'throw',
  signOuts: [] as unknown[],
  sessionSignOuts: [] as unknown[],
  passwordUpdates: [] as Record<string, unknown>[],
  notices: [] as unknown[],
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    // `reauth_failures` (Task 923 R81 (b)): nobody has failed attempts in these tests; every other table answers the greeting read
    from: (table: string) => table === 'reauth_failures'
      ? { select: () => ({ eq: () => ({ gte: async () => ({ count: 0, error: null }) }) }), insert: async () => ({ error: null }) }
      : { select: () => ({ eq: () => ({ single: async () => ({ data: { name: 'Person' }, error: null }) }) }) },
    auth: { admin: { updateUserById: async (_id: string, attrs: Record<string, unknown>) => { state.passwordUpdates.push(attrs); return { data: {}, error: null } } } },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signOut: async (options: unknown) => {
        state.sessionSignOuts.push(options)
        if (state.signOutAnswer === 'throw') throw new Error('offline')
        return { error: state.signOutAnswer === 'error' ? { message: 'session not found', status: 500 } : null }
      },
    },
  }),
}))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'user-1', email: 'person@example.com' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithPassword: async () => ({ error: null }),
      signOut: async (options: unknown) => {
        state.signOuts.push(options)
        if (state.signOutAnswer === 'throw') throw new Error('offline')
        return { error: state.signOutAnswer === 'error' ? { message: 'session not found', status: 500 } : null }
      },
    },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async (args: unknown) => { state.notices.push(args) } }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { changeCabinetPassword } from '../index'

const input = { currentPassword: 'OldPassw0rd!', newPassword: 'NewStr0ng!Passw0rd' }

beforeEach(() => {
  state.signOutAnswer = 'ok'
  state.signOuts.length = 0
  state.sessionSignOuts.length = 0
  state.passwordUpdates.length = 0
  state.notices.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('changePassword', () => {
  it('[SEC-X-SRV-SIGNOUT-OTHERS] a failed sign-out of other devices is reported', async () => {
    // the SDK's own way of failing: an `{ error }` answer, no throw
    state.signOutAnswer = 'error'
    expect(await changeCabinetPassword(input)).toEqual({ ok: false, reason: 'sessions_not_ended' })
    expect(state.passwordUpdates, 'the password did change').toEqual([{ password: input.newPassword }])
    expect(state.notices, 'the notice of the change still goes out').toHaveLength(1)
    expect(state.sessionSignOuts).toEqual([{ scope: 'global' }])
    expect(state.signOuts).toEqual([])
    // a throw is reported the same way
    state.signOutAnswer = 'throw'
    expect(await changeCabinetPassword(input)).toEqual({ ok: false, reason: 'sessions_not_ended' })
    // a clean sign-out is a plain success
    state.signOutAnswer = 'ok'
    expect(await changeCabinetPassword(input)).toEqual({ ok: true })
  })

  it('a refused change never reaches the sign-out, so it cannot be reported as one', async () => {
    state.signOutAnswer = 'error'
    expect(await changeCabinetPassword({ currentPassword: 'same-Passw0rd!', newPassword: 'same-Passw0rd!' })).toEqual({ ok: false, reason: 'same_password' })
    expect(state.sessionSignOuts).toEqual([])
    expect(state.signOuts).toEqual([])
    expect(state.passwordUpdates).toEqual([])
  })
})
