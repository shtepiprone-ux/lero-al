#!/usr/bin/env node
/**
 * task-867-pages-read-probe.mjs
 *
 * Read-only probe for Task 867 (Sprint 79). Measures the live grant/RLS posture of
 * `public.pages` before and after O79-1, and prints the §10.1 content census.
 *
 * Three read-only queries, zero writes:
 *   1. anon select over `pages` (no filter)
 *   2. anon select over `pages` filtered to `is_published = true`
 *   3. the same unfiltered select through the service role
 *
 * Then, through the service role only, one census line per row: slug, is_published,
 * and the CHARACTER LENGTH of content.<locale>.title / content.<locale>.body for each
 * of the four locales. Never the body text itself.
 *
 * Prints no key material, no bearer token, and no URL fragment beyond the project host.
 *
 * Reads `.env.local` via Node's `fs` (through the `dotenv` package) — never PowerShell
 * `Get-Content -Raw`, which silently mojibakes a BOM-less UTF-8 file.
 *
 * Usage: node scripts/task-867-pages-read-probe.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

const LOCALES = ['sq', 'en', 'uk', 'it']

function describeResult(label, { data, error, count }) {
  const rowCount = Array.isArray(data) ? data.length : (count ?? 0)
  console.log(`${label}:`)
  console.log(`  error_code: ${error?.code ?? 'null'}`)
  console.log(`  error_message: ${error?.message ?? 'null'}`)
  console.log(`  row_count: ${rowCount}`)
  return { error, rowCount }
}

function lengthOf(value) {
  return typeof value === 'string' ? value.length : 0
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

  let host = '(unparseable)'
  try {
    host = new URL(SUPABASE_URL).host
  } catch {
    // leave placeholder — never print the raw URL on parse failure
  }
  console.log(`HOST: ${host}`)
  console.log('')

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Query 1: anon, unfiltered ────────────────────────────────────────────────
  const q1 = await anonClient.from('pages').select('id', { count: 'exact' })
  const r1 = describeResult('Q1 anon select pages (no filter)', q1)
  console.log('')

  // ── Query 2: anon, is_published = true ───────────────────────────────────────
  const q2 = await anonClient.from('pages').select('id', { count: 'exact' }).eq('is_published', true)
  describeResult('Q2 anon select pages where is_published = true', q2)
  console.log('')

  // ── Query 3: service role, unfiltered ────────────────────────────────────────
  const q3 = await serviceClient.from('pages').select('id, slug, is_published, content', { count: 'exact' })
  const r3 = describeResult('Q3 service_role select pages (no filter)', q3)
  console.log('')

  // ── Branch decision (§3.1) ───────────────────────────────────────────────────
  if (r1.error) {
    console.log(`BRANCH: anon denied (error ${r1.error.code ?? 'unknown'}) — proceed with R2, the branch F21 already selected.`)
  } else {
    console.log('BRANCH: anon already permitted — TASK SPECIFICATION CONTRADICTION. Stop before applying R2.')
  }
  console.log('')

  // ── §10.1 content census — service role, lengths only, never body text ──────
  console.log('CONTENT CENSUS (service-role, character lengths only, no body text):')
  const rows = q3.data ?? []
  if (rows.length === 0) {
    console.log('  (no rows)')
  }
  for (const row of rows) {
    const content = (row.content && typeof row.content === 'object') ? row.content : {}
    const parts = LOCALES.map((locale) => {
      const localeContent = content[locale] ?? {}
      return `${locale}: title_len=${lengthOf(localeContent.title)} body_len=${lengthOf(localeContent.body)}`
    })
    console.log(`  slug=${row.slug} is_published=${row.is_published} | ${parts.join(' | ')}`)
  }
  console.log('')
  console.log(`CENSUS_ROW_COUNT=${rows.length} (F22 recorded exactly 1 on 2026-09-21 — this run states whether that still holds)`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Probe failed:', err)
    process.exit(1)
  })
}
