// @vitest-environment node
/**
 * Security (Task 923 Revision 7, finding S27): deleteListingAction.
 *
 * The action deleted by id and trusted row-level security to refuse a stranger. A refusal by row-level security is NOT an error (it deletes zero rows), so the code carried
 * on as if the listing had been deleted: it cleaned up the listing's images in Cloudinary and refreshed the cache. With no policy at all (or a wrong one) any signed-in
 * person could delete any listing. The action now checks, before anything is written, that the caller owns the listing or holds the `listings.delete` permission.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let mayDeleteAny = false
const cleaned: string[] = []
const revalidated: string[] = []
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
// the DELETE runs with the service role after the ownership check (Task 923 R71 (l)); the same in-memory database stands behind both clients
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
let permissionThrows = false
vi.mock('@/lib/auth/permissions', () => ({ hasPermission: async (key: string) => { if (permissionThrows) throw new Error('boom'); return key === 'listings.delete' && mayDeleteAny } }))
let cleanupFails = false
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async (publicId: string) => { if (cleanupFails) throw new Error('cloudinary down'); cleaned.push(publicId) } }))
vi.mock('@/lib/cloudinaryUpload', () => ({ publicIdFromUrl: (u: string) => (u.includes('/listings/') ? u.split('/listings/')[1].replace(/\.\w+$/, '') : null) }))
vi.mock('next/cache', () => ({ revalidateTag: (t: string) => { revalidated.push(`tag:${t}`) }, revalidatePath: (p: string) => { revalidated.push(`path:${p}`) } }))

import { deleteListingAction } from '../deleteListing'

/**
 * The fake database does not report the rows a DELETE removed (its `.delete().eq().select('id')` answers no rows), and the action now requires exactly one:
 * this makes `.select('id')` after a delete answer the rows that were really removed, as PostgREST does with `Prefer: return=representation`.
 */
function reportDeletedRows(target: ReturnType<typeof createFakeDb>) {
  const real = target.client.from
  target.client.from = ((table: string) => {
    const chain = real(table) as Record<string, (...a: unknown[]) => unknown>
    if (table === 'listings') {
      const realDelete = chain.delete.bind(chain)
      chain.delete = () => {
        const inner = realDelete() as { eq: (c: string, v: unknown) => unknown }
        return {
          eq: (column: string, value: unknown) => {
            inner.eq(column, value)
            return {
              select: async () => {
                const removed = target.tables.listings.filter((l) => l[column] === value).map((l) => ({ id: l.id }))
                await (inner as unknown as PromiseLike<unknown>)
                return { data: removed, error: null }
              },
            }
          },
        }
      }
    }
    return chain
  }) as never
}

