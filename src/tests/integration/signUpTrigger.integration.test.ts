/**
 * Real-boundary control for the sign-up trigger `public.handle_new_user` (Task 962 AC2, hardening v8b part 2, owner decision O962-1): the trigger keeps the avatar address of the sign-up
 * metadata only when it lies on the project's Cloudinary or on Google's picture host, and still creates the profile row when it does not. Anyone can send `avatar_url` to Supabase Auth
 * directly (it is not a form field), and the header renders the stored address as an image source. REAL Supabase Auth and the REAL database of the approved development project, synthetic
 * users only, verified clean-up.
 *  - SEC-962-SIGNUP-AVATAR-DENY: a sign-up whose metadata carries an address of another host (or no https address) gets its profile row with `avatar_url` null;
 *  - SEC-962-SIGNUP-AVATAR-ALLOW: a `https://lh3.googleusercontent.com/` address and a Cloudinary address of the project are stored as sent.
 * Needs `supabase/sql_migrations/task962/v8b2.sql` applied by the owner: before it, the DENY case FAILS (the live trigger keeps every https address).
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration -- src/tests/integration/signUpTrigger.integration.test.ts
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run } from '@/tests/integration/fixtures'

let run: Run

beforeAll(() => {
  run = createRun()
})
afterAll(async () => {
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const CLOUDINARY = 'https://res.cloudinary.com/die7okukn/image/upload/v1/zz-synth-signup.png'
const GOOGLE = 'https://lh3.googleusercontent.com/a/zz-synth-signup=s96-c'

/** the avatar address the profile row holds after the sign-up trigger ran */
async function avatarAfterSignUp(tag: string, avatar: unknown): Promise<{ name: string | null; avatar_url: string | null }> {
  const person = await run.makeUser(tag, { role: 'user', metadata: { avatar_url: avatar } })
  const row = await run.admin.from('users').select('name, avatar_url').eq('id', person.id).single()
  expect(row.error, `${tag}: the profile row exists (the sign-up was not refused)`).toBeNull()
  return row.data as { name: string | null; avatar_url: string | null }
}

describe('handle_new_user', () => {
  it('[SEC-962-SIGNUP-AVATAR-DENY] a foreign avatar address in the sign-up metadata is not stored, and the profile is still created', async () => {
    const foreign: [string, unknown][] = [
      ['another host', 'https://example.com/a.png'],
      ['a host that only starts like the Google host', 'https://lh3.googleusercontent.com.evil.example/a.png'],
      ['another Cloudinary cloud', 'https://res.cloudinary.com/another-cloud/image/upload/v1/a.png'],
      ['plain http', 'http://res.cloudinary.com/die7okukn/image/upload/v1/a.png'],
      ['a script address', 'javascript:alert(1)'],
    ]
    for (const [index, [label, address]] of foreign.entries()) {
      const tag = `signup-deny-${index}`
      const row = await avatarAfterSignUp(tag, address)
      expect(row.avatar_url, `${label}: no avatar address is stored`).toBeNull()
      expect(row.name, `${label}: the profile row still holds the sign-up name`).toBe(`${run.RUN} ${tag}`)
    }
  })

  it('[SEC-962-SIGNUP-AVATAR-ALLOW] a Google picture address and an address on the project Cloudinary are stored as sent, and a sign-up with no avatar stores none', async () => {
    expect((await avatarAfterSignUp('signup-allow-google', GOOGLE)).avatar_url, 'the Google picture address').toBe(GOOGLE)
    expect((await avatarAfterSignUp('signup-allow-cloudinary', CLOUDINARY)).avatar_url, 'the Cloudinary address of the project').toBe(CLOUDINARY)
    const none = await run.makeUser('signup-allow-none', { role: 'user' })
    const row = await run.admin.from('users').select('avatar_url').eq('id', none.id).single()
    expect(row.error).toBeNull()
    expect(row.data?.avatar_url, 'no metadata avatar: nothing stored').toBeNull()
  })
})
