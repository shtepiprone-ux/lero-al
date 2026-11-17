/**
 * Real-boundary control for the moderation of an edit (Task 923 R74, owner decision D53; cases SEC-X-INT-EDIT-MODERATION-ALLOW and -DENY): the REAL `updateListing`, with the REAL
 * `requireViewer`, the REAL status gateway and the REAL listing schema, runs against REAL Supabase Auth and the REAL database of the approved development project. The only doubles are
 * the cookie-bound client factory (outside a Next request it returns the client that holds the REAL session of the chosen synthetic person), the cache refresh and the Cloudinary
 * provider (the synthetic listings hold no image, so it is never called). A guest is a REAL anonymous client reading the table. The moderator key `listings.moderate` is switched on
 * for the length of the file and put back exactly as it was. Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-EDIT-MODERATION-ALLOW: a moderator's edit of an active listing keeps it public, and a guest reads the new content;
 *  - SEC-X-INT-EDIT-MODERATION-DENY: the owner's edit of an active listing hides it (pending): a guest reads no row until staff approve it, then the new content;
 *  - SEC-X-INT-EDIT-DIRECT-DENY / -ALLOW (Task 956 AC5, hardening v8b, finding DB-04): the owner's own SESSION cannot change the content of an ACTIVE listing straight through
 *    PostgREST (42501, the row unchanged), whatever column it names; it can change a listing that is not active, staff with the key can change an active one, and the application
 *    edit still moves the listing to review and writes the content.
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

  const storedOf = async (id: string) => (await run.admin.from('listings').select('title, description, price, address, listing_type, status').eq('id', id).single()).data

  it('[SEC-X-INT-EDIT-DIRECT-DENY] the owner session cannot change the content of an active listing, and the application edit still moderates', async () => {
    const listing = await run.makeListing(owner.id, 'active', 'edit-direct')
    const before = await storedOf(listing.id)
    expect(before?.status, 'precondition: the listing is active').toBe('active')

    // every content column the trigger must hold: refused with 42501, the stored row unchanged
    const attempts: [string, Record<string, unknown>][] = [
      ['the title', { title: `${run.RUN} direct title` }],
      ['the description', { description: 'direct description' }],
      ['the price', { price: 2000 }],
      ['the address', { address: 'direct address' }],
      ['the listing type', { listing_type: 'rent' }],
      ['the title and the description together', { title: `${run.RUN} direct title`, description: 'direct description' }],
    ]
    for (const [label, patch] of attempts) {
      const refused = await owner.client.from('listings').update(patch).eq('id', listing.id).select('id')
      expect(refused.error?.code, `${label}: refused with 42501`).toBe('42501')
      expect(refused.data, `${label}: nothing returned`).toBeNull()
    }
    expect(await storedOf(listing.id), 'the listing is unchanged').toEqual(before)

    // the application path is unchanged: the owner's edit moves the listing to review first, then writes the content
    acting.client = owner.client
    const retitled = `${run.RUN} moderated title`
    expect(await updateListing(listing.id, editWith(retitled)), 'the edit goes through moderation').toEqual({ slug: listing.slug, status: 'pending' })
    expect(await storedOf(listing.id)).toMatchObject({ title: retitled, status: 'pending' })
  })

  it('[SEC-X-INT-EDIT-DIRECT-ALLOW] a listing that is not active, and staff with the key, are not held to the rule', async () => {
    // the owner's session edits a listing that is waiting for review (the edit is already moderated: nobody reads it before approval)
    const pending = await run.makeListing(owner.id, 'pending', 'edit-direct-pending')
    const own = await owner.client.from('listings').update({ title: `${run.RUN} own pending edit` }).eq('id', pending.id).select('id, title')
    expect(own.error, 'the owner edits a pending listing').toBeNull()
    expect(own.data).toEqual([{ id: pending.id, title: `${run.RUN} own pending edit` }])

    // a moderator with listings.moderate (switched on for this file) edits another person's active listing directly
    const active = await run.makeListing(owner.id, 'active', 'edit-direct-staff')
    const staffEdit = await moderator.client.from('listings').update({ title: `${run.RUN} staff direct edit` }).eq('id', active.id).select('id, title')
    expect(staffEdit.error, 'staff edit an active listing').toBeNull()
    expect(staffEdit.data).toEqual([{ id: active.id, title: `${run.RUN} staff direct edit` }])
    expect(await statusOf(active.id), 'the status stays active').toBe('active')

    // the owner session sending the value the row already holds changes nothing (the trigger compares the rows, not the columns named), so nothing is refused
    const same = await owner.client.from('listings').update({ title: `${run.RUN} staff direct edit` }).eq('id', active.id).select('id')
    expect(same.error, 'an update that changes nothing is not refused').toBeNull()
  })
})
