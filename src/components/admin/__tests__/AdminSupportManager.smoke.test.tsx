/**
 * AdminSupportManager — RTL smoke test (Task 859; no prior test existed for this surface)
 *
 * Renders the REAL container (`AdminSupportManager` → `AdminSupportView` / `TicketDetailDialog` /
 * `CreateTicketDialog` / `UserPickerField` and their Views) on `MantineProvider` + the project theme with the
 * real `en` messages. Only the server actions, the toast and `next/navigation` are mocked.
 *
 *   T3 — the ADM-06 landing shows the "active" status and "unassigned", only those rows; picking the `open`
 *        status calls `router.replace` with `status=open` and keeps `assigned`.
 *   T4 — the stat cards count every loaded ticket whatever the filter.
 *   T5 — a status update calls `updateTicketStatus(id, 'resolved', note)` and the timeline shows localized
 *        labels, never the raw `in_progress`.
 *   T6 — creating a support ticket with an empty subject shows `subject_required` and makes no call.
 *   T7 — a complaint whose reporter and reported are the same user disables Create and shows the warning.
 *   T8 — the picker searches once after the 300 ms debounce for a 2-char query, and not for 1 char.
 *   T11 — typing a query runs the search, choosing a result gives the picker's `onChange` the user, and Create sends
 *        that user's id.
 *   T9 — in the detail dialog the footer primary is disabled while the chosen status equals the ticket's, and
 *        enabled once another status card is chosen.
 *   T10 — the status filter is a combobox with the 6 options (all, active, the 4 statuses), not a checkbox group.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task859/):
 *   P1 — `parseSupportFilters` ignores `assigned`          → T1 (supportFilters.test.ts) and T3 fail.
 *   P2 — filter changes stop calling `router.replace`      → T3 fails.
 *   P3 — the timeline View prints `ev.old_status` raw      → T5 fails.
 *   P5 — the detail footer primary ignores `newStatus === ticket.status` → T9 fails.
 *   P6 — the status control is a `Checkbox.Group` again   → T10 fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { unassignedSupportHref } from '@/modules/admin/dashboard/hrefs'
import { parseSupportFilters } from '../supportFilters'
import { AdminSupportManager, type SupportTicketRow, type PickerUser } from '../AdminSupportManager'

const mockUpdateTicketStatus = vi.fn()
const mockCreateSupportTicket = vi.fn()
const mockSearchUsersForPicker = vi.fn()
vi.mock('@/modules/admin/actions', () => ({
  updateTicketStatus: (...args: unknown[]) => mockUpdateTicketStatus(...args),
  createSupportTicket: (...args: unknown[]) => mockCreateSupportTicket(...args),
  searchUsersForPicker: (...args: unknown[]) => mockSearchUsersForPicker(...args),
}))

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const mockRouterReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: mockRouterReplace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/support',
  useSearchParams: () => new URLSearchParams(),
}))

const t = messages.admin.support
const tp = messages.admin.pages

beforeEach(() => {
  vi.clearAllMocks()
  mockUpdateTicketStatus.mockResolvedValue({})
  mockCreateSupportTicket.mockResolvedValue({ id: 'new-1' })
  mockSearchUsersForPicker.mockResolvedValue([])
  // jsdom has no layout: Mantine's Combobox scrolls the active option into view.
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

afterEach(() => {
  vi.useRealTimers()
})

// Fixture data (labelled): five tickets covering every filter branch.
const BASE: SupportTicketRow = {
  id: 'tk-a',
  subject: 'Alpha open unassigned',
  status: 'open',
  ticket_type: 'support',
  complaint_type: null,
  reason: null,
  assigned_to: null,
  created_at: '2026-06-18T00:00:00Z',
  updated_at: '2026-06-18T00:00:00Z',
  reporter: { id: 'u-1', name: 'Reporter One' },
  reported: null,
  created_by_admin: null,
}
const TICKETS: SupportTicketRow[] = [
  BASE,
  { ...BASE, id: 'tk-b', subject: 'Bravo progress unassigned', status: 'in_progress' },
  { ...BASE, id: 'tk-c', subject: 'Charlie open assigned', assigned_to: 'staff-1' },
  { ...BASE, id: 'tk-d', subject: 'Delta resolved unassigned', status: 'resolved' },
  { ...BASE, id: 'tk-e', subject: 'Echo progress assigned', status: 'in_progress', assigned_to: 'staff-1' },
]

const PICKED: PickerUser = {
  id: 'a1a1a1a1-0000-0000-0000-000000000001',
  name: 'Agim',
  last_name: 'Krasniqi',
  phone: null,
  role: 'agent',
  status: 'active',
  company_name: null,
}

function adm06Filters() {
  const query = unassignedSupportHref().split('?')[1]
  return parseSupportFilters(Object.fromEntries(new URLSearchParams(query).entries()))
}

function renderManager(initialFilters = adm06Filters()) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminSupportManager tickets={TICKETS} events={[]} initialFilters={initialFilters} />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('tbody tr'))

async function chooseOption(label: string, option: string) {
  await act(async () => { fireEvent.click(screen.getAllByLabelText(label)[0]) })
  await act(async () => { fireEvent.click(await screen.findByRole('option', { name: option })) })
}

async function openCreateAs(type: string) {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: t.new_ticket_btn })) })
  await screen.findByRole('dialog')
  await chooseOption(t.ticket_type_label, type)
}

async function pickUser(input: HTMLElement) {
  await act(async () => { fireEvent.change(input, { target: { value: 'ag' } }) })
  const result = await screen.findByRole('option', { name: /Agim Krasniqi/ }, { timeout: 2000 })
  await act(async () => { fireEvent.click(result) })
}

describe('AdminSupportManager — URL filters and stats (Task 859)', () => {
  it('T3: the ADM-06 landing shows only unassigned open / in-progress rows and writes the filter back', async () => {
    const { container } = renderManager()

    const shown = rows(container).map(r => r.textContent ?? '')
    expect(shown).toHaveLength(2)
    expect(shown[0]).toContain('Alpha open unassigned')
    expect(shown[1]).toContain('Bravo progress unassigned')
    expect(shown.join(' ')).not.toContain('Charlie')
    expect(shown.join(' ')).not.toContain('Delta')

    expect((screen.getAllByLabelText(t.col_status)[0] as HTMLInputElement).value).toBe(t.filter_active)

    await chooseOption(t.col_status, t.support_status_open)

    expect(mockRouterReplace).toHaveBeenCalledTimes(1)
    const [url] = mockRouterReplace.mock.calls[0]
    const params = new URLSearchParams(String(url).split('?')[1])
    expect(params.get('status')).toBe('open')
    expect(params.get('assigned')).toBe('unassigned')
    expect(rows(container)).toHaveLength(1)
  })

  it('T10: the status filter is a combobox with the six options', async () => {
    renderManager()
    const control = screen.getAllByLabelText(t.col_status)[0]
    expect(control.getAttribute('aria-haspopup')).toBe('listbox')
    await act(async () => { fireEvent.click(control) })
    const names = (await screen.findAllByRole('option')).map(o => o.textContent)
    expect(names).toEqual([
      t.filter_all_status,
      t.filter_active,
      t.support_status_open,
      t.support_status_in_progress,
      t.support_status_resolved,
      t.support_status_closed,
    ])
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  it('T4: the stat cards count every loaded ticket whatever the filter', () => {
    renderManager()
    // Loaded: open 2 (a, c), in progress 2 (b, e), resolved + closed 1 (d).
    const valueOf = (label: string) =>
      Array.from(document.querySelectorAll('.mantine-Card-root')).find(c => c.textContent?.includes(label))?.textContent ?? ''
    expect(valueOf(tp.support_open)).toContain('2')
    expect(valueOf(tp.support_in_progress)).toContain('2')
    expect(valueOf(tp.support_resolved)).toContain('1')
  })
})

describe('AdminSupportManager — detail dialog (Task 859)', () => {
  it('T5: a status update calls updateTicketStatus and the timeline shows localized labels', async () => {
    const { container } = renderManager()

    await act(async () => { fireEvent.click(rows(container)[1]) }) // Bravo, in_progress
    const dialog = await screen.findByRole('dialog')

    await act(async () => { fireEvent.click(within(dialog).getByRole('radio', { name: t.support_status_resolved })) })
    await act(async () => {
      fireEvent.change(within(dialog).getByPlaceholderText(t.note_placeholder), { target: { value: 'done' } })
    })
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: t.update_status_btn })) })

    await waitFor(() => expect(mockUpdateTicketStatus).toHaveBeenCalledWith('tk-b', 'resolved', 'done'))
    await waitFor(() => {
      const text = screen.getByRole('dialog').textContent ?? ''
      expect(text).toContain(`${t.support_status_in_progress} → ${t.support_status_resolved}`)
      expect(text).not.toContain('in_progress')
    })
  })
})

describe('AdminSupportManager — detail dialog footer (Task 859 R13)', () => {
  it('T9: the primary is disabled until another status card is chosen', async () => {
    const { container } = renderManager()
    await act(async () => { fireEvent.click(rows(container)[1]) }) // Bravo, in_progress
    const dialog = await screen.findByRole('dialog')
    const primary = () => within(dialog).getByRole('button', { name: t.update_status_btn }) as HTMLButtonElement

    expect(primary().disabled).toBe(true)
    await act(async () => { fireEvent.click(within(dialog).getByRole('radio', { name: t.support_status_resolved })) })
    expect(primary().disabled).toBe(false)
    await act(async () => { fireEvent.click(within(dialog).getByRole('radio', { name: t.support_status_in_progress })) })
    expect(primary().disabled).toBe(true)
  })
})

describe('AdminSupportManager — create dialog (Task 859)', () => {
  it('T6: an empty subject shows subject_required and makes no call', async () => {
    renderManager()
    await openCreateAs(t.type_support)

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t.create_btn })) })

    expect(await screen.findByText(t.subject_required)).toBeTruthy()
    expect(mockCreateSupportTicket).not.toHaveBeenCalled()
  })

  it('T7: a complaint with the same reporter and reported disables Create and shows the warning', async () => {
    mockSearchUsersForPicker.mockResolvedValue([PICKED])
    renderManager()
    await openCreateAs(t.type_user_complaint)

    await pickUser(screen.getByLabelText(t.reporter_label))
    await pickUser(screen.getByLabelText(t.reported_label))

    expect(await screen.findByText(t.same_user_warning)).toBeTruthy()
    expect((screen.getByRole('button', { name: t.create_btn }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('AdminSupportManager — user picker (Task 859)', () => {
  it('T11: a query runs the search, a chosen result becomes the value, and Create sends its id', async () => {
    mockSearchUsersForPicker.mockResolvedValue([PICKED])
    renderManager()
    await openCreateAs(t.type_support)

    const input = screen.getByLabelText(t.requester_label) as HTMLInputElement
    await pickUser(input)

    expect(mockSearchUsersForPicker).toHaveBeenCalledWith('ag')
    await waitFor(() => expect((screen.getByLabelText(t.requester_label) as HTMLInputElement).value).toBe('Agim Krasniqi'))

    await act(async () => { fireEvent.change(screen.getByPlaceholderText(t.support_subject_placeholder), { target: { value: 'Subject text' } }) })
    await act(async () => { fireEvent.change(screen.getByPlaceholderText(t.support_details_placeholder), { target: { value: 'Details text' } }) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t.create_btn })) })

    await waitFor(() => expect(mockCreateSupportTicket).toHaveBeenCalledTimes(1))
    expect(mockCreateSupportTicket).toHaveBeenCalledWith(expect.objectContaining({ requesterUserId: PICKED.id, subject: 'Subject text' }))
  })


  it('T8: searches once after the debounce for 2 characters and not for 1', async () => {
    renderManager()
    await openCreateAs(t.type_support)
    vi.useFakeTimers()
    const input = screen.getByLabelText(t.requester_label)

    await act(async () => { fireEvent.change(input, { target: { value: 'a' } }) })
    await act(async () => { vi.advanceTimersByTime(500) })
    expect(mockSearchUsersForPicker).not.toHaveBeenCalled()

    await act(async () => { fireEvent.change(input, { target: { value: 'ag' } }) })
    await act(async () => { vi.advanceTimersByTime(299) })
    expect(mockSearchUsersForPicker).not.toHaveBeenCalled()
    await act(async () => { vi.advanceTimersByTime(1) })
    expect(mockSearchUsersForPicker).toHaveBeenCalledTimes(1)
    expect(mockSearchUsersForPicker).toHaveBeenCalledWith('ag')
  })
})
