/**
 * Task 923 R42 (owner decisions D9, D19): every answer of `submitListingInquiry` has exactly one outcome in the message dialog. A success toast appears
 * only for no error (and the partial success `email_transient`); an answer the dialog does not know is an error, never "sent"; an ended session closes
 * the dialog, keeps the typed text and opens the sign-in sheet (one sheet at a time). The real `ListingInquiryDialog` and its View render; only the
 * server action, the toast sink and the sign-in opener are doubles.
 */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../../../messages/en.json'
import { renderApp, setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/toast', () => ({ toast }))
const auth = vi.hoisted(() => ({ openAuthSheet: vi.fn() }))
vi.mock('@/lib/auth/authSheet', () => auth)
const action = vi.hoisted(() => ({ submitListingInquiry: vi.fn() }))
vi.mock('@/modules/listings/actions/submitListingInquiry', () => action)

import { ListingInquiryDialog } from './ListingInquiryDialog'

const l = messages.listing
const MESSAGE = 'Hello, I am interested in this flat. May we arrange a visit this week?'

function open(defaults: { defaultName?: string; defaultEmail?: string } = {}) {
  return renderApp(
    <ListingInquiryDialog
      listingId="11111111-1111-4111-8111-111111111111"
      listingTitle="Flat"
      {...defaults}
      trigger={<button type="button">{l.send_message}</button>}
    />,
  )
}
const dialog = () => screen.queryByRole('dialog')
const field = (label: string) => within(screen.getByRole('dialog')).getByLabelText(label) as HTMLInputElement
const fill = (name = 'Alba', email = 'alba@example.com', message = MESSAGE) => {
  fireEvent.change(field(l.inquiry_name_label), { target: { value: name } })
  fireEvent.change(field(l.inquiry_email_label), { target: { value: email } })
  fireEvent.change(field(l.inquiry_message_label), { target: { value: message } })
}
const send = () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: l.inquiry_submit }))

beforeEach(() => {
  setViewport(1024)
  Element.prototype.scrollIntoView = vi.fn()
  toast.success.mockReset(); toast.error.mockReset(); auth.openAuthSheet.mockReset(); action.submitListingInquiry.mockReset()
})
afterEach(() => cleanup())

describe('message dialog and an ended session', () => {
  it('[SEC-CS-FE-ALLOW] a sent message shows success and closes the dialog empty', async () => {
    action.submitListingInquiry.mockResolvedValue({})
    open()
    fireEvent.click(screen.getByRole('button', { name: l.send_message }))
    fill(); send()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(l.inquiry_success))
    expect(action.submitListingInquiry).toHaveBeenCalledWith({
      listingId: '11111111-1111-4111-8111-111111111111', name: 'Alba', email: 'alba@example.com', message: MESSAGE, captchaToken: 'dev-noop-token',
    })
    await waitFor(() => expect(dialog()).toBeNull())
    expect(toast.error).not.toHaveBeenCalled()
    expect(auth.openAuthSheet).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: l.send_message }))
    expect(field(l.inquiry_message_label).value).toBe('')
  })

  it('[SEC-CS-FE-DENY] an ended session closes the dialog, opens sign-in and keeps the typed message', async () => {
    action.submitListingInquiry.mockResolvedValue({ error: 'unauthenticated' })
    open({ defaultName: 'Default Name', defaultEmail: 'default@example.com' })
    fireEvent.click(screen.getByRole('button', { name: l.send_message }))
    fill('Alba', 'alba@example.com')
    send()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(l.inquiry_error_unauthenticated))
    await waitFor(() => expect(dialog()).toBeNull())
    expect(auth.openAuthSheet).toHaveBeenCalledTimes(1)
    expect(auth.openAuthSheet).toHaveBeenCalledWith('login')
    expect(toast.success).not.toHaveBeenCalled()
    // the next opening shows what was typed, not the defaults and not an empty message
    fireEvent.click(screen.getByRole('button', { name: l.send_message }))
    expect(field(l.inquiry_name_label).value).toBe('Alba')
    expect(field(l.inquiry_email_label).value).toBe('alba@example.com')
    expect(field(l.inquiry_message_label).value).toBe(MESSAGE)
  })

  it('[SEC-CS-FE-ERR] a failed or unknown answer shows an error and keeps the dialog open', async () => {
    for (const answer of ['save_failed', 'something_the_dialog_does_not_know'] as const) {
      cleanup(); toast.success.mockReset(); toast.error.mockReset(); auth.openAuthSheet.mockReset()
      action.submitListingInquiry.mockResolvedValue({ error: answer })
      open()
      fireEvent.click(screen.getByRole('button', { name: l.send_message }))
      fill(); send()
      await waitFor(() => expect(toast.error, answer).toHaveBeenCalledWith(l.inquiry_error_save_failed))
      expect(toast.success, answer).not.toHaveBeenCalled()
      expect(auth.openAuthSheet, answer).not.toHaveBeenCalled()
      expect(dialog(), answer).not.toBeNull()
      expect(field(l.inquiry_name_label).value, answer).toBe('Alba')
      expect(field(l.inquiry_message_label).value, answer).toBe(MESSAGE)
    }
  })
})
