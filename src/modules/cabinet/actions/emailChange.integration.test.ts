/**
 * Real-boundary control for Task 923 R66 (d): the life of an e-mail change link, on REAL Supabase Auth and the REAL database of the approved development project.
 * The REAL `initiateEmailChange` and `consumeEmailChangeToken` run; the doubles are the cookie-bound client factory (it returns the client holding the REAL session of
 * the chosen person), the request headers and cookies, and the mail senders, which are recording sinks (the link is read from the recorded message, no real e-mail is
 * sent). Synthetic users only, verified clean-up.
 * The two SESSIONS-END cases need the database function `public.end_user_sessions` of hardening v7 (R65 (c)); until the owner has applied that file they FAIL on the
 * development project with a message that says so: that is the expected state, not a defect of the test.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown, emails: [] as { verificationUrl: string }[] }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/headers', () => ({ headers: async () => new Headers(), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async (mail: { verificationUrl: string }) => { acting.emails.push(mail) } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))

import { consumeEmailChangeToken, initiateEmailChange } from './index'

let run: Run
const people: SyntheticUser[] = []

beforeAll(() => { run = createRun() })
afterAll(async () => {
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
/** asks for a change and returns the raw token of the link that was "mailed" */
async function requestChange(user: SyntheticUser, address: string): Promise<string> {
  const before = acting.emails.length
  const result = await initiateEmailChange({ newEmail: address, locale: 'en', currentPassword: user.password })
  expect(result.pendingEmail, 'the request is accepted').toBe(address.toLowerCase())
  expect(acting.emails.length, 'one confirmation was mailed').toBe(before + 1)
  return new URL(acting.emails[before].verificationUrl).searchParams.get('token')!
}
const emailOf = async (id: string) => (await run.admin.auth.admin.getUserById(id)).data.user?.email ?? null
const addressFor = (tag: string) => `${run.RUN}_${tag}@example.com`.toLowerCase()

describe('emailChange', () => {
  it('[SEC-X-INT-EMAIL-TOKEN-ONCE-ALLOW] email-token-once allowed on the real project', async () => {
    const user = await person('once-allow')
    const raw = await requestChange(user, addressFor('once-allow-new'))
    const result = await consumeEmailChangeToken(raw)
    expect(result.success, 'the permitted link changes the address').toBe(true)
    expect(await emailOf(user.id)).toBe(addressFor('once-allow-new'))
  })

  it('[SEC-X-INT-EMAIL-TOKEN-ONCE-DENY] email-token-once refused on the real project', async () => {
    const user = await person('once-deny')
    const raw = await requestChange(user, addressFor('once-deny-new'))
    const [first, second] = await Promise.all([consumeEmailChangeToken(raw), consumeEmailChangeToken(raw)])
    const answers = [first, second]
    expect(answers.filter((a) => a.success), 'exactly one success').toHaveLength(1)
    expect(answers.filter((a) => !a.success).map((a) => a.errorCode), 'the other one is "used"').toEqual(['consumed'])
    expect(await emailOf(user.id)).toBe(addressFor('once-deny-new'))
  })

  it('[SEC-X-INT-EMAIL-TOKEN-LATEST-ALLOW] email-token-latest allowed on the real project', async () => {
    const user = await person('latest-allow')
    await requestChange(user, addressFor('latest-allow-first'))
    const second = await requestChange(user, addressFor('latest-allow-second'))
    expect((await consumeEmailChangeToken(second)).success, 'the newest link works').toBe(true)
    expect(await emailOf(user.id)).toBe(addressFor('latest-allow-second'))
  })

  it('[SEC-X-INT-EMAIL-TOKEN-LATEST-DENY] email-token-latest refused on the real project', async () => {
    const user = await person('latest-deny')
    const first = await requestChange(user, addressFor('latest-deny-first'))
    await requestChange(user, addressFor('latest-deny-second'))
    const result = await consumeEmailChangeToken(first)
    expect(result.success, 'the earlier link is dead').toBeUndefined()
    expect(result.error).toBeTruthy()
    expect(await emailOf(user.id), 'the address did not change to the first one').toBe(user.email.toLowerCase())
  })

  it('[SEC-X-INT-EMAIL-SESSIONS-END-ALLOW] email-sessions-end allowed on the real project', async () => {
    const user = await person('sessions-allow')
    const raw = await requestChange(user, addressFor('sessions-allow-new'))
    const result = await consumeEmailChangeToken(raw)
    expect(result, 'the change completed and every session of the account was ended (needs hardening v7: end_user_sessions)').toEqual({ success: true })
    // the person signs in again with the new address and the same password: the new session works
    const again = await run.signIn(addressFor('sessions-allow-new'), user.password)
    expect(again.result.error, 'a new sign-in works').toBeNull()
    expect((await again.client.auth.getUser()).error, 'and the new session is valid').toBeNull()
  })

  it('[SEC-X-INT-EMAIL-SESSIONS-END-DENY] email-sessions-end refused on the real project', async () => {
    const user = await person('sessions-deny')
    const second = await run.signIn(user.email, user.password)            // a second signed-in session of the same account
    expect(second.result.error, 'precondition: the second session exists').toBeNull()
    const raw = await requestChange(user, addressFor('sessions-deny-new'))
    const result = await consumeEmailChangeToken(raw)
    expect(result, 'the change completed and every session of the account was ended (needs hardening v7: end_user_sessions)').toEqual({ success: true })
    expect((await second.client.auth.getUser()).error, 'the old session is no longer valid').not.toBeNull()
    const read = await second.client.from('users').select('id').eq('id', user.id)
    expect(read.data ?? [], 'a database read with the old session returns nothing').toEqual([])
  })
})
