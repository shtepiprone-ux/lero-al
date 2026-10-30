/**
 * Stacked delete confirmations — RTL test (Task 859 Revision 4, R42; owner decision D78-18, WAI-ARIA modal dialog).
 *
 * `MantineDeleteConfirmModal` opens over a live detail dialog in two Views. What lies under a modal is hidden from
 * assistive technology (`covered`, `aria-hidden` + `inert`), so with the confirm open exactly one dialog is exposed and
 * it is the confirm. Both Views are rendered for real on `MantineProvider` + the project theme with the `en` messages.
 *
 * Planted-violation proof (transcript `docs/sessions/evidence/task859/r4-plants.txt`):
 *   P7 — `ReportDetailDialogView` without `covered` → the report test fails (two dialogs are exposed).
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import type { ReportRow } from '../AdminReportsManager'
import type { AdminListing } from '../AdminListingsTable'
import { ReportDetailDialogView } from '../ReportDetailDialogView'
import { ListingPreviewDialogView } from '../ListingPreviewDialogView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  )
})

// Fixture data (labelled).
const REPORT: ReportRow = {
  id: 'r-1',
  listing_id: 'l-1',
  user_id: 'u-reporter',
  reason: 'fraud',
  comment: 'suspicious',
  status: 'pending',
  created_at: '2026-06-18T00:00:00Z',
  listing: { id: 'l-1', title: 'Test Listing', slug: 'test-listing', owner: { id: 'u-owner', name: 'Owner Person', user_type: 'agent' } },
  reporter: { id: 'u-reporter', name: 'Reporter Person' },
}
const LISTING: AdminListing = {
  id: 'lst-1',
  public_id: 1001,
  title: 'Sunny apartment in the centre',
  status: 'active',
  is_premium: false,
  listing_type: 'sale',
  property_type: 'apartment',
  price: 95000,
  currency: 'EUR',
  slug: 'sunny-apartment-1001',
  created_at: '2026-09-20T09:00:00Z',
  expires_at: null,
  owner: { name: 'Arben Krasniqi' },
}

const noop = () => {}
const wrap = (node: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <MantineProvider theme={theme} env="test">{node}</MantineProvider>
  </NextIntlClientProvider>
)

describe('a delete confirmation stacked over a detail dialog exposes one dialog', () => {
  it('ReportDetailDialogView: only the confirm is exposed while it is open', async () => {
    render(wrap(
      <ReportDetailDialogView
        report={REPORT}
        locale="en"
        canOverrideReportStatus={false}
        canDeleteReports
        isPending={false}
        notes=""
        onNotesChange={noop}
        selectedStatus="pending"
        onSelectedStatusChange={noop}
        showDeleteConfirm
        onAction={noop}
        onRequestDelete={noop}
        onCancelDelete={noop}
        onConfirmDelete={noop}
        onClose={noop}
      />,
    ))
    const dialogs = await screen.findAllByRole('dialog')
    expect(dialogs).toHaveLength(1)
    expect(dialogs[0]).toHaveTextContent(messages.admin.reports.confirm_delete_title)
  })

  it('ListingPreviewDialogView: only the confirm is exposed while it is open', async () => {
    render(wrap(
      <ListingPreviewDialogView
        listing={LISTING}
        typeLabel="Sale · Apartment"
        statusOptions={[{ code: 'active', label: 'Active', labelKey: 'active' }]}
        onStatusChange={noop}
        showDeleteConfirm
        deleting={false}
        onShowDeleteConfirm={noop}
        onDelete={noop}
        onPremium={noop}
        onClose={noop}
      />,
    ))
    const dialogs = await screen.findAllByRole('dialog')
    expect(dialogs).toHaveLength(1)
    expect(dialogs[0]).toHaveTextContent(messages.admin.listings.delete_confirm)
  })
})
