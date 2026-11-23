/**
 * Owner decision D8 (2026-10-17): the owner of a listing cannot publish it; only an administrator / moderator sets `active`. Owner decisions O957-10 (2026-11-21, Task 957 Revision 3) and O957-11 (Revision 4)
 * add that the owner does not send an ACTIVE listing to review, and sends every other listing to moderation ("Publish": `pending`). This is the shared domain rule that both the status control in the form and the server gateway use. Expectations are written out as literals from the decision, not computed with the function
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
  it('[SEC-D8-SRV-DOMAIN-DENY] the owner may set every status except active, and pending from every status but active (O957-11), from every current status; active is the only staff-only status', () => {
    expect([...STAFF_ONLY_TARGET_STATUSES]).toEqual(['active'])
    for (const from of ALL) {
      for (const to of ALL) {
        // literal rule: a different status, never active, and pending never from active
        expect(canOwnerSetStatus(from, to), `${from} -> ${to}`).toBe(from !== to && to !== 'active' && !(to === 'pending' && from === 'active'))
      }
      const expectedOwner = ALL.filter(s => s !== from && s !== 'active' && !(s === 'pending' && from === 'active'))
      expect(getOwnerTargetStatuses(from).slice().sort(), `owner list from ${from}`).toEqual(expectedOwner.slice().sort())
      expect(getAllowedTargetStatuses(from, { privileged: true, canPublish: false }).slice().sort(), `form list for the owner from ${from}`).toEqual(expectedOwner.slice().sort())

      const expectedStaff = ALL.filter(s => s !== from)
      expect(getAllowedTargetStatuses(from, { privileged: true, canPublish: true }).slice().sort(), `form list for staff from ${from}`).toEqual(expectedStaff.slice().sort())
      expect(getPrivilegedTargetStatuses(from).slice().sort()).toEqual(expectedStaff.slice().sort())
    }
  })

  it('the owner list never contains active, whatever the status of the listing (D8)', () => {
    for (const from of ALL) {
      expect(getOwnerTargetStatuses(from)).not.toContain('active')
      expect(canOwnerSetStatus(from, 'active'), `${from} -> active`).toBe(false)
    }
  })

  // Owner decision O957-11 (2026-11-21, Task 957 Revision 4, translated: "he must see the option 'Publish', after which his listing goes to moderation"): the way back for the owner is `pending`
  it('[SEC-O957-11-DOMAIN] the owner sends a listing to moderation from inactive, archived, sold, rented and expired, and not from active', () => {
    for (const from of ['inactive', 'archived', 'sold', 'rented', 'expired'] as const) {
      expect(canOwnerSetStatus(from, 'pending'), `${from} -> pending`).toBe(true)
      expect(getOwnerTargetStatuses(from), `owner list from ${from}`).toContain('pending')
    }
    expect(canOwnerSetStatus('active', 'pending')).toBe(false)
    expect(getOwnerTargetStatuses('active')).not.toContain('pending')
    expect(canOwnerSetStatus('pending', 'pending')).toBe(false)
  })

  it('staff still may send a listing to review (the status stays a staff target)', () => {
    for (const from of ALL.filter(s => s !== 'pending')) expect(getAllowedTargetStatuses(from, { privileged: true, canPublish: true })).toContain('pending')
  })

  it('a listing that is already active can still be hidden, archived, sold or rented by the owner, and not sent to review', () => {
    expect(getOwnerTargetStatuses('active').slice().sort()).toEqual(['archived', 'expired', 'inactive', 'rented', 'sold'])
  })

  it('the base-matrix list (non-privileged) is untouched by the owner rule', () => {
    expect(getAllowedTargetStatuses('sold', { privileged: false })).toEqual(['archived'])
  })
})
