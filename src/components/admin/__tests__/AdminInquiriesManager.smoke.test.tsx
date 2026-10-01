/**
 * AdminInquiriesManager — RTL smoke test (Task 894; no prior test existed)
 *
 * Renders the REAL container (`AdminInquiriesManager` → `AdminInquiriesView` / `InquiryDetailDialogView` →
 * `StatusChangeSelect`) on `MantineProvider` + the project theme with the real `en` messages. Only the
 * contact server actions and the toast are mocked — there are no `@/components/ui/*` stand-ins.
 *
 *   T1 — the `closed` segment shows only closed fixture rows.
 *   T2 — a reply of 4 characters keeps Send disabled; 5+ calls `sendInquiryReply(id, body)`.
 *   T3 — picking `closed` in `StatusChangeSelect` calls `updateInquiryStatus(id, 'closed')` and fires
 *        `status_change_success`; a rejected call fires `status_change_error`.
 *   T4 — `{ error: 'reply_email_failed', reply }` appends the reply, bumps the count, turns `new` into
 *        `in_progress` and fires `toast.warning`.
 *   T5 — `reply_count > 0` with no loaded replies shows `reply_history_load_failed`.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task894/):
 *   P1 — the Send threshold becomes `< 4` → T2 fails.
 *   P2 — `StatusChangeSelect` stops catching a rejected `onSubmit` → T3 (error toast) fails.
 *   P3 — the container patches `status` on `reply_email_failed` without the `new → in_progress` rule → T4 fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { AdminInquiriesManager, type InquiryRow, type ReplyRow } from '../AdminInquiriesManager'

const mockUpdateInquiryStatus = vi.fn()
const mockSendInquiryReply = vi.fn()
vi.mock('@/modules/contacts/actions', () => ({
  updateInquiryStatus: (...args: unknown[]) => mockUpdateInquiryStatus(...args),
  sendInquiryReply: (...args: unknown[]) => mockSendInquiryReply(...args),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockToastWarning = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args),
  },
}))

const t = messages.admin.inquiries
const tsc = messages.admin.common.status_control

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateInquiryStatus.mockResolvedValue({})
  mockSendInquiryReply.mockResolvedValue({})
  // jsdom has no scrollIntoView; Mantine's Combobox calls it on the selected option.
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

// Fixture data (labelled): one inquiry per status.
const NEW_INQUIRY: InquiryRow = {
  id: 'inq-new',
  created_at: '2026-09-28T10:30:00Z',
  topic: 'sales',
  custom_subject: null,
  name: 'Blerina Hoxha',
  email: 'blerina@example.com',
  message: 'First line\nSecond line',
  target_mailbox: 'sales@lero.al',
  status: 'new',
  reply_count: 0,
  handled_at: null,
}
const PROGRESS_INQUIRY: InquiryRow = {
  ...NEW_INQUIRY,
  id: 'inq-progress',
  topic: 'other',
  custom_subject: 'Invoice question',
  status: 'in_progress',
  reply_count: 2,
}
const CLOSED_INQUIRY: InquiryRow = {
  ...NEW_INQUIRY,
  id: 'inq-closed',
  topic: 'partnership',
  status: 'closed',
  reply_count: 1,
}
const INQUIRIES = [NEW_INQUIRY, PROGRESS_INQUIRY, CLOSED_INQUIRY]

function renderManager(inquiries: InquiryRow[] = INQUIRIES, replies: ReplyRow[] = []) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminInquiriesManager inquiries={inquiries} replies={replies} mailboxScope="sales" />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

const rows = () => screen.getAllByTestId('inquiry-row')

async function openRow(index: number) {
  await act(async () => { fireEvent.click(rows()[index]) })
  return screen.findByRole('dialog', { name: t.detail_title })
}

async function typeReply(dialog: HTMLElement, value: string) {
  const box = within(dialog).getByPlaceholderText(t.reply_placeholder)
  await act(async () => { fireEvent.change(box, { target: { value } }) })
}

describe('AdminInquiriesManager — Task 894', () => {
  it('T1 — the closed segment shows only closed fixture rows', async () => {
    renderManager()
    expect(rows().length).toBe(3)

    await act(async () => { fireEvent.click(screen.getByRole('radio', { name: t.filter_closed })) })

    expect(rows().length).toBe(1)
    expect(within(rows()[0]).getByText(t.status_closed)).toBeTruthy()
  })

  it('T2 — a 4-character reply keeps Send disabled; 5+ calls sendInquiryReply(id, body)', async () => {
    renderManager()
    const dialog = await openRow(0)
    const send = within(dialog).getByRole('button', { name: t.send_reply }) as HTMLButtonElement

    await typeReply(dialog, 'abcd')
    expect(send.disabled).toBe(true)

    await typeReply(dialog, 'abcde')
    expect(send.disabled).toBe(false)

    await act(async () => { fireEvent.click(send) })
    expect(mockSendInquiryReply).toHaveBeenCalledWith('inq-new', 'abcde')
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(t.reply_success))
  })

  it('T3 — picking closed calls updateInquiryStatus(id, closed) and fires status_change_success; a rejection fires status_change_error', async () => {
    renderManager()
    const dialog = await openRow(0)

    const select = within(dialog).getByRole('textbox', { name: t.change_status })
    await act(async () => { fireEvent.click(select) })
    await act(async () => { fireEvent.click(await screen.findByRole('option', { name: tsc.status_closed })) })

    expect(mockUpdateInquiryStatus).toHaveBeenCalledWith('inq-new', 'closed')
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(tsc.status_change_success))
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('T3 — a rejected updateInquiryStatus fires status_change_error and no success toast', async () => {
    mockUpdateInquiryStatus.mockRejectedValue(new Error('boom'))
    renderManager()
    const dialog = await openRow(0)

    const select = within(dialog).getByRole('textbox', { name: t.change_status })
    await act(async () => { fireEvent.click(select) })
    await act(async () => { fireEvent.click(await screen.findByRole('option', { name: tsc.status_closed })) })

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(tsc.status_change_error))
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('T4 — reply_email_failed appends the reply, bumps the count, turns new into in_progress and warns', async () => {
    const reply: ReplyRow = {
      id: 'rep-new',
      inquiry_id: 'inq-new',
      body: 'Stored but not mailed',
      created_at: '2026-09-29T09:00:00Z',
      replied_by: 'u-admin',
      replier: { name: 'Elira Dervishi' },
    }
    mockSendInquiryReply.mockResolvedValue({ error: 'reply_email_failed', reply })
    renderManager()
    const dialog = await openRow(0)

    await typeReply(dialog, 'Stored but not mailed')
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: t.send_reply })) })

    expect(mockToastWarning).toHaveBeenCalledWith(t.reply_email_failed)
    expect(mockToastSuccess).not.toHaveBeenCalled()
    await waitFor(() => expect(within(dialog).getByText('Stored but not mailed')).toBeTruthy())
    expect((within(dialog).getByRole('textbox', { name: t.change_status }) as HTMLInputElement).value).toBe(tsc.status_in_progress)
    expect(within(rows()[0]).getByTestId('inquiry-reply-count').textContent).toBe('1')
    expect(within(rows()[0]).getByText(t.status_in_progress)).toBeTruthy()
  })

  it('T5 — reply_count > 0 with no loaded replies shows reply_history_load_failed', async () => {
    renderManager([PROGRESS_INQUIRY], [])
    const dialog = await openRow(0)

    expect(within(dialog).getByText(t.reply_history_load_failed)).toBeTruthy()
  })
})
