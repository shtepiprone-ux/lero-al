// @vitest-environment node
/**
 * Task 988 AC1: the price alert stores the one form of a notification link, a path without a language and without an origin (`/listings/<slug>`), so the bell opens
 * it in the reader's language (`notificationHref`); the e-mail keeps its absolute Albanian address (Albanian-only e-mail policy, Task 251).
 * The real route runs; the database, the e-mail sender and the notification writer are doubles. Every value is synthetic.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sent = vi.hoisted(() => ({ emails: [] as Record<string, unknown>[], notifications: [] as Record<string, unknown>[] }))

/** a query builder that answers every awaited chain with `answer(table, calls)` */
function db(answer: (table: string, calls: string[]) => unknown) {
  return {
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'zz-synth@example.com' } }, error: null }) } },
    from(table: string) {
      const calls: string[] = []
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'order', 'limit', 'gt', 'in', 'neq', 'update', 'upsert']) chain[m] = (...args: unknown[]) => { calls.push(m); void args; return chain }
      chain.then = (resolve: (v: unknown) => unknown) => resolve(answer(table, calls))
      return chain
    },
  }
}

let pages = 0
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => db((table) => {
    if (table === 'favorites') {
      pages++
      return pages === 1 ? { data: [{ id: 'f1', user_id: 'u1', listing_id: 'l1' }], error: null } : { data: [], error: null }
    }
    if (table === 'listings') return { data: [{ id: 'l1', title: 'Apartament', slug: 'zz-synth-apartament', price: 90000, currency: 'EUR' }], error: null }
    if (table === 'favorite_price_alerts') return { data: [{ user_id: 'u1', listing_id: 'l1', last_notified_price: 100000 }], error: null }
    return { data: null, error: null }
  }),
}))
vi.mock('@/modules/notifications/lib/sendTemplatedEmail', () => ({ sendTemplatedEmail: async (args: Record<string, unknown>) => { sent.emails.push(args); return { error: null } } }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async (args: Record<string, unknown>) => { sent.notifications.push(args) } }))

beforeEach(() => {
  pages = 0
  sent.emails = []
  sent.notifications = []
  vi.stubEnv('CRON_SECRET', 'test-secret')
})

describe('price-alerts notification link', () => {
  it('[AC1] the notification stores /listings/<slug> (no language, no origin); the e-mail keeps the absolute sq address', async () => {
    const { GET } = await import('../route')
    const res = await GET(new NextRequest('http://localhost/api/cron/price-alerts', { headers: { authorization: 'Bearer test-secret' } }))
    expect(res.status).toBe(200)
    expect(sent.notifications).toHaveLength(1)
    expect(sent.notifications[0].link).toBe('/listings/zz-synth-apartament')
    expect(sent.emails).toHaveLength(1)
    const listingUrl = (sent.emails[0].variables as Record<string, string>).listingUrl
    expect(listingUrl).toMatch(/^https?:\/\/[^/]+\/sq\/listings\/zz-synth-apartament$/)
  })
})
