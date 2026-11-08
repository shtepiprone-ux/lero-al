/**
 * Real-boundary control for the moderation of an edit (Task 923 R74, owner decision D53; cases SEC-X-INT-EDIT-MODERATION-ALLOW and -DENY): the REAL `updateListing`, with the REAL
 * `requireViewer`, the REAL status gateway and the REAL listing schema, runs against REAL Supabase Auth and the REAL database of the approved development project. The only doubles are
 * the cookie-bound client factory (outside a Next request it returns the client that holds the REAL session of the chosen synthetic person), the cache refresh and the Cloudinary
 * provider (the synthetic listings hold no image, so it is never called). A guest is a REAL anonymous client reading the table. The moderator key `listings.moderate` is switched on
 * for the length of the file and put back exactly as it was. Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-EDIT-MODERATION-ALLOW: a moderator's edit of an active listing keeps it public, and a guest reads the new content;
 *  - SEC-X-INT-EDIT-MODERATION-DENY: the owner's edit of an active listing hides it (pending): a guest reads no row until staff approve it, then the new content.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => ({ skipped: true, dryRun: false, deleted: false }) }))

import { updateListing } from './updateListing'
import { applyListingTransitionByStatus } from './applyListingTransition'

let run: Run
let owner: SyntheticUser
let moderator: SyntheticUser
let storedKey: Record<string, unknown> | null

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('edit-owner', { role: 'user' })
  moderator = await run.makeUser('edit-moderator', { role: 'moderator' })
  const row = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', 'listings.moderate').maybeSingle()
  expect(row.error, 'the stored switch is readable').toBeNull()
  storedKey = row.data
  const set = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: 'listings.moderate', allowed: true }, { onConflict: 'role,permission_key' })
  expect(set.error, 'the moderator key listings.moderate is switched on for this file').toBeNull()
})
afterAll(async () => {
  const restored = storedKey
    ? await run.admin.from('role_permissions').upsert(storedKey, { onConflict: 'role,permission_key' })
    : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', 'listings.moderate')
  expect(restored.error, 'the stored switch is restored').toBeNull()
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const editWith = (title: string) => ({ title, listing_type: 'sale' as const, property_type: 'apartment' as const, price: 95000, currency: 'EUR' as const, description: undefined, address: undefined, images: [] })
const guestRead = (id: string) => run.anonymousClient().from('listings').select('id, title').eq('id', id)
const statusOf = async (id: string) => (await run.admin.from('listings').select('status').eq('id', id).single()).data?.status

describe('updateListing', () => {
  it('[SEC-X-INT-EDIT-MODERATION-ALLOW] a staff edit keeps the listing public', async () => {
    const listing = await run.makeListing(owner.id, 'active', 'edit-staff')
    const retitled = `${run.RUN} staff retitled`
    expect((await guestRead(listing.id)).data, 'precondition: a guest reads the active listing').toEqual([{ id: listing.id, title: `${run.RUN} edit-staff` }])

    acting.client = moderator.client
    const answer = await updateListing(listing.id, editWith(retitled))
    expect(answer, 'the moderator\'s edit is accepted and the status stays active').toEqual({ slug: listing.slug, status: 'active' })
    expect(await statusOf(listing.id)).toBe('active')
    const seen = await guestRead(listing.id)
    expect(seen.error).toBeNull()
    expect(seen.data, 'the guest reads the new content at once').toEqual([{ id: listing.id, title: retitled }])
  })

  it('[SEC-X-INT-EDIT-MODERATION-DENY] an owner edit hides the listing until staff approve', async () => {
    const listing = await run.makeListing(owner.id, 'active', 'edit-owner')
    const retitled = `${run.RUN} owner retitled`
    acting.client = owner.client
    const answer = await updateListing(listing.id, editWith(retitled))
    expect(answer, 'the owner\'s edit of an active listing moves it to review').toEqual({ slug: listing.slug, status: 'pending' })
    expect(await statusOf(listing.id)).toBe('pending')

    const hidden = await guestRead(listing.id)
    expect(hidden.error, 'a refused read is an empty answer, not an error').toBeNull()
    expect(hidden.data, 'the guest reads no row, and so never the edited content, before the approval').toEqual([])

    const staff = await run.makeUser('edit-approver', { role: 'admin' })
    expect(await applyListingTransitionByStatus(listing.id, 'active', { userId: staff.id, role: 'admin', source: 'admin_panel' }), 'staff approve the edit').toEqual({ ok: true, nextStatus: 'active', listingId: listing.id })
    expect((await guestRead(listing.id)).data, 'after the approval the guest reads the new content').toEqual([{ id: listing.id, title: retitled }])
  })
})
