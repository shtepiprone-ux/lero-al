/**
 * Owner decision D9 (2026-10-17): a blocked account has no access. This module sets / lifts the Supabase Auth ban. The REAL module runs; Supabase Auth is a
 * recording double with the one call the module makes (`auth.admin.updateUserById`), the clock is fixed and nothing is read from the environment.
 * The real-Auth control is accountAccess.integration.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateUserById = vi.hoisted(() => vi.fn())
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ auth: { admin: { updateUserById: (...a: unknown[]) => updateUserById(...a) } } }) }))

import { PERMANENT_BAN, accountHasAccess, banDurationFor, syncAccountAccess } from './accountAccess'

const NOW = new Date('2026-10-17T12:00:00.000Z')
const minutesFromNow = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString()
const ID = '3f2b1c0e-8a4d-4e6f-9b1a-2c3d4e5f6a7b'
let logged: unknown[][]

beforeEach(() => {
  updateUserById.mockReset().mockResolvedValue({ data: {}, error: null })
  logged = []
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { logged.push(a) })
})

describe('account access sync', () => {
  it('[SEC-D9-SRV-DENY] a blocked, suspended or inactive account is banned in Auth with the matching duration', async () => {
    expect(await syncAccountAccess(ID, 'blocked', null, NOW)).toEqual({ ok: true })
    expect(await syncAccountAccess(ID, 'inactive', null, NOW)).toEqual({ ok: true })
    expect(await syncAccountAccess(ID, 'blocked', minutesFromNow(90), NOW)).toEqual({ ok: true })
    // 61.5 minutes left is rounded UP: a person is never unbanned early
    expect(await syncAccountAccess(ID, 'blocked', new Date(NOW.getTime() + 61.5 * 60_000).toISOString(), NOW)).toEqual({ ok: true })
    // a suspension date is ignored for an inactive account: it stays banned for good
    expect(await syncAccountAccess(ID, 'inactive', minutesFromNow(5), NOW)).toEqual({ ok: true })

    expect(updateUserById.mock.calls).toEqual([
      [ID, { ban_duration: PERMANENT_BAN }],
      [ID, { ban_duration: PERMANENT_BAN }],
      [ID, { ban_duration: '90m' }],
      [ID, { ban_duration: '62m' }],
      [ID, { ban_duration: PERMANENT_BAN }],
    ])
    expect(PERMANENT_BAN).toBe('876000h')
  })

  it('[SEC-D9-SRV-ALLOW] an active account, or one whose suspension has ended, is not banned and an existing ban is lifted', async () => {
    expect(await syncAccountAccess(ID, 'active', null, NOW)).toEqual({ ok: true })
    expect(await syncAccountAccess(ID, 'active', minutesFromNow(500), NOW)).toEqual({ ok: true })   // a leftover date on an active account means nothing
    expect(await syncAccountAccess(ID, 'blocked', minutesFromNow(-1), NOW)).toEqual({ ok: true })
    expect(await syncAccountAccess(ID, 'blocked', minutesFromNow(0), NOW)).toEqual({ ok: true })     // ends exactly now: access is back
    expect(updateUserById.mock.calls.map(c => c[1])).toEqual(Array(4).fill({ ban_duration: 'none' }))
  })

  it('[SEC-D9-SRV-ERR] an Auth failure is reported and is never read as success; bad ids and statuses are refused before any call', async () => {
    updateUserById.mockResolvedValueOnce({ data: null, error: { status: 500, message: 'boom SECRET-TOKEN-123 service-role-key-abc' } })
    expect(await syncAccountAccess(ID, 'blocked', null, NOW)).toEqual({ ok: false, error: 'access_sync_failed' })
    updateUserById.mockRejectedValueOnce(new Error('network SECRET-TOKEN-123'))
    expect(await syncAccountAccess(ID, 'blocked', null, NOW)).toEqual({ ok: false, error: 'access_sync_failed' })
    expect(updateUserById).toHaveBeenCalledTimes(2)

    const hostile: Array<[unknown, unknown, unknown]> = [
      ['not-a-uuid', 'blocked', null], ["' or 1=1 --", 'blocked', null], [123, 'blocked', null], [null, 'blocked', null], [undefined, 'blocked', null], [{ toString: () => ID }, 'blocked', null],
      [ID, 'admin', null], [ID, 'BLOCKED', null], [ID, 123, null], [ID, null, null], [ID, { toString: () => 'blocked' }, null],
      [ID, 'blocked', 'tomorrow'], [ID, 'blocked', 12345], [ID, 'blocked', {}], [ID, 'blocked', 'Invalid Date'],
    ]
    for (const [id, status, until] of hostile) {
      expect(await syncAccountAccess(id, status, until, NOW), JSON.stringify([id, status, until])).toEqual({ ok: false, error: 'invalid_input' })
    }
    expect(updateUserById).toHaveBeenCalledTimes(2)        // none of the hostile calls reached Auth
    const text = JSON.stringify(logged)
    expect(text).not.toContain('SECRET-TOKEN-123')
    expect(text).not.toContain('service-role-key-abc')
    expect(logged.length).toBeGreaterThan(0)               // the failures were logged, with a status code only
  })

  it('the state rule: only active, or a blocked account whose date has passed, has access', () => {
    expect(accountHasAccess('active', null, NOW)).toBe(true)
    expect(accountHasAccess('blocked', null, NOW)).toBe(false)
    expect(accountHasAccess('blocked', '', NOW)).toBe(false)
    expect(accountHasAccess('blocked', 'garbage', NOW)).toBe(false)
    expect(accountHasAccess('blocked', minutesFromNow(1), NOW)).toBe(false)
    expect(accountHasAccess('blocked', minutesFromNow(-1), NOW)).toBe(true)
    expect(accountHasAccess('inactive', minutesFromNow(-1), NOW)).toBe(false)
    expect(accountHasAccess('deleted', null, NOW)).toBe(false)
    expect(accountHasAccess(undefined, undefined, NOW)).toBe(false)
  })

  it('the duration is at least one minute and a missing date on a block is permanent', () => {
    expect(banDurationFor('blocked', minutesFromNow(0.1), NOW)).toBe('1m')
    expect(banDurationFor('blocked', null, NOW)).toBe(PERMANENT_BAN)
    expect(banDurationFor('active', null, NOW)).toBe('none')
  })
})
