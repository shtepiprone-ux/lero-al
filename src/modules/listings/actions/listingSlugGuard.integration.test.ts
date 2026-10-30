/**
 * Real-boundary control for the slug guard of hardening v7.1 (Task 923 R82 (d); kickoff §44 R95): a session INSERT into `listings` is refused unless the slug is
 * ^[a-z0-9]+(-[a-z0-9]+)*$ and at most 120 characters. REAL Supabase Auth and the REAL database of the approved development project, synthetic rows of one run, verified clean-up.
 *  - SEC-X-INT-SLUG-PLAIN-ALLOW: the REAL createListing (with the REAL generateSlug) stores a listing for a title with " - " and for a Cyrillic title.
 *  - SEC-X-INT-SLUG-PLAIN-DENY: a Data API insert of an own pending listing with the slug `a--b`, and with `-x`, is refused 42501 and stores no row. The control (the same
 *    insert with a plain slug) works, so the refusal is the slug guard and not a missing right.
 * The doubles are the cookie-bound client factory (outside a Next request it returns the client holding the REAL session of the chosen person). Nothing is mocked in createListing:
 * getUser, the block check and the insert run against the real project. Listings made through createListing carry a slug made from the title, not the run prefix, so this file
 * removes the owner's listings itself and verifies that none is left, before the shared clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))

import { createListing } from './createListing'

const PLAIN_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

describe('listingSlugGuard', () => {
  let run: Run
  let owner: SyntheticUser

  beforeAll(async () => {
    run = createRun()
    owner = await run.makeUser('slug-owner')
  })
  afterAll(async () => {
    // the owner's listings (made by createListing, so their slug does not start with the run prefix) are removed and counted here
    const removed = await run.admin.from('listings').delete().eq('user_id', owner.id)
    expect(removed.error, 'the listings of the synthetic owner are removed').toBeNull()
    const left = await run.admin.from('listings').select('id', { count: 'exact', head: true }).eq('user_id', owner.id)
    expect(left.error).toBeNull()
    expect(left.count, 'no listing of the synthetic owner is left').toBe(0)
    const result = await run.cleanup()
    expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  })

  const ownListing = (slug: string) => ({
    user_id: owner.id, slug, title: `${run.RUN} slug guard`, price: 1, listing_type: 'sale', property_type: 'apartment',
    status: 'pending', expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), views_count: 0,
  })

  it('[SEC-X-INT-SLUG-PLAIN-ALLOW] titles with hyphens or Cyrillic still create a listing', async () => {
    acting.client = owner.client
    for (const title of ['Shitet apartament - 2+1', 'Продається квартира в центрі']) {
      const answer = await createListing({ title, listing_type: 'sale', property_type: 'apartment', price: 95000, currency: 'EUR', description: undefined, address: undefined, images: [] })
      expect(answer, `${title}: no refusal of the permitted request`).not.toHaveProperty('error')
      const slug = (answer as { slug: string }).slug
      expect(slug, `${title}: a plain slug`).toMatch(PLAIN_SLUG)
      expect(slug.length).toBeLessThanOrEqual(120)

      const stored = await run.admin.from('listings').select('user_id, title, status, slug').eq('slug', slug).single()
      expect(stored.error, `${title}: stored`).toBeNull()
      expect(stored.data).toEqual({ user_id: owner.id, title, status: 'pending', slug })
    }
  })

  it('[SEC-X-INT-SLUG-PLAIN-DENY] the guard still refuses a slug that is not plain', async () => {
    // the control: the same insert with a plain slug works, so the refusals below are the slug guard
    const plain = `${run.RUN.replace(/_/g, '').toLowerCase()}-control`
    const control = await owner.client.from('listings').insert(ownListing(plain)).select('id, slug')
    expect(control.error, 'a plain slug is accepted').toBeNull()
    expect(control.data).toHaveLength(1)

    for (const slug of ['a--b', '-x']) {
      const refused = await owner.client.from('listings').insert(ownListing(slug)).select('id')
      expect(refused.error?.code, `${slug}: refused 42501`).toBe('42501')
      expect(refused.data, `${slug}: nothing returned`).toBeNull()
    }
    const stored = await run.admin.from('listings').select('id, slug').eq('user_id', owner.id).in('slug', ['a--b', '-x'])
    expect(stored.error).toBeNull()
    expect(stored.data, 'no listing with a slug that is not plain was stored').toEqual([])
  })

  // ── Task 923 R162: the same guard seen from the speculation rules (SEC-X-SRV-SLUG-SCRIPT is the page side): a stored slug can never close or add a script ──────────────────────
  it('[SEC-X-INT-SLUG-SCRIPT-ALLOW] slug-script allowed on the real project', async () => {
    acting.client = owner.client
    const answer = await createListing({ title: 'Shitet apartament ne qender', listing_type: 'sale', property_type: 'apartment', price: 95000, currency: 'EUR', description: undefined, address: undefined, images: [] })
    expect(answer, 'a normal title is not refused').not.toHaveProperty('error')
    const slug = (answer as { slug: string }).slug
    expect(slug, 'the generated slug stays inside the generator alphabet').toMatch(/^[a-z0-9-]+$/)
    const stored = await run.admin.from('listings').select('slug').eq('slug', slug).single()
    expect(stored.error, 'the generated slug is stored').toBeNull()
    expect(stored.data?.slug).toBe(slug)
  })

  it('[SEC-X-INT-SLUG-SCRIPT-DENY] slug-script refused on the real project', async () => {
    const hostile = 'x</script><script>alert(1)</script>'
    const target = await run.makeListing(owner.id, 'pending', 'slug-script-target')
    const patched = await owner.client.from('listings').update({ slug: hostile }).eq('id', target.id).select('id')
    expect(patched.error?.code, 'a PATCH of the slug of the own listing to a value holding </script> is refused 42501').toBe('42501')
    expect(patched.data, 'nothing came back').toBeNull()
    expect((await run.admin.from('listings').select('slug').eq('id', target.id).single()).data?.slug, 'the slug is unchanged').toBe(target.slug)

    const inserted = await owner.client.from('listings').insert(ownListing(hostile)).select('id')
    expect(inserted.error?.code, 'an insert with such a slug is refused 42501').toBe('42501')
    expect(inserted.data, 'no row came back').toBeNull()
    const stored = await run.admin.from('listings').select('slug').eq('slug', hostile)
    expect(stored.error).toBeNull()
    expect(stored.data, 'no slug outside the generator alphabet was stored').toEqual([])
  })
})
