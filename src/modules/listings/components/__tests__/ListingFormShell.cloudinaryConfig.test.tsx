/**
 * Task 957, Revision 1 (R1-1, AC5): the REAL `ListingFormShell` hands the view the Cloudinary API key and cloud name it got from the page, in create and in edit mode (the photo
 * widget needs both when it is created: `@cloudinary-util/url-loader/dist/index.js:1590-1602`). The presentational view is a stub that only exposes that prop; the actions, the
 * router and the translations are doubles.
 */
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }), useParams: () => ({}) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/actions/updateListing', () => ({ updateListing: vi.fn() }))
vi.mock('@/modules/listings/actions/createListing', () => ({ createListing: vi.fn() }))
vi.mock('@/modules/listings/actions/changeListingStatus', () => ({ changeListingStatusAction: vi.fn() }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { cloudinary: { apiKey: string; cloudName: string }; listingId?: string }) => <output data-testid="view" data-key={p.cloudinary.apiKey} data-cloud={p.cloudinary.cloudName} data-listing={p.listingId ?? ''} />,
}))

import { ListingFormShell } from '../ListingFormShell'

afterEach(cleanup)
const wrap = (node: React.ReactNode) => { setViewport(1024); return render(<MantineProvider theme={theme} env="test">{node}</MantineProvider>) }

describe('ListingFormShell hands the photo widget its API key and cloud name', () => {
  it('[AC5] create mode', () => {
    wrap(<ListingFormShell mode="create" locale="sq" locations={[]} cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} />)
    expect(screen.getByTestId('view').getAttribute('data-key')).toBe('key-957')
    expect(screen.getByTestId('view').getAttribute('data-cloud')).toBe('demo-cloud')
    expect(screen.getByTestId('view').getAttribute('data-listing')).toBe('')
  })

  it('[AC5] edit mode, next to the listing id', () => {
    wrap(<ListingFormShell mode="edit" locale="sq" locations={[]} listingId="l-1" initialValues={{}} canManageStatus={false} canPublish={false} currentStatus="active" cloudinary={{ apiKey: 'key-958', cloudName: 'demo-cloud' }} />)
    expect(screen.getByTestId('view').getAttribute('data-key')).toBe('key-958')
    expect(screen.getByTestId('view').getAttribute('data-listing')).toBe('l-1')
  })
})
