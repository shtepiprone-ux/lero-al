/**
 * Task 923 R113 (d), R86: the contact card reveals a number only through the server gateway after a human check. The real `ListingContact` and the real
 * `MantineListingContactPattern` render; the human check (`CaptchaWidget`: `getToken`, `reset`), the gateway (`revealListingContact`), the toast sink and the
 * message dialog (not under test) are doubles. The invariant: no number, no `tel:` link, no WhatsApp window and no browser call to the contact-event writer unless the
 * gateway answered a number for a token the widget gave, and the widget is reset after every answer (a Turnstile token is single-use).
 * Task 923 R119 (owner D75, D78): the answer of Show number is a `tel:` link on the card's first button (the container clicks no anchor), and an answer of WhatsApp
 * opens a window only while the click's activation lasts, otherwise the card shows the WhatsApp link and its note; `navigator.userActivation` is set per case.
 */
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../../messages/en.json'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast }))
vi.mock('@/lib/auth/authSheet', () => ({ openAuthSheet: vi.fn() }))
const gateway = vi.hoisted(() => ({ revealListingContact: vi.fn() }))
vi.mock('@/modules/listings/actions/contactGateway', () => gateway)
const events = vi.hoisted(() => ({ trackListingContactEvent: vi.fn() }))
vi.mock('@/modules/listings/actions/contactEvents', () => events)
const widget = vi.hoisted(() => ({ getToken: vi.fn(), reset: vi.fn(), props: [] as Array<Record<string, unknown>> }))
vi.mock('@/components/auth/CaptchaWidget', async () => {
  const react = await import('react')
  const Double = react.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    widget.props.push(props)
    react.useImperativeHandle(ref, () => ({ getToken: widget.getToken, reset: widget.reset }))
    return <div data-testid="human-check-double" />
  })
  Double.displayName = 'CaptchaWidget'
  return { CaptchaWidget: Double }
})
// the message dialog is not under test here: its trigger is all the card needs
vi.mock('@/modules/listings/components/ListingInquiryDialog', () => ({ ListingInquiryDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</> }))

import { ListingContact } from '../ListingContact'

const l = messages.listing
const LISTING_ID = '11111111-1111-4111-8111-111111111111'
const NUMBER = '+355 69 123 4567'
const DIGITS = '355691234567'
const OWNER = { id: 'owner-1', name: 'Ana Hoxha', has_phone: true, has_whatsapp: true, avatar_url: null, user_type: 'user', is_verified: false }

function renderCard() {
  return renderApp(
    <ListingContact
      owner={OWNER}
      listingTitle="Flat in Tirana"
      price={125000}
      currency="EUR"
      listingStatus="active"
      inquiryListingId={LISTING_ID}
      contactListingId={LISTING_ID}
    />,
  )
}
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const noContactLeak = () => {
  expect(document.querySelector('a[href^="tel:"], a[href*="wa.me"]'), 'no contact link in the DOM').toBeNull()
  expect(document.body.innerHTML, 'no part of the number in the DOM').not.toMatch(/691234567|69 123 4567/)
}

let opened: string[]
let windowOpen: ReturnType<typeof vi.fn>

