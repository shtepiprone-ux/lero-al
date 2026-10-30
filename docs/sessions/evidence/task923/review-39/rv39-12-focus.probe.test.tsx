/**
 * Task 923 Review 39 (Opus, 2026-10-23): F25's probe on the real `ListingContact` and `MantineListingContactPattern` (doubles as in
 * `ListingContact.bot.security.test.tsx`). It establishes, for the route of R121, that after a reveal:
 * - the pressed control is no longer connected and the focus is on `body` (the defect);
 * - the pressed control's parent element, captured before the press, is still connected, and its child at the pressed control's index is the
 *   link that replaced it (the mechanism R121 uses).
 * It changes no product file. Run with: npx vitest run --config docs/sessions/evidence/task923/review-39/rv39-12-vitest.config.mts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
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

beforeEach(() => { setViewport(1024); gateway.revealListingContact.mockReset(); widget.getToken.mockReset(); widget.reset.mockReset() })
afterEach(() => { cleanup(); Reflect.deleteProperty(navigator, 'userActivation') })

describe.each([
  { channel: 'call', name: l.show_number, link: NUMBER, activation: undefined },
  { channel: 'whatsapp', name: l.whatsapp_button_label, link: l.open_whatsapp, activation: { isActive: false } },
] as const)('after the reveal of $channel', ({ name, link, activation }) => {
  it('the pressed button is gone, the focus is on body, and the parent holds the link at the same index', async () => {
    if (activation) Object.defineProperty(navigator, 'userActivation', { configurable: true, value: activation })
    renderApp(<ListingContact owner={OWNER} listingTitle="Flat" price={1} currency="EUR" listingStatus="active" inquiryListingId={ID} contactListingId={ID} />)
    widget.getToken.mockResolvedValue('tok')
    gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })
    const pressed = screen.getByRole('button', { name })
    pressed.focus()
    const slot = pressed.parentElement!
    const index = Array.prototype.indexOf.call(slot.children, pressed)
    fireEvent.click(pressed)
    const replacement = await screen.findByRole('link', { name: link })
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    console.log(JSON.stringify({ name, index, pressedConnected: pressed.isConnected, slotConnected: slot.isConnected, sameIndex: slot.children[index] === replacement, active: document.activeElement?.tagName }))
    expect(pressed.isConnected).toBe(false)
    expect(document.activeElement).toBe(document.body)
    expect(slot.isConnected).toBe(true)
    expect(slot.children[index]).toBe(replacement)
  })
})
