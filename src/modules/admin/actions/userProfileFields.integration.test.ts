/**
 * Real-boundary control for finding S44 (Task 923 Revision 7, R38): the REAL updateUserProfile, the REAL requireViewer and the REAL permission check run against
 * REAL Supabase Auth and the REAL database of the approved development project. The only doubles are the cookie-bound client factory (outside a Next request it
 * returns the client that holds the REAL session of the chosen synthetic staff member) and the cache refresh. Synthetic rows only, verified clean-up.
 * Task 956 AC4 (hardening v8b, finding DB-03): a SESSION of the person cannot write the ten server-only columns of `users`, the seven text columns hold their bound and shape on the
 * direct database path (the session and the service role alike), and the server (service role) still writes the ten columns.
 *  - SEC-X-INT-USERS-SERVER-ONLY-DENY / -ALLOW: each of the ten columns is refused to the person's own session (permission denied, the row unchanged) and written by the service role;
 *  - SEC-X-INT-USERS-CHECKS-DENY / -ALLOW: a value past its bound or with the wrong shape is refused (23514), a value on the bound is stored;
 *  - SEC-X-INT-USERS-INSERT-DENY (Review 4, AC15): INSERT on `users` is granted to `authenticated` on no column (the application inserts nothing with a session: `users` has no permissive INSERT
 *    policy and the sign-up trigger makes the row), so every session insert and upsert is refused by the grant (permission denied).
 * Task 962 AC1 (hardening v8b part 2, owner decision O962-1): the address of an avatar or a company logo lies on the project's Cloudinary (the avatar may also lie on Google's picture host).
 *  - SEC-962-USER-IMAGE-PREFIX-DENY / -ALLOW: an address of another host is refused on the direct path (23514, the service role alike), the allowed ones are stored.
 * The two Task 962 cases need `supabase/sql_migrations/task962/v8b2.sql` applied by the owner: before it the DENY case FAILS.
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

// ── Task 956 AC4 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** the cloud of the project: the CHECKs `users_avatar_url_prefix_check` and `users_company_logo_url_prefix_check` of hardening v8b part 2 (Task 962) pin it */
const CLOUD = 'die7okukn'
/** the ten columns a session must never write (scripts/quality/db-catalog-audit.mjs USERS_SERVER_ONLY_COLUMNS), each with a value that is valid for its type */
const SERVER_ONLY: [column: string, value: unknown][] = [
  ['avatar_url', `https://res.cloudinary.com/${CLOUD}/image/upload/zz.png`],
  ['company_id', '00000000-0000-4000-8000-000000000001'],
  ['company_logo_url', `https://res.cloudinary.com/${CLOUD}/image/upload/zz-logo.png`],
  ['created_at', '2000-01-01T00:00:00Z'],
  ['inactivity_warning_sent_at', '2000-01-01T00:00:00Z'],
  ['last_seen_at', '2000-01-01T00:00:00Z'],
  ['location_request', { city: 'zz' }],
  ['pending_email', 'zz-pending@example.com'],
  ['public_id', 987654321],
  ['social_provider', 'zz'],
]
const columnsOf = async (names: string[]) => (await run.admin.from('users').select(names.join(', ')).eq('id', target.id).single<Record<string, unknown>>()).data

it('[SEC-X-INT-USERS-SERVER-ONLY-DENY] a session cannot write a server-only column of its own row', async () => {
  const before = await columnsOf(SERVER_ONLY.map(([column]) => column))
  expect(before, 'precondition: the row is readable').not.toBeNull()
  for (const [column, value] of SERVER_ONLY) {
    const refused = await target.client.from('users').update({ [column]: value }).eq('id', target.id).select('id')
    expect(refused.error?.code, `${column}: refused with 42501`).toBe('42501')
    expect(refused.error?.message, `${column}: refused by the column grant, not by a trigger`).toMatch(/permission denied/i)
    expect(refused.data, `${column}: nothing returned`).toBeNull()
  }
  // one update of all ten at once is refused as a whole, and the row is as it was
  const all = await target.client.from('users').update(Object.fromEntries(SERVER_ONLY)).eq('id', target.id).select('id')
  expect(all.error?.code, 'all ten at once: refused with 42501').toBe('42501')
  expect(await columnsOf(SERVER_ONLY.map(([column]) => column)), 'the row is unchanged').toEqual(before)
})

