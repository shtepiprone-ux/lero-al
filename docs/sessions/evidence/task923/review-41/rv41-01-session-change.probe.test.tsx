/**
 * Task 923 Review 41 (Opus, 2026-10-23): the owner's question, the number after a sign-out and a new sign-in. The listing page renders `ListingContact` without a key
 * (ListingDetailView.tsx `<LazyListingContact`), and the header's sign-out on a public page calls `router.refresh()` (Header.tsx handleLogout, postSignOut.ts), which
 * keeps a client component's state. This probe re-renders the real container in place, as a refresh does, with the props the page gives:
 * signed in → reveal → guest (isGuest, an empty owner row) → signed in again. It records whether the revealed number comes back without a new gateway call.
 * It changes no product file. Run with: npx vitest run --config docs/sessions/evidence/task923/review-41/rv41-01-vitest.config.mts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import messages from '../../../../../messages/en.json'

const gateway = vi.hoisted(() => ({ revealListingContact: vi.fn() }))
vi.mock('@/modules/listings/actions/contactGateway', () => gateway)
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const widget = vi.hoisted(() => ({ getToken: vi.fn(), reset: vi.fn() }))
vi.mock('@/components/auth/CaptchaWidget', async () => {
  const react = await import('react')
  const Double = react.forwardRef((_props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    react.useImperativeHandle(ref, () => ({ getToken: widget.getToken, reset: widget.reset }))
    return null
  })
  Double.displayName = 'CaptchaWidget'
  return { CaptchaWidget: Double }
})
vi.mock('@/modules/listings/components/ListingInquiryDialog', () => ({ ListingInquiryDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</> }))

import { ListingContact } from '@/modules/listings/components/ListingContact'

const l = messages.listing
const NUMBER = '+355 69 123 4567'
const ID = '11111111-1111-4111-8111-111111111111'
const OWNER = { id: 'owner-1', name: 'Ana Hoxha', has_phone: true, has_whatsapp: true, avatar_url: null, user_type: 'user', is_verified: false }
// what page.tsx passes a guest: RLS hides the owner row, so the fallback owner has an empty id
const GUEST_OWNER = { id: '', name: null, has_phone: false, has_whatsapp: false, avatar_url: null, user_type: 'user', is_verified: false }

const wrap = (node: React.ReactElement) => (
  <NextIntlClientProvider locale="en" messages={messages as never} timeZone="Europe/Tirane">
    <MantineProvider theme={theme} env="test">{node}</MantineProvider>
  </NextIntlClientProvider>
)
const card = (signedIn: boolean) => (
  <ListingContact owner={signedIn ? OWNER : GUEST_OWNER} isGuest={!signedIn} listingTitle="Flat" price={1} currency="EUR" listingStatus="active" inquiryListingId={ID} contactListingId={ID} />
)

beforeEach(() => { setViewport(1024); gateway.revealListingContact.mockReset(); widget.getToken.mockReset(); widget.reset.mockReset() })
afterEach(() => cleanup())

describe('the revealed number across a sign-out and a new sign-in in the same page', () => {
  it('records what each step shows', async () => {
    widget.getToken.mockResolvedValue('tok')
    gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })
    const view = render(wrap(card(true)))
    fireEvent.click(screen.getByRole('button', { name: l.show_number }))
    await screen.findByRole('link', { name: NUMBER })
    const step1 = { calls: gateway.revealListingContact.mock.calls.length, numberInDom: document.body.textContent?.includes(NUMBER) }

    view.rerender(wrap(card(false)))
    const step2 = { numberInDom: document.body.textContent?.includes(NUMBER), guestCta: !!screen.queryByText(l.contact_guest_title) }

    view.rerender(wrap(card(true)))
    const step3 = {
      calls: gateway.revealListingContact.mock.calls.length,
      numberLink: !!screen.queryByRole('link', { name: NUMBER }),
      showNumberButton: !!screen.queryByRole('button', { name: l.show_number }),
    }
    console.log(JSON.stringify({ afterReveal: step1, afterSignOut: step2, afterSignInAgain: step3 }))
    expect(step1).toEqual({ calls: 1, numberInDom: true })
    expect(step2.numberInDom).toBe(false)
    // the finding: the number is back with no new request, so no human check, no limit and no reveal row for the session now signed in
    expect(step3).toEqual({ calls: 1, numberLink: true, showNumberButton: false })
  })
})
