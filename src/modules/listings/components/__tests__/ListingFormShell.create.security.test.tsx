/**
 * Security (Task 923 R82 (d), hardening v7.1; kickoff §44 R95): the create form sends the title exactly as typed, and a refused save is shown as a refusal.
 *  - SEC-X-FE-SLUG-CREATE: the REAL `ListingFormShell` (the container: validation, the save call, the result handling) runs in create mode. A title with a " - " and a
 *    Cyrillic title reach `createListing` unchanged and the shell follows its success path (the moderation message, then the home page). A save that `createListing`
 *    answers with `{ error: 'insert_failed' }` (what the action returns when the database refuses the insert) shows the submit error, never navigates and never shows
 *    the success message. The slug is made by the server from the title, so the form must not rewrite the title to suit it.
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
// the stub types the title the way a person does (through the container's `patch`) and exposes the container's save and its error texts
const TYPED = vi.hoisted(() => ({ title: '' }))
vi.mock('@/modules/listings/components/ListingFormShellView', () => ({
  ListingFormShellView: (p: { patch: (v: Record<string, unknown>) => void; onSubmit: () => void; errors: Record<string, string>; submitError: string }) => (
    <div>
      <button
        type="button"
        onClick={() => p.patch({
          title: TYPED.title,
          property_type: 'apartment',
          price: 95000,
          images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/listings/a.jpg', is_cover: true, order: 0 }],
        })}
      >
        fill
      </button>
      <button type="button" onClick={() => void p.onSubmit()}>save</button>
      <output data-testid="errors">{Object.keys(p.errors).filter((k) => p.errors[k]).join(',')}</output>
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

async function typeAndSave(title: string) {
  TYPED.title = title
  render(shell())
  await act(async () => { fireEvent.click(screen.getByText('fill')) })
  await act(async () => { fireEvent.click(screen.getByText('save')) })
}

describe('ListingFormShell', () => {
  it('[SEC-X-FE-SLUG-CREATE] a hyphen or Cyrillic title is sent as typed and a refusal is shown', async () => {
    // the allowed saves: each title reaches createListing unchanged and the shell follows its success path
    for (const title of ['Shitet apartament - 2+1', 'Продається квартира в центрі']) {
      create.mockReset()
      push.mockReset()
      create.mockResolvedValue({ slug: 'any-slug' })
      await typeAndSave(title)
      expect(create).toHaveBeenCalledTimes(1)
      expect(create.mock.calls[0][0], title).toMatchObject({ title })                       // the title is exactly as typed
      expect(document.body.textContent, title).toContain('moderation_title')                  // the success path
      await act(async () => { vi.advanceTimersByTime(4000) })
      expect(push, title).toHaveBeenCalledWith('/sq/')
      cleanup()
    }

    // the refused save: createListing answers insert_failed (the database refused the insert)
    create.mockReset()
    push.mockReset()
    create.mockResolvedValue({ error: 'insert_failed' })
    await typeAndSave('Shitet apartament - 2+1')
    expect(create).toHaveBeenCalledTimes(1)
    expect(create.mock.calls[0][0]).toMatchObject({ title: 'Shitet apartament - 2+1' })
    expect(screen.getByTestId('submit-error').textContent).toBe('error_creating')            // the refusal is shown
    expect(document.body.textContent).not.toContain('moderation_title')                      // no success path
    expect(document.body.textContent).not.toContain('moderation_body')
    await act(async () => { vi.advanceTimersByTime(10_000) })
    expect(push).not.toHaveBeenCalled()                                                     // no navigation after a refused save
  })
})
