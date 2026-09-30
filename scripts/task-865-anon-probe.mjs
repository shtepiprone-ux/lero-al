#!/usr/bin/env node
/**
 * task-865-anon-probe.mjs
 *
 * Task 865 (Sprint 78), R3/AC3. Owner-run two-phase live proof that an anonymous caller can
 * no longer write public.listing_views through PostgREST. Pattern: task-881-notifications-probe.mjs
 * (classification) and task-870-anon-probe.mjs (dotenv, raw fetch).
 *
 * Arms (anon key only):
 *   P1 POST   /rest/v1/listing_views  {listing_id: ...0865, ip_hash}  (the FK on listing_id
 *             fires after the privilege and RLS checks, and the synthetic id cannot exist, so
 *             no row is ever written)
 *   P2 PATCH  /rest/v1/listing_views?listing_id=eq.<synthetic id>  {viewed_at}
 *   P3 DELETE /rest/v1/listing_views?listing_id=eq.<synthetic id>
 *
 * Each arm prints one line:
 *   phase=<before|after> arm=<P1|P2|P3> method=<..> http_status=<n> pg_code=<code|null> reason=<none|grant|rls|other>
 * `grant` matches /permission denied for (?:table|relation) listing_views/i, `rls` matches
 * /row-level security/i, `none` is any 2xx, `other` is anything else.
 *
 * Expected BEFORE: P1 other/23503, P2 none, P3 none. Expected AFTER: every arm grant.
 * Exit 0 when every arm matches its phase, 1 with a MISMATCH line otherwise, 2 on setup error.
 * Never prints a key, token or row content. No service-role write.
 *
 * Usage: node.exe scripts\task-865-anon-probe.mjs --phase before|after
 */

import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const SYNTHETIC_ID = '00000000-0000-0000-0000-000000000865'
const GRANT_RE = /permission denied for (?:table|relation) listing_views/i
const RLS_RE = /row-level security/i

const EXPECTATIONS = {
  before: {
    P1: { reason: 'other', pgCode: '23503' },
    P2: { reason: 'none' },
    P3: { reason: 'none' },
  },
  after: {
    P1: { reason: 'grant' },
    P2: { reason: 'grant' },
    P3: { reason: 'grant' },
  },
}

function parsePhase(argv) {
  const idx = argv.indexOf('--phase')
  const phase = idx !== -1 ? argv[idx + 1] : undefined
  if (phase !== 'before' && phase !== 'after') {
    console.error('Usage: node scripts/task-865-anon-probe.mjs --phase before|after')
    process.exit(2)
  }
  return phase
}

function classify(status, message) {
  if (status >= 200 && status < 300) return 'none'
  if (typeof message === 'string' && GRANT_RE.test(message)) return 'grant'
  if (typeof message === 'string' && RLS_RE.test(message)) return 'rls'
  return 'other'
}

async function runArm(baseUrl, key, arm, method, path, body) {
  const headers = { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' }
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${baseUrl}/rest/v1/listing_views${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let pgCode = 'null'
  let message
  if (res.status < 200 || res.status >= 300) {
    try {
      const json = await res.json()
      if (json && typeof json.code === 'string') pgCode = json.code
      message = json && typeof json.message === 'string' ? json.message : undefined
    } catch {
      // A non-JSON error body is classified as `other` with pg_code=null.
    }
  }
  return { arm, method, status: res.status, pgCode, reason: classify(res.status, message) }
}

async function main() {
  const phase = parsePhase(process.argv.slice(2))
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!baseUrl || !key) {
    console.error('Setup error: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local')
    process.exit(2)
  }

  const filter = `?listing_id=eq.${SYNTHETIC_ID}`
  const results = []
  try {
    results.push(await runArm(baseUrl, key, 'P1', 'POST', '', { listing_id: SYNTHETIC_ID, ip_hash: 'task865-probe' }))
    results.push(await runArm(baseUrl, key, 'P2', 'PATCH', filter, { viewed_at: '2000-01-01T00:00:00Z' }))
    results.push(await runArm(baseUrl, key, 'P3', 'DELETE', filter))
  } catch (err) {
    console.error(`Setup error: request failed (${err instanceof Error ? err.name : 'unknown'})`)
    process.exit(2)
  }

  let mismatches = 0
  for (const r of results) {
    console.log(
      `phase=${phase} arm=${r.arm} method=${r.method} http_status=${r.status} pg_code=${r.pgCode} reason=${r.reason}`,
    )
    const want = EXPECTATIONS[phase][r.arm]
    const pgOk = want.pgCode === undefined || want.pgCode === r.pgCode
    if (r.reason !== want.reason || !pgOk) {
      mismatches += 1
      console.log(
        `MISMATCH arm=${r.arm} expected reason=${want.reason}${want.pgCode ? ` pg_code=${want.pgCode}` : ''} actual reason=${r.reason} pg_code=${r.pgCode}`,
      )
    }
  }
  process.exit(mismatches > 0 ? 1 : 0)
}

main()
