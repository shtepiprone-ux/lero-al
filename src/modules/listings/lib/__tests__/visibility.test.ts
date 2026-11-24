import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'
import {
  PUBLIC_VISIBLE_STATUSES,
  isListingPubliclyVisible,
  applyPublicVisibility,
  applyPublicEligibleButHidden,
  formatVisibility,
  isListingOpenableByAddress,
  OPEN_BY_ADDRESS,
  OPEN_BY_ADDRESS_STATUSES,
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
      not(col: string, op: string, val: string) {
        calls.push({ method: 'not', args: [col, op, val] })
        return mockQuery
      },
    }

    applyPublicVisibility(mockQuery)

    expect(calls).toHaveLength(3)
    expect(calls[0]).toEqual({ method: 'eq', args: ['status', 'active'] })
    expect(calls[1].method).toBe('gte')
    expect(calls[1].args[0]).toBe('expires_at')
    const ts = calls[1].args[1] as string
    expect(new Date(ts).getTime()).not.toBeNaN()
    expect(Math.abs(new Date(ts).getTime() - Date.now())).toBeLessThan(5000)
    expect(calls[2]).toEqual({ method: 'not', args: ['slug', 'like', 'zz\\_synth\\_%'] })
  })

  it('[Task 1035 AC1] leaves synthetic test listings out: .not(slug, like, the escaped prefix) besides the status and expiry filters', () => {
    const calls: Array<{ method: string; args: unknown[] }> = []
    const mockQuery = {
      eq(...args: unknown[]) { calls.push({ method: 'eq', args }); return mockQuery },
      in(...args: unknown[]) { calls.push({ method: 'in', args }); return mockQuery },
      gte(...args: unknown[]) { calls.push({ method: 'gte', args }); return mockQuery },
      not(...args: unknown[]) { calls.push({ method: 'not', args }); return mockQuery },
    }

    applyPublicVisibility(mockQuery)

    expect(calls.filter(c => c.method === 'not')).toEqual([{ method: 'not', args: ['slug', 'like', 'zz\\_synth\\_%'] }])
    expect(calls.some(c => c.method === 'eq' && c.args[0] === 'status')).toBe(true)
    expect(calls.some(c => c.method === 'gte' && c.args[0] === 'expires_at')).toBe(true)
  })

  it('returns the same query reference for chaining', () => {
    const mockQuery = {
      eq() { return mockQuery },
      in() { return mockQuery },
      gte() { return mockQuery },
      not() { return mockQuery },
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
      not() { return mockQuery },
    }
    expect(() => applyPublicVisibility(mockQuery)).not.toThrow()
  })

  it('mixed requiresUnexpired policy throws explicitly', () => {
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
      not() { return mockQuery },
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
  const ADMIN_LISTINGS_VIEW = path.resolve(
    __dirname, '../../../../components/admin/AdminListingsView.tsx',
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

  describe('AdminListingsView (admin surface)', () => {
    it('imports formatVisibility from the canonical module', () => {
      const src = readSource(ADMIN_LISTINGS_VIEW)
      expect(src).toContain("import { formatVisibility } from '@/modules/listings/lib/visibility'")
    })

    it('calls formatVisibility (not a dead import)', () => {
      const src = readSource(ADMIN_LISTINGS_VIEW)
      expect(src).toMatch(/formatVisibility\s*\(/)
    })

    it('does NOT contain inline status/expiry visibility predicates', () => {
      const src = readSource(ADMIN_LISTINGS_VIEW)
      expect(src).not.toMatch(/status\s*===?\s*['"]active['"]\s*&&\s*expires_at/)
      expect(src).not.toMatch(/expires_at\s*[<>]=?\s*new\s+Date/)
    })
  })
})

// ── Task 457 (LV.4): per-ListingStatus invariant — query fragment ⇔ predicate ⇔ badge ─

describe('Per-ListingStatus invariant: fragment ⇔ predicate ⇔ badge (Task 457)', () => {
  const futureDate = new Date(Date.now() + 86_400_000).toISOString()
  const pastDate = new Date(Date.now() - 86_400_000).toISOString()

  const EXPIRY_CASES = [
    { label: 'future', expires_at: futureDate },
    { label: 'past', expires_at: pastDate },
    { label: 'null', expires_at: null as string | null },
  ] as const

  function mockQueryCapture() {
    const calls: Array<{ method: string; args: unknown[] }> = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const q: any = {
      eq(c: unknown, v: unknown) { calls.push({ method: 'eq', args: [c, v] }); return q },
      in(c: unknown, v: unknown) { calls.push({ method: 'in', args: [c, v] }); return q },
      gte(c: unknown, v: unknown) { calls.push({ method: 'gte', args: [c, v] }); return q },
      not(c: unknown, o: unknown, v: unknown) { calls.push({ method: 'not', args: [c, o, v] }); return q },
    }
    return { q, calls }
  }

  function wouldFragmentSelect(status: ListingStatus, expires_at: string | null): boolean {
    const { q, calls } = mockQueryCapture()
    applyPublicVisibility(q)

    const statusCall = calls[0]
    let statusMatch = false
    if (statusCall.method === 'eq') {
      statusMatch = statusCall.args[1] === status
    } else if (statusCall.method === 'in') {
      statusMatch = (statusCall.args[1] as string[]).includes(status)
    }
    if (!statusMatch) return false

    const gteCall = calls.find(c => c.method === 'gte' && c.args[0] === 'expires_at')
    if (gteCall) {
      if (expires_at === null) return false
      return new Date(expires_at) >= new Date(gteCall.args[1] as string)
    }
    return true
  }

  for (const status of ALL_STATUSES) {
    describe(`status="${status}"`, () => {
      for (const { label, expires_at } of EXPIRY_CASES) {
        it(`${label} expiry: fragment ⇔ predicate ⇔ badge agree`, () => {
          const fragmentSelects = wouldFragmentSelect(status, expires_at)
          const predicate = isListingPubliclyVisible({ status, expires_at })
          const badge = formatVisibility({ status, expires_at })

          expect(fragmentSelects, `fragment vs predicate for ${status}/${label}`).toBe(predicate.visible)
          expect(badge.visible, `badge vs predicate for ${status}/${label}`).toBe(predicate.visible)
          expect(badge.reason, `badge reason vs predicate for ${status}/${label}`).toBe(predicate.reason)

          if (predicate.visible) {
            expect(badge.labelKey).toBe('visibility_visible')
          } else {
            expect(badge.labelKey).not.toBe('visibility_visible')
          }
        })
      }
    })
  }
})

// ── Task 956 AC6: ONE rule for who may open a listing by its address ─────────
// The database policy "Listings viewable by everyone" (supabase/sql_migrations/task956/v8b.sql), getListingAccessState and the recently-viewed queries all follow this one
// table: an active listing until its expiry, a sold or rented listing, and the owner's own listing. PUBLIC_VISIBLE_STATUSES above is the narrower rule for LISTS (search
// results, the sitemap): a sold listing can be opened by its address (owner decision D72) but is not listed.

describe('open by address (Task 956 AC6)', () => {
  const FUTURE = new Date(Date.now() + 86_400_000).toISOString()
  const PAST = new Date(Date.now() - 86_400_000).toISOString()
  const OWNER = 'owner-id'
  const STRANGER = 'stranger-id'

  /** the rule written out by hand, status by status, so a change of the implementation cannot change its own expectation */
  function expectedOpen(status: ListingStatus, expiry: 'future' | 'past' | 'null', viewer: string | null): boolean {
    if (viewer === OWNER) return true
    if (status === 'sold' || status === 'rented') return true
    if (status === 'active') return expiry === 'future'
    return false
  }

  for (const status of ALL_STATUSES) {
    for (const [expiry, expires_at] of [['future', FUTURE], ['past', PAST], ['null', null]] as const) {
      for (const viewer of [null, STRANGER, OWNER]) {
        it(`${status} / ${expiry} expiry / ${viewer ?? 'a guest'} → ${expectedOpen(status, expiry, viewer) ? 'open' : 'hidden'}`, () => {
          expect(isListingOpenableByAddress({ status, expires_at, user_id: OWNER }, viewer)).toBe(expectedOpen(status, expiry, viewer))
        })
      }
    }
  }

  it('archived is not open to a visitor (it leaves the public set), expired and pending neither', () => {
    for (const status of ['archived', 'expired', 'pending', 'inactive'] as const) {
      expect(isListingOpenableByAddress({ status, expires_at: FUTURE, user_id: OWNER }, null), status).toBe(false)
    }
  })

  it('a listing with no owner given is judged as a visitor sees it', () => {
    expect(isListingOpenableByAddress({ status: 'sold', expires_at: PAST })).toBe(true)
    expect(isListingOpenableByAddress({ status: 'active', expires_at: PAST })).toBe(false)
    expect(isListingOpenableByAddress({ status: 'pending', expires_at: FUTURE })).toBe(false)
  })

  it('the statuses a query asks for are exactly the ones the table opens', () => {
    expect([...OPEN_BY_ADDRESS_STATUSES].sort()).toEqual(['active', 'rented', 'sold'])
    expect(Object.keys(OPEN_BY_ADDRESS).sort()).toEqual(['active', 'rented', 'sold'])
    expect(OPEN_BY_ADDRESS.active).toEqual({ requiresUnexpired: true })
    expect(OPEN_BY_ADDRESS.sold).toEqual({ requiresUnexpired: false })
    expect(OPEN_BY_ADDRESS.rented).toEqual({ requiresUnexpired: false })
  })

  // The SQL predicate is generated from the same table, so a status added to one and not to the other fails here.
  const sqlOf = (file: string) => fs.readFileSync(path.resolve(process.cwd(), 'supabase/sql_migrations/task956', file), 'utf8').replace(/\s+/g, ' ')
  const cast = (status: string) => `'${status}'::public.listing_status`
  const expiring = Object.entries(OPEN_BY_ADDRESS).filter(([, rule]) => rule?.requiresUnexpired).map(([status]) => status)
  const always = Object.entries(OPEN_BY_ADDRESS).filter(([, rule]) => rule && !rule.requiresUnexpired).map(([status]) => status)
  const predicate = [
    ...expiring.map((status) => `(status = ${cast(status)} and expires_at > now())`),
    `status in (${always.map(cast).join(', ')})`,
    'auth.uid() = user_id',
  ].join(' or ')

  it('v8b.sql carries the same rule in the SELECT policy of listings', () => {
    expect(sqlOf('v8b.sql')).toContain(`alter policy "Listings viewable by everyone" on public.listings using (${predicate});`)
  })

  it('v8b-rollback.sql restores the previous rule (every public status, no expiry)', () => {
    expect(sqlOf('v8b-rollback.sql')).toContain(
      `alter policy "Listings viewable by everyone" on public.listings using (status = any (array['active'::public.listing_status, 'sold'::public.listing_status, 'rented'::public.listing_status]) or auth.uid() = user_id);`,
    )
  })

  // Task 956 F7: the view counter public.record_listing_view(uuid, uuid, text) counts a view of a listing the one rule opens, with the condition built from the same table.
  // The text below is the live definition of the function, read read-only with pg_get_functiondef on 2026-11-15; v8b.sql changes only its status condition and
  // v8b-rollback.sql restores it word for word (comments and layout aside).
  const LIVE_RECORD_LISTING_VIEW = `CREATE OR REPLACE FUNCTION public.record_listing_view(p_listing_id uuid, p_user_id uuid DEFAULT NULL::uuid, p_ip_hash text DEFAULT ''::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_hash text := left(coalesce(p_ip_hash, ''), 64);
begin
  -- same statuses as the view route (src/app/api/listings/[slug]/view/route.ts)
  if not exists (select 1 from listings where id = p_listing_id and status in ('active', 'sold', 'rented', 'archived')) then return false; end if;
  if p_user_id is null and v_hash = '' then return false; end if;   -- nothing to de-duplicate by: not counted
  perform pg_advisory_xact_lock(hashtextextended(p_listing_id::text || '|' || coalesce(p_user_id::text, 'ip:' || v_hash), 0));
  if exists (
    select 1 from listing_views
    where listing_id = p_listing_id and viewed_at >= now() - interval '24 hours'
      and ((p_user_id is not null and user_id = p_user_id) or (p_user_id is null and ip_hash = v_hash))
  ) then return false; end if;
  insert into listing_views (listing_id, user_id, ip_hash, viewed_at) values (p_listing_id, p_user_id, v_hash, now());
  update listings set views_count = views_count + 1 where id = p_listing_id;
  return true;
end $function$`
  const LIVE_STATUS_CONDITION = `status in ('active', 'sold', 'rented', 'archived')`
  const functionCondition = [
    ...expiring.map((status) => `(status = '${status}' and expires_at > now())`),
    `status in (${always.map((status) => `'${status}'`).join(', ')})`,
  ].join(' or ')
  // comments and layout are not part of the comparison; the function is cut out of the file from its CREATE to the closing dollar quote
  const normalise = (text: string) => text.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  const functionOf = (file: string): string => {
    const found = /create or replace function public\.record_listing_view[\s\S]*?\$function\$[\s\S]*?\$function\$/i.exec(fs.readFileSync(path.resolve(process.cwd(), 'supabase/sql_migrations/task956', file), 'utf8'))
    expect(found, `${file} defines public.record_listing_view`).not.toBeNull()
    return found![0]
  }

  it('v8b.sql: record_listing_view opens the same statuses and the same expiry as the table, and changes nothing else of the function', () => {
    const expected = normalise(LIVE_RECORD_LISTING_VIEW.replace(LIVE_STATUS_CONDITION, `(${functionCondition})`))
    expect(expected, 'the expected text carries the condition built from OPEN_BY_ADDRESS').toContain(`and (${functionCondition})) then return false`)
    expect(normalise(functionOf('v8b.sql'))).toBe(expected)
    expect(normalise(functionOf('v8b.sql')), 'archived is not counted any more').not.toContain('archived')
  })

  it('v8b-rollback.sql restores the live definition of record_listing_view word for word', () => {
    expect(normalise(functionOf('v8b-rollback.sql'))).toBe(normalise(LIVE_RECORD_LISTING_VIEW))
  })
})
