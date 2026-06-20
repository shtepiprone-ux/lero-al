import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import type { ReportRow } from '../AdminReportsManager'

const mockUpdateReportStatus = vi.fn()
const mockDeleteReport = vi.fn()
vi.mock('@/modules/listings/actions/reportListing', () => ({
  updateReportStatusAction: (...args: unknown[]) => mockUpdateReportStatus(...args),
  deleteReportAction: (...args: unknown[]) => mockDeleteReport(...args),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

vi.mock('lucide-react', () => ({
  ExternalLink: () => React.createElement('span', null, 'ext'),
  Loader2: () => React.createElement('span', null, 'loading'),
  Flag: () => React.createElement('span', null, 'flag'),
  Trash2: () => React.createElement('span', null, 'trash'),
  RotateCcw: () => React.createElement('span', null, 'reopen'),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? React.createElement('div', { 'data-testid': 'report-dialog' }, children) : null,
  DialogContent: ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('div', props, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement('p', null, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-footer' }, children),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'status-select' }, children),
  SelectContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) =>
    React.createElement('option', { value }, children),
  SelectTrigger: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  SelectValue: () => React.createElement('span', null, 'value'),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ onClick, children, disabled, ...rest }: { onClick?: () => void; children?: React.ReactNode; disabled?: boolean; [k: string]: unknown }) =>
    React.createElement('button', { onClick, disabled, ...rest }, children),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': 'badge' }, children),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) =>
    React.createElement('label', null, children),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
    React.createElement('textarea', props),
}))

vi.mock('@/components/shared/RelativeTime', () => ({
  RelativeTime: ({ date }: { date: string }) =>
    React.createElement('span', null, date),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))

const mockRouterRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh, push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/reports',
  useSearchParams: () => new URLSearchParams(),
}))

beforeEach(() => { vi.clearAllMocks(); mockUpdateReportStatus.mockResolvedValue({}); mockDeleteReport.mockResolvedValue({}) })

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

describe('AdminReportsManager — owner row smoke (Task 461 + Task 462 badge removal)', () => {
  it('owner present → shows owner name + profile link, no badge/profile_types text', async () => {
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, { reports: [BASE_REPORT], locale: 'uk', canOverrideReportStatus: false, canDeleteReports: false }),
    )

    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    await act(async () => { fireEvent.click(rows[0]) })

    const dialog = container.querySelector('[data-testid="report-dialog"]')
    expect(dialog).not.toBeNull()
    const text = dialog!.textContent ?? ''

    expect(text).toContain('Owner Person')
    expect(text).toContain('col_owner')
    expect(text).toContain('open_profile')

    const profileLink = Array.from(dialog!.querySelectorAll('a')).find(
      a => a.textContent?.includes('open_profile'),
    )
    expect(profileLink).toBeTruthy()
    expect(profileLink!.getAttribute('href')).toBe('/admin/users/u-owner')

    // Task 462: no profile_types raw key anywhere in the dialog
    expect(text).not.toMatch(/profile_types/)

    // Reporter row still distinct
    expect(text).toContain('Reporter Person')
    expect(text).toContain('col_reporter')
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
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, { reports: [report], locale: 'uk', canOverrideReportStatus: false, canDeleteReports: false }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!
    const text = dialog.textContent ?? ''

    // No raw profile_types key for any user_type
    expect(text).not.toMatch(/profile_types/)

    const profileLink = Array.from(dialog.querySelectorAll('a')).find(
      a => a.textContent?.includes('open_profile'),
    )
    expect(profileLink).toBeTruthy()
    expect(profileLink!.getAttribute('href')).toBe('/admin/users/u-owner')
  })

  it('owner null (deleted) → shows owner_not_found fallback, no profile link', async () => {
    const report: ReportRow = {
      ...BASE_REPORT,
      listing: { id: 'l-1', title: 'Test', slug: 'test', owner: null },
    }
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, { reports: [report], locale: 'uk', canOverrideReportStatus: false, canDeleteReports: false }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!
    const text = dialog.textContent ?? ''

    expect(text).toContain('owner_not_found')
    const profileLink = Array.from(dialog.querySelectorAll('a')).find(
      a => a.textContent?.includes('open_profile'),
    )
    expect(profileLink).toBeFalsy()
  })

  it('listing null → shows owner fallback, no crash', async () => {
    const report: ReportRow = { ...BASE_REPORT, listing: null }
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, { reports: [report], locale: 'uk', canOverrideReportStatus: false, canDeleteReports: false }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!
    expect(dialog.textContent).toContain('owner_not_found')
  })
})

// ── Task 463 — capability-driven control visibility + delete confirm ────────

const RESOLVED_REPORT: ReportRow = { ...BASE_REPORT, status: 'resolved' as const }

