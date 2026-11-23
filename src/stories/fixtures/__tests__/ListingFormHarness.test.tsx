/**
 * Task 957 Revision 3 (R3-3, AC29; Review 3 F18, F19): the fixture harness of the composition Stories holds the form data, applies `patch`, runs `validateListingForm` on Save and passes its
 * errors, so a Story reacts to what is typed, chosen or removed and shows only the errors the form itself would produce. The real `ListingFormShellView` runs inside it; only the Cloudinary
 * widget (a script loader) is a double.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../messages/en.json'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import { validateListingForm } from '@/modules/listings/lib/validateListingForm'
import type { FormValues } from '@/modules/listings/types/form'
import { fixturePhotos } from '../listingPhotos.fixture'
import { ListingFormHarness } from '../ListingFormHarness'

vi.mock('next-cloudinary', () => ({ CldUploadWidget: (props: { children?: (api: { open: () => void }) => React.JSX.Element }) => props.children?.({ open: () => undefined }) ?? null }))
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const L = messages.listing
const tEn = (key: string) => (L as Record<string, string>)[key] ?? key
const CLOUDINARY = { apiKey: 'story-api-key', cloudName: 'story-cloud' }
const BASE: FormValues = { listing_type: 'sale', property_type: 'apartment', title: 'A listing title', price: 95000, currency: 'EUR', multi_storey_building: false, images: fixturePhotos(2) }
// the `WithErrors` Story's values: a short title, no price, no photo, floor 9 of 8
const FAILING: FormValues = { ...BASE, title: 'abc', price: undefined, images: [], floor: 9, total_floors: 8 }

function mount(initial: FormValues, over: Partial<React.ComponentProps<typeof ListingFormHarness>> = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <ListingFormHarness initial={initial} mode="create" locations={[]} cloudinary={CLOUDINARY} submitting={false} submitError="" initialDirty {...over} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeEach(() => { setViewport(1024) })
afterEach(cleanup)

describe('ListingFormHarness', () => {
  it('[AC29] typing changes the title and the counter follows', () => {
    mount(BASE)
    const title = screen.getByLabelText(new RegExp(L.field_title)) as HTMLInputElement
    expect(title.value).toBe('A listing title')
    fireEvent.change(title, { target: { value: 'A longer listing title' } })
    expect((screen.getByLabelText(new RegExp(L.field_title)) as HTMLInputElement).value).toBe('A longer listing title')
    expect(screen.getByText(/\(22\/150\)/)).toBeTruthy()
  })

  it('[AC29] choosing the listing type and the currency changes the selection', () => {
    mount(BASE)
    // the selected choice is the filled one, the others the default look (`FilterChoiceGroup`: `variant={isSelected ? variant : 'default'}`)
    expect(screen.getByRole('button', { name: L.sale }).getAttribute('data-variant')).toBe('filled')
    fireEvent.click(screen.getByRole('button', { name: L.rent }))
    expect(screen.getByRole('button', { name: L.rent }).getAttribute('data-variant')).toBe('filled')
    expect(screen.getByRole('button', { name: L.sale }).getAttribute('data-variant')).toBe('default')
    expect(screen.getByRole('button', { name: 'EUR' }).getAttribute('data-variant')).toBe('filled')
    fireEvent.click(screen.getByRole('button', { name: 'ALL' }))
    expect(screen.getByRole('button', { name: 'ALL' }).getAttribute('data-variant')).toBe('filled')
    expect(screen.getByRole('button', { name: 'EUR' }).getAttribute('data-variant')).toBe('default')
  })

  it('[AC29] removing a photo at the limit brings the upload button back', () => {
    mount({ ...BASE, images: fixturePhotos(20) })
    expect(screen.queryByText(/^Add more/)).toBeNull()
    expect(screen.getByText(/Maximum 20 photos/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo 20' }))
    expect(screen.getByText(/^Add more/).closest('button')).toBeTruthy()
    expect(screen.queryByText(/Maximum 20 photos/)).toBeNull()
  })

  it('[AC29] no error shows before Save, although the values would fail it', () => {
    mount(FAILING)
    for (const message of Object.values(validateListingForm(FAILING, getSchema('apartment'), tEn))) expect(screen.queryByText(message as string)).toBeNull()
  })

  it('[AC29] Save on the WithErrors values shows exactly the validator\'s errors, each once', () => {
    mount(FAILING)
    fireEvent.click(screen.getByRole('button', { name: L.form_publish }))
    const expected = validateListingForm(FAILING, getSchema('apartment'), tEn)
    expect(Object.keys(expected).sort()).toEqual(['floor', 'images', 'price', 'title'])
    for (const message of Object.values(expected)) expect(screen.getAllByText(message as string), message as string).toHaveLength(1)
    for (const never of [L.error_property_type, L.error_required, L.error_floor_negative]) expect(screen.queryByText(never), never).toBeNull()
  })

  it('[AC29] an error clears when its field is patched, as in the product, and a second Save shows what is still wrong', () => {
    mount(FAILING)
    fireEvent.click(screen.getByRole('button', { name: L.form_publish }))
    expect(screen.getAllByText(L.error_title)).toHaveLength(1)
    fireEvent.change(screen.getByLabelText(new RegExp(L.field_title)), { target: { value: 'A proper title' } })
    expect(screen.queryByText(L.error_title)).toBeNull()
    expect(screen.getAllByText(L.error_images)).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: L.form_publish }))
    expect(screen.queryByText(L.error_title)).toBeNull()
    expect(screen.getAllByText(L.error_images)).toHaveLength(1)
  })

  it('[AC29] Save on valid values shows no error', () => {
    mount(BASE)
    fireEvent.click(screen.getByRole('button', { name: L.form_publish }))
    expect(screen.queryByText(L.error_title)).toBeNull()
    expect(screen.queryByText(L.error_images)).toBeNull()
  })

  it('[AC29] the cancel dialog keeps its state: Cancel opens it, "stay" closes it, Discard closes it', () => {
    mount(BASE)
    expect(screen.queryByText(L.cancel_confirm_title)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: messages.common.cancel }))
    expect(screen.getByText(L.cancel_confirm_title)).toBeTruthy()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: L.cancel_confirm_no }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: messages.common.cancel }))
    expect(screen.getByText(L.cancel_confirm_title)).toBeTruthy()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: L.cancel_confirm_yes }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('[AC29] a Story can start with the cancel dialog open', () => {
    mount(BASE, { initialCancelOpen: true })
    expect(screen.getByText(L.cancel_confirm_title)).toBeTruthy()
  })
})
