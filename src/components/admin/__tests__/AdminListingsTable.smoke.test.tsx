/**
 * AdminListingsTable — RTL smoke test (Task 857; Q4, critical flow "Listing public visibility invariant")
 *
 * Renders the REAL container (`AdminListingsTable` → `AdminListingsView` / `ListingPreviewDialog` →
 * `ListingPreviewDialogView` / `PremiumDialog` → `PremiumDialogView`) on `MantineProvider` + the project theme
 * with the real `en` messages. Only `next/navigation`, `next/link`, the admin server actions and the toast are
 * mocked — there are no `@/components/ui/*` stand-ins.
 *
 *   T1 — `applyAdminListingsVisibility` (the `page.tsx` query step): `visible` → the canonical
 *        `applyPublicVisibility` chain (`eq('status','active')` + `gte('expires_at', …)`), `hidden_eligible` → the
 *        audit predicate, any other value → no call.
 *   T1b — (review 1, R14) the same step calls the canonical helpers themselves, proven by call-through spies on
 *        `@/modules/listings/lib/visibility`: `visible` → `applyPublicVisibility(builder)` once,
 *        `hidden_eligible` + `expired` → `applyPublicEligibleButHidden(builder, { reason: 'expired' })` once,
 *        `bogus` → neither. T1 alone cannot tell the helpers from an inline chain making the same calls.
 *   T2 — choosing `Visible` pushes `visibility=visible&page=1` and keeps `q`.
 *   T3 — typing in search pushes `q` after the 300 ms debounce and drops `page`.
 *   T4 — choosing a status in the dialog's `StatusChangeSelect` calls `updateListingStatus(id, to)` and patches the
 *        row's badge; an error result raises the `status_change_error` toast (Revision 2).
 *   T5 — delete confirm → `deleteListing(id)` and the row is removed; cancel → no call.
 *   T6 — choosing "1 month" and clicking Save calls `setListingPremium(id, true, <ISO ≈ now+30d>)`; `db_missing_column` → the
 *        `premium_error_db_schema` toast.
 *   T8 — (Revision 2, P6) the resting preview footer has exactly one filled button (Edit).
 *   T7 — Open public is absent for a hidden listing and present for a visible one.
 *   T9 — (Revision 8, R57) the page's listings select carries `premium_until` (the dialogs' premium state) and no
 *        longer selects the listing images: the preview dialog shows no listing card.
 *
 * Planted-violation proofs (transcripts in docs/sessions/evidence/task857/):
 *   P1 — `visibilityFilter.ts` maps `'visible'` to nothing → T1 fails.
 *   P2a — (review 1) `visibilityFilter.ts` inlines `.eq('status','active').gte('expires_at', …)` instead of the
 *        helper → T1b fails (T1 stays green).
 *   P6 — (Revision 2) Premium made filled → T8 fails.
 *   P3 — the segmented control's `onChange` omits `page: '1'` → T2 fails.
 *   P4 — `ListingPreviewDialogView` shows Open public for hidden listings → T7 fails.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import messages from '../../../../messages/en.json'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import { applyAdminListingsVisibility } from '@/app/admin/listings/visibilityFilter'
import { AdminListingsTable, type AdminListing } from '../AdminListingsTable'
import AdminListingsPage from '@/app/admin/listings/page'

const mockPush = vi.fn()
let mockSearch = ''
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  usePathname: () => '/admin/listings',
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))

const mockSetListingPremium = vi.fn()
const mockDeleteListing = vi.fn()
const mockUpdateListingStatus = vi.fn()
vi.mock('@/modules/admin/actions', () => ({
  setListingPremium: (...args: unknown[]) => mockSetListingPremium(...args),
  deleteListing: (...args: unknown[]) => mockDeleteListing(...args),
  updateListingStatus: (...args: unknown[]) => mockUpdateListingStatus(...args),
}))

// T9 (Revision 8, R57): the page runs against a chainable stand-in for the admin client that records every select().
const pageSelects = vi.hoisted(() => [] as string[])
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    const builder: unknown = new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ data: [], count: 0 })
          if (prop === 'select') return (columns: string) => { pageSelects.push(columns); return builder }
          return () => builder
        },
      },
    )
    return { from: () => builder, rpc: () => builder }
  },
}))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
vi.mock('@/lib/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}))

// T1b (Task 857 R14, review 1): spies that call through, so the test can tell the canonical helpers from an
// inline `.eq('status','active')` chain that makes the same query calls.
const visibilitySpies = vi.hoisted(() => ({ publicVisibility: vi.fn(), eligibleButHidden: vi.fn() }))
vi.mock('@/modules/listings/lib/visibility', async importActual => {
  const actual = await importActual<typeof import('@/modules/listings/lib/visibility')>()
  return {
    ...actual,
    applyPublicVisibility: (...args: Parameters<typeof actual.applyPublicVisibility>) => {
      visibilitySpies.publicVisibility(...args)
      return actual.applyPublicVisibility(...args)
    },
    applyPublicEligibleButHidden: (...args: Parameters<typeof actual.applyPublicEligibleButHidden>) => {
      visibilitySpies.eligibleButHidden(...args)
      return actual.applyPublicEligibleButHidden(...args)
    },
  }
})

const t = messages.admin.listings
const tsc = messages.admin.common.status_control

beforeEach(() => {
  vi.clearAllMocks()
  mockSearch = ''
  mockSetListingPremium.mockResolvedValue({})
  mockDeleteListing.mockResolvedValue(undefined)
  mockUpdateListingStatus.mockResolvedValue({})
  // The property-type hook falls back to the static constants when the API is unreachable.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
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

afterEach(() => {
  vi.useRealTimers()
})

// Fixture data (labelled): one publicly visible premium listing, one hidden (pending) listing.
const FUTURE = new Date(Date.now() + 30 * 86400000).toISOString()
const ACTIVE_LISTING: AdminListing = {
  id: 'lst-active',
  public_id: 1001,
  title: 'Sunny apartment in the centre',
  status: 'active',
  is_premium: true,
  listing_type: 'sale',
  property_type: 'apartment',
  price: 95000,
  currency: 'EUR',
  slug: 'sunny-apartment-1001',
  created_at: '2026-09-20T09:00:00Z',
  expires_at: FUTURE,
  owner: { name: 'Arben Krasniqi' },
}
const PENDING_LISTING: AdminListing = {
  ...ACTIVE_LISTING,
  id: 'lst-pending',
  public_id: 1002,
  title: 'Quiet house with a garden',
  status: 'pending',
  is_premium: false,
  slug: 'quiet-house-1002',
  expires_at: null,
}

function renderTable(listings: AdminListing[] = [ACTIVE_LISTING, PENDING_LISTING]) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminListingsTable
          listings={listings}
          total={listings.length}
          page={1}
          perPage={25}
          activeStatus=""
          searchQuery=""
          activeTab="all"
          activeVisibility=""
          activeReason=""
          auditCounts={{ total: 2, expired: 1, noExpiry: 1 }}
        />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

async function openPreview(title: string) {
  fireEvent.click(screen.getAllByText(title)[0])
  return screen.findByRole('dialog')
}

// ── T1 — the page.tsx query step ──────────────────────────────────────────────

describe('applyAdminListingsVisibility — page.tsx visibility filter (T1)', () => {
  function capture() {
    const calls: unknown[][] = []
    const q: Record<string, unknown> = {}
    for (const method of ['eq', 'in', 'gte', 'or', 'lt', 'is']) {
      q[method] = (...args: unknown[]) => {
        calls.push([method, ...args])
        return q
      }
    }
    return { q: q as never, calls }
  }

  it("'visible' applies the canonical public-visibility chain (status active + unexpired)", () => {
    const { q, calls } = capture()
    applyAdminListingsVisibility(q, 'visible', '')
    expect(calls).toContainEqual(['eq', 'status', 'active'])
    expect(calls.some(c => c[0] === 'gte' && c[1] === 'expires_at')).toBe(true)
  })

  it("'hidden_eligible' applies the audit predicate, narrowed by reason", () => {
    const { q, calls } = capture()
    applyAdminListingsVisibility(q, 'hidden_eligible', 'no_expiry')
    expect(calls).toContainEqual(['is', 'expires_at', null])
    expect(calls.some(c => c[0] === 'gte')).toBe(false)
  })

  it("an unknown visibility value is ignored (no query call)", () => {
    const { q, calls } = capture()
    applyAdminListingsVisibility(q, 'bogus', '')
    expect(calls).toHaveLength(0)
  })
})

// ── T1b — the canonical helpers are the ones called (R14) ──────────────────────

describe('applyAdminListingsVisibility — routes through the canonical helpers (T1b)', () => {
  function builder() {
    const q: Record<string, unknown> = {}
    for (const method of ['eq', 'in', 'gte', 'or', 'lt', 'is']) q[method] = () => q
    return q as never
  }

  beforeEach(() => {
    visibilitySpies.publicVisibility.mockClear()
    visibilitySpies.eligibleButHidden.mockClear()
  })

  it("'visible' calls applyPublicVisibility once with the builder, not applyPublicEligibleButHidden", () => {
    const q = builder()
    applyAdminListingsVisibility(q, 'visible', '')
    expect(visibilitySpies.publicVisibility).toHaveBeenCalledTimes(1)
    expect(visibilitySpies.publicVisibility).toHaveBeenCalledWith(q)
    expect(visibilitySpies.eligibleButHidden).not.toHaveBeenCalled()
  })

  it("'hidden_eligible' + 'expired' calls applyPublicEligibleButHidden(builder, { reason: 'expired' }) once", () => {
    const q = builder()
    applyAdminListingsVisibility(q, 'hidden_eligible', 'expired')
    expect(visibilitySpies.eligibleButHidden).toHaveBeenCalledTimes(1)
    expect(visibilitySpies.eligibleButHidden).toHaveBeenCalledWith(q, { reason: 'expired' })
    expect(visibilitySpies.publicVisibility).not.toHaveBeenCalled()
  })

  it("'bogus' calls neither helper", () => {
    applyAdminListingsVisibility(builder(), 'bogus', '')
    expect(visibilitySpies.publicVisibility).not.toHaveBeenCalled()
    expect(visibilitySpies.eligibleButHidden).not.toHaveBeenCalled()
  })
})

// ── T2 — visibility segment navigation ────────────────────────────────────────

describe('AdminListingsTable — visibility filter (T2)', () => {
  it('choosing Visible pushes visibility=visible&page=1 and keeps q', () => {
    mockSearch = 'q=villa&page=3'
    renderTable()
    fireEvent.click(screen.getByRole('radio', { name: t.visibility_visible }))
    expect(mockPush).toHaveBeenCalledTimes(1)
    const url = String(mockPush.mock.calls[0][0])
    expect(url).toContain('visibility=visible')
    expect(url).toContain('page=1')
    expect(url).not.toContain('page=3')
    expect(url).toContain('q=villa')
  })
})

// ── T3 — debounced search ─────────────────────────────────────────────────────

describe('AdminListingsTable — search (T3)', () => {
  it('typing pushes q after the 300 ms debounce and drops page', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    mockSearch = 'status=pending&page=2'
    renderTable()
    const input = screen.getByPlaceholderText(t.search_placeholder)
    fireEvent.change(input, { target: { value: 'villa' } })
    expect(mockPush).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(300) })
    expect(mockPush).toHaveBeenCalledTimes(1)
    const url = String(mockPush.mock.calls[0][0])
    expect(url).toContain('q=villa')
    expect(url).toContain('status=pending')
    expect(url).not.toContain('page=')
  })
})

// ── T4 — status action ────────────────────────────────────────────────────────

describe('ListingPreviewDialog — status select (T4)', () => {
  const soldLabel = getListingStatusLabel('sold', k => (messages.cabinet as unknown as Record<string, string>)[k])

  async function chooseSold() {
    const dialog = screen.getByRole('dialog')
    await act(async () => { fireEvent.click(within(dialog).getByRole('textbox', { name: t.col_status })) })
    await act(async () => { fireEvent.click(await screen.findByRole('option', { name: soldLabel })) })
  }

  it('choosing Sold in the StatusChangeSelect calls updateListingStatus(id, sold), toasts and patches the row badge', async () => {
    renderTable([ACTIVE_LISTING])
    await openPreview(ACTIVE_LISTING.title)
    const list = () => within(screen.getByTestId('admin-table'))
    expect(list().queryAllByText(soldLabel)).toHaveLength(0)

    await chooseSold()

    expect(mockUpdateListingStatus).toHaveBeenCalledWith('lst-active', 'sold')
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith(tsc.status_change_success))
    await waitFor(() => expect(list().queryAllByText(soldLabel).length).toBeGreaterThan(0))
    // Revision 9 (R64): the dialog's controlled select shows the new status too, because the table patches
    // `previewListing.status` (a parent that skips this leaves the select on the old status after the toast).
    const dialogSelect = within(screen.getByRole('dialog')).getByRole('textbox', { name: t.col_status }) as HTMLInputElement
    await waitFor(() => expect(dialogSelect.value).toBe(soldLabel))
  })

  it('a failed update toasts status_change_error and leaves the row unchanged', async () => {
    mockUpdateListingStatus.mockResolvedValue({ error: 'forbidden' })
    renderTable([ACTIVE_LISTING])
    await openPreview(ACTIVE_LISTING.title)
    await chooseSold()
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(tsc.status_change_error))
    expect(mockToastSuccess).not.toHaveBeenCalled()
    expect(within(screen.getByTestId('admin-table')).queryAllByText(soldLabel)).toHaveLength(0)
  })
})

// ── T5 — delete ───────────────────────────────────────────────────────────────

describe('ListingPreviewDialog — delete (T5)', () => {
  it('confirm calls deleteListing(id) and removes the row', async () => {
    renderTable()
    await openPreview(ACTIVE_LISTING.title)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText(t.delete_confirm)).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Delete' })) })
    expect(mockDeleteListing).toHaveBeenCalledWith('lst-active')
    expect(mockToastSuccess).toHaveBeenCalledWith(t.delete_success)
    await waitFor(() => expect(screen.queryAllByText(ACTIVE_LISTING.title)).toHaveLength(0))
    expect(screen.queryAllByText(PENDING_LISTING.title).length).toBeGreaterThan(0)
  })

  it('cancel makes no call', async () => {
    renderTable()
    await openPreview(ACTIVE_LISTING.title)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await screen.findByText(t.delete_confirm)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockDeleteListing).not.toHaveBeenCalled()
    expect(screen.queryByText(t.delete_confirm)).toBeNull()
  })
})

// ── T6 — premium ──────────────────────────────────────────────────────────────

describe('PremiumDialog — presets (T6)', () => {
  async function openPremium() {
    renderTable([ACTIVE_LISTING])
    await openPreview(ACTIVE_LISTING.title)
    // Revision 7: premium opens from the "Manage premium" navigation row (§23.7), not a footer button.
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.premium_manage) }))
    return screen.findByText(t.premium_quick_label)
  }

  it('choosing 1 month and clicking Save calls setListingPremium(id, true, ISO ≈ now+30d) and toasts; the preset alone calls nothing', async () => {
    await openPremium()
    const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.click(screen.getByRole('radio', { name: t.preset_1m }))
    expect(mockSetListingPremium).not.toHaveBeenCalled()
    expect(save.disabled).toBe(false)

    const before = Date.now()
    await act(async () => { fireEvent.click(save) })
    expect(mockSetListingPremium).toHaveBeenCalledTimes(1)
    const [id, premium, until] = mockSetListingPremium.mock.calls[0] as [string, boolean, string]
    expect(id).toBe('lst-active')
    expect(premium).toBe(true)
    const expected = before + 30 * 86400000
    expect(Math.abs(new Date(until).getTime() - expected)).toBeLessThan(60_000)
    expect(mockToastSuccess).toHaveBeenCalledWith(t.premium_success)
  })

  it('db_missing_column maps to the premium_error_db_schema toast', async () => {
    mockSetListingPremium.mockResolvedValue({ error: 'db_missing_column' })
    await openPremium()
    fireEvent.click(screen.getByRole('radio', { name: t.preset_1m }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save' })) })
    expect(mockToastError).toHaveBeenCalledWith(t.premium_error_db_schema)
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })
})

// ── T7 — Open public ──────────────────────────────────────────────────────────

describe('ListingPreviewDialog — Open public (T7)', () => {
  it('is absent for a hidden (pending) listing', async () => {
    renderTable()
    await openPreview(PENDING_LISTING.title)
    expect(screen.getByText(t.btn_view)).toBeTruthy()
    expect(screen.queryByText(t.btn_open_public)).toBeNull()
  })

  it('is present for a publicly visible listing', async () => {
    renderTable()
    await openPreview(ACTIVE_LISTING.title)
    expect(screen.getByText(t.btn_open_public)).toBeTruthy()
  })
})

// ── T8 — one primary action (§23.6) ───────────────────────────────────────────

describe('ListingPreviewDialog — action hierarchy (T8)', () => {
  it('the resting footer has exactly one filled button, and it is Edit', async () => {
    renderTable()
    await openPreview(ACTIVE_LISTING.title)
    const dialog = screen.getByRole('dialog')
    // Mantine's default (filled) variant renders no `data-variant`; every other variant sets it.
    const filled = dialog.querySelectorAll('.mantine-Button-root:not([data-variant])')
    expect(filled).toHaveLength(1)
    expect(filled[0].textContent).toBe('Edit')
  })
})

// ── T9 — the page's select: premium_until yes, listing images no (Revision 8, R57) ─

describe('AdminListingsPage — listing summary columns (T9)', () => {
  it('selects premium_until for the dialogs and does not select listing_images', async () => {
    pageSelects.length = 0
    await AdminListingsPage({ searchParams: Promise.resolve({}) })
    const rows = pageSelects.find(columns => columns.includes('owner:users'))
    expect(rows).toBeDefined()
    expect(rows).toContain('premium_until')
    expect(rows).not.toContain('listing_images')
  })
})
