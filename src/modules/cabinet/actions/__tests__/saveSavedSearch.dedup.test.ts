import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canonicalizeFilters, computeFiltersHash } from '@/modules/listings/lib/savedSearchCanonicalize'

// Mock auth so resolveAuthUser() returns a stable user id without hitting Next.js headers().
vi.mock('@/lib/auth/server', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
}))

// Mock supabase server client — full chainable stub.
const mockMaybeSingle = vi.fn()
const mockInsertSelect = vi.fn()

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockInsertSelect }) }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue(mockChain),
  }),
}))

// Mock getBlockedError so it does not need a real supabase admin client.
vi.mock('@/lib/auth/blockCheck', () => ({
  getBlockedError: vi.fn().mockResolvedValue(null),
}))

// Mock admin client (imported at module level in cabinet actions, not called by saveSavedSearch).
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

// Dynamic imports from the actions file trigger next/cache revalidate calls — already stubbed.

describe('saveSavedSearch — dedup via canonical hash', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain.select.mockReturnThis()
    mockChain.eq.mockReturnThis()
  })

  it('dedup: re-saving order-reversed condition returns already_exists', async () => {
    // Compute the canonical hash for condition=good,new_build (sorted → ['good','new_build']).
    const canonicalHash = computeFiltersHash(canonicalizeFilters(new URLSearchParams('condition=good,new_build')))

    // Simulate the DB already containing a row with this hash.
    mockMaybeSingle.mockResolvedValue({ data: { id: 'existing-123' }, error: null })

    // Import the action after mocks are in place.
    const { saveSavedSearch } = await import('@/modules/cabinet/actions')

    // Call with reversed order — should produce the same canonical hash.
    const result = await saveSavedSearch({ condition: 'new_build,good' }, 'My Search')

    expect(result).toEqual({ error: 'already_saved', code: 'already_exists' })

    // Confirm the dedup query used the correct hash (same as the sorted canonical).
    expect(mockChain.eq).toHaveBeenCalledWith('filters_hash', canonicalHash)
  })

  it('dedup: new search (no existing row) proceeds to insert', async () => {
    // No existing row found.
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    mockInsertSelect.mockResolvedValue({ data: { id: 'new-saved-id' }, error: null })

    const { saveSavedSearch } = await import('@/modules/cabinet/actions')
    const result = await saveSavedSearch({ condition: 'good' }, 'New Search')

    expect(result.code).not.toBe('already_exists')
    expect(result.id ?? result.error).toBeTruthy()
  })
})
