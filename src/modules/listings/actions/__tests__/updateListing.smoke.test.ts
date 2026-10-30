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

// The viewer and the admin client (Task 923 R104 (a)): `updateListing` reads the role through `requireViewer` and writes a staff edit through the admin client. These
// are recording doubles: a case that expects neither can assert they were not used.
const mockRequireViewer = vi.fn()
vi.mock('@/lib/auth/requireViewer', () => ({
  requireViewer: (...args: unknown[]) => mockRequireViewer(...args),
}))

const mockCreateAdminClient = vi.fn()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => mockCreateAdminClient(...args),
}))

// The status gateway (Task 923 R74, D53): an owner's edit of an ACTIVE listing moves it to `pending` through the gateway before the content is written. A recording double
// that answers the way the real gateway does on success; the real one writes through the service role and is covered by its own tests.
const mockApplyTransition = vi.fn()
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: (...args: unknown[]) => mockApplyTransition(...args),
}))

// DB chains — listings table
const mockListingsSingle   = vi.fn()
const mockListingsUpdateEq = vi.fn()

// DB chains — listing_images table
const mockImagesSelectEq   = vi.fn()
const mockImagesDeleteEq   = vi.fn()
const mockImagesInsert     = vi.fn()

// DB chains — the catalogues the action reads before any write (Task 923 R100, R104 (a)): from('property_types' | 'currencies').select(col).eq('is_active', true)
const catalogueTables = (table: string) => {
  if (table === 'property_types') return { select: () => ({ eq: () => Promise.resolve({ data: [{ slug: 'apartment' }], error: null }) }) }
  if (table === 'currencies')     return { select: () => ({ eq: () => Promise.resolve({ data: [{ code: 'ALL' }, { code: 'EUR' }], error: null }) }) }
  return undefined
}

const mockFrom = vi.fn((table: string) => {
  const catalogue = catalogueTables(table)
  if (catalogue) return catalogue
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
  mockRequireViewer.mockResolvedValue({ ok: false, reason: 'unauthenticated' })
  mockCreateAdminClient.mockReturnValue({ from: mockFrom })
  mockApplyTransition.mockResolvedValue({ ok: true, nextStatus: 'pending', listingId: LISTING_ID })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('updateListing — smoke tests (Task 442)', () => {
  it("happy path: owner edit of an active listing → { slug, status: 'pending' } (D53), one gateway move, one update", async () => {
    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { ...PARSED_DATA, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ slug: LISTING_SLUG, status: 'pending' })
    expect(mockListingsUpdateEq).toHaveBeenCalledTimes(1)
    expect(mockApplyTransition).toHaveBeenCalledTimes(1)
    expect(mockApplyTransition).toHaveBeenCalledWith(LISTING_ID, 'pending', expect.objectContaining({ source: 'cabinet' }))
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

  it("update DB error → { error: 'update_failed' } + console.error logged (Guard 4)", async () => {
    const dbError = { message: 'update constraint violation' }
    mockListingsUpdateEq.mockResolvedValue({ error: dbError })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { updateListing } = await import('../updateListing')
    const result = await updateListing(LISTING_ID, { ...PARSED_DATA, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(result).toEqual({ error: 'update_failed' })
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update listing',
      expect.objectContaining({ error: dbError, listingId: LISTING_ID }),
    )
    consoleSpy.mockRestore()
  })
})

describe('updateListing — server-owned price_old (Task 917)', () => {
  function capturedUpdate() {
    const updateMock = vi.fn().mockReturnValue({ eq: mockListingsUpdateEq })
    mockFrom.mockImplementation((table: string) => {
      const catalogue = catalogueTables(table)
      if (catalogue) return catalogue
      if (table === 'listings') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockListingsSingle }) }),
          update: updateMock,
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
    return updateMock
  }

  it('(a) lowered price: stored 100000/null → price 90000 writes price_old 100000', async () => {
    mockListingsSingle.mockResolvedValue({
      data: { ...EXISTING_LISTING, price: 100000, price_old: null, currency: 'EUR' },
    })
    mockSafeParse.mockReturnValue({ success: true, data: { ...PARSED_DATA, price: 90000 } })
    const updateMock = capturedUpdate()

    const { updateListing } = await import('../updateListing')
    await updateListing(LISTING_ID, { ...PARSED_DATA, price: 90000, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ price: 90000, price_old: 100000 }))
  })

  it('(b) client price_old is ignored: unchanged price + payload price_old 5 writes null', async () => {
    mockListingsSingle.mockResolvedValue({
      data: { ...EXISTING_LISTING, price: 80000, price_old: null, currency: 'EUR' },
    })
    mockSafeParse.mockReturnValue({ success: true, data: { ...PARSED_DATA, price_old: 5 } })
    const updateMock = capturedUpdate()

    const { updateListing } = await import('../updateListing')
    await updateListing(LISTING_ID, { ...PARSED_DATA, price_old: 5, images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ price_old: null }))
  })

  it('(c) currency change writes price_old null', async () => {
    mockListingsSingle.mockResolvedValue({
      data: { ...EXISTING_LISTING, price: 100000, price_old: 120000, currency: 'ALL' },
    })
    mockSafeParse.mockReturnValue({ success: true, data: { ...PARSED_DATA, price: 80000, currency: 'EUR' } })
    const updateMock = capturedUpdate()

    const { updateListing } = await import('../updateListing')
    await updateListing(LISTING_ID, { ...PARSED_DATA, price: 80000, currency: 'EUR', images: [] } as unknown as Parameters<typeof updateListing>[1])

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ price_old: null }))
  })
})
