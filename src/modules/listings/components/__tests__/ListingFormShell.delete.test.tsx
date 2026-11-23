/**
 * Task 957 Revision 5 (R5-5, AC42; owner decision O957-18, 2026-11-23, translated: "a separate section under the section of actions with the listing"): the REAL `ListingFormShell` (the container)
 * deletes the listing it edits through the existing `deleteListingAction(listingId)`. Success goes to the owner's cabinet listings tab; an error shows `cabinet.error_deleting` and the form stays.
 * The Server Actions, the router, the toast and the translations are doubles (the translations return `<namespace>.<key>`, so the namespace of each text is checked); the presentational view is replaced
 * by a stub that exposes the container's props.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const push = vi.fn()
const del = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back: vi.fn(), refresh: vi.fn() }), useParams: () => ({ slug: 'flat' }) }))
vi.mock('next-intl', () => ({ useTranslations: (ns?: string) => (key: string) => `${ns}.${key}`, useLocale: () => 'sq' }))
vi.mock('@/lib/toast', () => ({ toast }))
vi.mock('@/modules/listings/actions/deleteListing', () => ({ deleteListingAction: (...a: unknown[]) => del(...a) }))
vi.mock('@/modules/listings/actions/updateListing', () => ({ updateListing: vi.fn() }))
vi.mock('@/modules/listings/actions/createListing', () => ({ createListing: vi.fn() }))
vi.mock('@/modules/listings/actions/changeListingStatus', () => ({ changeListingStatusAction: vi.fn() }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { canDelete?: boolean; onDelete?: () => Promise<void> }) => (
    <div>
      <output data-testid="can-delete">{String(p.canDelete)}</output>
      <output data-testid="has-handler">{String(typeof p.onDelete === 'function')}</output>
      <button type="button" onClick={() => void p.onDelete?.()}>delete</button>
    </div>
  ),
}))

import { ListingFormShell } from '../ListingFormShell'

const INITIAL = { listing_type: 'sale', property_type: 'land', title: 'A plot of land near Tirana', price: 90000, currency: 'EUR', images: [] }
const shell = (canDelete: boolean | undefined) => (
  <ListingFormShell
    mode="edit"
    locale="sq"
    locations={[]}
    listingId="l-1"
    cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }}
    initialValues={INITIAL as never}
    canManageStatus={false}
    canPublish={false}
    canDelete={canDelete}
    currentStatus="active"
  />
)

beforeEach(() => {
  setViewport(1024)   // Mantine's provider reads matchMedia, which jsdom lacks
  push.mockReset(); del.mockReset(); toast.success.mockReset(); toast.error.mockReset()
})
afterEach(cleanup)

async function clickDelete(canDelete: boolean | undefined = true) {
  render(<MantineProvider theme={theme} env="test">{shell(canDelete)}</MantineProvider>)
  await act(async () => { fireEvent.click(screen.getByText('delete')) })
}

describe('ListingFormShell.delete', () => {
  it('[AC42] the page\'s canDelete reaches the view with a handler', () => {
    render(<MantineProvider theme={theme} env="test">{shell(true)}</MantineProvider>)
    expect(screen.getByTestId('can-delete').textContent).toBe('true')
    expect(screen.getByTestId('has-handler').textContent).toBe('true')
    cleanup()
    render(<MantineProvider theme={theme} env="test">{shell(false)}</MantineProvider>)
    expect(screen.getByTestId('can-delete').textContent).toBe('false')
    cleanup()
    render(<MantineProvider theme={theme} env="test">{shell(undefined)}</MantineProvider>)
    expect(screen.getByTestId('can-delete').textContent).toBe('false')
  })

  it('[AC42] the confirm calls deleteListingAction with the listing id and a success goes to the cabinet listings tab', async () => {
    del.mockResolvedValue({})
    await clickDelete()
    expect(del).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledWith('l-1')
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith('/sq/cabinet?tab=listings')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('[AC42] an error shows cabinet.error_deleting, does not navigate and leaves the form', async () => {
    for (const error of ['forbidden', 'not_found', 'delete_failed', 'unauthenticated']) {
      del.mockReset(); push.mockReset(); toast.error.mockReset()
      del.mockResolvedValue({ error })
      cleanup()
      await clickDelete()
      expect(del, error).toHaveBeenCalledWith('l-1')
      expect(toast.error, error).toHaveBeenCalledTimes(1)
      expect(toast.error, error).toHaveBeenCalledWith('cabinet.error_deleting')
      expect(push, error).not.toHaveBeenCalled()
      expect(screen.getByTestId('can-delete'), `${error}: the form stays`).toBeTruthy()
    }
  })

  it('[AC42] a thrown call is also an error toast and no navigation', async () => {
    del.mockRejectedValue(new Error('network'))
    await clickDelete()
    expect(toast.error).toHaveBeenCalledWith('cabinet.error_deleting')
    expect(push).not.toHaveBeenCalled()
  })
})
