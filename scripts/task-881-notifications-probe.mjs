#!/usr/bin/env node
/**
 * task-881-notifications-probe.mjs
 *
 * Task 881 (Sprint 80), R6/AC4. Owner-run two-armed live proof for the `notifications`
 * least-privilege hardening (scripts/task-881-notifications-least-privilege.sql). Pattern:
 * scripts/task-870-anon-probe.mjs (HTTP status/reason classification via raw fetch) and
 * scripts/task-882-realtime-probe.mjs (Realtime subscribe/insert/wait, sign-in, cleanup).
 *
 * Arms, in order (§11 of the kickoff):
 *   A1 anon GET   ?select=id&limit=0
 *   A2 anon POST  insert
 *   A3 anon PATCH is_read on the probe id
 *   A4 anon DELETE on the probe id
 *   U1 user  GET  own probe row (prints the row count only, never content)
 *   U2 user  PATCH {is_read:true} on the probe id, then a service-role re-read prints
 *            is_read_after=true|false
 *   U3 user  PATCH {title:'x'} on the probe id
 *   U4 user  POST insert
 *   RT       Realtime: the user's client subscribes exactly as useNotifications.ts:56-62,
 *            a second probe row is inserted through the service role, prints
 *            received_ms=<n>|MISSING within 10s
 *   U5 user  DELETE on the probe id — last
 *
 * Each HTTP arm prints exactly one line:
 *   phase=<before|after> arm=<A1|...> role=<anon|user> method=<GET|POST|PATCH|DELETE> http_status=<n> pg_code=<code|null> reason=<none|grant|rls|other>
 * `reason` classifies the response body's `message`: `grant` matches
 * /permission denied for (?:table|relation) notifications/i, `rls` matches
 * /row-level security/i, `none` is any 2xx response, `other` is anything else.
 *
 * Exit 0 when every arm matches the kickoff §11 table for the given phase (compared on
 * status class [2xx vs error] + reason, U1's count, U2's is_read_after, and RT's delivery),
 * exit 1 on any mismatch (each printed with a `MISMATCH` line naming the arm and the
 * expected vs actual shape), exit 2 on setup error (missing env var, sign-in failure,
 * probe-row insert failure). Never prints a key, password, token, or row content — only
 * status codes, Postgres error codes, classified reasons, a row count, and a boolean.
 *
 * Reads `.env.local` via `dotenv` — never PowerShell `Get-Content -Raw` (818/819
 * corollary, docs/orchestrator-procedures.md). `PROBE_EMAIL`/`PROBE_PASSWORD` come from the
 * process environment only, never `.env.local`, and are never committed.
 *
 * Cleanup (review 1): `process.exit()` is called ONLY from `parsePhase`, the two env-var
 * checks, and a sign-in failure — all of them before any row exists, so there is nothing to
 * clean up yet and Node skipping `finally` on `process.exit` is harmless. Every failure from
 * the setup insert onward sets `process.exitCode` and either `return`s or `throw`s, so
 * `finally` always runs. The setup probe row's id and the RT arm's inserted row's id are
 * both recorded and deleted by id in `finally`, in addition to the existing delete-by-title
 * — deleting by id alone would miss a row that never got a chance to be renamed, and
 * deleting by title alone would miss the setup row after U3 (BEFORE phase) renames it away
 * from `PROBE_TITLE`.
 *
 * Usage:
 *   $env:PROBE_EMAIL = "test-account-2@example.com"
 *   $env:PROBE_PASSWORD = "the-test-account-password"
 *   node.exe scripts\task-881-notifications-probe.mjs --phase before|after
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const PROBE_TITLE = '[task-881 probe]'
const PROBE_BODY = 'Task 881 grant-contract probe — safe to ignore, auto-deleted.'
const RT_WAIT_MS = 10_000
const SUBSCRIBE_SETUP_MS = 10_000

const GRANT_RE = /permission denied for (?:table|relation) notifications/i
const RLS_RE = /row-level security/i

// Expected shape per arm per phase — statusClass '2xx' | 'error', plus arm-specific fields.
const EXPECTATIONS = {
  before: {
    A1: { statusClass: '2xx', reason: 'none' },
    A2: { statusClass: 'error', reason: 'rls' },
    A3: { statusClass: '2xx', reason: 'none' },
    A4: { statusClass: '2xx', reason: 'none' },
    U1: { statusClass: '2xx', count: 1 },
    U2: { statusClass: '2xx', isReadAfter: true },
    U3: { statusClass: '2xx', reason: 'none' },
    U4: { statusClass: 'error', reason: 'rls' },
    RT: { delivered: true },
    U5: { statusClass: '2xx', reason: 'none' },
  },
  after: {
    A1: { statusClass: 'error', reason: 'grant' },
    A2: { statusClass: 'error', reason: 'grant' },
    A3: { statusClass: 'error', reason: 'grant' },
    A4: { statusClass: 'error', reason: 'grant' },
    U1: { statusClass: '2xx', count: 1 },
    U2: { statusClass: '2xx', isReadAfter: true },
    U3: { statusClass: 'error', reason: 'grant' },
    U4: { statusClass: 'error', reason: 'grant' },
    RT: { delivered: true },
    U5: { statusClass: 'error', reason: 'grant' },
  },
}

function parsePhase(argv) {
  const idx = argv.indexOf('--phase')
  const phase = idx !== -1 ? argv[idx + 1] : undefined
  if (phase !== 'before' && phase !== 'after') {
    console.error('Usage: node scripts/task-881-notifications-probe.mjs --phase before|after')
    process.exit(2)
  }
  return phase
}

function statusClassOf(status) {
  return status >= 200 && status < 300 ? '2xx' : 'error'
}

function classifyReason(status, message) {
  if (status >= 200 && status < 300) return 'none'
  if (typeof message === 'string' && GRANT_RE.test(message)) return 'grant'
  if (typeof message === 'string' && RLS_RE.test(message)) return 'rls'
  return 'other'
}

async function pgInfoOf(res) {
  if (res.status >= 200 && res.status < 300) return { pgCode: 'null', reason: 'none' }
  try {
    const body = await res.json()
    const pgCode = body?.code ?? 'null'
    const message = typeof body?.message === 'string' ? body.message : ''
    return { pgCode, reason: classifyReason(res.status, message) }
  } catch {
    return { pgCode: 'unparseable', reason: 'other' }
  }
}

async function request(url, headers, method, body) {
  try {
    return await fetch(url, { method, headers, body })
  } catch {
    return null // network-level failure — no HTTP status at all
  }
}

function printArmLine(phase, arm, role, method, status, pgCode, reason) {
  console.log(`phase=${phase} arm=${arm} role=${role} method=${method} http_status=${status} pg_code=${pgCode} reason=${reason}`)
}

function recordMismatch(mismatches, arm, expected, actual) {
  mismatches.push(`arm=${arm} expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`)
}

// Every post-setup failure path throws through this, so `finally` always runs (review 1 —
// `process.exit()` inside the try after the setup row exists skipped `finally` and left
// probe rows undeleted).
function failSetup(message) {
  throw new Error(message)
}

async function main() {
  config({ path: '.env.local' })

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const PROBE_EMAIL = process.env.PROBE_EMAIL
  const PROBE_PASSWORD = process.env.PROBE_PASSWORD

  const phase = parsePhase(process.argv)

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(2)
  }
  if (!PROBE_EMAIL || !PROBE_PASSWORD) {
    console.error('Missing PROBE_EMAIL or PROBE_PASSWORD in the process environment (never .env.local)')
    process.exit(2)
  }

  const base = SUPABASE_URL.replace(/\/$/, '')
  const authedClient = createClient(SUPABASE_URL, ANON_KEY)
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY)

  const expected = EXPECTATIONS[phase]
  const mismatches = []
  let userId
  let userToken
  let probeId
  let rtInsertedId
  let rtChannel

  try {
    console.log('Signing in as the probe (test) account...')
    const { data: signInData, error: signInError } = await authedClient.auth.signInWithPassword({
      email: PROBE_EMAIL,
      password: PROBE_PASSWORD,
    })
    if (signInError || !signInData?.user || !signInData?.session) {
      console.error('Sign-in failed:', signInError?.message ?? 'no user/session returned')
      process.exit(2)
    }
    userId = signInData.user.id
    userToken = signInData.session.access_token

    console.log('Inserting the setup probe row via the service role...')
    const { data: insertData, error: insertError } = await serviceClient
      .from('notifications')
      .insert({ user_id: userId, type: 'marketing', title: PROBE_TITLE, body: PROBE_BODY, is_read: false })
      .select('id')
      .single()
    if (insertError || !insertData?.id) {
      failSetup(`Setup probe-row insert failed: ${insertError?.message ?? 'no row returned'}`)
    }
    probeId = insertData.id

    const anonHeaders = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    const userHeaders = { apikey: ANON_KEY, Authorization: `Bearer ${userToken}` }
    const jsonHeaders = { 'Content-Type': 'application/json' }
    const minimalHeaders = { Prefer: 'return=minimal' }

    // ── A1 anon GET ──────────────────────────────────────────────────────────
    {
      const res = await request(`${base}/rest/v1/notifications?select=id&limit=0`, anonHeaders, 'GET')
      if (!res) failSetup('A1: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'A1', 'anon', 'GET', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.A1.statusClass || actual.reason !== expected.A1.reason) {
        recordMismatch(mismatches, 'A1', expected.A1, actual)
      }
    }

    // ── A2 anon POST ─────────────────────────────────────────────────────────
    {
      const res = await request(
        `${base}/rest/v1/notifications`,
        { ...anonHeaders, ...jsonHeaders, ...minimalHeaders },
        'POST',
        JSON.stringify({ user_id: userId, type: 'marketing', title: PROBE_TITLE, body: PROBE_BODY, is_read: false }),
      )
      if (!res) failSetup('A2: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'A2', 'anon', 'POST', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.A2.statusClass || actual.reason !== expected.A2.reason) {
        recordMismatch(mismatches, 'A2', expected.A2, actual)
      }
    }

    // ── A3 anon PATCH is_read ────────────────────────────────────────────────
    {
      const res = await request(
        `${base}/rest/v1/notifications?id=eq.${probeId}`,
        { ...anonHeaders, ...jsonHeaders, ...minimalHeaders },
        'PATCH',
        JSON.stringify({ is_read: true }),
      )
      if (!res) failSetup('A3: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'A3', 'anon', 'PATCH', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.A3.statusClass || actual.reason !== expected.A3.reason) {
        recordMismatch(mismatches, 'A3', expected.A3, actual)
      }
    }

    // ── A4 anon DELETE ───────────────────────────────────────────────────────
    {
      const res = await request(`${base}/rest/v1/notifications?id=eq.${probeId}`, { ...anonHeaders, ...minimalHeaders }, 'DELETE')
      if (!res) failSetup('A4: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'A4', 'anon', 'DELETE', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.A4.statusClass || actual.reason !== expected.A4.reason) {
        recordMismatch(mismatches, 'A4', expected.A4, actual)
      }
    }

    // ── U1 user GET own probe row (count only) ──────────────────────────────
    {
      const res = await request(`${base}/rest/v1/notifications?id=eq.${probeId}&select=id`, userHeaders, 'GET')
      if (!res) failSetup('U1: network-level failure')
      let count = null
      let pgCode = 'null'
      let reason = 'none'
      if (res.status >= 200 && res.status < 300) {
        try {
          const rows = await res.json()
          count = Array.isArray(rows) ? rows.length : null
        } catch { /* leave count null */ }
      } else {
        const info = await pgInfoOf(res)
        pgCode = info.pgCode
        reason = info.reason
      }
      console.log(`phase=${phase} arm=U1 role=user method=GET http_status=${res.status} pg_code=${pgCode} reason=${reason} count=${count === null ? 'null' : count}`)
      const actual = { statusClass: statusClassOf(res.status), count }
      if (actual.statusClass !== expected.U1.statusClass || actual.count !== expected.U1.count) {
        recordMismatch(mismatches, 'U1', expected.U1, actual)
      }
    }

    // ── U2 user PATCH is_read + service-role re-read ────────────────────────
    {
      const res = await request(
        `${base}/rest/v1/notifications?id=eq.${probeId}`,
        { ...userHeaders, ...jsonHeaders, ...minimalHeaders },
        'PATCH',
        JSON.stringify({ is_read: true }),
      )
      if (!res) failSetup('U2: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      const { data: reReadData, error: reReadError } = await serviceClient
        .from('notifications')
        .select('is_read')
        .eq('id', probeId)
        .single()
      const isReadAfter = reReadError ? null : reReadData?.is_read ?? null
      console.log(`phase=${phase} arm=U2 role=user method=PATCH http_status=${res.status} pg_code=${pgCode} reason=${reason} is_read_after=${isReadAfter === null ? 'null' : isReadAfter}`)
      const actual = { statusClass: statusClassOf(res.status), isReadAfter }
      if (actual.statusClass !== expected.U2.statusClass || actual.isReadAfter !== expected.U2.isReadAfter) {
        recordMismatch(mismatches, 'U2', expected.U2, actual)
      }
    }

    // ── U3 user PATCH title ──────────────────────────────────────────────────
    {
      const res = await request(
        `${base}/rest/v1/notifications?id=eq.${probeId}`,
        { ...userHeaders, ...jsonHeaders, ...minimalHeaders },
        'PATCH',
        JSON.stringify({ title: 'x' }),
      )
      if (!res) failSetup('U3: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'U3', 'user', 'PATCH', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.U3.statusClass || actual.reason !== expected.U3.reason) {
        recordMismatch(mismatches, 'U3', expected.U3, actual)
      }
    }

    // ── U4 user POST insert ──────────────────────────────────────────────────
    {
      const res = await request(
        `${base}/rest/v1/notifications`,
        { ...userHeaders, ...jsonHeaders, Prefer: 'return=representation' },
        'POST',
        JSON.stringify({ user_id: userId, type: 'marketing', title: PROBE_TITLE, body: PROBE_BODY, is_read: false }),
      )
      if (!res) failSetup('U4: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'U4', 'user', 'POST', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.U4.statusClass || actual.reason !== expected.U4.reason) {
        recordMismatch(mismatches, 'U4', expected.U4, actual)
      }
      // Defensive cleanup only — this insert is expected to be refused in both phases.
      // Its title matches PROBE_TITLE, so `finally`'s delete-by-title still catches it if it
      // ever unexpectedly succeeds; this arm does not track a separate id for it.
      if (res.status >= 200 && res.status < 300) {
        console.error('U4: unexpectedly succeeded — an extra probe row was created (title matches cleanup filter)')
      }
    }

    // ── RT realtime delivery (authenticated subscriber, real hook shape) ────
    {
      let settleFn
      const waitPromise = new Promise((resolve) => { settleFn = resolve })
      const timer = setTimeout(() => settleFn({ arrived: false, at: null }), RT_WAIT_MS)

      rtChannel = authedClient
        .channel(`user-notifications:user:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.new?.title === PROBE_TITLE && payload.new?.id !== probeId) {
              clearTimeout(timer)
              settleFn({ arrived: true, at: Date.now() })
            }
          },
        )

      await new Promise((resolve, reject) => {
        const subTimer = setTimeout(() => reject(new Error('subscribe timeout')), SUBSCRIBE_SETUP_MS)
        rtChannel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') { clearTimeout(subTimer); resolve() }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(subTimer)
            reject(new Error(`subscribe failed: ${status}${err ? ` (${err.message})` : ''}`))
          }
        })
      })

      const insertStartedAt = Date.now()
      const { data: rtInsertData, error: rtInsertError } = await serviceClient
        .from('notifications')
        .insert({ user_id: userId, type: 'marketing', title: PROBE_TITLE, body: PROBE_BODY, is_read: false })
        .select('id')
        .single()
      if (rtInsertError) {
        failSetup(`RT: service-role insert failed: ${rtInsertError.message}`)
      }
      rtInsertedId = rtInsertData?.id

      const result = await waitPromise
      const receivedMs = result.arrived ? result.at - insertStartedAt : null
      console.log(`phase=${phase} arm=RT role=user method=REALTIME received_ms=${receivedMs === null ? 'MISSING' : receivedMs}`)
      const delivered = result.arrived && receivedMs <= RT_WAIT_MS
      if (delivered !== expected.RT.delivered) {
        recordMismatch(mismatches, 'RT', expected.RT, { delivered })
      }
    }

    // ── U5 user DELETE on the probe id — last ───────────────────────────────
    {
      const res = await request(`${base}/rest/v1/notifications?id=eq.${probeId}`, { ...userHeaders, ...minimalHeaders }, 'DELETE')
      if (!res) failSetup('U5: network-level failure')
      const { pgCode, reason } = await pgInfoOf(res)
      printArmLine(phase, 'U5', 'user', 'DELETE', res.status, pgCode, reason)
      const actual = { statusClass: statusClassOf(res.status), reason }
      if (actual.statusClass !== expected.U5.statusClass || actual.reason !== expected.U5.reason) {
        recordMismatch(mismatches, 'U5', expected.U5, actual)
      }
    }

    if (mismatches.length > 0) {
      console.error(`${mismatches.length} MISMATCH(es):`)
      for (const m of mismatches) console.error(`  ${m}`)
      process.exitCode = 1
    } else {
      console.log(`phase=${phase}: all arms matched the expected shape.`)
      process.exitCode = 0
    }
  } catch (err) {
    console.error('Probe setup error:', err instanceof Error ? err.message : String(err))
    process.exitCode = 2
  } finally {
    try {
      if (rtChannel) await authedClient.removeChannel(rtChannel)
    } catch { /* best-effort teardown */ }

    if (userId) {
      let cleanupOk = true

      const cleanupIds = [probeId, rtInsertedId].filter(Boolean)
      if (cleanupIds.length > 0) {
        const { error: idCleanupError } = await serviceClient
          .from('notifications')
          .delete()
          .eq('user_id', userId)
          .in('id', cleanupIds)
        if (idCleanupError) {
          cleanupOk = false
          console.error('Probe row cleanup (by id) FAILED — delete manually:', idCleanupError.message)
        }
      }

      // Catches a row still titled PROBE_TITLE whose id was not tracked (e.g. U4 succeeding
      // unexpectedly) and is a no-op for rows already removed by the id-based delete above.
      const { error: titleCleanupError } = await serviceClient
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('title', PROBE_TITLE)
      if (titleCleanupError) {
        cleanupOk = false
        console.error('Probe row cleanup (by title) FAILED — delete manually:', titleCleanupError.message)
      }

      if (cleanupOk) {
        console.log('probe rows deleted')
      } else if (process.exitCode === 0 || process.exitCode === undefined) {
        process.exitCode = 2
      }
    }

    try {
      await authedClient.auth.signOut()
    } catch { /* best-effort */ }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
