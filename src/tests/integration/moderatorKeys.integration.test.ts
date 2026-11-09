/**
 * Real-boundary control for the moderator switches (Task 923 R75, owner decision D55; cases SEC-X-INT-MOD-KEYS-* and SEC-X-INT-PERMS-ADMIN-ALLOW): the REAL `updateUserProfile`
 * and `setModeratorPermission`, with the REAL `requireViewer`, `checkStaff` and the REAL read and write of `role_permissions` / `role_permission_events`, run against REAL
 * Supabase Auth and the REAL database of the approved development project. The only doubles are the cookie-bound client factory (outside a Next request it returns the client
 * that holds the REAL session of the chosen synthetic person) and the cache refresh. The stored switch of `users.edit` is read first and put back exactly as it was, and the audit
 * rows the cases write (they carry the synthetic administrator as actor) are removed and counted here. Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-MOD-KEYS-ALLOW / -DENY: a moderator acts on a profile only while the administrator's switch for `users.edit` is on;
 *  - SEC-X-INT-PERMS-ADMIN-ALLOW: the administrator switches a key off and on again, two values stored and two audit rows.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

import { updateUserProfile } from '@/modules/admin/actions'
import { setModeratorPermission } from '@/modules/admin/actions/permissions'

const KEY = 'users.edit'
let run: Run
let moderator: SyntheticUser
let administrator: SyntheticUser
let target: SyntheticUser
let storedSwitch: Record<string, unknown> | null

beforeAll(async () => {
  run = createRun()
  moderator = await run.makeUser('keys-moderator', { role: 'moderator' })
  administrator = await run.makeUser('keys-administrator', { role: 'admin' })
  target = await run.makeUser('keys-target', { role: 'user' })
  const row = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', KEY).maybeSingle()
  expect(row.error, 'the stored switch is readable').toBeNull()
  storedSwitch = row.data
})
afterAll(async () => {
  // the stored switch goes back exactly as it was; the audit rows of this run (their actor is the synthetic administrator) are removed
  const restored = storedSwitch
    ? await run.admin.from('role_permissions').upsert(storedSwitch, { onConflict: 'role,permission_key' })
    : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', KEY)
  expect(restored.error, 'the stored switch is restored').toBeNull()
  await run.admin.from('role_permission_events').delete().eq('actor_user_id', administrator.id)
  const events = await run.admin.from('role_permission_events').select('id').eq('actor_user_id', administrator.id)
  expect(events.error).toBeNull()
  expect(events.data, 'no audit row of this run is left').toEqual([])
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const setSwitch = async (allowed: boolean) => {
  const written = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: KEY, allowed }, { onConflict: 'role,permission_key' })
  expect(written.error, `the switch ${KEY} is set to ${allowed} for this case`).toBeNull()
}
const nameOf = async () => (await run.admin.from('users').select('name').eq('id', target.id).single()).data?.name

describe('moderatorKeys', () => {
  it('[SEC-X-INT-MOD-KEYS-ALLOW] a moderator with the key acts', async () => {
    await setSwitch(true)
    acting.client = moderator.client
    const original = await nameOf()
    const renamed = `${run.RUN} keyed rename`
    expect(await updateUserProfile(target.id, { name: renamed }), 'the moderator with users.edit changes the profile').toEqual({})
    expect(await nameOf(), 'the change is stored').toBe(renamed)
    // restored by the test
    expect((await run.admin.from('users').update({ name: original }).eq('id', target.id)).error).toBeNull()
    expect(await nameOf(), 'the name is back as it was').toBe(original)
  })

  it('[SEC-X-INT-MOD-KEYS-DENY] a moderator without the key is refused', async () => {
    await setSwitch(false)
    acting.client = moderator.client
    const before = await nameOf()
    await expect(updateUserProfile(target.id, { name: `${run.RUN} refused rename` }), 'the action refuses a moderator whose switch is off').rejects.toThrow('forbidden')
    expect(await nameOf(), 'the profile is unchanged').toBe(before)
  })

  it('[SEC-X-INT-PERMS-ADMIN-ALLOW] the administrator changes a switch on the real project', async () => {
    acting.client = administrator.client
    const eventsOfRun = async () => (await run.admin.from('role_permission_events').select('old_allowed, new_allowed, permission_key, actor_user_id').eq('actor_user_id', administrator.id).order('created_at', { ascending: true })).data ?? []
    await setSwitch(true)
    expect(await setModeratorPermission(KEY, false), 'the administrator switches the key off').toEqual({})
    expect((await run.admin.from('role_permissions').select('allowed').eq('role', 'moderator').eq('permission_key', KEY).single()).data?.allowed, 'the value false is stored').toBe(false)
    expect(await setModeratorPermission(KEY, true), 'the administrator switches the key on again').toEqual({})
    expect((await run.admin.from('role_permissions').select('allowed').eq('role', 'moderator').eq('permission_key', KEY).single()).data?.allowed, 'the value true is stored').toBe(true)
    const events = await eventsOfRun()
    expect(events, 'two audit rows, each with its old and new value and the administrator as actor').toEqual([
      { permission_key: KEY, old_allowed: true, new_allowed: false, actor_user_id: administrator.id },
      { permission_key: KEY, old_allowed: false, new_allowed: true, actor_user_id: administrator.id },
    ])
  })
})
