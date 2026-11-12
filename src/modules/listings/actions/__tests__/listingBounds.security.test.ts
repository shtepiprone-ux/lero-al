// @vitest-environment node
/**
 * Security (Task 923 R100, R101, D71, cases SEC-X-SRV-LISTING-BOUNDS-DENY and -ALLOW): the bounds of a listing's price and catalogue values, before any write.
 *
 * The REAL `createListing` and `updateListing` run with the REAL `listingSchema` against an in-memory database (it does NOT simulate row-level security or the CHECKs of
 * hardening v8b: the point is what the CODE refuses before it writes) with doubles for the identity, the viewer, the permission keys and the status gateway.
 *  - DENY: a price (or an old price) above the ceiling of its own currency (EUR 10 000 000 000, ALL 1 000 000 000 000), a property type or a currency that is not an ACTIVE row
 *    of its catalogue, and a catalogue that cannot be read are refused with a fixed code and nothing is written: no insert, update or delete reaches the database and no status
 *    transition is requested;
 *  - ALLOW: a price exactly at the ceiling of its currency, and 20 000 000 000 in lek, with active catalogue values are written by both actions.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'
import { listingSchema } from '@/modules/listings/validations'

const state = vi.hoisted(() => ({
  transitions: [] as string[],
  /** a table whose read answers with an error, as an outage does */
  failRead: null as string | null,
}))

let db = createFakeDb()
const wrap = (table: string) => {
  if (state.failRead === table) {
    const failing: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error: { code: '57P01', message: 'MARKER-OUTAGE' } }) : failing), apply: () => failing })
    return failing
  }
  return db.from(table)
}
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (t: string) => wrap(t) }) }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => wrap(t) }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'owner-1' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'owner-1', role: 'user' }) }))
vi.mock('@/lib/auth/permissions', () => ({ roleHasPermission: async () => false, hasPermission: async () => false }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: vi.fn(async () => undefined) }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({
  applyListingTransitionByStatus: async (_id: string, to: string) => { state.transitions.push(to); return { ok: true, nextStatus: to, listingId: 'l-1' } },
}))

import { createListing } from '../createListing'
import { updateListing } from '../updateListing'

