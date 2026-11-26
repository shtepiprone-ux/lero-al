/**
 * Real-boundary control for Task 988 (owner decisions O988-1, O988-3): the account language. REAL Supabase Auth and the REAL database of the approved development
 * project, synthetic users only, verified clean-up.
 *  - AC3: the REAL `refreshSession` of the request proxy, given the real session cookies of a synthetic person, reads that person's own `preferred_locale` with the
 *    session client (RLS `users_self_read`); the same session client reading another person's row gets no row.
 *  - AC4: the sign-up trigger `public.handle_new_user()` stores the sign-up language of the metadata (`preferred_locale`) when it is one of the four codes, and `'sq'`
 *    for any other value or none. Needs `supabase/sql_migrations/task988/task988.sql` applied by the owner: before it, the `uk` case FAILS (the live trigger
 *    inserts no `preferred_locale`, so the column default `'sq'` is stored).
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration -- src/tests/integration/accountLocale.integration.test.ts
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'
import { refreshSession } from '@/lib/auth/middleware'

let run: Run

beforeAll(() => {
  run = createRun()
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

/** The auth cookies the browser of this person holds: the SDK writes them itself from the person's real session. */
async function cookieHeaderOf(person: SyntheticUser): Promise<string> {
  const jar: { name: string; value: string }[] = []
  const sdk = createServerClient(run.env.url, run.env.anonKey, {
    cookies: { getAll: () => [], setAll: (rows) => { for (const row of rows) jar.push({ name: row.name, value: row.value }) } },
  })
  const set = await sdk.auth.setSession({ access_token: person.accessToken, refresh_token: person.refreshToken })
  expect(set.error, 'the SDK accepts the real session').toBeNull()
  const auth = jar.filter((row) => row.name.startsWith('sb-') && row.value !== '')
  expect(auth.length, 'the SDK wrote auth cookies').toBeGreaterThan(0)
  return auth.map((row) => `${row.name}=${row.value}`).join('; ')
}

/** the language the profile row holds after the sign-up trigger ran */
async function localeAfterSignUp(tag: string, metadata: Record<string, unknown>): Promise<string> {
  const person = await run.makeUser(tag, { role: 'user', metadata })
  const row = await run.admin.from('users').select('preferred_locale').eq('id', person.id).single()
  expect(row.error, `${tag}: the profile row exists`).toBeNull()
  return row.data?.preferred_locale as string
}

describe('account language', () => {
  it('[AC3] refreshSession reads the caller\'s own preferred_locale with the session client; another person\'s row gives no row', async () => {
    const reader = await run.makeUser('locale-reader', { role: 'user' })
    const other = await run.makeUser('locale-other', { role: 'user' })
    expect((await run.admin.from('users').update({ preferred_locale: 'it' }).eq('id', reader.id)).error).toBeNull()
    expect((await run.admin.from('users').update({ preferred_locale: 'en' }).eq('id', other.id)).error).toBeNull()

    // the setup file put the approved project's address and anon key into the environment the real refreshSession reads
    const result = await refreshSession(new NextRequest('https://lero.al/sq/listings', { headers: { cookie: await cookieHeaderOf(reader) } }))
    expect(result.accountLocale, 'the reader\'s own account language').toBe('it')
    const guest = await refreshSession(new NextRequest('https://lero.al/sq/listings'))
    expect(guest.accountLocale, 'a guest has none').toBeNull()

    const foreign = await reader.client.from('users').select('preferred_locale').eq('id', other.id).maybeSingle()
    expect(foreign.error).toBeNull()
    expect(foreign.data, 'another person\'s row is not visible to the session client').toBeNull()
  })

  it('[AC4] a sign-up keeps its language: metadata uk → uk; xx, a crafted value or none → sq', async () => {
    expect(await localeAfterSignUp('signup-locale-uk', { preferred_locale: 'uk' }), 'uk is stored').toBe('uk')
    expect(await localeAfterSignUp('signup-locale-it', { preferred_locale: 'it' }), 'it is stored').toBe('it')
    expect(await localeAfterSignUp('signup-locale-xx', { preferred_locale: 'xx' }), 'xx is not a code').toBe('sq')
    expect(await localeAfterSignUp('signup-locale-upper', { preferred_locale: 'UK' }), 'UK is not a code').toBe('sq')
    expect(await localeAfterSignUp('signup-locale-crafted', { preferred_locale: "uk'; drop table users; --" }), 'a crafted value').toBe('sq')
    expect(await localeAfterSignUp('signup-locale-none', {}), 'no language').toBe('sq')
  })
})
