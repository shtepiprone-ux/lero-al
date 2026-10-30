/**
 * Real-boundary control for the restricted listing page (Task 923 R103, D72): the REAL `getListingAccessState` with the REAL admin client, and REAL Supabase Auth sessions of
 * synthetic people, on the one project (D66, D67). Rows are `zz_synth_` listings of this run with verified clean-up.
 *  - SEC-X-INT-RESTRICTED-STATE-DENY: the helper names a hidden listing `hidden` and nothing more, while a guest and a signed-in stranger read no row of it;
 *  - SEC-X-INT-RESTRICTED-STATE-ALLOW: the owner's session reads both hidden listings, and the helper tells a public listing (`public`) from a slug that does not exist (`missing`).
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
})
