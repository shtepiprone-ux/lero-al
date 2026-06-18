import fs from 'fs'
import path from 'path'
import { describe, it, expect, vi } from 'vitest'
import * as visibilityModule from '../visibility'
import {
  PUBLIC_VISIBLE_STATUSES,
  isListingPubliclyVisible,
  applyPublicVisibility,
  applyPublicEligibleButHidden,
  formatVisibility,
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

// ── Task 456: formatVisibility — badge↔predicate equivalence ────────────────

describe('formatVisibility (badge↔predicate equivalence, Task 456)', () => {
  const futureDate = new Date(Date.now() + 86_400_000).toISOString()
  const pastDate = new Date(Date.now() - 86_400_000).toISOString()

  it('follows policy mutation (proves it delegates to isListingPubliclyVisible, not an inline re-spell)', () => {
    const saved = PUBLIC_VISIBLE_STATUSES.pending
    ;(PUBLIC_VISIBLE_STATUSES as Record<string, VisibilityRule>).pending = {
      publicEligible: true,
      requiresUnexpired: true,
    }
    try {
      const result = formatVisibility({ status: 'pending', expires_at: futureDate })
      expect(result.visible).toBe(true)
      expect(result.labelKey).toBe('visibility_visible')
    } finally {
      ;(PUBLIC_VISIBLE_STATUSES as Record<string, VisibilityRule>).pending = saved
    }
  })

  it('active + future → visible / visibility_visible', () => {
    const result = formatVisibility({ status: 'active', expires_at: futureDate })
    expect(result).toEqual({ visible: true, reason: null, labelKey: 'visibility_visible' })
  })

  it('active + past → hidden / visibility_hidden_expired', () => {
    const result = formatVisibility({ status: 'active', expires_at: pastDate })
    expect(result).toEqual({ visible: false, reason: 'expired', labelKey: 'visibility_hidden_expired' })
  })

  it('active + null → hidden / visibility_hidden_no_expiry', () => {
    const result = formatVisibility({ status: 'active', expires_at: null })
    expect(result).toEqual({ visible: false, reason: 'no_expiry', labelKey: 'visibility_hidden_no_expiry' })
  })

  it('sold → hidden / visibility_hidden_status_not_public', () => {
    const result = formatVisibility({ status: 'sold', expires_at: futureDate })
    expect(result).toEqual({ visible: false, reason: 'status_not_public', labelKey: 'visibility_hidden_status_not_public' })
  })

  it('archived → hidden / visibility_hidden_status_not_public', () => {
    const result = formatVisibility({ status: 'archived', expires_at: null })
    expect(result).toEqual({ visible: false, reason: 'status_not_public', labelKey: 'visibility_hidden_status_not_public' })
  })

  it('every labelKey maps back to the canonical reason from isListingPubliclyVisible for all 7 statuses × 3 expiry states', () => {
    const expiryCases = [
      { expires_at: futureDate },
      { expires_at: pastDate },
      { expires_at: null as string | null },
    ]
    for (const status of ALL_STATUSES) {
      for (const { expires_at } of expiryCases) {
        const formatted = formatVisibility({ status, expires_at })
        const canonical = isListingPubliclyVisible({ status, expires_at })
        expect(formatted.visible, `${status}/${expires_at}: visible must match`).toBe(canonical.visible)
        expect(formatted.reason, `${status}/${expires_at}: reason must match`).toBe(canonical.reason)
      }
    }
  })
})

// ── Task 456: applyPublicEligibleButHidden ──────────────────────────────────

describe('applyPublicEligibleButHidden (Task 456)', () => {
  function makeMockQuery() {
    const calls: Array<{ method: string; args: unknown[] }> = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockQuery: any = {
      eq(col: unknown, val: unknown) { calls.push({ method: 'eq', args: [col, val] }); return mockQuery },
      in(col: unknown, vals: unknown) { calls.push({ method: 'in', args: [col, vals] }); return mockQuery },
      or(filter: unknown) { calls.push({ method: 'or', args: [filter] }); return mockQuery },
      lt(col: unknown, val: unknown) { calls.push({ method: 'lt', args: [col, val] }); return mockQuery },
      is(col: unknown, val: unknown) { calls.push({ method: 'is', args: [col, val] }); return mockQuery },
    }
    return { mockQuery, calls }
  }

  it('no reason → filters to eligible statuses + (expires_at < now OR null)', () => {
    const { mockQuery, calls } = makeMockQuery()
    applyPublicEligibleButHidden(mockQuery)

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ method: 'eq', args: ['status', 'active'] })
    expect(calls[1].method).toBe('or')
    const orFilter = calls[1].args[0] as string
    expect(orFilter).toMatch(/expires_at\.lt\./)
    expect(orFilter).toMatch(/expires_at\.is\.null/)
  })

  it('reason=expired → filters to eligible statuses + expires_at < now', () => {
    const { mockQuery, calls } = makeMockQuery()
    applyPublicEligibleButHidden(mockQuery, { reason: 'expired' })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ method: 'eq', args: ['status', 'active'] })
    expect(calls[1].method).toBe('lt')
    expect(calls[1].args[0]).toBe('expires_at')
  })

  it('reason=no_expiry → filters to eligible statuses + expires_at IS NULL', () => {
    const { mockQuery, calls } = makeMockQuery()
    applyPublicEligibleButHidden(mockQuery, { reason: 'no_expiry' })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ method: 'eq', args: ['status', 'active'] })
    expect(calls[1]).toEqual({ method: 'is', args: ['expires_at', null] })
  })

  it('unknown reason → falls back to full set (same as no reason)', () => {
    const { mockQuery, calls } = makeMockQuery()
    applyPublicEligibleButHidden(mockQuery, { reason: 'garbage' })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ method: 'eq', args: ['status', 'active'] })
    expect(calls[1].method).toBe('or')
  })

  it('returns the same query reference for chaining', () => {
    const { mockQuery } = makeMockQuery()
    const result = applyPublicEligibleButHidden(mockQuery)
    expect(result).toBe(mockQuery)
  })

  it('uses policy-derived statuses (not hardcoded "active")', () => {
    const eligible = (Object.entries(PUBLIC_VISIBLE_STATUSES) as [string, VisibilityRule][])
      .filter(([, rule]) => rule.publicEligible)
      .map(([s]) => s)
    const { mockQuery, calls } = makeMockQuery()
    applyPublicEligibleButHidden(mockQuery)

    if (eligible.length === 1) {
      expect(calls[0]).toEqual({ method: 'eq', args: ['status', eligible[0]] })
    } else {
      expect(calls[0]).toEqual({ method: 'in', args: ['status', eligible] })
    }
  })
})

