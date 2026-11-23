/**
 * Task 957 Revision 5 (R5-6, AC43; owner decision O957-19, 2026-11-23, translated: "the user opened 'My listings', pressed 'Edit', then 'Cancel changes', and is sent to the page of this listing; he must be
 * sent back to the page where he was before"): Cancel in the edit form returns to the previous page (`router.back()`) when the tab has an earlier entry (`window.history.length` > 1); a form opened in a
 * new tab has none, and Cancel still goes to the listing's page, as on `main`. With unsaved changes the confirm opens first and its confirm does the same.
 * The router and the translations are doubles; the presentational view is a stub that exposes the container's callbacks.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const push = vi.fn()
const back = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back, refresh: vi.fn() }), useParams: () => ({ slug: 'flat' }) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/actions/updateListing', () => ({ updateListing: vi.fn() }))
vi.mock('@/modules/listings/actions/createListing', () => ({ createListing: vi.fn() }))
vi.mock('@/modules/listings/actions/changeListingStatus', () => ({ changeListingStatusAction: vi.fn() }))
vi.mock('@/modules/listings/actions/deleteListing', () => ({ deleteListingAction: vi.fn() }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { onCancelClick: () => void; onConfirmCancel: () => void; showCancelDialog: boolean; patch: (v: { title: string }) => void }) => (
    <div>
      <button type="button" onClick={() => p.patch({ title: 'changed' })}>edit</button>
      <button type="button" onClick={p.onCancelClick}>cancel</button>
      <button type="button" onClick={p.onConfirmCancel}>leave</button>
      <output data-testid="dialog">{String(p.showCancelDialog)}</output>
    </div>
  ),
}))

import { ListingFormShell } from '../ListingFormShell'

const INITIAL = { listing_type: 'sale', property_type: 'land', title: 'A plot of land near Tirana', price: 90000, currency: 'EUR', images: [] }

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, 'length', { configurable: true, value: length })
}

beforeEach(() => {
  setViewport(1024)   // Mantine's provider reads matchMedia, which jsdom lacks
  push.mockReset(); back.mockReset()
  render(
    <MantineProvider theme={theme} env="test">
      <ListingFormShell
        mode="edit"
        locale="sq"
        locations={[]}
        listingId="l-1"
        cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }}
        initialValues={INITIAL as never}
        canManageStatus={false}
        canPublish={false}
        currentStatus="active"
      />
    </MantineProvider>,
  )
})
afterEach(() => {
  cleanup()
  delete (window.history as unknown as { length?: number }).length
})

const click = async (name: string) => { await act(async () => { fireEvent.click(screen.getByText(name)) }) }

describe('ListingFormShell.cancel', () => {
  it('[AC43] with a previous entry (history length 2) Cancel goes back and does not push', async () => {
    setHistoryLength(2)
    await click('cancel')
    expect(back).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it('[AC43] with none (history length 1: a form opened in a new tab) Cancel goes to the listing page', async () => {
    setHistoryLength(1)
    await click('cancel')
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/sq/listings/flat')
    expect(back).not.toHaveBeenCalled()
  })

  it('[AC43] with unsaved changes the confirm opens first; its confirm goes back (length 2)', async () => {
    setHistoryLength(2)
    await click('edit')
    await click('cancel')
    expect(screen.getByTestId('dialog').textContent).toBe('true')
    expect(back).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
    await click('leave')
    expect(back).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it('[AC43] with unsaved changes and no previous entry the confirm pushes to the listing page', async () => {
    setHistoryLength(1)
    await click('edit')
    await click('cancel')
    expect(screen.getByTestId('dialog').textContent).toBe('true')
    await click('leave')
    expect(push).toHaveBeenCalledWith('/sq/listings/flat')
    expect(back).not.toHaveBeenCalled()
  })
})
