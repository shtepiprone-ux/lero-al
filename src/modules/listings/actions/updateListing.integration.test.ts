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
 *  - Task 962 (hardening v8b part 2), on the direct path of the owner's own SESSION: SEC-962-PRICE-CEILING-DENY / -ALLOW (AC3, the per-currency price ceiling), SEC-962-CATALOGUE-DENY / -ALLOW (AC4, a property
 *    type or currency the staff switched off; the switch-off is made by the service role for one case at a time and restored in `finally`, owner decision D91) and SEC-962-ACTIVE-PHOTOS-DENY / -ALLOW
 *    (AC5, the photos of an ACTIVE listing: refused to the owner's session, still written by the application edit, by `deleteListingAction`, on a pending listing and by a holder of `listings.moderate`).
 *    The Task 962 DENY cases need `supabase/sql_migrations/task962/v8b2.sql` applied by the owner: before it they FAIL.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => ({ skipped: true, dryRun: false, deleted: false }) }))

import { updateListing } from './updateListing'
import { deleteListingAction } from './deleteListing'
import { applyListingTransitionByStatus } from './applyListingTransition'

let run: Run
let owner: SyntheticUser
let moderator: SyntheticUser
let storedKey: Record<string, unknown> | null
/** listings the owner's SESSION inserted itself (Task 962): their slug is plain, so the run prefix cannot find them; they are removed by id and counted in afterAll */
const sessionListingIds: string[] = []
/** `is_active` of the two catalogues before any case: a case that switches a row off puts it back, and afterAll proves it */
let cataloguesBefore: { types: unknown; currencies: unknown }
const readCatalogues = async () => ({
  types: (await run.admin.from('property_types').select('slug, is_active').order('slug')).data,
  currencies: (await run.admin.from('currencies').select('code, is_active').order('code')).data,
})

