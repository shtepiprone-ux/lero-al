/**
 * Real-boundary control for the database twin of the photo check (Task 957 AC4): the trigger `listing_images_owner_folder` on `public.listing_images` refuses a photo outside the
 * listing OWNER's folder, whatever the writer's client: an owner's own session going straight through PostgREST.
 *  - SEC-LISTINGIMG-INT-ALLOW: the owner inserts and updates a photo under `<owner>/listings/` (and `<owner>/listings/<listing>/`);
 *  - SEC-LISTINGIMG-INT-DENY: the owner's insert and update of `url` into another account's folder, into the cloud root, and into `<owner>x/listings/` fail with 42501 and the stored row is
 *    unchanged; moving a photo to a listing of another owner (`listing_id` update) fails too.
 * Needs the SQL of `supabase/sql_migrations/task957/task957.sql` applied by the owner. Synthetic rows only, verified clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let owner: SyntheticUser
let stranger: SyntheticUser
let ownListing: { id: string }
let otherListing: { id: string }

// the cloud of the project: the CHECK `listing_images_url_prefix_check` pins it (supabase/catalog.json)
const CLOUD = 'die7okukn'
const url = (folder: string, name = 'photo') => `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${folder}/${run.RUN}-${name}.jpg`

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('image-owner', { role: 'user' })
  stranger = await run.makeUser('image-stranger', { role: 'user' })
  ownListing = await run.makeListing(owner.id, 'pending', 'image-own')
  otherListing = await run.makeListing(stranger.id, 'pending', 'image-other')
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const stored = async (id: string) => (await run.admin.from('listing_images').select('url, listing_id').eq('id', id).single()).data

describe('listing_images_owner_folder', () => {
  it('[SEC-LISTINGIMG-INT-ALLOW] the owner inserts and updates photos under its own folder', async () => {
    const inserted = await owner.client.from('listing_images').insert({ listing_id: ownListing.id, url: url(`${owner.id}/listings`), is_cover: true, order: 0 }).select('id').single()
    expect(inserted.error).toBeNull()
    const nested = await owner.client.from('listing_images').insert({ listing_id: ownListing.id, url: url(`${owner.id}/listings/${ownListing.id}`, 'nested'), is_cover: false, order: 1 }).select('id').single()
    expect(nested.error).toBeNull()
    const moved = await owner.client.from('listing_images').update({ url: url(`${owner.id}/listings`, 'moved') }).eq('id', inserted.data!.id).select('id')
    expect(moved.error).toBeNull()
    expect(moved.data).toHaveLength(1)
  })

  it.each([
    ['another account folder', () => `${stranger.id}/listings`],
    ['a folder that only starts like the owner folder', () => `${owner.id}x/listings`],
    ['the owner avatars folder', () => `${owner.id}/avatars`],
    ['a .. segment', () => `${stranger.id}/../${owner.id}/listings`],
  ])('[SEC-LISTINGIMG-INT-DENY] a direct insert into %s fails with 42501', async (_label, folder) => {
    const address = url(folder(), 'denied')
    const refused = await owner.client.from('listing_images').insert({ listing_id: ownListing.id, url: address, is_cover: false, order: 9 }).select('id')
    expect(refused.error?.code).toBe('42501')
    const left = await run.admin.from('listing_images').select('id').eq('url', address)
    expect(left.data).toEqual([])
  })

  it('[SEC-LISTINGIMG-INT-DENY] a direct insert at the cloud root fails with 42501', async () => {
    const address = `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${run.RUN}-root.jpg`
    const refused = await owner.client.from('listing_images').insert({ listing_id: ownListing.id, url: address, is_cover: false, order: 9 }).select('id')
    expect(refused.error?.code).toBe('42501')
  })

  it('[SEC-LISTINGIMG-INT-DENY] a direct update of url into another folder fails with 42501 and the row is unchanged', async () => {
    const own = await owner.client.from('listing_images').insert({ listing_id: ownListing.id, url: url(`${owner.id}/listings`, 'update-me'), is_cover: false, order: 2 }).select('id').single()
    expect(own.error).toBeNull()
    const before = await stored(own.data!.id)
    const refused = await owner.client.from('listing_images').update({ url: url(`${stranger.id}/listings`, 'stolen') }).eq('id', own.data!.id).select('id')
    expect(refused.error?.code).toBe('42501')
    expect(await stored(own.data!.id)).toEqual(before)
  })

  it('[SEC-LISTINGIMG-INT-DENY] moving a photo to a listing of another owner is refused, for the service role too (the trigger checks the row, not the caller)', async () => {
    const own = await owner.client.from('listing_images').insert({ listing_id: ownListing.id, url: url(`${owner.id}/listings`, 'move-me'), is_cover: false, order: 3 }).select('id').single()
    expect(own.error).toBeNull()
    const refused = await run.admin.from('listing_images').update({ listing_id: otherListing.id }).eq('id', own.data!.id).select('id')
    expect(refused.error?.code).toBe('42501')
    expect((await stored(own.data!.id))?.listing_id).toBe(ownListing.id)
  })
})