// ── Task 456: Surface consumption proof (static import gate) ────────────────
// Asserts the component files import and call formatVisibility from the
// canonical module, and do NOT contain inline visibility predicates.
// Planted-violation (a) — hardcode "Visible": removes the formatVisibility call → FAILS.
// Planted-violation (b) — inline re-spell: adds status/expiry literal comparison → FAILS.

describe('Surface consumption proof — static import gate (Task 456)', () => {
  const CABINET_LISTINGS_TAB = path.resolve(
    __dirname, '../../../../modules/cabinet/components/ListingsTab.tsx',
  )
  const ADMIN_LISTINGS_TABLE = path.resolve(
    __dirname, '../../../../components/admin/AdminListingsTable.tsx',
  )

  function readSource(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8')
  }

  describe('ListingsTab (cabinet surface)', () => {
    it('imports formatVisibility from the canonical module', () => {
      const src = readSource(CABINET_LISTINGS_TAB)
      expect(src).toContain("import { formatVisibility } from '@/modules/listings/lib/visibility'")
    })

    it('calls formatVisibility (not a dead import)', () => {
      const src = readSource(CABINET_LISTINGS_TAB)
      expect(src).toMatch(/formatVisibility\s*\(/)
    })

    it('does NOT contain inline status/expiry visibility predicates', () => {
      const src = readSource(CABINET_LISTINGS_TAB)
      expect(src).not.toMatch(/status\s*===?\s*['"]active['"]\s*&&\s*expires_at/)
      expect(src).not.toMatch(/expires_at\s*[<>]=?\s*new\s+Date/)
      expect(src).not.toMatch(/\.gte\(\s*['"]expires_at['"]/)
      expect(src).not.toMatch(/\.lt\(\s*['"]expires_at['"]/)
    })
  })

  describe('AdminListingsTable (admin surface)', () => {
    it('imports formatVisibility from the canonical module', () => {
      const src = readSource(ADMIN_LISTINGS_TABLE)
      expect(src).toContain("import { formatVisibility } from '@/modules/listings/lib/visibility'")
    })

    it('calls formatVisibility (not a dead import)', () => {
      const src = readSource(ADMIN_LISTINGS_TABLE)
      expect(src).toMatch(/formatVisibility\s*\(/)
    })

    it('does NOT contain inline status/expiry visibility predicates', () => {
      const src = readSource(ADMIN_LISTINGS_TABLE)
      expect(src).not.toMatch(/status\s*===?\s*['"]active['"]\s*&&\s*expires_at/)
      expect(src).not.toMatch(/expires_at\s*[<>]=?\s*new\s+Date/)
    })
  })
})
