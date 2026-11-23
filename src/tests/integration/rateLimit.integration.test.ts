/**
 * Real-boundary control for the shared sliding limiter (Task 957 AC2, O957-1): `public.consume_rate_limit` and `public.rate_limit_hits` on the REAL development database.
 *  - SEC-RATELIMIT-INT-ATOMIC: 20 parallel calls with `max_hits` 5 give exactly 5 `true`;
 *  - SEC-RATELIMIT-INT-SLIDING: 5 hits 30 s old inside a 60 s window refuse the next call and stay; 5 hits 120 s old outside it are removed by the next call, which is allowed (no sleep);
 *  - SEC-RATELIMIT-INT-DENY: `anon` and `authenticated` can neither execute the function nor read the table; a window outside 1..604800 and `max_hits` below 1 are refused;
 *    a hit older than 7 days is removed by the next call of its key.
 * Needs the SQL of `supabase/sql_migrations/task957/task957.sql` applied by the owner (until then every case fails on the missing function). Synthetic keys only, removed at the end.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { escapeLike } from '@/lib/postgrest/escape'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

let run: Run
let person: SyntheticUser

beforeAll(async () => {
  run = createRun()
  person = await run.makeUser('rate-limit-person', { role: 'user' })
})
afterAll(async () => {
  // the synthetic user is removed even when the table is missing (the SQL not yet applied): the hits first, the clean-up always
  const removed = await run.admin.from('rate_limit_hits').delete().like('bucket', `${escapeLike(run.RUN)}%`)
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
  expect(removed.error, 'the synthetic hits are removed').toBeNull()
})

const consume = (bucket: string, subject: string, windowSeconds: number, maxHits: number) =>
  run.admin.rpc('consume_rate_limit', { bucket, subject, window_seconds: windowSeconds, max_hits: maxHits })

describe('consume_rate_limit', () => {
  it('[SEC-RATELIMIT-INT-ATOMIC] 20 parallel calls with max_hits 5 give exactly 5 true', async () => {
    const bucket = `${run.RUN}-atomic`
    const answers = await Promise.all(Array.from({ length: 20 }, () => consume(bucket, 'subject-a', 60, 5)))
    expect(answers.every((a) => a.error === null), JSON.stringify(answers.find((a) => a.error))).toBe(true)
    expect(answers.filter((a) => a.data === true)).toHaveLength(5)
    expect(answers.filter((a) => a.data === false)).toHaveLength(15)
  })

  it('[SEC-RATELIMIT-INT-SLIDING] 5 hits at the end of a window and 5 at the start of the next give 5 true of 10', async () => {
    // No sleep and no timing of network calls: the service role seeds the key's hits with a `hit_at` set from the client clock, 30 s inside and 120 s outside a 60 s window.
    // Both margins are far above any clock difference between the test machine and the database (`now()` in the function), so the result does not depend on network latency.
    const bucket = `${run.RUN}-sliding`
    const subject = 'subject-b'
    const seed = async (ageSeconds: number) => {
      const hitAt = new Date(Date.now() - ageSeconds * 1000).toISOString()
      const inserted = await run.admin.from('rate_limit_hits').insert(Array.from({ length: 5 }, () => ({ bucket, subject, hit_at: hitAt })))
      expect(inserted.error, `seeding 5 hits ${ageSeconds} s old`).toBeNull()
    }
    const hitsOfKey = () => run.admin.from('rate_limit_hits').select('hit_at').eq('bucket', bucket).eq('subject', subject)

    // inside the window: 5 hits of 30 s ago still count, so the call is refused and records nothing
    await seed(30)
    expect((await consume(bucket, subject, 60, 5)).data, 'inside the window: refused').toBe(false)
    const inside = await hitsOfKey()
    expect(inside.error).toBeNull()
    expect(inside.data, 'inside the window: the five hits stay and none is added').toHaveLength(5)

    // outside the window: 5 hits of 120 s ago are removed by the function (task957.sql:39-40), so the call is allowed and the key holds exactly its own hit
    const cleared = await run.admin.from('rate_limit_hits').delete().eq('bucket', bucket).eq('subject', subject)
    expect(cleared.error).toBeNull()
    await seed(120)
    expect((await consume(bucket, subject, 60, 5)).data, 'outside the window: allowed').toBe(true)
    const outside = await hitsOfKey()
    expect(outside.error).toBeNull()
    expect(outside.data, 'outside the window: the five old hits are removed, only the new one is held').toHaveLength(1)
  })

  it('[SEC-RATELIMIT-INT-DENY] keys are separate: another subject and another bucket have their own count', async () => {
    const bucket = `${run.RUN}-keys`
    for (let i = 0; i < 2; i++) expect((await consume(bucket, 'subject-c', 60, 2)).data).toBe(true)
    expect((await consume(bucket, 'subject-c', 60, 2)).data).toBe(false)
    expect((await consume(bucket, 'subject-d', 60, 2)).data).toBe(true)
    expect((await consume(`${bucket}-other`, 'subject-c', 60, 2)).data).toBe(true)
  })

  it('[SEC-RATELIMIT-INT-DENY] a window outside 1..604800 and max_hits below 1 are refused', async () => {
    const bucket = `${run.RUN}-args`
    for (const [windowSeconds, maxHits] of [[0, 5], [-1, 5], [604801, 5], [60, 0], [60, -3]]) {
      const answer = await consume(bucket, 'subject-e', windowSeconds, maxHits)
      expect(answer.error, `${windowSeconds}/${maxHits}`).not.toBeNull()
      expect(answer.data).toBeNull()
    }
    const rows = await run.admin.from('rate_limit_hits').select('bucket').eq('bucket', bucket)
    expect(rows.data, 'a refused call records no hit').toEqual([])
  })

  it('[SEC-RATELIMIT-INT-DENY] a hit older than 7 days is removed by the next call of the same key', async () => {
    const bucket = `${run.RUN}-old`
    const old = new Date(Date.now() - 8 * 86_400_000).toISOString()
    const seeded = await run.admin.from('rate_limit_hits').insert({ bucket, subject: 'subject-f', hit_at: old })
    expect(seeded.error).toBeNull()
    expect((await consume(bucket, 'subject-f', 60, 5)).data).toBe(true)
    const left = await run.admin.from('rate_limit_hits').select('hit_at').eq('bucket', bucket)
    expect(left.data).toHaveLength(1)
    expect(new Date(left.data![0].hit_at as string).getTime()).toBeGreaterThan(Date.now() - 60_000)
  })

  it('[SEC-RATELIMIT-INT-DENY] anon and authenticated can neither execute the function nor read or write the table', async () => {
    const args = { bucket: `${run.RUN}-deny`, subject: 'subject-g', window_seconds: 60, max_hits: 5 }
    const anon = await run.anonymousClient().rpc('consume_rate_limit', args)
    expect(anon.error?.code, 'anon execute').toBe('42501')
    const session = await person.client.rpc('consume_rate_limit', args)
    expect(session.error?.code, 'authenticated execute').toBe('42501')
    for (const [label, client] of [['anon', run.anonymousClient()], ['authenticated', person.client]] as const) {
      const read = await client.from('rate_limit_hits').select('bucket').limit(1)
      expect(read.error?.code, `${label} select`).toBe('42501')
      const write = await client.from('rate_limit_hits').insert({ bucket: `${run.RUN}-deny`, subject: 'x' })
      expect(write.error?.code, `${label} insert`).toBe('42501')
    }
    const none = await run.admin.from('rate_limit_hits').select('bucket').eq('bucket', `${run.RUN}-deny`)
    expect(none.data).toEqual([])
  })
})
