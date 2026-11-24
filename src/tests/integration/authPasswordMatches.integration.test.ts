/**
 * Real-boundary control for `public.auth_password_matches` (Task 991 AC5): the one password check outside Supabase Auth, used by the server action `explainRefusedSignIn`
 * on the REAL development database.
 *  - SEC-991-RPC-ALLOW: the service role gets `true` for the right password of a synthetic account (in any letter case of the address) and `false` for a wrong password,
 *    an unknown address, an empty password and an input of the wrong shape; it never raises;
 *  - SEC-991-RPC-DENY: `anon` and `authenticated` are refused with permission denied (42501), whatever they pass.
 * Needs the SQL of `supabase/sql_migrations/task991/task991.sql` applied by the owner (until then every case fails on the missing function). Synthetic accounts only, removed at the end.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let person: SyntheticUser

beforeAll(async () => {
  run = createRun()
  person = await run.makeUser('password-check-person', { role: 'user' })
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const matches = (email: string, password: string) => run.admin.rpc('auth_password_matches', { p_email: email, p_password: password })

describe('auth_password_matches', () => {
  it('[SEC-991-RPC-ALLOW] the service role gets true for the right password, in any letter case of the address', async () => {
    const right = await matches(person.email, person.password)
    expect(right.error).toBeNull()
    expect(right.data).toBe(true)
    const upper = await matches(person.email.toUpperCase(), person.password)
    expect(upper.error).toBeNull()
    expect(upper.data).toBe(true)
  })

  it('[SEC-991-RPC-ALLOW] a wrong password, an unknown address, an empty password and an input of the wrong shape give false and raise nothing', async () => {
    const cases: [string, string, string][] = [
      ['a wrong password', person.email, `${person.password}x`],
      ['an unknown address', `${run.RUN}_nobody@example.com`, person.password],
      ['an empty password', person.email, ''],
      ['an address over 254 characters', `${'a'.repeat(250)}@example.com`, person.password],
      ['a password over 1024 characters', person.email, 'p'.repeat(1025)],
    ]
    for (const [label, email, password] of cases) {
      const answer = await matches(email, password)
      expect(answer.error, label).toBeNull()
      expect(answer.data, label).toBe(false)
    }
  })

  it('[SEC-991-RPC-DENY] anon and authenticated cannot execute it: permission denied, and no answer', async () => {
    const args = { p_email: person.email, p_password: person.password }
    const anon = await run.anonymousClient().rpc('auth_password_matches', args)
    expect(anon.error?.code, 'anon execute').toBe('42501')
    expect(anon.data).toBeNull()
    const session = await person.client.rpc('auth_password_matches', args)
    expect(session.error?.code, 'authenticated execute').toBe('42501')
    expect(session.data).toBeNull()
  })
})
