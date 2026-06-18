import { describe, it, expect, vi } from 'vitest'
import {
  PUBLIC_VISIBLE_STATUSES,
  isListingPubliclyVisible,
  applyPublicVisibility,
  type HiddenReason,
  type VisibilityRule,
} from '../visibility'
import type { ListingStatus } from '@/types/database'

const ALL_STATUSES: ListingStatus[] = ['active', 'inactive', 'sold', 'rented', 'archived', 'pending', 'expired']

describe('PUBLIC_VISIBLE_STATUSES', () => {
  it('covers every ListingStatus value', () => {
    for (const status of ALL_STATUSES) {
      expect(PUBLIC_VISIBLE_STATUSES).toHaveProperty(status)
    }
  })

  it('only active is publicEligible today', () => {
    const eligible = ALL_STATUSES.filter(s => PUBLIC_VISIBLE_STATUSES[s].publicEligible)
    expect(eligible).toEqual(['active'])
  })
})

describe('isListingPubliclyVisible', () => {
  const futureDate = new Date(Date.now() + 86_400_000).toISOString()
  const pastDate = new Date(Date.now() - 86_400_000).toISOString()

  it('active + non-expired → visible', () => {
    const result = isListingPubliclyVisible({ status: 'active', expires_at: futureDate })
    expect(result).toEqual({ visible: true, reason: null })
  })

  it('active + expired → hidden (expired)', () => {
    const result = isListingPubliclyVisible({ status: 'active', expires_at: pastDate })
    expect(result).toEqual({ visible: false, reason: 'expired' })
  })

  it('active + null expires_at → hidden (no_expiry)', () => {
    const result = isListingPubliclyVisible({ status: 'active', expires_at: null })
    expect(result).toEqual({ visible: false, reason: 'no_expiry' })
  })

  const nonPublicStatuses: ListingStatus[] = ['inactive', 'sold', 'rented', 'archived', 'pending', 'expired']

  for (const status of nonPublicStatuses) {
    it(`${status} → hidden (status_not_public)`, () => {
      const result = isListingPubliclyVisible({ status, expires_at: futureDate })
      expect(result).toEqual({ visible: false, reason: 'status_not_public' })
    })

    it(`${status} with null expires_at → hidden (status_not_public, not no_expiry)`, () => {
      const result = isListingPubliclyVisible({ status, expires_at: null })
      expect(result).toEqual({ visible: false, reason: 'status_not_public' })
    })
  }
})

describe('applyPublicVisibility', () => {
  it('applies .eq status + .gte expires_at filters matching today\'s behavior', () => {
    const calls: Array<{ method: string; args: unknown[] }> = []
    const mockQuery = {
      eq(col: string, val: string) {
        calls.push({ method: 'eq', args: [col, val] })
        return mockQuery
      },
      in(col: string, vals: string[]) {
        calls.push({ method: 'in', args: [col, vals] })
        return mockQuery
      },
      gte(col: string, val: string) {
        calls.push({ method: 'gte', args: [col, val] })
        return mockQuery
      },
    }

    applyPublicVisibility(mockQuery)

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ method: 'eq', args: ['status', 'active'] })
    expect(calls[1].method).toBe('gte')
    expect(calls[1].args[0]).toBe('expires_at')
    const ts = calls[1].args[1] as string
    expect(new Date(ts).getTime()).not.toBeNaN()
    expect(Math.abs(new Date(ts).getTime() - Date.now())).toBeLessThan(5000)
  })

  it('returns the same query reference for chaining', () => {
    const mockQuery = {
      eq() { return mockQuery },
      in() { return mockQuery },
      gte() { return mockQuery },
    }
    const result = applyPublicVisibility(mockQuery)
    expect(result).toBe(mockQuery)
  })
})

