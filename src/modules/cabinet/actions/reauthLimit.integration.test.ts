/**
 * Real-boundary control for Task 923 R81 (b) (review 21 finding F2): the per-person limit of failed re-authentications, on REAL Supabase Auth and the REAL database of the
 * approved development project. The REAL `deleteOwnAccount` runs; the doubles are the cookie-bound client factory (it returns the client holding the REAL session of the
 * chosen person), the request headers and cookies, and the mail senders (recording sinks). The failure rows are prepared by the service role, exactly as the action writes
 * them. Synthetic users only, verified clean-up.
 * These cases need the table `public.reauth_failures` of hardening v7 (R81 (b)): until the owner has applied that file they FAIL on the development project (the count cannot be
 * read, so the action refuses, and the table the test prepares does not exist): that is the expected state, not a defect of the test. They are green after the apply (R81 (i)).
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))

import { deleteOwnAccount } from './index'

let run: Run
const people: SyntheticUser[] = []

beforeAll(() => { run = createRun() })
afterAll(async () => {
  const ids = people.map((p) => p.id)
  if (ids.length) await run.admin.from('reauth_failures').delete().in('user_id', ids)
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

async function personWithFailures(tag: string, failures: number): Promise<SyntheticUser> {
  const user = await run.makeUser(tag, { role: 'user' })
  people.push(user)
  acting.client = user.client
  const rows = Array.from({ length: failures }, () => ({ user_id: user.id }))
  const seeded = await run.admin.from('reauth_failures').insert(rows)
  expect(seeded.error, 'the failure rows were prepared (needs hardening v7: public.reauth_failures)').toBeNull()
  return user
}
const profileOf = (id: string) => run.admin.from('users').select('id').eq('id', id).maybeSingle()

describe('reauthLimit', () => {
  it('[SEC-X-INT-REAUTH-LIMIT-ALLOW] under the limit the right password works', async () => {
    const user = await personWithFailures('limit-allow', 4)
    expect(await deleteOwnAccount({ password: user.password }), 'four failures leave one attempt: the right password deletes the synthetic account').toEqual({})
    expect((await profileOf(user.id)).data, 'the profile row is gone').toBeNull()
    expect((await run.admin.auth.admin.getUserById(user.id)).data?.user ?? null, 'the Auth identity is gone').toBeNull()
  })

  it('[SEC-X-INT-REAUTH-LIMIT-DENY] past the limit even the right password is refused', async () => {
    const user = await personWithFailures('limit-deny', 5)
    expect(await deleteOwnAccount({ password: user.password }), 'five failures in the window: refused before Auth is called').toEqual({ error: 'rate_limited' })
    expect((await profileOf(user.id)).data?.id, 'the profile row is still there').toBe(user.id)
    expect((await run.admin.auth.admin.getUserById(user.id)).data?.user?.id, 'the Auth identity is still there').toBe(user.id)
  })
})
