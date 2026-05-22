/**
 * deleteAsset — unit tests (Epic H.6 / Task 144).
 *
 * Verifies the three safety properties:
 *   1. Referenced asset → skipped, never deleted.
 *   2. Unreferenced asset in dry-run → logged, not deleted.
 *   3. Enabled mode + unreferenced → Cloudinary API called.
 *
 * The Supabase admin client and global fetch are mocked so no real DB or
 * Cloudinary call is made.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mutable ref used by the Supabase mock ─────────────────────────────────────
// vi.mock factory is hoisted; reading `mockState` at call time picks up per-test values.
const mockState = {
  referencedInPublicId: false,
  referencedInUrl: false,
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          limit: () =>
            Promise.resolve({
              data: table === 'listing_images' && mockState.referencedInPublicId ? [{ id: 'img-1' }] : [],
              error: null,
            }),
        }),
        ilike: () => ({
          limit: () =>
            Promise.resolve({
              data: mockState.referencedInUrl ? [{ id: 'row-1' }] : [],
              error: null,
            }),
        }),
      }),
    }),
  }),
}))

// Import AFTER vi.mock so the hoisted mock is in effect
import { deleteAsset } from '../cloudinaryDelete'

// ── Helpers ───────────────────────────────────────────────────────────────────

const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
const fetchSpy = vi.spyOn(globalThis, 'fetch')

beforeEach(() => {
  vi.clearAllMocks()
  mockState.referencedInPublicId = false
  mockState.referencedInUrl = false
  delete process.env.CLOUDINARY_DELETE_MODE
})

afterEach(() => {
  delete process.env.CLOUDINARY_DELETE_MODE
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('deleteAsset — reference check', () => {
  it('skips when public_id is directly referenced in listing_images', async () => {
    mockState.referencedInPublicId = true

    const result = await deleteAsset('u-abc/listings/l-xyz/img01', {
      reason: 'listing_image_removed',
    })

    expect(result.skipped).toBe(true)
    expect(result.deleted).toBe(false)
    expect(result.skipReason).toContain('listing_images.public_id')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('skips when URL is referenced in any table', async () => {
    mockState.referencedInUrl = true

    const result = await deleteAsset('u-abc/avatars/portrait', {
      reason: 'avatar_replaced',
    })

    expect(result.skipped).toBe(true)
    expect(result.deleted).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('deleteAsset — dry-run mode (default)', () => {
  it('returns dryRun=true and does not call Cloudinary when unreferenced', async () => {
    const result = await deleteAsset('avatars/orphan123', {
      reason: 'avatar_replaced',
    })

    expect(result.skipped).toBe(false)
    expect(result.dryRun).toBe(true)
    expect(result.deleted).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('logs a structured DRY_RUN entry', async () => {
    await deleteAsset('avatars/orphan123', { reason: 'avatar_replaced' })

    const logCall = consoleInfoSpy.mock.calls.find(([prefix]) => prefix === '[deleteAsset]')
    expect(logCall).toBeDefined()
    const entry = logCall![1] as Record<string, unknown>
    expect(entry.outcome).toBe('DRY_RUN')
    expect(entry.publicId).toBe('avatars/orphan123')
    expect(entry.reason).toBe('avatar_replaced')
  })
})

describe('deleteAsset — enabled mode', () => {
  it('calls Cloudinary destroy when mode=enabled and asset is unreferenced', async () => {
    process.env.CLOUDINARY_DELETE_MODE = 'enabled'
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ result: 'ok' }), { status: 200 }),
    )

    const result = await deleteAsset('avatars/orphan123', {
      reason: 'avatar_replaced',
    })

    expect(result.deleted).toBe(true)
    expect(result.dryRun).toBe(false)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const url = fetchSpy.mock.calls[0][0] as string
    expect(url).toContain('/image/destroy')
  })
})
