/**
 * Task 923 R113 (e), R86: the message dialog asks the human check for a fresh token before it sends, passes that token to the action, and resets the widget after every
 * answer (a Turnstile token is single-use). A failed check (the widget's rejection or the action's `bot_check_failed`) shows its own error toast and keeps the dialog
 * open with every typed value. The real `ListingInquiryDialog` and its View render; the human check (`CaptchaWidget`: `getToken`, `reset`), the server action, the
 * toast sink and the sign-in opener are doubles.
 */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../../messages/en.json'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast }))
const auth = vi.hoisted(() => ({ openAuthSheet: vi.fn() }))
vi.mock('@/lib/auth/authSheet', () => auth)
const action = vi.hoisted(() => ({ submitListingInquiry: vi.fn() }))
vi.mock('@/modules/listings/actions/submitListingInquiry', () => action)
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

import { ListingInquiryDialog } from '../ListingInquiryDialog'

const l = messages.listing
const LISTING_ID = '11111111-1111-4111-8111-111111111111'
const MESSAGE = 'Hello, I am interested in this flat. May we arrange a visit this week?'

function openDialog() {
  renderApp(<ListingInquiryDialog listingId={LISTING_ID} listingTitle="Flat" trigger={<button type="button">{l.send_message}</button>} />)
  fireEvent.click(screen.getByRole('button', { name: l.send_message }))
}
const dialog = () => screen.queryByRole('dialog')
const field = (label: string) => within(screen.getByRole('dialog')).getByLabelText(label) as HTMLInputElement
const fill = () => {
  fireEvent.change(field(l.inquiry_name_label), { target: { value: 'Alba' } })
  fireEvent.change(field(l.inquiry_email_label), { target: { value: 'alba@example.com' } })
  fireEvent.change(field(l.inquiry_message_label), { target: { value: MESSAGE } })
}
const send = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: l.inquiry_submit }))
const typedValuesKept = () => {
  expect(dialog()).not.toBeNull()
  expect(field(l.inquiry_name_label).value).toBe('Alba')
  expect(field(l.inquiry_email_label).value).toBe('alba@example.com')
  expect(field(l.inquiry_message_label).value).toBe(MESSAGE)
}

beforeEach(() => {
  setViewport(1024)
  Element.prototype.scrollIntoView = vi.fn()
  toast.success.mockReset(); toast.error.mockReset(); auth.openAuthSheet.mockReset(); action.submitListingInquiry.mockReset()
  widget.getToken.mockReset(); widget.reset.mockReset(); widget.props.length = 0
})
afterEach(() => cleanup())

describe('ListingInquiryDialog.bot', () => {
  it('[SEC-X-FE-INQUIRY-BOT-DENY] a failed check sends nothing', async () => {
    openDialog()
    fill()

    // the action refuses the check
    widget.getToken.mockResolvedValue('tok-1')
    action.submitListingInquiry.mockResolvedValue({ error: 'bot_check_failed' })
    send()
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(toast.error).toHaveBeenCalledWith(l.contact_bot_check_failed)
    expect(action.submitListingInquiry).toHaveBeenCalledTimes(1)
    expect(action.submitListingInquiry).toHaveBeenCalledWith({ listingId: LISTING_ID, name: 'Alba', email: 'alba@example.com', message: MESSAGE, captchaToken: 'tok-1' })
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    typedValuesKept()

    // the challenge itself fails: the action is not called at all
    widget.getToken.mockRejectedValue(new Error('Timeout'))
    await waitFor(() => expect(within(screen.getByRole('dialog')).getByRole('button', { name: l.inquiry_submit })).toBeEnabled())
    send()
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2))
    expect(toast.error).toHaveBeenNthCalledWith(2, l.contact_bot_check_failed)
    expect(action.submitListingInquiry).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(2))
    typedValuesKept()

    expect(toast.success, 'no success toast').not.toHaveBeenCalled()
    expect(auth.openAuthSheet).not.toHaveBeenCalled()
    expect(action.submitListingInquiry.mock.calls.every(([input]) => typeof input.captchaToken === 'string' && input.captchaToken.length > 0), 'the action never ran without a token').toBe(true)
  })

  it('a send with a verified token reaches the action once, resets the widget and closes the dialog on success', async () => {
    openDialog()
    fill()
    widget.getToken.mockResolvedValue('tok-send')
    action.submitListingInquiry.mockResolvedValue({})
    send()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(l.inquiry_success))
    expect(action.submitListingInquiry).toHaveBeenCalledTimes(1)
    expect(action.submitListingInquiry).toHaveBeenCalledWith({ listingId: LISTING_ID, name: 'Alba', email: 'alba@example.com', message: MESSAGE, captchaToken: 'tok-send' })
    expect(widget.getToken).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(widget.reset).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('the widget is interaction-only for the inquiry action and sits after the message field inside the dialog', () => {
    openDialog()
    expect(widget.props[0]).toMatchObject({ appearance: 'interaction-only', action: 'contact_inquiry' })
    const slot = within(screen.getByRole('dialog')).getByTestId('human-check-double')
    expect(field(l.inquiry_message_label).compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
