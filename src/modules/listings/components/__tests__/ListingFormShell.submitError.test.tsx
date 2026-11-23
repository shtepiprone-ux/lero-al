/**
 * Task 957 Revision 3 (R3-7, AC33; Review 3 F24, owner decision O957-9, 2026-11-21: "move it to the top"): the REAL `ListingFormShell` with the REAL `ListingFormShellView`. After a failed save the save
 * error (the alert, now the first element of the main column) is scrolled into view and takes the focus, because the Save button can be far below it. The Server Actions, the router and the
 * translations are doubles; the heavy children of the form (the two comboboxes, the dynamic fields, the status select, the photo widget) are doubles that expose their callbacks.
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
vi.mock('@/modules/listings/components/ImageUpload', () => ({
  ImageUpload: (p: { onChange: (images: unknown[]) => void }) => <button type="button" onClick={() => p.onChange([{ url: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg', public_id: 'a', is_cover: true, order: 0 }])}>add-photo</button>,
}))
vi.mock('@/components/shared/LocationCombobox', () => ({ LocationCombobox: () => <span /> }))
vi.mock('@/components/shared/PropertyTypeCombobox', () => ({ PropertyTypeCombobox: (p: { onChange: (v: string) => void }) => <button type="button" onClick={() => p.onChange('apartment')}>pick-type</button> }))
vi.mock('@/modules/listings/components/form/DynamicFieldSection', () => ({ DynamicFieldSection: () => <span /> }))
vi.mock('@/components/admin/StatusChangeSelect', () => ({ StatusChangeSelect: () => <span /> }))

import { ListingFormShell } from '../ListingFormShell'

const scroll = vi.fn()

beforeEach(() => {
  setViewport(1024)
  create.mockReset()
  scroll.mockReset()
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: scroll })
})
afterEach(cleanup)

async function fillAndSave() {
  render(<MantineProvider theme={theme} env="test"><ListingFormShell mode="create" locale="sq" locations={[]} cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} /></MantineProvider>)
  fireEvent.click(screen.getByText('pick-type'))
  fireEvent.change(screen.getByLabelText(/field_title/), { target: { value: 'A valid title' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'field_price' }), { target: { value: '95000' } })
  fireEvent.click(screen.getByText('add-photo'))
  scroll.mockClear()   // the validation scroll of an invalid form is not this test's subject
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'form_publish' })) })
}

describe('ListingFormShell: a failed save shows its error where the person looks', () => {
  it('[AC33] a refused save puts the alert first in the main column, scrolls it into view and focuses it', async () => {
    create.mockResolvedValue({ error: 'insert_failed' })
    await fillAndSave()
    expect(create).toHaveBeenCalledTimes(1)
    const alert = screen.getByText('error_creating').closest('[role="alert"]') as HTMLElement
    expect(alert.parentElement!.firstElementChild).toBe(alert)
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(alert)
    expect(document.activeElement).toBe(alert)
  })

  it('[AC33] a second refused save shows the alert to the person again (scrolled and focused again)', async () => {
    create.mockResolvedValue({ error: 'insert_failed' })
    await fillAndSave()
    expect(scroll).toHaveBeenCalledTimes(1)
    ;(document.activeElement as HTMLElement).blur()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'form_publish' })) })
    expect(create).toHaveBeenCalledTimes(2)
    expect(scroll).toHaveBeenCalledTimes(2)
    expect(document.activeElement).toBe(screen.getByText('error_creating').closest('[role="alert"]'))
  })

  it('[AC33] a form that fails its own checks is not a failed save: no alert, nothing scrolled to it', async () => {
    render(<MantineProvider theme={theme} env="test"><ListingFormShell mode="create" locale="sq" locations={[]} cloudinary={{ apiKey: 'key-957', cloudName: 'demo-cloud' }} /></MantineProvider>)
    fireEvent.change(screen.getByLabelText(/field_title/), { target: { value: 'ab' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'form_publish' })) })
    expect(create).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
