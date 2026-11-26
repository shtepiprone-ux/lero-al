// @vitest-environment node
/**
 * Task 953 (purity): the staff preview page compares the listing's creation time with the clock to decide the "new" badge. The clock is read outside the render
 * body now; the badge must flip at the same instant as before, and the staff check stays in front of every read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb, type Row } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({ staffChecks: 0, viewer: { ok: true, role: 'admin' } as { ok: boolean; role?: string; reason?: string } }))

let db = createFakeDb()
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => db.from(t) }) }))
vi.mock('@/lib/auth/staff', () => ({ requireStaffPage: async () => { state.staffChecks += 1 } }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => state.viewer }))
vi.mock('@/lib/admin/getAdminLocale', () => ({ getAdminLocale: async () => 'en' }))
vi.mock('next/navigation', () => ({
  notFound: () => { throw new Error('NEXT_NOT_FOUND') },
  redirect: (to: string) => { throw new Error(`REDIRECT ${to}`) },
}))
vi.mock('@/modules/listings/components/ListingDetailView', () => ({ ListingDetailView: () => null }))

import AdminListingPreviewPage from '../page'

const DAY = 86_400_000
const NOW = Date.parse('2026-06-15T12:00:00.000Z')

function seed(createdAt: number, status = 'active'): void {
  const created = new Date(createdAt).toISOString()
  const listing: Row = {
    id: 'l1', slug: 'flat', status, user_id: 'owner-1', title: 'Flat', price: 1000, currency: 'EUR', price_old: null, area_gross: null, created_at: created, updated_at: created,
    listing_type: 'sale', property_type: 'apartment', images: [], location: null,
  }
  db = createFakeDb({ listings: [listing], public_user_profiles: [{ id: 'owner-1', name: 'Owner' }] })
}

async function props(): Promise<Record<string, unknown>> {
  const element = await AdminListingPreviewPage({ params: Promise.resolve({ id: 'l1' }) }) as unknown as { props: Record<string, unknown> }
  return element.props
}

beforeEach(() => {
  state.staffChecks = 0
  state.viewer = { ok: true, role: 'admin' }
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => { vi.useRealTimers() })

describe('admin listing preview: the new-listing window follows the clock', () => {
  it('a listing created inside the last seven days is new, an older one is not', async () => {
    seed(NOW - 2 * DAY)
    expect((await props()).isNew).toBe(true)
    seed(NOW - 7 * DAY + 1)
    expect((await props()).isNew).toBe(true)
    seed(NOW - 7 * DAY)
    expect((await props()).isNew).toBe(false)
    seed(NOW - 30 * DAY)
    expect((await props()).isNew).toBe(false)
  })

  it('the same listing stops being new when the clock moves past the window', async () => {
    const createdAt = NOW - DAY
    seed(createdAt)
    expect((await props()).isNew).toBe(true)
    vi.setSystemTime(createdAt + 7 * DAY + DAY)
    expect((await props()).isNew).toBe(false)
  })

  it('keeps the preview flags: staff preview, the staff check ran, and a hidden status shows the unpublished banner', async () => {
    seed(NOW - DAY, 'inactive')
    const rendered = await props()
    expect(state.staffChecks).toBe(1)
    expect(rendered.isStaffPreview).toBe(true)
    expect(rendered.previewBanner).toBe('unpublished')
  })

  it('refuses a viewer who is not staff', async () => {
    seed(NOW - DAY)
    state.viewer = { ok: true, role: 'user' }
    await expect(props()).rejects.toThrow('REDIRECT /en')
  })
})
