// @vitest-environment node
/**
 * Featured ("popular") locations (Task 923 Revision 7): staff only, whole numbers only, one location at a time, and every language's home page is refreshed.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
const paths: string[] = []
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('next/cache', () => ({ revalidatePath: (p: string) => { paths.push(p) } }))

import { setLocationFeatured, setLocationUnfeatured } from '../popularLocationActions'

beforeEach(() => {
  db = createFakeDb({
    // active accounts, and the key a moderator needs (Task 923 R44, R66 (c), R71 (k), R75): `checkStaff()` reads the actor's own row and the key at each check
    users: [{ id: 'adm', role: 'admin', status: 'active' }, { id: 'mod', role: 'moderator', status: 'active' }, { id: 'usr', role: 'user', status: 'active' }],
    role_permissions: [{ role: 'moderator', permission_key: 'locations.manage', allowed: true }],
    locations: [{ id: 1, name_al: 'Tirana', is_featured: false, display_order: 0, image_url: 'x.jpg' }, { id: 2, name_al: 'Durrës', is_featured: false, display_order: 0 }],
  })
  currentUser = { id: 'mod' }
  paths.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('setLocationFeatured', () => {
  it.each([['a moderator', 'mod'], ['an administrator', 'adm']])('%s features one location and refreshes the home pages', async (_l, id) => {
    currentUser = { id }
    expect(await setLocationFeatured(1, 3)).toEqual({})
    expect(db.tables.locations[0]).toMatchObject({ is_featured: true, display_order: 3 })
    expect(db.tables.locations[1]).toMatchObject({ is_featured: false, display_order: 0 })
    expect(paths.sort()).toEqual(['/admin/popular-locations', '/en', '/it', '/sq', '/uk'])
  })

  // a session whose profile row is missing is a guest for `requireViewer()` (a "zombie" session), so it gets the guest's answer
  it.each([['a plain user', { id: 'usr' }, 'forbidden'], ['an anonymous caller', null, 'unauthenticated'], ['someone with no profile', { id: 'ghost' }, 'unauthenticated']])('%s is refused', async (_l, who, error) => {
    currentUser = who
    expect(await setLocationFeatured(1, 3)).toEqual({ error })
    expect(await setLocationUnfeatured(1)).toEqual({ error })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it.each([[1.5, 1], ['1', 1], [null, 1], [undefined, 1], [NaN, 1], [1, -1], [1, 1.5], [1, '2'], [1, NaN], [1, 10_001], [1, undefined], [{}, 1]])('refuses location %j with order %j', async (location, order) => {
    expect(await setLocationFeatured(location as never, order as never)).toEqual({ error: 'validation' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('accepts the order 0 and 10 000', async () => {
    expect(await setLocationFeatured(1, 0)).toEqual({})
    expect(await setLocationFeatured(2, 10_000)).toEqual({})
  })

  it('a database failure is "save_failed" and nothing is refreshed', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => { const c = real(t) as Record<string, unknown>; if (t === 'locations') c.update = () => ({ eq: async () => ({ error: { message: 'x' } }) }); return c }) as never
    expect(await setLocationFeatured(1, 1)).toEqual({ error: 'save_failed' })
    expect(paths).toEqual([])
  })
})

describe('setLocationUnfeatured', () => {
  it('removes one location from the section and keeps its photo', async () => {
    db.tables.locations[0].is_featured = true
    db.tables.locations[1].is_featured = true
    expect(await setLocationUnfeatured(1)).toEqual({})
    expect(db.tables.locations[0]).toMatchObject({ is_featured: false, image_url: 'x.jpg' })
    expect(db.tables.locations[1].is_featured).toBe(true)
    expect(paths).toContain('/admin/popular-locations')
  })

  it.each([[1.5], ['1'], [null], [undefined], [NaN], [{}]])('refuses the location %j', async (location) => {
    expect(await setLocationUnfeatured(location as never)).toEqual({ error: 'validation' })
    expect(db.log.filter((l) => l.op !== 'select')).toEqual([])
  })

  it('a database failure is "remove_failed"', async () => {
    const real = db.client.from
    db.client.from = ((t: string) => { const c = real(t) as Record<string, unknown>; if (t === 'locations') c.update = () => ({ eq: async () => ({ error: { message: 'x' } }) }); return c }) as never
    expect(await setLocationUnfeatured(1)).toEqual({ error: 'remove_failed' })
  })
})
