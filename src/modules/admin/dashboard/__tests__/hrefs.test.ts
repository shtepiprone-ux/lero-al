import { describe, it, expect } from 'vitest'
import {
  listingPreviewHref,
  pendingListingsHref,
  pendingReportsHref,
  unassignedSupportHref,
  visibleListingsHref,
  hiddenEligibleHref,
  listingStatusHref,
  adm11SegmentHref,
} from '../hrefs'

describe('admin dashboard hrefs — every spec §3.1 target is pinned', () => {
  it('ADM-01 row and card targets', () => {
    expect(listingPreviewHref('abc-123')).toBe('/admin/listings/abc-123/preview')
    expect(pendingListingsHref()).toBe('/admin/listings?status=pending')
  })

  it('the preview path segment is encoded, never concatenated raw', () => {
    expect(listingPreviewHref('a/b c')).toBe('/admin/listings/a%2Fb%20c/preview')
  })

  it('ADM-02 target', () => {
    expect(pendingReportsHref()).toBe('/admin/reports?status=pending')
  })

  it('ADM-06 target carries both filters through URLSearchParams', () => {
    const href = unassignedSupportHref()
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/admin/support')
    expect(url.searchParams.get('assigned')).toBe('unassigned')
    expect(url.searchParams.get('status')).toBe('open,in_progress')
    expect(href).toBe('/admin/support?assigned=unassigned&status=open%2Cin_progress')
  })

  it('ADM-08 target', () => {
    expect(visibleListingsHref()).toBe('/admin/listings?visibility=visible')
  })

  it('ADM-09 targets: total, expired, no expiry', () => {
    expect(hiddenEligibleHref()).toBe('/admin/listings?visibility=hidden_eligible')
    expect(hiddenEligibleHref('expired')).toBe('/admin/listings?visibility=hidden_eligible&reason=expired')
    expect(hiddenEligibleHref('no_expiry')).toBe('/admin/listings?visibility=hidden_eligible&reason=no_expiry')
  })

  it('ADM-11 status segments target ?status=<s>', () => {
    expect(listingStatusHref('pending')).toBe('/admin/listings?status=pending')
    expect(listingStatusHref('sold')).toBe('/admin/listings?status=sold')
  })

  it('ADM-11 segment map: visible → ADM-08, active_hidden → ADM-09 total, the rest → ?status=', () => {
    expect(adm11SegmentHref('visible')).toBe(visibleListingsHref())
    expect(adm11SegmentHref('active_hidden')).toBe(hiddenEligibleHref())
    expect(adm11SegmentHref('pending')).toBe('/admin/listings?status=pending')
    expect(adm11SegmentHref('inactive')).toBe('/admin/listings?status=inactive')
    expect(adm11SegmentHref('sold')).toBe('/admin/listings?status=sold')
    expect(adm11SegmentHref('rented')).toBe('/admin/listings?status=rented')
    expect(adm11SegmentHref('archived')).toBe('/admin/listings?status=archived')
    expect(adm11SegmentHref('expired')).toBe('/admin/listings?status=expired')
  })
})
