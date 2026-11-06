/**
 * Real-boundary control for the tables that hardening v7 puts behind the service role (Task 923 R81 (b) first): REAL Supabase Auth and the REAL database of the approved
 * development project, with an anonymous client and the REAL session of a synthetic person. Synthetic users only, verified clean-up.
 * The case below needs the table `public.reauth_failures` of hardening v7: until the owner has applied that file it FAILS on the development project (the table does not
 * exist, so no grant refuses the call): that is the expected state, not a defect of the test.
 * Task 923 R95 adds the two cases of change 8 (D58): no session can restore a marked account by its own return, and an active account keeps its own access. Hardening
 * v7.1 is applied, so the table case above is expected to pass now.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { escapeLike } from '@/lib/postgrest/escape'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

// SEC-DB-X-AVATARS-STORAGE-ALLOW calls the REAL upload route in-process. The doubles are the cookie-bound client factory (outside a Next request it returns the client that holds the
// REAL session of the chosen person) and the Cloudinary provider (no file is sent to, or deleted from, any real account); the route, `requireViewer`, the rank rule and the
// moderator key check run against the real project.
const acting = vi.hoisted(() => ({ client: null as unknown, uploaded: [] as string[] }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('@/lib/cloudinaryUpload', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/cloudinaryUpload')>()),
  uploadToCloudinary: async (_bytes: ArrayBuffer, _mime: string, folder: string) => {
    acting.uploaded.push(folder)
    return { url: 'https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-avatar.png', publicId: 'zz-synth-avatar', width: 256, height: 256 }
  },
}))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => ({ skipped: true, dryRun: false, deleted: false }) }))

let run: Run
let person: SyntheticUser
/** listings a session inserted itself: their slug is plain (the guard requires it), so the run prefix cannot find them; they are removed by id and counted in afterAll */
const sessionListingIds: string[] = []
/** Storage objects the Storage case may have stored (only a broken refusal stores one): removed and counted in afterAll */
const storagePaths: string[] = []

