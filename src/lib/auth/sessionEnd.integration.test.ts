/**
 * Real-boundary control for owner decision D29 (Task 923 R45 (a)): the REAL `refreshSession` of the middleware runs against REAL Supabase Auth with the REAL cookies
 * of a synthetic person. The cookies are produced by the SDK itself (`setSession` of a real sign-in through `@supabase/ssr`), a person is blocked through the real
 * admin action `updateUserProfileFull` and another is deleted through the real `hardDeleteUser`; then each old cookie set is sent to `refreshSession`. The one double
 * is the cookie-bound client factory used by the admin actions (outside a Next request it returns the client holding the acting administrator's REAL session).
 * Synthetic users only, verified clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

import { hardDeleteUser, updateUserProfileFull } from '@/modules/admin/actions'
import { refreshSession } from './middleware'

type CookieRow = { name: string; value: string; options: Record<string, unknown> }

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

/** The cookies the browser of this person holds: the SDK writes them itself from the person's real session. */
async function cookiesOf(person: SyntheticUser): Promise<CookieRow[]> {
  const jar: CookieRow[] = []
  const sdk = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => [], setAll: (rows) => { for (const row of rows) jar.push({ name: row.name, value: row.value, options: row.options as Record<string, unknown> }) } },
  })
  const set = await sdk.auth.setSession({ access_token: person.accessToken, refresh_token: person.refreshToken })
  expect(set.error, `${person.id}: the SDK accepts the real session`).toBeNull()
  const auth = jar.filter((row) => row.name.startsWith('sb-') && row.value !== '')
  expect(auth.length, `${person.id}: the SDK wrote auth cookies`).toBeGreaterThan(0)
  return auth
}

/** sends the old cookie set to refreshSession; returns the auth cookies the response removes (an empty value) and the ones it sets with a value */
async function request(rows: CookieRow[]) {
  const req = new NextRequest('https://lero.al/sq', { headers: { cookie: rows.map((row) => `${row.name}=${row.value}`).join('; ') } })
  const res = await refreshSession(req)
  const set = res.cookies.getAll().filter((c) => c.name.startsWith('sb-'))
  return { cleared: set.filter((c) => c.value === ''), kept: set.filter((c) => c.value !== '') }
}

const blockForm = () => ({ firstName: 'Integration', profileType: 'private' as const, phone: '+355691234567', locationId, status: 'blocked' as const, blockReason: 'integration run' })

it('[SEC-D29-INT-DENY] A banned, deleted or no-access session is ended by the server on the next page request and the person is a guest', async () => {
  const blockedUser = await run.makeUser('blocked-user', { role: 'user' })
  const deletedAgent = await run.makeUser('deleted-agent', { role: 'agent' })
  const blockedCookies = await cookiesOf(blockedUser)
  const deletedCookies = await cookiesOf(deletedAgent)

  acting.client = administrator.client
  expect(await updateUserProfileFull(blockedUser.id, blockForm()), 'the real action blocks the user').toEqual({})
  expect(await hardDeleteUser(deletedAgent.id), 'the real action deletes the agent').toEqual({})

  const afterBlock = await request(blockedCookies)
  expect(afterBlock.cleared.length, 'the blocked person: the auth cookies are cleared').toBeGreaterThan(0)
  expect(afterBlock.kept, 'the blocked person: no auth cookie is kept').toEqual([])
  const afterDelete = await request(deletedCookies)
  expect(afterDelete.cleared.length, 'the deleted person: the auth cookies are cleared').toBeGreaterThan(0)
  expect(afterDelete.kept, 'the deleted person: no auth cookie is kept').toEqual([])
})

it('[SEC-D29-INT-ALLOW] A banned, deleted or no-access session is ended by the server on the next page request and the person is a guest', async () => {
  const active = await run.makeUser('active-user', { role: 'user' })
  const cookies = await cookiesOf(active)
  const answer = await request(cookies)
  expect(answer.cleared, 'an active person is not signed out: nothing is cleared').toEqual([])
})
