/**
 * Task 957 Revision 3 (owner decision O1001-2, 2026-11-21): the container saves the parking of a listing and clears it when the property type has no parking field (land). The Server Actions, the
 * router and the translations are doubles; the view is a stub that exposes the container's `patch`, `onPropertyTypeChange` and `onSubmit` and its data.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const create = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }), useParams: () => ({}) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/actions/createListing', () => ({ createListing: (...a: unknown[]) => create(...a) }))
vi.mock('@/modules/listings/actions/updateListing', () => ({ updateListing: vi.fn() }))
vi.mock('@/modules/listings/actions/changeListingStatus', () => ({ changeListingStatusAction: vi.fn() }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { data: Record<string, unknown>; errors: Record<string, string>; patch: (v: Record<string, unknown>) => void; onPropertyTypeChange: (t: string) => void; onSubmit: () => void }) => (
    <div>
      <button type="button" onClick={() => p.patch({ title: 'A valid title', price: 95000, images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg', public_id: 'a', is_cover: true, order: 0 }] })}>fill</button>
      <button type="button" onClick={() => p.onPropertyTypeChange('apartment')}>apartment</button>
      <button type="button" onClick={() => p.onPropertyTypeChange('land')}>land</button>
      <button type="button" onClick={() => p.patch({ land_legal_status: 'urban', land_zoning: 'residential', land_development_potential: 'buildable' })}>land-fields</button>
      <button type="button" onClick={() => p.patch({ parking_type: 'underground', parking_floor: -2 })}>underground</button>
      <button type="button" onClick={() => p.patch({ parking_type: 'city', parking_floor: undefined })}>city</button>
      <button type="button" onClick={() => p.patch({ parking_type: 'city', parking_floor: -2 })}>city-with-stale-floor</button>
      <button type="button" onClick={() => void p.onSubmit()}>save</button>
      <output data-testid="parking">{JSON.stringify([p.data.parking_type ?? null, p.data.parking_floor ?? null])}</output>
      <output data-testid="errors">{Object.keys(p.errors).filter((k) => p.errors[k]).join(',')}</output>
    </div>
  ),
}))

import { ListingFormShell } from '../ListingFormShell'

beforeEach(() => { setViewport(1024); vi.useFakeTimers(); create.mockReset(); create.mockResolvedValue({ slug: 'x' }) })
afterEach(async () => { await act(async () => { vi.advanceTimersByTime(5000) }); cleanup(); vi.useRealTimers() })   // a saved form navigates after 4 s

const click = async (name: string) => { await act(async () => { fireEvent.click(screen.getByText(name)) }) }
const parking = () => JSON.parse(screen.getByTestId('parking').textContent!)

describe('ListingFormShell: the parking of a listing', () => {
  beforeEach(() => {
    render(<MantineProvider theme={theme} env="test"><ListingFormShell mode="create" locale="sq" locations={[]} cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} /></MantineProvider>)
  })

  it('an underground parking and its floor are saved', async () => {
    await click('fill'); await click('apartment'); await click('underground'); await click('save')
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0]).toMatchObject({ parking_type: 'underground', parking_floor: -2 })
  })

  it('choosing another kind after an underground parking leaves no floor (the field clears it) and saves the kind alone', async () => {
    await click('fill'); await click('apartment'); await click('underground'); await click('city')
    expect(parking()).toEqual(['city', null])
    await click('save')
    expect(create.mock.calls[0][0]).toMatchObject({ parking_type: 'city', parking_floor: undefined })
  })

  it('no parking chosen saves none', async () => {
    await click('fill'); await click('apartment'); await click('save')
    expect(create.mock.calls[0][0]).toMatchObject({ parking_type: undefined, parking_floor: undefined })
  })

  it('choosing land clears the parking, and land is saved without it', async () => {
    await click('fill'); await click('apartment'); await click('underground')
    expect(parking()).toEqual(['underground', -2])
    await click('land')
    expect(parking()).toEqual([null, null])
    await click('land-fields'); await click('save')
    expect(create.mock.calls[0][0]).toMatchObject({ property_type: 'land', parking_type: undefined, parking_floor: undefined })
  })

  it('a floor that reached the form with a parking that is not underground stops the save with the form error', async () => {
    await click('fill'); await click('apartment'); await click('city-with-stale-floor'); await click('save')
    expect(create).not.toHaveBeenCalled()
    expect(screen.getByTestId('errors').textContent).toContain('parking_floor')
  })
})
