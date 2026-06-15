import { describe, it, expect } from 'vitest'
import type { ListingStatus } from '@/types/database'
import {
  ALLOWED_LISTING_TRANSITIONS,
  canTransitionListing,
  getAvailableTransitions,
  resolveTransition,
  getTransitionActionForStatus,
  assertCanTransitionListing,
  ListingTransitionError,
  isTerminalListingStatus,
  isMarketClosedStatus,
  isModeratableStatus,
  getPrivilegedTargetStatuses,
  canSetStatusPrivileged,
  getAllowedTargetStatuses,
} from './listingTransitionEngine'

const ALL_STATUSES: ListingStatus[] = ['active', 'inactive', 'pending', 'sold', 'rented', 'archived']

// ── Transition matrix coverage ────────────────────────────────────────────────

describe('ALLOWED_LISTING_TRANSITIONS — exhaustive matrix', () => {
  it('covers all six DB statuses', () => {
    const statuses = ['active', 'inactive', 'pending', 'sold', 'rented', 'archived'] as const
    for (const s of statuses) {
      expect(ALLOWED_LISTING_TRANSITIONS[s]).toBeDefined()
    }
  })

  it('pending allows APPROVE, REJECT, ARCHIVE', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.pending).toContain('APPROVE')
    expect(ALLOWED_LISTING_TRANSITIONS.pending).toContain('REJECT')
    expect(ALLOWED_LISTING_TRANSITIONS.pending).toContain('ARCHIVE')
  })

  it('active allows UNPUBLISH, MARK_AS_SOLD, MARK_AS_RENTED, ARCHIVE, SEND_TO_REVIEW', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.active).toContain('UNPUBLISH')
    expect(ALLOWED_LISTING_TRANSITIONS.active).toContain('MARK_AS_SOLD')
    expect(ALLOWED_LISTING_TRANSITIONS.active).toContain('MARK_AS_RENTED')
    expect(ALLOWED_LISTING_TRANSITIONS.active).toContain('ARCHIVE')
    expect(ALLOWED_LISTING_TRANSITIONS.active).toContain('SEND_TO_REVIEW')
  })

  it('inactive allows PUBLISH, SEND_TO_REVIEW, ARCHIVE', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.inactive).toContain('PUBLISH')
    expect(ALLOWED_LISTING_TRANSITIONS.inactive).toContain('SEND_TO_REVIEW')
    expect(ALLOWED_LISTING_TRANSITIONS.inactive).toContain('ARCHIVE')
  })

  it('sold allows only ARCHIVE', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.sold).toEqual(['ARCHIVE'])
  })

  it('rented allows only ARCHIVE', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.rented).toEqual(['ARCHIVE'])
  })

  it('archived allows only RESTORE', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.archived).toEqual(['RESTORE'])
  })
})

// ── canTransitionListing ──────────────────────────────────────────────────────

describe('canTransitionListing — valid transitions', () => {
  it('pending → APPROVE is valid', () => expect(canTransitionListing('pending', 'APPROVE')).toBe(true))
  it('pending → REJECT is valid', () => expect(canTransitionListing('pending', 'REJECT')).toBe(true))
  it('pending → ARCHIVE is valid', () => expect(canTransitionListing('pending', 'ARCHIVE')).toBe(true))
  it('active → UNPUBLISH is valid', () => expect(canTransitionListing('active', 'UNPUBLISH')).toBe(true))
  it('active → MARK_AS_SOLD is valid', () => expect(canTransitionListing('active', 'MARK_AS_SOLD')).toBe(true))
  it('active → MARK_AS_RENTED is valid', () => expect(canTransitionListing('active', 'MARK_AS_RENTED')).toBe(true))
  it('active → ARCHIVE is valid', () => expect(canTransitionListing('active', 'ARCHIVE')).toBe(true))
  it('active → SEND_TO_REVIEW is valid', () => expect(canTransitionListing('active', 'SEND_TO_REVIEW')).toBe(true))
  it('inactive → PUBLISH is valid', () => expect(canTransitionListing('inactive', 'PUBLISH')).toBe(true))
  it('inactive → SEND_TO_REVIEW is valid', () => expect(canTransitionListing('inactive', 'SEND_TO_REVIEW')).toBe(true))
  it('inactive → ARCHIVE is valid', () => expect(canTransitionListing('inactive', 'ARCHIVE')).toBe(true))
  it('sold → ARCHIVE is valid', () => expect(canTransitionListing('sold', 'ARCHIVE')).toBe(true))
  it('rented → ARCHIVE is valid', () => expect(canTransitionListing('rented', 'ARCHIVE')).toBe(true))
  it('archived → RESTORE is valid', () => expect(canTransitionListing('archived', 'RESTORE')).toBe(true))
})