beforeAll(async () => {
  run = createRun()
  person = await run.makeUser('hardening-person', { role: 'user' })
})
afterAll(async () => {
  await run.admin.from('reauth_failures').delete().eq('user_id', person.id)
  if (sessionListingIds.length) await run.admin.from('listings').delete().in('id', sessionListingIds)
  const leftListings = sessionListingIds.length ? await run.admin.from('listings').select('id').in('id', sessionListingIds) : { data: [], error: null }
  expect(leftListings.error).toBeNull()
  expect(leftListings.data, 'no listing inserted by a session is left').toEqual([])
  if (storagePaths.length) await run.admin.storage.from('avatars').remove(storagePaths)
  const leftObjects = storagePaths.length ? await run.admin.storage.from('avatars').list(`${run.RUN}`) : { data: [], error: null }
  expect(leftObjects.error).toBeNull()
  expect(leftObjects.data, 'no Storage object of this run is left').toEqual([])
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

// ── Task 923 R162: the cases of hardening v7.1 (R37, D25-D29) that were planned and never written. REAL Supabase Auth and the REAL database; a request is the Data API call of a REAL session. ──
/** a plain slug for a listing a session inserts (the guard of hardening v7 refuses `_` and capitals); it carries the run's letters so it is recognisable */
const plainSlug = (tag: string) => `${run.RUN.replace(/_/g, '').toLowerCase()}-${tag}`
const inDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString()
/** a pending listing row as a session may insert it: the guard of hardening v7 accepts exactly this shape */
const ownPending = (ownerId: string, tag: string, values: Record<string, unknown> = {}) => ({
  user_id: ownerId, slug: plainSlug(tag), title: `${run.RUN} ${tag}`, price: 1000, listing_type: 'sale', property_type: 'apartment',
  status: 'pending', expires_at: inDays(30), views_count: 0, ...values,
})
const storedUser = async (id: string) => (await run.admin.from('users').select('id, name, role, status, is_verified, block_reason, suspended_until, deleted_at, public_id').eq('id', id).single()).data
const storedListing = async (id: string) =>
  (await run.admin.from('listings').select('id, user_id, title, status, is_premium, premium_until, views_count, expires_at, public_id, slug').eq('id', id).single()).data

it('[SEC-DB-S59-DENY] A session cannot change the protected profile columns role, status, verification, block, suspension, deletion or public id', async () => {
  const victim = await run.makeUser('s59-victim', { role: 'user' })
  const before = { own: await storedUser(person.id), other: await storedUser(victim.id) }
  expect(before.own?.role, 'precondition: the actor is an ordinary user').toBe('user')

  const attempts: [string, Record<string, unknown>][] = [
    ['role admin', { role: 'admin' }],
    ['status inactive', { status: 'inactive' }],
    ['is_verified true', { is_verified: true }],
    ['a block reason', { block_reason: 'self-written' }],
    ['a suspension date', { suspended_until: inDays(10) }],
    ['a deletion mark', { deleted_at: new Date().toISOString() }],
    ['another public id', { public_id: 987654321 }],
    ['role admin, status active, is_verified true, suspended_until null together', { role: 'admin', status: 'active', is_verified: true, suspended_until: null }],
  ]
  for (const [label, patch] of attempts) {
    const own = await person.client.from('users').update(patch).eq('id', person.id).select('id')
    expect(own.error?.code, `${label}: refused with 42501 by the guard`).toBe('42501')
    expect(own.data, `${label}: nothing returned`).toBeNull()
    // another person's row is not even visible to the session: zero rows, and nothing changed
    const other = await person.client.from('users').update(patch).eq('id', victim.id).select('id')
    expect(other.data ?? [], `${label}: another user's row is not reachable`).toEqual([])
  }
  expect(await storedUser(person.id), 'the actor row is unchanged').toEqual(before.own)
  expect(await storedUser(victim.id), 'the other user row is unchanged').toEqual(before.other)
})

it('[SEC-DB-S59-ALLOW] A session cannot change the protected profile columns role, status, verification, block, suspension, deletion or public id', async () => {
  const renamed = `${run.RUN} s59 renamed`
  const update = await person.client.from('users').update({ name: renamed }).eq('id', person.id).select('id, name')
  expect(update.error, 'the permitted change is not refused').toBeNull()
  expect(update.data).toEqual([{ id: person.id, name: renamed }])
  expect((await storedUser(person.id))?.name, 'the name is stored').toBe(renamed)
})

it('[SEC-DB-S61-DENY] A session cannot write a listing status, premium, counters, expiry, public id or owner', async () => {
  const stranger = await run.makeUser('s61-stranger', { role: 'user' })
  const listing = await run.makeListing(person.id, 'pending', 's61-deny')
  const before = await storedListing(listing.id)
  const attempts: [string, Record<string, unknown>][] = [
    ['status active', { status: 'active' }],
    ['is_premium true', { is_premium: true }],
    ['a premium end', { premium_until: inDays(365) }],
    ['views_count 9999', { views_count: 9999 }],
    ['an expiry in a year', { expires_at: inDays(365) }],
    ['another public id', { public_id: 987654321 }],
    ['the owner replaced by another user', { user_id: stranger.id }],
    ['another slug', { slug: plainSlug('s61-other-slug') }],
  ]
  for (const [label, patch] of attempts) {
    const refused = await person.client.from('listings').update(patch).eq('id', listing.id).select('id')
    expect(refused.error?.code, `${label}: refused with 42501 by the guard`).toBe('42501')
    expect(refused.data, `${label}: nothing returned`).toBeNull()
  }
  // an INSERT that is not a plain pending listing is refused too: status active, then a premium listing
  for (const [label, values] of [['status active', { status: 'active' }], ['is_premium true', { is_premium: true }]] as [string, Record<string, unknown>][]) {
    const tag = `s61-insert-${label.replace(/\W+/g, '-')}`
    const refused = await person.client.from('listings').insert(ownPending(person.id, tag, values)).select('id')
    expect(refused.error?.code, `an insert with ${label}: refused with 42501`).toBe('42501')
    expect(refused.data, `an insert with ${label}: nothing returned`).toBeNull()
    const stored = await run.admin.from('listings').select('id').eq('slug', plainSlug(tag))
    expect(stored.data, `an insert with ${label}: no row was stored`).toEqual([])
  }
  expect(await storedListing(listing.id), 'the listing is unchanged').toEqual(before)
})

it('[SEC-DB-S61-ALLOW] A session cannot write a listing status, premium, counters, expiry, public id or owner', async () => {
  const listing = await run.makeListing(person.id, 'pending', 's61-allow')
  const retitled = `${run.RUN} s61 retitled`
  const edit = await person.client.from('listings').update({ title: retitled }).eq('id', listing.id).select('id, title')
  expect(edit.error, 'an ordinary edit is not refused').toBeNull()
  expect(edit.data).toEqual([{ id: listing.id, title: retitled }])
  expect((await storedListing(listing.id))?.title, 'the new title is stored').toBe(retitled)

  const inserted = await person.client.from('listings').insert(ownPending(person.id, 's61-allow-insert')).select('id, status, user_id')
  expect(inserted.error, 'a pending insert with a 30-day expiry is not refused').toBeNull()
  expect(inserted.data).toHaveLength(1)
  expect(inserted.data?.[0]).toMatchObject({ status: 'pending', user_id: person.id })
  sessionListingIds.push(...(inserted.data ?? []).map((row) => row.id as string))
})

it('[SEC-DB-S62-DENY] Only the server records a listing view', async () => {
  const listing = await run.makeListing(person.id, 'active', 's62')
  const viewer = await run.makeUser('s62-viewer', { role: 'user' })
  const countViews = async () => (await run.admin.from('listing_views').select('id', { count: 'exact', head: true }).eq('listing_id', listing.id)).count
  const before = { views: (await storedListing(listing.id))?.views_count, rows: await countViews() }

  for (const [who, client] of [['an anonymous client', run.anonymousClient()], ['a signed-in user', viewer.client]] as const) {
    const answer = await client.rpc('record_listing_view', { p_listing_id: listing.id, p_user_id: viewer.id, p_ip_hash: `${run.RUN}-forged` })
    expect(answer.error?.code, `${who}: permission denied`).toBe('42501')
    expect(answer.data, `${who}: nothing returned`).toBeNull()
  }
  expect((await storedListing(listing.id))?.views_count, 'views_count is unchanged').toBe(before.views)
  expect(await countViews(), 'no view row was written').toBe(before.rows)

  // the control: the server role records a view through the same function, so the refusals above are the grant and not a missing function
  const server = await run.admin.rpc('record_listing_view', { p_listing_id: listing.id, p_user_id: viewer.id, p_ip_hash: `${run.RUN}-server` })
  expect(server.error, 'the service role records a view').toBeNull()
})

it('[SEC-DB-S62-ALLOW] Only the server records a listing view', async () => {
  const listing = await run.makeListing(person.id, 'active', 's62-allow')
  const countViews = async () => (await run.admin.from('listing_views').select('id', { count: 'exact', head: true }).eq('listing_id', listing.id)).count
  const before = { views: (await storedListing(listing.id))?.views_count, rows: await countViews() }

  const answer = await run.admin.rpc('record_listing_view', { p_listing_id: listing.id, p_user_id: null, p_ip_hash: `${run.RUN}-s62-allow` })
  expect(answer.error, 'the service role records a view').toBeNull()
  expect(answer.data, 'a new view is counted').toBe(true)
  expect((await storedListing(listing.id))?.views_count, 'views_count grows by one').toBe(Number(before.views) + 1)
  expect(await countViews(), 'one view row is written').toBe(Number(before.rows) + 1)
})

/** what one account's own session reads: its users row, one of its listings and one favourite */
async function readOwn(account: SyntheticUser, listingId: string) {
  return {
    user: await account.client.from('users').select('id').eq('id', account.id),
    listing: await account.client.from('listings').select('id').eq('id', listingId),
    favorite: await account.client.from('favorites').select('id').eq('user_id', account.id),
  }
}

it('[SEC-DB-ACCESS-DENY] A blocked, deleted or signed-out account reads and writes nothing on its next database request', async () => {
  const shared = await run.makeListing(person.id, 'active', 'acc-shared')   // the listing every account below has as a favourite
  const stages: [string, (account: SyntheticUser) => Promise<void>][] = [
    ['a blocked account', async (account) => {
       
      const written = await run.admin.from('users').update({ status: 'blocked', block_reason: `${run.RUN} blocked` }).eq('id', account.id)
      expect(written.error, 'the staff block was written').toBeNull()
    }],
    ['a soft-deleted account', async (account) => {
       
      const written = await run.admin.from('users').update({ status: 'inactive', deleted_at: new Date().toISOString() }).eq('id', account.id)
      expect(written.error, 'the deletion mark was written').toBeNull()
    }],
    ['a signed-out account', async (account) => {
      const ended = await run.admin.rpc('end_user_sessions', { p_user: account.id })
      expect(ended.error, 'the sessions were ended by the server role').toBeNull()
      expect(ended.data as number, 'at least the session of this account was removed').toBeGreaterThanOrEqual(1)
    }],
  ]
  let n = 0
  for (const [label, act] of stages) {
    n += 1
    const account = await run.makeUser(`acc-deny-${n}`, { role: 'user' })
    const listing = await run.makeListing(account.id, 'pending', `acc-deny-${n}`)
    const favorite = await run.admin.from('favorites').insert({ user_id: account.id, listing_id: shared.id })
    expect(favorite.error, `${label}: the favourite was prepared`).toBeNull()
    const name = (await storedUser(account.id))?.name

    // the control, before the action: the same session reads its own three kinds of row, so an empty answer below is a refusal and not a missing row
    const before = await readOwn(account, listing.id)
    expect(before.user.data, `${label}: before the action it reads its own row`).toHaveLength(1)
    expect(before.listing.data, `${label}: before the action it reads its own listing`).toHaveLength(1)
    expect(before.favorite.data, `${label}: before the action it reads its favourite`).toHaveLength(1)

    await act(account)

    // the very next request: no row comes back, and no error either (a refused read is an empty answer)
    const after = await readOwn(account, listing.id)
    for (const [what, answer] of [['its own users row', after.user], ['its own listing', after.listing], ['its favourite', after.favorite]] as const) {
      expect(answer.error, `${label}: ${what}: the refused read is not an error`).toBeNull()
      expect(answer.data, `${label}: ${what} is not returned`).toEqual([])
    }

    // the writes: an update reaches no row, an insert is refused by the policy (42501), a delete removes nothing
    const rename = await account.client.from('users').update({ name: `${run.RUN} acc-deny changed` }).eq('id', account.id).select('id')
    expect(rename.data ?? [], `${label}: the profile update reached no row`).toEqual([])
    const retitle = await account.client.from('listings').update({ title: `${run.RUN} acc-deny retitled` }).eq('id', listing.id).select('id')
    expect(retitle.data ?? [], `${label}: the listing update reached no row`).toEqual([])
    const insertListing = await account.client.from('listings').insert(ownPending(account.id, `acc-deny-insert-${n}`)).select('id')
    sessionListingIds.push(...(insertListing.data ?? []).map((row) => row.id as string))
    expect(insertListing.error?.code, `${label}: a listing insert is refused with 42501`).toBe('42501')
    expect(insertListing.data, `${label}: no listing came back`).toBeNull()
    const insertFavorite = await account.client.from('favorites').insert({ user_id: account.id, listing_id: listing.id }).select('id')
    expect(insertFavorite.error?.code, `${label}: a favourite insert is refused with 42501`).toBe('42501')
    const removeFavorite = await account.client.from('favorites').delete().eq('user_id', account.id).select('id')
    expect(removeFavorite.data ?? [], `${label}: the favourite delete removed no row`).toEqual([])

    // nothing was written: read back with the service role
    expect((await storedUser(account.id))?.name, `${label}: the profile name is unchanged`).toBe(name)
    expect((await storedListing(listing.id))?.title, `${label}: the listing title is unchanged`).toBe(`${run.RUN} acc-deny-${n}`)
    expect((await run.admin.from('favorites').select('id').eq('user_id', account.id)).data, `${label}: its one favourite remains`).toHaveLength(1)
    expect((await run.admin.from('listings').select('id').eq('slug', plainSlug(`acc-deny-insert-${n}`))).data, `${label}: the refused listing was not stored`).toEqual([])
  }
})

it('[SEC-DB-ACCESS-ALLOW] A blocked, deleted or signed-out account reads and writes nothing on its next database request', async () => {
  const listing = await run.makeListing(person.id, 'pending', 'acc-allow')
  const reads = await readOwn(person, listing.id)
  expect(reads.user.error, 'the active account reads its own row').toBeNull()
  expect(reads.user.data).toEqual([{ id: person.id }])
  expect(reads.listing.data, 'it reads its own listing').toEqual([{ id: listing.id }])
  expect(reads.favorite.error).toBeNull()

  const renamed = `${run.RUN} acc-allow renamed`
  const rename = await person.client.from('users').update({ name: renamed }).eq('id', person.id).select('id, name')
  expect(rename.error, 'the allowed profile update is not refused').toBeNull()
  expect(rename.data).toEqual([{ id: person.id, name: renamed }])
  const retitled = `${run.RUN} acc-allow retitled`
  const retitle = await person.client.from('listings').update({ title: retitled }).eq('id', listing.id).select('id, title')
  expect(retitle.error, 'the allowed listing update is not refused').toBeNull()
  expect(retitle.data).toEqual([{ id: listing.id, title: retitled }])
  expect((await storedUser(person.id))?.name, 'the profile update is stored').toBe(renamed)
  expect((await storedListing(listing.id))?.title, 'the listing update is stored').toBe(retitled)
})

it('[SEC-DB-ERR] A refused write answers 42501 and leaves the row as it was', async () => {
  const wholeRow = async () => JSON.stringify((await run.admin.from('users').select('*').eq('id', person.id).single()).data)
  const before = await wholeRow()
  const refused = await person.client.from('users').update({ role: 'admin' }).eq('id', person.id).select('id')
  expect(refused.error?.code, 'the refusal is 42501').toBe('42501')
  expect(refused.data, 'no success answer: nothing came back').toBeNull()
  expect(await wholeRow(), 'the row is byte for byte what it was').toBe(before)
})

// ── Realtime: a blocked account receives no further change (D26: "0 seconds"). The events are those of postgres_changes on `notifications`, delivered by the REAL Realtime service. ──
/** a bounded wait on a condition that Realtime makes true: it ends false (an assertion fails) and never as a vitest timeout */
async function waitUntil(condition: () => boolean, ms = 20_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    if (condition()) return true
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return condition()
}

/** the account listens to the INSERTs of its own notifications; resolves when Realtime has confirmed the subscription */
async function listenToOwnNotifications(account: SyntheticUser) {
  const titles: string[] = []
  const channel = account.client.channel(`${run.RUN}-${account.id}`).on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${account.id}` },
    (payload) => { titles.push(String((payload.new as { title?: string }).title)) },
  )
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('fixture: the Realtime subscription was not confirmed')), 30_000)
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve() }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); reject(new Error(`fixture: the Realtime subscription ended with ${status}`)) }
    })
  })
  // "SUBSCRIBED" confirms the channel, not yet the database change feed behind it (a cold Realtime tenant needs a few seconds): probe notifications are written until one arrives, so the
  // first real event of a case cannot be lost to a feed that is not ready. The probes are not part of what a case asserts (`received()` hides them).
  const probed = () => titles.some((title) => title.includes(' probe '))
  for (let probes = 1; probes <= 8 && !probed(); probes++) {
    const written = await run.admin.from('notifications').insert({ user_id: account.id, type: 'marketing', title: `${run.RUN} probe ${probes}`, body: `${run.RUN} body` })
    if (written.error) throw new Error('fixture: a probe notification could not be written')
    await waitUntil(probed, 4_000)
  }
  return { ready: probed(), received: () => titles.filter((title) => !title.includes(' probe ')), stop: () => account.client.removeChannel(channel) }
}

const notifyAccount = (userId: string, title: string) => run.admin.from('notifications').insert({ user_id: userId, type: 'marketing', title, body: `${run.RUN} body` })

it('[SEC-DB-REALTIME-DENY] A blocked account receives no further realtime change after the block', async () => {
  const blocked = await run.makeUser('rt-blocked', { role: 'user' })
  const control = await run.makeUser('rt-control', { role: 'user' })
  const listening = await listenToOwnNotifications(blocked)
  const controlListening = await listenToOwnNotifications(control)
  try {
    expect(listening.ready, 'the change feed of the account delivers events before the block').toBe(true)
    expect(controlListening.ready, 'the change feed of the active control account delivers events').toBe(true)
    const first = `${run.RUN} before the block`
    expect((await notifyAccount(blocked.id, first)).error).toBeNull()
    expect(await waitUntil(() => listening.received().includes(first)), 'the event before the block arrives').toBe(true)

     
    expect((await run.admin.from('users').update({ status: 'blocked', block_reason: `${run.RUN} blocked` }).eq('id', blocked.id)).error).toBeNull()
    const second = `${run.RUN} after the block`
    expect((await notifyAccount(blocked.id, second)).error).toBeNull()
    // the control account is active and listens too: once its event arrives, Realtime has processed everything written before it, so "no event" below is not "not yet"
    const marker = `${run.RUN} marker for the active control`
    expect((await notifyAccount(control.id, marker)).error).toBeNull()
    expect(await waitUntil(() => controlListening.received().includes(marker)), 'the active control account receives its event').toBe(true)
    expect(listening.received(), 'the blocked account received nothing after the block').toEqual([first])
  } finally {
    await listening.stop()
    await controlListening.stop()
  }
})

it('[SEC-DB-REALTIME-ALLOW] A blocked account receives no further realtime change after the block', async () => {
  const active = await run.makeUser('rt-active', { role: 'user' })
  const listening = await listenToOwnNotifications(active)
  try {
    expect(listening.ready, 'the change feed of the active account delivers events').toBe(true)
    const title = `${run.RUN} for the active account`
    expect((await notifyAccount(active.id, title)).error).toBeNull()
    expect(await waitUntil(() => listening.received().includes(title)), 'the event arrives').toBe(true)
    expect(listening.received()).toEqual([title])
  } finally {
    await listening.stop()
  }
})

describe('accessHardening', () => {
  it('[SEC-DB-X-REAUTH-FAILURES-NO-SESSION] a browser session cannot touch the failure rows', async () => {
    // one row prepared by the service role, so that "no row changed" has something to prove
    const seeded = await run.admin.from('reauth_failures').insert({ user_id: person.id })
    expect(seeded.error, 'the row was prepared (needs hardening v7: public.reauth_failures)').toBeNull()
    const countRows = async () => (await run.admin.from('reauth_failures').select('id', { count: 'exact', head: true }).eq('user_id', person.id)).count
    const before = await countRows()
    expect(before).toBe(1)

    for (const [who, client] of [['anon, no session', run.anonymousClient()], ['a signed-in session', person.client]] as const) {
      const select = await client.from('reauth_failures').select('id').limit(1)
      const insert = await client.from('reauth_failures').insert({ user_id: person.id })
      const remove = await client.from('reauth_failures').delete().eq('user_id', person.id)
      expect(select.error?.code, `${who}: select`).toBe('42501')
      expect(insert.error?.code, `${who}: insert`).toBe('42501')
      expect(remove.error?.code, `${who}: delete`).toBe('42501')
    }
    expect(await countRows(), 'no row was added or removed by a session').toBe(before)
  })

  // PostgREST answers PGRST202 (HTTP 404) for a function that is not in the schema; a function that exists but is not granted would answer 42501 instead.
  async function expectNoFunction(who: string, client: SupabaseClient, name: string) {
    const answer = await client.rpc(name)
    expect(answer.error?.code, `${who}: ${name} is not found in the Data API`).toBe('PGRST202')
    expect(answer.data, `${who}: ${name} returns nothing`).toBeNull()
  }

  it('[SEC-DB-X-NO-SELF-RESTORE] no restore function is reachable from a session', async () => {
    // the account carries the inactivity mark (deleted_at set, status inactive) and still holds the session it opened before it was marked
    const marked = await run.makeUser('marked-account')
    const markedAt = new Date().toISOString()
     
    const mark = await run.admin.from('users').update({ status: 'inactive', deleted_at: markedAt }).eq('id', marked.id).select('status, deleted_at')
    expect(mark.error, 'the mark was written by the service role').toBeNull()
    expect(mark.data).toHaveLength(1)
    expect((await marked.client.auth.getUser()).error, 'precondition: the marked account session is still valid, so the answers below come from the Data API').toBeNull()

    const readState = async () => {
      const row = await run.admin.from('users').select('status, deleted_at').eq('id', marked.id).single()
      const history = await run.admin.from('user_status_history').select('id', { count: 'exact', head: true }).eq('user_id', marked.id)
      expect(row.error).toBeNull()
      expect(history.error).toBeNull()
      return { status: row.data?.status, deletedAtMs: Date.parse(row.data?.deleted_at ?? ''), historyRows: history.count }
    }
    const before = await readState()
    expect(before.status).toBe('inactive')
    expect(before.deletedAtMs).toBe(Date.parse(markedAt))

    for (const [who, client] of [['the marked account', marked.client], ['a signed-in active session', person.client]] as const) {
      for (const name of ['restore_inactive_account', 'caller_access_state']) await expectNoFunction(who, client, name)
    }

    // the mark was not lifted by any of the calls: the same status, the same deleted_at, no history row
    expect(await readState(), 'the marked row keeps deleted_at and status inactive, and no status history row was written').toEqual(before)
  })

  it('[SEC-DB-X-RESTORE-ALLOW] an active account keeps its own access', async () => {
    const active = await run.makeUser('active-account')
    const read = await active.client.from('users').select('id, name').eq('id', active.id)
    expect(read.error, 'the session reads its own row').toBeNull()
    expect(read.data).toHaveLength(1)
    expect(read.data?.[0].id).toBe(active.id)

    const renamed = `${run.RUN} renamed`
    const update = await active.client.from('users').update({ name: renamed }).eq('id', active.id).select('id, name')
    expect(update.error, 'the session updates its own name').toBeNull()
    expect(update.data).toEqual([{ id: active.id, name: renamed }])
    const stored = await run.admin.from('users').select('name').eq('id', active.id).single()
    expect(stored.data?.name, 'the update was stored').toBe(renamed)
  })

  // ── Task 923 R100 (R73 (a)/(b), R69 (b)/(c)): hardening v8a is live, so these cases run now ─────────────────────────────────────────────────────────────
  /** an address inside the project's Cloudinary cloud, the prefix the CHECK on `listing_images.url` requires (hardening v8a) */
  const PHOTO_URL = 'https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-photo.jpg'
  const ALL_STATUSES = ['active', 'sold', 'rented', 'archived', 'pending', 'inactive', 'expired'] as const
  const PUBLIC_STATUSES = ['active', 'sold', 'rented']

  /** one listing of the person per status, each with one photo, prepared by the service role */
  async function listingsOfEveryStatus(tag: string) {
    const made: Record<string, { id: string; slug: string }> = {}
    for (const status of ALL_STATUSES) {
      const row = await run.makeListing(person.id, status, `${tag}-${status}`)
      const photo = await run.admin.from('listing_images').insert({ listing_id: row.id, url: PHOTO_URL, is_cover: true, order: 0 })
      expect(photo.error, `fixture: a photo for the ${status} listing (needs hardening v8a: the URL prefix check accepts this address)`).toBeNull()
      made[status] = row
    }
    return made
  }
  const idsOf = (made: Record<string, { id: string }>) => Object.values(made).map((row) => row.id)

  it('[SEC-DB-X-CLOSED-READ-ALLOW] a guest reads sold and rented', async () => {
    const made = await listingsOfEveryStatus('closed-allow')
    const stranger = await run.makeUser('closed-stranger', { role: 'user' })
    for (const [who, client] of [['a guest (anon, no session)', run.anonymousClient()], ['a signed-in stranger', stranger.client]] as const) {
      const listings = await client.from('listings').select('id, status').in('id', idsOf(made))
      expect(listings.error, `${who}: the read is not an error`).toBeNull()
      const seen = new Map((listings.data ?? []).map((row) => [row.id as string, row.status as string]))
      for (const status of PUBLIC_STATUSES) expect(seen.get(made[status].id), `${who}: the ${status} listing is readable`).toBe(status)

      // the photo of a readable listing is readable too (the photo policy follows the listing)
      const photos = await client.from('listing_images').select('listing_id, url').in('listing_id', PUBLIC_STATUSES.map((status) => made[status].id))
      expect(photos.error, `${who}: the photo read is not an error`).toBeNull()
      expect((photos.data ?? []).map((row) => row.listing_id).sort(), `${who}: one photo of each public listing`).toEqual(PUBLIC_STATUSES.map((status) => made[status].id).sort())
    }
  })

  it('[SEC-DB-X-CLOSED-READ-DENY] a guest reads no hidden listing or photo', async () => {
    const made = await listingsOfEveryStatus('closed-deny')
    const hidden = ALL_STATUSES.filter((status) => !PUBLIC_STATUSES.includes(status))
    const stranger = await run.makeUser('closed-deny-stranger', { role: 'user' })
    const countStored = async () => (await run.admin.from('listings').select('id', { count: 'exact', head: true }).in('id', idsOf(made))).count

    // the positive control: the service role (and the owner's own session) see every one of them, so an empty answer below is a refusal and not a missing row
    expect(await countStored(), 'precondition: all the listings exist').toBe(ALL_STATUSES.length)
    const ownRead = await person.client.from('listings').select('id').in('id', idsOf(made))
    expect(ownRead.error).toBeNull()
    expect((ownRead.data ?? []).length, 'the owner reads every one of their own listings').toBe(ALL_STATUSES.length)

    // Negative control (Task 923 R104 (c)): with SEC_NEGATIVE_CONTROL=closed-read each deny request below is sent with the ALLOWED request of the positive control above (the
    // owner's own session) instead of the guest's or the stranger's, so a deny assertion that cannot fail is caught here. The shared database is not touched.
    const closedReadControl = process.env.SEC_NEGATIVE_CONTROL === 'closed-read'
    for (const [who, visitorClient] of [['a guest (anon, no session)', run.anonymousClient()], ['a signed-in stranger', stranger.client]] as const) {
      const client = closedReadControl ? person.client : visitorClient
      for (const status of hidden) {
        const listing = await client.from('listings').select('id, status, slug').eq('id', made[status].id)
        expect(listing.error, `${who}: the ${status} listing: a refusal is an empty answer, not an error`).toBeNull()
        expect(listing.data, `${who}: the ${status} listing is not readable`).toEqual([])
        const photos = await client.from('listing_images').select('url').eq('listing_id', made[status].id)
        expect(photos.error, `${who}: the photo of the ${status} listing`).toBeNull()
        expect(photos.data, `${who}: the photo of the ${status} listing is not readable`).toEqual([])
      }
      // none of the hidden listings comes back through a list either
      const list = await client.from('listings').select('id').in('id', idsOf(made))
      expect((list.data ?? []).map((row) => row.id).sort(), `${who}: only the public listings come back in a list`).toEqual(PUBLIC_STATUSES.map((status) => made[status].id).sort())
      // a read changes nothing
      expect(await countStored(), `${who}: the stored rows are as they were`).toBe(ALL_STATUSES.length)
    }
  })

  /** a listing row the service role writes (the CHECKs of hardening v8a apply to every writer, the service role included) */
  async function insertListing(tag: string, values: Record<string, unknown>) {
    return run.admin.from('listings')
      .insert({ user_id: person.id, slug: `${run.RUN}-${tag}`, title: `${run.RUN} ${tag}`, price: 1000, listing_type: 'sale', property_type: 'apartment', status: 'pending', ...values })
      .select('id')
  }

  it('[SEC-DB-X-LISTING-CHECKS-ALLOW] valid values are accepted', async () => {
    // values on the bounds of every CHECK: the shortest and the longest title, the longest description, the smallest positive prices, the extreme coordinates
    const longest = await insertListing('chk-allow-long', { title: 'T'.repeat(150), description: 'D'.repeat(5000), price: 1, lat: 90, lng: -180 })
    expect(longest.error, 'a 150-character title, a 5000-character description, price 1, lat 90, lng -180').toBeNull()
    const shortest = await insertListing('chk-allow-short', { title: '  ABCDE  ', description: null, price: 0.01, lat: -90, lng: 180 })
    expect(shortest.error, 'a 5-character title (spaces do not count), no description, price 0.01, lat -90, lng 180').toBeNull()
    const noCoordinates = await insertListing('chk-allow-none', { lat: null, lng: null })
    expect(noCoordinates.error, 'no coordinates').toBeNull()

    // a photo inside the project's Cloudinary cloud
    const photo = await run.admin.from('listing_images').insert({ listing_id: longest.data?.[0]?.id, url: PHOTO_URL, is_cover: true, order: 0 }).select('id')
    expect(photo.error, 'a photo address inside the project cloud').toBeNull()

    const stored = await run.admin.from('listings').select('id').like('slug', `${escapeLike(run.RUN)}-chk-allow-%`)
    expect(stored.data, 'the three valid rows are stored').toHaveLength(3)
  })

  it('[SEC-DB-X-LISTING-CHECKS-DENY] invalid values are refused', async () => {
    const refusals: [string, Record<string, unknown>, string][] = [
      ['a title of 4 characters', { title: 'ABCD' }, 'listings_title_length_check'],
      ['a title that is only spaces', { title: '          ' }, 'listings_title_length_check'],
      ['a title of 151 characters', { title: 'T'.repeat(151) }, 'listings_title_length_check'],
      ['a description of 5001 characters', { description: 'D'.repeat(5001) }, 'listings_description_length_check'],
      ['a price of 0', { price: 0 }, 'listings_price_positive_check'],
      ['a negative price', { price: -5 }, 'listings_price_positive_check'],
      ['a latitude of 91', { lat: 91 }, 'listings_lat_range_check'],
      ['a latitude of -91', { lat: -91 }, 'listings_lat_range_check'],
      ['a longitude of 181', { lng: 181 }, 'listings_lng_range_check'],
      ['a longitude of -181', { lng: -181 }, 'listings_lng_range_check'],
    ]
    // Negative control (Task 923 R104 (c)): with SEC_NEGATIVE_CONTROL=listing-checks each refusal below sends the ALLOWED values of SEC-DB-X-LISTING-CHECKS-ALLOW instead of its
    // invalid ones, so a deny assertion that cannot fail is caught here. The shared database is not touched.
    const listingChecksControl = process.env.SEC_NEGATIVE_CONTROL === 'listing-checks'
    const allowedValues = { title: 'T'.repeat(150), description: 'D'.repeat(5000), price: 1, lat: 90, lng: -180 }
    let n = 0
    for (const [name, values, constraint] of refusals) {
      const answer = await insertListing(`chk-deny-${n++}`, listingChecksControl ? allowedValues : values)
      expect(answer.error?.code, `${name}: refused with a check violation`).toBe('23514')
      expect(answer.error?.message, `${name}: by the constraint ${constraint}`).toContain(constraint)
      expect(answer.data ?? null, `${name}: no row came back`).toBeNull()
    }

    // (the old price has no case here: `listings_price_rule` computes `price_old` for EVERY writer and never stores the writer's own value, so its CHECK cannot be reached by a write)
    const parent = await insertListing('chk-deny-parent', {})
    expect(parent.error, 'precondition: the parent listing is valid').toBeNull()

    // a photo address outside the project's Cloudinary cloud is refused too
    for (const url of ['https://evil.example/pixel.gif', 'https://res.cloudinary.com/another-cloud/image/upload/v1/x.jpg', 'http://res.cloudinary.com/die7okukn/image/upload/v1/x.jpg']) {
      const photo = await run.admin.from('listing_images').insert({ listing_id: parent.data?.[0]?.id, url, is_cover: false, order: 1 }).select('id')
      expect(photo.error?.code, `${url}: refused with a check violation`).toBe('23514')
      expect(photo.error?.message, `${url}: by the URL prefix constraint`).toContain('listing_images_url_prefix_check')
    }
    const photos = await run.admin.from('listing_images').select('id').eq('listing_id', parent.data?.[0]?.id)
    expect(photos.data, 'no refused photo was stored').toEqual([])

    // no refused listing was stored: only the valid parent exists under this prefix
    const stored = await run.admin.from('listings').select('slug').like('slug', `${escapeLike(run.RUN)}-chk-deny-%`)
    expect(stored.data, 'only the valid parent row exists').toEqual([{ slug: `${run.RUN}-chk-deny-parent` }])
  })

  // ── Task 923 R162: the image address, the staff avatar path and the moderator switches, as a session reaches them ──────────────────────────────────────────
  it('[SEC-DB-X-IMAGE-URL-ALLOW] a project image is accepted', async () => {
    const listing = await run.makeListing(person.id, 'pending', 'img-allow')
    const added = await person.client.from('listing_images').insert({ listing_id: listing.id, url: PHOTO_URL, is_cover: true, order: 0 }).select('listing_id, url')
    expect(added.error, 'the owner session adds a photo inside the project cloud').toBeNull()
    expect(added.data).toEqual([{ listing_id: listing.id, url: PHOTO_URL }])
    const stored = await run.admin.from('listing_images').select('url').eq('listing_id', listing.id)
    expect(stored.data, 'the photo is stored').toEqual([{ url: PHOTO_URL }])
  })

  it('[SEC-DB-X-IMAGE-URL-DENY] a foreign image is refused', async () => {
    const listing = await run.makeListing(person.id, 'pending', 'img-deny')
    for (const url of ['https://example.com/x.jpg', 'https://res.cloudinary.com/another-cloud/image/upload/v1/x.jpg']) {
      const refused = await person.client.from('listing_images').insert({ listing_id: listing.id, url, is_cover: false, order: 1 }).select('id')
      expect(refused.error?.code, `${url}: refused with a check violation`).toBe('23514')
      expect(refused.error?.message, `${url}: by the URL prefix constraint`).toContain('listing_images_url_prefix_check')
      expect(refused.data, `${url}: nothing returned`).toBeNull()
    }
    const stored = await run.admin.from('listing_images').select('url').eq('listing_id', listing.id)
    expect(stored.data, 'no foreign image address was stored').toEqual([])
  })

  /** a moderator key switched on for one case; the returned function puts the stored switch back exactly as it was */
  async function holdModeratorKey(key: string) {
    const prior = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', key).maybeSingle()
    expect(prior.error, 'the stored switch is readable').toBeNull()
    const set = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: key, allowed: true }, { onConflict: 'role,permission_key' })
    expect(set.error, 'the key is switched on for this case').toBeNull()
    return async () => {
      const restored = prior.data
        ? await run.admin.from('role_permissions').upsert(prior.data, { onConflict: 'role,permission_key' })
        : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', key)
      expect(restored.error, 'the stored switch is restored').toBeNull()
    }
  }

  it('[SEC-DB-X-AVATARS-STORAGE-ALLOW] the upload route still works', async () => {
    const moderator = await run.makeUser('avatar-mod', { role: 'moderator' })
    const target = await run.makeUser('avatar-target', { role: 'user' })
    const restoreKey = await holdModeratorKey('users.edit')
    try {
      acting.client = moderator.client
      acting.uploaded.length = 0
      /** a PNG signature and header that declare 256 by 256: what the route reads before it uploads */
      const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 1, 0, 0, 0, 1, 0])
      const form = new FormData()
      form.append('avatar', new File([png], 'a.png', { type: 'image/png' }))
      form.append('userId', target.id)
      const { POST } = await import('@/app/api/upload-avatar/route')
      const response = await POST(new NextRequest('http://localhost/api/upload-avatar', { method: 'POST', body: form }))
      expect(response.status, 'the route answers 200 for a moderator with the key').toBe(200)
      expect(await response.json()).toEqual({ url: 'https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-avatar.png' })
      expect(acting.uploaded, 'one upload, into the target account\'s folder').toEqual([`${target.id}/avatars`])
      const stored = await run.admin.from('users').select('avatar_url').eq('id', target.id).single()
      expect(stored.data?.avatar_url, 'the avatar address is stored on the target account').toBe('https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-avatar.png')
    } finally {
      await run.admin.from('users').update({ avatar_url: null }).eq('id', target.id)
      await restoreKey()
    }
  })

  it('[SEC-DB-X-AVATARS-STORAGE-DENY] a staff session cannot write to Storage', async () => {
    const moderator = await run.makeUser('storage-mod', { role: 'moderator' })
    const path = `${run.RUN}/storage-deny.png`
    storagePaths.push(path)
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
    const upload = await moderator.client.storage.from('avatars').upload(path, png, { contentType: 'image/png' })
    expect(upload.error, 'the Storage upload of a staff session is refused').not.toBeNull()
    expect(upload.error?.message, 'by row-level security').toMatch(/row-level security/i)
    expect(upload.data, 'no object path came back').toBeNull()
    const listed = await run.admin.storage.from('avatars').list(run.RUN)
    expect(listed.error).toBeNull()
    expect(listed.data?.map((object) => object.name), 'no object was stored in the avatars bucket').toEqual([])
  })

  it('[SEC-DB-X-PERMS-NO-SESSION] a browser session cannot touch the switches', async () => {
    const moderator = await run.makeUser('perms-mod', { role: 'moderator' })
    const tables = ['role_permissions', 'role_permission_events'] as const
    const countRows = async (table: (typeof tables)[number]) => (await run.admin.from(table).select('permission_key', { count: 'exact', head: true })).count
    const before = { role_permissions: await countRows('role_permissions'), role_permission_events: await countRows('role_permission_events') }
    const stray = `zz_synth_switch_${run.RUN}`
    try {
      for (const [who, client] of [['anon, no session', run.anonymousClient()], ['a moderator session', moderator.client]] as const) {
        for (const table of tables) {
          const select = await client.from(table).select('permission_key').limit(1)
          expect(select.error?.code, `${who}: select on ${table}`).toBe('42501')
          expect(select.data, `${who}: no row of ${table} came back`).toBeNull()
          const insert = await client.from(table).insert(table === 'role_permissions'
            ? { role: 'moderator', permission_key: stray, allowed: true }
            : { role: 'moderator', permission_key: stray, old_allowed: null, new_allowed: true })
          expect(insert.error?.code, `${who}: insert into ${table}`).toBe('42501')
          const update = await client.from(table).update(table === 'role_permissions' ? { allowed: true } : { new_allowed: true }).eq('permission_key', stray)
          expect(update.error?.code, `${who}: update of ${table}`).toBe('42501')
        }
      }
      expect(await countRows('role_permissions'), 'no switch row was added').toBe(before.role_permissions)
      expect(await countRows('role_permission_events'), 'no event row was added').toBe(before.role_permission_events)
    } finally {
      await run.admin.from('role_permissions').delete().eq('permission_key', stray)
      await run.admin.from('role_permission_events').delete().eq('permission_key', stray)
    }
  })
})
