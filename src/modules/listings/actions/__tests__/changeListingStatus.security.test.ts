// @vitest-environment node
/**
 * Security (Task 923 Revision 7): the status control of the listing edit form. The CALLER's role is read from the database by the session's user id and handed to
 * the transition gateway; nothing the browser sends can name a role or a user. The gateway itself decides owner / staff (its own tests).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const gatewayCalls: { listingId: string; toStatus: string; actor: Record<string, unknown> }[] = []
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
// `requireViewer()` (Task 923 R44) reads the caller's own `users` row with the service role: the same in-memory database answers it
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => db.client.from(t) }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('../applyListingTransition', () => ({
  applyListingTransitionByStatus: async (listingId: string, toStatus: string, actor: Record<string, unknown>) => { gatewayCalls.push({ listingId, toStatus, actor }); return { ok: true } },
}))

import { changeListingStatusAction } from '../changeListingStatus'

beforeEach(() => {
  db = createFakeDb({ users: [{ id: 'usr', role: 'user', status: 'active' }, { id: 'adm', role: 'admin', status: 'active' }, { id: 'nul', role: null, status: 'active' }] })
  currentUser = { id: 'usr' }
  gatewayCalls.length = 0
})

describe('changeListingStatusAction', () => {
  it('an anonymous caller is refused without touching the gateway', async () => {
    currentUser = null
    expect(await changeListingStatusAction('l1', 'archived')).toEqual({ ok: false, reason: 'forbidden' })
    expect(gatewayCalls).toEqual([])
    expect(db.log).toEqual([])
  })

  it.each([['usr', 'user'], ['adm', 'admin'], ['nul', null]])('%s reaches the gateway with the role %j taken from the database and the source "cabinet"', async (id, role) => {
    currentUser = { id }
    expect(await changeListingStatusAction('l1', 'archived')).toEqual({ ok: true })
    expect(gatewayCalls).toEqual([{ listingId: 'l1', toStatus: 'archived', actor: { userId: id, role, source: 'cabinet' } }])
  })

  // Task 923 R44: a session whose profile row is missing is a guest for `requireViewer()` (a "zombie" session); it used to reach the gateway with the role null and is now refused first
  it('a session with no profile row is refused without touching the gateway', async () => {
    currentUser = { id: 'ghost' }
    expect(await changeListingStatusAction('l1', 'archived')).toEqual({ ok: false, reason: 'forbidden' })
    expect(gatewayCalls).toEqual([])
  })

  it('the role comes from the row of the session\'s user, never from another', async () => {
    await changeListingStatusAction('l1', 'active')
    expect(db.log[0].filters).toEqual([['id', 'eq', 'usr']])
    expect(gatewayCalls[0].actor.role).toBe('user')
  })
})