it('[SEC-X-INT-USERS-SERVER-ONLY-ALLOW] the server (service role) writes the ten columns, and a session still writes its own profile text', async () => {
  const names = SERVER_ONLY.map(([column]) => column)
  // a unique public id: the column is unique, and the run must not meet a value another run left
  const values = Object.fromEntries(SERVER_ONLY.map(([column, value]) => [column, column === 'public_id' ? 900_000_000 + (Date.now() % 90_000_000) : value]))
  // the company is a real row (a foreign key), removed again below
  const company = await run.admin.from('companies').insert({ name: `${run.RUN} company` }).select('id').single()
  expect(company.error, 'precondition: a synthetic company exists').toBeNull()
  values.company_id = company.data?.id
  try {
    const written = await run.admin.from('users').update(values).eq('id', target.id).select('id')
    expect(written.error, 'the service role writes the ten columns').toBeNull()
    expect(written.data).toEqual([{ id: target.id }])
    expect(await columnsOf(names)).toMatchObject({ avatar_url: values.avatar_url, company_id: company.data?.id, pending_email: values.pending_email, social_provider: 'zz' })
  } finally {
    await run.admin.from('users').update({ company_id: null }).eq('id', target.id)
    await run.admin.from('companies').delete().eq('id', company.data?.id)
  }

  const name = `${run.RUN} own name`
  const own = await target.client.from('users').update({ name, phone: '+355691234567', whatsapp: '+355691234567', company_name: `${run.RUN} agency`, position: 'owner' }).eq('id', target.id).select('id')
  expect(own.error, 'a session writes its own profile text').toBeNull()
  expect(own.data).toEqual([{ id: target.id }])
  expect((await columnsOf(['name'])) ?? {}).toEqual({ name })
})

// Task 956 AC15 (Review 4). FACT (read-only, 2026-11-15): `users` has NO permissive INSERT policy (only the RESTRICTIVE `blocked_account_no_insert`), so row-level security refused every INSERT of a
// session; the profile row is made by the sign-up trigger public.handle_new_user(). The application no longer inserts or upserts into `users` with a session (src/lib/auth/server.ts,
// src/app/auth/confirm/route.ts, src/lib/auth/browser.ts), so v8b.sql takes INSERT on `users` from `authenticated` on every column: a session insert is refused by the grant itself.
it('[SEC-X-INT-USERS-INSERT-DENY] a session cannot insert into users at all: no column is granted, so the grant refuses before any policy', async () => {
  const names = ['name', 'role', 'is_verified', 'user_type', 'preferred_locale', ...SERVER_ONLY.map(([column]) => column)]
  const before = await columnsOf(names)
  const attempts: [label: string, row: Record<string, unknown>][] = [
    ...SERVER_ONLY.map(([column, value]): [string, Record<string, unknown>] => [`${column} alone`, { id: target.id, [column]: value }]),
    ['all ten server-only columns at once', { id: target.id, ...Object.fromEntries(SERVER_ONLY) }],
    ['the six columns the application used to send (the upsert of ensureUserProfile and /auth/confirm)', { id: target.id, name: `${run.RUN} other name`, user_type: 'private', role: 'user', is_verified: false, preferred_locale: 'it' }],
    ['the five columns of resolveProfile', { id: target.id, name: `${run.RUN} other name`, user_type: 'private', role: 'user', is_verified: false }],
    ['the id alone', { id: target.id }],
  ]
  for (const [label, row] of attempts) {
    for (const [verb, answer] of [
      ['insert', await target.client.from('users').insert(row).select('id')],
      ['upsert', await target.client.from('users').upsert(row, { onConflict: 'id', ignoreDuplicates: true }).select('id')],
    ] as const) {
      expect(answer.error?.code, `${label}, ${verb}: refused with 42501`).toBe('42501')
      expect(answer.error?.message, `${label}, ${verb}: refused by the grant (permission denied), not by row-level security`).toMatch(/permission denied/i)
      expect(answer.data, `${label}, ${verb}: nothing returned`).toBeNull()
    }
  }
  expect(await columnsOf(names), 'the row is unchanged').toEqual(before)
})

/** the CHECKs of hardening v8b: [column, a value one past its bound or with the wrong shape, a value on the bound or in the right shape] */
const BOUNDS: [column: string, refused: string, accepted: string][] = [
  ['name', 'x'.repeat(201), 'x'.repeat(200)],
  ['last_name', 'x'.repeat(101), 'x'.repeat(100)],
  ['company_name', 'x'.repeat(201), 'x'.repeat(200)],
  ['position', 'x'.repeat(201), 'x'.repeat(200)],
  ['website', 'http://example.com', `https://${'a'.repeat(192)}`],
  ['website', `https://${'a'.repeat(193)}`, 'https://example.com/team'],
  ['phone', '12345', '+355691234567'],
  ['phone', '+0123456789', '+1234567'],
  ['phone', '+123456', '+123456789012345'],
  ['phone', '+1234567890123456', '+355691234567'],
  ['whatsapp', '0691234567', '+355691234567'],
  ['whatsapp', '+35569 1234567', '+1234567'],
]

