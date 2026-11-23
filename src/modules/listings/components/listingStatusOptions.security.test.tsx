/**
 * Task 923 R35 (owner decisions D6, D20, D22) and Task 957 Revisions 3, 4 and 5 (O957-10, O957-11, O957-16, O957-17): the status control of the listing form offers an owner only the operations,
 * in the order Publish (`pending`), Archived, Deactivate (`inactive`), Sold, Rented, without the current status and without `pending` from `active`, and offers staff every other status after the current one. The control is presentation; the gateway (`applyListingTransitionByStatus`) is the authority, so these cases protect only that the form shows
 * what the gateway accepts and that a refused change is not shown as saved. The real `StatusChangeSelect` renders the options the real
 * `buildListingStatusOptions` builds; only the toast sink and the server call are doubles.
 */
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../messages/en.json'
import itMessages from '../../../../messages/it.json'
import sqMessages from '../../../../messages/sq.json'
import ukMessages from '../../../../messages/uk.json'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { StatusChangeSelect } from '@/components/admin/StatusChangeSelect'
import { ALLOWED_LISTING_TRANSITIONS } from '@/modules/listings/domain/listingTransitionEngine'
import { buildListingStatusOptions } from './listingStatusOptions'
import type { ListingStatus } from '@/types/database'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast }))

const STATUSES = Object.keys(ALLOWED_LISTING_TRANSITIONS) as ListingStatus[]
const labelOf = (s: ListingStatus) => (messages.listing as Record<string, string>)[`status_${s}`]
const control = messages.admin.common.status_control

beforeEach(() => {
  setViewport(1024)
  // jsdom has no scrollIntoView; Mantine's Combobox calls it on the selected option.
  Element.prototype.scrollIntoView = vi.fn()
  toast.success.mockReset(); toast.error.mockReset()
})
afterEach(() => cleanup())

function renderControl(current: ListingStatus, canPublish: boolean, onSubmit = vi.fn().mockResolvedValue(undefined)) {
  renderApp(
    <StatusChangeSelect
      currentStatus={current}
      statuses={buildListingStatusOptions(current, { canPublish }, labelOf)}
      onSubmit={onSubmit}
      aria-label={control.status_change_label}
    />,
  )
  return onSubmit
}
const openSelect = () => fireEvent.click(screen.getByRole('textbox', { name: control.status_change_label }))
const offered = () => screen.queryAllByRole('option').map(o => o.textContent)