describe('policy-predicate consistency', () => {
  const futureDate = new Date(Date.now() + 86_400_000).toISOString()
  const pastDate = new Date(Date.now() - 86_400_000).toISOString()

  it('wrongly broadening the policy (marking inactive as publicEligible) would be caught', () => {
    const result = isListingPubliclyVisible({ status: 'inactive', expires_at: futureDate })
    expect(result.visible).toBe(false)
    expect(result.reason).toBe('status_not_public')
  })

  it('wrongly narrowing the policy (active non-expired must be visible)', () => {
    const result = isListingPubliclyVisible({ status: 'active', expires_at: futureDate })
    expect(result.visible).toBe(true)
  })

  it('every HiddenReason is reachable', () => {
    const reasons = new Set<HiddenReason>()

    reasons.add(isListingPubliclyVisible({ status: 'inactive', expires_at: futureDate }).reason!)
    reasons.add(isListingPubliclyVisible({ status: 'active', expires_at: pastDate }).reason!)
    reasons.add(isListingPubliclyVisible({ status: 'active', expires_at: null }).reason!)

    expect(reasons).toEqual(new Set(['status_not_public', 'expired', 'no_expiry']))
  })
})

// ── B1 drift-guard: audit script's ACTUAL exports must match canonical policy ─
// Imports the real exports from scripts/audit-listing-visibility.mjs.
// The script gates execution behind an entry-point check, so importing it
// does NOT run the audit / hit the network / call process.exit.

// @ts-ignore — .mjs has no type declarations; runtime import is sufficient for drift assertion
import { PUBLIC_VISIBLE_STATUSES as SCRIPT_POLICY, classifyHiddenReason as scriptClassify } from '../../../../../scripts/audit-listing-visibility.mjs'

describe('audit-script drift guard (imports from the ACTUAL .mjs)', () => {
  it('script PUBLIC_VISIBLE_STATUSES is deep-equal to canonical', () => {
    expect(SCRIPT_POLICY).toEqual(PUBLIC_VISIBLE_STATUSES)
  })

  it('script classifyHiddenReason agrees with isListingPubliclyVisible for all 7 statuses × 3 expiry states', () => {
    const futureDate = new Date(Date.now() + 86_400_000).toISOString()
    const pastDate = new Date(Date.now() - 86_400_000).toISOString()
    const expiryCases = [
      { label: 'future', expires_at: futureDate },
      { label: 'past', expires_at: pastDate },
      { label: 'null', expires_at: null as string | null },
    ]

    for (const status of ALL_STATUSES) {
      for (const { label, expires_at } of expiryCases) {
        const canonical = isListingPubliclyVisible({ status, expires_at })
        const scriptReason = scriptClassify({ status, expires_at }) as string | null

        const rule = PUBLIC_VISIBLE_STATUSES[status]
        if (!rule.publicEligible) {
          expect(scriptReason, `${status}/${label}: non-eligible should return null`).toBeNull()
          expect(canonical.visible).toBe(false)
        } else if (canonical.visible) {
          expect(scriptReason, `${status}/${label}: visible should return null`).toBeNull()
        } else {
          expect(scriptReason, `${status}/${label}: hidden reason must match`).toBe(canonical.reason)
        }
      }
    }
  })
})

// ── B2: mixed requiresUnexpired policy must throw ────────────────────────────

describe('applyPublicVisibility — mixed policy guard', () => {
  it('current uniform policy works without throwing', () => {
    const mockQuery = {
      eq() { return mockQuery },
      in() { return mockQuery },
      gte() { return mockQuery },
    }
    expect(() => applyPublicVisibility(mockQuery)).not.toThrow()
  })

  it('mixed requiresUnexpired policy throws explicitly', () => {
    const original = { ...PUBLIC_VISIBLE_STATUSES }
    // Temporarily inject a mixed policy: active requires unexpired, but a
    // hypothetical 'reserved' (simulated via 'pending') does not.
    const saved = PUBLIC_VISIBLE_STATUSES.pending
    ;(PUBLIC_VISIBLE_STATUSES as Record<string, VisibilityRule>).pending = {
      publicEligible: true,
      requiresUnexpired: false,
    }

    const mockQuery = {
      eq() { return mockQuery },
      in() { return mockQuery },
      gte() { return mockQuery },
    }

    try {
      expect(() => applyPublicVisibility(mockQuery)).toThrow(
        'mixed requiresUnexpired policy is not supported',
      )
    } finally {
      ;(PUBLIC_VISIBLE_STATUSES as Record<string, VisibilityRule>).pending = saved
    }
  })
})
