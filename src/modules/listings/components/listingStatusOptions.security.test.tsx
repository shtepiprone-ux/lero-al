/**
 * Task 923 R35 (owner decisions D6, D20, D22) and Task 957 Revisions 3 and 4 (O957-10, O957-11): the status control of the listing form offers an owner every status but `active`
 * (unless it is the current status) and `pending` from `active`, with `pending` labelled "Publish", and offers staff all of them. The control is presentation; the gateway (`applyListingTransitionByStatus`) is the authority, so these cases protect only that the form shows
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

  it('[SEC-D8-FE-DENY] the owner is never offered active, and pending only from a status other than active (O957-10, O957-11), for every status the listing can have', () => {
    for (const current of STATUSES) {
      const codes = buildListingStatusOptions(current, { canPublish: false }).map(o => o.code)
      expect(codes.includes('active'), `owner list of ${current}`).toBe(current === 'active')
      expect(codes.includes('pending'), `owner list of ${current}: pending is offered from every status but active`).toBe(current !== 'active')
      expect(codes[0]).toBe(current)
      const allOthers = STATUSES.filter(s => s !== current && s !== 'active' && !(s === 'pending' && current === 'active'))
      expect(codes.slice(1).sort(), `every allowed status of ${current}`).toEqual(allOthers.sort())
    }
    renderControl('pending', false)
    openSelect()
    expect(offered()).not.toContain(labelOf('active'))
    expect(offered()).toContain(labelOf('inactive'))
  })

  // Owner decision O957-11 (2026-11-21, Task 957 Revision 4, translated: "he must see the option 'Publish', after which his listing goes to moderation, and the owner of the listing sees the status 'On moderation'")
  it('[SEC-O957-11-FE] the owner is offered "Publish" for pending and reads a pending listing as "On moderation"; staff read "Under review"', async () => {
    const l = messages.listing as Record<string, string>
    expect(l.status_publish).toBe('Publish')
    expect(l.status_pending_owner).toBe('On moderation')
    expect(labelOf('pending')).toBe('Under review')
    const ownerLabels = { publish: l.status_publish, onModeration: l.status_pending_owner }

    for (const current of ['inactive', 'archived', 'sold', 'rented', 'expired'] as const) {
      const pending = buildListingStatusOptions(current, { canPublish: false }, labelOf, ownerLabels).find(o => o.code === 'pending')
      expect(pending?.label, `owner, ${current}`).toBe('Publish')
      expect(buildListingStatusOptions(current, { canPublish: false }, labelOf, ownerLabels).filter(o => o.code !== 'pending').map(o => o.label)).not.toContain('Publish')
    }
    expect(buildListingStatusOptions('active', { canPublish: false }, labelOf, ownerLabels).map(o => o.label)).not.toContain('Publish')
    expect(buildListingStatusOptions('pending', { canPublish: false }, labelOf, ownerLabels)[0]).toMatchObject({ code: 'pending', label: 'On moderation' })
    // staff keep every status and the label "Under review"
    for (const current of STATUSES.filter(s => s !== 'pending')) {
      expect(buildListingStatusOptions(current, { canPublish: true }, labelOf, ownerLabels).find(o => o.code === 'pending')?.label, `staff, ${current}`).toBe('Under review')
    }
    expect(buildListingStatusOptions('pending', { canPublish: true }, labelOf, ownerLabels)[0].label).toBe('Under review')

    // through the real select: the owner of an inactive listing picks "Publish" and the gateway is asked for pending
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
    expect(offered()).toContain('Publish')
    expect(offered()).not.toContain('Under review')
    fireEvent.click(screen.getByRole('option', { name: 'Publish' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ toStatus: 'pending', note: null }))
  })

  it('[SEC-O957-11-I18N] the owner texts exist in the four locales', () => {
    for (const locale of [messages.listing, itMessages.listing, sqMessages.listing, ukMessages.listing] as Record<string, string>[]) {
      expect(locale.status_publish?.length).toBeGreaterThan(0)
      expect(locale.status_pending_owner?.length).toBeGreaterThan(0)
    }
  })

  it('[SEC-D8-FE-ERR] a refused status change keeps the current status and shows the error', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('forbidden'))
    renderControl('pending', false, onSubmit)
    openSelect()
    fireEvent.click(screen.getByRole('option', { name: labelOf('inactive') }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(control.status_change_error))
    expect(toast.success).not.toHaveBeenCalled()
    expect((screen.getByRole('textbox', { name: control.status_change_label }) as HTMLInputElement).value).toBe(labelOf('pending'))
  })
})
