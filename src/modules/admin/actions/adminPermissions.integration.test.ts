/**
 * Real-boundary control for the moderator keys of two admin writers (Task 923 R66 (b), (c), R75; cases SEC-X-INT-STATUS-PERM-* and SEC-X-INT-LOCATIONS-PERM-*): the REAL
 * `updateUserProfileFull`, `addLocation` and `setLocationFeatured`, with the REAL `requireViewer`, `checkStaff` and the REAL permission read of `role_permissions`, run against
 * REAL Supabase Auth and the REAL database of the approved development project. The only doubles are the cookie-bound client factory (outside a Next request it returns the
 * client that holds the REAL session of the chosen synthetic moderator) and the cache refresh. A moderator key is switched for the length of one case and put back exactly as it
 * was; a location row the cases need is synthetic, created and removed here. Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-STATUS-PERM-ALLOW / -DENY: deactivating an account through the full profile form needs `users.soft_delete`, as `deactivateUser` does (the Auth ban follows the saved status);
 *  - SEC-X-INT-LOCATIONS-PERM-ALLOW / -DENY: a write to `locations` needs `locations.manage` on every path.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

import { addLocation, updateUserProfileFull } from './index'
import { setLocationFeatured } from '@/modules/locations/actions/popularLocationActions'

let run: Run
let moderator: SyntheticUser
let regionId: number
/** locations this file made (by the action or as a fixture): removed by id in afterAll and counted */
const locationIds: number[] = []
const restorers: (() => Promise<void>)[] = []

beforeAll(async () => {
  run = createRun()
  moderator = await run.makeUser('perm-moderator', { role: 'moderator' })
  regionId = await run.anyLocationId()
})
afterAll(async () => {
  for (const restore of restorers.splice(0).reverse()) await restore()
  if (locationIds.length) await run.admin.from('locations').delete().in('id', locationIds)
  const left = locationIds.length ? await run.admin.from('locations').select('id').in('id', locationIds) : { data: [], error: null }
  expect(left.error).toBeNull()
  expect(left.data, 'no location row of this run is left').toEqual([])
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

/** moderator keys set for one case; the stored switches are put back exactly as they were (a row that did not exist is removed again) */
async function holdKeys(keys: Record<string, boolean>) {
  const prior = new Map<string, Record<string, unknown> | null>()
  for (const key of Object.keys(keys)) {
    const row = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', key).maybeSingle()
    expect(row.error, `the stored switch ${key} is readable`).toBeNull()
    prior.set(key, row.data)
  }
  for (const [key, allowed] of Object.entries(keys)) {
    const set = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: key, allowed }, { onConflict: 'role,permission_key' })
    expect(set.error, `the switch ${key} is set for this case`).toBeNull()
  }
  const restore = async () => {
    for (const [key, row] of prior) {
      const restored = row
        ? await run.admin.from('role_permissions').upsert(row, { onConflict: 'role,permission_key' })
        : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', key)
      expect(restored.error, `the stored switch ${key} is restored`).toBeNull()
    }
  }
  restorers.push(restore)
  return restore
}

/** an active account to deactivate, with the stored phone the form must send back (E.164) */
async function makeTarget(tag: string) {
  const account = await run.makeUser(tag, { role: 'user' })
  const row = await run.admin.from('users').select('phone').eq('id', account.id).single()
  return { account, phone: row.data?.phone as string }
}

describe('adminPermissions', () => {
  it('[SEC-X-INT-STATUS-PERM-ALLOW] status-perm allowed on the real project', async () => {
    const { account, phone } = await makeTarget('status-allow')
    const restore = await holdKeys({ 'users.edit': true, 'users.soft_delete': true })
    acting.client = moderator.client
    const answer = await updateUserProfileFull(account.id, { firstName: 'Status', profileType: 'private', phone, locationId: regionId, status: 'inactive' })
    expect(answer, 'the moderator with users.soft_delete deactivates the account').toEqual({})
    expect((await run.admin.from('users').select('status').eq('id', account.id).single()).data?.status, 'the status is saved').toBe('inactive')
    const auth = await run.admin.auth.admin.getUserById(account.id)
    expect(Date.parse(auth.data.user?.banned_until ?? ''), 'the Auth ban was set and lies in the future').toBeGreaterThan(Date.now())
    await restore()
  })

  it('[SEC-X-INT-STATUS-PERM-DENY] status-perm refused on the real project', async () => {
    const { account, phone } = await makeTarget('status-deny')
    const restore = await holdKeys({ 'users.edit': true, 'users.soft_delete': false })
    acting.client = moderator.client
    const answer = await updateUserProfileFull(account.id, { firstName: 'Status', profileType: 'private', phone, locationId: regionId, status: 'inactive' })
    expect(answer, 'a moderator without users.soft_delete cannot deactivate through the full form').toEqual({ error: 'Forbidden' })
    const stored = await run.admin.from('users').select('status, name').eq('id', account.id).single()
    expect(stored.data?.status, 'the status is unchanged').toBe('active')
    expect(stored.data?.name, 'nothing else of the form was saved either').not.toBe('Status')
    const auth = await run.admin.auth.admin.getUserById(account.id)
    expect(auth.data.user?.banned_until ?? null, 'the Auth account was not banned').toBeNull()
    await restore()
  })

  it('[SEC-X-INT-LOCATIONS-PERM-ALLOW] locations-perm allowed on the real project', async () => {
    const restore = await holdKeys({ 'locations.manage': true })
    acting.client = moderator.client
    const name = `${run.RUN} allowed city`
    const answer = await addLocation({ name_al: name, region_id: regionId })
    if (answer.id) locationIds.push(answer.id)
    expect(answer.error, 'the moderator with locations.manage adds a location').toBeUndefined()
    const stored = await run.admin.from('locations').select('id, name_al').eq('name_al', name)
    expect(stored.data, 'exactly one row was written').toHaveLength(1)
    await restore()
  })

  it('[SEC-X-INT-LOCATIONS-PERM-DENY] locations-perm refused on the real project', async () => {
    // a synthetic location to feature, so that a missing check could change a row of this run and never a real one
    const fixture = await run.admin.from('locations')
      .insert({ name_al: `${run.RUN} fixture city`, type: 'city', slug: `${run.RUN.replace(/_/g, '-')}-fixture`, parent_id: regionId, region_id: regionId })
      .select('id, is_featured').single()
    expect(fixture.error, 'the fixture location was prepared').toBeNull()
    locationIds.push(fixture.data?.id as number)
    const restore = await holdKeys({ 'locations.manage': false })
    acting.client = moderator.client
    const name = `${run.RUN} refused city`

    await expect(addLocation({ name_al: name, region_id: regionId }), 'addLocation throws for a moderator without the key').rejects.toThrow('forbidden')
    expect(await setLocationFeatured(fixture.data?.id as number, 3), 'setLocationFeatured is refused').toEqual({ error: 'forbidden' })

    expect((await run.admin.from('locations').select('id').eq('name_al', name)).data, 'no location row was written').toEqual([])
    const after = await run.admin.from('locations').select('is_featured, display_order').eq('id', fixture.data?.id as number).single()
    expect(after.data?.is_featured, 'the fixture location was not featured').toBe(fixture.data?.is_featured)
    await restore()
  })
})
