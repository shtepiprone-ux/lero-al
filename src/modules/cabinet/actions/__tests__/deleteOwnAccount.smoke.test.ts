/**
 * Guard smoke — deleteOwnAccount + consumeEmailChangeToken (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle rows:
 *   - Self-delete + email reuse: the one complete deletion (`deleteAccount`) frees the auth identity
 *     + no false success when it fails.
 *   - Email change: token consumed → email updated; expired/consumed/invalid token → typed error.
 *
 * Key invariants:
 *   - deleteOwnAccount: after the re-authentication it calls `deleteAccount(userId, { reason: 'self' })` once (Task 923 R142: the Auth user, the profile, the listings and
 *     their files go together, which frees the email for reuse). If `deleteAccount` fails the answer is `delete_failed`, never success; before the proof nothing is called.
 *   - consumeEmailChangeToken: consumed_at check prevents double-use; expires_at check
 *     prevents stale tokens; auth.admin.updateUserById called on success.
 *
 * Planted-violation proof (deleteOwnAccount):
 *   Stub `deleteAccount` to fail AND stub the action to return {} anyway →
 *   expect(result).toEqual({ error: 'delete_failed' }) FAILS.
 *   Revert → PASS.
 *
 * Planted-violation proof (consumeEmailChangeToken):
 *   Remove the `if (token.consumed_at) return { ... errorCode: 'consumed' }` guard →
 *   the "already-consumed" test FAILS (proceeds to double-update). Revert → PASS.
 *
 * Command: npx vitest run src/modules/cabinet/actions/__tests__/deleteOwnAccount.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

// next/headers: imported at top of cabinet/actions/index.ts but not called by deleteOwnAccount
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: () => null }),
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))

// The SDK's verify client (Task 923 R70 (a), R81 (e)): the deletion and the e-mail change check the current password with it. Every former assertion of this file stays;
// only the doubles changed: the account has a password, the check accepts it, the failed-attempt table is empty, and the token claim and the pending address are readable.
const verifyClient = vi.hoisted(() => ({ auth: { signInWithPassword: async () => ({ error: null }), signOut: async () => ({ error: null }) } }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => verifyClient),
}))
const PASSWORD = 'Right-Passw0rd!'

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

vi.mock('@/lib/auth/blockCheck', () => ({
  getBlockedError: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/passwordRules', () => ({
  allPasswordRulesMet: vi.fn().mockReturnValue(true),
}))

vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({
  sendEmailChangeEmails: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({
  sendPasswordChangedEmail: vi.fn().mockResolvedValue({}),
}))
// The one deletion (Task 923 R141, R142): the cabinet action only calls it, after the proof
const mockDeleteAccount = vi.fn()
vi.mock('@/lib/account/deleteAccount', () => ({
  deleteAccount: (...a: unknown[]) => mockDeleteAccount(...a),
}))

// Admin client: routes DB calls by table + auth.admin.*
const mockUpdateUserById = vi.fn()  // auth.admin.updateUserById
const mockListUsers     = vi.fn()   // auth.admin.listUsers
const mockGetUserById   = vi.fn()   // auth.admin.getUserById
const mockSignOutGlobal = vi.fn()   // auth.admin.signOut
const mockAdminFrom     = vi.fn()
const mockRpc           = vi.fn()   // end_user_sessions (R66 (d))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockAdminFrom(table),
    rpc: (...a: unknown[]) => (a[0] === 'account_has_password' ? { data: true, error: null } : mockRpc(...a)),
    auth: {
      admin: {
        updateUserById: (...a: unknown[]) => mockUpdateUserById(...a),
        listUsers:     (...a: unknown[]) => mockListUsers(...a),
        getUserById:   (...a: unknown[]) => mockGetUserById(...a),
        signOut:       (...a: unknown[]) => mockSignOutGlobal(...a),
      },
    },
  })),
}))

// User-scope Supabase (used by other functions in the file, not under test)
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }),
    auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }) },
  }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID = 'user-cabinet-1'

// Shared admin from() router: listings + users + email_change_tokens tables
/** `reauth_failures` (Task 923 R81 (b)): nobody has failed attempts in this file */
const reauthFailures = () => ({
  select: () => ({ eq: () => ({ gte: () => Promise.resolve({ count: 0, error: null }) }) }),
  insert: () => Promise.resolve({ error: null }),
})

function makeAdminFrom() {
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'reauth_failures') return reauthFailures()
    if (table === 'listings') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        // Returns empty: no listings to archive
        then: (res: (v: { data: null }) => unknown) => Promise.resolve({ data: null }).then(res),
        [Symbol.iterator]: undefined,
      }
    }
    if (table === 'users') {
      return {
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        update: () => ({ eq: () => ({ is: () => Promise.resolve({ error: null }) }) }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { name: 'Test User' } }),
      }
    }
    if (table === 'email_change_tokens') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
        count: 0,
      }
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
    }
  })
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: USER_ID, email: 'person@example.com' })
  makeAdminFrom()
  mockDeleteAccount.mockResolvedValue({ ok: true, filesNotRemoved: 0 })
  mockUpdateUserById.mockResolvedValue({ error: null })
  mockListUsers.mockResolvedValue({ data: { users: [] } })
  mockGetUserById.mockResolvedValue({ data: { user: { email: 'old@example.com', app_metadata: { providers: ['email'] } } } })
  mockSignOutGlobal.mockResolvedValue({})
  mockRpc.mockResolvedValue({ data: null, error: null })
})

