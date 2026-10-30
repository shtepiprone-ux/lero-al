// @vitest-environment node
/**
 * Security (Task 923 Revision 56, R171, release blocker S62): the listing view route.
 *  - a view of a listing that is not public (pending, inactive, expired) is refused with 404 and `record_listing_view` is never called;
 *  - the viewer id handed to the function is the one Supabase Auth gives the route, and a guest gets null;
 *  - the owner's own view is not recorded.
 * Doubles, stated: the admin client is the in-memory database of src/tests/fakeSupabase.ts plus a recording `rpc`; the session client answers `auth.getUser` with the
 * person of the step. The route's own status filter, owner exclusion and fingerprint are the real code. This does not prove the function's grant (SEC-DB-S62-DENY / -ALLOW do).
 */
import { NextRequest } from 'next/server'
import { beforeEach, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

const OWNER = 'owner-1'
const VIEWER = 'viewer-1'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const rpc = vi.fn(async (_name: string, _args: Record<string, unknown>) => ({ data: true, error: null }))

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ ...db.client, rpc }) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: currentUser } }) } }) }))

import { POST } from '../route'

const post = (slug: string) => POST(
  new NextRequest(`http://localhost:3000/api/listings/${slug}/view`, {
    method: 'POST',
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'x-forwarded-for': '203.0.113.7' },
  }),
  { params: Promise.resolve({ slug }) },
)

beforeEach(() => {
  db = createFakeDb({
    listings: ['pending', 'inactive', 'expired', 'active'].map((status) => ({ id: `id-${status}`, slug: `slug-${status}`, user_id: OWNER, status })),
  })
  currentUser = null
  rpc.mockClear()
})

it('[SEC-X-SRV-VIEW-DENY] the view route records no view of a pending, inactive or expired listing, takes the viewer id from Supabase Auth, and never records the owner\'s own', async () => {
  for (const status of ['pending', 'inactive', 'expired']) {
    const res = await post(`slug-${status}`)
    expect(res.status, `${status}: not found`).toBe(404)
    expect(rpc, `${status}: no view is recorded`).not.toHaveBeenCalled()
    rpc.mockClear()
  }

  // a guest on an active listing: the view is recorded with no user id
  const guest = await post('slug-active')
  expect(guest.status, 'guest: the listing is served').toBe(200)
  expect(await guest.json(), 'guest: the view is recorded').toEqual({ ok: true, recorded: true })
  expect(rpc, 'guest: one call').toHaveBeenCalledTimes(1)
  expect(rpc, 'guest: the call carries no user id').toHaveBeenCalledWith('record_listing_view', {
    p_listing_id: 'id-active', p_user_id: null, p_ip_hash: expect.stringMatching(/^[0-9a-f]{24}$/),
  })
  rpc.mockClear()

  // a signed-in viewer (not the owner): the user id is the one of Supabase Auth
  currentUser = { id: VIEWER }
  const viewer = await post('slug-active')
  expect(viewer.status, 'viewer: the listing is served').toBe(200)
  expect(await viewer.json(), 'viewer: the view is recorded').toEqual({ ok: true, recorded: true })
  expect(rpc, 'viewer: one call').toHaveBeenCalledTimes(1)
  expect(rpc.mock.calls[0][1].p_user_id, 'viewer: the id comes from Supabase Auth').toBe(VIEWER)
  rpc.mockClear()

  // the owner: nothing is recorded
  currentUser = { id: OWNER }
  const owner = await post('slug-active')
  expect(owner.status, 'owner: the request is answered').toBe(200)
  expect(await owner.json(), 'owner: no view is recorded').toEqual({ ok: true, recorded: false })
  expect(rpc, 'owner: no call').not.toHaveBeenCalled()
})
