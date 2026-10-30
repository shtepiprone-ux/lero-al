/**
 * Security (Task 923 R74, owner decision D53): the owner sees that an edit of an ACTIVE listing went to moderation.
 *  - SEC-X-FE-EDIT-MODERATION: the REAL `ListingFormShell` (the container: validation, the save call, the result handling) runs in edit mode. The save action answers
 *    `status: 'pending'` (the owner's edit of an active listing moved it to review): the shell shows the moderation message, never the "published" one, and redirects to the
 *    owner's cabinet, not to the public page of an active listing. The control: an answer `active` (a staff edit) shows the normal success message and the public page.
 * The save actions, the router and the translations are doubles; the presentational view is replaced by a stub that only exposes the container's props.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
const update = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back: vi.fn(), refresh: vi.fn() }), useParams: () => ({ slug: 'flat' }) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/actions/updateListing', () => ({ updateListing: (...a: unknown[]) => update(...a) }))
vi.mock('@/modules/listings/actions/createListing', () => ({ createListing: vi.fn() }))
vi.mock('@/modules/listings/actions/changeListingStatus', () => ({ changeListingStatusAction: vi.fn() }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { onSubmit: () => void; errors: Record<string, string>; submitError: string }) => (
    <div>
      <button type="button" onClick={() => void p.onSubmit()}>save</button>
      <output data-testid="errors">{Object.keys(p.errors).filter((k) => p.errors[k]).join(',')}</output>
      <output data-testid="submit-error">{p.submitError}</output>
    </div>
  ),
}))

import { ListingFormShell } from '../ListingFormShell'

const INITIAL = {
  listing_type: 'sale',
  property_type: 'land',
  title: 'A plot of land near Tirana',
  price: 90000,
  currency: 'EUR',
  // the fields the land schema requires before a save is attempted
  land_legal_status: 'ownership',
  land_zoning: 'residential',
  land_development_potential: 'high',
  images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg', is_cover: true, order: 0 }],
}
const shell = () => (
  <ListingFormShell
    mode="edit"
    locale="sq"
    uploadPreset="p"
    uploadFolder="f"
    locations={[]}
    listingId="l-1"
    initialValues={INITIAL as never}
    canManageStatus={false}
    canPublish={false}
    currentStatus="active"
  />
)

beforeEach(() => {
  vi.useFakeTimers()
  push.mockReset()
  update.mockReset()
})
afterEach(() => { cleanup(); vi.useRealTimers() })

async function save() {
  render(shell())
  await act(async () => { fireEvent.click(screen.getByText('save')) })
}

describe('ListingFormShell.moderation', () => {
  it('[SEC-X-FE-EDIT-MODERATION] the owner sees the listing went to moderation', async () => {
    update.mockResolvedValue({ slug: 'flat', status: 'pending' })
    await save()
    expect(document.body.textContent).toContain('saved_pending_moderation')                               // the pending status is shown
    expect(document.body.textContent).not.toContain('edit_success_body')                                // never the "published" text
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(push).toHaveBeenCalledWith('/sq/cabinet?tab=listings')                                      // the redirect for pending: the cabinet's listings tab, not the public page
    expect(push).not.toHaveBeenCalledWith('/sq/cabinet/listings')                                      // that path has no route (404)
    expect(push).not.toHaveBeenCalledWith('/sq/listings/flat')
  })

  it('an answer `active` (a staff edit) shows the normal success text and the public page (the control)', async () => {
    update.mockResolvedValue({ slug: 'flat', status: 'active' })
    await save()
    expect(document.body.textContent).toContain('edit_success_body')
    expect(document.body.textContent).not.toContain('saved_pending_moderation')
    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(push).toHaveBeenCalledWith('/sq/listings/flat')
  })

  it('a failed move to review (`transition_failed`) is an error on the form: no success text, no redirect', async () => {
    update.mockResolvedValue({ error: 'transition_failed' })
    await save()
    expect(document.body.textContent).not.toContain('edit_success_title')
    expect(screen.getByTestId('submit-error').textContent).toBe('error_updating')
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(push).not.toHaveBeenCalled()
  })
})
