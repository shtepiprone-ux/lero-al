/**
 * Real-boundary control for Task 1035 (AC4): the REAL database applies the exclusion of synthetic test listings in `applyPublicVisibility` and hides nothing else.
 * Rows are `zz_synth_` listings of this run (the fixtures of `createRun`) with a verified clean-up; the reads use the service-role client the sitemap uses.
 *  - SEC-X-INT-SYNTHETIC-HIDDEN-DENY: an ACTIVE, unexpired synthetic listing is returned by a plain read of its slug, and is NOT returned by `applyPublicVisibility` with the same
 *    slug (the same read without the synthetic exclusion returns it, so the status and expiry did not hide it: the exclusion did);
 *  - SEC-X-INT-SYNTHETIC-HIDDEN-ALLOW: no real listing is excluded: the slugs `applyPublicVisibility` returns are exactly the public slugs that do not start with the synthetic prefix.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { applyPublicVisibility } from '@/modules/listings/lib/visibility'
import { SYNTHETIC_LISTING_SLUG_PREFIX, isSyntheticListingSlug } from '@/modules/listings/lib/indexing'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let owner: SyntheticUser
let hidden: { id: string; slug: string; status: string; expires_at: string | null }

beforeAll(async () => {
  run = createRun()
  owner = await run.makeUser('synthetic-hidden-owner', { role: 'user' })
  hidden = await run.makeListing(owner.id, 'active', 'synthetic-hidden')
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const PAGE = 1000

/** every slug a read returns, page by page, so no row is cut off by the default limit */
async function allSlugs(read: (from: number, to: number) => PromiseLike<{ data: { slug: string | null }[] | null; error: { message: string } | null }>): Promise<string[]> {
  const slugs: string[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await read(from, from + PAGE - 1)
    expect(error, 'a failed read is a failure, never "no rows"').toBeNull()
    for (const row of data ?? []) if (row.slug) slugs.push(row.slug)
    if ((data ?? []).length < PAGE) break
  }
  return slugs
}

describe('syntheticListingsHidden', () => {
  it('[SEC-X-INT-SYNTHETIC-HIDDEN-DENY] an active synthetic listing is read by its slug, and no public read returns it', async () => {
    expect(hidden.slug.startsWith(SYNTHETIC_LISTING_SLUG_PREFIX), 'precondition: the fixture slug carries the prefix').toBe(true)
    expect(isSyntheticListingSlug(hidden.slug), 'precondition: the rule names it synthetic').toBe(true)
    expect(hidden.status, 'precondition: the listing is active').toBe('active')
    expect(hidden.expires_at !== null && new Date(hidden.expires_at).getTime() > Date.now(), 'precondition: the listing has not expired, so only the exclusion can hide it').toBe(true)

    const plain = await run.admin.from('listings').select('id, slug').eq('slug', hidden.slug)
    expect(plain.error).toBeNull()
    expect(plain.data, 'a plain read of the slug returns the row').toEqual([{ id: hidden.id, slug: hidden.slug }])

    // the public policy as it was before the exclusion (status and expiry only) returns it, so the next read is empty because of the exclusion and not because of the status or the expiry
    const withoutExclusion = await run.admin.from('listings').select('id').eq('slug', hidden.slug).eq('status', 'active').gte('expires_at', new Date().toISOString())
    expect(withoutExclusion.error).toBeNull()
    expect(withoutExclusion.data, 'status and expiry alone would list the synthetic listing').toEqual([{ id: hidden.id }])

    const publicRead = await applyPublicVisibility(run.admin.from('listings').select('id, slug').eq('slug', hidden.slug))
    expect(publicRead.error).toBeNull()
    expect(publicRead.data, 'applyPublicVisibility does not return the synthetic listing').toEqual([])

    const publicCount = await applyPublicVisibility(run.admin.from('listings').select('id', { count: 'exact', head: true }).eq('slug', hidden.slug))
    expect(publicCount.error).toBeNull()
    expect(publicCount.count, 'the public count does not count it').toBe(0)
  })

  it('[SEC-X-INT-SYNTHETIC-HIDDEN-ALLOW] nothing but synthetic listings is excluded: the public set is the same with and without the exclusion', async () => {
    const now = new Date().toISOString()
    // the public listings by status and expiry alone (the policy before the exclusion), minus the ones the rule names synthetic
    const before = (await allSlugs((from, to) => run.admin.from('listings').select('slug').eq('status', 'active').gte('expires_at', now).order('id', { ascending: true }).range(from, to)))
      .filter((slug) => !isSyntheticListingSlug(slug))
    const after = await allSlugs((from, to) => applyPublicVisibility(run.admin.from('listings').select('slug')).order('id', { ascending: true }).range(from, to))

    expect(after.some(isSyntheticListingSlug), 'the public read returns no synthetic listing').toBe(false)
    expect(after.some((slug) => slug.includes('_')), 'no returned slug has an underscore: the marker cannot be a real slug').toBe(false)
    expect([...after].sort(), 'no real listing is excluded and none is added').toEqual([...before].sort())
    expect(after.length, 'the count of public listings without synthetic slugs is equal with and without the filter').toBe(before.length)
  })
})