describe('canTransitionListing — invalid transitions', () => {
  it('pending → PUBLISH is invalid', () => expect(canTransitionListing('pending', 'PUBLISH')).toBe(false))
  it('pending → MARK_AS_SOLD is invalid', () => expect(canTransitionListing('pending', 'MARK_AS_SOLD')).toBe(false))
  it('pending → RESTORE is invalid', () => expect(canTransitionListing('pending', 'RESTORE')).toBe(false))
  it('active → APPROVE is invalid', () => expect(canTransitionListing('active', 'APPROVE')).toBe(false))
  it('active → RESTORE is invalid', () => expect(canTransitionListing('active', 'RESTORE')).toBe(false))
  it('active → PUBLISH is invalid', () => expect(canTransitionListing('active', 'PUBLISH')).toBe(false))
  it('inactive → APPROVE is invalid', () => expect(canTransitionListing('inactive', 'APPROVE')).toBe(false))
  it('inactive → MARK_AS_SOLD is invalid', () => expect(canTransitionListing('inactive', 'MARK_AS_SOLD')).toBe(false))
  it('inactive → RESTORE is invalid', () => expect(canTransitionListing('inactive', 'RESTORE')).toBe(false))
  it('sold → RESTORE is invalid', () => expect(canTransitionListing('sold', 'RESTORE')).toBe(false))
  it('sold → MARK_AS_RENTED is invalid', () => expect(canTransitionListing('sold', 'MARK_AS_RENTED')).toBe(false))
  it('sold → PUBLISH is invalid', () => expect(canTransitionListing('sold', 'PUBLISH')).toBe(false))
  it('rented → RESTORE is invalid', () => expect(canTransitionListing('rented', 'RESTORE')).toBe(false))
  it('rented → PUBLISH is invalid', () => expect(canTransitionListing('rented', 'PUBLISH')).toBe(false))
  it('archived → ARCHIVE is invalid', () => expect(canTransitionListing('archived', 'ARCHIVE')).toBe(false))
  it('archived → PUBLISH is invalid', () => expect(canTransitionListing('archived', 'PUBLISH')).toBe(false))
  it('archived → APPROVE is invalid', () => expect(canTransitionListing('archived', 'APPROVE')).toBe(false))
})

// ── getAvailableTransitions ───────────────────────────────────────────────────

describe('getAvailableTransitions', () => {
  it('returns readonly array for each status', () => {
    const statuses = ['active', 'inactive', 'pending', 'sold', 'rented', 'archived'] as const
    for (const s of statuses) {
      const available = getAvailableTransitions(s)
      expect(Array.isArray(available)).toBe(true)
    }
  })

  it('sold and rented have exactly one transition each', () => {
    expect(getAvailableTransitions('sold').length).toBe(1)
    expect(getAvailableTransitions('rented').length).toBe(1)
  })

  it('archived has exactly one transition', () => {
    expect(getAvailableTransitions('archived').length).toBe(1)
  })
})

// ── resolveTransition ─────────────────────────────────────────────────────────

describe('resolveTransition — valid transitions produce correct nextStatus', () => {
  it('pending + APPROVE → active', () => {
    const r = resolveTransition('pending', 'APPROVE')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('active')
  })

  it('pending + REJECT → inactive', () => {
    const r = resolveTransition('pending', 'REJECT')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('inactive')
  })

  it('active + UNPUBLISH → inactive', () => {
    const r = resolveTransition('active', 'UNPUBLISH')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('inactive')
  })

  it('active + MARK_AS_SOLD → sold', () => {
    const r = resolveTransition('active', 'MARK_AS_SOLD')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('sold')
  })

  it('active + MARK_AS_RENTED → rented', () => {
    const r = resolveTransition('active', 'MARK_AS_RENTED')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('rented')
  })

  it('active + ARCHIVE → archived', () => {
    const r = resolveTransition('active', 'ARCHIVE')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('archived')
  })

  it('active + SEND_TO_REVIEW → pending', () => {
    const r = resolveTransition('active', 'SEND_TO_REVIEW')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('pending')
  })

  it('inactive + PUBLISH → active', () => {
    const r = resolveTransition('inactive', 'PUBLISH')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('active')
  })

  it('inactive + SEND_TO_REVIEW → pending', () => {
    const r = resolveTransition('inactive', 'SEND_TO_REVIEW')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('pending')
  })

  it('sold + ARCHIVE → archived', () => {
    const r = resolveTransition('sold', 'ARCHIVE')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('archived')
  })

  it('rented + ARCHIVE → archived', () => {
    const r = resolveTransition('rented', 'ARCHIVE')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('archived')
  })

  it('archived + RESTORE → inactive', () => {
    const r = resolveTransition('archived', 'RESTORE')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('inactive')
  })
})

