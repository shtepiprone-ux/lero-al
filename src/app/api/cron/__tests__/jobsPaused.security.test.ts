// @vitest-environment node
/**
 * Security (Task 923 R77 (c) (d), owner decisions D56 / D58): until the two lifecycle tasks ship, no job deactivates, deletes or expires anything.
 *  - SEC-X-SRV-JOBS-PAUSED: the REAL inactivity job and the REAL listing expiry job run against a recording database and mailer. An account absent 13 months and an active
 *    listing past `expires_at` are only COUNTED: no `users`, `listings`, `user_status_history` or Auth write, no listing transition, no final e-mail.
 * Every id is synthetic.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  writes: [] as string[],
  emails: [] as string[],
  transitions: 0,
}))

const DAY = 24 * 60 * 60 * 1000

/** a chain that answers the two kinds of read the jobs make, and records every write call */
function chain(table: string): unknown {
  const target: Record<string, unknown> = {}
  const proxy: unknown = new Proxy(target, {
    get: (_t, key: string) => {
      if (['insert', 'update', 'delete', 'upsert'].includes(key)) return () => { state.writes.push(`${table}.${key}`); return proxy }
      if (key === 'then') {
        return (resolve: (v: unknown) => void) => {
          if (table === 'users') return resolve({ data: [{ id: 'absent-13-months' }], error: null })
          if (table === 'listings') return resolve({ data: [{ id: 'lapsed-listing' }], error: null, count: 0 })
          return resolve({ data: [], error: null })
        }
      }
      return () => proxy
    },
  })
  return proxy
}

vi.mock('@/lib/cron/verifyCronRequest', () => ({ verifyCronRequest: () => ({ ok: true }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => chain(table),
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'person@example.com' } }, error: null }), updateUserById: async () => { state.writes.push('auth.updateUserById'); return {} }, deleteUser: async () => { state.writes.push('auth.deleteUser'); return {} } } },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: async (a: { to: string; subject: string }) => { state.emails.push(a.subject); return { id: 'e' } } }))
vi.mock('@/modules/notifications/lib/emails/InactivityWarningEmail', () => ({ InactivityWarningEmail: () => null, getInactivityWarningEmailStrings: () => ({ subject: 'warning' }) }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => { state.transitions++; return { ok: true } }, applyListingTransition: async () => { state.transitions++; return { ok: true } } }))

import { POST as inactivity } from '../inactivity/route'
import { POST as expiry } from '../listings-expiry/route'

beforeEach(() => {
  state.writes = []
  state.emails = []
  state.transitions = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  void DAY
})

describe('jobsPaused', () => {
  it('[SEC-X-SRV-JOBS-PAUSED] the 12-month step and the expiry only count', async () => {
    const inactive = await inactivity(new NextRequest('https://lero.al/api/cron/inactivity?dryRun=1', { method: 'POST' }))
    const real = await inactivity(new NextRequest('https://lero.al/api/cron/inactivity', { method: 'POST' }))
    const expired = await expiry(new NextRequest('https://lero.al/api/cron/listings-expiry', { method: 'POST' }))
    expect(inactive.status).toBe(200)
    expect(real.status).toBe(200)
    expect(expired.status).toBe(200)
    // counts only
    expect(await inactive.json()).toMatchObject({ wouldDeactivate: 1, deactivated: 0 })
    expect(await real.json()).toMatchObject({ wouldDeactivate: 1, deactivated: 0 })
    expect(await expired.json()).toMatchObject({ would_expire: 1, expired: 0 })
    // no user, listing, history or Auth write, no listing transition, and no e-mail for the 12-month step or for the expiry: the real run's only possible write is
    // the 3-month reminder mark, and the double returns the same 13-month account for it (it is excluded from the reminder window by its date in the real database)
    expect(state.writes.filter((w) => !w.startsWith('users.update'))).toEqual([])
    expect(state.transitions).toBe(0)
    expect(state.emails.filter((s) => s !== 'warning')).toEqual([])
  })
})
