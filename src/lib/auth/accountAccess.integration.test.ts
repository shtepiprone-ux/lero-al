/**
 * Real-boundary control for owner decision D9 (2026-10-17): the REAL syncAccountAccess talks to the REAL Supabase Auth of the approved development project.
 * A ban must refuse password sign-in, token refresh and auth.getUser(old access token); an unban must give sign-in back. Synthetic users only, verified clean-up.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createRun, type Run } from '@/tests/integration/fixtures'
import { syncAccountAccess } from './accountAccess'

describe('account access against real Auth', () => {
  let run: Run

  beforeAll(() => { run = createRun() })
  afterAll(async () => {
    const result = await run.cleanup()
    expect(result, 'the synthetic users of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  })

  it('[SEC-D9-INT-DENY] a blocked account is really banned: sign-in, refresh and the old access token are refused by Auth', async () => {
    const user = await run.makeUser('to-block')
    // precondition: before the ban this very session works, so the refusals below are caused by the ban and by nothing else
    const live = await run.anonymousClient().auth.getUser(user.accessToken)
    expect(live.error).toBeNull()
    expect(live.data.user?.id).toBe(user.id)

    expect(await syncAccountAccess(user.id, 'blocked', null)).toEqual({ ok: true })

    const signIn = await run.signIn(user.email, user.password)
    expect(signIn.result.data.session).toBeNull()
    expect(signIn.result.error?.code).toBe('user_banned')

    const refresh = await run.anonymousClient().auth.refreshSession({ refresh_token: user.refreshToken })
    expect(refresh.data.session).toBeNull()
    expect(refresh.error?.code).toBe('user_banned')

    const oldToken = await run.anonymousClient().auth.getUser(user.accessToken)
    expect(oldToken.data.user).toBeNull()
    expect(oldToken.error?.status).toBe(403)
    expect(oldToken.error?.code).toBe('user_banned')

    // a dated suspension is a ban too, and an inactive account as well
    const suspended = await run.makeUser('to-suspend')
    expect(await syncAccountAccess(suspended.id, 'blocked', new Date(Date.now() + 3600_000).toISOString())).toEqual({ ok: true })
    expect((await run.signIn(suspended.email, suspended.password)).result.error?.code).toBe('user_banned')
    const inactive = await run.makeUser('to-deactivate')
    expect(await syncAccountAccess(inactive.id, 'inactive', null)).toEqual({ ok: true })
    expect((await run.signIn(inactive.email, inactive.password)).result.error?.code).toBe('user_banned')
  })

  it('[SEC-D9-INT-ALLOW] the unblock really lifts the ban: the same user signs in again', async () => {
    const user = await run.makeUser('to-unblock')
    expect(await syncAccountAccess(user.id, 'blocked', null)).toEqual({ ok: true })
    expect((await run.signIn(user.email, user.password)).result.error?.code).toBe('user_banned')       // really banned first

    expect(await syncAccountAccess(user.id, 'active', null)).toEqual({ ok: true })

    const back = await run.signIn(user.email, user.password)
    expect(back.result.error).toBeNull()
    expect(back.result.data.user?.id).toBe(user.id)
    const validated = await run.anonymousClient().auth.getUser(back.result.data.session?.access_token)
    expect(validated.error).toBeNull()
    expect(validated.data.user?.id).toBe(user.id)

    // a suspension that has already ended does not ban at all
    const ended = await run.makeUser('suspension-ended')
    expect(await syncAccountAccess(ended.id, 'blocked', new Date(Date.now() - 60_000).toISOString())).toEqual({ ok: true })
    expect((await run.signIn(ended.email, ended.password)).result.error).toBeNull()
  })
})