// ── deleteOwnAccount ──────────────────────────────────────────────────────────

describe('deleteOwnAccount — smoke tests (Task 441; Task 923 R142)', () => {
  it('happy path: the proof passes, deleteAccount(own id, { reason: "self" }) runs once, returns {}', async () => {
    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount({ password: PASSWORD })

    expect(result).toEqual({})
    // the Auth user and the profile go in one deletion — this frees the email for future signups (Task 439)
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1)
    expect(mockDeleteAccount).toHaveBeenCalledWith(USER_ID, { reason: 'self' })
  })

  it('deleteAccount fails → { error: "delete_failed" } — NOT false success', async () => {
    mockDeleteAccount.mockResolvedValue({ ok: false, error: 'delete_failed' })

    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount({ password: PASSWORD })

    // Guard: a failed deletion MUST be surfaced, and there is no half-deleted answer any more: the UI must NOT show success.
    expect(result).toEqual({ error: 'delete_failed' })
  })

  it('a file that could not be removed does not fail the deletion', async () => {
    mockDeleteAccount.mockResolvedValue({ ok: true, filesNotRemoved: 2 })

    const { deleteOwnAccount } = await import('../index')
    expect(await deleteOwnAccount({ password: PASSWORD })).toEqual({})
  })

  it('unauthorized → { error: "Unauthorized" }', async () => {
    mockGetUser.mockResolvedValue(null)

    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount()

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockDeleteAccount).not.toHaveBeenCalled()
  })

  it('no password → { error: "invalid_password" } and deleteAccount is NOT called', async () => {
    const { deleteOwnAccount } = await import('../index')
    expect(await deleteOwnAccount()).toEqual({ error: 'invalid_password' })
    expect(mockDeleteAccount).not.toHaveBeenCalled()
  })
})

// ── consumeEmailChangeToken ───────────────────────────────────────────────────

describe('consumeEmailChangeToken — smoke tests (Task 441)', () => {
  const NOW = new Date()
  const FUTURE = new Date(NOW.getTime() + 3600_000).toISOString()
  const PAST   = new Date(NOW.getTime() - 3600_000).toISOString()

  const VALID_TOKEN_ROW: {
    id: string; user_id: string; new_email: string; token_hash: string;
    expires_at: string; consumed_at: string | null
  } = {
    id: 'tok-1',
    user_id: 'user-2',
    new_email: 'new@example.com',
    token_hash: 'the-hash',
    expires_at: FUTURE,
    consumed_at: null,
  }

  function makeEmailChangeAdminFrom(tokenRow: typeof VALID_TOKEN_ROW | null) {
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'email_change_tokens') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({ data: tokenRow }),
            }),
          }),
          update: () => ({
            eq: () => ({
              is: () => ({ select: () => Promise.resolve({ data: [{ id: tokenRow?.id }], error: null }) }),
            }),
          }),
        }
      }
      if (table === 'users') {
        return {
          select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { pending_email: tokenRow?.new_email }, error: null }) }) }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    })
  }

  it('happy path: valid token → email updated, auth identity updated, { success: true }', async () => {
    makeEmailChangeAdminFrom(VALID_TOKEN_ROW)

    const { consumeEmailChangeToken } = await import('../index')
    const result = await consumeEmailChangeToken('raw-token-value')

    expect(result).toEqual({ success: true })
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      VALID_TOKEN_ROW.user_id,
      expect.objectContaining({ email: VALID_TOKEN_ROW.new_email, email_confirm: true }),
    )
  })

  it('invalid token (not found) → { error: "invalid_link", errorCode: "invalid" }', async () => {
    makeEmailChangeAdminFrom(null)    // no row found

    const { consumeEmailChangeToken } = await import('../index')
    const result = await consumeEmailChangeToken('nonexistent-token')

    expect(result).toMatchObject({ errorCode: 'invalid' })
    expect(mockUpdateUserById).not.toHaveBeenCalled()
  })

  it('already consumed → { errorCode: "consumed" } without updating email', async () => {
    makeEmailChangeAdminFrom({ ...VALID_TOKEN_ROW, consumed_at: PAST })

    const { consumeEmailChangeToken } = await import('../index')
    const result = await consumeEmailChangeToken('raw-token-value')

    expect(result).toMatchObject({ errorCode: 'consumed' })
    expect(mockUpdateUserById).not.toHaveBeenCalled()
  })

  it('expired token → { errorCode: "expired" } without updating email', async () => {
    makeEmailChangeAdminFrom({ ...VALID_TOKEN_ROW, expires_at: PAST })

    const { consumeEmailChangeToken } = await import('../index')
    const result = await consumeEmailChangeToken('raw-token-value')

    expect(result).toMatchObject({ errorCode: 'expired' })
    expect(mockUpdateUserById).not.toHaveBeenCalled()
  })
})
