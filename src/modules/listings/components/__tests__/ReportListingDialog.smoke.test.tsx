/**
 * Guard smoke — ListingReportDialog component dialog-open wiring (Task 442 / Epic RS Slice 3).
 *
 * Covers registry row "Report listing" — dialog-open portion ONLY.
 * The action-level smoke (reportListingAction happy + save_failed) lives in:
 *   src/modules/listings/actions/__tests__/reportListing.smoke.test.ts (Task 436/448)
 *
 * Asserts:
 *   1. Dialog is closed on mount (no dialog content in DOM).
 *   2. Clicking the report button opens the dialog and renders all 6 reason options.
 *   3. Selecting a reason and clicking submit invokes reportListingAction with the
 *      correct (listingId, reason, comment) args.
 *   4. 'already_reported' response → toast.info + dialog closes.
 *
 * ## Mountability: jsdom + RTL
 * The component is 'use client' (React state only — useState, useTransition). No Next.js
 * server context required. All shadcn/ui components, next-intl, the toast adapter, and
 * lucide-react are mocked at the module boundary. The component renders fully in jsdom.
 *
 * ## Mobile gate N/A
 * This slice modifies NO rendered surface — smoke only. The <640 full-width gate does
 * not apply (stated per kickoff contract).
 *
 * Planted-violation proof (see session log for transcript):
 *   Make reportListingAction not called even when reason is selected →
 *   toHaveBeenCalledWith assertion FAILS. Revert → PASS.
 *
 * Command: npx vitest run src/modules/listings/components/__tests__/ReportListingDialog.smoke.test.tsx
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockReportListingAction = vi.fn()
vi.mock('@/modules/listings/actions/reportListing', () => ({
  reportListingAction: (...args: unknown[]) => mockReportListingAction(...args),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const mockToastInfo    = vi.fn()
const mockToastError   = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    info:    (...args: unknown[]) => mockToastInfo(...args),
    error:   (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}))

vi.mock('lucide-react', () => ({
  Flag:    () => React.createElement('span', null, 'flag'),
  Loader2: () => React.createElement('span', null, 'loading'),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: unknown[]) => classes.filter(Boolean).join(' '),
}))

// Shadcn/ui — Dialog renders children only when open=true
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? React.createElement('div', { 'data-testid': 'report-dialog' }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-title' }, children),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({
    onClick, children, disabled, type,
  }: { onClick?: () => void; children?: React.ReactNode; disabled?: boolean; type?: string }) =>
    React.createElement('button', { onClick, disabled, type }, children),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) =>
    React.createElement('label', null, children),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
    React.createElement('textarea', props),
}))

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockReportListingAction.mockResolvedValue({})
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ListingReportDialog — dialog-open smoke (Task 442)', () => {
  it('dialog is closed on mount — no dialog content in DOM', async () => {
    const { ListingReportDialog } = await import('../ListingReportDialog')
    const { container } = render(React.createElement(ListingReportDialog, { listingId: 'l-1' }))

    expect(container.querySelector('[data-testid="report-dialog"]')).toBeNull()
    expect(mockReportListingAction).not.toHaveBeenCalled()
  })

  it('clicking report button opens dialog and renders all 6 reason options', async () => {
    const { ListingReportDialog } = await import('../ListingReportDialog')
    const { container } = render(React.createElement(ListingReportDialog, { listingId: 'l-1' }))

    // Find and click the outer report button (text = "report_listing")
    const reportBtn = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('report_listing'))!
    expect(reportBtn).toBeTruthy()

    await act(async () => { fireEvent.click(reportBtn) })

    // Dialog is now open
    const dialog = container.querySelector('[data-testid="report-dialog"]')
    expect(dialog).not.toBeNull()

    // All 6 reasons must be rendered (translated as key strings by mock t())
    const allText = container.textContent ?? ''
    expect(allText).toContain('report_reason_spam')
    expect(allText).toContain('report_reason_fraud')
    expect(allText).toContain('report_reason_duplicate')
    expect(allText).toContain('report_reason_wrong_category')
    expect(allText).toContain('report_reason_offensive')
    expect(allText).toContain('report_reason_other')
  })

  it('submit: selecting "spam" then submit → reportListingAction(listingId, "spam", "") called', async () => {
    const { ListingReportDialog } = await import('../ListingReportDialog')
    const { container } = render(React.createElement(ListingReportDialog, { listingId: 'listing-xyz' }))

    // Open dialog
    const reportBtn = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('report_listing'))!
    await act(async () => { fireEvent.click(reportBtn) })

    // Click the 'spam' reason button
    const spamBtn = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent === 'report_reason_spam')!
    expect(spamBtn).toBeTruthy()
    await act(async () => { fireEvent.click(spamBtn) })

    // Find and click the submit button (text = 'report_submit')
    const submitBtn = Array.from(container.querySelectorAll('button'))
      .find(btn => btn.textContent?.includes('report_submit'))!
    expect(submitBtn).toBeTruthy()
    await act(async () => { fireEvent.click(submitBtn) })

    // Key wiring assertion: action called with correct args
    expect(mockReportListingAction).toHaveBeenCalledWith('listing-xyz', 'spam', '')
  })

  it('already_reported response → toast.info called + dialog closes', async () => {
    mockReportListingAction.mockResolvedValue({ error: 'already_reported' })

    const { ListingReportDialog } = await import('../ListingReportDialog')
    const { container } = render(React.createElement(ListingReportDialog, { listingId: 'l-2' }))

    // Open dialog
    await act(async () => {
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('report_listing'))!,
      )
    })

    // Select reason + submit
    await act(async () => {
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find(btn => btn.textContent === 'report_reason_fraud')!,
      )
    })
    await act(async () => {
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('report_submit'))!,
      )
    })

    expect(mockToastInfo).toHaveBeenCalledWith('report_already_reported')
    // Dialog closed: no dialog in DOM
    expect(container.querySelector('[data-testid="report-dialog"]')).toBeNull()
  })
})

// ── Task 458: per-branch error toast coverage ──────────────────────────────

describe('ListingReportDialog — per-branch error toasts (Task 458 Fix B)', () => {
  async function submitWithResponse(response: { error?: string } | Error) {
    if (response instanceof Error) {
      mockReportListingAction.mockRejectedValue(response)
    } else {
      mockReportListingAction.mockResolvedValue(response)
    }
    const { ListingReportDialog } = await import('../ListingReportDialog')
    const { container } = render(React.createElement(ListingReportDialog, { listingId: 'l-t' }))

    await act(async () => {
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('report_listing'))!,
      )
    })
    await act(async () => {
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find(btn => btn.textContent === 'report_reason_fraud')!,
      )
    })
    await act(async () => {
      fireEvent.click(
        Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('report_submit'))!,
      )
    })
    return container
  }

  it('unauthorized → report_err_unauthorized toast, NOT the catch-all', async () => {
    await submitWithResponse({ error: 'unauthorized' })
    expect(mockToastError).toHaveBeenCalledWith('report_err_unauthorized')
    expect(mockToastError).not.toHaveBeenCalledWith('report_error')
  })

  it('account_blocked → report_err_restricted toast', async () => {
    await submitWithResponse({ error: 'account_blocked' })
    expect(mockToastError).toHaveBeenCalledWith('report_err_restricted')
  })

  it('account_suspended → report_err_suspended toast (distinct from blocked)', async () => {
    await submitWithResponse({ error: 'account_suspended' })
    expect(mockToastError).toHaveBeenCalledWith('report_err_suspended')
    expect(mockToastError).not.toHaveBeenCalledWith('report_err_restricted')
  })

  it('save_failed → report_err_server toast', async () => {
    await submitWithResponse({ error: 'save_failed' })
    expect(mockToastError).toHaveBeenCalledWith('report_err_server')
  })

  it('transport failure (action throws) → report_err_connection toast', async () => {
    await submitWithResponse(new Error('Fetch failed'))
    expect(mockToastError).toHaveBeenCalledWith('report_err_connection')
  })

  it('success → toast.success + dialog closes (preserved)', async () => {
    const container = await submitWithResponse({})
    expect(mockToastSuccess).toHaveBeenCalledWith('report_success')
    expect(container.querySelector('[data-testid="report-dialog"]')).toBeNull()
  })
})
