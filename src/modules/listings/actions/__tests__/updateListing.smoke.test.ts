/**
 * Guard smoke — updateListing server action (Task 442 / Epic RS Slice 3).
 *
 * Covers registry row "Edit listing":
 *   Happy: owner edits own listing → { slug, status } returned.
 *   Failures: not_found (listing missing), validation_failed, update DB error + console.error.
 *
 * ## Stubbing seams
 * - @/lib/auth/server  getUser
 * - @/lib/auth/blockCheck getBlockedError
 * - @/lib/supabase/server createClient — DB: listings SELECT/UPDATE + listing_images SELECT/DELETE/INSERT
 * - @/modules/listings/validations listingSchema.safeParse
 * - @/i18n/routing → routing.locales (needed for revalidatePath loop; next/cache is no-op via vitest alias)
 * - @/lib/cloudinaryUpload publicIdFromUrl  (Cloudinary cleanup — no real network)
 * - @/lib/cloudinaryDelete deleteAsset
 *
 * Planted-violation proof (see session log for transcript):
 *   Remove `if (!existing) return { error: 'not_found' }` →
 *   expect(result).toEqual({ error: 'not_found' }) FAILS (TypeError thrown).
 *   Revert → PASS.
 *
 * Command: npx vitest run src/modules/listings/actions/__tests__/updateListing.smoke.test.ts
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

vi.mock('@/i18n/routing', () => ({
  routing: { locales: ['sq', 'en', 'uk', 'it'] },
}))

vi.mock('@/lib/cloudinaryUpload', () => ({
  publicIdFromUrl: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/cloudinaryDelete', () => ({
  deleteAsset: vi.fn().mockResolvedValue({}),
}))

// DB chains — listings table
const mockListingsSingle   = vi.fn()
const mockListingsUpdateEq = vi.fn()

// DB chains — listing_images table
const mockImagesSelectEq   = vi.fn()
const mockImagesDeleteEq   = vi.fn()
const mockImagesInsert     = vi.fn()

const mockFrom = vi.fn((table: string) => {
  if (table === 'listings') {
    return {
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockListingsSingle }) }),
      update: vi.fn().mockReturnValue({ eq: mockListingsUpdateEq }),
    }
  }
  if (table === 'users') {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null }) }),
      }),
    }
  }
  if (table === 'listing_images') {
    return {
      select: vi.fn().mockReturnValue({ eq: mockImagesSelectEq }),
      delete: vi.fn().mockReturnValue({ eq: mockImagesDeleteEq }),
      insert: mockImagesInsert,
    }
  }
  return {}
})

const mockCreateClient = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const USER_ID    = 'user-upd-1'
const LISTING_ID = 'listing-upd-1'
const LISTING_SLUG = 'my-apartment-abc123'

const EXISTING_LISTING = {
  id: LISTING_ID, slug: LISTING_SLUG,
  user_id: USER_ID, // same as USER_ID → owner path (no users query)
  status: 'active',
}

const PARSED_DATA = {
  title: 'My apartment', listing_type: 'sale', property_type: 'apartment',
  price: 80000, currency: 'EUR',
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: USER_ID })
  mockGetBlockedError.mockResolvedValue(null)
  mockSafeParse.mockReturnValue({ success: true, data: PARSED_DATA })
  mockListingsSingle.mockResolvedValue({ data: EXISTING_LISTING })
  mockListingsUpdateEq.mockResolvedValue({ error: null })
  mockImagesSelectEq.mockResolvedValue({ data: [] })
  mockImagesDeleteEq.mockResolvedValue({ error: null })
  mockImagesInsert.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({ from: mockFrom })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('updateListing — smoke tests (Task 442)', () => {
  it('happy path: owner edit → { slug, status } returned, update called once', async () => {
    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { ...PARSED_DATA, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ slug: LISTING_SLUG, status: 'active' })
    expect(mockListingsUpdateEq).toHaveBeenCalledTimes(1)
  })

  it('not_found: listing does not exist → { error: "not_found" }, no DB update', async () => {
    mockListingsSingle.mockResolvedValue({ data: null })

    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { ...PARSED_DATA, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ error: 'not_found' })
    expect(mockListingsUpdateEq).not.toHaveBeenCalled()
  })

  it('validation_failed: schema rejects payload → { error: "validation_failed" }', async () => {
    mockSafeParse.mockReturnValue({ success: false, error: { issues: [] } })

    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { title: '', images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ error: 'validation_failed' })
    expect(mockListingsUpdateEq).not.toHaveBeenCalled()
  })

  it('unauthenticated: no session → { error: "unauthenticated" }', async () => {
    mockGetUser.mockResolvedValue(null)

    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { ...PARSED_DATA, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ error: 'unauthenticated' })
  })

  it('update DB error → { error: message } + console.error logged (Guard 4)', async () => {
    const dbError = { message: 'update constraint violation' }
    mockListingsUpdateEq.mockResolvedValue({ error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { ...PARSED_DATA, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ error: 'update constraint violation' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update listing',
      expect.objectContaining({ error: dbError, listingId: LISTING_ID }),
    )
    consoleSpy.mockRestore()
  })
})