describe('listing status options', () => {
  it('[SEC-D8-FE-ALLOW] staff can pick active as the new status of a non-active listing', async () => {
    const onSubmit = renderControl('pending', true)
    openSelect()
    expect(offered()).toContain(labelOf('active'))
    fireEvent.click(screen.getByRole('option', { name: labelOf('active') }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ toStatus: 'active', note: null }))
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('[SEC-D8-FE-DENY] the owner is never offered active, expired or the current status, and pending only from a status other than active (O957-10, O957-11, O957-16, O957-17), for every status the listing can have', () => {
    for (const current of STATUSES) {
      const codes = buildListingStatusOptions(current, { canPublish: false }).map(o => o.code)
      expect(codes.includes('active'), `owner list of ${current}`).toBe(false)
      expect(codes.includes('expired'), `owner list of ${current}: expired is staff-only`).toBe(false)
      expect(codes.includes(current), `owner list of ${current}: the current status is a badge, not an operation (O957-16)`).toBe(false)
      expect(codes.includes('pending'), `owner list of ${current}: pending is offered from every status but active and pending`).toBe(current !== 'active' && current !== 'pending')
    }
    renderControl('pending', false)
    openSelect()
    expect(offered()).not.toContain(labelOf('active'))
    expect(offered()).not.toContain(labelOf('pending'))
    expect(offered()).toContain(labelOf('inactive'))
  })

  // Owner decision O957-17 (2026-11-23, Task 957 Revision 5, translated: "an agent and users (except an admin and a moderator) must have this set of options in the combobox: Publish, Archive, Deactivate, Sold, Rented")
  // and O957-16 (translated: "the combobox must hold only the operations available to him!"): the literal set, in this order, minus the current status and minus pending from active
  it('[SEC-O957-17-FE-SET] for every status the owner\'s codes and labels are, in order, Publish, Archived, Deactivate, Sold, Rented, minus the current status and minus Publish from active', () => {
    const l = messages.listing as Record<string, string>
    const ownerLabels = { publish: l.status_publish, deactivate: l.status_deactivate }
    const SET = [['pending', 'Publish'], ['archived', 'Archived'], ['inactive', 'Deactivate'], ['sold', 'Sold'], ['rented', 'Rented']] as const
    for (const current of STATUSES) {
      const expected = SET.filter(([code]) => code !== current && !(code === 'pending' && current === 'active'))
      const options = buildListingStatusOptions(current, { canPublish: false }, labelOf, ownerLabels)
      expect(options.map(o => [o.code, o.label]), `owner list of ${current}`).toEqual(expected.map(([code, label]) => [code, label]))
    }
  })

  // Owner decision O957-11 (2026-11-21, Task 957 Revision 4, translated: "he must see the option 'Publish', after which his listing goes to moderation") and O957-16 (2026-11-23): the owner's current status is a badge, not a list item
  it('[SEC-O957-11-FE] the owner is offered "Publish" for pending and never the current status; staff keep the current status first and read "Under review"', async () => {
    const l = messages.listing as Record<string, string>
    expect(l.status_publish).toBe('Publish')
    expect(l.status_deactivate).toBe('Deactivate')
    expect(l.status_pending_owner).toBeUndefined()
    expect(labelOf('pending')).toBe('Under review')
    const ownerLabels = { publish: l.status_publish, deactivate: l.status_deactivate }

    for (const current of ['inactive', 'archived', 'sold', 'rented', 'expired'] as const) {
      const pending = buildListingStatusOptions(current, { canPublish: false }, labelOf, ownerLabels).find(o => o.code === 'pending')
      expect(pending?.label, `owner, ${current}`).toBe('Publish')
      expect(buildListingStatusOptions(current, { canPublish: false }, labelOf, ownerLabels).filter(o => o.code !== 'pending').map(o => o.label)).not.toContain('Publish')
    }
    expect(buildListingStatusOptions('active', { canPublish: false }, labelOf, ownerLabels).map(o => o.label)).not.toContain('Publish')
    expect(buildListingStatusOptions('pending', { canPublish: false }, labelOf, ownerLabels).map(o => o.code)).toEqual(['archived', 'inactive', 'sold', 'rented'])
    // staff keep every status, the current one first, and the label "Under review"
    for (const current of STATUSES.filter(s => s !== 'pending')) {
      expect(buildListingStatusOptions(current, { canPublish: true }, labelOf, ownerLabels).find(o => o.code === 'pending')?.label, `staff, ${current}`).toBe('Under review')
    }
    expect(buildListingStatusOptions('pending', { canPublish: true }, labelOf, ownerLabels)[0]).toMatchObject({ code: 'pending', label: 'Under review' })
    for (const current of STATUSES) {
      const staff = buildListingStatusOptions(current, { canPublish: true }, labelOf, ownerLabels)
      expect(staff[0].code, `staff list of ${current}`).toBe(current)
      expect(staff.find(o => o.code === 'inactive')?.label, `staff read "Inactive", not "Deactivate" (${current})`).toBe('Inactive')
    }

    // through the real select: the owner of an inactive listing is offered exactly the other four operations and picks "Publish": the gateway is asked for pending
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderApp(
      <StatusChangeSelect
        currentStatus="inactive"
        statuses={buildListingStatusOptions('inactive', { canPublish: false }, labelOf, ownerLabels)}
        onSubmit={onSubmit}
        aria-label={control.status_change_label}
      />,
    )
    openSelect()
    expect(offered()).toEqual(['Publish', 'Archived', 'Sold', 'Rented'])
    fireEvent.click(screen.getByRole('option', { name: 'Publish' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ toStatus: 'pending', note: null }))
  })

  it('[SEC-O957-11-I18N] "Publish" and "Deactivate" exist in the four locales, and "On moderation" for the owner is gone', () => {
    const texts = [
      [messages.listing, 'Publish', 'Deactivate'],
      [itMessages.listing, undefined, 'Disattiva'],
      [sqMessages.listing, undefined, 'Çaktivizo'],
      [ukMessages.listing, undefined, 'Деактивувати'],
    ] as [Record<string, string>, string | undefined, string][]
    for (const [locale, publish, deactivate] of texts) {
      expect(locale.status_publish?.length).toBeGreaterThan(0)
      if (publish) expect(locale.status_publish).toBe(publish)
      expect(locale.status_deactivate).toBe(deactivate)
      expect(locale.status_pending_owner, 'the owner\'s "On moderation" dropdown text left with O957-16').toBeUndefined()
    }
  })

  // Review 6 F37 (Task 957 Revision 6): the owner is the case the server refuses most, so the refused change is proven for the owner (`canPublish` false); the staff case below is a second test
  it('[SEC-D8-FE-ERR] the owner of a pending listing picks Archived, the change is refused: the error shows, no success, and the select does not show the pick as chosen', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('forbidden'))
    renderControl('pending', false, onSubmit)
    const input = screen.getByRole('textbox', { name: control.status_change_label }) as HTMLInputElement
    const before = input.value
    openSelect()
    fireEvent.click(screen.getByRole('option', { name: labelOf('archived') }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(control.status_change_error))
    expect(onSubmit).toHaveBeenCalledWith({ toStatus: 'archived', note: null })
    expect(toast.success).not.toHaveBeenCalled()
    expect(input.value, 'the input after the refusal equals the input before the pick').toBe(before)
    expect(input.value, 'the refused pick is not shown as the value').not.toBe(labelOf('archived'))
  })

  it('[SEC-D8-FE-ERR-STAFF] a refused status change of staff keeps the current status and shows the error', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('forbidden'))
    renderControl('pending', true, onSubmit)
    openSelect()
    fireEvent.click(screen.getByRole('option', { name: labelOf('inactive') }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(control.status_change_error))
    expect(toast.success).not.toHaveBeenCalled()
    expect((screen.getByRole('textbox', { name: control.status_change_label }) as HTMLInputElement).value).toBe(labelOf('pending'))
  })
})
