import { describe, it, expect } from 'vitest'
import {
  canUserEditListing,
  canAdminEditListing,
  checkEditPermission,
  assertCanEditListing,
  ListingEditForbiddenError,
} from './listingPermissions'

describe('canUserEditListing', () => {
  it('allows owner regardless of role', () => {
    expect(canUserEditListing('u1', 'u1', null)).toBe(true)
    expect(canUserEditListing('u1', 'u1', 'user')).toBe(true)
  })

  it('allows admin to edit foreign listing', () => {
    expect(canUserEditListing('u1', 'u2', 'admin')).toBe(true)
  })

  it('allows moderator to edit foreign listing', () => {
    expect(canUserEditListing('u1', 'u2', 'moderator')).toBe(true)
  })

  it('blocks non-owner with no role', () => {
    expect(canUserEditListing('u1', 'u2', null)).toBe(false)
  })

  it('blocks non-owner with user role', () => {
    expect(canUserEditListing('u1', 'u2', 'user')).toBe(false)
  })
})

describe('canAdminEditListing', () => {
  it('allows admin', () => {
    expect(canAdminEditListing('admin')).toBe(true)
  })

  it('allows moderator', () => {
    expect(canAdminEditListing('moderator')).toBe(true)
  })

  it('blocks null', () => {
    expect(canAdminEditListing(null)).toBe(false)
  })

  it('blocks user role', () => {
    expect(canAdminEditListing('user')).toBe(false)
  })
})

describe('checkEditPermission', () => {
  it('returns ok for owner with active listing', () => {
    const result = checkEditPermission('owner', { user_id: 'owner', status: 'active' }, null)
    expect(result).toEqual({ ok: true })
  })

  it('returns ok for owner with pending listing', () => {
    const result = checkEditPermission('owner', { user_id: 'owner', status: 'pending' }, null)
    expect(result).toEqual({ ok: true })
  })

  it('returns ok for owner with inactive listing', () => {
    const result = checkEditPermission('owner', { user_id: 'owner', status: 'inactive' }, null)
    expect(result).toEqual({ ok: true })
  })

  it('returns ok for admin editing a foreign active listing', () => {
    const result = checkEditPermission('admin', { user_id: 'owner', status: 'active' }, 'admin')
    expect(result).toEqual({ ok: true })
  })

  it('returns ok for moderator editing a foreign inactive listing', () => {
    const result = checkEditPermission('mod', { user_id: 'owner', status: 'inactive' }, 'moderator')
    expect(result).toEqual({ ok: true })
  })

  it('returns not_editable for sold listing — applies to owner', () => {
    const result = checkEditPermission('owner', { user_id: 'owner', status: 'sold' }, null)
    expect(result).toEqual({ ok: false, reason: 'not_editable' })
  })

  it('returns not_editable for rented listing — applies to owner', () => {
    const result = checkEditPermission('owner', { user_id: 'owner', status: 'rented' }, null)
    expect(result).toEqual({ ok: false, reason: 'not_editable' })
  })

  it('returns not_editable for archived listing — applies to admin too', () => {
    const result = checkEditPermission('admin', { user_id: 'owner', status: 'archived' }, 'admin')
    expect(result).toEqual({ ok: false, reason: 'not_editable' })
  })

  it('not_editable takes precedence over forbidden', () => {
    // non-owner + sold: status check runs first
    const result = checkEditPermission('other', { user_id: 'owner', status: 'sold' }, null)
    expect(result).toEqual({ ok: false, reason: 'not_editable' })
  })

  it('returns forbidden for non-owner on editable listing', () => {
    const result = checkEditPermission('other', { user_id: 'owner', status: 'active' }, null)
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })

  it('returns forbidden for user-role on foreign active listing', () => {
    const result = checkEditPermission('other', { user_id: 'owner', status: 'active' }, 'user')
    expect(result).toEqual({ ok: false, reason: 'forbidden' })
  })
})

describe('assertCanEditListing', () => {
  it('does not throw for owner with active listing', () => {
    expect(() =>
      assertCanEditListing('owner', { user_id: 'owner', status: 'active' }, null)
    ).not.toThrow()
  })

  it('throws ListingEditForbiddenError with reason not_editable for sold', () => {
    let caught: unknown
    try { assertCanEditListing('owner', { user_id: 'owner', status: 'sold' }, null) }
    catch (e) { caught = e }
    expect(caught).toBeInstanceOf(ListingEditForbiddenError)
    expect((caught as ListingEditForbiddenError).reason).toBe('not_editable')
  })

  it('throws ListingEditForbiddenError with reason forbidden for non-owner', () => {
    let caught: unknown
    try { assertCanEditListing('other', { user_id: 'owner', status: 'active' }, null) }
    catch (e) { caught = e }
    expect(caught).toBeInstanceOf(ListingEditForbiddenError)
    expect((caught as ListingEditForbiddenError).reason).toBe('forbidden')
  })
})