beforeAll(async () => {
  run = createRun()
  cataloguesBefore = await readCatalogues()
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
  // everything is removed first and asserted after, so one failed check never leaves a synthetic row behind
  if (sessionListingIds.length) await run.admin.from('listings').delete().in('id', sessionListingIds)
  const leftListings = sessionListingIds.length ? await run.admin.from('listings').select('id').in('id', sessionListingIds) : { data: [], error: null }
  const result = await run.cleanup()
  const cataloguesAfter = await readCatalogues()
  expect(restored.error, 'the stored switch is restored').toBeNull()
  expect(leftListings.error).toBeNull()
  expect(leftListings.data, 'no listing inserted by a session is left').toEqual([])
  expect(cataloguesAfter, 'no catalogue row is left switched off: both catalogues are as they were before the file').toEqual(cataloguesBefore)
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

  // Task 957 (AC3): a photo from the folder of another account is refused by the action, for the owner and for staff; the photo from the folder of the listing OWNER is accepted (also in a staff edit)
  it('[SEC-UPLOAD-OWNER-DENY] a photo from the folder of another account answers invalid_image, for the owner and for staff, and the stored gallery is unchanged', async () => {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'die7okukn'
    const photo = (folderOwner: string) => ({ url: `https://res.cloudinary.com/${cloud}/image/upload/v1/${folderOwner}/listings/${run.RUN}.jpg`, public_id: 'x', is_cover: true, order: 0 })
    const listing = await run.makeListing(owner.id, 'pending', 'edit-photo-owner')
    const stranger = await run.makeUser('edit-photo-stranger', { role: 'user' })

    acting.client = owner.client
    const foreign = await updateListing(listing.id, { ...editWith(`${run.RUN} foreign photo`), images: [photo(stranger.id)] })
    expect(foreign, 'the owner cannot attach a photo of another account').toEqual({ error: 'invalid_image' })

    acting.client = moderator.client
    const staffForeign = await updateListing(listing.id, { ...editWith(`${run.RUN} foreign photo staff`), images: [photo(moderator.id)] })
    expect(staffForeign, 'a staff edit is held to the folder of the LISTING OWNER, not of the editor').toEqual({ error: 'invalid_image' })
    expect((await run.admin.from('listing_images').select('id').eq('listing_id', listing.id)).data).toEqual([])

    const staffOwn = await updateListing(listing.id, { ...editWith(`${run.RUN} owner photo staff`), images: [photo(owner.id)] })
    expect(staffOwn, 'the photo from the folder of the listing owner is accepted').toMatchObject({ slug: listing.slug })
    expect((await run.admin.from('listing_images').select('url').eq('listing_id', listing.id)).data).toEqual([{ url: photo(owner.id).url }])
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

  // Review 4 F28, owner decision O957-13 ("Clear in the database"): what the payload leaves empty is stored empty. An underground parking (floor -2) edited to a city parking would break
  // `listings_parking_floor_check` if its floor stayed; the heating the owner cleared must not come back. Needs `task957-parking.sql` applied (the owner's step).
  it('[INT-EDIT-EMPTIED] an edit from (underground, -2) to (city) and then to no parking saves and stores what was sent; an emptied optional field is stored empty', async () => {
    const listing = await run.makeListing(owner.id, 'pending', 'edit-emptied')
    const seeded = await run.admin.from('listings').update({ parking_type: 'underground', parking_floor: -2, heating: 'gas', rooms: 3, description: 'to be cleared' }).eq('id', listing.id)
    expect(seeded.error, 'precondition: the parking columns exist and hold (underground, -2)').toBeNull()
    const stored = async () => (await run.admin.from('listings').select('parking_type, parking_floor, heating, rooms, description, purchase_conditions').eq('id', listing.id).single()).data

    acting.client = owner.client
    const toCity = await updateListing(listing.id, { ...editWith(`${run.RUN} emptied city`), parking_type: 'city' })
    expect(toCity, 'the edit to a city parking is saved').toEqual({ slug: listing.slug, status: 'pending' })
    expect(await stored(), 'the floor and every emptied field are stored empty').toEqual({ parking_type: 'city', parking_floor: null, heating: null, rooms: null, description: null, purchase_conditions: [] })

    const toNone = await updateListing(listing.id, editWith(`${run.RUN} emptied none`))
    expect(toNone, 'the edit to no parking is saved').toEqual({ slug: listing.slug, status: 'pending' })
    expect((await stored())?.parking_type, 'no parking kind is stored').toBeNull()
    expect((await stored())?.parking_floor, 'no floor is stored').toBeNull()
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

// ── Task 962 (hardening v8b part 2): the rules the code already relies on, on the direct path of the owner's own SESSION ───────────────────────────────────────────────────────────────
const plainSlug = (tag: string) => `${run.RUN.replace(/_/g, '').toLowerCase()}-${tag}`
const inDays = (days: number) => new Date(Date.now() + days * 864e5).toISOString()
/** a pending listing row as the owner's SESSION may insert it: the guard of hardening v7 accepts exactly this shape (a plain slug, pending, no counters) */
const ownPending = (tag: string, values: Record<string, unknown> = {}) => ({
  user_id: owner.id, slug: plainSlug(tag), title: `${run.RUN} ${tag}`, price: 1000, listing_type: 'sale', property_type: 'apartment',
  status: 'pending', expires_at: inDays(30), views_count: 0, ...values,
})
/** the owner's session inserts a listing; a row that was stored is tracked by id and removed in afterAll */
async function insertAsOwner(tag: string, values: Record<string, unknown> = {}) {
  const answer = await owner.client.from('listings').insert(ownPending(tag, values)).select('id')
  for (const row of answer.data ?? []) sessionListingIds.push(row.id as string)
  return answer
}
const listingOf = async (id: string) => (await run.admin.from('listings').select('price, currency, property_type').eq('id', id).single()).data

describe('hardening v8b part 2: the price ceiling and the active catalogue', () => {
  it('[SEC-962-PRICE-CEILING-DENY] a price past the ceiling of its currency is refused on the direct path, for an insert and an update', async () => {
    const pending = await run.makeListing(owner.id, 'pending', 'ceiling-deny')
    const before = await listingOf(pending.id)
    const refusals: [string, Record<string, unknown>][] = [
      ['EUR 10 000 000 001', { currency: 'EUR', price: 10_000_000_001 }],
      ['ALL 1 000 000 000 001', { currency: 'ALL', price: 1_000_000_000_001 }],
      ['EUR 20 000 000 000 (a price only ALL may carry)', { currency: 'EUR', price: 20_000_000_000 }],
    ]
    for (const [label, patch] of refusals) {
      const updated = await owner.client.from('listings').update(patch).eq('id', pending.id).select('id')
      expect(updated.error?.code, `update to ${label}: refused with 23514`).toBe('23514')
      expect(updated.error?.message, `update to ${label}: by the constraint`).toContain('listings_price_ceiling_check')
      expect(updated.data, `update to ${label}: nothing returned`).toBeNull()
    }
    const inserted = await insertAsOwner('ceiling-deny-insert', { currency: 'EUR', price: 10_000_000_001 })
    expect(inserted.error?.code, 'insert of EUR 10 000 000 001: refused with 23514').toBe('23514')
    expect(inserted.error?.message, 'insert: by the constraint').toContain('listings_price_ceiling_check')
    expect(await listingOf(pending.id), 'the listing is unchanged').toEqual(before)
  })

  it('[SEC-962-PRICE-CEILING-ALLOW] a price on the ceiling of its currency is stored', async () => {
    const pending = await run.makeListing(owner.id, 'pending', 'ceiling-allow')
    for (const [currency, price] of [['EUR', 10_000_000_000], ['ALL', 1_000_000_000_000], ['ALL', 20_000_000_000]] as const) {
      const updated = await owner.client.from('listings').update({ currency, price }).eq('id', pending.id).select('currency, price')
      expect(updated.error, `update to ${currency} ${price}: stored`).toBeNull()
      expect(updated.data).toEqual([{ currency, price }])
    }
    const inserted = await insertAsOwner('ceiling-allow-insert', { currency: 'EUR', price: 10_000_000_000 })
    expect(inserted.error, 'insert of EUR 10 000 000 000: stored').toBeNull()
  })

  /** switches ONE catalogue row off with the service role for the length of `body` and puts the stored value back in `finally` (owner decision D91: one break at a time, restored) */
  async function withSwitchedOff<T>(table: 'property_types' | 'currencies', column: 'slug' | 'code', value: string, body: () => Promise<T>): Promise<T> {
    const prior = await run.admin.from(table).select('is_active').eq(column, value).single()
    expect(prior.error, `precondition: ${table} ${value} is readable`).toBeNull()
    try {
      const off = await run.admin.from(table).update({ is_active: false }).eq(column, value)
      expect(off.error, `${table} ${value} is switched off by the service role for this case`).toBeNull()
      return await body()
    } finally {
      const back = await run.admin.from(table).update({ is_active: prior.data?.is_active ?? true }).eq(column, value)
      expect(back.error, `${table} ${value} is restored`).toBeNull()
    }
  }

  it('[SEC-962-CATALOGUE-DENY] a property type or a currency the staff switched off is refused on the direct path, for an insert and an update', async () => {
    const pending = await run.makeListing(owner.id, 'pending', 'catalogue-deny')
    const before = await listingOf(pending.id)

    await withSwitchedOff('property_types', 'slug', 'room', async () => {
      const inserted = await insertAsOwner('catalogue-deny-room', { property_type: 'room' })
      expect(inserted.error?.code, 'insert of the switched-off type room: refused with 23514').toBe('23514')
      expect(inserted.error?.message, 'insert: the property type is named').toMatch(/property type/i)
      expect(inserted.data, 'insert: nothing returned').toBeNull()
      const updated = await owner.client.from('listings').update({ property_type: 'room' }).eq('id', pending.id).select('id')
      expect(updated.error?.code, 'update to the switched-off type room: refused with 23514').toBe('23514')
      expect(updated.error?.message, 'update: the property type is named').toMatch(/property type/i)
      expect(updated.data, 'update: nothing returned').toBeNull()
    })

    await withSwitchedOff('currencies', 'code', 'EUR', async () => {
      const inserted = await insertAsOwner('catalogue-deny-eur', { currency: 'EUR' })
      expect(inserted.error?.code, 'insert of the switched-off currency EUR: refused with 23514').toBe('23514')
      expect(inserted.error?.message, 'insert: the currency is named').toMatch(/currency/i)
      expect(inserted.data, 'insert: nothing returned').toBeNull()
      const updated = await owner.client.from('listings').update({ currency: 'EUR' }).eq('id', pending.id).select('id')
      expect(updated.error?.code, 'update to the switched-off currency EUR: refused with 23514').toBe('23514')
      expect(updated.error?.message, 'update: the currency is named').toMatch(/currency/i)
      expect(updated.data, 'update: nothing returned').toBeNull()
    })

    expect(await listingOf(pending.id), 'the listing is unchanged').toEqual(before)
  })

  it('[SEC-962-CATALOGUE-ALLOW] an active property type and an active currency are stored, also while another row of the catalogue is switched off', async () => {
    const pending = await run.makeListing(owner.id, 'pending', 'catalogue-allow')
    await withSwitchedOff('property_types', 'slug', 'room', async () => {
      const inserted = await insertAsOwner('catalogue-allow-house', { property_type: 'house' })
      expect(inserted.error, 'insert of the active type house while room is off: stored').toBeNull()
      const updated = await owner.client.from('listings').update({ property_type: 'land' }).eq('id', pending.id).select('property_type')
      expect(updated.error, 'update to the active type land while room is off: stored').toBeNull()
      expect(updated.data).toEqual([{ property_type: 'land' }])
    })
    await withSwitchedOff('currencies', 'code', 'EUR', async () => {
      const updated = await owner.client.from('listings').update({ currency: 'ALL' }).eq('id', pending.id).select('currency')
      expect(updated.error, 'update to the active currency ALL while EUR is off: stored').toBeNull()
      expect(updated.data).toEqual([{ currency: 'ALL' }])
    })
    // every row active again: the switched-off values are accepted
    const inserted = await insertAsOwner('catalogue-allow-room', { property_type: 'room', currency: 'EUR' })
    expect(inserted.error, 'insert of room and EUR with both active: stored').toBeNull()
    const updated = await owner.client.from('listings').update({ property_type: 'room', currency: 'EUR' }).eq('id', pending.id).select('property_type, currency')
    expect(updated.error, 'update to room and EUR with both active: stored').toBeNull()
    expect(updated.data).toEqual([{ property_type: 'room', currency: 'EUR' }])
  })
})

describe('hardening v8b part 2: the photos of an active listing', () => {
  const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'die7okukn'
  const photoUrl = (folderOwner: string, name: string) => `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${folderOwner}/listings/${run.RUN}-${name}.jpg`
  const gallery = async (listingId: string) => (await run.admin.from('listing_images').select('id, listing_id, url, is_cover, order').eq('listing_id', listingId).order('order')).data
  /** a photo written by the service role (the preparation is not the case under test), in the folder of the listing owner */
  async function seedPhoto(listingId: string, folderOwner: string, name: string, order = 0): Promise<string> {
    const seeded = await run.admin.from('listing_images').insert({ listing_id: listingId, url: photoUrl(folderOwner, name), is_cover: order === 0, order }).select('id').single()
    expect(seeded.error, `precondition: the photo ${name} is seeded by the service role`).toBeNull()
    return seeded.data?.id as string
  }
  const refused = (label: string, answer: { error: { code?: string } | null; data: unknown }) => {
    expect(answer.error?.code, `${label}: refused with 42501`).toBe('42501')
    expect(answer.data, `${label}: nothing returned`).toBeNull()
  }

  it('[SEC-962-ACTIVE-PHOTOS-DENY] the owner session cannot insert, update, move or delete a photo of its ACTIVE listing, and the gallery stays as it was', async () => {
    const active = await run.makeListing(owner.id, 'active', 'photos-deny')
    const pending = await run.makeListing(owner.id, 'pending', 'photos-deny-pending')
    const activePhoto = await seedPhoto(active.id, owner.id, 'deny-active')
    const pendingPhoto = await seedPhoto(pending.id, owner.id, 'deny-pending')
    const before = { active: await gallery(active.id), pending: await gallery(pending.id) }
    expect(before.active, 'precondition: the active listing holds its photo').toHaveLength(1)

    refused('insert into the active listing', await owner.client.from('listing_images').insert({ listing_id: active.id, url: photoUrl(owner.id, 'deny-second'), is_cover: false, order: 1 }).select('id'))
    refused('update of a photo of the active listing', await owner.client.from('listing_images').update({ is_cover: false, order: 7 }).eq('id', activePhoto).select('id'))
    refused('delete of a photo of the active listing', await owner.client.from('listing_images').delete().eq('id', activePhoto).select('id'))
    refused('moving a photo OUT of the active listing', await owner.client.from('listing_images').update({ listing_id: pending.id }).eq('id', activePhoto).select('id'))
    refused('moving a photo INTO the active listing', await owner.client.from('listing_images').update({ listing_id: active.id }).eq('id', pendingPhoto).select('id'))

    expect(await gallery(active.id), 'the gallery of the active listing is unchanged').toEqual(before.active)
    expect(await gallery(pending.id), 'the gallery of the pending listing is unchanged').toEqual(before.pending)
  })

  it('[SEC-962-ACTIVE-PHOTOS-ALLOW] a pending listing, a holder of listings.moderate on a listing of its own, updateListing on an active listing and deleteListingAction are not held', async () => {
    // (1) the same writes on a listing that is waiting for review: nobody reads it before approval
    const pending = await run.makeListing(owner.id, 'pending', 'photos-allow-pending')
    const added = await owner.client.from('listing_images').insert({ listing_id: pending.id, url: photoUrl(owner.id, 'allow-pending'), is_cover: true, order: 0 }).select('id').single()
    expect(added.error, 'the owner session inserts a photo of a pending listing').toBeNull()
    const changed = await owner.client.from('listing_images').update({ order: 3 }).eq('id', added.data?.id).select('order')
    expect(changed.error, 'the owner session updates a photo of a pending listing').toBeNull()
    expect(changed.data).toEqual([{ order: 3 }])
    const removed = await owner.client.from('listing_images').delete().eq('id', added.data?.id).select('id')
    expect(removed.error, 'the owner session deletes a photo of a pending listing').toBeNull()
    expect(removed.data).toEqual([{ id: added.data?.id }])

    // (2) a session that holds `listings.moderate` (switched on for this file) and owns an ACTIVE listing is not held, as it is not held on `listings` itself
    const staffOwn = await run.makeListing(moderator.id, 'active', 'photos-allow-staff')
    const staffAdded = await moderator.client.from('listing_images').insert({ listing_id: staffOwn.id, url: photoUrl(moderator.id, 'allow-staff'), is_cover: true, order: 0 }).select('id').single()
    expect(staffAdded.error, 'a holder of listings.moderate inserts a photo of an active listing').toBeNull()
    const staffChanged = await moderator.client.from('listing_images').update({ order: 4 }).eq('id', staffAdded.data?.id).select('order')
    expect(staffChanged.error, 'a holder of listings.moderate updates the photo').toBeNull()
    expect(staffChanged.data).toEqual([{ order: 4 }])
    const staffRemoved = await moderator.client.from('listing_images').delete().eq('id', staffAdded.data?.id).select('id')
    expect(staffRemoved.error, 'a holder of listings.moderate deletes the photo').toBeNull()
    expect(staffRemoved.data).toEqual([{ id: staffAdded.data?.id }])

    // (3) the application edit of an ACTIVE listing moves it to pending first and then saves the new photos
    const edited = await run.makeListing(owner.id, 'active', 'photos-allow-edit')
    await seedPhoto(edited.id, owner.id, 'allow-old')
    const newPhoto = { url: photoUrl(owner.id, 'allow-new'), public_id: 'x', is_cover: true, order: 0 }
    acting.client = owner.client
    expect(await updateListing(edited.id, { ...editWith(`${run.RUN} photos edit`), images: [newPhoto] }), 'the edit is saved and the listing goes to review').toEqual({ slug: edited.slug, status: 'pending' })
    expect((await gallery(edited.id))?.map((photo) => photo.url), 'the new photo is the whole gallery').toEqual([newPhoto.url])

    // (4) the owner deletes an ACTIVE listing that holds photos: the listing and its photos are gone
    const doomed = await run.makeListing(owner.id, 'active', 'photos-allow-delete')
    await seedPhoto(doomed.id, owner.id, 'allow-delete-1')
    await seedPhoto(doomed.id, owner.id, 'allow-delete-2', 1)
    expect(await gallery(doomed.id), 'precondition: the listing holds two photos').toHaveLength(2)
    acting.client = owner.client
    expect(await deleteListingAction(doomed.id), 'deleteListingAction answers success').toEqual({})
    expect((await run.admin.from('listings').select('id').eq('id', doomed.id)).data, 'the listing is gone').toEqual([])
    expect(await gallery(doomed.id), 'its photos are gone with it').toEqual([])
  })
})
