/**
 * Task 957 (AC15): the listing form view on Mantine keeps what the legacy view did with every control: the listing type and currency buttons, the title, description and address
 * fields, the photo list, the property type and the location, the save and cancel buttons, the staff status block, the submit error and the cancel confirmation.
 * The translations and the heavy child sections (the two comboboxes, the dynamic fields, the status select, the photo widget) are doubles that expose their callbacks.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { FormValues } from '@/modules/listings/types/form'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/components/ImageUpload', () => ({
  ImageUpload: (p: { listingId?: string; disabled?: boolean; cloudinary?: { apiKey: string; cloudName: string }; onChange: (images: unknown[]) => void }) => (
    <button type="button" data-testid="photos" data-listing={p.listingId ?? ''} data-key={p.cloudinary?.apiKey ?? ''} data-cloud={p.cloudinary?.cloudName ?? ''} data-disabled={String(Boolean(p.disabled))} onClick={() => p.onChange([{ url: 'u', public_id: 'p', is_cover: true, order: 0 }])}>photos</button>
  ),
}))
vi.mock('@/components/shared/LocationCombobox', () => ({
  LocationCombobox: (p: { disabled?: boolean; onChange: (id: string) => void }) => (<><button type="button" data-testid="location" data-disabled={String(Boolean(p.disabled))} onClick={() => p.onChange('2')}>pick-location</button><button type="button" onClick={() => p.onChange('')}>clear-location</button></>),
}))
vi.mock('@/components/shared/PropertyTypeCombobox', () => ({
  PropertyTypeCombobox: (p: { disabled?: boolean; onChange: (v: string) => void }) => (<><button type="button" data-testid="property-type" data-disabled={String(Boolean(p.disabled))} onClick={() => p.onChange('house')}>pick-type</button><button type="button" onClick={() => p.onChange('')}>clear-type</button></>),
}))
vi.mock('@/modules/listings/components/form/DynamicFieldSection', () => ({ DynamicFieldSection: (p: { disabled?: boolean }) => <output data-testid="dynamic-fields" data-disabled={String(Boolean(p.disabled))} /> }))
vi.mock('@/components/admin/StatusChangeSelect', () => ({ StatusChangeSelect: (p: { disabled?: boolean; label?: string; statuses: { code: string }[] }) => <output data-testid="status-select" data-disabled={String(Boolean(p.disabled))} data-label={p.label ?? ''} data-codes={p.statuses.map(s => s.code).join(',')} /> }))

import { ListingFormShellView, type ListingFormShellViewProps } from '../ListingFormShellView'
import enMessages from '../../../../../messages/en.json'
import itMessages from '../../../../../messages/it.json'
import sqMessages from '../../../../../messages/sq.json'
import ukMessages from '../../../../../messages/uk.json'

const DATA: FormValues = { listing_type: 'sale', property_type: 'apartment', title: 'A title', currency: 'ALL', multi_storey_building: false, images: [] }

function mount(over: Partial<ListingFormShellViewProps> = {}) {
  const calls = { patch: vi.fn(), type: vi.fn(), submit: vi.fn(), cancel: vi.fn(), dialog: vi.fn(), confirm: vi.fn() }
  const props: ListingFormShellViewProps = {
    mode: 'create', data: DATA, errors: {}, schema: getSchema('apartment'), locations: [], patch: calls.patch, onPropertyTypeChange: calls.type,
    submitting: false, submitError: '', isDirty: true, onSubmit: calls.submit, onCancelClick: calls.cancel, showCancelDialog: false,
    onCancelDialogChange: calls.dialog, onConfirmCancel: calls.confirm, cloudinary: { apiKey: 'key-test', cloudName: 'demo-cloud' }, ...over,
  }
  const tree = (next: ListingFormShellViewProps) => <MantineProvider theme={theme} env="test"><ListingFormShellView {...next} /></MantineProvider>
  const view = render(tree(props))
  return { ...calls, rerender: (next: Partial<ListingFormShellViewProps>) => view.rerender(tree({ ...props, ...next })) }
}

// jsdom has no `scrollIntoView`; the view calls it when a save error appears (Task 957 Revision 3, R3-7)
beforeEach(() => { setViewport(1024); Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: vi.fn() }) })
afterEach(cleanup)

describe('ListingFormShellView controls', () => {
  it('[AC15] the listing type, currency, title, description and address patch the form data', () => {
    const { patch } = mount()
    fireEvent.click(screen.getByRole('button', { name: 'rent' }))
    expect(patch).toHaveBeenLastCalledWith({ listing_type: 'rent' })
    fireEvent.click(screen.getByRole('button', { name: 'EUR' }))
    expect(patch).toHaveBeenLastCalledWith({ currency: 'EUR' })
    fireEvent.change(screen.getByLabelText(/field_title/), { target: { value: 'New title' } })
    expect(patch).toHaveBeenLastCalledWith({ title: 'New title' })
    fireEvent.change(screen.getByLabelText('field_description'), { target: { value: 'Text' } })
    expect(patch).toHaveBeenLastCalledWith({ description: 'Text' })
    fireEvent.change(screen.getByLabelText('field_address'), { target: { value: 'Rruga 1' } })
    expect(patch).toHaveBeenLastCalledWith({ address: 'Rruga 1' })
  })

  // Task 957 Revision 9 (R9-3, AC50; Review 9 F48, owner decision O957-21 "as on main"): `main`'s description is `rows={4}` with a 160px floor and a vertical resize handle; the Mantine one has seven rows
  // (at least 160px) and Mantine's vertical resize, and does not grow by itself (the source test of `listingFormMantine.test.ts` proves there is no `autosize`; Mantine's test environment never autosizes)
  it('[AC50] the description textarea has seven rows and a vertical resize handle', () => {
    mount()
    const textarea = screen.getByLabelText('field_description') as HTMLTextAreaElement
    expect(textarea.getAttribute('rows')).toBe('7')
    const css = [...document.querySelectorAll('style')].map((style) => style.textContent ?? '').join('\n')
    const resize = `${textarea.getAttribute('style') ?? ''}\n${textarea.closest('.mantine-Textarea-root')?.getAttribute('style') ?? ''}\n${css}`
    expect(resize).toMatch(/--input-resize:\s*vertical/)
  })

  it('[AC15] clearing the description or the address patches undefined, never an empty string', () => {
    const { patch } = mount({ data: { ...DATA, description: 'old text', address: 'old address' } })
    fireEvent.change(screen.getByLabelText('field_description'), { target: { value: '' } })
    expect(patch).toHaveBeenLastCalledWith({ description: undefined })
    fireEvent.change(screen.getByLabelText('field_address'), { target: { value: '' } })
    expect(patch).toHaveBeenLastCalledWith({ address: undefined })
  })

  it('[AC15] the property type, the location and the photos reach the container; an empty property type is ignored', () => {
    const { patch, type } = mount()
    fireEvent.click(screen.getByText('pick-type'))
    expect(type).toHaveBeenCalledWith('house')
    fireEvent.click(screen.getByText('clear-type'))
    expect(type).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('pick-location'))
    expect(patch).toHaveBeenLastCalledWith({ location_id: 2 })
    fireEvent.click(screen.getByText('clear-location'))
    expect(patch).toHaveBeenLastCalledWith({ location_id: undefined })
    fireEvent.click(screen.getByTestId('photos'))
    expect(patch).toHaveBeenLastCalledWith({ images: [{ url: 'u', public_id: 'p', is_cover: true, order: 0 }] })
  })

  it('[AC15] the listing id reaches the photo widget in edit mode only', () => {
    mount({ mode: 'edit', listingId: 'l-1' })
    expect(screen.getByTestId('photos').getAttribute('data-listing')).toBe('l-1')
    cleanup()
    mount()
    expect(screen.getByTestId('photos').getAttribute('data-listing')).toBe('')
  })

  it('[AC5] the Cloudinary API key and cloud name reach the photo widget, in create and in edit mode (Revision 1, R1-1)', () => {
    mount({ cloudinary: { apiKey: 'key-957', cloudName: 'cloud-957' } })
    expect(screen.getByTestId('photos').getAttribute('data-key')).toBe('key-957')
    expect(screen.getByTestId('photos').getAttribute('data-cloud')).toBe('cloud-957')
    cleanup()
    mount({ mode: 'edit', listingId: 'l-1', cloudinary: { apiKey: 'key-958', cloudName: 'cloud-958' } })
    expect(screen.getByTestId('photos').getAttribute('data-key')).toBe('key-958')
    expect(screen.getByTestId('photos').getAttribute('data-cloud')).toBe('cloud-958')
  })

  it('[AC15] the page title and subtitle are the canonical header: one level-1 heading with the mode\'s title, then the subtitle (Revision 1, R1-2)', () => {
    mount()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['create_listing'])
    expect(screen.getByText('create_listing_subtitle')).toBeTruthy()
    cleanup()
    mount({ mode: 'edit' })
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['edit_listing'])
  })

  it('[AC15] save and cancel call the container; save is disabled for a clean form and while saving', () => {
    const { submit, cancel } = mount({ mode: 'edit' })
    fireEvent.click(screen.getByRole('button', { name: 'form_save' }))
    expect(submit).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(cancel).toHaveBeenCalledTimes(1)
    cleanup()
    mount({ isDirty: false })
    expect((screen.getByRole('button', { name: 'form_publish' }) as HTMLButtonElement).disabled).toBe(true)
    cleanup()
    mount({ submitting: true })
    expect((screen.getByRole('button', { name: 'cancel' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('[AC15] every error and the submit error are shown', () => {
    mount({ errors: { title: 'E-title', property_type: 'E-type', price: 'E-price', images: 'E-images' }, submitError: 'E-submit' })
    for (const text of ['E-title', 'E-type', 'E-price', 'E-images', 'E-submit']) expect(screen.getAllByText(text).length, text).toBeGreaterThan(0)
  })

  it('[AC15] the staff status block is shown only when the container sends it', () => {
    mount()
    expect(screen.queryByTestId('status-select')).toBeNull()
    cleanup()
    mount({ mode: 'edit', statusControl: { currentStatus: 'pending', listingId: 'l-1', canPublish: true, onStatusChange: async () => {} } })
    expect(screen.getByTestId('status-select')).toBeTruthy()
  })

  // Task 957 Revision 2 (R2-7, AC23; Review 2 F11): the payload reads `data.images` before the save is awaited, so nothing may change while it runs
  it('[AC23] while the form is saved every field, both pickers, the photo upload and the staff status control are disabled', () => {
    mount({ mode: 'edit', listingId: 'l-1', submitting: true, data: { ...DATA, description: 'd', address: 'a' }, statusControl: { currentStatus: 'pending', listingId: 'l-1', canPublish: true, onStatusChange: async () => {} } })
    for (const id of ['photos', 'location', 'property-type', 'dynamic-fields', 'status-select']) expect(screen.getByTestId(id).getAttribute('data-disabled'), id).toBe('true')
    for (const name of ['rent', 'EUR', 'ALL']) expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled, name).toBe(true)
    for (const label of [/field_title/, 'field_description', 'field_address']) expect((screen.getByLabelText(label) as HTMLInputElement).disabled, String(label)).toBe(true)
    expect((screen.getByRole('textbox', { name: 'field_price' }) as HTMLInputElement).disabled).toBe(true)
  })

  it('[AC23] when the form is not being saved the same controls are enabled', () => {
    mount({ mode: 'edit', listingId: 'l-1', statusControl: { currentStatus: 'pending', listingId: 'l-1', canPublish: true, onStatusChange: async () => {} } })
    for (const id of ['photos', 'location', 'property-type', 'dynamic-fields', 'status-select']) expect(screen.getByTestId(id).getAttribute('data-disabled'), id).toBe('false')
    for (const name of ['rent', 'EUR', 'ALL']) expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled, name).toBe(false)
    for (const label of [/field_title/, 'field_description', 'field_address']) expect((screen.getByLabelText(label) as HTMLInputElement).disabled, String(label)).toBe(false)
  })

  // Task 957 Revision 2 (R2-8, AC24; Review 2 F13): the photo error is the field error of the photo section; the status control carries its own label
  it('[AC24] the photo error is the field error of an input wrapper around the photos, not a free text', () => {
    mount({ errors: { images: 'E-images' } })
    const error = screen.getByText('E-images')
    expect(error.className).toContain('InputWrapper-error')
    expect(error.closest('[data-testid="photos"]')).toBeNull()
  })

  it('[AC24] the staff status control gets the "status_change_label" label through its own prop', () => {
    mount({ mode: 'edit', statusControl: { currentStatus: 'pending', listingId: 'l-1', canPublish: true, onStatusChange: async () => {} } })
    expect(screen.getByTestId('status-select').getAttribute('data-label')).toBe('status_change_label')
  })

  it('[AC24] the title hint is the description of the title field, written once; an error shows no second hint', () => {
    mount()
    expect(screen.getAllByText(/^field_title_hint \(\d+\/150\)$/)).toHaveLength(1)
    expect((screen.getByLabelText(/field_title/) as HTMLInputElement).placeholder).toBe('')
    cleanup()
    mount({ errors: { title: 'E-title' } })
    expect(screen.getByText('E-title')).toBeTruthy()
    expect(screen.getAllByText(/^field_title_hint/)).toHaveLength(1)
  })

  // Task 957 Revision 3 (R3-7, AC33; Review 3 F24, owner decision O957-9, 2026-11-21: "move it to the top")
  it('[AC33] with a submit error the alert is the first child of the main column, before the first section', () => {
    mount({ submitError: 'E-submit' })
    const alert = screen.getByText('E-submit').closest('[role="alert"]') as HTMLElement
    expect(alert).toBeTruthy()
    expect(alert.parentElement!.firstElementChild).toBe(alert)
    expect(alert.nextElementSibling!.textContent).toContain('section_basics')
    expect(alert.parentElement!.textContent).toContain('section_photos')
  })

  it('[AC33] without a submit error there is no alert', () => {
    mount()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('[AC33] the alert takes the focus and is scrolled into view when a submit error appears after a failed save, and not before', () => {
    const scroll = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, writable: true, value: scroll })
    const view = mount()
    expect(scroll).not.toHaveBeenCalled()
    view.rerender({ submitError: 'E-submit' })
    const alert = screen.getByText('E-submit').closest('[role="alert"]') as HTMLElement
    expect(alert.getAttribute('tabindex')).toBe('-1')
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(alert)
    expect(document.activeElement).toBe(alert)
    // a second failed save: the container clears the error when the save starts and sets it again, so the alert is shown to the person again
    view.rerender({ submitError: '' })
    view.rerender({ submitError: 'E-submit' })
    expect(scroll).toHaveBeenCalledTimes(2)
  })

  it('[AC15] the cancel confirmation: "stay" closes it, "leave" confirms', () => {
    const { dialog, confirm } = mount({ showCancelDialog: true })
    fireEvent.click(screen.getByRole('button', { name: 'cancel_confirm_no' }))
    expect(dialog).toHaveBeenCalledWith(false)
    fireEvent.click(screen.getByRole('button', { name: 'cancel_confirm_yes' }))
    expect(confirm).toHaveBeenCalledTimes(1)
  })

  // Task 957 Revision 5 (R5-3, AC36; owner decision O957-16, 2026-11-23, translated: "If the listing is in moderation, it must be only a badge, and the combobox must hold only the operations available to him!")
  it('[AC36] the owner of a pending listing sees its status as a badge and a select without pending; staff see no badge', () => {
    mount({ mode: 'edit', listingId: 'l-1', statusControl: { currentStatus: 'pending', listingId: 'l-1', canPublish: false, onStatusChange: async () => {} } })
    expect(screen.getByTestId('listing-status-badge').textContent).toBe('status_pending')
    expect(screen.getByTestId('status-select').getAttribute('data-codes')).toBe('archived,inactive,sold,rented')
    cleanup()
    mount({ mode: 'edit', listingId: 'l-1', statusControl: { currentStatus: 'pending', listingId: 'l-1', canPublish: true, onStatusChange: async () => {} } })
    expect(screen.queryByTestId('listing-status-badge')).toBeNull()
    expect(screen.getByTestId('status-select').getAttribute('data-codes')!.split(',')[0]).toBe('pending')
  })

  it('[AC36] the owner of an active listing sees the badge of its status and the operations Archived, Deactivate, Sold, Rented; without a status control there is no badge', () => {
    mount({ mode: 'edit', listingId: 'l-1', statusControl: { currentStatus: 'active', listingId: 'l-1', canPublish: false, onStatusChange: async () => {} } })
    expect(screen.getByTestId('listing-status-badge').textContent).toBe('status_active')
    expect(screen.getByTestId('status-select').getAttribute('data-codes')).toBe('archived,inactive,sold,rented')
    cleanup()
    mount({ mode: 'edit', listingId: 'l-1' })
    expect(screen.queryByTestId('listing-status-badge')).toBeNull()
  })

  // Task 957 Revision 5 (R5-5, AC42; owner decision O957-18, 2026-11-23, translated: "a separate section under the section of actions with the listing")
  describe('[AC42] the owner deletes the listing from the edit form', () => {
    const editProps = { mode: 'edit', listingId: 'l-1' } as const

    it('with canDelete a second section under the actions holds "delete_listing"; its button opens the confirm with "delete_listing_confirm" and the confirm calls the handler once', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined)
      mount({ ...editProps, canDelete: true, onDelete })
      const trigger = screen.getByRole('button', { name: 'delete_listing' })
      const save = screen.getByRole('button', { name: 'form_save' })
      // the delete section follows the actions section and is a section of its own
      expect(save.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      const section = (el: HTMLElement) => el.closest('.mantine-Paper-root')
      expect(section(trigger)).not.toBe(section(save))
      expect(screen.queryByText('delete_listing_confirm')).toBeNull()
      fireEvent.click(trigger)
      const dialog = screen.getByRole('dialog')
      expect(dialog.textContent).toContain('delete_listing_confirm')
      expect(onDelete).not.toHaveBeenCalled()
      await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: 'delete' })) })
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('"cancel" in the confirm closes it and deletes nothing', () => {
      const onDelete = vi.fn()
      mount({ ...editProps, canDelete: true, onDelete })
      fireEvent.click(screen.getByRole('button', { name: 'delete_listing' }))
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'cancel' }))
      expect(onDelete).not.toHaveBeenCalled()
    })

    it('without canDelete (staff) there is no delete section, whatever handler is passed; nor in create mode', () => {
      const onDelete = vi.fn()
      mount({ ...editProps, canDelete: false, onDelete })
      expect(screen.queryByRole('button', { name: 'delete_listing' })).toBeNull()
      cleanup()
      mount({ ...editProps, onDelete })
      expect(screen.queryByRole('button', { name: 'delete_listing' })).toBeNull()
      cleanup()
      mount({ mode: 'create', canDelete: true, onDelete })
      expect(screen.queryByRole('button', { name: 'delete_listing' })).toBeNull()
    })

    // Task 957 Revision 8 (R8-3, AC47; Review 8 F45): the three buttons of the sidebar have the theme's canonical size (`sm`: 14px text, 44px high), not `lg` (18px text)
    it('[AC47] Save, Cancel and "Delete listing" render with data-size="sm"', () => {
      mount({ ...editProps, canDelete: true, onDelete: vi.fn() })
      for (const name of ['form_save', 'cancel', 'delete_listing']) expect(screen.getByRole('button', { name }).getAttribute('data-size'), name).toBe('sm')
    })

    it('"Delete listing" exists in the four locales', () => {
      expect([enMessages, itMessages, sqMessages, ukMessages].map(m => (m.listing as Record<string, string>).delete_listing)).toEqual(['Delete listing', 'Elimina annuncio', 'Fshi njoftimin', 'Видалити оголошення'])
    })
  })
})
