// @vitest-environment node
/**
 * Security (Task 923 R77 (a) (b) (c)): the inactivity job.
 *  - SEC-X-SRV-INACTIVITY-DRYRUN: a dry run writes nothing and sends nothing (counts and ids only), and a failed read stops the job with 500 instead of looking like
 *    "nobody to process".
 *  - SEC-X-SRV-INACTIVITY-REMIND: a person is reminded once per absence at three months, and the job changes no account (the only write is the reminder mark): an account
 *    absent four months and already reminded gets nothing, one that came back (mark cleared) and is absent again is reminded again, and an account absent 13 months is
 *    counted, never deactivated or e-mailed.
 * The real route runs; the database (a small in-memory `users` table that evaluates the filters the job uses), Auth, the mailer and the cron secret check are doubles.
 * Every id and address is synthetic.
 */
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Row = { id: string; status: string; deleted_at: string | null; last_seen_at: string | null; created_at: string; inactivity_warning_sent_at: string | null }

const state = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  writes: [] as Array<{ table: string; op: string; values: unknown; id?: unknown }>,
  emails: [] as Array<{ to: string; subject: string }>,
  readFails: false as false | 'users' | 'auth',
  emailFails: false,
  authEmails: {} as Record<string, string | null>,
}))

const DAY = 24 * 60 * 60 * 1000
const daysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString()

/** evaluates the two `.or()` expressions the job builds: `last_seen_at.<op>.<ts>,and(last_seen_at.is.null,created_at.<op>.<ts>)` */
function matchesOr(row: Record<string, unknown>, expression: string): boolean {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of expression) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { parts.push(current); current = '' } else current += ch
  }
  parts.push(current)
  const term = (t: string): boolean => {
    if (t.startsWith('and(')) return t.slice(4, -1).split(',').every(term)
    const [column, op, ...rest] = t.split('.')
    const value = rest.join('.')
    const cell = row[column] as string | null
    if (op === 'is' && value === 'null') return cell === null || cell === undefined
    if (cell === null || cell === undefined) return false
    if (op === 'lt') return cell < value
    if (op === 'gte') return cell >= value
    throw new Error(`unsupported term ${t}`)
  }
  return parts.some(term)
}

vi.mock('@/lib/cron/verifyCronRequest', () => ({ verifyCronRequest: () => ({ ok: true }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const tests: Array<(r: Record<string, unknown>) => boolean> = []
      let op: 'select' | 'update' = 'select'
      let values: unknown
      let max = Infinity
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.update = (v: unknown) => { op = 'update'; values = v; return chain }
      chain.is = (c: string, v: null) => { tests.push((r) => (r[c] ?? null) === v); return chain }
      chain.not = (c: string, _o: string, list: string) => { const out = list.replace(/[()"]/g, '').split(','); tests.push((r) => !out.includes(String(r[c]))); return chain }
      chain.or = (expression: string) => { tests.push((r) => matchesOr(r, expression)); return chain }
      chain.eq = (c: string, v: unknown) => { tests.push((r) => r[c] === v); return chain }
      chain.limit = (n: number) => { max = n; return chain }
      chain.then = (resolve: (v: unknown) => void) => {
        if (op === 'update') {
          const hit = state.rows.filter((r) => tests.every((t) => t(r)))
          for (const r of hit) { state.writes.push({ table, op, values, id: r.id }); Object.assign(r, values) }
          return resolve({ data: null, error: null })
        }
        if (state.readFails === 'users') return resolve({ data: null, error: { message: 'MARKER-DB-MESSAGE', code: 'XX000' } })
        return resolve({ data: state.rows.filter((r) => tests.every((t) => t(r))).slice(0, max).map((r) => ({ id: r.id })), error: null })
      }
      return chain
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          if (state.readFails === 'auth') return { data: null, error: { message: 'down', code: 'XX000' } }
          const email = state.authEmails[id]
          return { data: { user: email ? { email } : null }, error: null }
        },
      },
    },
  }),
}))
vi.mock('@/modules/notifications/lib/emails/send', () => ({
  sendEmail: async (a: { to: string; subject: string }) => { if (state.emailFails) return { error: 'transient' }; state.emails.push({ to: a.to, subject: a.subject }); return { id: 'e' } },
}))
vi.mock('@/modules/notifications/lib/emails/InactivityWarningEmail', () => ({ InactivityWarningEmail: () => null, getInactivityWarningEmailStrings: () => ({ subject: 'Warning' }) }))