beforeEach(() => {
  db = createFakeDb({
    listings: [{ id: 'l-a', user_id: 'user-a', slug: 'a', status: 'active' }],
    listing_images: [{ id: 'i1', listing_id: 'l-a', url: 'https://res.cloudinary.com/c/image/upload/listings/pic-1.jpg' }],
  })
  reportDeletedRows(db)
  currentUser = { id: 'user-b' }
  mayDeleteAny = false
  permissionThrows = false
  cleanupFails = false
  cleaned.length = 0
  revalidated.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('deleteListingAction', () => {
  it('person B cannot delete person A\'s listing: it stays, its images are not cleaned up, nothing is refreshed', async () => {
    const res = await deleteListingAction('l-a')
    expect(res).toEqual({ error: 'forbidden' })
    expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(true)
    expect(db.tables.listing_images).toHaveLength(1)
    expect(cleaned).toEqual([])
    expect(revalidated).toEqual([])
  })

  it('the owner deletes their listing and its images are cleaned up', async () => {
    currentUser = { id: 'user-a' }
    const res = await deleteListingAction('l-a')
    expect(res).toEqual({})
    expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(false)
    expect(cleaned).toEqual(['pic-1'])
    expect(revalidated).toContain('tag:site-stats')
  })

  it('a staff member with the listings.delete permission may delete another person\'s listing', async () => {
    mayDeleteAny = true
    expect(await deleteListingAction('l-a')).toEqual({})
    expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(false)
  })

  it('a staff member WITHOUT that permission may not', async () => {
    mayDeleteAny = false
    expect(await deleteListingAction('l-a')).toEqual({ error: 'forbidden' })
    expect(db.tables.listings).toHaveLength(1)
  })

  it('an anonymous caller is refused and nothing is touched', async () => {
    currentUser = null
    expect(await deleteListingAction('l-a')).toEqual({ error: 'unauthenticated' })
    expect(db.log).toEqual([])
  })

  it('a listing that does not exist is "not_found" and nothing is cleaned up', async () => {
    currentUser = { id: 'user-a' }
    expect(await deleteListingAction('nope')).toEqual({ error: 'not_found' })
    expect(cleaned).toEqual([])
  })

  it('an id that is not a plain string is refused before any query', async () => {
    currentUser = { id: 'user-a' }
    expect(await deleteListingAction(undefined as unknown as string)).toEqual({ error: 'not_found' })
    expect(await deleteListingAction({ $ne: null } as unknown as string)).toEqual({ error: 'not_found' })
    expect(await deleteListingAction('')).toEqual({ error: 'not_found' })
    expect(db.log, 'no query may be built from a value that is not an id').toEqual([])
  })

  it('a failure of the permission check means "forbidden", not a crash', async () => {
    permissionThrows = true
    expect(await deleteListingAction('l-a')).toEqual({ error: 'forbidden' })
    expect(db.tables.listings).toHaveLength(1)
  })

  it('a failure to clean up an image does not undo the delete or fail the call', async () => {
    currentUser = { id: 'user-a' }
    cleanupFails = true
    expect(await deleteListingAction('l-a')).toEqual({})
    expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(false)
  })

  it('images that are not Cloudinary listing images are not sent for deletion', async () => {
    currentUser = { id: 'user-a' }
    db.tables.listing_images.push({ id: 'i2', listing_id: 'l-a', url: 'https://example.com/not-ours.jpg' })
    await deleteListingAction('l-a')
    expect(cleaned).toEqual(['pic-1'])
  })

  it('a database failure is returned and nothing is cleaned up or refreshed', async () => {
    currentUser = { id: 'user-a' }
    const real = db.client.from
    db.client.from = ((t: string) => { const c = real(t) as Record<string, unknown>; if (t === 'listings') { const sel = c.select as (...a: unknown[]) => unknown; c.delete = () => ({ eq: () => ({ select: async () => ({ data: null, error: { message: 'fk violation' } }) }) }); c.select = sel } return c }) as never
    expect(await deleteListingAction('l-a')).toEqual({ error: 'delete_failed' })
    expect(cleaned).toEqual([])
    expect(revalidated).toEqual([])
  })
})

// Task 923 R38 (cases SEC-S27-SRV-DENY, SEC-S27-SRV-ALLOW)
it('[SEC-S27-SRV-DENY] Only the owner or a holder of listings.delete deletes a listing', async () => {
  currentUser = { id: 'user-b' }
  mayDeleteAny = false
  expect(await deleteListingAction('l-a')).toEqual({ error: 'forbidden' })
  expect(db.log.filter((l) => l.op === 'delete')).toEqual([])        // forbidden before any query that writes
  expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(true)
  expect(cleaned).toEqual([])
})

it('[SEC-S27-SRV-ALLOW] the owner deletes their own listing', async () => {
  currentUser = { id: 'user-a' }
  expect(await deleteListingAction('l-a')).toEqual({})
  expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(false)
  expect(cleaned).toEqual(['pic-1'])                                  // its images are cleaned up
})

// Task 923 R71 (l): case SEC-X-SRV-OWNER-DELETE
describe('deleteListing', () => {
  it('[SEC-X-SRV-OWNER-DELETE] a delete of zero rows is a failure', async () => {
    currentUser = { id: 'user-a' }
    // the DELETE matches no row (the listing vanished, or a policy refused it): the database answers success with nothing deleted
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'listings') c.delete = () => ({ eq: () => ({ select: async () => ({ data: [], error: null }) }) })
      return c
    }) as never
    const res = await deleteListingAction('l-a')
    expect(res).toEqual({ error: 'delete_failed' })
    expect(cleaned).toEqual([])                                   // no deleteAsset call
    expect(revalidated).toEqual([])                               // no revalidation
    // the control: with no interference the same call deletes exactly that listing and answers success
    db.client.from = real
    expect(await deleteListingAction('l-a')).toEqual({})
    expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(false)
    expect(cleaned).toEqual(['pic-1'])
  })

  it('a failed read of the images refuses before anything is deleted, and no database message reaches the caller', async () => {
    currentUser = { id: 'user-a' }
    const real = db.client.from
    db.client.from = ((t: string) => {
      const c = real(t) as Record<string, unknown>
      if (t === 'listing_images') c.select = () => ({ eq: async () => ({ data: null, error: { message: 'MARKER-DB-MESSAGE' } }) })
      return c
    }) as never
    const res = await deleteListingAction('l-a')
    expect(res).toEqual({ error: 'delete_failed' })
    expect(JSON.stringify(res)).not.toContain('MARKER-DB-MESSAGE')
    expect(db.tables.listings.some((l) => l.id === 'l-a')).toBe(true)
    expect(cleaned).toEqual([])
  })
})
