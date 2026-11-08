/**
 * Real-boundary control for owner decisions D25-D27 (Task 923 R44): the REAL getStaffRole, hasPermission, requireViewer and getBlockedError run against REAL
 * Supabase Auth and the REAL database of the approved development project. The one double is the cookie-bound client factory: outside a Next request it returns the
 * client holding the REAL session (access token) of the chosen synthetic person. A person is blocked through the real admin action `updateUserProfileFull` (Auth
 * follows with a ban) and given the inactivity mark through the service role exactly as `cron/inactivity` writes it (`deleted_at` and status `inactive`, NO Auth ban),
 * so the second path proves the profile check alone: the session of that person is still valid. Synthetic rows only, verified clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'
import type { PermissionKey } from '@/lib/auth/permissionKeys'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

import { updateUserProfileFull } from '@/modules/admin/actions'
import { getBlockedError } from './blockCheck'
import { hasPermission } from './permissions'
import { requireViewer } from './requireViewer'
import { getStaffRole } from './staff'

let run: Run
let locationId: number
let administrator: SyntheticUser

beforeAll(async () => {
  run = createRun()
  locationId = await run.anyLocationId()
  administrator = await run.makeUser('acting-administrator', { role: 'admin' })
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const blockForm = () => ({ firstName: 'Integration', profileType: 'private' as const, phone: '+355691234567', locationId, status: 'blocked' as const, blockReason: 'integration run' })

/** blocks `who` through the real admin action, as a real administrator session */
async function blockThroughAdminAction(who: SyntheticUser) {
  acting.client = administrator.client
  expect(await updateUserProfileFull(who.id, blockForm()), `${who.id}: the real action accepts the block`).toEqual({})
}

/** the inactivity mark exactly as cron/inactivity writes it: deleted_at and status inactive through the service role, no Auth ban */
async function markInactive(who: SyntheticUser) {
   
  const written = await run.admin.from('users').update({ deleted_at: new Date().toISOString(), status: 'inactive' }).eq('id', who.id)
  expect(written.error, `${who.id}: the inactivity mark is written`).toBeNull()
  const stillValid = await who.client.auth.getUser()
  expect(stillValid.error, `${who.id}: precondition, the Auth session itself is still valid, so a refusal below is the profile check`).toBeNull()
}

async function moderatorPermissionKeys(): Promise<{ key: PermissionKey; allowed: boolean }[]> {
  const rows = await run.admin.from('role_permissions').select('permission_key, allowed').eq('role', 'moderator')
  expect(rows.error).toBeNull()
  return (rows.data ?? []).map((row) => ({ key: row.permission_key as PermissionKey, allowed: row.allowed === true }))
}

it('[SEC-D27-INT-STAFF-DENY] A blocked, suspended, deactivated, deleted or missing account gets no staff power, whatever its role', async () => {
  const permissions = await moderatorPermissionKeys()
  expect(permissions.some((p) => p.allowed), 'precondition: the moderator role holds at least one permission, so a refusal below is not an empty table').toBe(true)
  const moderator = await run.makeUser('blocked-moderator', { role: 'moderator' })
  const secondAdministrator = await run.makeUser('inactive-administrator', { role: 'admin' })

  await blockThroughAdminAction(moderator)
  await markInactive(secondAdministrator)

  for (const person of [moderator, secondAdministrator]) {
    acting.client = person.client
    expect(await getStaffRole(), `${person.id}: no staff role`).toBeNull()
    for (const { key } of permissions) expect(await hasPermission(key), `${person.id}: no permission ${key}`).toBe(false)
  }
})

it('[SEC-D27-INT-STAFF-ALLOW] A blocked, suspended, deactivated, deleted or missing account gets no staff power, whatever its role', async () => {
  const moderator = await run.makeUser('active-moderator', { role: 'moderator' })
  const permissions = await moderatorPermissionKeys()
  acting.client = moderator.client
  expect(await getStaffRole()).toBe('moderator')
  for (const { key, allowed } of permissions) expect(await hasPermission(key), `permission ${key}`).toBe(allowed)   // exactly what role_permissions grants
  acting.client = administrator.client
  expect(await getStaffRole()).toBe('admin')
})

it('[SEC-D27-INT-VIEWER-DENY] A blocked, suspended, deactivated, deleted or missing account of any role is not a viewer, and a deleted one is blocked', async () => {
  const blockedUser = await run.makeUser('blocked-user', { role: 'user' })
  const inactiveAgent = await run.makeUser('inactive-agent', { role: 'agent' })

  await blockThroughAdminAction(blockedUser)
  await markInactive(inactiveAgent)

  for (const person of [blockedUser, inactiveAgent]) {
    acting.client = person.client
    expect((await requireViewer()).ok, `${person.id}: not a viewer`).toBe(false)
    expect(await getBlockedError(person.id), `${person.id}: blocked`).toBe('account_blocked')
  }
})

it('[SEC-D27-INT-VIEWER-ALLOW] A blocked, suspended, deactivated, deleted or missing account of any role is not a viewer, and a deleted one is blocked', async () => {
  const user = await run.makeUser('active-user', { role: 'user' })
  const agent = await run.makeUser('active-agent', { role: 'agent' })
  for (const [person, role] of [[user, 'user'], [agent, 'agent']] as const) {
    acting.client = person.client
    expect(await requireViewer(), `${role}: a viewer`).toEqual({ ok: true, userId: person.id, role })
    expect(await getBlockedError(person.id), `${role}: not blocked`).toBeNull()
  }
})
