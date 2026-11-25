/**
 * Real-boundary control for the database twin of the R2 photo rule (Task 1038 AC6): the trigger `listing_images_owner_folder` and the CHECK `listing_images_url_prefix_check` of the
 * approved development project, after the owner has applied `supabase/sql_migrations/task1038/task1038.sql`. Synthetic rows only, verified clean-up; the rows are written with the SERVICE ROLE
 * (the same client the application's staff paths use), so what is refused here is refused by the database itself, not by row-level security.
 *  - SEC-R2IMG-DB-ALLOW: the owner's `https://media.lero.al/<owner>/listings/<uuid>/full.webp` and `full.jpg` are accepted; a Cloudinary photo of the owner is still accepted;
 *  - SEC-R2IMG-DB-DENY: another owner's folder, the `thumb` object, another extension, a query, a fragment, a `..` segment, an encoded dot, a folder that is not a UUID and another host with the
 *    same path are refused (42501, or 23514 where the CHECK refuses first).
 * Until `task1038.sql` is applied the ALLOW cases fail by design: they are the proof that the apply did what it should.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration -- listingR2Images
 */
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let owner: SyntheticUser
let other: SyntheticUser
let listingId = ''

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('r2-image-owner', { role: 'user' })
  other = await run.makeUser('r2-image-other', { role: 'user' })
  listingId = (await run.makeListing(owner.id, 'active', 'r2-image')).id
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const photo = (ownerId: string, name = 'full.webp', host = 'media.lero.al', folder = randomUUID()) => `https://${host}/${ownerId}/listings/${folder}/${name}`
async function insert(url: string) {
  return run.admin.from('listing_images').insert({ listing_id: listingId, url, order: 0, is_cover: false })
}

describe('listing_images accepts the media host only in the owner\'s folder', () => {
  it.each([
    ['a WebP photo', () => photo(owner.id)],
    ['a JPEG photo', () => photo(owner.id, 'full.jpg')],
  ])('[SEC-R2IMG-DB-ALLOW] accepts %s of the listing owner', async (_label, url) => {
    const { error } = await insert(url())
    expect(error, error?.message).toBeNull()
  })

  it('[SEC-R2IMG-DB-ALLOW] still accepts a Cloudinary photo of the owner', async () => {
    const { data } = await run.admin.from('listing_images').select('url').like('url', 'https://res.cloudinary.com/%').limit(1)
    const prefix = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/)/.exec(String(data?.[0]?.url ?? ''))?.[1]
    expect(prefix, 'the project has a Cloudinary prefix to copy').toBeTruthy()
    const { error } = await insert(`${prefix}image/upload/v1/${owner.id}/listings/task1038-${randomUUID()}.jpg`)
    expect(error, error?.message).toBeNull()
  })

  it.each([
    ['another owner\'s folder', () => photo(other.id)],
    ['the thumb object', () => photo(owner.id, 'thumb.webp')],
    ['another extension (png)', () => photo(owner.id, 'full.png')],
    ['another object name', () => photo(owner.id, 'original.webp')],
    ['a query string', () => `${photo(owner.id)}?v=1`],
    ['a fragment', () => `${photo(owner.id)}#x`],
    ['a .. segment', () => `https://media.lero.al/${other.id}/../${owner.id}/listings/${randomUUID()}/full.webp`],
    ['an encoded dot', () => `https://media.lero.al/${owner.id}/listings/%2e%2e/${randomUUID()}/full.webp`],
    ['a folder that is not a UUID', () => `https://media.lero.al/${owner.id}/listings/not-a-uuid/full.webp`],
    ['an upper-case folder UUID', () => photo(owner.id, 'full.webp', 'media.lero.al', 'ABCDEF12-4444-4444-8444-444444444444')],
    ['another host with the same path', () => photo(owner.id, 'full.webp', 'evil.example')],
    ['a host that only starts like the media host', () => photo(owner.id, 'full.webp', 'media.lero.al.evil.example')],
    ['plain http', () => photo(owner.id).replace('https:', 'http:')],
  ])('[SEC-R2IMG-DB-DENY] refuses %s', async (_label, url) => {
    const { error } = await insert(url())
    expect(error, 'the database refuses it').not.toBeNull()
    expect(['42501', '23514']).toContain(error?.code)
  })

  it('[SEC-R2IMG-DB-DENY] moving a stored photo to another owner\'s listing is refused too', async () => {
    const theirs = (await run.makeListing(other.id, 'active', 'r2-image-theirs')).id
    const { data, error } = await run.admin.from('listing_images').insert({ listing_id: listingId, url: photo(owner.id), order: 1, is_cover: false }).select('id').single()
    expect(error, error?.message).toBeNull()
    const moved = await run.admin.from('listing_images').update({ listing_id: theirs }).eq('id', data?.id as string)
    expect(moved.error, 'the photo of one owner cannot be attached to another owner\'s listing').not.toBeNull()
    expect(moved.error?.code).toBe('42501')
  })
})
