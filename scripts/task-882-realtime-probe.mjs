#!/usr/bin/env node
/**
 * task-882-realtime-probe.mjs
 *
 * Task 882 (Sprint 82), R5/AC5/O82-4. Owner-run only, never in CI.
 *
 * Closes F6 (UNKNOWN in the kickoff): whether an AUTHENTICATED subscriber, joined exactly as
 * the shipped `useNotifications.ts` R1 code joins — `postgres_changes` on `public.notifications`
 * with `filter: 'user_id=eq.<id>'`, on a channel name containing the id — actually receives an
 * INSERT on its own row, and how fast. F5 already showed an ANONYMOUS channel reaches SUBSCRIBED
 * (Realtime does not reject a public channel at join time), so join succeeding proves nothing by
 * itself; only receipt of the row proves delivery.
 *
 * Two arms, one inserted row:
 *   Arm A — the probe user's OWN authenticated client, subscribed with the real user_id filter,
 *           must receive the INSERT within 10 s.
 *   Arm B — a separate ANONYMOUS client, subscribed with the SAME filter (i.e. as if it were
 *           impersonating the probe user without a session), must NOT receive it within 10 s —
 *           this is the filter+RLS negative control (AC5 arm B / the negative-flow row "another
 *           user's notification").
 *
 * The row is inserted through the service-role client (bypasses RLS by design — this is the only
 * way to originate the INSERT deterministically) and is always deleted in `finally`, whatever the
 * outcome.
 *
 * F5's own probe script had a recursion bug: it called removeChannel(channel) from inside that
 * channel's own status callback, which re-enters the callback during teardown. This script never
 * calls removeChannel from within a status callback — both channels are torn down only after both
 * wait promises have already settled, in the top-level flow.
 *
 * Prints ONLY: `ARM A <ms|MISSING>`, `ARM B <none|RECEIVED>`, and short progress/status lines.
 * Never prints a key, a password, or row content. Exit 0 when Arm A arrived and Arm B did not;
 * exit 1 otherwise (including any AC5 mismatch); exit 2 on a setup error (missing env, sign-in
 * failure, subscribe timeout, insert failure).
 *
 * Env:
 *   .env.local        — NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *                        SUPABASE_SERVICE_ROLE_KEY
 *   process env only  — PROBE_EMAIL, PROBE_PASSWORD (a TEST account, never a real user's;
 *                        never committed, never read from .env.local)
 *
 * Usage:
 *   $env:PROBE_EMAIL = "test-account-2@example.com"
 *   $env:PROBE_PASSWORD = "the-test-account-password"
 *   node.exe scripts\task-882-realtime-probe.mjs
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const EVENT_WAIT_MS = 10_000
const SUBSCRIBE_SETUP_MS = 10_000
const PROBE_TITLE = '[task-882 probe]'
const PROBE_BODY = 'Task 882 realtime delivery probe — safe to ignore, auto-deleted.'

function createWaiter(timeoutMs) {
  let resolveFn
  const promise = new Promise((resolve) => { resolveFn = resolve })
  const timer = setTimeout(() => resolveFn({ arrived: false, at: null }), timeoutMs)
  return {
    promise,
    settle: () => {
      clearTimeout(timer)
      resolveFn({ arrived: true, at: Date.now() })
    },
  }
}

function waitForSubscribed(channel, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('subscribe timeout')), timeoutMs)
    channel.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timer)
        resolve()
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timer)
        reject(new Error(`subscribe failed: ${status}${err ? ` (${err.message})` : ''}`))
      }
      // CLOSED is expected during our own later teardown — ignored here, we've already resolved/rejected by then.
    })
  })
}

async function main() {
  config({ path: '.env.local' })

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const PROBE_EMAIL = process.env.PROBE_EMAIL
  const PROBE_PASSWORD = process.env.PROBE_PASSWORD

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(2)
  }
  if (!PROBE_EMAIL || !PROBE_PASSWORD) {
    console.error('Missing PROBE_EMAIL or PROBE_PASSWORD in the process environment (never .env.local)')
    process.exit(2)
  }

  const authedClient = createClient(SUPABASE_URL, ANON_KEY)
  const anonClient = createClient(SUPABASE_URL, ANON_KEY)
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY)

  let userId
  let armAChannel
  let armBChannel
  let insertedId

  try {
    console.log('Signing in as the probe (test) account...')
    const { data: signInData, error: signInError } = await authedClient.auth.signInWithPassword({
      email: PROBE_EMAIL,
      password: PROBE_PASSWORD,
    })
    if (signInError || !signInData?.user) {
      console.error('Sign-in failed:', signInError?.message ?? 'no user returned')
      process.exit(2)
    }
    userId = signInData.user.id
    console.log('Signed in. Subscribing both arms (same shape the shipped hook uses)...')

    const armAWaiter = createWaiter(EVENT_WAIT_MS)
    const armBWaiter = createWaiter(EVENT_WAIT_MS)

    // Arm A — the probe user's own authenticated client, filtered to its own id (matches
    // useNotifications.ts R1 exactly: channel name and filter both scoped by user_id).
    armAChannel = authedClient
      .channel(`user-notifications:user:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new?.title === PROBE_TITLE) armAWaiter.settle()
        },
      )

    // Arm B — a separate anonymous client, same filter, no session. RLS (auth.uid() = user_id)
    // must refuse it regardless of what the filter claims.
    armBChannel = anonClient
      .channel(`user-notifications:user:${userId}:anon-probe`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.new?.title === PROBE_TITLE) armBWaiter.settle()
        },
      )

    await Promise.all([
      waitForSubscribed(armAChannel, SUBSCRIBE_SETUP_MS),
      waitForSubscribed(armBChannel, SUBSCRIBE_SETUP_MS),
    ])
    console.log('Both arms SUBSCRIBED. Inserting the probe row via the service role...')

    const insertStartedAt = Date.now()
    const { data: insertData, error: insertError } = await serviceClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'marketing',
        title: PROBE_TITLE,
        body: PROBE_BODY,
        is_read: false,
      })
      .select('id')
      .single()

    if (insertError || !insertData?.id) {
      console.error('Insert failed:', insertError?.message ?? 'no row returned')
      process.exit(2)
    }
    insertedId = insertData.id

    const [armAResult, armBResult] = await Promise.all([armAWaiter.promise, armBWaiter.promise])

    const armALatencyMs = armAResult.arrived ? armAResult.at - insertStartedAt : null
    console.log(`ARM A ${armALatencyMs !== null ? `${armALatencyMs}ms` : 'MISSING'}`)
    console.log(`ARM B ${armBResult.arrived ? 'RECEIVED' : 'none'}`)

    const pass = armAResult.arrived && !armBResult.arrived
    process.exitCode = pass ? 0 : 1
  } catch (err) {
    console.error('Probe setup error:', err instanceof Error ? err.message : String(err))
    process.exitCode = 2
  } finally {
    // Teardown happens outside any status callback (F5's recursion bug avoided by construction).
    try {
      if (armAChannel) await authedClient.removeChannel(armAChannel)
    } catch { /* best-effort teardown */ }
    try {
      if (armBChannel) await anonClient.removeChannel(armBChannel)
    } catch { /* best-effort teardown */ }

    if (insertedId) {
      const { error: deleteError } = await serviceClient.from('notifications').delete().eq('id', insertedId)
      if (deleteError) {
        console.error('Probe row cleanup FAILED — delete manually:', deleteError.message)
        process.exitCode = process.exitCode && process.exitCode !== 0 ? process.exitCode : 2
      } else {
        console.log('probe row deleted')
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
