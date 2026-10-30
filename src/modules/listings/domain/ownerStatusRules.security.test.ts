/**
 * Owner decision D8 (2026-10-17): the owner of a listing cannot publish it; only an administrator / moderator sets `active`. This is the shared domain rule that
 * both the status control in the form and the server gateway use. Expectations are written out as literals from the decision, not computed with the function
 * under test. Contract: tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json.
 */
import { describe, expect, it } from 'vitest'
import type { ListingStatus } from '@/types/database'
import {
  STAFF_ONLY_TARGET_STATUSES,
  canOwnerSetStatus,
  getAllowedTargetStatuses,
  getOwnerTargetStatuses,
  getPrivilegedTargetStatuses,
} from './listingTransitionEngine'

const ALL: readonly ListingStatus[] = ['active', 'inactive', 'sold', 'rented', 'archived', 'pending', 'expired']

describe('owner status rules', () => {
  it('[SEC-D8-SRV-DOMAIN-DENY] the owner may set every status except active, from every current status, and active is the only staff-only status', () => {
    expect([...STAFF_ONLY_TARGET_STATUSES]).toEqual(['active'])
    for (const from of ALL) {
      for (const to of ALL) {
        // literal rule: a different status, and never active
        expect(canOwnerSetStatus(from, to), `${from} -> ${to}`).toBe(from !== to && to !== 'active')
      }
      const expectedOwner = ALL.filter(s => s !== from && s !== 'active')
      expect(getOwnerTargetStatuses(from).slice().sort(), `owner list from ${from}`).toEqual(expectedOwner.slice().sort())
      expect(getAllowedTargetStatuses(from, { privileged: true, canPublish: false }).slice().sort(), `form list for the owner from ${from}`).toEqual(expectedOwner.slice().sort())

      const expectedStaff = ALL.filter(s => s !== from)
      expect(getAllowedTargetStatuses(from, { privileged: true, canPublish: true }).slice().sort(), `form list for staff from ${from}`).toEqual(expectedStaff.slice().sort())
      expect(getPrivilegedTargetStatuses(from).slice().sort()).toEqual(expectedStaff.slice().sort())
    }
  })

  it('the owner list never contains active, even when the owner is looking at a listing that is not active', () => {
    for (const from of ALL) expect(getOwnerTargetStatuses(from)).not.toContain('active')
  })

  it('a listing that is already active can still be hidden, archived, sold, rented or sent back to review by the owner', () => {
    expect(getOwnerTargetStatuses('active').slice().sort()).toEqual(['archived', 'expired', 'inactive', 'pending', 'rented', 'sold'])
  })

  it('the base-matrix list (non-privileged) is untouched by the owner rule', () => {
    expect(getAllowedTargetStatuses('sold', { privileged: false })).toEqual(['archived'])
  })
})
