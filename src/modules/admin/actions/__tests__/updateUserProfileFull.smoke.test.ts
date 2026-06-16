/**
 * Guard 1 smoke — updateUserProfileFull: status/account-type change writes history rows (Task 448).
 *
 * Covers the critical-flow-registry.md row:
 *   "User status / role / account-type change" — happy path (history row written) + permission denied.
 *
 * This is the MISSING Guard 1 flow from Task 436: *creating* history entries on a user
 * status or profile-type change, distinct from *clearing* them (clearHistory.smoke.test.ts).
 *
 * Key assertions:
 *   - Status change → `user_status_history` INSERT is called with old_status / new_status.
 *   - Profile-type change → `user_change_log` INSERT is called with field_name / old_value / new_value.
 *   - Non-admin/moderator → `{ error: 'Forbidden' }` without touching the DB.
 *
 * Planted-violation proof (paste in session log):
 *   Change OLD_USER.status in the beforeEach to match the new status in the "status change" test
 *   (both 'blocked') → if (oldUser.status !== data.status) is FALSE → mockStatusHistoryInsert
 *   NOT called → expect(mockStatusHistoryInsert).toHaveBeenCalled() FAILS.
 *   Revert to OLD_USER.status = 'active' → PASS.
 *
 * Command: npx vitest run src/modules/admin/actions/__tests__/updateUserProfileFull.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

// User-scoped supabase: used to read the calling admin's own role
const mockMyProfileSingle = vi.fn()
const myProfileChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mockMyProfileSingle,
}
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// Admin client: reads old user state, writes user row, writes history tables
const mockOldUserSingle = vi.fn()
const mockStatusHistoryInsert = vi.fn()
const mockChangeLogInsert = vi.fn()
const mockAdminFrom = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => mockAdminFrom(table),
    auth: { admin: { createUser: vi.fn(), deleteUser: vi.fn(), generateLink: vi.fn() } },
  })),
}))

const mockRoleHasPermission = vi.fn()
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: vi.fn().mockResolvedValue(false),
  assertPermission: vi.fn().mockResolvedValue(undefined),
  roleHasPermission: (...args: unknown[]) => mockRoleHasPermission(...args),
}))

// Side-effect prevention — not under test but imported by the same file
vi.mock('@/modules/notifications/lib/mutations', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: vi.fn().mockResolvedValue({ ok: true }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CALLING_ADMIN_ID = 'calling-admin-1'
const TARGET_USER_ID   = 'target-user-1'

/** Old user state stored in the DB: private user, currently active. */
const OLD_USER = { role: 'user', user_type: 'private', status: 'active' } as const

/** Minimum valid data that does NOT change status or profileType vs OLD_USER. */
const BASE_DATA = {
  firstName:   'Test',
  lastName:    'User',
  profileType: 'private' as const,  // matches profileTypeFromDb(OLD_USER.role, OLD_USER.user_type)
  phone:       '+355601234567',
  locationId:  1,
  status:      'active' as const,   // matches OLD_USER.status → no status history written
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // Calling admin session
  mockGetUser.mockResolvedValue({ id: CALLING_ADMIN_ID })

  // Admin's own role (user-scoped client)
  mockMyProfileSingle.mockResolvedValue({ data: { role: 'admin' } })
  mockCreateClient.mockResolvedValue({ from: () => myProfileChain })

  // Admin has role-change permission
  mockRoleHasPermission.mockResolvedValue(true)

  // Current DB state of the target user
  mockOldUserSingle.mockResolvedValue({ data: OLD_USER })

  // History inserts succeed by default
  mockStatusHistoryInsert.mockResolvedValue({ error: null })
  mockChangeLogInsert.mockResolvedValue({ error: null })

  // Route admin from() calls by table name:
  //   'users' → select chain (read old user) OR update chain (write user row)
  //   'user_change_log' / 'user_status_history' → insert chain (trackable)
  mockAdminFrom.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: () => ({ eq: () => ({ single: mockOldUserSingle }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    if (table === 'user_change_log')   return { insert: mockChangeLogInsert }
    if (table === 'user_status_history') return { insert: mockStatusHistoryInsert }
    // Other tables (listings, etc.) used by other functions in the same file
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null }),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('updateUserProfileFull — smoke tests (Guard 1, Task 448)', () => {
  it('happy path — status change writes a user_status_history row', async () => {
    const { updateUserProfileFull } = await import('../index')
    const result = await updateUserProfileFull(TARGET_USER_ID, {
      ...BASE_DATA,
      status: 'blocked',        // different from OLD_USER.status ('active') → writes history
      blockReason: 'Spam listings',
    })

    expect(result).toEqual({})
    // The action MUST write a history row when status changes — this is the key regression guard.
    // If the insert is removed or the branch condition is wrong, this assertion FAILS.
    expect(mockStatusHistoryInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id:    TARGET_USER_ID,
      old_status: 'active',
      new_status: 'blocked',
      changed_by: CALLING_ADMIN_ID,
    }))
  })

  it('happy path — account-type (profileType) change writes a user_change_log row', async () => {
    const { updateUserProfileFull } = await import('../index')
    const result = await updateUserProfileFull(TARGET_USER_ID, {
      ...BASE_DATA,
      profileType: 'agent',     // different from OLD_USER profileType ('private') → writes log
    })

    expect(result).toEqual({})
    // The action MUST write a change log row when profile type changes.
    expect(mockChangeLogInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id:    TARGET_USER_ID,
      changed_by: CALLING_ADMIN_ID,
      field_name: 'profile_type',
      old_value:  'private',
      new_value:  'agent',
    }))
  })

  it('no history row when status is unchanged', async () => {
    const { updateUserProfileFull } = await import('../index')
    // BASE_DATA.status === OLD_USER.status === 'active' → branch skipped
    const result = await updateUserProfileFull(TARGET_USER_ID, BASE_DATA)

    expect(result).toEqual({})
    expect(mockStatusHistoryInsert).not.toHaveBeenCalled()
  })

  it('forbidden — non-admin/moderator caller returns { error: "Forbidden" }', async () => {
    mockMyProfileSingle.mockResolvedValue({ data: { role: 'user' } })

    const { updateUserProfileFull } = await import('../index')
    const result = await updateUserProfileFull(TARGET_USER_ID, BASE_DATA)

    expect(result).toEqual({ error: 'Forbidden' })
    // Must NOT reach the DB write for forbidden callers
    expect(mockStatusHistoryInsert).not.toHaveBeenCalled()
    expect(mockChangeLogInsert).not.toHaveBeenCalled()
  })

  it('unauthorized — no session returns { error: "Unauthorized" }', async () => {
    mockGetUser.mockResolvedValue(null)

    const { updateUserProfileFull } = await import('../index')
    const result = await updateUserProfileFull(TARGET_USER_ID, BASE_DATA)

    expect(result).toEqual({ error: 'Unauthorized' })
  })
})
