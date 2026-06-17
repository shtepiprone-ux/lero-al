/**
 * RLS write-path GUARD smoke — action-level permission guards (Task 444, Epic RS Slice 5).
 *
 * Covers one representative NEW-coverage action per guard archetype:
 *   A. Anon-allowed public write — submitContactInquiry (validation + rate-limit guard)
 *   B. Authenticated self-scoped write — updateCabinetProfile (user-scoped client + ownership)
 *   C. Admin/moderator write — createCurrency (assertAdmin guard)
 *   D. Admin-only (NOT moderator) — setModeratorPermission (admin-only guard)
 *
 * HONESTY DISCLAIMER: These tests assert action-level permission guards only (authn/authz/
 * client-boundary/ownership/diagnosability) via mocked Supabase. They do NOT assert live
 * Postgres RLS policy enforcement. DB-level RLS is a known gap → Slice 5b.
 *
 * Command: npx vitest run src/modules/__tests__/rls-write-guards.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any imports) ─────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockGetBlockedError = vi.fn()
vi.mock('@/lib/auth/blockCheck', () => ({
  getBlockedError: (...args: unknown[]) => mockGetBlockedError(...args),
}))

// User-scoped client — used by archetype B (updateCabinetProfile) and role checks
const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// Admin/service-role client — used by archetype A, C, D
const mockAdminAuth = { admin: { deleteUser: vi.fn(), createUser: vi.fn(), getUserById: vi.fn(), listUsers: vi.fn(), updateUserById: vi.fn(), generateLink: vi.fn() } }
const mockCreateAdminClient = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}))

// Permissions
vi.mock('@/lib/auth/permissions', () => ({
  hasPermission: vi.fn().mockResolvedValue(false),
  assertPermission: vi.fn().mockResolvedValue(undefined),
  roleHasPermission: vi.fn().mockReturnValue(false),
}))

// next/headers — used by submitContactInquiry for IP
const mockHeadersGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: (...args: unknown[]) => mockHeadersGet(...args) }),
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn(), get: vi.fn() }),
}))

// Email / notification stubs — prevent side effects
const mockSendContactNotification = vi.fn()
vi.mock('@/modules/notifications/lib/emails/contactInquiry', () => ({
  sendContactInquiryNotification: (...args: unknown[]) => mockSendContactNotification(...args),
  sendContactInquiryReply: vi.fn().mockResolvedValue({ ok: true }),
}))
vi.mock('@/modules/notifications/lib/mutations', () => ({
  createNotification: vi.fn().mockResolvedValue({}),
}))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({
  sendEmailChangeEmails: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({
  sendPasswordChangedEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: vi.fn().mockResolvedValue({ ok: true }),
}))
vi.mock('@/lib/passwordRules', () => ({
  allPasswordRulesMet: vi.fn().mockReturnValue(true),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_USER = { id: 'admin-user-1', email: 'admin@test.com' }
const REGULAR_USER = { id: 'regular-user-1', email: 'user@test.com' }

// ══════════════════════════════════════════════════════════════════════════════
// A. Anon-allowed public write — submitContactInquiry
// ══════════════════════════════════════════════════════════════════════════════

describe('Archetype A — submitContactInquiry (anon-allowed, validation + rate-limit guard)', () => {
  const mockContactInsert = vi.fn()
  const mockRateLimitSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockHeadersGet.mockImplementation((key: string) => {
      if (key === 'x-forwarded-for') return '1.2.3.4'
      return null
    })

    process.env.CONTACT_SUPPORT_EMAIL = 'support@test.com'

    mockSendContactNotification.mockResolvedValue({ ok: true })

    mockCreateAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'contact_inquiries') {
          return {
            insert: mockContactInsert,
            select: () => ({ eq: () => ({ gte: mockRateLimitSelect }) }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }
      },
      auth: mockAdminAuth,
    })

    mockContactInsert.mockResolvedValue({ error: null })
    mockRateLimitSelect.mockResolvedValue({ count: 0 })
  })

  it('positive — valid payload → insert called + email fired → {}', async () => {
    const { submitContactInquiry } = await import('@/modules/contacts/actions/index')
    const result = await submitContactInquiry({
      topic: 'support',
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message that is long enough to pass validation requirements.',
    })

    expect(result).toEqual({})
    expect(mockContactInsert).toHaveBeenCalledWith(expect.objectContaining({
      topic: 'support',
      name: 'Test User',
      email: 'test@example.com',
      status: 'new',
    }))
    expect(mockSendContactNotification).toHaveBeenCalled()
  })

  it('negative — invalid topic → { error: "validation" }, no insert', async () => {
    const { submitContactInquiry } = await import('@/modules/contacts/actions/index')
    const result = await submitContactInquiry({
      topic: 'nonexistent_topic',
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message that is long enough.',
    })

    expect(result).toEqual({ error: 'validation' })
    expect(mockContactInsert).not.toHaveBeenCalled()
    expect(mockSendContactNotification).not.toHaveBeenCalled()
  })

  it('negative — rate limited → { error: "rate_limited" }, no insert', async () => {
    mockRateLimitSelect.mockResolvedValue({ count: 5 })

    const { submitContactInquiry } = await import('@/modules/contacts/actions/index')
    const result = await submitContactInquiry({
      topic: 'support',
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message that is long enough to pass validation requirements.',
    })

    expect(result).toEqual({ error: 'rate_limited' })
    expect(mockContactInsert).not.toHaveBeenCalled()
  })

  it('diagnosability — insert failure → console.error with root cause', async () => {
    const insertError = { message: 'insert failed', code: '23505' }
    mockContactInsert.mockResolvedValue({ error: insertError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { submitContactInquiry } = await import('@/modules/contacts/actions/index')
    const result = await submitContactInquiry({
      topic: 'support',
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message that is long enough to pass validation requirements.',
    })

    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith('[contact-inquiry] insert failed', insertError)
    consoleSpy.mockRestore()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// B. Authenticated self-scoped write — updateCabinetProfile
// ══════════════════════════════════════════════════════════════════════════════

describe('Archetype B — updateCabinetProfile (authenticated self-scoped, user-scoped client)', () => {
  const mockUserUpdate = vi.fn()
  const mockCurrencySelect = vi.fn()

  const VALID_PROFILE = {
    name: 'Test User',
    phone: '+355601234567',
    companyName: null,
    userType: 'private' as const,
    locationId: 1,
    preferredCurrency: 'ALL' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue(REGULAR_USER)
    mockGetBlockedError.mockResolvedValue(null)

    mockUserUpdate.mockResolvedValue({ error: null })
    mockCurrencySelect.mockResolvedValue({ data: [{ code: 'ALL' }, { code: 'EUR' }] })

    // User-scoped client — this is what updateCabinetProfile MUST use
    mockCreateClient.mockResolvedValue({
      from: (table: string) => {
        if (table === 'users') {
          return {
            update: () => ({ eq: mockUserUpdate }),
          }
        }
        if (table === 'currencies') {
          return {
            select: () => ({ eq: mockCurrencySelect }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }
      },
    })

    // Admin client should NOT be used for the profile mutation
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
      auth: mockAdminAuth,
    })
  })

  it('positive — authenticated user → update via user-scoped client, anchored to caller id → {}', async () => {
    const { updateCabinetProfile } = await import('@/modules/cabinet/actions/index')
    const result = await updateCabinetProfile(VALID_PROFILE)

    expect(result).toEqual({})

    // Client-boundary invariant: update happened on user-scoped client
    expect(mockCreateClient).toHaveBeenCalled()
    expect(mockUserUpdate).toHaveBeenCalledWith('id', REGULAR_USER.id)

    // Admin client was NOT used for the mutation (it may be imported but must not mutate)
    const adminFromCalls = mockCreateAdminClient.mock.results
      .flatMap(r => (r.value?.from as ReturnType<typeof vi.fn>)?.mock?.calls ?? [])
    const adminUsersMutation = adminFromCalls.filter(
      (c: unknown[]) => c[0] === 'users'
    )
    expect(adminUsersMutation).toHaveLength(0)
  })

  it('negative — no session → { error: "Unauthorized" }, no write', async () => {
    mockGetUser.mockResolvedValue(null)

    const { updateCabinetProfile } = await import('@/modules/cabinet/actions/index')
    const result = await updateCabinetProfile(VALID_PROFILE)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('diagnosability — DB update failure → console.error with root cause', async () => {
    const dbError = { message: 'constraint violation', code: '23514' }
    mockUserUpdate.mockResolvedValue({ error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateCabinetProfile } = await import('@/modules/cabinet/actions/index')
    const result = await updateCabinetProfile(VALID_PROFILE)

    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'updateCabinetProfile failed',
      expect.objectContaining({ error: dbError, userId: REGULAR_USER.id }),
    )
    consoleSpy.mockRestore()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// C. Admin/moderator write — createCurrency
// ══════════════════════════════════════════════════════════════════════════════

describe('Archetype C — createCurrency (admin/moderator write, admin client)', () => {
  const mockCurrencyInsert = vi.fn()

  const VALID_CURRENCY = {
    code: 'USD',
    symbol: '$',
    name_sq: 'Dollar amerikan',
    name_en: 'US Dollar',
    name_uk: 'Долар США',
    name_it: 'Dollaro USA',
  }

  // User-scoped role-check chain
  const mockRoleSingle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue(ADMIN_USER)

    // User-scoped client: role check
    mockRoleSingle.mockResolvedValue({ data: { role: 'admin' } })
    mockCreateClient.mockResolvedValue({
      from: () => ({
        select: () => ({ eq: () => ({ single: mockRoleSingle }) }),
      }),
    })

    // Admin client: currency write
    mockCurrencyInsert.mockResolvedValue({ data: { id: 1 }, error: null })
    mockCreateAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'currencies') {
          return {
            insert: () => ({ select: () => ({ single: mockCurrencyInsert }) }),
          }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }
      },
      auth: mockAdminAuth,
    })
  })

  it('positive — admin → insert via admin client → { id }', async () => {
    const { createCurrency } = await import('@/modules/admin/actions/currencies')
    const result = await createCurrency(VALID_CURRENCY)

    expect(result).toEqual({ id: 1 })
    expect(mockCurrencyInsert).toHaveBeenCalled()
  })

  it('negative — unauthenticated → { error: "unauthenticated" }, no insert', async () => {
    mockGetUser.mockResolvedValue(null)

    const { createCurrency } = await import('@/modules/admin/actions/currencies')
    const result = await createCurrency(VALID_CURRENCY)

    expect(result).toEqual({ error: 'unauthenticated' })
    expect(mockCurrencyInsert).not.toHaveBeenCalled()
  })

  it('negative — regular user → { error: "forbidden" }, no insert', async () => {
    mockRoleSingle.mockResolvedValue({ data: { role: 'user' } })

    const { createCurrency } = await import('@/modules/admin/actions/currencies')
    const result = await createCurrency(VALID_CURRENCY)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockCurrencyInsert).not.toHaveBeenCalled()
  })

  it('diagnosability — insert failure → console.error with root cause', async () => {
    const insertError = { message: 'unique violation', code: '99999' }
    mockCurrencyInsert.mockResolvedValue({ data: null, error: insertError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { createCurrency } = await import('@/modules/admin/actions/currencies')
    const result = await createCurrency(VALID_CURRENCY)

    expect(result).toEqual({ error: insertError.message })
    expect(consoleSpy).toHaveBeenCalledWith(
      'createCurrency failed',
      expect.objectContaining({ error: insertError }),
    )
    consoleSpy.mockRestore()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// D. Admin-only (NOT moderator) — setModeratorPermission
// ══════════════════════════════════════════════════════════════════════════════

describe('Archetype D — setModeratorPermission (admin-only, moderator rejected)', () => {
  const mockPermissionUpsert = vi.fn()
  const mockEventInsert = vi.fn()
  const mockCurrentSelect = vi.fn()

  // User-scoped role-check chain
  const mockRoleSingle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockGetUser.mockResolvedValue(ADMIN_USER)

    // User-scoped client: role check → admin
    mockRoleSingle.mockResolvedValue({ data: { role: 'admin' } })
    mockCreateClient.mockResolvedValue({
      from: () => ({
        select: () => ({ eq: () => ({ single: mockRoleSingle }) }),
      }),
    })

    // Admin client: permission upsert + event insert + current value read
    mockCurrentSelect.mockResolvedValue({ data: null })
    mockPermissionUpsert.mockResolvedValue({ error: null })
    mockEventInsert.mockResolvedValue({ error: null })
    mockCreateAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'role_permissions') {
          return {
            upsert: mockPermissionUpsert,
            select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mockCurrentSelect }) }) }),
          }
        }
        if (table === 'role_permission_events') {
          return { insert: mockEventInsert }
        }
        if (table === 'users') {
          return { select: () => ({ eq: () => ({ single: vi.fn().mockResolvedValue({ data: { name: 'Admin' } }) }) }) }
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) }
      },
      auth: mockAdminAuth,
    })
  })

  it('positive — admin → permission upserted + audit event inserted → {}', async () => {
    const { setModeratorPermission } = await import('@/modules/admin/actions/permissions')
    const result = await setModeratorPermission('listings.delete', true)

    expect(result).toEqual({})
    expect(mockPermissionUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'moderator',
        permission_key: 'listings.delete',
        allowed: true,
      }),
      expect.any(Object),
    )
    expect(mockEventInsert).toHaveBeenCalledWith(expect.objectContaining({
      role: 'moderator',
      permission_key: 'listings.delete',
      new_allowed: true,
      actor_user_id: ADMIN_USER.id,
    }))
  })

  it('negative — moderator actor → { error: "forbidden" }, no write', async () => {
    // Moderator can read permissions but CANNOT change them
    mockRoleSingle.mockResolvedValue({ data: { role: 'moderator' } })

    const { setModeratorPermission } = await import('@/modules/admin/actions/permissions')
    const result = await setModeratorPermission('listings.delete', true)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockPermissionUpsert).not.toHaveBeenCalled()
    expect(mockEventInsert).not.toHaveBeenCalled()
  })

  it('negative — unauthenticated → { error: "forbidden" }, no write', async () => {
    mockGetUser.mockResolvedValue(null)

    const { setModeratorPermission } = await import('@/modules/admin/actions/permissions')
    const result = await setModeratorPermission('listings.delete', true)

    expect(result).toEqual({ error: 'forbidden' })
    expect(mockPermissionUpsert).not.toHaveBeenCalled()
  })

  it('diagnosability — upsert failure → console.error with root cause', async () => {
    const upsertError = { message: 'constraint violation', code: '23505' }
    mockPermissionUpsert.mockResolvedValue({ error: upsertError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { setModeratorPermission } = await import('@/modules/admin/actions/permissions')
    const result = await setModeratorPermission('listings.delete', true)

    expect(result).toEqual({ error: 'save_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'setModeratorPermission upsert failed',
      expect.objectContaining({ error: upsertError, key: 'listings.delete' }),
    )
    consoleSpy.mockRestore()
  })
})
