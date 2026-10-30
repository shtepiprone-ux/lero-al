// @vitest-environment node
/**
 * Security (Task 923 R70 (h), narrowed by R76): reports are limited per person and the limit fails closed.
 *  - SEC-X-SRV-RATE-REPORT: the REAL reportListingAction runs against an in-memory database. A person who has filed ten reports in the last hour cannot file the
 *    eleventh; a count that cannot be read refuses the report instead of allowing it. Reports older than an hour do not count, and the limit is per person.
 * Identity, the block check, the notification service and the mailer are doubles. Every id is synthetic.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const state = vi.hoisted(() => ({ userId: 'person-1', countFails: false }))

let db = createFakeDb()
const failingCount: unknown = new Proxy(function () {}, {
  get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ count: null, error: { message: 'MARKER-DB-MESSAGE', code: 'XX000' } }) : failingCount),
  apply: () => failingCount,
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (t: string) => {
      const chain = db.client.from(t) as Record<string, (...a: unknown[]) => unknown>
      if (state.countFails && t === 'listing_reports') {
        const select = chain.select.bind(chain)
        chain.select = (cols: unknown, opts?: unknown) => ((opts as { head?: boolean } | undefined)?.head ? failingCount : select(cols, opts))
      }
      return chain
    },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: state.userId }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: state.userId, role: 'user' }) }))
vi.mock('@/lib/auth/permissions', () => ({ hasPermission: async () => false }))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: async () => ({ id: 'x' }) }))
vi.mock('@/modules/notifications/lib/emails/ReporterNotificationEmail', () => ({ ReporterNotificationEmail: () => null, getReporterNotificationEmailStrings: () => ({ subject: 's' }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))

import { reportListingAction } from '../reportListing'

const listingId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

beforeEach(() => {
  db = createFakeDb({ listings: [], listing_reports: [] })
  state.userId = 'person-1'
  state.countFails = false
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('rateLimits', () => {
  it('[SEC-X-SRV-RATE-REPORT] reports are limited', async () => {
    // ten reports in the hour pass, the eleventh does not and is not stored
    for (let i = 1; i <= 10; i++) expect(await reportListingAction(listingId(i), 'spam', ''), `report ${i}`).toEqual({})
    expect(await reportListingAction(listingId(11), 'spam', '')).toEqual({ error: 'rate_limited' })
    expect(db.tables.listing_reports).toHaveLength(10)

    // a count that cannot be read refuses: the report is not stored
    db = createFakeDb({ listings: [], listing_reports: [] })
    state.countFails = true
    const refused = await reportListingAction(listingId(1), 'spam', '')
    expect(refused).toEqual({ error: 'rate_limited' })
    expect(JSON.stringify(refused)).not.toContain('MARKER-DB-MESSAGE')
    expect(db.tables.listing_reports).toEqual([])
  })

  it('reports older than an hour do not count, and another person is not limited by this one (the controls)', async () => {
    db = createFakeDb({ listings: [], listing_reports: Array.from({ length: 10 }, (_, i) => ({ id: `old-${i}`, listing_id: listingId(100 + i), user_id: 'person-1', created_at: minutesAgo(61) })) })
    expect(await reportListingAction(listingId(1), 'fraud', 'x')).toEqual({})
    for (let i = 2; i <= 10; i++) await reportListingAction(listingId(i), 'fraud', '')
    expect(await reportListingAction(listingId(11), 'fraud', '')).toEqual({ error: 'rate_limited' })
    state.userId = 'person-2'
    expect(await reportListingAction(listingId(11), 'fraud', '')).toEqual({})
  })
})
