/**
 * Guard smoke — deleteOwnAccount + consumeEmailChangeToken (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle rows:
 *   - Self-delete + email reuse: hard-delete frees the auth identity (auth.admin.deleteUser
 *     called) + no false success on partial failure.
 *   - Email change: token consumed → email updated; expired/consumed/invalid token → typed error.
 *
 * Key invariants:
 *   - deleteOwnAccount: calls auth.admin.deleteUser (frees email for reuse).
 *     If auth-delete fails, returns `profile_deleted_auth_failed` NOT success.
 *     If profile-delete fails, returns `delete_failed` and DOES NOT call auth.admin.deleteUser.
 *   - consumeEmailChangeToken: consumed_at check prevents double-use; expires_at check
 *     prevents stale tokens; auth.admin.updateUserById called on success.
 *
 * Planted-violation proof (deleteOwnAccount):
 *   Stub auth.admin.deleteUser to fail AND stub the action to return {} anyway →
 *   expect(result).toEqual({ error: 'profile_deleted_auth_failed' }) FAILS.
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

// next/server — for createServerClient (used in changeCabinetPassword only, not under test)
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

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
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: vi.fn().mockResolvedValue({ ok: true }),
}))

// Admin client: routes DB calls by table + auth.admin.*
const mockDeleteUser    = vi.fn()   // auth.admin.deleteUser
const mockUpdateUserById = vi.fn()  // auth.admin.updateUserById
const mockListUsers     = vi.fn()   // auth.admin.listUsers
const mockGetUserById   = vi.fn()   // auth.admin.getUserById
const mockSignOutGlobal = vi.fn()   // auth.admin.signOut
const mockAdminFrom     = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockAdminFrom(table),
    auth: {
      admin: {
        deleteUser:    (...a: unknown[]) => mockDeleteUser(...a),
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
function makeAdminFrom() {
  mockAdminFrom.mockImplementation((table: string) => {
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
  mockGetUser.mockResolvedValue({ id: USER_ID })
  makeAdminFrom()
  mockDeleteUser.mockResolvedValue({ error: null })
  mockUpdateUserById.mockResolvedValue({ error: null })
  mockListUsers.mockResolvedValue({ data: { users: [] } })
  mockGetUserById.mockResolvedValue({ data: { user: { email: 'old@example.com' } } })
  mockSignOutGlobal.mockResolvedValue({})
})

// ── deleteOwnAccount ──────────────────────────────────────────────────────────

describe('deleteOwnAccount — smoke tests (Task 441)', () => {
  it('happy path: deletes profile + auth identity, returns {}', async () => {
    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount()

    expect(result).toEqual({})
    // auth.admin.deleteUser MUST be called — this frees the email for future signups (Task 439)
    expect(mockDeleteUser).toHaveBeenCalledWith(USER_ID)
  })

  it('auth-delete fail → { error: "profile_deleted_auth_failed" } — NOT false success', async () => {
    mockDeleteUser.mockResolvedValue({ error: { message: 'Auth user not found', status: 404 } })

    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount()

    // Guard: partial failure MUST be surfaced — email is NOT freed, UI must NOT show success.
    // This is the Task 439 fix invariant: no false success on auth-delete failure.
    expect(result).toEqual({ error: 'profile_deleted_auth_failed' })
  })

  it('profile-delete fail → { error: "delete_failed" }, auth.admin.deleteUser NOT called', async () => {
    // Simulate profile row delete failing
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'listings') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          not: vi.fn().mockReturnThis(),
          then: (res: (v: { data: null }) => unknown) => Promise.resolve({ data: null }).then(res),
        }
      }
      if (table === 'users') {
        return {
          delete: () => ({
            eq: () => Promise.resolve({ error: { message: 'FK violation', code: '23503' } }),
          }),
        }
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    })

    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount()

    expect(result).toEqual({ error: 'delete_failed' })
    // Auth identity must NOT be deleted when profile delete failed
    expect(mockDeleteUser).not.toHaveBeenCalled()
  })

  it('unauthorized → { error: "Unauthorized" }', async () => {
    mockGetUser.mockResolvedValue(null)

    const { deleteOwnAccount } = await import('../index')
    const result = await deleteOwnAccount()

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockDeleteUser).not.toHaveBeenCalled()
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
              is: () => Promise.resolve({ error: null }),
            }),
          }),
        }
      }
      if (table === 'users') {
        return {
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