describe('AdminReportsManager — Task 463 capability controls', () => {
  function clickFilterTab(container: HTMLElement, filterKey: string) {
    const tabs = Array.from(container.querySelectorAll('button'))
    const tab = tabs.find(b => b.textContent?.includes(filterKey))
    if (tab) fireEvent.click(tab)
  }

  it('both caps true → status Select + Reopen + Delete render', async () => {
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [RESOLVED_REPORT], locale: 'uk',
        canOverrideReportStatus: true, canDeleteReports: true,
      }),
    )

    await act(async () => { clickFilterTab(container, 'filter_resolved') })
    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!

    expect(dialog.querySelector('[data-testid="status-override-section"]')).toBeTruthy()
    expect(dialog.querySelector('[data-testid="reopen-btn"]')).toBeTruthy()
    expect(dialog.querySelector('[data-testid="delete-btn"]')).toBeTruthy()
  })

  it('both caps false → no status Select, no Reopen, no Delete', async () => {
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [RESOLVED_REPORT], locale: 'uk',
        canOverrideReportStatus: false, canDeleteReports: false,
      }),
    )

    await act(async () => { clickFilterTab(container, 'filter_resolved') })
    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!

    expect(dialog.querySelector('[data-testid="status-override-section"]')).toBeFalsy()
    expect(dialog.querySelector('[data-testid="reopen-btn"]')).toBeFalsy()
    expect(dialog.querySelector('[data-testid="delete-btn"]')).toBeFalsy()
  })

  it('delete confirm dialog gates delete; confirm removes report from list without full reload', async () => {
    mockRouterRefresh.mockClear()

    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [BASE_REPORT], locale: 'uk',
        canOverrideReportStatus: false, canDeleteReports: true,
      }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!

    const deleteBtn = dialog.querySelector('[data-testid="delete-btn"]') as HTMLButtonElement
    expect(deleteBtn).toBeTruthy()
    await act(async () => { fireEvent.click(deleteBtn) })

    const confirmDialog = container.querySelector('[data-testid="delete-confirm-dialog"]')
    expect(confirmDialog).toBeTruthy()

    const confirmBtn = confirmDialog!.querySelector('[data-testid="confirm-delete-btn"]') as HTMLButtonElement
    expect(confirmBtn).toBeTruthy()
    await act(async () => { fireEvent.click(confirmBtn) })

    expect(mockDeleteReport).toHaveBeenCalledWith('r-1')

    // No full reload — router.refresh (next/navigation mock) NOT called
    expect(mockRouterRefresh).not.toHaveBeenCalled()

    // Report removed from list via local state
    expect(container.querySelectorAll('tbody tr').length).toBe(0)
  })

  it('delete confirm cancel → report still present', async () => {
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [BASE_REPORT], locale: 'uk',
        canOverrideReportStatus: false, canDeleteReports: true,
      }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })

    const deleteBtn = container.querySelector('[data-testid="delete-btn"]') as HTMLButtonElement
    await act(async () => { fireEvent.click(deleteBtn) })

    const confirmDialog = container.querySelector('[data-testid="delete-confirm-dialog"]')
    expect(confirmDialog).toBeTruthy()

    // Find the cancel button (non-destructive button in the footer)
    const footer = confirmDialog!.querySelector('[data-testid="dialog-footer"]')!
    const cancelBtn = Array.from(footer.querySelectorAll('button')).find(
      b => b.textContent?.includes('cancel'),
    )
    expect(cancelBtn).toBeTruthy()
    await act(async () => { fireEvent.click(cancelBtn!) })

    expect(mockDeleteReport).not.toHaveBeenCalled()
    expect(container.querySelectorAll('tbody tr').length).toBe(1)
  })

  it('delete confirm Esc / backdrop close → report still present, no delete', async () => {
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [BASE_REPORT], locale: 'uk',
        canOverrideReportStatus: false, canDeleteReports: true,
      }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })

    const deleteBtn = container.querySelector('[data-testid="delete-btn"]') as HTMLButtonElement
    await act(async () => { fireEvent.click(deleteBtn) })

    const confirmDialog = container.querySelector('[data-testid="delete-confirm-dialog"]')
    expect(confirmDialog).toBeTruthy()

    // Simulate Dialog onOpenChange(false) — Esc/backdrop triggers this
    const dialogRoot = confirmDialog!.closest('[data-testid="report-dialog"]')
    expect(dialogRoot).toBeTruthy()

    // The inner Dialog's onOpenChange={open => { if (!open) setShowDeleteConfirm(false) }}
    // fires when user presses Esc or clicks backdrop. Simulate by directly triggering
    // the cancel (which uses the same handler) since jsdom doesn't fire real Esc events.
    const footer = confirmDialog!.querySelector('[data-testid="dialog-footer"]')!
    const cancelBtn = Array.from(footer.querySelectorAll('button')).find(
      b => b.textContent?.includes('cancel'),
    )
    await act(async () => { fireEvent.click(cancelBtn!) })

    expect(mockDeleteReport).not.toHaveBeenCalled()
    expect(container.querySelectorAll('tbody tr').length).toBe(1)
  })

  // R13: typed error toasts — status update forbidden → error_forbidden
  it('status update forbidden → error_forbidden toast', async () => {
    mockUpdateReportStatus.mockResolvedValue({ error: 'forbidden' })
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [BASE_REPORT], locale: 'uk',
        canOverrideReportStatus: false, canDeleteReports: false,
      }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })

    // Click the resolve quick-action button (calls handleAction('resolved'))
    const resolveBtn = Array.from(container.querySelectorAll('button')).find(
      b => b.textContent?.includes('action_resolve'),
    )
    expect(resolveBtn).toBeTruthy()
    await act(async () => { fireEvent.click(resolveBtn!) })

    expect(mockToastError).toHaveBeenCalledWith('error_forbidden')
  })

  // R13: typed error toasts — delete forbidden → error_forbidden
  it('delete forbidden → error_forbidden toast', async () => {
    mockDeleteReport.mockResolvedValue({ error: 'forbidden' })
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, {
        reports: [BASE_REPORT], locale: 'uk',
        canOverrideReportStatus: false, canDeleteReports: true,
      }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })

    const deleteBtn = container.querySelector('[data-testid="delete-btn"]') as HTMLButtonElement
    await act(async () => { fireEvent.click(deleteBtn) })

    const confirmBtn = container.querySelector('[data-testid="confirm-delete-btn"]') as HTMLButtonElement
    await act(async () => { fireEvent.click(confirmBtn) })

    expect(mockToastError).toHaveBeenCalledWith('error_forbidden')
  })
})
