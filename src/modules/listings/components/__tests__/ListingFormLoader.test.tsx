/**
 * Task 957 (AC5): the loader hands the form shell the locale, the cities and regions, the Cloudinary API key and cloud name the page read and, in edit mode, the listing id: no preset
 * and no folder (the photo widget asks the server route for one signature per photo). `next/dynamic` and the locations hook are doubles.
 */
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/dynamic', () => ({
  default: () => function ShellDouble(props: Record<string, unknown>) {
    return <output data-testid="shell">{JSON.stringify(props)}</output>
  },
}))
vi.mock('@/modules/locations/hooks/useLocations', () => ({
  useLocations: () => ({
    locations: [
      { id: 1, type: 'city', name_al: 'Tiranë', name_en: 'Tirana' },
      { id: 2, type: 'region', name_al: 'Qarku', name_en: 'County' },
      { id: 3, type: 'neighborhood', name_al: 'Blloku', name_en: 'Blloku' },
    ],
  }),
}))

import { ListingFormLoader } from '../ListingFormLoader'

afterEach(cleanup)
const shellProps = () => JSON.parse(screen.getByTestId('shell').textContent ?? '{}') as Record<string, unknown>

describe('ListingFormLoader', () => {
  it('[AC5] create mode: the locale, the cities and regions and the mode; no preset and no folder', () => {
    render(<ListingFormLoader locale="sq" cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} />)
    const props = shellProps()
    expect(props).toMatchObject({ locale: 'sq', mode: 'create' })
    expect((props.locations as { id: number }[]).map((l) => l.id)).toEqual([1, 2])
    expect(Object.keys(props)).not.toContain('uploadPreset')
    expect(Object.keys(props)).not.toContain('uploadFolder')
  })

  it('[AC5] edit mode: the listing id and the status controls reach the shell', () => {
    render(<ListingFormLoader locale="en" mode="edit" listingId="l-1" initialValues={{ title: 'A flat' }} canManageStatus canPublish={false} currentStatus="pending" cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} />)
    expect(shellProps()).toMatchObject({ locale: 'en', mode: 'edit', listingId: 'l-1', canManageStatus: true, canPublish: false, currentStatus: 'pending' })
  })

  // Revision 1 (R1-1): the photo widget needs the Cloudinary API key and cloud name at creation; the page hands them down as a prop (never a NEXT_PUBLIC_ preset)
  it('[AC5] the Cloudinary API key and cloud name of the page reach the shell in create and in edit mode', () => {
    render(<ListingFormLoader locale="sq" cloudinary={{ apiKey: 'key-957', cloudName: 'cloud-957' }} />)
    expect(shellProps()).toMatchObject({ mode: 'create', cloudinary: { apiKey: 'key-957', cloudName: 'cloud-957' } })
    cleanup()
    render(<ListingFormLoader locale="en" mode="edit" listingId="l-1" initialValues={{ title: 'A flat' }} canManageStatus canPublish={false} currentStatus="pending" cloudinary={{ apiKey: 'key-958', cloudName: 'cloud-958' }} />)
    expect(shellProps()).toMatchObject({ mode: 'edit', cloudinary: { apiKey: 'key-958', cloudName: 'cloud-958' } })
  })
})
