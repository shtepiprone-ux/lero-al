/**
 * The status gateway after owner decision D8 (2026-10-17): only an administrator / moderator publishes. The REAL gateway runs; the database is a recording
 * double (it states what it supports: one select of the listing, one update of it) and the notification and cache calls are explicit observers, so a refusal
 * is proven by the returned reason AND by the absence of every write and side effect. The real-database control is ownerPublish.integration.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ListingStatus } from '@/types/database'

const notify = vi.hoisted(() => vi.fn())
const revalidateTag = vi.hoisted(() => vi.fn())
const updateTag = vi.hoisted(() => vi.fn())
const revalidatePath = vi.hoisted(() => vi.fn())
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: (...args: unknown[]) => notify(...args) }))
vi.mock('next/cache', () => ({ updateTag: (...a: unknown[]) => updateTag(...a), revalidateTag: (...a: unknown[]) => revalidateTag(...a), revalidatePath: (...a: unknown[]) => revalidatePath(...a) }))

import { applyListingTransitionByStatus, type TransitionActorContext } from './applyListingTransition'

type Db = NonNullable<Parameters<typeof applyListingTransitionByStatus>[3]>
interface Row { id: string; status: ListingStatus; slug: string; title: string; user_id: string }

/** Recording double of the one table the gateway touches. Anything else fails loudly. */
function makeDb(row: Row | null, updateFails = false) {
  const updates: Array<Record<string, unknown>> = []
  const db = {
    from(table: string) {
      if (table !== 'listings') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: row, error: row ? null : { message: 'not found' } }) }) }),
        // the write is a compare-and-set (Task 923 R67 (e)): `.eq('id')`, `.eq('status')`, then `.select('id')` for the rows it changed
        update: (payload: Record<string, unknown>) => {
          const chain = {
            eq: () => chain,
            select: async () => { updates.push(payload); return updateFails ? { data: null, error: { message: 'write refused' } } : { data: [{ id: row?.id }], error: null } },
          }
          return chain
        },
      }
    },
  }
  // The gateway's client type is the generated Supabase client; this double implements exactly the two calls the gateway makes.
  return { db: db as unknown as Db, updates }
}

const ALL: readonly ListingStatus[] = ['active', 'inactive', 'sold', 'rented', 'archived', 'pending', 'expired']
const listing = (status: ListingStatus): Row => ({ id: 'l1', status, slug: 'a-flat', title: 'A flat', user_id: 'owner-1' })
const admin: TransitionActorContext = { userId: 'admin-1', role: 'admin', source: 'admin_panel' }
const moderator: TransitionActorContext = { userId: 'mod-1', role: 'moderator', source: 'admin_panel' }
const owner: TransitionActorContext = { userId: 'owner-1', role: 'user', source: 'cabinet' }
const ownerNoRole: TransitionActorContext = { userId: 'owner-1', role: null, source: 'cabinet' }
const stranger: TransitionActorContext = { userId: 'someone-else', role: 'user', source: 'cabinet' }
const strangerNoRole: TransitionActorContext = { userId: 'someone-else', role: null }

beforeEach(() => { notify.mockReset().mockResolvedValue(undefined); revalidateTag.mockReset(); updateTag.mockReset(); revalidatePath.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('status gateway: publishing is staff-only', () => {
  it('[SEC-D8-SRV-ALLOW] an administrator and a moderator publish a pending listing and the owner is notified', async () => {
    for (const actor of [admin, moderator]) {
      notify.mockClear(); revalidateTag.mockClear(); updateTag.mockClear()
      const { db, updates } = makeDb(listing('pending'))
      const result = await applyListingTransitionByStatus('l1', 'active', actor, db)
      expect(result, String(actor.role)).toEqual({ ok: true, nextStatus: 'active', listingId: 'l1' })
      expect(updates).toHaveLength(1)
      expect(updates[0]).toMatchObject({ status: 'active' })
      expect(typeof updates[0].expires_at).toBe('string')
      expect(new Date(updates[0].expires_at as string).getTime()).toBeGreaterThan(Date.now())
      expect(notify).toHaveBeenCalledTimes(1)
      expect(notify.mock.calls[0][0]).toMatchObject({ userId: 'owner-1', type: 'listing_status_change' })
      // Next 16: a Server Action expires the tag at once with updateTag (the one-argument revalidateTag is deprecated and would only mark it stale)
      expect(updateTag).toHaveBeenCalledWith('site-stats')
      expect(revalidateTag).not.toHaveBeenCalled()
    }
  })

  it('[SEC-D8-SRV-OWNER-ALLOW] the owner hides, archives, sells, rents or sends back to review their own listing', async () => {
    for (const to of ['inactive', 'archived', 'sold', 'rented', 'pending', 'expired'] as const) {
      for (const actor of [owner, ownerNoRole]) {
        const { db, updates } = makeDb(listing('active'))
        const result = await applyListingTransitionByStatus('l1', to, actor, db)
        expect(result, `${String(actor.role)} -> ${to}`).toEqual({ ok: true, nextStatus: to, listingId: 'l1' })
        expect(updates, `${to} payload`).toEqual([{ status: to }])        // a non-public status is not given a new expiry
      }
    }
  })

  it('[SEC-D8-SRV-DENY] the owner cannot set active from any other status and nothing is written, re-stamped or notified', async () => {
    const others = ALL.filter(s => s !== 'active')
    for (const actor of [owner, ownerNoRole]) {
      for (const from of others) {
        const { db, updates } = makeDb(listing(from))
        const result = await applyListingTransitionByStatus('l1', 'active', actor, db)
        expect(result, `${String(actor.role)} owner, ${from} -> active`).toEqual({ ok: false, reason: 'forbidden' })
        expect(updates, `${from} -> active wrote`).toEqual([])
      }
    }
    expect(notify).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('[SEC-D8-SRV-DENY-OTHER] a signed-in user who is not the owner and not staff cannot change the status at all', async () => {
    for (const actor of [stranger, strangerNoRole]) {
      for (const to of ['active', 'sold', 'pending'] as const) {
        const { db, updates } = makeDb(listing('inactive'))
        expect(await applyListingTransitionByStatus('l1', to, actor, db), `${String(actor.role)} -> ${to}`).toEqual({ ok: false, reason: 'forbidden' })
        expect(updates).toEqual([])
      }
    }
    expect(notify).not.toHaveBeenCalled()
  })

  it('[SEC-D8-SRV-ERR] a missing listing, an unchanged status and a failed write return their exact reasons without side effects', async () => {
    const missing = makeDb(null)
    expect(await applyListingTransitionByStatus('l1', 'active', admin, missing.db)).toEqual({ ok: false, reason: 'not_found' })
    expect(missing.updates).toEqual([])

    const same = makeDb(listing('active'))
    expect(await applyListingTransitionByStatus('l1', 'active', admin, same.db)).toEqual({ ok: false, reason: 'invalid_transition' })
    expect(same.updates).toEqual([])

    const failing = makeDb(listing('pending'), true)
    expect(await applyListingTransitionByStatus('l1', 'active', admin, failing.db)).toEqual({ ok: false, reason: 'db_error' })
    expect(failing.updates).toHaveLength(1)           // the write was attempted once and refused
    expect(notify).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
    expect(updateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
