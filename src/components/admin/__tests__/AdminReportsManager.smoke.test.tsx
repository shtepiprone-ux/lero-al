/**
 * AdminReportsManager — RTL smoke test (migrated by Task 858; originals Task 461/462/463)
 *
 * Renders the REAL container (`AdminReportsManager` → `AdminReportsView` / `ReportDetailDialog` →
 * `ReportDetailDialogView`) on `MantineProvider` + the project theme with the real `en` messages. Only the
 * server actions, the toast and `next/navigation` are mocked — there are no `@/components/ui/*` stand-ins.
 *
 * The 11 original assertions keep their names and expectations:
 *   owner row ×4 · capability controls ×5 (caps true, caps false, delete confirm, cancel, Esc) · forbidden toasts ×2.
 * Task 858 adds the URL filter:
 *   T1 — `initialFilter="resolved"` shows only resolved rows with the Resolved tab selected.
 *   T2 — clicking the Reviewed tab calls `router.replace` with `status=reviewed` and keeps another param.
 *   T3 — `parseReportStatusParam` maps bogus / undefined / array values to `pending`, each valid value to itself.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task858/):
 *   P1 — the container ignores `initialFilter` → T1 fails.
 *   P2 — a tab change uses `setFilter` only → T2 fails.
 *   P3 — the View renders Delete without `canDeleteReports` → "both caps false → no status Select, no Reopen, no Delete" fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import type { ReportStatusFilter } from '../reportStatusFilter'
import { parseReportStatusParam } from '../reportStatusFilter'
import { AdminReportsManager, type ReportRow } from '../AdminReportsManager'

const mockUpdateReportStatus = vi.fn()
const mockDeleteReport = vi.fn()
vi.mock('@/modules/listings/actions/reportListing', () => ({
  updateReportStatusAction: (...args: unknown[]) => mockUpdateReportStatus(...args),
  deleteReportAction: (...args: unknown[]) => mockDeleteReport(...args),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

const mockRouterRefresh = vi.fn()
const mockRouterReplace = vi.fn()
let mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh, push: vi.fn(), replace: mockRouterReplace, back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/reports',
  useSearchParams: () => mockSearchParams,
}))

const t = messages.admin.reports
const tc = messages.common

beforeEach(() => {
  vi.clearAllMocks()
  mockSearchParams = new URLSearchParams()
  mockUpdateReportStatus.mockResolvedValue({})
  mockDeleteReport.mockResolvedValue({})
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

// Fixture data (labelled).
const BASE_REPORT: ReportRow = {
  id: 'r-1',
  listing_id: 'l-1',
  user_id: 'u-reporter',
  reason: 'fraud',
  comment: 'suspicious',
  status: 'pending',
  created_at: '2026-06-18T00:00:00Z',
  listing: {
    id: 'l-1',
    title: 'Test Listing',
    slug: 'test-listing',
    owner: { id: 'u-owner', name: 'Owner Person', user_type: 'agent' },
  },
  reporter: { id: 'u-reporter', name: 'Reporter Person' },
}

interface ManagerProps {
  reports: ReportRow[]
  canOverrideReportStatus?: boolean
  canDeleteReports?: boolean
  initialFilter?: ReportStatusFilter
}

function renderManager({ reports, canOverrideReportStatus = false, canDeleteReports = false, initialFilter }: ManagerProps) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminReportsManager
          reports={reports}
          locale="uk"
          canOverrideReportStatus={canOverrideReportStatus}
          canDeleteReports={canDeleteReports}
          initialFilter={initialFilter}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

const rows = (container: HTMLElement) => container.querySelectorAll('tbody tr')

async function openFirstRow(container: HTMLElement) {
  await act(async () => { fireEvent.click(rows(container)[0]) })
  return screen.findByRole('dialog', { name: t.detail_title })
}

async function clickTab(name: RegExp) {
  await act(async () => { fireEvent.click(screen.getByRole('tab', { name })) })
}

describe('AdminReportsManager — owner row smoke (Task 461 + Task 462 badge removal)', () => {
  it('owner present → shows owner name + profile link, no badge/profile_types text', async () => {
    const { container } = renderManager({ reports: [BASE_REPORT] })

    expect(rows(container).length).toBeGreaterThan(0)
    const dialog = await openFirstRow(container)
    const text = dialog.textContent ?? ''

    expect(text).toContain('Owner Person')
    expect(text).toContain(t.col_owner)
    expect(text).toContain(t.open_profile)

    const profileLink = within(dialog).getByRole('link', { name: t.open_profile })
    expect(profileLink.getAttribute('href')).toBe('/admin/users/u-owner')

    // Task 462: no profile_types raw key anywhere in the dialog
    expect(text).not.toMatch(/profile_types/)

    // Reporter row still distinct
    expect(text).toContain('Reporter Person')
    expect(text).toContain(t.col_reporter)
  })

  it('owner with unknown user_type → no crash, no raw key, profile link present', async () => {
    const report: ReportRow = {
      ...BASE_REPORT,
      listing: {
        id: 'l-1',
        title: 'Test Listing',
        slug: 'test-listing',
        owner: { id: 'u-owner', name: 'Mystery User', user_type: 'bogus_value' },
      },
    }
    const { container } = renderManager({ reports: [report] })

    const dialog = await openFirstRow(container)

    // No raw profile_types key for any user_type
    expect(dialog.textContent).not.toMatch(/profile_types/)

    const profileLink = within(dialog).getByRole('link', { name: t.open_profile })
    expect(profileLink.getAttribute('href')).toBe('/admin/users/u-owner')
  })

  it('owner null (deleted) → shows owner_not_found fallback, no profile link', async () => {
    const report: ReportRow = {
      ...BASE_REPORT,
      listing: { id: 'l-1', title: 'Test', slug: 'test', owner: null },
    }
    const { container } = renderManager({ reports: [report] })

    const dialog = await openFirstRow(container)

    expect(dialog.textContent).toContain(t.owner_not_found)
    expect(within(dialog).queryByRole('link', { name: t.open_profile })).toBeNull()
  })

  it('listing null → shows owner fallback, no crash', async () => {
    const report: ReportRow = { ...BASE_REPORT, listing: null }
    const { container } = renderManager({ reports: [report] })

    const dialog = await openFirstRow(container)
    expect(dialog.textContent).toContain(t.owner_not_found)
  })
})

// ── Task 463 — capability-driven control visibility + delete confirm ────────

const RESOLVED_REPORT: ReportRow = { ...BASE_REPORT, status: 'resolved' as const }

describe('AdminReportsManager — Task 463 capability controls', () => {
  it('both caps true → status Select + Reopen + Delete render', async () => {
    const { container } = renderManager({
      reports: [RESOLVED_REPORT],
      canOverrideReportStatus: true,
      canDeleteReports: true,
    })

    await clickTab(/^Resolved/)
    const dialog = await openFirstRow(container)

    expect(within(dialog).queryByTestId('status-override-section')).toBeTruthy()
    expect(within(dialog).queryByTestId('reopen-btn')).toBeTruthy()
    expect(within(dialog).queryByTestId('delete-btn')).toBeTruthy()
  })

  it('both caps false → no status Select, no Reopen, no Delete', async () => {
    const { container } = renderManager({
      reports: [RESOLVED_REPORT],
      canOverrideReportStatus: false,
      canDeleteReports: false,
    })

    await clickTab(/^Resolved/)
    const dialog = await openFirstRow(container)

    expect(within(dialog).queryByTestId('status-override-section')).toBeFalsy()
    expect(within(dialog).queryByTestId('reopen-btn')).toBeFalsy()
    expect(within(dialog).queryByTestId('delete-btn')).toBeFalsy()
  })

  it('delete confirm dialog gates delete; confirm removes report from list without full reload', async () => {
    const { container } = renderManager({ reports: [BASE_REPORT], canDeleteReports: true })

    const dialog = await openFirstRow(container)

    const deleteBtn = within(dialog).getByTestId('delete-btn')
    expect(deleteBtn).toBeTruthy()
    await act(async () => { fireEvent.click(deleteBtn) })

    await screen.findByTestId('delete-confirm-dialog')
    const confirmModal = await screen.findByRole('dialog', { name: t.confirm_delete_title })
    const confirmBtn = within(confirmModal).getByTestId('confirm-delete-btn')
    expect(confirmBtn).toBeTruthy()
    await act(async () => { fireEvent.click(confirmBtn) })

    expect(mockDeleteReport).toHaveBeenCalledWith('r-1')

    // No full reload — router.refresh (next/navigation mock) NOT called
    expect(mockRouterRefresh).not.toHaveBeenCalled()

    // Report removed from list via local state
    await waitFor(() => expect(rows(container).length).toBe(0))
  })

  it('delete confirm cancel → report still present', async () => {
    const { container } = renderManager({ reports: [BASE_REPORT], canDeleteReports: true })

    const dialog = await openFirstRow(container)
    await act(async () => { fireEvent.click(within(dialog).getByTestId('delete-btn')) })

    await screen.findByTestId('delete-confirm-dialog')
    const confirmModal = await screen.findByRole('dialog', { name: t.confirm_delete_title })
    await act(async () => { fireEvent.click(within(confirmModal).getByRole('button', { name: tc.cancel })) })

    await waitFor(() => expect(screen.queryByTestId('delete-confirm-dialog')).toBeNull())
    expect(mockDeleteReport).not.toHaveBeenCalled()
    expect(rows(container).length).toBe(1)
  })

  it('delete confirm Esc / backdrop close → report still present, no delete', async () => {
    const { container } = renderManager({ reports: [BASE_REPORT], canDeleteReports: true })

    const dialog = await openFirstRow(container)
    await act(async () => { fireEvent.click(within(dialog).getByTestId('delete-btn')) })

    const confirmDialog = await screen.findByTestId('delete-confirm-dialog')
    // Mantine closes the modal on Escape from inside its content.
    await act(async () => { fireEvent.keyDown(confirmDialog, { key: 'Escape' }) })

    await waitFor(() => expect(screen.queryByTestId('delete-confirm-dialog')).toBeNull())
    expect(mockDeleteReport).not.toHaveBeenCalled()
    expect(rows(container).length).toBe(1)
  })

  // R13: typed error toasts — status update forbidden → error_forbidden
  it('status update forbidden → error_forbidden toast', async () => {
    mockUpdateReportStatus.mockResolvedValue({ error: 'forbidden' })
    const { container } = renderManager({ reports: [BASE_REPORT] })

    const dialog = await openFirstRow(container)

    // Click the resolve quick-action button (calls handleAction('resolved'))
    await act(async () => { fireEvent.click(within(dialog).getByRole('button', { name: t.action_resolve })) })

    expect(mockToastError).toHaveBeenCalledWith(t.error_forbidden)
  })

  // R13: typed error toasts — delete forbidden → error_forbidden
  it('delete forbidden → error_forbidden toast', async () => {
    mockDeleteReport.mockResolvedValue({ error: 'forbidden' })
    const { container } = renderManager({ reports: [BASE_REPORT], canDeleteReports: true })

    const dialog = await openFirstRow(container)
    await act(async () => { fireEvent.click(within(dialog).getByTestId('delete-btn')) })

    await screen.findByTestId('delete-confirm-dialog')
    const confirmModal = await screen.findByRole('dialog', { name: t.confirm_delete_title })
    await act(async () => { fireEvent.click(within(confirmModal).getByTestId('confirm-delete-btn')) })

    expect(mockToastError).toHaveBeenCalledWith(t.error_forbidden)
  })
})

// ── Task 858 — `?status=` URL filter (T1–T3) ────────────────────────────────

describe('AdminReportsManager — Task 858 URL filter', () => {
  const PENDING: ReportRow = { ...BASE_REPORT, id: 'r-pending' }
  const RESOLVED: ReportRow = { ...BASE_REPORT, id: 'r-resolved', status: 'resolved' }

  it('T1 — initialFilter="resolved" shows only resolved rows with the Resolved tab selected', () => {
    const { container } = renderManager({ reports: [PENDING, RESOLVED], initialFilter: 'resolved' })

    expect(screen.getByRole('tab', { name: /^Resolved/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: /^Pending/ }).getAttribute('aria-selected')).toBe('false')
    expect(rows(container).length).toBe(1)
    expect(within(rows(container)[0] as HTMLElement).getByText(t.status_resolved)).toBeTruthy()
  })

  it('T2 — clicking the Reviewed tab calls router.replace with status=reviewed and keeps other params', async () => {
    mockSearchParams = new URLSearchParams('foo=bar&status=pending')
    renderManager({ reports: [PENDING, RESOLVED] })

    await clickTab(/^Reviewed/)

    expect(mockRouterReplace).toHaveBeenCalledTimes(1)
    const [url, options] = mockRouterReplace.mock.calls[0]
    const parsed = new URL(url as string, 'http://localhost')
    expect(parsed.pathname).toBe('/admin/reports')
    expect(parsed.searchParams.get('status')).toBe('reviewed')
    expect(parsed.searchParams.get('foo')).toBe('bar')
    expect(options).toEqual({ scroll: false })
  })

  it('T3 — parseReportStatusParam: unknown / missing / array → pending, each valid value → itself', () => {
    expect(parseReportStatusParam('bogus')).toBe('pending')
    expect(parseReportStatusParam(undefined)).toBe('pending')
    expect(parseReportStatusParam(['a', 'b'])).toBe('pending')
    expect(parseReportStatusParam(['resolved', 'all'])).toBe('pending')
    for (const v of ['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const) {
      expect(parseReportStatusParam(v)).toBe(v)
    }
  })
})