it('[SEC-X-INT-USERS-CHECKS-DENY] a value past its bound or with the wrong shape is refused on the direct path', async () => {
  const before = await columnsOf([...new Set(BOUNDS.map(([column]) => column))])
  for (const [column, bad] of BOUNDS) {
    // the person's own session
    const session = await target.client.from('users').update({ [column]: bad }).eq('id', target.id).select('id')
    expect(session.error?.code, `a session writes ${column}=${bad.slice(0, 24)}… (${bad.length} characters): refused with 23514`).toBe('23514')
    expect(session.data).toBeNull()
    // the service role is held to the same bound: the CHECK is the data layer's, not the session's
    const server = await run.admin.from('users').update({ [column]: bad }).eq('id', target.id).select('id')
    expect(server.error?.code, `the service role writes ${column}=${bad.slice(0, 24)}… (${bad.length} characters): refused with 23514`).toBe('23514')
  }
  expect(await columnsOf([...new Set(BOUNDS.map(([column]) => column))]), 'the row is unchanged').toEqual(before)
})

it('[SEC-X-INT-USERS-CHECKS-ALLOW] a value on its bound or in its shape is stored, an empty number and no value too', async () => {
  for (const [column, , good] of BOUNDS) {
    const written = await target.client.from('users').update({ [column]: good }).eq('id', target.id).select(column)
    expect(written.error, `${column}=${good.slice(0, 24)}… (${good.length} characters) is stored`).toBeNull()
    expect(written.data).toEqual([{ [column]: good }])
  }
  for (const column of ['name', 'last_name', 'company_name', 'position', 'website', 'phone', 'whatsapp']) {
    const cleared = await target.client.from('users').update({ [column]: null }).eq('id', target.id).select('id')
    expect(cleared.error, `${column}=null is stored`).toBeNull()
  }
  for (const column of ['phone', 'whatsapp']) {
    const emptied = await target.client.from('users').update({ [column]: '' }).eq('id', target.id).select('id')
    expect(emptied.error, `${column}='' (a number the person removed) is stored`).toBeNull()
  }
})

// ── Task 962 AC1: the host of an avatar or a company logo (hardening v8b part 2, O962-1) ──────────────────────────────────────────────────────────────────────────────────────
const GOOGLE_PICTURE = 'https://lh3.googleusercontent.com/a/zz-synth-profile=s96-c'

it('[SEC-962-USER-IMAGE-PREFIX-DENY] an avatar or a logo address of another host is refused on the direct path, and the Google host is not a logo host', async () => {
  const before = await columnsOf(['avatar_url', 'company_logo_url'])
  expect(before, 'precondition: the row is readable').not.toBeNull()
  const refusals: [column: string, address: string][] = [
    ['avatar_url', 'https://example.com/x.png'],
    ['company_logo_url', 'https://example.com/x.png'],
    ['company_logo_url', GOOGLE_PICTURE],
    ['avatar_url', 'https://res.cloudinary.com/another-cloud/image/upload/v1/x.png'],
    ['avatar_url', 'http://res.cloudinary.com/die7okukn/image/upload/v1/x.png'],
    ['avatar_url', 'https://lh3.googleusercontent.com.evil.example/x.png'],
  ]
  for (const [column, address] of refusals) {
    // the service role is held to the same CHECK as a session: the rule is the data layer's
    const refused = await run.admin.from('users').update({ [column]: address }).eq('id', target.id).select('id')
    expect(refused.error?.code, `${column}=${address}: refused with 23514`).toBe('23514')
    expect(refused.data, `${column}=${address}: nothing returned`).toBeNull()
  }
  expect(await columnsOf(['avatar_url', 'company_logo_url']), 'the row is unchanged').toEqual(before)
})

it('[SEC-962-USER-IMAGE-PREFIX-ALLOW] a Cloudinary address of the project in both columns and a Google picture address in the avatar are stored; no value is stored too', async () => {
  const cloudinary = `https://res.cloudinary.com/${CLOUD}/image/upload/v1/zz-synth-profile.png`
  const both = await run.admin.from('users').update({ avatar_url: cloudinary, company_logo_url: cloudinary }).eq('id', target.id).select('avatar_url, company_logo_url')
  expect(both.error, 'a Cloudinary address of the project is stored in both columns').toBeNull()
  expect(both.data).toEqual([{ avatar_url: cloudinary, company_logo_url: cloudinary }])
  const google = await run.admin.from('users').update({ avatar_url: GOOGLE_PICTURE }).eq('id', target.id).select('avatar_url')
  expect(google.error, 'a Google picture address is stored in the avatar').toBeNull()
  expect(google.data).toEqual([{ avatar_url: GOOGLE_PICTURE }])
  const cleared = await run.admin.from('users').update({ avatar_url: null, company_logo_url: null }).eq('id', target.id).select('id')
  expect(cleared.error, 'no address at all is stored').toBeNull()
  expect(await columnsOf(['avatar_url', 'company_logo_url'])).toEqual({ avatar_url: null, company_logo_url: null })
})