describe('resolveTransition — invalid transitions return typed failure', () => {
  it('sold + RESTORE returns invalid_transition', () => {
    const r = resolveTransition('sold', 'RESTORE')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_transition')
  })

  it('archived + ARCHIVE returns invalid_transition', () => {
    const r = resolveTransition('archived', 'ARCHIVE')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_transition')
  })

  it('pending + PUBLISH returns invalid_transition', () => {
    const r = resolveTransition('pending', 'PUBLISH')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_transition')
  })

  it('rented + APPROVE returns invalid_transition', () => {
    const r = resolveTransition('rented', 'APPROVE')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_transition')
  })
})

// ── getTransitionActionForStatus ──────────────────────────────────────────────

describe('getTransitionActionForStatus — status-to-status bridge', () => {
  it('pending → active returns APPROVE', () => {
    expect(getTransitionActionForStatus('pending', 'active')).toBe('APPROVE')
  })

  it('pending → inactive returns REJECT', () => {
    expect(getTransitionActionForStatus('pending', 'inactive')).toBe('REJECT')
  })

  it('pending → archived returns ARCHIVE', () => {
    expect(getTransitionActionForStatus('pending', 'archived')).toBe('ARCHIVE')
  })

  it('active → inactive returns UNPUBLISH', () => {
    expect(getTransitionActionForStatus('active', 'inactive')).toBe('UNPUBLISH')
  })

  it('active → sold returns MARK_AS_SOLD', () => {
    expect(getTransitionActionForStatus('active', 'sold')).toBe('MARK_AS_SOLD')
  })

  it('active → rented returns MARK_AS_RENTED', () => {
    expect(getTransitionActionForStatus('active', 'rented')).toBe('MARK_AS_RENTED')
  })

  it('active → archived returns ARCHIVE', () => {
    expect(getTransitionActionForStatus('active', 'archived')).toBe('ARCHIVE')
  })

  it('inactive → active returns PUBLISH', () => {
    expect(getTransitionActionForStatus('inactive', 'active')).toBe('PUBLISH')
  })

  it('archived → inactive returns RESTORE', () => {
    expect(getTransitionActionForStatus('archived', 'inactive')).toBe('RESTORE')
  })

  it('returns null for same-status no-op', () => {
    expect(getTransitionActionForStatus('active', 'active')).toBeNull()
  })

  it('returns null for invalid transition sold → active', () => {
    expect(getTransitionActionForStatus('sold', 'active')).toBeNull()
  })

  it('returns null for invalid transition archived → active', () => {
    expect(getTransitionActionForStatus('archived', 'active')).toBeNull()
  })

  it('returns null for invalid transition rented → pending', () => {
    expect(getTransitionActionForStatus('rented', 'pending')).toBeNull()
  })
})

// ── assertCanTransitionListing ────────────────────────────────────────────────

describe('assertCanTransitionListing', () => {
  it('does not throw for valid transition pending → APPROVE', () => {
    expect(() => assertCanTransitionListing('pending', 'APPROVE')).not.toThrow()
  })

  it('does not throw for valid transition active → MARK_AS_SOLD', () => {
    expect(() => assertCanTransitionListing('active', 'MARK_AS_SOLD')).not.toThrow()
  })

  it('throws ListingTransitionError for invalid transition sold → RESTORE', () => {
    expect(() => assertCanTransitionListing('sold', 'RESTORE')).toThrow(ListingTransitionError)
  })

  it('throws ListingTransitionError for archived → ARCHIVE', () => {
    expect(() => assertCanTransitionListing('archived', 'ARCHIVE')).toThrow(ListingTransitionError)
  })

  it('thrown error carries currentStatus and action', () => {
    let caught: unknown
    try { assertCanTransitionListing('rented', 'PUBLISH') } catch (e) { caught = e }
    expect(caught).toBeInstanceOf(ListingTransitionError)
    const err = caught as ListingTransitionError
    expect(err.currentStatus).toBe('rented')
    expect(err.action).toBe('PUBLISH')
  })
})

// ── isTerminalListingStatus ───────────────────────────────────────────────────

