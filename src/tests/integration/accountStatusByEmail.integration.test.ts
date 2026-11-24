/**
 * Real-boundary control for `public.account_status_by_email` (Task 991 Revision 1, F1): the ONE lookup the auth actions use to find the account of an address
 * (sign-up notice, reset request of a blocked address, the status told after a proved password), on the REAL development database. It replaces a wildcard
 * search (`admin_search_users_by_email`: `ILIKE '%' || q || '%' LIMIT 100`) followed by up to 100 Auth admin calls.
 *  - SEC-991-STATUS-ALLOW: the service role gets exactly one row for a synthetic address in any letter case, with its status; no row for `%`, `_`, a part of an address or an unknown address;
 *  - SEC-991-STATUS-DENY: `anon` and `authenticated` are refused with permission denied (42501), whatever they pass.
 * Needs the SQL of `supabase/sql_migrations/task991/task991.sql` applied by the owner (until then every case fails on the missing function). Synthetic accounts only, removed at the end.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let person: SyntheticUser
let blockedPerson: SyntheticUser

beforeAll(async () => {
  run = createRun()
  person = await run.makeUser('status-lookup-person', { role: 'user' })
  blockedPerson = await run.makeUser('status-lookup-blocked', { role: 'user', status: 'blocked' })
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const lookup = (email: string) => run.admin.rpc('account_status_by_email', { p_email: email })

describe('account_status_by_email', () => {
  it('[SEC-991-STATUS-ALLOW] the service role gets exactly one row for the address, in any letter case, with its id, address and status', async () => {
    for (const address of [person.email, person.email.toUpperCase(), person.email.toLowerCase()]) {
      const found = await lookup(address)
      expect(found.error, address).toBeNull()
      expect(found.data, address).toHaveLength(1)
      expect(found.data![0]).toMatchObject({ id: person.id, status: 'active', suspended_until: null })
      expect(String(found.data![0].email).toLowerCase()).toBe(person.email.toLowerCase())
    }
  })

  it('[SEC-991-STATUS-ALLOW] a blocked account is found with its blocked status', async () => {
    const found = await lookup(blockedPerson.email)
    expect(found.error).toBeNull()
    expect(found.data).toHaveLength(1)
    expect(found.data![0]).toMatchObject({ id: blockedPerson.id, status: 'blocked' })
  })

  it('[SEC-991-STATUS-ALLOW] `%`, `_`, a part of an address and an unknown address match nothing: no row, no error (exact match, no LIKE)', async () => {
    const [local, domain] = person.email.split('@')
    const cases: [string, string][] = [
      ['the wildcard %', '%'],
      ['the wildcard _', '_'],
      ['a % wildcard in the local part', `%${local.slice(1)}@${domain}`],
      ['a _ wildcard in the local part', `_${local.slice(1)}@${domain}`],
      ['a % wildcard for the domain', `${local}@%`],
      ['a part of the address', local],
      ['an unknown address', `${run.RUN}_nobody@example.com`],
      ['an empty address', ''],
    ]
    for (const [label, address] of cases) {
      const found = await lookup(address)
      expect(found.error, label).toBeNull()
      expect(found.data, label).toEqual([])
    }
  })

  it('[SEC-991-STATUS-DENY] anon and authenticated cannot execute it: permission denied, and no answer', async () => {
    const args = { p_email: person.email }
    const anon = await run.anonymousClient().rpc('account_status_by_email', args)
    expect(anon.error?.code, 'anon execute').toBe('42501')
    expect(anon.data).toBeNull()
    const session = await person.client.rpc('account_status_by_email', args)
    expect(session.error?.code, 'authenticated execute').toBe('42501')
    expect(session.data).toBeNull()
  })
})
