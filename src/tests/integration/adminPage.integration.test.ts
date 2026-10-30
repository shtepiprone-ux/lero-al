/**
 * Real-boundary control for the guard of the admin pages (Task 923 R68 (a); cases SEC-X-INT-ADMINPAGE-GUARD-ALLOW and -DENY): the REAL page `src/app/admin/users/[id]/page.tsx`
 * (its default export and its `generateMetadata`), the REAL `requireStaffPage`, the REAL `requireViewer` and the REAL cookie-bound client run against REAL Supabase Auth and the REAL
 * database of the approved development project. The page is called IN-PROCESS, the layout skipped, as a React Server Components request whose router-state header already names the layout
 * skips it. The session is the REAL one of a synthetic person, carried in the cookie jar that the mocked `next/headers` hands to the real client (the cookies are those the Supabase SSR
 * client itself wrote for that session). The other doubles: i18n, the three view components, and a recorder around the service-role client that lists every table the page reads.
 * Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-ADMINPAGE-GUARD-ALLOW: a moderator's call returns the page holding the synthetic row, and the metadata names it;
 *  - SEC-X-INT-ADMINPAGE-GUARD-DENY: a signed-in person without a staff role gets `notFound()` from both calls after the viewer lookup and before any other read, and no
 *    field of the synthetic row (its phone, its e-mail) is in what comes back; a guest is sent to the sign-in page the same way.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { createServerClient } from '@supabase/ssr'
import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ jar: new Map<string, string>(), reads: [] as string[] }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [...acting.jar].map(([name, value]) => ({ name, value })),
    get: (name: string) => (acting.jar.has(name) ? { name, value: acting.jar.get(name) as string } : undefined),
    set: () => undefined,
  }),
  headers: async () => new Headers(),
}))
vi.mock('next-intl/server', () => ({ getLocale: async () => 'en', getTranslations: async () => (key: string) => key }))
vi.mock('@/components/admin/AdminUserProfile', () => ({ AdminUserProfile: () => null }))
vi.mock('@/components/admin/AdminPageFrame', () => ({ AdminPageFrame: () => null }))
vi.mock('@/lib/supabase/admin', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/supabase/admin')>()
  return {
    ...real,
    // every table the page reads, in order: the recorder delegates to the REAL service-role client
    createAdminClient: () => {
      const client = real.createAdminClient()
      return new Proxy(client, {
        get(target, key) {
          const value = Reflect.get(target, key)
          if (key === 'from') return (table: string) => { acting.reads.push(`from(${table})`); return target.from(table) }
          if (key === 'auth' || key === 'rpc' || key === 'storage') acting.reads.push(String(key))
          return typeof value === 'function' ? value.bind(target) : value
        },
      })
    },
  }
})

import AdminUserProfilePage, { generateMetadata } from '@/app/admin/users/[id]/page'

let run: Run
let moderator: SyntheticUser
let plainUser: SyntheticUser
let subject: SyntheticUser
let subjectPhone: string

beforeAll(async () => {
  // this project compiles JSX with the classic transform (no React plugin), while the page is written for Next's automatic one: the page's own call of `React.createElement` finds React here
  vi.stubGlobal('React', React)
  run = createRun()
  moderator = await run.makeUser('page-moderator', { role: 'moderator' })
  plainUser = await run.makeUser('page-plain-user', { role: 'user' })
  subject = await run.makeUser('page-subject', { role: 'user' })
  const row = await run.admin.from('users').select('phone').eq('id', subject.id).single()
  subjectPhone = row.data?.phone as string
  expect(subjectPhone, 'precondition: the synthetic subject has a phone').toBeTruthy()
})
afterAll(async () => {
  vi.unstubAllGlobals()
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

/** the cookies the Supabase SSR client writes for the person's REAL session: what a browser would send with the request */
async function sessionCookies(person: SyntheticUser): Promise<Map<string, string>> {
  const jar = new Map<string, string>()
  const client = createServerClient(run.env.url, run.env.anonKey, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (rows) => rows.forEach((row) => jar.set(row.name, row.value)) },
  })
  const held = await client.auth.setSession({ access_token: person.accessToken, refresh_token: person.refreshToken })
  expect(held.error, 'the real session of the synthetic person was written to the cookie jar').toBeNull()
  expect(jar.size, 'at least one auth cookie was written').toBeGreaterThan(0)
  return jar
}

const params = () => ({ params: Promise.resolve({ id: subject.id }) })
/** what Next throws for notFound() and redirect(): an error whose digest names the answer */
const digestOf = (error: unknown) => String((error as { digest?: unknown })?.digest ?? '')
async function thrownBy(call: () => Promise<unknown>) {
  try { await call() } catch (error) { return error }
  return undefined
}

describe('adminPage', () => {
  it('[SEC-X-INT-ADMINPAGE-GUARD-ALLOW] adminpage-guard allowed on the real project', async () => {
    acting.jar = await sessionCookies(moderator)

    const page = (await AdminUserProfilePage(params())) as unknown as { props: { children: { props: { user: { id: string; phone: string | null }; email: string } } } }
    const profile = page.props.children.props
    expect(profile.user.id, 'the page element holds the synthetic row').toBe(subject.id)
    expect(profile.user.phone).toBe(subjectPhone)
    expect(profile.email, 'and its Auth e-mail').toBe(subject.email.toLowerCase())

    const stored = await run.admin.from('users').select('name, last_name').eq('id', subject.id).single()
    const name = [stored.data?.name, stored.data?.last_name].filter(Boolean).join(' ')
    expect(name, 'precondition: the synthetic row has a name').not.toBe('')
    expect(await generateMetadata(params()), 'the metadata title names the synthetic row').toEqual({ title: `${name} — Admin` })
  })

  it('[SEC-X-INT-ADMINPAGE-GUARD-DENY] adminpage-guard refused on the real project', async () => {
    acting.jar = await sessionCookies(plainUser)

    for (const [label, call] of [['the page', () => AdminUserProfilePage(params())], ['its metadata', () => generateMetadata(params())]] as const) {
      acting.reads.length = 0
      const error = await thrownBy(call)
      expect(error, `${label}: refused for a signed-in person without a staff role`).toBeDefined()
      expect(digestOf(error), `${label}: the answer is notFound()`).toContain('404')
      expect(acting.reads, `${label}: the only read before the refusal is the viewer lookup of the caller's own row`).toEqual(['from(users)'])
      const leaked = JSON.stringify({ message: (error as Error).message, digest: digestOf(error) })
      expect(leaked, `${label}: no phone of the synthetic row in the answer`).not.toContain(subjectPhone)
      expect(leaked, `${label}: no e-mail of the synthetic row in the answer`).not.toContain(subject.email)
    }

    // a guest: no cookie at all: the sign-in redirect, with nothing read at all
    acting.jar = new Map()
    for (const [label, call] of [['the page', () => AdminUserProfilePage(params())], ['its metadata', () => generateMetadata(params())]] as const) {
      acting.reads.length = 0
      const error = await thrownBy(call)
      expect(digestOf(error), `${label}: a guest is redirected to the sign-in page`).toContain('NEXT_REDIRECT')
      expect(acting.reads, `${label}: nothing was read for a guest`).toEqual([])
    }
  })
})