const ID = 'l-1'
const CLOUD = 'lero-cloud'
const images = [{ url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/listings/a.jpg`, is_cover: true, order: 0 }]
// the ceilings as the owner decided them (D71), written out so that the expectation does not come from the module under test
const EUR_CEILING = 10_000_000_000
const ALL_CEILING = 1_000_000_000_000
const base = { title: 'A flat in Tirana', price: 90_000, currency: 'EUR', listing_type: 'sale', property_type: 'apartment', images }

function arrange() {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = CLOUD
  db = createFakeDb({
    listings: [{ id: ID, slug: 'flat', user_id: 'owner-1', status: 'pending', price: 1, price_old: null, currency: 'EUR', title: 'Flat' }],
    listing_images: [],
    // the catalogues: one inactive property type and one inactive currency beside the active ones
    property_types: [{ id: 1, slug: 'apartment', is_active: true }, { id: 2, slug: 'house', is_active: false }],
    currencies: [{ id: 1, code: 'ALL', is_active: true }, { id: 2, code: 'EUR', is_active: true }, { id: 3, code: 'USD', is_active: false }],
  })
  state.transitions = []
  state.failRead = null
}
const writes = () => db.log.filter((e) => e.op !== 'select')
const call = {
  create: (payload: Record<string, unknown>) => createListing(payload as never),
  update: (payload: Record<string, unknown>) => updateListing(ID, payload as never),
}

beforeEach(() => { arrange(); vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('listingBounds', () => {
  it('[SEC-X-SRV-LISTING-BOUNDS-DENY] an out-of-range price or an inactive catalogue value is refused before any write', async () => {
    // the schema itself holds the ceilings (the precondition of the cases below: the same payloads at the ceilings are valid)
    expect(listingSchema.safeParse({ ...base, currency: 'EUR', price: EUR_CEILING }).success, 'precondition: a euro price at the ceiling is valid').toBe(true)
    expect(listingSchema.safeParse({ ...base, currency: 'ALL', price: ALL_CEILING }).success, 'precondition: a lek price at the ceiling is valid').toBe(true)

    const refusals: [string, Record<string, unknown>, string][] = [
      ['a euro price above the euro ceiling', { ...base, currency: 'EUR', price: EUR_CEILING + 1 }, 'validation_failed'],
      ['a lek price above the lek ceiling', { ...base, currency: 'ALL', price: ALL_CEILING + 1 }, 'validation_failed'],
      ['a price of 20 000 000 000 in euro', { ...base, currency: 'EUR', price: 20_000_000_000 }, 'validation_failed'],
      ['a euro old price above the euro ceiling', { ...base, currency: 'EUR', price_old: EUR_CEILING + 1 }, 'validation_failed'],
      ['a lek old price above the lek ceiling', { ...base, currency: 'ALL', price_old: ALL_CEILING + 1 }, 'validation_failed'],
      ['an inactive property type', { ...base, property_type: 'house' }, 'invalid_property_type'],
      ['a property type that is not in the catalogue', { ...base, property_type: 'garage' }, 'invalid_property_type'],
      ['an inactive currency', { ...base, currency: 'EUR' }, 'invalid_currency'],
    ]
    for (const [name, payload, code] of refusals) {
      for (const action of ['create', 'update'] as const) {
        arrange()
        // the inactive currency case: EUR is switched off for this row of the table
        if (code === 'invalid_currency') db.tables.currencies.find((c) => c.code === 'EUR')!.is_active = false
        expect(await call[action](payload), `${action}: ${name}`).toEqual({ error: code })
        expect(writes(), `${action}: ${name}: nothing was written`).toEqual([])
        expect(state.transitions, `${action}: ${name}: no status transition was requested`).toEqual([])
        expect(db.tables.listings, `${action}: ${name}: the listing rows are as they were`).toHaveLength(1)
        expect(db.tables.listings[0], `${action}: ${name}: the stored listing is untouched`).toMatchObject({ title: 'Flat', price: 1 })
      }
    }

    // a catalogue that cannot be read refuses, with the fixed code and without the database's message
    for (const table of ['property_types', 'currencies']) {
      for (const action of ['create', 'update'] as const) {
        arrange()
        state.failRead = table
        const answer = await call[action](base)
        expect(answer, `${action}: ${table} unreadable`).toEqual({ error: table === 'property_types' ? 'invalid_property_type' : 'invalid_currency' })
        expect(JSON.stringify(answer)).not.toContain('MARKER-OUTAGE')
        expect(writes(), `${action}: ${table} unreadable: nothing was written`).toEqual([])
      }
    }
  })

  it('[SEC-X-SRV-LISTING-BOUNDS-ALLOW] a price at the ceiling with active catalogue values is written', async () => {
    const accepted: [string, 'EUR' | 'ALL', number][] = [
      ['the euro ceiling', 'EUR', EUR_CEILING],
      ['20 000 000 000 in lek', 'ALL', 20_000_000_000],
      ['the lek ceiling', 'ALL', ALL_CEILING],
    ]
    for (const [name, currency, price] of accepted) {
      arrange()
      const payload = { ...base, currency, price }

      const created = await call.create(payload)
      expect(created, `create ${name}: answers with the slug of the new listing`).toMatchObject({ slug: expect.any(String) })
      const inserted = writes().find((e) => e.table === 'listings' && e.op === 'insert')
      expect(inserted, `create ${name}: the listing was inserted`).toBeDefined()
      expect(inserted?.values, `create ${name}`).toMatchObject({ price, currency, property_type: 'apartment', status: 'pending', user_id: 'owner-1' })

      arrange()
      const updated = await call.update(payload)
      expect(updated, `update ${name}: answers with the unchanged slug and status`).toEqual({ slug: 'flat', status: 'pending' })
      expect(db.tables.listings[0], `update ${name}: the stored listing carries the new price`).toMatchObject({ price, currency, property_type: 'apartment' })
    }
  })
})
