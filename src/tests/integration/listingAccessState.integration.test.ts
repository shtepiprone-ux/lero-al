/**
 * Real-boundary control for the restricted listing page (Task 923 R103, D72): the REAL `getListingAccessState` with the REAL admin client, and REAL Supabase Auth sessions of
 * synthetic people, on the one project (D66, D67). Rows are `zz_synth_` listings of this run with verified clean-up.
 *  - SEC-X-INT-RESTRICTED-STATE-DENY: the helper names a hidden listing `hidden` and nothing more, while a guest and a signed-in stranger read no row of it;
 *  - SEC-X-INT-RESTRICTED-STATE-ALLOW: the owner's session reads both hidden listings, and the helper tells a public listing (`public`) from a slug that does not exist (`missing`).
 *  - SEC-X-INT-PUBLIC-RULE-DENY / -ALLOW (Task 956 AC6, hardening v8b, finding DB-08): ONE public rule, in the database policy and in the helper: an active listing until its expiry,
 *    a sold or rented listing (whatever its expiry), and the owner's own listing. A guest and a signed-in stranger read no active listing whose expiry passed or is missing, and no
 *    archived one; the helper names those `hidden` and the closed ones `public`.
 *  - SEC-X-INT-VIEW-COUNTER-DENY / -ALLOW (Review 3, F7): the view counter `record_listing_view` asks the same rule: no view is counted for an archived listing or an active one past its
 *    expiry or with none, one is counted for an active listing that has not expired and for a sold listing past its expiry.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getListingAccessState } from '@/modules/listings/lib/listingAccessState'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let owner: SyntheticUser
let stranger: SyntheticUser
let archived: { id: string; slug: string }
let pending: { id: string; slug: string }
let active: { id: string; slug: string }

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('access-owner', { role: 'user' })
  stranger = await run.makeUser('access-stranger', { role: 'user' })
  archived = await run.makeListing(owner.id, 'archived', 'access-archived')
  pending = await run.makeListing(owner.id, 'pending', 'access-pending')
  active = await run.makeListing(owner.id, 'active', 'access-active')
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

describe('listingAccessState', () => {
  it('[SEC-X-INT-RESTRICTED-STATE-DENY] a hidden listing is only named hidden, and visitors read none of it', async () => {
    for (const [status, row] of [['archived', archived], ['pending', pending]] as const) {
      // the helper names the listing and returns nothing else: the answer is exactly that one word
      const answer = await getListingAccessState(row.slug)
      expect(answer, `${status}: the helper answers exactly hidden`).toBe('hidden')
      expect(typeof answer, `${status}: the answer is a plain string, not an object with listing fields`).toBe('string')

      // the same listing is not readable by a guest or by a signed-in stranger: a refusal is an empty answer, not an error
      for (const [who, client] of [['a guest (anon, no session)', run.anonymousClient()], ['a signed-in stranger', stranger.client]] as const) {
        const read = await client.from('listings').select('id, status, slug, title').eq('slug', row.slug)
        expect(read.error, `${who}: the ${status} listing: a refusal is an empty answer, not an error`).toBeNull()
        expect(read.data, `${who}: the ${status} listing is not readable`).toEqual([])
      }
    }

    // the positive control: the rows exist, so the empty answers above are refusals and not missing rows
    const stored = await run.admin.from('listings').select('id', { count: 'exact', head: true }).in('id', [archived.id, pending.id])
    expect(stored.error).toBeNull()
    expect(stored.count, 'precondition: both hidden listings exist').toBe(2)
  })

  it('[SEC-X-INT-RESTRICTED-STATE-ALLOW] the owner reads their hidden listing and the helper tells public from missing', async () => {
    // the owner's own session reads both hidden listings
    for (const [status, row] of [['archived', archived], ['pending', pending]] as const) {
      const read = await owner.client.from('listings').select('id, status').eq('slug', row.slug)
      expect(read.error, `owner: the ${status} listing: no error`).toBeNull()
      expect(read.data, `owner: the ${status} listing is readable`).toEqual([{ id: row.id, status }])
    }

    // a public listing is public, and a slug that does not exist is missing
    expect(await getListingAccessState(active.slug), 'an active listing').toBe('public')
    expect(await getListingAccessState(`${run.RUN}-no-such-listing`), 'a slug that does not exist').toBe('missing')
  })

  const inDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString()
  const expiryOf = async (id: string, expires_at: string | null) => {
    // the service role sets the expiry (a session cannot: the guard of hardening v7 protects the column)
    const set = await run.admin.from('listings').update({ expires_at }).eq('id', id)
    expect(set.error, 'precondition: the expiry is set').toBeNull()
  }

  it('[SEC-X-INT-PUBLIC-RULE-DENY] no visitor reads an active listing past its expiry or with none, and no archived listing', async () => {
    const lapsed = await run.makeListing(owner.id, 'active', 'rule-lapsed')
    const open = await run.makeListing(owner.id, 'active', 'rule-open')
    const unlimited = await run.makeListing(owner.id, 'active', 'rule-null')
    await expiryOf(lapsed.id, inDays(-1))
    await expiryOf(unlimited.id, null)
    // a photo of each hidden listing (an address inside the project's Cloudinary cloud, as the CHECK on `listing_images.url` requires, and in the owner's folder, as the trigger `listing_images_owner_folder` requires): the photo policy follows the listing policy
    for (const row of [lapsed, unlimited, archived]) {
      const photo = await run.admin.from('listing_images').insert({ listing_id: row.id, url: `https://res.cloudinary.com/die7okukn/image/upload/v1/${owner.id}/listings/zz-synth-photo.jpg`, is_cover: true, order: 0 })
      expect(photo.error, 'precondition: a photo of the hidden listing exists').toBeNull()
    }
    const stranger2 = await run.makeUser('rule-stranger', { role: 'user' })

    for (const [who, client] of [['a guest (anon, no session)', run.anonymousClient()], ['a signed-in stranger', stranger2.client]] as const) {
      const read = await client.from('listings').select('id').in('id', [lapsed.id, open.id, unlimited.id, archived.id])
      expect(read.error, `${who}: the read is not an error`).toBeNull()
      expect((read.data ?? []).map((row) => row.id as string), `${who}: only the active listing that has not expired is readable`).toEqual([open.id])
      // the photo and the other rows that follow the listing policy are not readable either
      const photos = await client.from('listing_images').select('listing_id').in('listing_id', [lapsed.id, unlimited.id, archived.id])
      expect(photos.error).toBeNull()
      expect(photos.data, `${who}: nothing that belongs to a hidden listing is readable`).toEqual([])
    }
    // the helper agrees with the policy
    expect(await getListingAccessState(lapsed.slug), 'an active listing past its expiry').toBe('hidden')
    expect(await getListingAccessState(unlimited.slug), 'an active listing with no expiry').toBe('hidden')
    expect(await getListingAccessState(open.slug), 'an active listing that has not expired').toBe('public')
    expect(await getListingAccessState(archived.slug), 'an archived listing').toBe('hidden')
  })

  it('[SEC-X-INT-PUBLIC-RULE-ALLOW] sold and rented listings are readable whatever their expiry, and the owner reads their own expired listing', async () => {
    const sold = await run.makeListing(owner.id, 'sold', 'rule-sold')
    const rented = await run.makeListing(owner.id, 'rented', 'rule-rented')
    const lapsed = await run.makeListing(owner.id, 'active', 'rule-own-lapsed')
    await expiryOf(sold.id, inDays(-30))
    await expiryOf(rented.id, null)
    await expiryOf(lapsed.id, inDays(-1))
    const stranger2 = await run.makeUser('rule-allow-stranger', { role: 'user' })

    for (const [who, client] of [['a guest (anon, no session)', run.anonymousClient()], ['a signed-in stranger', stranger2.client]] as const) {
      const read = await client.from('listings').select('id, status').in('id', [sold.id, rented.id, lapsed.id])
      expect(read.error, `${who}: the read is not an error`).toBeNull()
      expect((read.data ?? []).map((row) => row.status as string).sort(), `${who}: the sold and the rented listing are readable, the lapsed active one is not`).toEqual(['rented', 'sold'])
    }
    // the owner reads all three, the lapsed one included
    const own = await owner.client.from('listings').select('id').in('id', [sold.id, rented.id, lapsed.id])
    expect(own.error).toBeNull()
    expect((own.data ?? []).map((row) => row.id as string).sort(), 'the owner reads every one of their own listings').toEqual([sold.id, rented.id, lapsed.id].sort())
    expect(await getListingAccessState(sold.slug), 'a sold listing past its expiry').toBe('public')
    expect(await getListingAccessState(rented.slug), 'a rented listing with no expiry').toBe('public')
  })

  // Review 3, F7: the view counter `public.record_listing_view` asks the same rule. The service role calls it, as the view route does after its own check; the function itself must also
  // refuse a listing the rule closes (an archived one, an active one past its expiry or with none), so that no path counts a view of a closed listing.
  const counterOf = async (id: string) => ({
    views: (await run.admin.from('listings').select('views_count').eq('id', id).single()).data?.views_count as number,
    rows: (await run.admin.from('listing_views').select('id', { count: 'exact', head: true }).eq('listing_id', id)).count,
  })
  const countView = (id: string, tag: string) => run.admin.rpc('record_listing_view', { p_listing_id: id, p_user_id: null, p_ip_hash: `${run.RUN}-${tag}` })

  it('[SEC-X-INT-VIEW-COUNTER-DENY] no view is counted for an archived listing, or for an active one past its expiry or with none', async () => {
    const lapsed = await run.makeListing(owner.id, 'active', 'count-lapsed')
    const unlimited = await run.makeListing(owner.id, 'active', 'count-null')
    const closed = await run.makeListing(owner.id, 'archived', 'count-archived')
    await expiryOf(lapsed.id, inDays(-1))
    await expiryOf(unlimited.id, null)
    for (const [label, row] of [['an active listing past its expiry', lapsed], ['an active listing with no expiry', unlimited], ['an archived listing', closed]] as const) {
      const before = await counterOf(row.id)
      const answer = await countView(row.id, row.slug)
      expect(answer.error, `${label}: the function answers`).toBeNull()
      expect(answer.data, `${label}: the view is not counted`).toBe(false)
      expect(await counterOf(row.id), `${label}: no view row, no increment`).toEqual(before)
    }
  })

  it('[SEC-X-INT-VIEW-COUNTER-ALLOW] a view is counted for an active listing that has not expired and for a sold listing past its expiry', async () => {
    const open = await run.makeListing(owner.id, 'active', 'count-open')
    const sold = await run.makeListing(owner.id, 'sold', 'count-sold')
    await expiryOf(sold.id, inDays(-30))
    for (const [label, row] of [['an active listing that has not expired', open], ['a sold listing past its expiry', sold]] as const) {
      const before = await counterOf(row.id)
      const answer = await countView(row.id, row.slug)
      expect(answer.error, `${label}: the function answers`).toBeNull()
      expect(answer.data, `${label}: the view is counted`).toBe(true)
      expect(await counterOf(row.id), `${label}: one view row and one increment`).toEqual({ views: before.views + 1, rows: (before.rows ?? 0) + 1 })
    }
  })
})
