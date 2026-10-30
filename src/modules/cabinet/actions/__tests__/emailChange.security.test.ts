// @vitest-environment node
/**
 * Security (Task 923 R66 (d)): the life of an e-mail change link.
 *  - SEC-X-SRV-EMAIL-TOKEN-ONCE: a link whose claim matched no row (another visit used it a moment earlier) changes nothing;
 *  - SEC-X-SRV-EMAIL-TOKEN-LATEST: an earlier link is dead once a newer request exists (the new request retires it; a link whose address is not the pending one is refused);
 *  - SEC-X-SRV-EMAIL-SESSIONS-END: a completed change ends every session of the account and clears the pending address, a failed Auth update releases the claim so
 *    the link stays usable;
 *  - SEC-X-SRV-EMAIL-RESEND-LIMIT: a resend counts toward the 3-per-hour limit, a count that cannot be read refuses, and a resend is a NEW link.
 * The REAL actions run against the in-memory database double; Auth, the RPC `end_user_sessions` and `admin_search_users_by_email`, the SDK's verify client and the
 * mail are doubles.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({
  rpcs: [] as { name: string; args: unknown }[],
  rpcAnswers: {} as Record<string, { data: unknown; error: { message: string } | null }>,
  authUpdates: [] as { id: string; attrs: Record<string, unknown> }[],
  authUpdateFails: false,
  sent: [] as Record<string, unknown>[],
  otherUsers: [] as { id: string; email: string }[],
  raceOnClaim: false,
  failCount: false,
  failRetire: false,
  failPending: false,
}))

let db = createFakeDb()

function failingChain(error: { message: string; code?: string }): unknown {
  const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, count: null, error }) : chain), apply: () => chain })
  return chain
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'email_change_tokens' && state.failCount) return { select: () => failingChain({ message: 'count failed', code: 'XX000' }) }
      if (table === 'email_change_tokens' && state.failRetire) {
        const real = db.from(table) as Record<string, unknown>
        return { ...real, update: () => failingChain({ message: 'retire failed', code: 'XX000' }), select: real.select, insert: real.insert }
      }
      if (table === 'users' && state.failPending) {
        const real = db.from(table) as Record<string, unknown>
        return { ...real, update: () => failingChain({ message: 'pending failed', code: 'XX000' }) }
      }
      if (table === 'email_change_tokens' && state.raceOnClaim) {
        const real = db.from(table) as Record<string, unknown>
        const update = real.update as (v: unknown) => unknown
        // another visit used the link between this request's read and its claim: the row is consumed before the UPDATE runs
        return { ...real, update: (values: { consumed_at?: unknown }) => { if (values.consumed_at) for (const row of db.tables.email_change_tokens) row.consumed_at = row.consumed_at ?? '2026-01-01T00:00:00.000Z'; return update(values) } }
      }
      return db.from(table)
    },
    rpc: async (name: string, args: unknown) => {
      state.rpcs.push({ name, args })
      if (state.rpcAnswers[name]) return state.rpcAnswers[name]
      if (name === 'account_has_password') return { data: true, error: null }
      if (name === 'admin_search_users_by_email') return { data: state.otherUsers.map((u) => ({ id: u.id })), error: null }
      return { data: null, error: null }
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          const other = state.otherUsers.find((u) => u.id === id)
          return { data: { user: { id, email: other ? other.email : 'old@example.com', app_metadata: { providers: ['email'] } } }, error: null }
        },
        updateUserById: async (id: string, attrs: Record<string, unknown>) => {
          if (state.authUpdateFails) return { data: {}, error: { message: 'update refused', code: 'email_exists' } }
          state.authUpdates.push({ id, attrs })
          return { data: {}, error: null }
        },
      },
    },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getClaims: async () => ({ data: { claims: { amr: [] } }, error: null }) } }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'user-1', email: 'old@example.com' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { signInWithPassword: async () => ({ error: null }), signOut: async () => ({ error: null }) } }) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (args: Record<string, unknown>) => { state.sent.push(args) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { consumeEmailChangeToken, initiateEmailChange, resendEmailVerification } from '../index'

const tokenOf = (index: number) => new URL((state.sent[index] as { verificationUrl: string }).verificationUrl).searchParams.get('token')!
const request = (newEmail: string) => initiateEmailChange({ newEmail, locale: 'en', currentPassword: 'Right-Passw0rd!' })
const pending = () => db.tables.users.find((u) => u.id === 'user-1')?.pending_email

beforeEach(() => {
  db = createFakeDb({ users: [{ id: 'user-1', name: 'One', pending_email: null }], email_change_tokens: [] })
  state.rpcs.length = 0
  state.rpcAnswers = {}
  state.authUpdates.length = 0
  state.authUpdateFails = false
  state.sent.length = 0
  state.otherUsers = []
  state.raceOnClaim = false
  state.failCount = false
  state.failRetire = false
  state.failPending = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('emailChange', () => {
  it('[SEC-X-SRV-EMAIL-TOKEN-ONCE] a link whose claim matched no row changes nothing', async () => {
    expect(await request('new@example.com')).toEqual({ pendingEmail: 'new@example.com' })
    state.raceOnClaim = true
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ error: 'link_already_used', errorCode: 'consumed' })
    state.raceOnClaim = false
    expect(state.authUpdates, 'the address was not changed').toEqual([])
    expect(state.rpcs.filter((c) => c.name === 'end_user_sessions'), 'no session was ended').toEqual([])
    expect(pending(), 'the pending address stays').toBe('new@example.com')
    // and a plain second visit is refused as well: the link is used up
    db.tables.email_change_tokens[0].consumed_at = null
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ success: true })
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ error: 'link_already_used', errorCode: 'consumed' })
    expect(state.authUpdates).toHaveLength(1)
  })

  it('[SEC-X-SRV-EMAIL-TOKEN-LATEST] an earlier link is dead once a newer request exists', async () => {
    await request('first@example.com')
    await request('second@example.com')
    expect(pending()).toBe('second@example.com')
    // the first link was retired by the second request
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ error: 'link_already_used', errorCode: 'consumed' })
    // even a first link that somehow stayed live is refused: its address is not the pending one
    db.tables.email_change_tokens[0].consumed_at = null
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ error: 'invalid_link', errorCode: 'invalid' })
    expect(state.authUpdates, 'neither earlier link changed the address').toEqual([])
    // the newest link works
    expect(await consumeEmailChangeToken(tokenOf(1))).toEqual({ success: true })
    expect(state.authUpdates).toEqual([{ id: 'user-1', attrs: { email: 'second@example.com', email_confirm: true } }])
  })

  it('[SEC-X-SRV-EMAIL-SESSIONS-END] a completed change ends all sessions and a failed one keeps the link usable', async () => {
    await request('new@example.com')
    const token = tokenOf(0)
    // the Auth update is refused: the address did not change, no session ended, the claim is released
    state.authUpdateFails = true
    expect(await consumeEmailChangeToken(token)).toEqual({ error: 'email_update_failed' })
    expect(state.rpcs.filter((c) => c.name === 'end_user_sessions')).toEqual([])
    expect(db.tables.email_change_tokens[0].consumed_at, 'the claim is released').toBeNull()
    expect(pending(), 'the pending address stays').toBe('new@example.com')
    // the same link works once Auth accepts
    state.authUpdateFails = false
    expect(await consumeEmailChangeToken(token)).toEqual({ success: true })
    expect(state.rpcs.filter((c) => c.name === 'end_user_sessions')).toEqual([{ name: 'end_user_sessions', args: { p_user: 'user-1' } }])
    expect(pending(), 'the pending address is cleared').toBeNull()
    expect(db.tables.email_change_tokens[0].consumed_at).toBeTruthy()
  })

  it('a failure of the session end is reported, not hidden, and does not undo the change; a failed clear of the pending address is logged', async () => {
    await request('new@example.com')
    state.rpcAnswers.end_user_sessions = { data: null, error: { message: 'function does not exist' } }
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ success: true, sessionsEnded: false })
    expect(state.authUpdates).toHaveLength(1)
    expect(console.error).toHaveBeenCalledWith('consumeEmailChangeToken: the sessions of the account were not ended', { userId: 'user-1' })
    // the pending address cannot be cleared: the change is complete, the failure is logged with its code and nothing else leaks
    state.rpcAnswers = {}
    await request('later@example.com')
    state.failPending = true
    expect(await consumeEmailChangeToken(tokenOf(1))).toEqual({ success: true })
    expect(console.error).toHaveBeenCalledWith('consumeEmailChangeToken: clearing the pending address failed', { code: 'XX000' })
  })

  it('a link with a wrong, empty or non-text token, an unknown one, and an expired one change nothing', async () => {
    await request('new@example.com')
    expect(await consumeEmailChangeToken('')).toEqual({ error: 'invalid_link', errorCode: 'invalid' })
    expect(await consumeEmailChangeToken(undefined as never)).toEqual({ error: 'invalid_link', errorCode: 'invalid' })
    expect(await consumeEmailChangeToken('0'.repeat(64))).toEqual({ error: 'invalid_link', errorCode: 'invalid' })
    db.tables.email_change_tokens[0].expires_at = new Date(Date.now() - 1000).toISOString()
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ error: 'link_expired', errorCode: 'expired' })
    expect(state.authUpdates).toEqual([])
  })

  it('[SEC-X-SRV-EMAIL-RESEND-LIMIT] resend is limited and a failed count refuses', async () => {
    // an earlier request of this account (two hours old, the link still valid): it is not in the last hour, so it does not count
    const longAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    db.tables.email_change_tokens.push({ id: 'earlier', user_id: 'user-1', new_email: 'new@example.com', token_hash: 'c'.repeat(64), consumed_at: null, expires_at: new Date(Date.now() + 20 * 3600 * 1000).toISOString(), created_at: longAgo })
    db.tables.users[0].pending_email = 'new@example.com'
    // three resends fit in the hour; each is a NEW link and retires the one before it
    for (let i = 0; i < 3; i++) expect(await resendEmailVerification({ locale: 'en' })).toEqual({})
    expect(db.tables.email_change_tokens).toHaveLength(4)
    expect(db.tables.email_change_tokens.filter((t) => !t.consumed_at)).toHaveLength(1)
    expect(state.sent).toHaveLength(3)
    expect(await consumeEmailChangeToken(tokenOf(0))).toEqual({ error: 'link_already_used', errorCode: 'consumed' })
    // the fourth resend is refused and sends nothing; so is a new request (one limit for both)
    expect((await resendEmailVerification({ locale: 'en' })).error).toMatch(/Too many requests/)
    expect((await request('another@example.com')).error).toMatch(/Too many requests/)
    expect(db.tables.email_change_tokens, 'a refusal stores nothing').toHaveLength(4)
    expect(state.sent, 'a refusal sends nothing: no fourth e-mail').toHaveLength(3)
    // the newest link still works
    expect(await consumeEmailChangeToken(tokenOf(2))).toEqual({ success: true })
    // a count that cannot be read refuses as well, for both actions
    db = createFakeDb({ users: [{ id: 'user-1', pending_email: null }], email_change_tokens: [] })
    state.sent.length = 0
    state.failCount = true
    expect((await request('new@example.com')).error).toMatch(/Too many requests/)
    expect((await resendEmailVerification({ locale: 'en' })).error).toMatch(/Too many requests/)
    expect(db.tables.email_change_tokens).toEqual([])
    expect(state.sent, 'no e-mail after a failed count').toEqual([])
  })

  it('an address already used by another account is refused; the exact address is compared, not a substring; an RPC that fails refuses', async () => {
    state.otherUsers = [{ id: 'user-2', email: 'taken@example.com' }, { id: 'user-3', email: 'xtaken@example.com' }]
    expect((await request('taken@example.com')).error).toMatch(/already in use/)
    expect(state.rpcs.find((c) => c.name === 'admin_search_users_by_email')?.args).toEqual({ q: 'taken@example.com' })
    state.otherUsers = [{ id: 'user-3', email: 'xtaken@example.com' }]                   // only a longer address contains it: a different address
    expect(await request('taken@example.com')).toEqual({ pendingEmail: 'taken@example.com' })
    state.rpcAnswers.admin_search_users_by_email = { data: null, error: { message: 'rpc failed' } }
    const before = db.tables.email_change_tokens.length
    const refused = await request('other@example.com')
    expect(refused.pendingEmail).toBeUndefined()
    expect(refused.error).toBeTruthy()
    expect(db.tables.email_change_tokens).toHaveLength(before)
  })

  it('a failed retire of the earlier links or a failed store of the pending address refuses and sends nothing', async () => {
    state.failRetire = true
    expect((await request('new@example.com')).error).toBeTruthy()
    expect(state.sent).toEqual([])
    state.failRetire = false
    state.failPending = true
    expect((await request('new@example.com')).error).toBeTruthy()
    expect(state.sent).toEqual([])
  })
})
