/**
 * Security (Task 923 R102, D73, case SEC-X-FE-PRICE-DIGITS): the price field of the listing form keeps digits only.
 *  - the REAL `ListingFormShellView` runs with its real legacy price `Input` and the real `parsePriceDigits`. A harness holds the form data and applies `patch`, as the container
 *    does. Typing "20 000 000 000" one character at a time, and pasting it written with ordinary, U+00A0 and U+202F spaces, into the price field with currency ALL leaves
 *    the number 20000000000 in the data and "20000000000" in the field.
 *  - the field is a text input in numeric input mode, so a browser number field no longer drops what it cannot parse.
 * The translations and the heavy child sections (image upload, the two comboboxes, the dynamic fields, the status select) are doubles.
 */
import React, { useState } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSchema } from '@/modules/listings/domain/propertyTypeSchema'
import type { FormValues } from '@/modules/listings/types/form'

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/components/ImageUpload', () => ({ ImageUpload: () => null }))
vi.mock('@/components/shared/LocationCombobox', () => ({ LocationCombobox: () => null }))
vi.mock('@/components/shared/PropertyTypeCombobox', () => ({ PropertyTypeCombobox: () => null }))
vi.mock('@/modules/listings/components/form/DynamicFieldSection', () => ({ DynamicFieldSection: () => null }))
vi.mock('@/components/admin/StatusChangeSelect', () => ({ StatusChangeSelect: () => null }))

import { ListingFormShellView } from '../ListingFormShellView'

const patches = vi.hoisted(() => ({ calls: [] as Record<string, unknown>[] }))

const INITIAL: FormValues = { listing_type: 'sale', property_type: 'apartment', title: '', currency: 'ALL', multi_storey_building: false, images: [] }

/** Holds the data the way the container does and records every patch the view asks for. */
function Harness() {
  const [data, setData] = useState<FormValues>(INITIAL)
  return (
    <ListingFormShellView
      mode="create"
      data={data}
      errors={{}}
      schema={getSchema('apartment')}
      locations={[]}
      patch={partial => { patches.calls.push(partial); setData(prev => ({ ...prev, ...partial })) }}
      onPropertyTypeChange={() => {}}
      uploadPreset="p"
      uploadFolder="f"
      submitting={false}
      submitError=""
      isDirty
      onSubmit={() => {}}
      onCancelClick={() => {}}
      showCancelDialog={false}
      onCancelDialogChange={() => {}}
      onConfirmCancel={() => {}}
    />
  )
}

function mount() {
  patches.calls = []
  const { container } = render(<Harness />)
  const field = container.querySelector<HTMLInputElement>('#field-price input')
  if (!field) throw new Error('the price field is not rendered')
  return field
}

/** A person types the text one character at a time: each keystroke appends to what the field shows now. */
function type(field: HTMLInputElement, text: string) {
  for (const char of text) fireEvent.change(field, { target: { value: field.value + char } })
}

afterEach(cleanup)

describe('ListingFormShellView', () => {
  it('[SEC-X-FE-PRICE-DIGITS] typed or pasted spaces are dropped from the price', () => {
    // the field is a text input in numeric input mode, not a browser number field
    const typed = mount()
    expect(typed.getAttribute('type'), 'a text field').toBe('text')
    expect(typed.getAttribute('inputmode'), 'numeric input mode').toBe('numeric')
    expect(typed.hasAttribute('min'), 'no number-field bound').toBe(false)

    // typing: no keystroke leaves a space in the field or hands the form an undefined price, and the final number is exact
    type(typed, '20 000 000 000')
    expect(typed.value, 'typed: the field shows digits only').toBe('20000000000')
    expect(patches.calls.every(call => typeof call.price === 'number'), 'typed: every patch carries a number').toBe(true)
    expect(patches.calls.at(-1), 'typed: the last patch').toEqual({ price: 20_000_000_000 })
    cleanup()

    // pasting: one change carrying the whole text, with ordinary, no-break and narrow no-break spaces
    const pasted: [string, string][] = [
      ['ordinary spaces', '20 000 000 000'],
      ['U+00A0 spaces', '20\u00A0000\u00A0000\u00A0000'],
      ['U+202F spaces', '20\u202F000\u202F000\u202F000'],
    ]
    for (const [name, text] of pasted) {
      const field = mount()
      fireEvent.change(field, { target: { value: text } })
      expect(patches.calls, `pasted with ${name}: one patch with the exact price`).toEqual([{ price: 20_000_000_000 }])
      expect(field.value, `pasted with ${name}: the field shows digits only`).toBe('20000000000')
      cleanup()
    }
  })
})
