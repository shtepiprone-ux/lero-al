/**
 * Real-boundary control for finding S44 (Task 923 Revision 7, R38): the REAL updateUserProfile, the REAL requireViewer and the REAL permission check run against
 * REAL Supabase Auth and the REAL database of the approved development project. The only doubles are the cookie-bound client factory (outside a Next request it
 * returns the client that holds the REAL session of the chosen synthetic staff member) and the cache refresh. Synthetic rows only, verified clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

import { updateUserProfile } from './index'

let run: Run
let staff: SyntheticUser
let target: SyntheticUser

beforeAll(async () => {
  run = createRun()
  staff = await run.makeUser('staff', { role: 'admin' })
  target = await run.makeUser('target', { role: 'user' })
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const stored = () => run.admin.from('users').select('name, role, status, is_verified').eq('id', target.id).single()

it('[SEC-S44-INT-DENY] updateUserProfile writes only the three text fields, never role, status or verification', async () => {
  const before = await stored()
  expect(before.error).toBeNull()
  acting.client = staff.client
  const answer = await updateUserProfile(target.id, { name: `${run.RUN} renamed`, role: 'admin', is_verified: true, status: 'blocked' } as never)
  expect(answer).toEqual({})
  const after = await stored()
  expect(after.error).toBeNull()
  expect(after.data?.role, 'the role is unchanged').toBe(before.data?.role)
  expect(after.data?.is_verified, 'the verification is unchanged').toBe(before.data?.is_verified)
  expect(after.data?.status, 'the status is unchanged').toBe(before.data?.status)
})

it('[SEC-S44-INT-ALLOW] updateUserProfile writes only the three text fields, never role, status or verification', async () => {
  acting.client = staff.client
  const name = `${run.RUN} display name`
  expect(await updateUserProfile(target.id, { name })).toEqual({})
  const after = await stored()
  expect(after.error).toBeNull()
  expect(after.data?.name).toBe(name)
})
