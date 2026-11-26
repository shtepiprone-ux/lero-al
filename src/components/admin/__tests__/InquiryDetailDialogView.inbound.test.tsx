/**
 * Task 1044 AC7: the inquiry dialog shows a customer's mail as text.
 *  - SEC-1044-DIALOG-TEXT: a stored `<b>` in a message or an answer and markup in a file name are shown as their characters, never as elements;
 *  - an `inbound` row is headed by the neutral badge "Message from the customer" and its sender address instead of a staff name; a staff row keeps the staff name;
 *  - the attachment names of the message and of a row are listed as "<name> (<size> KB)" under "Attachments (not kept)"; no list without attachments.
 * Task 1047 AC4 (SEC-1047-DIALOG-LINK): a stored file (with `key`) is a link to `/api/admin/inquiry-attachment?inquiry=<id>&n=<i>` (`&reply=<id>` in a row), a preview opens in a new tab
 * with `rel="noopener noreferrer"`, any other stored file has no target; the title reads "Attachments" when every file is stored; a row written before the task keeps its plain lines
 * and "Attachments (not kept)".
 * Renders the real View on MantineProvider with the project theme and the real `en` messages. Every value is synthetic.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
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

  it('Revision 1 (F1): the sender address is its own line under the header row, outside the Group of the badge and the date, so a long address wraps', () => {
    renderView(INQUIRY, [STAFF, INBOUND])
    const dialog = screen.getByRole('dialog')
    const badge = within(dialog).getByText(t.customer_message)
    const header = badge.closest('.mantine-Group-root') as HTMLElement
    expect(header).not.toBeNull()
    const inboundRow = badge.closest('.mantine-Paper-root') as HTMLElement
    const address = within(inboundRow).getByText('ana@example.com')
    expect(header.contains(address)).toBe(false)
    expect(address.closest('.mantine-Group-root')).toBeNull()
    expect(address.parentElement).toBe(header.parentElement)
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

describe('Task 1047 AC4 stored attachments open from the dialog', () => {
  const ID = '3f1c2a54-9d0e-4c43-8d7a-0e5b1a6c7d21'
  const REPLY = '9a1c2a54-9d0e-4c43-8d7a-0e5b1a6c7d99'
  const key = (n: number) => `mail/${ID}/0f8e4c1a-2b3d-4e5f-9a6b-7c8d9e0f1a2${n}`
  const STORED: InquiryRow = {
    ...INQUIRY,
    id: ID,
    attachments: [
      { filename: 'photo.png', size: 2048, content_type: 'image/png', key: key(0), preview: true },
      { filename: '<b>plan</b>.pdf', size: 4096, content_type: 'application/pdf', key: key(1), preview: true },
      { filename: 'contract.docx', size: 1024, content_type: 'application/msword', key: key(2), preview: false },
    ],
  }
  const STORED_ANSWER: ReplyRow = { ...INBOUND, id: REPLY, inquiry_id: ID, attachments: [{ filename: 'id-card.jpg', size: 512, content_type: 'image/jpeg', key: key(3), preview: true }] }
  const route = (query: string) => `/api/admin/inquiry-attachment?${query}`

  it('[SEC-1047-DIALOG-LINK] a stored preview file is a link to the route that opens in a new tab with rel="noopener noreferrer", followed by its size', () => {
    renderView(STORED, [STAFF, STORED_ANSWER])
    const dialog = screen.getByRole('dialog')
    const photo = within(dialog).getByRole('link', { name: 'photo.png' })
    expect(photo).toHaveAttribute('href', route(`inquiry=${ID}&n=0`))
    expect(photo).toHaveAttribute('target', '_blank')
    expect(photo).toHaveAttribute('rel', 'noopener noreferrer')
    expect(photo.parentElement?.textContent).toBe('photo.png (2 KB)')
    const pdf = within(dialog).getByRole('link', { name: '<b>plan</b>.pdf' })
    expect(pdf).toHaveAttribute('href', route(`inquiry=${ID}&n=1`))
    expect(pdf).toHaveAttribute('target', '_blank')
    expect(dialog.querySelector('b, img')).toBeNull()
  })

  it('[SEC-1047-DIALOG-LINK] a stored file that is no preview is a link to the route without a target (it is downloaded)', () => {
    renderView(STORED, [STAFF, STORED_ANSWER])
    const docx = within(screen.getByRole('dialog')).getByRole('link', { name: 'contract.docx' })
    expect(docx).toHaveAttribute('href', route(`inquiry=${ID}&n=2`))
    expect(docx).not.toHaveAttribute('target')
    expect(docx.parentElement?.textContent).toBe('contract.docx (1 KB)')
  })

  it('[SEC-1047-DIALOG-LINK] a stored file without a name is a link named "Unnamed file"', () => {
    renderView({ ...STORED, attachments: [{ filename: '', size: 18_432, content_type: 'image/png', key: key(0), preview: true }] }, [])
    expect(t.attachment_unnamed).toBe('Unnamed file')
    const unnamed = within(screen.getByRole('dialog')).getByRole('link', { name: t.attachment_unnamed })
    expect(unnamed).toHaveAttribute('href', route(`inquiry=${ID}&n=0`))
    expect(unnamed).toHaveAttribute('target', '_blank')
    expect(unnamed).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('[SEC-1047-DIALOG-LINK] a stored file of a customer\'s answer links with &reply=<id>', () => {
    renderView(STORED, [STAFF, STORED_ANSWER])
    const row = within(screen.getByRole('dialog')).getByText(t.customer_message).closest('.mantine-Paper-root') as HTMLElement
    const card = within(row).getByRole('link', { name: 'id-card.jpg' })
    expect(card).toHaveAttribute('href', route(`inquiry=${ID}&n=0&reply=${REPLY}`))
    expect(card).toHaveAttribute('target', '_blank')
  })

  it('[SEC-1047-DIALOG-LINK] the title reads "Attachments" when every file is stored', () => {
    renderView(STORED, [STAFF, STORED_ANSWER])
    const dialog = screen.getByRole('dialog')
    expect(t.attachments_title).toBe('Attachments')
    expect(within(dialog).getAllByText(t.attachments_title)).toHaveLength(2)
    expect(within(dialog).queryByText(t.attachments_not_kept)).toBeNull()
  })

  it('a row written before the task keeps its plain lines and "Attachments (not kept)"; a row with one file not stored keeps that title too', () => {
    renderView(INQUIRY, [STAFF, INBOUND])
    expect(within(screen.getByRole('dialog')).queryAllByRole('link')).toHaveLength(0)
    cleanup()
    renderView({ ...STORED, attachments: [{ filename: 'photo.png', size: 2048, content_type: 'image/png', key: key(0), preview: true }, { filename: 'old.pdf', size: 1024, content_type: 'application/pdf' }] }, [])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(t.attachments_not_kept)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'photo.png' })).toBeInTheDocument()
    expect(within(dialog).getByText('old.pdf (1 KB)').closest('a')).toBeNull()
  })
})
