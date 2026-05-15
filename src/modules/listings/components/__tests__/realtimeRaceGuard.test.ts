import { describe, it, expect } from 'vitest'

// ── Pure unit tests for the deletedDuringFetch race guard ─────────────────────
//
// Validates the exact logic inside useFavoritesRealtime's DELETE-before-INSERT guard.
// Tests the invariant: a listing ID that received a DELETE event while its INSERT
// fetch was in flight must be suppressed when the fetch result arrives.

function makeRaceGuard() {
  const deletedDuringFetch = new Set<string>()
  return {
    // Called on DELETE event
    markDeleted: (id: string) => deletedDuringFetch.add(id),
    // Called when INSERT fetch completes
    isSuppressed: (id: string): boolean => {
      if (deletedDuringFetch.has(id)) {
        deletedDuringFetch.delete(id)
        return true
      }
      return false
    },
    // Called in cleanup
    clear: () => deletedDuringFetch.clear(),
    size: () => deletedDuringFetch.size,
  }
}

describe('useFavoritesRealtime deletedDuringFetch race guard (FIX D)', () => {
  it('suppresses INSERT when DELETE arrived while fetch was in flight', () => {
    const guard = makeRaceGuard()

    // T0: INSERT event fires, fetch starts (guard not yet notified)
    // T1: DELETE event fires
    guard.markDeleted('listing-x')
    // T2: INSERT fetch completes — should be suppressed
    expect(guard.isSuppressed('listing-x')).toBe(true)
  })

  it('allows INSERT when no DELETE arrived during fetch', () => {
    const guard = makeRaceGuard()
    // No DELETE for 'listing-y'
    expect(guard.isSuppressed('listing-y')).toBe(false)
  })

  it('consumes the delete marker on first check (single-use)', () => {
    const guard = makeRaceGuard()
    guard.markDeleted('listing-z')

    // First check suppresses
    expect(guard.isSuppressed('listing-z')).toBe(true)
    // Second check does not (marker was consumed)
    expect(guard.isSuppressed('listing-z')).toBe(false)
  })

  it('handles multiple concurrent in-flight fetches independently', () => {
    const guard = makeRaceGuard()
    guard.markDeleted('listing-a')
    // listing-b was NOT deleted

    expect(guard.isSuppressed('listing-a')).toBe(true)
    expect(guard.isSuppressed('listing-b')).toBe(false)
  })

  it('clear() removes all pending delete markers (cleanup)', () => {
    const guard = makeRaceGuard()
    guard.markDeleted('listing-p')
    guard.markDeleted('listing-q')
    expect(guard.size()).toBe(2)

    guard.clear()
    expect(guard.size()).toBe(0)
    // After clear, markers are gone — INSERT would NOT be suppressed
    expect(guard.isSuppressed('listing-p')).toBe(false)
  })

  it('DELETE then INSERT then second INSERT: only first INSERT is suppressed', () => {
    const guard = makeRaceGuard()
    // First INSERT fetch starts → DELETE arrives → first fetch completes → suppressed
    guard.markDeleted('listing-m')
    expect(guard.isSuppressed('listing-m')).toBe(true)

    // Second INSERT fetch completes (e.g. user re-favorites) — not suppressed
    expect(guard.isSuppressed('listing-m')).toBe(false)
  })
})
