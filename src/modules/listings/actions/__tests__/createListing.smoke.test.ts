/**
 * Guard smoke — createListing server action (Task 442 / Epic RS Slice 3).
 *
 * Covers registry row "Create listing":
 *   Happy: valid payload → { slug }, status:'pending' inserted.
 *   Failures: validation_failed (schema), unauthenticated, insert error + console.error.
 *
 * Key invariant: inserted row MUST have status:'pending' — never 'active'.
 * A listing inserted as 'active' bypasses moderation.
 *
 * ## Harness reuse
 * Same Vitest + jsdom harness as Slice 2 (Task 441). 'use server' is ignored as a
 * string literal. All DB calls mocked at the module boundary (createClient seam).
 * No Next.js server needed.
 *
 * ## Stubbing seams
 * - @/lib/auth/server  getUser        — auth gate
 * - @/lib/auth/blockCheck getBlockedError — block gate
 * - @/lib/supabase/server createClient — DB: from('listings').insert().select().single()
 * - @/modules/listings/validations    — listingSchema.safeParse (controls valid/invalid branch)
 *
 * Planted-violation proof (see session log for transcript):
 *   Change `status: 'pending'` → `status: 'active'` in the insert call →
 *   expect(mockListingsInsert).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }))
 *   FAILS. Revert → PASS.
 *
 * Command: npx vitest run src/modules/listings/actions/__tests__/createListing.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/auth/server', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

const mockGetBlockedError = vi.fn()
vi.mock('@/lib/auth/blockCheck', () => ({
  getBlockedError: (...args: unknown[]) => mockGetBlockedError(...args),
}))

const mockSafeParse = vi.fn()
vi.mock('@/modules/listings/validations', () => ({
  listingSchema: { safeParse: (...args: unknown[]) => mockSafeParse(...args) },
}))

// DB chain: from('listings').insert({...}).select('id,slug').single()
const mockListingsSingle     = vi.fn()
const mockListingsSelectAfterInsert = vi.fn().mockReturnValue({ single: mockListingsSingle })
const mockListingsInsert     = vi.fn().mockReturnValue({ select: mockListingsSelectAfterInsert })
const mockListingImagesInsert = vi.fn().mockResolvedValue({ error: null })

const mockFrom = vi.fn((table: string) => {
  if (table === 'listings')      return { insert: mockListingsInsert }
  if (table === 'listing_images') return { insert: mockListingImagesInsert }
  return {}
})

const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID  = 'user-create-1'
const PARSED_DATA = {
  title: 'Test apartment Tirana', listing_type: 'sale', property_type: 'apartment',
  price: 95000, currency: 'EUR',
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: USER_ID })
  mockGetBlockedError.mockResolvedValue(null)
  mockSafeParse.mockReturnValue({ success: true, data: PARSED_DATA })
  mockListingsSingle.mockResolvedValue({ data: { id: 'listing-new-1', slug: 'test-apartment-tirana-abc123' }, error: null })
  mockCreateClient.mockResolvedValue({ from: mockFrom })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('createListing — smoke tests (Task 442)', () => {
  it('happy path: valid payload → { slug }, status:pending inserted, user_id pinned', async () => {
    const { createListing } = await import('../createListing')
    const result = await createListing({ ...PARSED_DATA, images: [] } as unknown as Parameters<typeof createListing>[0])

    expect(result).toEqual({ slug: 'test-apartment-tirana-abc123' })

    // Critical invariant: status MUST be 'pending' — never 'active' (bypasses moderation).
    expect(mockListingsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', user_id: USER_ID }),
    )
  })

  it('validation_failed: schema rejects payload → { error: "validation_failed" }', async () => {
    mockSafeParse.mockReturnValue({ success: false, error: { issues: [] } })

    const { createListing } = await import('../createListing')
    const result = await createListing({ title: '', images: [] } as unknown as Parameters<typeof createListing>[0])

    expect(result).toEqual({ error: 'validation_failed' })
    // DB must NOT be touched on validation failure
    expect(mockListingsInsert).not.toHaveBeenCalled()
  })

  it('unauthenticated: no session → { error: "unauthenticated" }', async () => {
    mockGetUser.mockResolvedValue(null)

    const { createListing } = await import('../createListing')
    const result = await createListing({ ...PARSED_DATA, images: [] } as unknown as Parameters<typeof createListing>[0])

    expect(result).toEqual({ error: 'unauthenticated' })
    expect(mockListingsInsert).not.toHaveBeenCalled()
  })

  it('insert error: DB fails → { error: dbError.message } + console.error logged (Guard 4)', async () => {
    const dbError = { message: 'constraint violation on listings' }
    mockListingsSingle.mockResolvedValue({ data: null, error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { createListing } = await import('../createListing')
    const result = await createListing({ ...PARSED_DATA, images: [] } as unknown as Parameters<typeof createListing>[0])

    // Guard 4: DB failure must surface a typed error — never a silent black hole.
    expect(result).toEqual({ error: 'constraint violation on listings' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to create listing',
      expect.objectContaining({ error: dbError, userId: USER_ID }),
    )
    consoleSpy.mockRestore()
  })
})
