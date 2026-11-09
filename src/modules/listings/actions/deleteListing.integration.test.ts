/**
 * Real-boundary control for the owner's delete (Task 923 R71 (l), S27; cases SEC-X-INT-OWNER-DELETE-ALLOW and -DENY): the REAL `deleteListingAction`, with the REAL
 * `requireViewer`, block check and permission check, runs against REAL Supabase Auth and the REAL database of the approved development project. The doubles are the cookie-bound
 * client factory (outside a Next request it returns the client that holds the REAL session of the chosen synthetic person), the cache refresh and the Cloudinary provider (the
 * synthetic listings hold no image, so it is never called). Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-OWNER-DELETE-ALLOW: the owner deletes their listing: success, and exactly that row is gone;
 *  - SEC-X-INT-OWNER-DELETE-DENY: another signed-in person is refused with `forbidden`: success is not reported and the row remains.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown, released: [] as string[] }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async (publicId: string) => { acting.released.push(publicId); return { skipped: true, dryRun: false, deleted: false } } }))

import { deleteListingAction } from './deleteListing'

let run: Run
let owner: SyntheticUser
let stranger: SyntheticUser

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('delete-owner', { role: 'user' })
  stranger = await run.makeUser('delete-stranger', { role: 'user' })
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const rowsOf = async (...ids: string[]) => (await run.admin.from('listings').select('id').in('id', ids)).data?.map((row) => row.id as string).sort() ?? []

describe('deleteListing', () => {
  it('[SEC-X-INT-OWNER-DELETE-ALLOW] owner-delete allowed on the real project', async () => {
    const mine = await run.makeListing(owner.id, 'active', 'delete-mine')
    const alsoMine = await run.makeListing(owner.id, 'active', 'delete-also-mine')
    acting.client = owner.client
    expect(await rowsOf(mine.id, alsoMine.id), 'precondition: both listings exist').toEqual([mine.id, alsoMine.id].sort())

    expect(await deleteListingAction(mine.id), 'the owner deletes their listing').toEqual({})
    expect(await rowsOf(mine.id, alsoMine.id), 'exactly that listing is gone: the other one of the same owner remains').toEqual([alsoMine.id])
  })

  it('[SEC-X-INT-OWNER-DELETE-DENY] owner-delete refused on the real project', async () => {
    const theirs = await run.makeListing(owner.id, 'active', 'delete-theirs')
    acting.client = stranger.client
    acting.released.length = 0

    expect(await deleteListingAction(theirs.id), 'another signed-in person is refused, not told "ok"').toEqual({ error: 'forbidden' })
    expect(await rowsOf(theirs.id), 'the listing remains').toEqual([theirs.id])
    expect(acting.released, 'no file of the listing was released').toEqual([])

    // a guest is refused as well, and the row still remains
    acting.client = run.anonymousClient()
    expect(await deleteListingAction(theirs.id)).toEqual({ error: 'unauthenticated' })
    expect(await rowsOf(theirs.id), 'the listing remains after the guest\'s call').toEqual([theirs.id])
  })
})
