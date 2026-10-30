/**
 * Security (Task 923 R100, R101, D71, case SEC-X-FE-LISTING-BOUNDS): the listing form refuses a price above the ceiling of its currency with its existing invalid-price message.
 *  - the REAL `ListingFormShell` (the container: validation, the save call, the result handling) runs in create mode. A euro price above 10 000 000 000 and a lek price
 *    above 1 000 000 000 000 are refused with the existing `error_price` text on the price field: `createListing` is never called, the form does not navigate and shows no
 *    success message. The controls: a euro price at its ceiling, 20 000 000 000 in lek and a lek price at its ceiling are accepted and reach `createListing` unchanged.
 *  - a refusal of the server (`invalid_property_type` / `invalid_currency`) is shown in the form's existing submit-error slot and does not navigate.
 * `createListing`, the router and the translations are doubles; the presentational view is replaced by a stub that only exposes the container's props.
 */
import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
const create = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, back: vi.fn(), refresh: vi.fn() }), useParams: () => ({}) }))
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'sq' }))
vi.mock('@/modules/listings/actions/createListing', () => ({ createListing: (...a: unknown[]) => create(...a) }))
vi.mock('@/modules/listings/actions/updateListing', () => ({ updateListing: vi.fn() }))
vi.mock('@/modules/listings/actions/changeListingStatus', () => ({ changeListingStatusAction: vi.fn() }))
// the stub types the price the way a person does (through the container's `patch`) and exposes the container's save and its error texts
const TYPED = vi.hoisted(() => ({ price: 0, currency: 'ALL' as 'ALL' | 'EUR' }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { patch: (v: Record<string, unknown>) => void; onSubmit: () => void; errors: Record<string, string>; submitError: string }) => (
    <div>
      <button
        type="button"
        onClick={() => p.patch({
          title: 'A flat in Tirana',
          property_type: 'apartment',
          price: TYPED.price,
          currency: TYPED.currency,
          images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg', is_cover: true, order: 0 }],
        })}
      >
        fill
      </button>
      <button type="button" onClick={() => void p.onSubmit()}>save</button>
      <output data-testid="price-error">{p.errors.price ?? ''}</output>
      <output data-testid="submit-error">{p.submitError}</output>
    </div>
  ),
}))

import { ListingFormShell } from '../ListingFormShell'

const shell = () => (
  <ListingFormShell mode="create" locale="sq" uploadPreset="p" uploadFolder="f" locations={[]} />
)

beforeEach(() => {
  vi.useFakeTimers()
  push.mockReset()
  create.mockReset()
})
afterEach(() => { cleanup(); vi.useRealTimers() })

async function typePriceAndSave(price: number, currency: 'ALL' | 'EUR' = 'ALL') {
  TYPED.price = price
  TYPED.currency = currency
  render(shell())
  await act(async () => { fireEvent.click(screen.getByText('fill')) })
  await act(async () => { fireEvent.click(screen.getByText('save')) })
}

describe('ListingFormShell', () => {
  it('[SEC-X-FE-LISTING-BOUNDS] a price above the ceiling is refused in the form', async () => {
    // the ceilings as the owner decided them (D71), written out so that the expectation does not come from the module under test
    const EUR = 10_000_000_000
    const ALL = 1_000_000_000_000
    // a price above the ceiling of its currency: the existing invalid-price message on the price field, nothing is sent, nothing navigates
    const refused: [number, 'ALL' | 'EUR'][] = [[EUR + 1, 'EUR'], [ALL + 1, 'ALL'], [20_000_000_000, 'EUR']]
    for (const [price, currency] of refused) {
      create.mockReset()
      push.mockReset()
      await typePriceAndSave(price, currency)
      expect(screen.getByTestId('price-error').textContent, `${currency} ${price}`).toBe('error_price')
      expect(create, `${currency} ${price}: the server was not called`).not.toHaveBeenCalled()
      expect(document.body.textContent, `${currency} ${price}: no success message`).not.toContain('moderation_title')
      await act(async () => { vi.advanceTimersByTime(10_000) })
      expect(push, `${currency} ${price}: no navigation`).not.toHaveBeenCalled()
      cleanup()
    }

    // the controls: a euro price at its ceiling, 20 000 000 000 in lek and a lek price at its ceiling reach the server unchanged and the form follows its success path
    // (the moderation message replaces the form)
    const accepted: [number, 'ALL' | 'EUR'][] = [[EUR, 'EUR'], [20_000_000_000, 'ALL'], [ALL, 'ALL']]
    for (const [price, currency] of accepted) {
      create.mockReset()
      push.mockReset()
      create.mockResolvedValue({ slug: 'any-slug' })
      await typePriceAndSave(price, currency)
      expect(create, `${currency} ${price}`).toHaveBeenCalledTimes(1)
      expect(create.mock.calls[0][0], `${currency} ${price}`).toMatchObject({ price, currency })
      expect(document.body.textContent, `${currency} ${price}`).toContain('moderation_title')
      await act(async () => { vi.advanceTimersByTime(4000) })                      // the success path navigates after its delay: let it finish before the next case
      expect(push, `${currency} ${price}`).toHaveBeenCalledWith('/sq/')
      cleanup()
    }

    // a catalogue refusal of the server is shown in the submit-error slot, and the form does not navigate
    for (const code of ['invalid_property_type', 'invalid_currency']) {
      create.mockReset()
      push.mockReset()
      create.mockResolvedValue({ error: code })
      await typePriceAndSave(95_000)
      expect(screen.getByTestId('submit-error').textContent, code).toBe('error_creating')
      expect(document.body.textContent, code).not.toContain('moderation_title')
      await act(async () => { vi.advanceTimersByTime(10_000) })
      expect(push, code).not.toHaveBeenCalled()
      cleanup()
    }
  })
})
