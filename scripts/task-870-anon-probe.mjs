#!/usr/bin/env node
/**
 * task-870-anon-probe.mjs
 *
 * Task 870 (Sprint 80). Two-armed live proof for the Data API privilege hardening: R
 * (the 18 tables in scripts/task-870-harden-privileges.sql) must be reachable by anon
 * BEFORE the harden script runs and unreachable AFTER it, while service_role stays
 * reachable in both phases. public.public_user_profiles must already refuse anon
 * SELECT/UPDATE in both phases (the 2026-09-23 hotfix).
 *
 * For each table in R:
 *   - anon GET  /rest/v1/<t>?select=*&limit=0
 *   - service-role GET /rest/v1/<t>?select=*&limit=0  (Prefer: count=exact, Range: 0-0)
 * For public_user_profiles:
 *   - anon GET  /rest/v1/public_user_profiles?select=*&limit=0
 *   - anon PATCH /rest/v1/public_user_profiles?id=eq.00000000-0000-0000-0000-000000000000
 *       body {"name":null}, Prefer: return=minimal — the id cannot exist, so even an
 *       unrefused PATCH could not mutate any row.
 *
 * Issues no other write. Prints ONLY: phase, relation, role, method, http_status,
 * pg_code, denied_relation — never a key, a bearer token, row content, a count value, or
 * the raw PostgREST message text. `denied_relation` is extracted from the message with
 * `/permission denied for (?:table|view|relation) ([A-Za-z0-9_."]+)/` and is `null` when
 * the response is 2xx or the message does not match (review 1, F4/§16.4): a `42501` can
 * come from a missing grant on the probed relation itself, or from an RLS policy subquery
 * on a *different* relation (e.g. `support_messages`'s policy reads `support_tickets`) —
 * `denied_relation` is what tells the two apart.
 *
 * Reads `.env.local` via Node's `fs`/`dotenv` — never PowerShell `Get-Content -Raw`,
 * which silently mojibakes a BOM-less UTF-8 file (818/819 corollary,
 * docs/orchestrator-procedures.md).
 *
 * Exits 1 if any request fails at the network level (no HTTP status at all).
 *
 * Usage: node scripts/task-870-anon-probe.mjs --phase before|after
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

const R_TABLES = [
  'email_change_tokens', 'user_status_history', 'user_change_log',
  'agent_reviews', 'amenities', 'amenity_translations', 'conversations',
  'currency_rates', 'history_clear_events', 'languages', 'listing_amenities',
  'listing_translations', 'location_translations', 'messages',
  'notification_settings', 'page_translations', 'support_messages',
  'verification_requests',
]

const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000'

function parsePhase(argv) {
  const idx = argv.indexOf('--phase')
  const phase = idx !== -1 ? argv[idx + 1] : undefined
  if (phase !== 'before' && phase !== 'after') {
    console.error('Usage: node scripts/task-870-anon-probe.mjs --phase before|after')
    process.exit(1)
  }
  return phase
}

const DENIED_RELATION_RE = /permission denied for (?:table|view|relation) ([A-Za-z0-9_."]+)/

async function pgInfoOf(res) {
  if (res.status >= 200 && res.status < 300) return { pgCode: 'null', deniedRelation: 'null' }
  try {
    const body = await res.json()
    const pgCode = body?.code ?? 'null'
    const message = typeof body?.message === 'string' ? body.message : ''
    const match = message.match(DENIED_RELATION_RE)
    const deniedRelation = match ? match[1] : 'null'
    return { pgCode, deniedRelation }
  } catch {
    return { pgCode: 'unparseable', deniedRelation: 'null' }
  }
}

function printLine(phase, relation, role, method, status, pgCode, deniedRelation) {
  console.log(`phase=${phase} relation=${relation} role=${role} method=${method} http_status=${status} pg_code=${pgCode} denied_relation=${deniedRelation}`)
}

async function request(url, headers, method, body) {
  try {
    return await fetch(url, { method, headers, body })
  } catch {
    return null // network-level failure — no HTTP status at all
  }
}

async function main() {
  config({ path: '.env.local' })

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const phase = parsePhase(process.argv)
  const base = SUPABASE_URL.replace(/\/$/, '')

  let networkFailure = false

  for (const t of R_TABLES) {
    const anonRes = await request(
      `${base}/rest/v1/${t}?select=*&limit=0`,
      { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
      'GET',
    )
    if (!anonRes) {
      networkFailure = true
      printLine(phase, t, 'anon', 'GET', 'NETWORK_FAILURE', 'null', 'null')
    } else {
      const { pgCode, deniedRelation } = await pgInfoOf(anonRes)
      printLine(phase, t, 'anon', 'GET', anonRes.status, pgCode, deniedRelation)
    }

    const svcRes = await request(
      `${base}/rest/v1/${t}?select=*&limit=0`,
      {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'count=exact',
        Range: '0-0',
      },
      'GET',
    )
    if (!svcRes) {
      networkFailure = true
      printLine(phase, t, 'service_role', 'GET', 'NETWORK_FAILURE', 'null', 'null')
    } else {
      const { pgCode, deniedRelation } = await pgInfoOf(svcRes)
      printLine(phase, t, 'service_role', 'GET', svcRes.status, pgCode, deniedRelation)
    }
  }

  // public_user_profiles — anon GET + anon PATCH on an id that cannot exist
  const viewGetRes = await request(
    `${base}/rest/v1/public_user_profiles?select=*&limit=0`,
    { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    'GET',
  )
  if (!viewGetRes) {
    networkFailure = true
    printLine(phase, 'public_user_profiles', 'anon', 'GET', 'NETWORK_FAILURE', 'null', 'null')
  } else {
    const { pgCode, deniedRelation } = await pgInfoOf(viewGetRes)
    printLine(phase, 'public_user_profiles', 'anon', 'GET', viewGetRes.status, pgCode, deniedRelation)
  }

  const viewPatchRes = await request(
    `${base}/rest/v1/public_user_profiles?id=eq.${NONEXISTENT_ID}`,
    {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    'PATCH',
    JSON.stringify({ name: null }),
  )
  if (!viewPatchRes) {
    networkFailure = true
    printLine(phase, 'public_user_profiles', 'anon', 'PATCH', 'NETWORK_FAILURE', 'null', 'null')
  } else {
    const { pgCode, deniedRelation } = await pgInfoOf(viewPatchRes)
    printLine(phase, 'public_user_profiles', 'anon', 'PATCH', viewPatchRes.status, pgCode, deniedRelation)
  }

  if (networkFailure) {
    console.error('One or more requests failed at the network level (no HTTP status).')
    process.exit(1)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Probe failed:', err)
    process.exit(1)
  })
}
