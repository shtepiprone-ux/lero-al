/**
 * Task 1044 AC7: the inquiry dialog shows a customer's mail as text.
 *  - SEC-1044-DIALOG-TEXT: a stored `<b>` in a message or an answer and markup in a file name are shown as their characters, never as elements;
 *  - an `inbound` row is headed by the neutral badge "Message from the customer" and its sender address instead of a staff name; a staff row keeps the staff name;
 *  - the attachment names of the message and of a row are listed as "<name> (<size> KB)" under "Attachments (not kept)"; no list without attachments.
 * Renders the real View on MantineProvider with the project theme and the real `en` messages. Every value is synthetic.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { InquiryDetailDialogView } from '../InquiryDetailDialogView'
import type { InquiryRow, ReplyRow } from '../AdminInquiriesManager'

const t = messages.admin.inquiries as Record<string, string>

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

const INQUIRY: InquiryRow = {
  id: 'inq-mail',
  created_at: '2026-11-20T10:00:00Z',
  topic: 'other',
  custom_subject: 'Question about the flat',
  name: 'Ana Hoxha',
  email: 'ana@example.com',
  message: 'Hello <b>team</b>,\nis it free?',
  target_mailbox: 'support@lero.al',
  status: 'new',
  reply_count: 1,
  handled_at: null,
  source: 'email',
  attachments: [{ filename: '<img src=x onerror=alert(1)>.pdf', size: 2048, content_type: 'application/pdf' }, { filename: 'plan.png', size: 1_048_576, content_type: 'image/png' }],
}

const STAFF: ReplyRow = {
  id: 'rep-staff', inquiry_id: 'inq-mail', body: 'Yes, it is free.', created_at: '2026-11-20T11:00:00Z', replied_by: 'u-admin', replier: { name: 'Elira Dervishi' },
  direction: 'outbound', from_email: null, attachments: [],
}
const INBOUND: ReplyRow = {
  id: 'rep-in', inquiry_id: 'inq-mail', body: 'Thanks <b>a lot</b>', created_at: '2026-11-20T12:00:00Z', replied_by: null, replier: null,
  direction: 'inbound', from_email: 'ana@example.com', attachments: [{ filename: 'id-card.jpg', size: 512, content_type: 'image/jpeg' }],
}

function renderView(inquiry: InquiryRow, replies: ReplyRow[]) {
  return render(
    <MantineProvider theme={theme}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <InquiryDetailDialogView
          inquiry={inquiry}
          replies={replies}
          subject={inquiry.custom_subject ?? inquiry.topic}
          statusOptions={[{ code: 'new', labelKey: 'status_new' }, { code: 'in_progress', labelKey: 'status_in_progress' }, { code: 'closed', labelKey: 'status_closed' }]}
          replyBody=""
          onReplyBodyChange={() => {}}
          isPending={false}
          onStatusSubmit={() => {}}
          onSendReply={() => {}}
          onClose={() => {}}
        />
      </NextIntlClientProvider>
    </MantineProvider>,
  )
}

describe('AC7 the dialog renders received mail as text', () => {
  it('[SEC-1044-DIALOG-TEXT] markup in a message, an answer and a file name is shown as text, never as an element', () => {
    renderView(INQUIRY, [STAFF, INBOUND])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Hello <b>team<\/b>,/)).toBeInTheDocument()
    expect(within(dialog).getByText('Thanks <b>a lot</b>')).toBeInTheDocument()
    expect(within(dialog).getByText('<img src=x onerror=alert(1)>.pdf (2 KB)')).toBeInTheDocument()
    expect(dialog.querySelector('b, img')).toBeNull()
  })

  it('an inbound row is headed by the customer badge and its address; a staff row keeps the staff name', () => {
    renderView(INQUIRY, [STAFF, INBOUND])
    const dialog = screen.getByRole('dialog')
    expect(t.customer_message).toBe('Message from the customer')
    const badge = within(dialog).getByText(t.customer_message)
    const inboundRow = badge.closest('.mantine-Paper-root') as HTMLElement
    expect(inboundRow).not.toBeNull()
    expect(within(inboundRow).getByText('ana@example.com')).toBeInTheDocument()
    expect(within(inboundRow).getByText('id-card.jpg (1 KB)')).toBeInTheDocument()
    expect(within(inboundRow).queryByText('Elira Dervishi')).toBeNull()
    const staffRow = within(dialog).getByText('Elira Dervishi').closest('.mantine-Paper-root') as HTMLElement
    expect(within(staffRow).queryByText(t.customer_message)).toBeNull()
    expect(within(dialog).getAllByText(t.customer_message)).toHaveLength(1)
  })

  it('lists the message\'s attachment names with their sizes under the "not kept" title', () => {
    renderView(INQUIRY, [STAFF, INBOUND])
    const dialog = screen.getByRole('dialog')
    expect(t.attachments_not_kept).toBe('Attachments (not kept)')
    expect(within(dialog).getAllByText(t.attachments_not_kept)).toHaveLength(2)
    expect(within(dialog).getByText('plan.png (1024 KB)')).toBeInTheDocument()
  })

  it('a form inquiry and staff rows without attachments show no attachment list and no badge (the control)', () => {
    renderView({ ...INQUIRY, source: 'form', attachments: [], message: 'Plain form message text here' }, [STAFF])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByText(t.attachments_not_kept)).toBeNull()
    expect(within(dialog).queryByText(t.customer_message)).toBeNull()
    expect(within(dialog).getByText('Elira Dervishi')).toBeInTheDocument()
  })
})
