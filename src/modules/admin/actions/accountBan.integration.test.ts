/**
 * Real-boundary control for owner decision D9 (2026-10-17): the REAL admin action, the REAL permission and rank helpers, REAL Supabase Auth and the REAL database
 * of the approved development project. The one double is the cookie-bound client factory: outside a Next request there is no cookie, so `createClient()` returns
 * the client that holds the acting person's REAL session (access token) — the identity, the role lookup and every RLS rule are still decided by Supabase.
 * Synthetic users only, verified clean-up. Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))

import { updateUserProfileFull } from './index'

describe('admin account actions against real Auth and database', () => {
  let run: Run
  let plain: SyntheticUser
  let staff: SyntheticUser
  let locationId: number

  beforeAll(async () => {
    run = createRun()
    plain = await run.makeUser('plain-caller')
    staff = await run.makeUser('administrator', { role: 'admin' })
    locationId = await run.anyLocationId()
  })
  afterAll(async () => {
    const result = await run.cleanup()
    expect(result, 'the synthetic users of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  })

  const form = (status: 'active' | 'blocked') => ({
    firstName: 'Integration', profileType: 'private' as const, phone: '+355691234567', locationId, status, blockReason: status === 'blocked' ? 'integration run' : undefined,
  })

  it('[SEC-D9-INT-ADMIN-DENY] a normal user cannot block anyone on the real database and Auth', async () => {
    const victim = await run.makeUser('victim-of-plain')
    acting.client = plain.client

    const answer = await updateUserProfileFull(victim.id, form('blocked'))
    expect(answer).toEqual({ error: 'Forbidden' })

    const row = await run.admin.from('users').select('status, block_reason').eq('id', victim.id).single()
    expect(row.data).toEqual({ status: 'active', block_reason: null })
    const history = await run.admin.from('user_status_history').select('id').eq('user_id', victim.id)
    expect(history.error).toBeNull()
    expect(history.data).toEqual([])
    // not banned in Auth either: the victim still signs in
    const signIn = await run.signIn(victim.email, victim.password)
    expect(signIn.result.error).toBeNull()
    expect(signIn.result.data.user?.id).toBe(victim.id)

    // rank: a moderator is staff, yet cannot block an administrator account
    const moderator = await run.makeUser('moderator-caller', { role: 'moderator' })
    const otherAdmin = await run.makeUser('administrator-target', { role: 'admin' })
    acting.client = moderator.client
    // an ordinary form (profileType private): the rank check is the only thing standing between the moderator and the administrator account
    expect(await updateUserProfileFull(otherAdmin.id, form('blocked'))).toEqual({ error: 'Forbidden' })
    const adminRow = await run.admin.from('users').select('status, role').eq('id', otherAdmin.id).single()
    expect(adminRow.data).toEqual({ status: 'active', role: 'admin' })
    const adminSignIn = await run.signIn(otherAdmin.email, otherAdmin.password)
    expect(adminSignIn.result.error).toBeNull()                                  // the administrator is not banned either
  })

  it('[SEC-D9-INT-ADMIN-ALLOW] a real administrator blocks and unblocks a user and Auth follows', async () => {
    const target = await run.makeUser('target-of-admin')
    acting.client = staff.client

    expect(await updateUserProfileFull(target.id, form('blocked'))).toEqual({})
    const blocked = await run.admin.from('users').select('status, block_reason').eq('id', target.id).single()
    expect(blocked.data).toEqual({ status: 'blocked', block_reason: 'integration run' })
    const refused = await run.signIn(target.email, target.password)
    expect(refused.result.data.session).toBeNull()
    expect(refused.result.error?.code).toBe('user_banned')                       // Auth followed the saved status
    const oldToken = await run.anonymousClient().auth.getUser(target.accessToken)
    expect(oldToken.error?.code).toBe('user_banned')                             // and the session the person already had is cut as well

    expect(await updateUserProfileFull(target.id, form('active'))).toEqual({})
    const unblocked = await run.admin.from('users').select('status, block_reason').eq('id', target.id).single()
    expect(unblocked.data).toEqual({ status: 'active', block_reason: null })
    const back = await run.signIn(target.email, target.password)
    expect(back.result.error).toBeNull()
    expect(back.result.data.user?.id).toBe(target.id)

    // an administrator cannot lock themselves out
    expect(await updateUserProfileFull(staff.id, form('blocked'))).toEqual({ error: 'Forbidden' })
    expect((await run.signIn(staff.email, staff.password)).result.error).toBeNull()
  })
})