import { POST } from '../route'

const row = (id: string, absentDays: number, over: Partial<Row> = {}): Row => ({ id, status: 'active', deleted_at: null, last_seen_at: daysAgo(absentDays), created_at: daysAgo(900), inactivity_warning_sent_at: null, ...over })
const run = (query = '') => POST(new NextRequest(`https://lero.al/api/cron/inactivity${query}`, { method: 'POST' }))

beforeEach(() => {
  state.rows = []
  state.writes = []
  state.emails = []
  state.readFails = false
  state.emailFails = false
  state.authEmails = { a2: 'two@example.com', a3: 'three@example.com', a4: 'four@example.com', a4b: 'four.b@example.com', a13: 'thirteen@example.com' }
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('inactivity', () => {
  it('[SEC-X-SRV-INACTIVITY-DRYRUN] dry run writes nothing and a read error stops the job', async () => {
    state.rows = [row('a2', 60), row('a3', 100), row('a13', 400)]
    const res = await run('?dryRun=1')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ dryRun: true, wouldRemind: 1, wouldRemindIds: ['a3'], wouldDeactivate: 1, wouldDeactivateIds: ['a13'], reminded: 0, deactivated: 0 })
    expect(state.writes).toEqual([])                         // no users write
    expect(state.emails).toEqual([])                         // no e-mail
    // a real run whose read fails: 500 and nothing is done, never a 200 for "nobody to process"
    state.readFails = 'users'
    const failed = await run()
    expect(failed.status).toBe(500)
    expect(JSON.stringify(await failed.json())).not.toContain('MARKER-DB-MESSAGE')
    expect(state.writes).toEqual([])
    expect(state.emails).toEqual([])
    // a failed read of Auth stops the job as well
    state.readFails = 'auth'
    expect((await run()).status).toBe(500)
    expect(state.emails).toEqual([])
  })

  it('[SEC-X-SRV-INACTIVITY-REMIND] one reminder per absence and no account change', async () => {
    state.rows = [
      row('a2', 60),                                                                  // two months: too early
      row('a3', 100),                                                                 // three months: reminded
      row('a4', 120, { inactivity_warning_sent_at: daysAgo(30) }),                    // four months, already reminded in this absence: not again
      row('a4b', 130, { inactivity_warning_sent_at: null }),                          // came back (the presence ping cleared the mark) and is absent again: reminded again
      row('a13', 400),                                                                // thirteen months: counted, never deactivated or e-mailed
    ]
    const first = await (await run()).json()
    expect(first).toMatchObject({ reminded: 2, deactivated: 0, wouldDeactivate: 1, errors: 0 })
    expect(state.emails.map((e) => e.to).sort()).toEqual(['four.b@example.com', 'three@example.com'])
    // the only write is the reminder mark of those two accounts: no status, no deleted_at, no listing
    expect(state.writes.map((w) => w.id).sort()).toEqual(['a3', 'a4b'])
    for (const w of state.writes) expect(Object.keys(w.values as object)).toEqual(['inactivity_warning_sent_at'])
    expect(state.rows.find((r) => r.id === 'a13')).toMatchObject({ status: 'active', deleted_at: null })
    // a second run in the same absence sends nothing
    state.emails = []
    state.writes = []
    expect(await (await run()).json()).toMatchObject({ reminded: 0 })
    expect(state.emails).toEqual([])
    expect(state.writes).toEqual([])
  })

  it('a reminder that cannot be sent is not marked (it is tried again), and an account without a readable address is skipped', async () => {
    state.rows = [row('a3', 100), row('a4', 120)]
    state.authEmails.a4 = null
    state.emailFails = true
    expect(await (await run()).json()).toMatchObject({ reminded: 0, errors: 2 })
    expect(state.writes).toEqual([])
    state.emailFails = false
    expect(await (await run()).json()).toMatchObject({ reminded: 1, errors: 1 })
  })

  it('blocked and deactivated accounts and deleted profiles are left alone', async () => {
    state.rows = [row('a3', 100, { status: 'blocked' }), row('a4', 100, { status: 'inactive' }), row('a4b', 100, { deleted_at: daysAgo(1) })]
    expect(await (await run()).json()).toMatchObject({ reminded: 0, wouldDeactivate: 0 })
    expect(state.emails).toEqual([])
  })
})