describe('isTerminalListingStatus', () => {
  it('sold is terminal', () => expect(isTerminalListingStatus('sold')).toBe(true))
  it('rented is terminal', () => expect(isTerminalListingStatus('rented')).toBe(true))
  it('active is not terminal', () => expect(isTerminalListingStatus('active')).toBe(false))
  it('inactive is not terminal', () => expect(isTerminalListingStatus('inactive')).toBe(false))
  it('pending is not terminal', () => expect(isTerminalListingStatus('pending')).toBe(false))
  it('archived is not terminal — RESTORE leads to inactive', () => {
    expect(isTerminalListingStatus('archived')).toBe(false)
  })
})

// ── isMarketClosedStatus ──────────────────────────────────────────────────────

describe('isMarketClosedStatus', () => {
  it('sold is market closed', () => expect(isMarketClosedStatus('sold')).toBe(true))
  it('rented is market closed', () => expect(isMarketClosedStatus('rented')).toBe(true))
  it('active is not market closed', () => expect(isMarketClosedStatus('active')).toBe(false))
  it('inactive is not market closed', () => expect(isMarketClosedStatus('inactive')).toBe(false))
  it('pending is not market closed', () => expect(isMarketClosedStatus('pending')).toBe(false))
  it('archived is not market closed', () => expect(isMarketClosedStatus('archived')).toBe(false))
  it('equals isTerminalListingStatus for all statuses', () => {
    const statuses = ['active', 'inactive', 'pending', 'sold', 'rented', 'archived'] as const
    for (const s of statuses) {
      expect(isMarketClosedStatus(s)).toBe(isTerminalListingStatus(s))
    }
  })
})

// ── isModeratableStatus ───────────────────────────────────────────────────────

describe('isModeratableStatus', () => {
  it('pending is moderatable', () => expect(isModeratableStatus('pending')).toBe(true))
  it('active is not moderatable', () => expect(isModeratableStatus('active')).toBe(false))
  it('inactive is not moderatable', () => expect(isModeratableStatus('inactive')).toBe(false))
  it('sold is not moderatable', () => expect(isModeratableStatus('sold')).toBe(false))
  it('rented is not moderatable', () => expect(isModeratableStatus('rented')).toBe(false))
  it('archived is not moderatable', () => expect(isModeratableStatus('archived')).toBe(false))
})

// ── Restore flow ──────────────────────────────────────────────────────────────

describe('archived restore flow', () => {
  it('archived can be restored to inactive via RESTORE', () => {
    expect(canTransitionListing('archived', 'RESTORE')).toBe(true)
    const r = resolveTransition('archived', 'RESTORE')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('inactive')
  })

  it('restored inactive can be published', () => {
    expect(canTransitionListing('inactive', 'PUBLISH')).toBe(true)
    const r = resolveTransition('inactive', 'PUBLISH')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('active')
  })

  it('archived cannot go directly to active', () => {
    expect(canTransitionListing('archived', 'PUBLISH')).toBe(false)
    expect(getTransitionActionForStatus('archived', 'active')).toBeNull()
  })
})

// ── Future moderation support ─────────────────────────────────────────────────

describe('future moderation re-review flow', () => {
  it('active listing can be sent to review via SEND_TO_REVIEW', () => {
    expect(canTransitionListing('active', 'SEND_TO_REVIEW')).toBe(true)
    const r = resolveTransition('active', 'SEND_TO_REVIEW')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nextStatus).toBe('pending')
  })

  it('pending listing resulting from re-review can be approved', () => {
    expect(canTransitionListing('pending', 'APPROVE')).toBe(true)
  })

  it('pending listing resulting from re-review can be rejected', () => {
    expect(canTransitionListing('pending', 'REJECT')).toBe(true)
  })
})

// ── Transition determinism ────────────────────────────────────────────────────

describe('transition determinism', () => {
  it('resolveTransition is idempotent — same inputs always produce same output', () => {
    for (let i = 0; i < 3; i++) {
      expect(resolveTransition('active', 'MARK_AS_SOLD')).toEqual({ ok: true, nextStatus: 'sold' })
      expect(resolveTransition('sold', 'RESTORE')).toEqual({ ok: false, reason: 'invalid_transition' })
    }
  })

  it('getTransitionActionForStatus is consistent with resolveTransition', () => {
    const pairs: [ListingStatus, ListingStatus][] = [
      ['pending', 'active'],
      ['active', 'sold'],
      ['inactive', 'active'],
      ['archived', 'inactive'],
    ]
    for (const [from, to] of pairs) {
      const action = getTransitionActionForStatus(from, to)
      expect(action).not.toBeNull()
      if (action) {
        const result = resolveTransition(from, action)
        expect(result.ok).toBe(true)
        if (result.ok) expect(result.nextStatus).toBe(to)
      }
    }
  })
})

