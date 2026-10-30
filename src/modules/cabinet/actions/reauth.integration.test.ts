/**
 * Real-boundary control for Task 923 R70 (a) / R80 (owner decision D54): the REAL `initiateEmailChange` and `deleteOwnAccount` run against REAL Supabase Auth and the
 * REAL database of the approved development project. The password is checked by the real Auth sign-in of a separate client, exactly as in production. The doubles are
 * the cookie-bound client factory (outside a Next request it returns the client holding the REAL session of the chosen person), the request headers and cookies, and the
 * mail senders, which are recording sinks so that no real e-mail is ever sent. Synthetic users only, verified clean-up.
 * Not covered here: the Google-only branch (a synthetic person cannot sign in with Google); it is proved with doubles in `__tests__/reauth.security.test.ts`.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown, emails: [] as unknown[] }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (mail: unknown) => { acting.emails.push(mail) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))

import { deleteOwnAccount, initiateEmailChange } from './index'

let run: Run
const people: SyntheticUser[] = []

beforeAll(() => { run = createRun() })
afterAll(async () => {
  // the e-mail change rows of the run's people go first (they reference the account); then the verified clean-up of the run
  const ids = people.map((p) => p.id)
  if (ids.length) await run.admin.from('email_change_tokens').delete().in('user_id', ids)
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

async function person(tag: string): Promise<SyntheticUser> {
  const user = await run.makeUser(tag, { role: 'user' })
  people.push(user)
  acting.client = user.client
  acting.emails.length = 0
  return user
}
const tokensOf = (id: string) => run.admin.from('email_change_tokens').select('id').eq('user_id', id)
const profileOf = (id: string) => run.admin.from('users').select('id, pending_email').eq('id', id).maybeSingle()

describe('reauth', () => {
  it('[SEC-X-INT-REAUTH-EMAIL-ALLOW] reauth-email allowed on the real project', async () => {
    const user = await person('email-allow')
    const result = await initiateEmailChange({ newEmail: `${run.RUN}_changed@example.com`, locale: 'en', currentPassword: user.password })
    expect(result, 'the right password starts the change').toEqual({ pendingEmail: `${run.RUN}_changed@example.com`.toLowerCase() })
    expect((await tokensOf(user.id)).data, 'one token was stored').toHaveLength(1)
    expect(acting.emails, 'the confirmation went out once').toHaveLength(1)
  })

  it('[SEC-X-INT-REAUTH-EMAIL-DENY] reauth-email refused on the real project', async () => {
    const user = await person('email-deny')
    const none = await initiateEmailChange({ newEmail: `${run.RUN}_blocked@example.com`, locale: 'en' })
    expect(none.reason, 'no password').toBe('invalid_password')
    const wrong = await initiateEmailChange({ newEmail: `${run.RUN}_blocked@example.com`, locale: 'en', currentPassword: `${user.password}x` })
    expect(wrong.reason, 'a wrong password').toBe('invalid_password')
    expect((await tokensOf(user.id)).data, 'no token').toEqual([])
    expect((await profileOf(user.id)).data?.pending_email ?? null, 'no pending address').toBeNull()
    expect(acting.emails, 'no e-mail').toEqual([])
  })

  it('[SEC-X-INT-REAUTH-DELETE-ALLOW] reauth-delete allowed on the real project', async () => {
    const user = await person('delete-allow')
    expect(await deleteOwnAccount({ password: user.password }), 'the right password deletes the synthetic account').toEqual({})
    expect((await profileOf(user.id)).data, 'the profile row is gone').toBeNull()
    const auth = await run.admin.auth.admin.getUserById(user.id)
    expect(auth.data?.user ?? null, 'the Auth identity is gone').toBeNull()
  })

  it('[SEC-X-INT-REAUTH-DELETE-DENY] reauth-delete refused on the real project', async () => {
    const user = await person('delete-deny')
    expect(await deleteOwnAccount({ password: `${user.password}x` }), 'a wrong password').toEqual({ error: 'invalid_password' })
    expect(await deleteOwnAccount(), 'no password').toEqual({ error: 'invalid_password' })
    expect((await profileOf(user.id)).data?.id, 'the profile row is still there').toBe(user.id)
    expect((await run.admin.auth.admin.getUserById(user.id)).data?.user?.id, 'the Auth identity is still there').toBe(user.id)
  })
})