beforeEach(() => {
  setViewport(1024)
  opened = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { opened.push(this.href) })
  windowOpen = vi.fn()
  vi.stubGlobal('open', windowOpen)
  toast.success.mockReset(); toast.error.mockReset()
  gateway.revealListingContact.mockReset(); events.trackListingContactEvent.mockReset()
  widget.getToken.mockReset(); widget.reset.mockReset(); widget.props.length = 0
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('ListingContact.bot', () => {
  it('[SEC-X-FE-CONTACT-BOT-DENY] a failed check reveals nothing', async () => {
    renderCard()
    widget.getToken.mockResolvedValue('tok-1')
    gateway.revealListingContact.mockResolvedValue({ ok: false, reason: 'bot_check_failed' })

    // the gateway refuses the check, once for Call and once for WhatsApp
    press(l.show_number)
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    press(l.whatsapp_button_label)
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(2))
    expect(toast.error).toHaveBeenNthCalledWith(1, l.contact_bot_check_failed)
    expect(toast.error).toHaveBeenNthCalledWith(2, l.contact_bot_check_failed)
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(2)
    expect(gateway.revealListingContact.mock.calls.map(([input]) => input.captchaToken)).toEqual(['tok-1', 'tok-1'])
    expect(gateway.revealListingContact.mock.calls.map(([input]) => input.channel)).toEqual(['call', 'whatsapp'])

    // the widget itself fails (a timeout of the challenge): the gateway is not called, the refusal shows and the widget resets
    widget.getToken.mockRejectedValue(new Error('Timeout'))
    press(l.show_number)
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(3))
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(3))
    expect(toast.error).toHaveBeenNthCalledWith(3, l.contact_bot_check_failed)
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(2)

    expect(opened, 'no tel: link was opened').toEqual([])
    expect(windowOpen, 'no WhatsApp window was opened').not.toHaveBeenCalled()
    expect(events.trackListingContactEvent, 'the browser never writes a contact event').not.toHaveBeenCalled()
    noContactLeak()
  })

  // Task 923 R127, R129 (owner D77, D79, D80): the gateway's reveal limit has its own text; nothing of the number reaches the card.
  it('[SEC-X-FE-CONTACT-LIMIT] a refused reveal shows the limit text and nothing else', async () => {
    renderCard()
    widget.getToken.mockResolvedValue('tok-limit')
    gateway.revealListingContact.mockResolvedValue({ ok: false, reason: 'rate_limited' })

    press(l.show_number)
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    press(l.whatsapp_button_label)
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(2))

    expect(l.contact_rate_limited).toBe('You have viewed many phone numbers in a short time. Please try again later.')
    expect(toast.error.mock.calls.map(([text]) => text), 'the limit text each time, not the check or the could-not-load text').toEqual([l.contact_rate_limited, l.contact_rate_limited])
    expect(gateway.revealListingContact.mock.calls.map(([input]) => input.channel)).toEqual(['call', 'whatsapp'])
    // both buttons are back and enabled, so the visitor can try again later
    expect(screen.getByRole('button', { name: l.show_number })).toBeEnabled()
    expect(screen.getByRole('button', { name: l.whatsapp_button_label })).toBeEnabled()
    expect(opened, 'no tel: link was opened').toEqual([])
    expect(windowOpen, 'no WhatsApp window was opened').not.toHaveBeenCalled()
    expect(events.trackListingContactEvent, 'the browser never writes a contact event').not.toHaveBeenCalled()
    noContactLeak()
  })

  it('every other refusal and a failed request show the usual "could not load" text, and the widget is reset', async () => {
    renderCard()
    widget.getToken.mockResolvedValue('tok-1')
    for (const [answer, resets] of [
      [{ ok: false, reason: 'unauthenticated' }, 1],
      [{ ok: false, reason: 'not_available' }, 2],
      [{ ok: false, reason: 'load_failed' }, 3],
    ] as const) {
      gateway.revealListingContact.mockResolvedValueOnce(answer)
      press(l.show_number)
      await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(resets))
    }
    gateway.revealListingContact.mockRejectedValueOnce(new Error('network'))
    press(l.show_number)
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(4))
    expect(toast.error.mock.calls.map(([text]) => text)).toEqual([l.contact_load_failed, l.contact_load_failed, l.contact_load_failed, l.contact_load_failed])
    expect(opened).toEqual([])
    expect(windowOpen).not.toHaveBeenCalled()
    noContactLeak()
  })

  it('[SEC-X-FE-CONTACT-BOT-ALLOW] a verified press reveals the number', async () => {
    renderCard()
    widget.getToken.mockResolvedValue('tok-allow')
    let answer!: (result: { ok: true; number: string }) => void
    gateway.revealListingContact.mockReturnValue(new Promise((resolve) => { answer = resolve }))

    press(l.show_number)
    await waitFor(() => expect(gateway.revealListingContact).toHaveBeenCalledTimes(1))
    // before the gateway answers: no digit of the number in the DOM, no link, no anchor clicked
    noContactLeak()
    expect(opened).toEqual([])

    answer({ ok: true, number: NUMBER })
    // the number is shown on its button, a link that dials; the Show-number button is gone
    const link = await screen.findByRole('link', { name: NUMBER })
    expect(link).toHaveAttribute('href', `tel:${DIGITS}`)
    expect(screen.queryByRole('button', { name: l.show_number })).toBeNull()
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(1)
    expect(gateway.revealListingContact).toHaveBeenCalledWith({ listingId: LISTING_ID, channel: 'call', captchaToken: 'tok-allow', locale: 'en' })
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    expect(widget.getToken).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
    expect(windowOpen).not.toHaveBeenCalled()
    // the container clicks no anchor of its own (R119 (c))
    expect(opened).toEqual([])
  })

  it('the number stays on the card, and a later press of the link needs no new request', async () => {
    renderCard()
    widget.getToken.mockResolvedValue('tok-allow')
    gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })
    press(l.show_number)
    const link = await screen.findByRole('link', { name: NUMBER })
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    // a press of WhatsApp does not remove the number
    gateway.revealListingContact.mockResolvedValue({ ok: false, reason: 'not_available' })
    press(l.whatsapp_button_label)
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('link', { name: NUMBER })).toHaveAttribute('href', `tel:${DIGITS}`)
    // the link is a plain link: following it calls neither the widget nor the gateway again
    expect(link).toBeInTheDocument()
    expect(widget.getToken).toHaveBeenCalledTimes(2)
    expect(gateway.revealListingContact).toHaveBeenCalledTimes(2)
  })

  it('a verified WhatsApp press opens WhatsApp and the browser records no contact event (the gateway does)', async () => {
    renderCard()
    widget.getToken.mockResolvedValue('tok-wa')
    gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })

    press(l.whatsapp_button_label)
    await waitFor(() => expect(windowOpen).toHaveBeenCalledTimes(1))
    expect(windowOpen.mock.calls[0][0]).toMatch(new RegExp(`^https://wa\\.me/${DIGITS}\\?text=`))
    expect(windowOpen.mock.calls[0].slice(1)).toEqual(['_blank', 'noopener,noreferrer'])
    expect(gateway.revealListingContact).toHaveBeenCalledWith({ listingId: LISTING_ID, channel: 'whatsapp', captchaToken: 'tok-wa', locale: 'en' })
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    expect(events.trackListingContactEvent).not.toHaveBeenCalled()
    expect(opened).toEqual([])
  })

  // Task 923 R119 (d), owner D78: a window can be opened only while the click's activation lasts; when it has expired by the time the number arrives, the card
  // shows a link and says why.
  describe('WhatsApp and the click activation', () => {
    const setActivation = (value: { isActive: boolean } | undefined) => {
      Object.defineProperty(navigator, 'userActivation', { configurable: true, value })
    }
    afterEach(() => { Reflect.deleteProperty(navigator, 'userActivation') })

    it('with an active click activation, a verified press calls window.open once and shows no fallback', async () => {
      setActivation({ isActive: true })
      renderCard()
      widget.getToken.mockResolvedValue('tok-wa')
      gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })

      press(l.whatsapp_button_label)
      await waitFor(() => expect(windowOpen).toHaveBeenCalledTimes(1))
      expect(windowOpen.mock.calls[0][0]).toMatch(new RegExp(`^https://wa\\.me/${DIGITS}\\?text=`))
      await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
      expect(screen.queryByRole('link', { name: l.open_whatsapp })).toBeNull()
      expect(screen.queryByRole('status')).toBeNull()
    })

    it('with an expired click activation, window.open is not called; the card shows the link and the note', async () => {
      setActivation({ isActive: false })
      renderCard()
      widget.getToken.mockResolvedValue('tok-wa')
      gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })

      press(l.whatsapp_button_label)
      const link = await screen.findByRole('link', { name: l.open_whatsapp })
      expect(windowOpen).not.toHaveBeenCalled()
      expect(link.getAttribute('href')).toMatch(new RegExp(`^https://wa\\.me/${DIGITS}\\?text=`))
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(screen.getByRole('status')).toHaveTextContent(l.whatsapp_retry_hint)
      await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
      // the link stays for the life of the page and needs no new request
      expect(widget.getToken).toHaveBeenCalledTimes(1)
      expect(gateway.revealListingContact).toHaveBeenCalledTimes(1)
      expect(events.trackListingContactEvent).not.toHaveBeenCalled()
    })

    it('an expired activation shows nothing when the gateway refuses', async () => {
      setActivation({ isActive: false })
      renderCard()
      widget.getToken.mockResolvedValue('tok-wa')
      gateway.revealListingContact.mockResolvedValue({ ok: false, reason: 'bot_check_failed' })

      press(l.whatsapp_button_label)
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(l.contact_bot_check_failed))
      expect(screen.queryByRole('link', { name: l.open_whatsapp })).toBeNull()
      expect(screen.queryByRole('status')).toBeNull()
      expect(windowOpen).not.toHaveBeenCalled()
      noContactLeak()
    })
  })

  // Task 923 R121 (F25): the pressed button is replaced by a link when the number is revealed; the focus follows the link, so a keyboard or screen-reader user keeps their place.
  describe('focus after the answer', () => {
    const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    afterEach(() => { Reflect.deleteProperty(navigator, 'userActivation') })

    it('a focused Show number, after a verified reveal, leaves the focus on the tel: link', async () => {
      renderCard()
      widget.getToken.mockResolvedValue('tok-focus')
      gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })
      const button = screen.getByRole('button', { name: l.show_number })
      button.focus()
      expect(document.activeElement).toBe(button)

      press(l.show_number)
      const link = await screen.findByRole('link', { name: NUMBER })
      expect(link).toHaveAttribute('href', `tel:${DIGITS}`)
      await waitFor(() => expect(document.activeElement).toBe(link))
    })

    it('a focused WhatsApp with an expired click activation leaves the focus on the Open WhatsApp link', async () => {
      Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { isActive: false } })
      renderCard()
      widget.getToken.mockResolvedValue('tok-focus')
      gateway.revealListingContact.mockResolvedValue({ ok: true, number: NUMBER })
      const button = screen.getByRole('button', { name: l.whatsapp_button_label })
      button.focus()
      expect(document.activeElement).toBe(button)

      press(l.whatsapp_button_label)
      const link = await screen.findByRole('link', { name: l.open_whatsapp })
      expect(windowOpen).not.toHaveBeenCalled()
      await waitFor(() => expect(document.activeElement).toBe(link))
    })

    it('a refusal leaves the focus on the pressed button', async () => {
      renderCard()
      widget.getToken.mockResolvedValue('tok-focus')
      gateway.revealListingContact.mockResolvedValue({ ok: false, reason: 'bot_check_failed' })
      const button = screen.getByRole('button', { name: l.show_number })
      button.focus()

      press(l.show_number)
      await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(button).toBeEnabled())
      await nextFrame()
      expect(button).toBeInTheDocument()
      expect(document.activeElement).toBe(button)
      noContactLeak()
    })

    it('when the focus has moved to another element before the answer, it stays there', async () => {
      renderCard()
      widget.getToken.mockResolvedValue('tok-focus')
      let answer!: (result: { ok: true; number: string }) => void
      gateway.revealListingContact.mockReturnValue(new Promise((resolve) => { answer = resolve }))
      const elsewhere = document.createElement('button')
      document.body.append(elsewhere)
      screen.getByRole('button', { name: l.show_number }).focus()

      press(l.show_number)
      await waitFor(() => expect(gateway.revealListingContact).toHaveBeenCalledTimes(1))
      elsewhere.focus()
      answer({ ok: true, number: NUMBER })
      await screen.findByRole('link', { name: NUMBER })
      await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
      await nextFrame()
      await nextFrame()
      expect(document.activeElement).toBe(elsewhere)
      elsewhere.remove()
    })
  })

  it('the card gives the widget the interaction-only appearance, the reveal action and a background token (prefetch)', () => {
    renderCard()
    expect(widget.props[0]).toMatchObject({ appearance: 'interaction-only', action: 'contact_reveal', prefetch: true })
  })

  it('the first button reads Show number', () => {
    renderCard()
    expect(l.show_number).toBe('Show number')
    expect(screen.getByRole('button', { name: l.show_number })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: l.call })).toBeNull()
  })

  // Task 923 R116, owner D74: the pending state belongs to the pressed button; the other button never looks pressed.
  describe.each([
    { pressed: 'call', pressedName: l.show_number, other: 'whatsapp', otherName: l.whatsapp_button_label },
    { pressed: 'whatsapp', pressedName: l.whatsapp_button_label, other: 'call', otherName: l.show_number },
  ] as const)('pending state of a press of $pressed', ({ pressed, pressedName, otherName }) => {
    const button = (name: string) => screen.getByRole('button', { name })
    const spinner = (name: string) => button(name).querySelector('.mantine-Loader-root')

    it(`while the check is pending only the ${pressed} button is disabled and holds the spinner; both are enabled after the answer`, async () => {
      renderCard()
      let release!: (token: string) => void
      widget.getToken.mockReturnValue(new Promise<string>((resolve) => { release = resolve }))
      gateway.revealListingContact.mockResolvedValue({ ok: false, reason: 'not_available' })

      press(pressedName)
      await waitFor(() => expect(button(pressedName)).toBeDisabled())
      expect(spinner(pressedName), 'the pressed button holds the spinner').not.toBeNull()
      expect(button(otherName), 'the other button stays enabled').toBeEnabled()
      expect(spinner(otherName), 'the other button shows no spinner').toBeNull()

      // a press of the other button while the request runs is ignored: one token at a time
      press(otherName)
      expect(widget.getToken).toHaveBeenCalledTimes(1)
      expect(gateway.revealListingContact).not.toHaveBeenCalled()

      release('tok-pending')
      await waitFor(() => expect(button(pressedName)).toBeEnabled())
      expect(button(otherName)).toBeEnabled()
      expect(spinner(pressedName)).toBeNull()
      expect(spinner(otherName)).toBeNull()
      expect(gateway.revealListingContact).toHaveBeenCalledTimes(1)
      expect(gateway.revealListingContact.mock.calls[0][0].channel).toBe(pressed)
    })
  })
})