// ── Regression guard: base matrix + semantic helpers unchanged (Task 427) ────

describe('regression guard — base matrix and semantic helpers unchanged', () => {
  it('ALLOWED_LISTING_TRANSITIONS still has exactly the original six statuses', () => {
    expect(Object.keys(ALLOWED_LISTING_TRANSITIONS).sort()).toEqual([...ALL_STATUSES].sort())
  })

  it('sold/rented/archived base matrices unchanged', () => {
    expect(ALLOWED_LISTING_TRANSITIONS.sold).toEqual(['ARCHIVE'])
    expect(ALLOWED_LISTING_TRANSITIONS.rented).toEqual(['ARCHIVE'])
    expect(ALLOWED_LISTING_TRANSITIONS.archived).toEqual(['RESTORE'])
  })

  it('isTerminalListingStatus/isMarketClosedStatus/isModeratableStatus unchanged for all statuses', () => {
    expect(isTerminalListingStatus('sold')).toBe(true)
    expect(isTerminalListingStatus('rented')).toBe(true)
    expect(isTerminalListingStatus('archived')).toBe(false)
    expect(isMarketClosedStatus('sold')).toBe(true)
    expect(isMarketClosedStatus('rented')).toBe(true)
    expect(isModeratableStatus('pending')).toBe(true)
    expect(isModeratableStatus('active')).toBe(false)
  })
})

// ── getPrivilegedTargetStatuses (Task 427) ────────────────────────────────────

describe('getPrivilegedTargetStatuses', () => {
  it('returns all other statuses, excluding the current one', () => {
    for (const s of ALL_STATUSES) {
      const targets = getPrivilegedTargetStatuses(s)
      expect(targets).not.toContain(s)
      expect(targets.sort()).toEqual(ALL_STATUSES.filter(x => x !== s).sort())
    }
  })

  it('sold can target every other status, not just archived', () => {
    const targets = getPrivilegedTargetStatuses('sold')
    expect(targets).toContain('active')
    expect(targets).toContain('pending')
    expect(targets).toContain('inactive')
    expect(targets).toContain('rented')
    expect(targets).toContain('archived')
  })

  it('archived can target active directly (privileged-only, not in base matrix)', () => {
    expect(getPrivilegedTargetStatuses('archived')).toContain('active')
  })
})

// ── canSetStatusPrivileged (Task 427) ─────────────────────────────────────────

describe('canSetStatusPrivileged', () => {
  it('returns false for same-status (from === to)', () => {
    for (const s of ALL_STATUSES) {
      expect(canSetStatusPrivileged(s, s)).toBe(false)
    }
  })

  it('returns true for any distinct pair of known statuses', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        if (from === to) continue
        expect(canSetStatusPrivileged(from, to)).toBe(true)
      }
    }
  })

  it('allows transitions not present in the base matrix (e.g. sold → active, archived → pending)', () => {
    expect(canSetStatusPrivileged('sold', 'active')).toBe(true)
    expect(canSetStatusPrivileged('archived', 'pending')).toBe(true)
    expect(canSetStatusPrivileged('pending', 'sold')).toBe(true)
  })
})

// ── getAllowedTargetStatuses (Task 427) ───────────────────────────────────────

describe('getAllowedTargetStatuses', () => {
  it('privileged: true returns the full any-status set (excluding current)', () => {
    for (const s of ALL_STATUSES) {
      expect(getAllowedTargetStatuses(s, { privileged: true }).sort())
        .toEqual(getPrivilegedTargetStatuses(s).sort())
    }
  })

  it('privileged: false matches the base-matrix-derived targets (unchanged behavior)', () => {
    expect(getAllowedTargetStatuses('active', { privileged: false }).sort())
      .toEqual(['archived', 'inactive', 'pending', 'rented', 'sold'].sort())
    expect(getAllowedTargetStatuses('sold', { privileged: false }))
      .toEqual(['archived'])
    expect(getAllowedTargetStatuses('archived', { privileged: false }))
      .toEqual(['inactive'])
  })

  it('privileged: false never includes the current status itself', () => {
    for (const s of ALL_STATUSES) {
      expect(getAllowedTargetStatuses(s, { privileged: false })).not.toContain(s)
    }
  })
})
