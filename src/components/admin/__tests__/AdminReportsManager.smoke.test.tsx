import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import type { ReportRow } from '../AdminReportsManager'

const mockUpdateReportStatus = vi.fn()
vi.mock('@/modules/listings/actions/reportListing', () => ({
  updateReportStatusAction: (...args: unknown[]) => mockUpdateReportStatus(...args),
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
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? React.createElement('div', { 'data-testid': 'report-dialog' }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ onClick, children, disabled }: { onClick?: () => void; children?: React.ReactNode; disabled?: boolean }) =>
    React.createElement('button', { onClick, disabled }, children),
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

beforeEach(() => { vi.clearAllMocks(); mockUpdateReportStatus.mockResolvedValue({}) })

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

describe('AdminReportsManager — owner row smoke (Task 461)', () => {
  it('owner present → shows owner name, account-type badge, and profile link with correct href', async () => {
    const { AdminReportsManager } = await import('../AdminReportsManager')
    const { container } = render(
      React.createElement(AdminReportsManager, { reports: [BASE_REPORT], locale: 'uk' }),
    )

    // Click the data row (skip the thead tr)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    await act(async () => { fireEvent.click(rows[0]) })

    const dialog = container.querySelector('[data-testid="report-dialog"]')
    expect(dialog).not.toBeNull()
    const text = dialog!.textContent ?? ''

    expect(text).toContain('Owner Person')
    expect(text).toContain('col_owner')
    expect(text).toContain('open_profile')

    // Profile link points to the OWNER id, not the reporter
    const profileLink = Array.from(dialog!.querySelectorAll('a')).find(
      a => a.textContent?.includes('open_profile'),
    )
    expect(profileLink).toBeTruthy()
    expect(profileLink!.getAttribute('href')).toBe('/admin/users/u-owner')

    // Account-type badge label rendered via the key-returning mock
    expect(text).toContain('profile_types.agent')

    // Reporter row still shows the reporter (distinct)
    expect(text).toContain('Reporter Person')
    expect(text).toContain('col_reporter')
  })

  it('owner with null/unknown user_type → no crash, falls back to private label, profile link present', async () => {
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
      React.createElement(AdminReportsManager, { reports: [report], locale: 'uk' }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!
    const text = dialog.textContent ?? ''

    // Falls back to 'private' label, not 'bogus_value'
    expect(text).toContain('profile_types.private')
    expect(text).not.toContain('profile_types.bogus_value')

    // Profile link still present
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
      React.createElement(AdminReportsManager, { reports: [report], locale: 'uk' }),
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
      React.createElement(AdminReportsManager, { reports: [report], locale: 'uk' }),
    )

    await act(async () => { fireEvent.click(container.querySelectorAll('tbody tr')[0]) })
    const dialog = container.querySelector('[data-testid="report-dialog"]')!
    expect(dialog.textContent).toContain('owner_not_found')
  })
})
