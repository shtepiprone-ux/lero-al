// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S20): a person's collections belong to them.
 * B cannot read, rename, delete, add to or empty A's collection; anonymous callers and blocked people write nothing; a name that is not text is refused.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let blocked: string | null = null
const revalidated: string[] = []
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => blocked }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { revalidated.push(p) } }))

import { addToCollection, createCollection, deleteCollection, getCollectionsWithMembership, removeFromCollection, renameCollection } from '../collectionActions'

const A = 'user-a'
const B = 'user-b'

beforeEach(() => {
  db = createFakeDb({
    collections: [{ id: 'c-a', user_id: A, name: 'Alba flats', created_at: '2026-10-01', updated_at: '2026-10-01' }, { id: 'c-b', user_id: B, name: 'Bea houses', created_at: '2026-10-02', updated_at: '2026-10-02' }],
    collection_items: [{ id: 'i1', collection_id: 'c-a', listing_id: 'l1' }, { id: 'i2', collection_id: 'c-a', listing_id: 'l2' }, { id: 'i3', collection_id: 'c-b', listing_id: 'l1' }],
  })
  currentUser = { id: B }
  blocked = null
  revalidated.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('person B against person A\'s collection', () => {
  it('cannot add to it', async () => {
    expect(await addToCollection('c-a', 'l9')).toEqual({ error: 'collection_not_found' })
    expect(db.tables.collection_items.some((i) => i.listing_id === 'l9')).toBe(false)
  })

  it('cannot remove from it', async () => {
    expect(await removeFromCollection('c-a', 'l1')).toEqual({ error: 'collection_not_found' })
    expect(db.tables.collection_items.filter((i) => i.collection_id === 'c-a')).toHaveLength(2)
  })

  it('cannot rename or delete it', async () => {
    await renameCollection('c-a', 'Hacked')
    await deleteCollection('c-a')
    expect(db.tables.collections.find((c) => c.id === 'c-a')).toMatchObject({ name: 'Alba flats' })
  })

  it('does not see it, and sees only their own with the right counts', async () => {
    const res = await getCollectionsWithMembership('l1')
    expect(res.collections.map((c) => c.id)).toEqual(['c-b'])
    expect(res.collections[0].item_count).toBe(1)
    expect(res.memberIds).toEqual(['c-b'])
  })
})

describe('the owner', () => {
  beforeEach(() => { currentUser = { id: A } })

  it('reads their collections with the number of items and the ones that hold this listing', async () => {
    const res = await getCollectionsWithMembership('l2')
    expect(res.collections).toMatchObject([{ id: 'c-a', item_count: 2 }])
    expect(res.memberIds).toEqual(['c-a'])
  })

  it('creates a collection for themselves, trimmed', async () => {
    const res = await createCollection('  Villas  ')
    expect('collection' in res && res.collection).toMatchObject({ user_id: A, name: 'Villas', item_count: 0 })
    expect(revalidated).toEqual(['/[locale]/favorites'])
  })

  it('adds, and adding twice is fine', async () => {
    expect(await addToCollection('c-a', 'l9')).toEqual({ ok: true })
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'collection_items') c.insert = () => ({ then: (r: (v: unknown) => void) => r({ error: { code: '23505', message: 'dup' } }) })
      return c
    }) as never
    expect(await addToCollection('c-a', 'l9')).toEqual({ ok: true })
  })

  it('another database error is returned as a fixed code, never its message, and nothing is refreshed (Task 923 R71 (f))', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'collection_items') c.insert = () => ({ then: (r: (v: unknown) => void) => r({ error: { code: '42501', message: 'denied' } }) })
      return c
    }) as never
    expect(await addToCollection('c-a', 'l9')).toEqual({ error: 'create_failed' })
    expect(revalidated).toEqual([])
  })

  it('removes only the one listing from their collection', async () => {
    expect(await removeFromCollection('c-a', 'l1')).toEqual({ ok: true })
    expect(db.tables.collection_items.filter((i) => i.collection_id === 'c-a').map((i) => i.listing_id)).toEqual(['l2'])
    expect(db.tables.collection_items.some((i) => i.collection_id === 'c-b')).toBe(true)
  })

  it('renames and deletes their own', async () => {
    expect(await renameCollection('c-a', ' New name ')).toEqual({ ok: true })
    expect(db.tables.collections.find((c) => c.id === 'c-a')?.name).toBe('New name')
    expect(await deleteCollection('c-a')).toEqual({ ok: true })
    expect(db.tables.collections.map((c) => c.id)).toEqual(['c-b'])
  })
})

describe('names', () => {
  it.each([[''], ['   '], [undefined], [null], [5], [{ toString: () => 'x' }], [['x']]])('refuses the name %j', async (name) => {
    expect(await createCollection(name as never)).toEqual({ error: 'name_required' })
    expect(await renameCollection('c-b', name as never)).toEqual({ error: 'name_required' })
    expect(db.log).toEqual([])
  })

  it('refuses a name longer than 100 characters and accepts exactly 100', async () => {
    expect(await createCollection('x'.repeat(101))).toEqual({ error: 'name_too_long' })
    expect(await renameCollection('c-b', 'x'.repeat(101))).toEqual({ error: 'name_too_long' })
    expect('collection' in (await createCollection('x'.repeat(100)))).toBe(true)
  })

  it('a duplicate name is reported as such', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'collections') c.single = async () => ({ data: null, error: { code: '23505', message: 'dup' } })
      return c
    }) as never
    expect(await createCollection('Dup')).toEqual({ error: 'name_duplicate' })
  })
})

describe('anonymous and blocked callers', () => {
  const calls: [string, () => Promise<unknown>][] = [
    ['createCollection', () => createCollection('x')], ['renameCollection', () => renameCollection('c-b', 'x')], ['deleteCollection', () => deleteCollection('c-b')],
    ['addToCollection', () => addToCollection('c-b', 'l9')], ['removeFromCollection', () => removeFromCollection('c-b', 'l1')],
  ]

  it.each(calls)('%s is refused for an anonymous caller and writes nothing', async (_n, call) => {
    currentUser = null
    expect(await call()).toEqual({ error: 'unauthenticated' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it.each(calls)('%s is refused for a blocked person and writes nothing', async (_n, call) => {
    blocked = 'account_blocked'
    expect(await call()).toEqual({ error: 'account_blocked' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('an anonymous caller reads nothing', async () => {
    currentUser = null
    expect(await getCollectionsWithMembership('l1')).toEqual({ collections: [], memberIds: [] })
    expect(db.log).toEqual([])
  })
})

// Task 923 R38 (cases SEC-S20-SRV-DENY, SEC-S20-SRV-ALLOW)
it('[SEC-S20-SRV-DENY] Collection items are written only into a collection of the caller', async () => {
  currentUser = { id: B }
  expect(await addToCollection('c-a', 'l9')).toEqual({ error: 'collection_not_found' })
  expect(await removeFromCollection('c-a', 'l1')).toEqual({ error: 'collection_not_found' })
  expect(db.log.filter((l) => l.table === 'collection_items' && l.op !== 'select')).toEqual([])   // forbidden before any write
  expect(db.tables.collection_items.filter((i) => i.collection_id === 'c-a')).toHaveLength(2)
})

it('[SEC-S20-SRV-ALLOW] the owner adds a listing to their own collection', async () => {
  currentUser = { id: A }
  expect(await addToCollection('c-a', 'l9')).toEqual({ ok: true })
  expect(db.tables.collection_items.some((i) => i.collection_id === 'c-a' && i.listing_id === 'l9')).toBe(true)
})
