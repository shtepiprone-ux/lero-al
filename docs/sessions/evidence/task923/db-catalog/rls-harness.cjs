/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// RLS / grants / RPC acceptance harness (v2, with the Revision 14 sections H01-H02 and DX01-DX05) — two ordinary user sessions (A and B) on the DEVELOPMENT database.
//
//   node rls-harness.cjs --i-confirm-dev-database [--diagnose]
//   node rls-harness.cjs --i-confirm-dev-database --snapshot-updated-at      (writes deletion-updated-at-snapshot.json and exits; run it immediately BEFORE the deletion SQL is applied)
//
// EXIT CODE: 0 only when every deny check holds (no VULN), every positive control works (no BROKEN), nothing is INCONCLUSIVE and the clean-up is
// verified complete. Anything else exits 1. --diagnose prints the same report but always exits 0 (use it only to look at a database that is known to be unhardened).
// (Revision 18: the owner-contact quota is gone from the SQL (owner decision D49), so OWNER_CONTACT_LIMIT is no longer read; F06 asserts that there is NO cap.)
//
// Revision 14 (kickoff section 24): H01 (R58 (c)) the view public_user_profiles is unreadable by a blocked, deleted and ended-session account and readable by an active one; H02 (R58 (c)) every
// SECURITY DEFINER function of `public` has pg_temp as the last search_path entry (a read-only catalog connection, labelled privileged); DX01-DX05 (R59 (d)) the deletion design: updated_at
// unchanged by the backfill, a supplied name replaced by the trigger's, a deleted staff account's rows keep the name with a null id, a person's views go and the counts drop by one per view never
// below 0, deleting a company's creator deletes the company and its agents keep company_id null. Against a database WITHOUT the deletion SQL every DX check fails (VULN) and says why.
// Revision 15 (kickoff section 25, R61): H01e is asserted - the SERVICE ROLE reads the view (one row), before and after the hardening v6 (the view trusts a server role).
// Revision 16 (kickoff section 26, R62 (b), (c)): DX03d - a staff account named by a key to AUTH.USERS (email_templates.updated_by) is deleted and its row keeps the name with a null id;
// DX06a-d - anon and a signed-in session cannot read updated_by_name of pages and site_footer (a privilege refusal, error 42501); DX06e-g - the public columns of a published page and the public
// footer columns stay readable (positive controls). Before the deletion SQL is applied updated_by_name does not exist, so DX06a-d are VULN (no privilege protects a column that is not there).
// Revision 16 (kickoff sections 27-29, R63-R65, hardening v7): V701-V707 created_at, public_id and slug of a listing; V710-V718 the old price (the database owns it; V718 is the currency-change
// fail-safe, R64 (a) is BLOCKED); V720-V723 the owner contact only for an active listing; V730-V732 end_user_sessions; V740-V744 set_default_currency (on a privileged connection inside a
// transaction that is always rolled back, so the real currencies rows are never changed). Slugs a SESSION inserts are plain (no underscore): a v7 rule.
// Revision 17 (kickoff section 32, R81 (b)): V750-V752 public.reauth_failures (hardening v7, change 16): anon and a signed-in session can neither read, write nor delete it (42501), service_role
// writes and counts the rows of one synthetic person. Against a database WITHOUT v7 the table does not exist: V750 / V751 are VULN and V752 BROKEN, each saying why.
// Revision 18 (kickoff section 34, R82, hardening v7.1; Opus's review 23): N07 / N08 (S1, owner decision D58) now assert that NO restore function exists - a marked account (10 and 100 days) calls
// caller_access_state and restore_inactive_account through the Data API and each answers "function not found" (PGRST202), the account stays marked, and the catalog holds neither function; V724 / V725 (S3)
// to_regclass('public.owner_contact_access') and to_regprocedure('public.owner_contact_daily_limit()') are null; F06 (D49) one signed-in caller opens the owner contact of six different active listings
// in a row and every call answers (no cap); V753 (S5) the grantees of the REAL public.reauth_failures are the table owner and service_role only (no PUBLIC, anon or authenticated). These deny checks hold
// BEFORE and AFTER the apply (v7.1 never creates those objects): only V753 needs the table, so it is VULN / INCONCLUSIVE before the apply and PASS after.
//
// Data: service_role only PREPARES and CLEANS rows of this run (tagged RUN). A and B are real sessions (anon key + password). No existing row is read or changed
// (DX01 reads only a digest of the id and updated_at of the existing rows of email_templates and support_tickets, never their content).
// Nothing secret is printed: all output passes through scrub().
const fs = require('fs')
const crypto = require('crypto')
const { env, scrub, connect } = require('./lib.cjs')
const { createClient } = require('C:/Claude_Code_Projects/lero-al/node_modules/@supabase/supabase-js')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL / the Supabase URL point at the development project.')
  process.exit(2)
}
const DIAGNOSE = process.argv.includes('--diagnose')
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
const svc = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, opts)
const mkAnon = () => createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, opts)
const RUN = 'zz_synth_' + Date.now().toString(36)
// v7 (R65 (b)): a session INSERT must carry a plain slug (^[a-z0-9]+(-[a-z0-9]+)*$), so the slugs a SESSION creates cannot hold the underscores of RUN. Clean-up finds both prefixes.
const SLUG = RUN.replace(/_/g, '')
const results = []
const created = { users: new Set(), listings: new Set(), storage: [], rows: [] }   // rows: { table, id } of the synthetic rows of the DX section, removed before the users
const seenIds = new Set()

// ── reporting ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// status: PASS | VULN (a deny expectation failed) | BROKEN (a positive control failed) | INCONCLUSIVE (could not decide) | INFO (not asserted)
function rec(id, status, what, expected, observed, note = '') {
  if (seenIds.has(id)) throw new Error('duplicate check id ' + id)
  seenIds.add(id)
  results.push({ id, status, what, expected, observed: scrub(observed), note: scrub(note) })
  const tag = { PASS: ' ok ', VULN: 'VULN', BROKEN: 'BRKN', INCONCLUSIVE: '????', INFO: 'info' }[status]
  console.log(`${tag} ${id} ${what} | expected: ${expected} | observed: ${scrub(observed)}${note ? ' | ' + scrub(note) : ''}`)
}
const brief = (r) => (r.error ? `error ${r.error.code || ''} ${String(r.error.message).slice(0, 90)}` : `rows=${Array.isArray(r.data) ? r.data.length : r.data == null ? 0 : 1}`)
const rows = (r) => (Array.isArray(r.data) ? r.data.length : r.data ? 1 : 0)
const strongPw = () => 'Zz!' + crypto.randomBytes(12).toString('base64url') + '9a'

// DENY: the write/read must not take effect. blocked = error OR zero rows. If it took effect -> VULN.
function deny(id, what, r, expected = 'refused (error or 0 rows)') {
  const took = !r.error && rows(r) > 0
  rec(id, took ? 'VULN' : 'PASS', what, expected, brief(r))
}
// ALLOW: positive control — the legitimate action must work.
function allow(id, what, ok, observed, expected = 'works') { rec(id, ok ? 'PASS' : 'BROKEN', what, expected, observed) }

async function must(promise, label) { const r = await promise; if (r.error) throw new Error(label + ': ' + r.error.message); return r }

// ── preparation (service_role) ──────────────────────────────────────────────────────────────────────────────────────────────────────────
async function makeUser(tag, { role, metadata } = {}) {
  const email = `${RUN}_${tag}@example.com`
  const password = strongPw()
  const { data, error } = await svc.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: `${RUN} ${tag}`, ...(metadata || {}) } })
  if (error) throw new Error('createUser failed: ' + error.message)
  const id = data.user.id
  created.users.add(id)
  for (let i = 0; i < 24; i++) {
    const { data: row } = await svc.from('users').select('id').eq('id', id).maybeSingle()
    if (row) break
    await new Promise((r) => setTimeout(r, 250))
  }
  const phone = '+3556' + Math.floor(1e7 + Math.random() * 8e7)
  await must(svc.from('users').update({ phone, whatsapp: phone, ...(role ? { role } : {}) }).eq('id', id), 'prepare user')
  const client = mkAnon()
  const si = await client.auth.signInWithPassword({ email, password })
  if (si.error) throw new Error('sign-in failed: ' + si.error.message)
  return { id, email, phone, client }
}
async function makeListing(owner, status, tag) {
  const { data, error } = await svc.from('listings').insert({ user_id: owner, slug: `${RUN}-${tag}`, title: `${RUN} ${tag}`, price: 1000, listing_type: 'sale', property_type: 'apartment', status }).select('id,views_count').single()
  if (error) throw new Error('prepare listing failed: ' + error.message)
  created.listings.add(data.id)
  return data
}
const sget = async (table, id, cols) => { const r = await svc.from(table).select(cols).eq('id', id).maybeSingle(); if (r.error) throw new Error('verify read failed: ' + r.error.message); return r.data }

// One protected column, one attempt, one verdict: A writes ONLY this column; the service reads it back; the original is restored.
async function fieldTest(id, table, who, rowId, patch, col, baseline, restore) {
  await must(svc.from(table).update(baseline).eq('id', rowId), 'baseline ' + id)
  const r = await who.client.from(table).update(patch).eq('id', rowId).select(col)
  const after = (await sget(table, rowId, col))[col]
  const before = baseline[col]
  const isTs = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) && !Number.isNaN(Date.parse(v))
  const changed = (isTs(after) && isTs(before) ? Date.parse(after) !== Date.parse(before) : JSON.stringify(after) !== JSON.stringify(before)) && !(after == null && before == null)
  rec(id, changed ? 'VULN' : 'PASS', `${table}.${col} written alone by its own owner`, 'unchanged', `${brief(r)}; ${col}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`)
  await must(svc.from(table).update(restore || baseline).eq('id', rowId), 'restore ' + id)
}

// ── v4 checks (Opus review changes 2, 3, 4, 7, 8; owner D25-D29) ────────────────────────────────────────────────────────────────────────────
// One synthetic person per state. Each attempts the same set of reads and writes with the session it already holds (a token that is still valid).
// A refusal counts only when it IS an access refusal (42501 / row-level security / account_blocked) or the call touched 0 rows; any other error is INCONCLUSIVE.
const isAccessRefusal = (r) => !!r.error && (r.error.code === '42501' || /row-level security|permission denied|account_blocked/i.test(r.error.message || ''))
const worked = (r) => !r.error && (Array.isArray(r.data) ? r.data.length > 0 : r.data != null)
function verdict(id, label, what, r, { fk = false } = {}) {
  if (worked(r)) return rec(id, 'VULN', `${label}: ${what}`, 'refused', brief(r))
  // a missing profile row: a write that points at it is also refused by the foreign key (23503), a refusal of the same act
  if (fk && r.error && r.error.code === '23503') return rec(id, 'PASS', `${label}: ${what}`, 'refused (access control or the foreign key to the missing profile)', brief(r))
  if (r.error && !isAccessRefusal(r)) return rec(id, 'INCONCLUSIVE', `${label}: ${what}`, 'refused by access control', brief(r))
  return rec(id, 'PASS', `${label}: ${what}`, 'refused', brief(r))
}
async function attempts(U, tag, LBa) {
  const slug = `${SLUG}-${tag.replace(/_/g, '')}`
  const w1 = await U.client.from('users').update({ name: `${RUN} ${tag}` }).eq('id', U.id).select('id')
  const w2 = await U.client.from('listings').insert({ user_id: U.id, slug, title: `${RUN} ${tag}`, price: 1, listing_type: 'sale', property_type: 'apartment', status: 'pending', expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), views_count: 0 }).select('id')
  if (w2.data && w2.data[0]) created.listings.add(w2.data[0].id)
  const w3 = await U.client.from('favorites').insert({ user_id: U.id, listing_id: LBa.id }).select('id')
  const f1 = await U.client.rpc('get_listing_owner_contact', { listing_id_param: LBa.id })
  const f2 = await U.client.rpc('record_recently_viewed', { p_listing_id: LBa.id })
  const r1 = await U.client.from('listings').select('id').eq('id', LBa.id)      // a public listing: a person without access reads nothing
  const r2 = await U.client.from('users').select('id,status').eq('id', U.id)    // the person's own row
  return [['a', 'edits own profile', w1], ['b', 'creates a listing', w2], ['c', 'adds a favourite', w3], ['d', 'asks the owner contact (RPC)', f1], ['e', 'records a recently viewed item (RPC)', f2],
    ['f', 'reads a public listing', r1], ['g', 'reads own row', r2]]
}
async function realtimeEvent(U, trigger) {
  let got = false
  const ch = U.client.channel(`${RUN}-${U.id.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`)
  ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${U.id}` }, () => { got = true })
  const subscribed = await new Promise((res) => {
    const t = setTimeout(() => res(false), 9000)
    ch.subscribe((s) => { if (s === 'SUBSCRIBED') { clearTimeout(t); res(true) } })
  })
  if (!subscribed) { await U.client.removeChannel(ch); return { subscribed: false, got: false } }
  await new Promise((r) => setTimeout(r, 2500))   // the server needs a moment after SUBSCRIBED before it delivers changes
  await trigger()
  await new Promise((r) => setTimeout(r, 6000))
  await U.client.removeChannel(ch)
  return { subscribed: true, got }
}
async function v4checks({ A, C, LBa }) {
  const DAY = 864e5
  // N01 deleted, N02 missing row, N03 ended session: for an ordinary user and for a moderator and an administrator (any role, D27)
  for (const [role, tag] of [['user', 'u'], ['agent', 'g'], ['moderator', 'm'], ['admin', 'a']]) {
    const D = await makeUser(`n01_${tag}`, { role: role === 'user' ? undefined : role })
    await must(svc.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', D.id), 'delete mark ' + tag)
    for (const [s, what, r] of await attempts(D, `n01_${tag}`, LBa)) verdict(`N01${tag}${s}`, `a DELETED ${role} account (deleted_at set), valid token`, what, r)
  }
  const G = await makeUser('n02_missing')
  const gdel = await svc.from('users').delete().eq('id', G.id)
  if (gdel.error) rec('N02', 'INCONCLUSIVE', 'a session whose profile row is missing', 'refused', 'could not remove the profile row: ' + brief(gdel))
  else for (const [s, what, r] of await attempts(G, 'n02', LBa)) verdict(`N02${s}`, 'an account with NO profile row, valid token', what, r, { fk: true })
  const S = await makeUser('n03_ended')
  const tok = (await S.client.auth.getSession()).data.session.access_token
  const so = await svc.auth.admin.signOut(tok, 'global')
  if (so.error) rec('N03', 'INCONCLUSIVE', 'an ended session', 'refused', 'sign-out failed: ' + so.error.message)
  else for (const [s, what, r] of await attempts(S, 'n03', LBa)) verdict(`N03${s}`, 'an account whose SESSION was ended (token still unexpired)', what, r)

  // N04 blocked account reads (change 4): A blocked sees no public data and not even its own row
  await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', A.id), 'block A (reads)')
  verdict('N04a', 'a BLOCKED account', 'reads a public listing', await A.client.from('listings').select('id').eq('id', LBa.id))
  verdict('N04b', 'a BLOCKED account', 'reads a public lookup table (locations)', await A.client.from('locations').select('id').limit(1))
  await must(svc.from('users').update({ status: 'active', block_reason: null, suspended_until: null }).eq('id', A.id), 'unblock A (reads)')
  const okRead = await A.client.from('listings').select('id').eq('id', LBa.id)
  allow('N04c', 'the same account after the unblock reads a public listing', worked(okRead), brief(okRead))

  // N05 storage (change 7): the avatars bucket trusts a role alone; a blocked moderator wrote there
  const M = await makeUser('n05_mod', { role: 'moderator' })
  const path = `${M.id}/${RUN}-m.txt`
  // r9-53-storage-probe: only a plain INSERT works for an active moderator or administrator (an upsert, an update and a delete need a SELECT policy that does not exist)
  const up1 = await M.client.storage.from('avatars').upload(path, new Blob(['x']), { contentType: 'text/plain' })
  if (!up1.error) created.storage.push(path)
  // R98 (a): after the v8a apply the staff write policies of the bucket are gone (R69 (e)), so an ACTIVE moderator's upload is refused; a refusal is ok, an upload is VULN
  rec('N05a', up1.error ? 'PASS' : 'VULN', 'an ACTIVE moderator uploads to the avatars bucket (R69 (e), v8a: the staff write policies are dropped)', 'refused', up1.error ? 'error ' + String(up1.error.message).slice(0, 80) : 'UPLOADED')
  await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', M.id), 'block M')
  const path2 = `${M.id}/${RUN}-m2.txt`
  const up2 = await M.client.storage.from('avatars').upload(path2, new Blob(['x']), { contentType: 'text/plain' })
  if (!up2.error) created.storage.push(path2)
  rec('N05b', up2.error ? 'PASS' : 'VULN', 'a BLOCKED moderator uploads to the avatars bucket', 'refused', up2.error ? 'error ' + String(up2.error.message).slice(0, 60) : 'UPLOADED')
  rec('N05c', 'INFO', 'a blocked moderator updates or deletes an avatars object', 'not asserted', 'no control exists: an ACTIVE moderator\'s update and delete already do nothing (no SELECT policy, r9-53-storage-probe.txt), so the change-7 write check is the INSERT of N05b / N05d')
  // a blocked ADMINISTRATOR, one more role (D27): C is the synthetic administrator
  await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', C.id), 'block C (storage)')
  const path3 = `${C.id}/${RUN}-c.txt`
  const up3 = await C.client.storage.from('avatars').upload(path3, new Blob(['x']), { contentType: 'text/plain' })
  if (!up3.error) created.storage.push(path3)
  rec('N05d', up3.error ? 'PASS' : 'VULN', 'a BLOCKED administrator uploads to the avatars bucket', 'refused', up3.error ? 'error ' + String(up3.error.message).slice(0, 60) : 'UPLOADED')
  await must(svc.from('users').update({ status: 'active', block_reason: null, suspended_until: null }).eq('id', C.id), 'unblock C (storage)')

  // N06 realtime (change 4): a notification written after the block is not delivered to the blocked person's subscription
  const R = await makeUser('n06_rt')
  const notify = (title) => svc.from('notifications').insert({ user_id: R.id, type: 'support_reply', title: `${RUN} ${title}`, body: 'x' })
  const live = await realtimeEvent(R, () => notify('before'))
  if (!live.subscribed) rec('N06a', 'INCONCLUSIVE', 'realtime: an active person receives an event for own notification', 'event received', 'could not subscribe within 9 s')
  else allow('N06a', 'realtime: an ACTIVE person receives an event for an own notification (the control)', live.got, `subscribed; event=${live.got}`)
  await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', R.id), 'block R')
  const dead = await realtimeEvent(R, () => notify('after'))
  if (!dead.subscribed) rec('N06b', 'PASS', 'realtime: a BLOCKED person cannot even subscribe to own notifications', 'no event', 'subscription refused or not established')
  else rec('N06b', dead.got ? 'VULN' : 'PASS', 'realtime: a BLOCKED person receives an event for a notification written after the block', 'no event', `subscribed; event=${dead.got}`)

  // N07 / N08 (v7.1, R82 (a), review 23 S1; owner decision D58): NO account restores itself. v7 created caller_access_state() and restore_inactive_account(); v7.1 deletes them. A marked account (10 days and
  // 100 days: status inactive, deleted_at set) with a live session calls each through the Data API: it must answer "function not found" (PostgREST PGRST202, PostgreSQL 42883) and the account must stay marked.
  // A call that works is VULN (the function exists and restores). Any other error proves nothing about the object: INCONCLUSIVE.
  const fnNotFound = (x) => !!x.error && (x.error.code === 'PGRST202' || x.error.code === '42883' || /could not find the function|function .* does not exist/i.test(x.error.message || ''))
  const noSuchFunction = (id, what, x) => rec(id, worked(x) ? 'VULN' : fnNotFound(x) ? 'PASS' : 'INCONCLUSIVE', what, 'function not found (PGRST202 / 42883)', brief(x))
  for (const [id, days] of [['N07', 10], ['N08', 100]]) {
    const K = await makeUser(`${id.toLowerCase()}_mark${days}`)
    await must(svc.from('users').update({ status: 'inactive', deleted_at: new Date(Date.now() - days * DAY).toISOString() }).eq('id', K.id), `mark ${id}`)
    noSuchFunction(`${id}a`, `a marked account (${days} days) calls caller_access_state through the Data API`, await K.client.rpc('caller_access_state'))
    noSuchFunction(`${id}b`, `a marked account (${days} days) calls restore_inactive_account through the Data API`, await K.client.rpc('restore_inactive_account'))
    const kRow = await sget('users', K.id, 'status,deleted_at')
    allow(`${id}c`, `the ${days}-day account is still marked after both calls (untouched)`, kRow.status === 'inactive' && kRow.deleted_at != null, `${kRow.status} ${kRow.deleted_at ? 'deleted_at set' : 'deleted_at null'}`, 'status inactive, deleted_at set')
  }
  // the catalog says the same (a privileged read-only connection, labelled): neither function exists
  try {
    const cat = (await catalogRows(`select to_regprocedure('public.caller_access_state()') is not null as state_fn, to_regprocedure('public.restore_inactive_account()') is not null as restore_fn`))[0]
    rec('N08d', !cat.state_fn && !cat.restore_fn ? 'PASS' : 'VULN', 'the catalog holds neither caller_access_state() nor restore_inactive_account()', 'neither function exists', `caller_access_state ${cat.state_fn ? 'EXISTS' : 'absent'}; restore_inactive_account ${cat.restore_fn ? 'EXISTS' : 'absent'}`)
  } catch (e) { rec('N08d', 'INCONCLUSIVE', 'the catalog holds neither caller_access_state() nor restore_inactive_account()', 'neither function exists', 'catalog read failed: ' + String(e.message).slice(0, 80)) }
}

// ── Revision 14, R58 (c): the view public_user_profiles and the search_path of the SECURITY DEFINER functions ──────────────────────────────────
// PRIVILEGED read-only catalog connection (DATABASE_URL, BEGIN READ ONLY ... ROLLBACK): not a user session, it only reads pg_proc here.
async function catalogRows(sql) {
  const c = await connect()
  try { await c.query('BEGIN READ ONLY'); const r = await c.query(sql); await c.query('ROLLBACK'); return r.rows } finally { await c.end() }
}
async function v5checks({ B }) {
  const seen = (U) => U.client.from('public_user_profiles').select('id,name').eq('id', B.id)   // B is an ordinary active person: the view lists B's public profile to an account with access
  const act = await makeUser('h01_active')
  const ra = await seen(act)
  allow('H01a', 'an ACTIVE account reads the view public_user_profiles (the control)', worked(ra), brief(ra), 'one row (B\'s public profile)')
  const blk = await makeUser('h01_blocked')
  await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', blk.id), 'block h01')
  verdict('H01b', 'a BLOCKED account', 'reads the view public_user_profiles', await seen(blk))
  const del = await makeUser('h01_deleted')
  await must(svc.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', del.id), 'delete mark h01')
  verdict('H01c', 'a DELETED account (deleted_at set), valid token', 'reads the view public_user_profiles', await seen(del))
  const end = await makeUser('h01_ended')
  const tok = (await end.client.auth.getSession()).data.session.access_token
  const so = await svc.auth.admin.signOut(tok, 'global')
  if (so.error) rec('H01d', 'INCONCLUSIVE', 'an account whose SESSION was ended reads the view public_user_profiles', 'refused', 'sign-out failed: ' + so.error.message)
  else verdict('H01d', 'an account whose SESSION was ended (token still unexpired)', 'reads the view public_user_profiles', await seen(end))
  // R61 (v6): the view checks a session and trusts a server role, so the service role (a server role, not a user) must still read it: src/app/admin/listings/[id]/preview/page.tsx:45 reads the view
  // through createAdminClient(). Asserted before and after the apply: the unhardened view answers it, and the v6 condition (current_user not in ('authenticated', 'anon') or caller_is_active())
  // does too. A failure prints its cause.
  const rs = await svc.from('public_user_profiles').select('id').eq('id', B.id)
  allow('H01e', 'the SERVICE ROLE (a server role, not a user) reads the view public_user_profiles', !rs.error && rows(rs) === 1, brief(rs), 'one row (B\'s public profile)')
  // H02: pg_temp is the LAST search_path entry of every SECURITY DEFINER function of public
  let defs
  try { defs = await catalogRows(`select p.oid::regprocedure::text as sig, p.proconfig as config from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef order by 1`) } catch (e) { defs = null; rec('H02', 'INCONCLUSIVE', 'every SECURITY DEFINER function of public has pg_temp as the last search_path entry', 'none without', 'catalog read failed: ' + String(e.message).slice(0, 100)) }
  if (defs) {
    const lastEntry = (cfg) => { const e = (cfg || []).find((x) => /^search_path=/.test(x)); if (!e) return null; const l = e.slice('search_path='.length).split(',').map((s) => s.trim()); return l[l.length - 1] }
    const bad = defs.filter((f) => lastEntry(f.config) !== 'pg_temp')
    rec('H02', bad.length ? 'VULN' : 'PASS', `every SECURITY DEFINER function of public (${defs.length}) has pg_temp as the last search_path entry (privileged catalog read)`, 'none without',
      bad.length ? `${bad.length} without: ${bad.map((f) => f.sig.replace(/\(.*$/, '')).join(', ')}` : 'none without')
  }
}

// ── Revision 14, R59 (d): the deletion design (proposed-account-deletion.sql v2) ──────────────────────────────────────────────────────────────
const sha = (x) => crypto.createHash('sha256').update(String(x)).digest('hex').slice(0, 12)
const SNAP = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/deletion-updated-at-snapshot.json'
// a digest of (id, updated_at) per row of the two tables whose updated_at a backfill could rewrite: no content of any row is read or kept
async function digestUpdatedAt() {
  const out = {}
  for (const t of ['email_templates', 'support_tickets']) {
    const rowsOf = {}
    for (let from = 0; ; from += 1000) {
      const r = await svc.from(t).select('id,updated_at').order('id').range(from, from + 999)
      if (r.error) throw new Error(`snapshot ${t}: ${r.error.message}`)
      for (const x of r.data) rowsOf[sha(x.id)] = sha(x.updated_at)
      if (r.data.length < 1000) break
    }
    out[t] = rowsOf
  }
  return out
}
async function snapshotMode() {
  const d = await digestUpdatedAt()
  const counts = Object.fromEntries(Object.entries(d).map(([t, r]) => [t, Object.keys(r).length]))
  fs.writeFileSync(SNAP, JSON.stringify({ takenAt: new Date().toISOString(), counts, rows: d }))
  console.log(`snapshot written (digests only): ${JSON.stringify(counts)}`)
}
async function deletionChecks({ B }) {
  const probe = await svc.from('pages').select('updated_by_name').limit(1)
  const applied = !probe.error
  rec('DX00', 'INFO', 'the deletion design is applied (pages.updated_by_name exists)', 'no before the SQL is applied, yes after', applied ? 'yes' : `no (${brief(probe)})`)
  const track = (table, id) => { if (id) created.rows.push({ table, id }) }
  const removeUser = async (U) => { const r = await svc.auth.admin.deleteUser(U.id); if (!r.error) created.users.delete(U.id); return r }   // a user the test deleted is not deleted again by the clean-up
  const nameOf = async (U) => { const u = await sget('users', U.id, 'name,last_name'); return [u.name, u.last_name].filter((x) => x != null && x !== '').join(' ').trim() }
  const check = (id, ok, what, expected, observed) => rec(id, ok ? 'PASS' : 'VULN', what, expected, observed)
  const first = (r) => (r && r.data && r.data[0]) || null

  // DX01: the backfill leaves updated_at of email_templates and support_tickets alone (R59 (a)). Needs the snapshot taken BEFORE the apply (--snapshot-updated-at).
  const dx01 = 'the backfill leaves updated_at of email_templates and support_tickets alone'
  if (!applied) check('DX01', false, dx01, 'no row changed since the snapshot taken before the apply', 'the deletion SQL is not applied: updated_by_name does not exist, so the backfill has not run')
  else if (!fs.existsSync(SNAP)) rec('DX01', 'INCONCLUSIVE', dx01, 'no row changed since the snapshot taken before the apply', 'no snapshot file: run --snapshot-updated-at BEFORE the apply')
  else {
    const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8')); const now = await digestUpdatedAt()
    let changed = 0, compared = 0
    for (const t of Object.keys(snap.rows)) for (const [k, v] of Object.entries(snap.rows[t])) if (k in (now[t] || {})) { compared++; if (now[t][k] !== v) changed++ }
    check('DX01', changed === 0, dx01, 'no row changed since the snapshot taken before the apply', `${changed} of ${compared} compared rows changed (snapshot ${snap.takenAt})`)
  }

  // DX02: the name is the trigger's alone (R59 (b)), on `pages` (updated_by / updated_by_name)
  const S1 = await makeUser('dx02_s1'); const S2 = await makeUser('dx02_s2')
  const n1 = await nameOf(S1), n2 = await nameOf(S2)
  const page = async (tag, extra) => { const r = await svc.from('pages').insert({ title: `${RUN} ${tag}`, slug: `${RUN}-${tag}`, ...extra }).select('id,updated_by,updated_by_name'); track('pages', first(r) && first(r).id); return r }
  const shown = (v, mine) => (v === mine ? 'the trigger\'s name' : JSON.stringify(v))
  const r1 = await page('dx02a', { updated_by: S1.id, updated_by_name: 'Forged' })
  const row1 = first(r1)
  check('DX02a', !!row1 && row1.updated_by_name === n1, 'INSERT with an id and a supplied name', 'the trigger\'s name (from the id)', row1 ? shown(row1.updated_by_name, n1) : brief(r1))
  const r2 = await page('dx02b', { updated_by: null, updated_by_name: 'Forged' })
  check('DX02b', !!first(r2) && first(r2).updated_by_name === null, 'INSERT with a null id and a supplied name', 'null', first(r2) ? JSON.stringify(first(r2).updated_by_name) : brief(r2))
  const upd = (patch) => svc.from('pages').update(patch).eq('id', row1.id).select('updated_by,updated_by_name')
  if (!row1) for (const [id, what] of [['DX02c', 'UPDATE of the name alone (id unchanged)'], ['DX02d', 'UPDATE changing the id to another person with a supplied name'], ['DX02e', 'UPDATE making the id null (the SET NULL of a deletion)']]) check(id, false, what, 'see the expectation of DX02a-b', 'no row: the INSERT of DX02a failed')
  else {
    let u = await upd({ updated_by_name: 'Forged2' })
    check('DX02c', !!first(u) && first(u).updated_by_name === n1, 'UPDATE of the name alone (id unchanged)', 'the old name stays', first(u) ? shown(first(u).updated_by_name, n1) : brief(u))
    u = await upd({ updated_by: S2.id, updated_by_name: 'Forged3' })
    check('DX02d', !!first(u) && first(u).updated_by_name === n2, 'UPDATE changing the id to another person with a supplied name', 'recomputed from the new id', first(u) ? shown(first(u).updated_by_name, n2) : brief(u))
    u = await upd({ updated_by: null })
    check('DX02e', !!first(u) && first(u).updated_by === null && first(u).updated_by_name === n2, 'UPDATE making the id null (the SET NULL of a deletion)', 'the old name stays', first(u) ? shown(first(u).updated_by_name, n2) : brief(u))
  }

  // DX03: a staff account that has acted is deleted; its rows keep the name with a null id (R59 / R43 (b))
  const T = await makeUser('dx03_target'); const S3 = await makeUser('dx03_staff')
  const n3 = await nameOf(S3)
  const pg3 = await page('dx03p', { updated_by: S3.id })                       // pages.updated_by is SET NULL already
  const sh3 = await svc.from('user_status_history').insert({ user_id: T.id, new_status: 'active', changed_by: S3.id }).select('id')   // changed_by is NO ACTION today: it blocks the deletion
  track('user_status_history', first(sh3) && first(sh3).id)
  const del3 = await removeUser(S3)
  check('DX03a', !del3.error, 'a staff account that has acted (a status-history row names it) is deleted', 'the deletion succeeds', del3.error ? 'blocked: ' + String(del3.error.message).slice(0, 80) : 'deleted')
  const pAfter = first(pg3) ? await svc.from('pages').select('updated_by,updated_by_name').eq('id', first(pg3).id) : null
  check('DX03b', !!pAfter && !pAfter.error && !!first(pAfter) && first(pAfter).updated_by === null && first(pAfter).updated_by_name === n3, 'pages row of the deleted staff account keeps the name with a null id', 'updated_by null, updated_by_name = the person\'s name',
    pAfter ? (pAfter.error ? brief(pAfter) : first(pAfter) ? `updated_by ${first(pAfter).updated_by === null ? 'null' : 'still set'}, name ${shown(first(pAfter).updated_by_name, n3)}` : 'row gone') : 'the row was not created')
  const hAfter = first(sh3) ? await svc.from('user_status_history').select('changed_by,changed_by_name').eq('id', first(sh3).id) : null
  check('DX03c', !!hAfter && !hAfter.error && !!first(hAfter) && first(hAfter).changed_by === null && first(hAfter).changed_by_name === n3, 'user_status_history row (NO ACTION today) of the deleted staff account keeps the name with a null id', 'changed_by null, changed_by_name = the person\'s name',
    hAfter ? (hAfter.error ? brief(hAfter) : first(hAfter) ? `changed_by ${first(hAfter).changed_by === null ? 'null' : 'still set'}, name ${shown(first(hAfter).changed_by_name, n3)}` : 'row gone') : 'the row was not created')

  // DX03d (R62 (c)): the same for a key to AUTH.USERS (email_templates.updated_by, NO ACTION today): its SET NULL fires beside the cascade to the profile row, and the name must stay
  const S4 = await makeUser('dx03d_staff')
  const n4 = await nameOf(S4)
  const et = await svc.from('email_templates').insert({ key: `${RUN}_dx03d`, locale: 'sq', updated_by: S4.id }).select('id')
  track('email_templates', first(et) && first(et).id)
  if (!first(et)) for (const [id, what] of [['DX03d1', 'a staff account named by a key to auth.users is deleted'], ['DX03d2', 'the email_templates row keeps the name with a null id']]) rec(id, 'INCONCLUSIVE', what, 'see the expectation of DX03d', 'no synthetic email_templates row could be created: ' + brief(et))
  else {
    const del4 = await removeUser(S4)
    check('DX03d1', !del4.error, 'a staff account named by a key to auth.users (email_templates.updated_by, NO ACTION today) is deleted', 'the deletion succeeds', del4.error ? 'blocked: ' + String(del4.error.message).slice(0, 80) : 'deleted')
    const eAfter = await svc.from('email_templates').select('updated_by,updated_by_name').eq('id', first(et).id)
    check('DX03d2', !eAfter.error && !!first(eAfter) && first(eAfter).updated_by === null && first(eAfter).updated_by_name === n4, 'email_templates row (key to auth.users) of the deleted staff account keeps the name with a null id', 'updated_by null, updated_by_name = the person\'s name',
      eAfter.error ? brief(eAfter) : first(eAfter) ? `updated_by ${first(eAfter).updated_by === null ? 'null' : 'still set'}, name ${shown(first(eAfter).updated_by_name, n4)}` : 'row gone')
  }

  // DX04: a person's views go with the account and the counts drop by one per view, never below 0 (R43 (b) 2)
  const L1 = await makeListing(B.id, 'active', 'dx04_l1')
  const V1 = await makeUser('dx04_v1'); const V2 = await makeUser('dx04_v2')
  await svc.rpc('record_listing_view', { p_listing_id: L1.id, p_user_id: V1.id, p_ip_hash: '' })
  await svc.rpc('record_listing_view', { p_listing_id: L1.id, p_user_id: V2.id, p_ip_hash: '' })
  const c0 = (await sget('listings', L1.id, 'views_count')).views_count
  if (c0 !== 2) for (const id of ['DX04a', 'DX04b']) rec(id, 'INCONCLUSIVE', 'a person\'s views go and the count drops by one per view', 'views_count 2 before the deletion (control)', `views_count ${c0} before the deletion`)
  else {
    const d1 = await removeUser(V1)
    const led = await svc.from('listing_views').select('user_id').eq('listing_id', L1.id)
    const c1 = (await sget('listings', L1.id, 'views_count')).views_count
    check('DX04a', !d1.error && c1 === 1, 'the count drops by one when one of two viewers is deleted', 'views_count 2 -> 1', `${d1.error ? 'deletion blocked: ' + String(d1.error.message).slice(0, 60) + '; ' : ''}views_count 2 -> ${c1}`)
    const ids = (led.data || []).map((x) => x.user_id)
    check('DX04b', !led.error && ids.length === 1 && ids[0] === V2.id, 'the deleted viewer\'s ledger row goes, the other viewer\'s stays', 'one row, of the other viewer', led.error ? brief(led) : `${ids.length} row(s)${ids.includes(null) ? ', one with a null user id' : ''}`)
  }
  const L2 = await makeListing(B.id, 'active', 'dx04_l2')                     // views_count 0 with one ledger row: the count must stay at 0, not -1
  const V3 = await makeUser('dx04_v3')
  const ins3 = await svc.from('listing_views').insert({ listing_id: L2.id, user_id: V3.id, ip_hash: `${RUN}-dx04` }).select('id')
  track('listing_views', first(ins3) && first(ins3).id)
  const d3 = await removeUser(V3)
  const led3 = await svc.from('listing_views').select('id').eq('listing_id', L2.id)
  const c3 = (await sget('listings', L2.id, 'views_count')).views_count
  check('DX04c', !ins3.error && !d3.error && !led3.error && (led3.data || []).length === 0 && c3 === 0, 'a viewer\'s row goes and views_count never drops below 0', 'row gone, views_count 0',
    `${ins3.error ? 'insert ' + brief(ins3) + '; ' : ''}${d3.error ? 'deletion blocked; ' : ''}rows ${(led3.data || []).length}, views_count ${c3}`)

  // DX05: deleting a company's creator deletes the company; its agents keep company_id null (D31)
  const C0 = await makeUser('dx05_creator'); const G1 = await makeUser('dx05_ag1'); const G2 = await makeUser('dx05_ag2')
  const co = await svc.from('companies').insert({ name: `${RUN} dx05`, created_by: C0.id }).select('id')
  const coId = first(co) && first(co).id
  track('companies', coId)
  const dx05 = [['DX05a', 'deleting a company\'s creator succeeds', 'the deletion succeeds'], ['DX05b', 'the company goes with its creator', 'no company row'], ['DX05c', 'the agents of the company keep company_id null', 'both agents with company_id null']]
  if (!coId) for (const [id, what, exp] of dx05) check(id, false, what, exp, 'no company with a creator can be recorded: ' + brief(co))
  else {
    await svc.from('users').update({ company_id: coId }).in('id', [G1.id, G2.id])
    const dc = await removeUser(C0)
    const coAfter = await svc.from('companies').select('id').eq('id', coId)
    const agAfter = await svc.from('users').select('id,company_id').in('id', [G1.id, G2.id])
    check('DX05a', !dc.error, dx05[0][1], dx05[0][2], dc.error ? 'blocked: ' + String(dc.error.message).slice(0, 80) : 'deleted')
    check('DX05b', !coAfter.error && (coAfter.data || []).length === 0, dx05[1][1], dx05[1][2], coAfter.error ? brief(coAfter) : `${(coAfter.data || []).length} row(s)`)
    check('DX05c', !agAfter.error && (agAfter.data || []).length === 2 && agAfter.data.every((x) => x.company_id === null), dx05[2][1], dx05[2][2], agAfter.error ? brief(agAfter) : `company_id ${JSON.stringify((agAfter.data || []).map((x) => (x.company_id === null ? null : 'set')))}`)
  }

  // DX06 (R62 (b)): no name in public. anon and a signed-in session may not read updated_by_name of pages and site_footer; the public columns stay readable.
  const anonClient = mkAnon()
  const refusal = 'refused by a privilege (error 42501), no value returned'
  for (const [id, who, client, table] of [['DX06a', 'anon', anonClient, 'pages'], ['DX06b', 'a signed-in session', B.client, 'pages'], ['DX06c', 'anon', anonClient, 'site_footer'], ['DX06d', 'a signed-in session', B.client, 'site_footer']]) {
    const what = `${who} reads updated_by_name of ${table}`
    if (!applied) { rec(id, 'VULN', what, refusal, 'the deletion SQL is not applied: updated_by_name does not exist, so no privilege protects it (the first run after the apply asserts it)'); continue }
    const r = await client.from(table).select('updated_by_name').limit(1)
    if (!r.error) rec(id, 'VULN', what, refusal, brief(r))
    else if (r.error.code === '42501') rec(id, 'PASS', what, refusal, brief(r))
    else rec(id, 'INCONCLUSIVE', what, refusal, brief(r))
  }
  const pub = await svc.from('pages').insert({ title: `${RUN} dx06`, slug: `${RUN}-dx06`, is_published: true }).select('id')
  track('pages', first(pub) && first(pub).id)
  for (const [id, who, client] of [['DX06e', 'anon', anonClient], ['DX06f', 'a signed-in session', B.client]]) {
    const r = await client.from('pages').select('id,title,slug,content,is_published').eq('slug', `${RUN}-dx06`)
    allow(id, `${who} reads id, title, slug, content and is_published of a published page`, worked(r), first(pub) ? brief(r) : 'the synthetic published page could not be created: ' + brief(pub))
  }
  const ft = await anonClient.from('site_footer').select('locale,brand_title').limit(1)
  allow('DX06g', 'anon reads the public footer columns (locale, brand_title)', worked(ft), brief(ft))
}

// ── Revision 16 (kickoff sections 27-29): hardening v7 — R63 (created_at, public_id), R64 (the database owns the old price), R65 (owner contact, slug, end_user_sessions, set_default_currency) ──────
// Each check is VULN / BROKEN with its cause on a database WITHOUT v7 and asserts the protection (or the working control) on a database WITH it. Checks that need an object of v7 look for it first
// (a privileged read-only catalog read) so that a missing function never counts as a refusal.
async function v7checks({ A, B, LBa, LAp }) {
  const check = (id, ok, what, expected, observed) => rec(id, ok ? 'PASS' : 'VULN', what, expected, observed)
  const probe = await svc.from('listings').select('price_initial').limit(1)
  const priceApplied = !probe.error
  const have = async (sig) => { try { return (await catalogRows(`select to_regprocedure('${sig}') is not null as ok`))[0].ok } catch { return null } }
  const notApplied = (what) => `v7 is not applied: ${what}`

  // ── R63: created_at and public_id ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const created0 = (await sget('listings', LAp.id, 'created_at')).created_at
  await fieldTest('V701', 'listings', A, LAp.id, { created_at: '2000-01-01T00:00:00Z' }, 'created_at', { created_at: created0 })
  const body = (slug, extra = {}) => ({ user_id: A.id, slug, title: `${RUN} ${slug}`, price: 1, listing_type: 'sale', property_type: 'apartment', status: 'pending', expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), views_count: 0, ...extra })
  const ins = async (slug, extra) => { const r = await A.client.from('listings').insert(body(slug, extra)).select('id,created_at,public_id,slug'); if (r.data && r.data[0]) created.listings.add(r.data[0].id); return r }
  let r = await ins(`${SLUG}-v702`, { created_at: new Date(Date.now() + 3650 * 864e5).toISOString() })
  rec('V702', !r.error && rows(r) > 0 ? 'VULN' : 'PASS', 'A inserts a listing whose created_at lies ten years in the future (to sit at the top of the catalogue)', 'refused', brief(r))
  const wanted = 9000000000000 + Math.floor(Math.random() * 1e6)
  r = await ins(`${SLUG}-v703`, { public_id: wanted })
  if (r.error) rec('V703', 'INCONCLUSIVE', 'A inserts a listing that supplies its own public_id', 'stored with a DIFFERENT public_id (or refused)', brief(r))
  else rec('V703', rows(r) === 1 && Number(r.data[0].public_id) === wanted ? 'VULN' : 'PASS', 'A inserts a listing that supplies its own public_id (a number far ahead of the sequence)', 'stored with a different public_id', `public_id stored ${rows(r) === 1 ? (Number(r.data[0].public_id) === wanted ? 'AS SUPPLIED' : 'differs from the supplied one') : 'n/a'}`)
  r = await ins(`${SLUG}-v704`)
  allow('V704', 'A inserts a listing exactly as createListing sends it (no created_at, no public_id) with a plain slug', !r.error && rows(r) === 1 && Number(r.data[0].public_id) > 0, brief(r))
  r = await ins(`${SLUG}-v705-Bad Slug!`)
  rec('V705', !r.error && rows(r) > 0 ? 'VULN' : 'PASS', 'A inserts a listing whose slug has a capital letter, a space and a punctuation mark', 'refused', brief(r))
  const slug0 = (await sget('listings', LAp.id, 'slug')).slug
  await fieldTest('V706', 'listings', A, LAp.id, { slug: `${SLUG}-v706-changed` }, 'slug', { slug: slug0 })
  // INFO, not asserted (R65 (b)): the slug createListing makes for a title with a hyphen next to spaces. Today it is accepted; with v7 it is refused (two hyphens in a row). r16-06-slug-probe.txt.
  r = await ins(`${SLUG}-shitet-apartament---21-mvgd5s3f`)
  rec('V707', 'INFO', 'A inserts a listing with the slug generateSlug makes for "Shitet apartament - 2+1" (two hyphens in a row)', 'not asserted: the kickoff rule refuses it, createListing makes it (Opus decides)', brief(r))

  // ── R64: the database owns the old price ──────────────────────────────────────────────────────────────────────────────────────────────────
  const mk = async (tag, price, currency = 'ALL') => { const x = await svc.from('listings').insert({ user_id: B.id, slug: `${RUN}-${tag}`, title: `${RUN} ${tag}`, price, currency, listing_type: 'sale', property_type: 'apartment', status: 'pending' }).select('id'); if (x.data && x.data[0]) created.listings.add(x.data[0].id); return x.data && x.data[0] ? x.data[0].id : null }
  const state = async (id) => { const x = await svc.from('listings').select('price,price_old,price_initial,currency').eq('id', id).maybeSingle(); return x.error ? { error: x.error } : x.data }
  const num = (v) => (v === null || v === undefined ? null : Number(v))
  const step = async (id, patch, whoClient = svc) => whoClient.from('listings').update(patch).eq('id', id).select('price,price_old,price_initial,currency')
  const expectState = (rid, what, s, initial, old) => check(rid, !!s && !s.error && num(s.price_initial) === initial && num(s.price_old) === old, what, `price_initial ${initial}, price_old ${old === null ? 'null' : old}`,
    !s ? 'no row' : s.error ? brief({ error: s.error }) : `price ${num(s.price)}, price_initial ${num(s.price_initial)}, price_old ${num(s.price_old)}`)
  const R64 = [['V710', 'a new listing at 100: price_initial 100, no old price'], ['V711', '100 -> 80: price_old is the starting price, 100'], ['V712', '80 -> 120: no old price'], ['V713', '120 -> 110: no old price (110 is above the start)'], ['V714', '110 -> 90: price_old 100 again'],
    ['V715', 'the owner\'s example 100 -> 120 -> 99: price_old 100 (today\'s rule would store 120)'], ['V716', 'a session owner patches price_old and price_initial directly: the trigger\'s values stay'], ['V717', 'a session owner (not service_role) lowers the price 100 -> 70: price_old 100'],
    ['V718', 'a currency change ALL -> EUR at a new price 50 (BLOCKED, the database cannot convert; the draft\'s fail-safe): the new price is the new start, no old price']]
  if (!priceApplied) for (const [id, what] of R64) check(id, false, what, 'see the expectation of its sequence', notApplied(`listings.price_initial does not exist (${brief(probe)}), so no trigger owns price_old`))
  else {
    const a = await mk('v710', 100)
    expectState('V710', R64[0][1], a && await state(a), 100, null)
    await step(a, { price: 80 }); expectState('V711', R64[1][1], await state(a), 100, 100)
    await step(a, { price: 120 }); expectState('V712', R64[2][1], await state(a), 100, null)
    await step(a, { price: 110 }); expectState('V713', R64[3][1], await state(a), 100, null)
    await step(a, { price: 90 }); expectState('V714', R64[4][1], await state(a), 100, 100)
    const b = await mk('v715', 100)
    await step(b, { price: 120 }); await step(b, { price: 99 }); expectState('V715', R64[5][1], await state(b), 100, 100)
    const c = await mk('v716', 100)
    await svc.from('listings').update({ user_id: A.id }).eq('id', c)                                   // the listing of the signed-in owner A (service role may change the owner; the trigger does not look at it)
    await step(c, { price_old: 999, price_initial: 5 }, A.client); expectState('V716', R64[6][1], await state(c), 100, null)
    await step(c, { price: 70 }, A.client); expectState('V717', R64[7][1], await state(c), 100, 100)
    const d = await mk('v718', 100)
    await step(d, { currency: 'EUR', price: 50 })
    const sd = await state(d)
    check('V718', !!sd && !sd.error && sd.currency === 'EUR' && num(sd.price_initial) === 50 && num(sd.price_old) === null, R64[8][1], 'currency EUR, price_initial 50, price_old null', sd && !sd.error ? `currency ${sd.currency}, price_initial ${num(sd.price_initial)}, price_old ${num(sd.price_old)}` : 'no row')
  }

  // ── R65 (a): the owner contact only for an ACTIVE listing ──────────────────────────────────────────────────────────────────────────────
  const contact = (id) => A.client.rpc('get_listing_owner_contact', { listing_id_param: id })
  r = await contact(LBa.id)
  allow('V720', 'A (active) asks the owner contact of an ACTIVE listing', worked(r), brief(r), 'one row')
  for (const [id, status] of [['V721', 'sold'], ['V722', 'rented'], ['V723', 'archived']]) {
    const L = await makeListing(B.id, status, `${id.toLowerCase()}_${status}`)
    r = await contact(L.id)
    rec(id, !r.error && rows(r) > 0 ? 'VULN' : 'PASS', `A (active) asks the owner contact of a ${status.toUpperCase()} listing (owner decision F2: contact is locked)`, 'no row', brief(r))
  }
  // V724 / V725 (v7.1, review 23 S3, owner decision D49): v7 created an unset per-person quota (a table and a function); v7.1 creates neither, and its preflight refuses a database that has either
  try {
    const q = (await catalogRows(`select to_regclass('public.owner_contact_access') is not null as t, to_regprocedure('public.owner_contact_daily_limit()') is not null as f`))[0]
    rec('V724', !q.t ? 'PASS' : 'VULN', 'to_regclass(\'public.owner_contact_access\') is null: the quota table does not exist', 'null', q.t ? 'the table EXISTS' : 'null')
    rec('V725', !q.f ? 'PASS' : 'VULN', 'the quota function public.owner_contact_daily_limit() does not exist', 'absent', q.f ? 'the function EXISTS' : 'absent')
  } catch (e) {
    for (const id of ['V724', 'V725']) rec(id, 'INCONCLUSIVE', 'the quota table and function do not exist (catalog read)', 'absent', 'catalog read failed: ' + String(e.message).slice(0, 80))
  }

  // ── R65 (c): end_user_sessions ─────────────────────────────────────────────────────────────────────────────────────────────────────────
  const hasEnd = await have('public.end_user_sessions(uuid)')
  const endWhat = (who) => `${who} calls public.end_user_sessions`
  if (hasEnd !== true) {
    for (const [id, who] of [['V730', 'anon'], ['V731', 'a signed-in session']]) rec(id, hasEnd === null ? 'INCONCLUSIVE' : 'VULN', endWhat(who), 'permission denied (42501)', notApplied('public.end_user_sessions does not exist, so no grant refuses the call'))
    rec('V732', hasEnd === null ? 'INCONCLUSIVE' : 'BROKEN', 'service_role ends every session of a synthetic user', 'the user\'s auth.sessions rows go and the count is returned', notApplied('public.end_user_sessions does not exist'))
  } else {
    const an = mkAnon()
    for (const [id, who, client] of [['V730', 'anon', an], ['V731', 'a signed-in session', A.client]]) {
      const x = await client.rpc('end_user_sessions', { p_user: A.id })
      rec(id, !x.error ? 'VULN' : x.error.code === '42501' ? 'PASS' : 'INCONCLUSIVE', endWhat(who), 'permission denied (42501)', brief(x))
    }
    const T = await makeUser('v732_target')
    const sessions = async () => (await catalogRows(`select count(*)::int as n from auth.sessions where user_id = '${T.id}'`))[0].n
    const before = await sessions()
    const x = await svc.rpc('end_user_sessions', { p_user: T.id })
    const after = await sessions()
    allow('V732', 'service_role ends every session of a synthetic user', before >= 1 && !x.error && Number(x.data) === before && after === 0, `sessions ${before} -> ${after}; returned ${x.error ? brief(x) : x.data}`, 'the rows go and the count is returned')
  }

  // ── R65 (d): set_default_currency, on a privileged connection inside a transaction that is ALWAYS rolled back (the real currencies rows are never changed) ──
  const hasCur = await have('public.set_default_currency(integer)')
  if (hasCur !== true) {
    for (const [id, who] of [['V740', 'anon'], ['V741', 'authenticated']]) rec(id, hasCur === null ? 'INCONCLUSIVE' : 'VULN', `${who} calls public.set_default_currency`, 'permission denied (42501)', notApplied('public.set_default_currency does not exist, so no grant refuses the call'))
    for (const [id, what] of [['V742', 'service_role: a missing currency is refused (22023)'], ['V743', 'service_role: an inactive currency is refused (22023)'], ['V744', 'service_role: an active currency becomes the one default']]) rec(id, hasCur === null ? 'INCONCLUSIVE' : 'BROKEN', what, 'as stated', notApplied('public.set_default_currency does not exist'))
  } else {
    const c = await connect()
    try {
      await c.query('BEGIN')
      await c.query('set local search_path = public, pg_temp')
      const as = async (role, sql, params) => { await c.query('SAVEPOINT s'); try { await c.query(`set local role ${role}`); const x = await c.query(sql, params); await c.query('RESET ROLE'); await c.query('RELEASE SAVEPOINT s'); return { ok: true, rows: x.rows } } catch (e) { await c.query('ROLLBACK TO SAVEPOINT s'); await c.query('RESET ROLE'); return { ok: false, code: e.code, message: String(e.message) } } }
      const eur = (await c.query(`select id from public.currencies where code = 'EUR'`)).rows[0]
      for (const [id, role] of [['V740', 'anon'], ['V741', 'authenticated']]) { const x = await as(role, `select public.set_default_currency($1::integer)`, [eur.id]); rec(id, x.ok ? 'VULN' : x.code === '42501' ? 'PASS' : 'INCONCLUSIVE', `${role} calls public.set_default_currency`, 'permission denied (42501)', x.ok ? 'worked' : `error ${x.code} ${x.message.slice(0, 80)}`) }
      let x = await as('service_role', `select public.set_default_currency(2147000000)`)
      check('V742', !x.ok && x.code === '22023', 'service_role: a missing currency is refused (22023)', 'error 22023', x.ok ? 'worked' : `error ${x.code}`)
      const ins2 = await c.query(`insert into public.currencies (code, symbol, is_active, is_default) values ('ZZ${Date.now().toString(36).slice(-2).toUpperCase()}', 'z', false, false) returning id`)
      x = await as('service_role', `select public.set_default_currency($1::integer)`, [ins2.rows[0].id])
      check('V743', !x.ok && x.code === '22023', 'service_role: an inactive currency (a row made inside the rolled-back transaction) is refused (22023)', 'error 22023', x.ok ? 'worked' : `error ${x.code}`)
      x = await as('service_role', `select public.set_default_currency($1::integer)`, [eur.id])
      const defaults = (await c.query(`select code from public.currencies where is_default order by code`)).rows.map((y) => y.code)
      allow('V744', 'service_role: an active currency (EUR) becomes the one default', x.ok && defaults.length === 1 && defaults[0] === 'EUR', `defaults after the call: ${defaults.join(',') || 'none'}${x.ok ? '' : '; error ' + x.code + ' ' + x.message.slice(0, 60)}`, 'exactly one default, EUR')
    } catch (e) {
      rec('V74E', 'INCONCLUSIVE', 'the set_default_currency checks ran to the end', 'no error', String(e.message).slice(0, 120))
    } finally {
      try { await c.query('ROLLBACK') } catch { /* nothing was committed */ }
      await c.end()
    }
  }
}

/** R81 (b): public.reauth_failures, the per-person count of wrong passwords of re-authentication (hardening v7, change 16) */
async function reauthFailuresChecks({ A }) {
  let exists = null
  try { exists = (await catalogRows("select to_regclass('public.reauth_failures') is not null as ok"))[0].ok } catch { exists = null }
  const notApplied = 'v7 is not applied: public.reauth_failures does not exist, so no grant refuses the call'
  if (exists !== true) {
    const state = exists === null ? 'INCONCLUSIVE' : 'VULN'
    rec('V750', state, 'anon selects, inserts and deletes public.reauth_failures', 'permission denied (42501) for each', notApplied)
    rec('V751', state, 'a signed-in session selects, inserts and deletes public.reauth_failures', 'permission denied (42501) for each', notApplied)
    rec('V752', exists === null ? 'INCONCLUSIVE' : 'BROKEN', 'service_role inserts the failure rows of a synthetic person and counts them', 'two rows are written and counted', notApplied)
    rec('V753', state, 'the grantees of the REAL public.reauth_failures are the table owner and service_role only (no PUBLIC, anon or authenticated; no column grant)', 'owner + service_role', notApplied)
    return
  }
  const anon = mkAnon()
  for (const [id, who, client] of [['V750', 'anon', anon], ['V751', 'a signed-in session', A.client]]) {
    const answers = [
      await client.from('reauth_failures').select('id').limit(1),
      await client.from('reauth_failures').insert({ user_id: A.id }),
      await client.from('reauth_failures').delete().eq('user_id', A.id),
    ]
    rec(id, answers.every((x) => x.error && x.error.code === '42501') ? 'PASS' : 'VULN', who + ' selects, inserts and deletes public.reauth_failures', 'permission denied (42501) for each', answers.map(brief).join(' | '))
  }
  const written = await svc.from('reauth_failures').insert([{ user_id: A.id }, { user_id: A.id }])
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const counted = await svc.from('reauth_failures').select('id', { count: 'exact', head: true }).eq('user_id', A.id).gte('created_at', since)
  const removed = await svc.from('reauth_failures').delete().eq('user_id', A.id)
  allow('V752', 'service_role inserts the failure rows of a synthetic person and counts them', !written.error && !counted.error && counted.count === 2 && !removed.error,
    'insert ' + (written.error ? brief(written) : 'ok') + '; count ' + (counted.error ? brief(counted) : counted.count) + '; clean-up ' + (removed.error ? brief(removed) : 'ok'), 'two rows are written and counted')
  // V753 (v7.1, review 23 S5): the grantees of the REAL table. The logic run proves the grants on a TEMPORARY table, which gets no default privileges, so it says nothing about what Supabase's default privileges
  // gave service_role here; this reads the real ACL (a privileged read-only catalog connection, labelled) and the column ACLs. Only the table owner and service_role may hold a privilege.
  try {
    const acl = await catalogRows(`select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as grantee, a.privilege_type as priv
      from pg_class c, aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a where c.oid = 'public.reauth_failures'::regclass`)
    const owner = (await catalogRows(`select c.relowner::regrole::text as o from pg_class c where c.oid = 'public.reauth_failures'::regclass`))[0].o
    const colGrants = (await catalogRows(`select count(*)::int as n from pg_attribute a where a.attrelid = 'public.reauth_failures'::regclass and a.attacl is not null`))[0].n
    const grantees = [...new Set(acl.map((x) => x.grantee))].sort()
    const svcPrivs = acl.filter((x) => x.grantee === 'service_role').map((x) => x.priv).sort().join(',')
    rec('V753', grantees.every((g) => g === owner || g === 'service_role') && grantees.includes('service_role') && colGrants === 0 ? 'PASS' : 'VULN',
      'the grantees of the REAL public.reauth_failures are the table owner and service_role only (no PUBLIC, anon or authenticated; no column grant)', 'owner + service_role',
      `grantees ${grantees.join(',')}; service_role privileges ${svcPrivs || 'none'}; column grants ${colGrants}`)
  } catch (e) { rec('V753', 'INCONCLUSIVE', 'the grantees of the REAL public.reauth_failures are the table owner and service_role only', 'owner + service_role', 'catalog read failed: ' + String(e.message).slice(0, 80)) }
}

// ── Revision 25 (kickoff section 47, R97): hardening v8a, rows V801-V825 ────────────────────────────────────────────────────────────────────────
// v8a (proposed-hardening-v8a.sql) was written and NOT applied when this section was added. Each row states what the database must do AFTER the apply. While public.get_listing_owner_contact_as(uuid, uuid)
// does not exist, a row that fails is VULN (a protection is missing) or BROKEN (a working control is missing) and its note says "v8a is not applied: <what is missing>"; after the apply every row is ok.
// Rows that are ok BEFORE the apply because the live database already satisfies them are regression guards for the apply: V813 (the owner reads their own listings and photos) and V819 / V820
// (a session gets 42501 on role_permissions for lack of a grant; the four dropped policies are asserted separately by V817).
// Fixtures: one synthetic listing of B per status (sold, rented, archived, pending, inactive, expired), each with one photo. service_role prepares them; the photo rows go with their listing (ON DELETE CASCADE).
// A is an active account that does not own them ("a signed-in session"); B is their owner. Photo addresses carry the project's Cloudinary prefix so that they stay valid after R69 (c); nothing is sent to Cloudinary.
async function v8checks({ A, B, LBa, LAp }) {
  const IMG = 'https://res.cloudinary.com/die7okukn/image/upload/'
  const KEYS8 = ['users.edit', 'users.verify', 'support.manage', 'inquiries.manage', 'catalog.manage', 'email_templates.manage', 'companies.manage', 'listings.moderate']   // src/lib/auth/permissionKeys.ts:17-24
  const FN = 'get_listing_owner_contact_as'
  let applied = null
  try { applied = (await catalogRows(`select to_regprocedure('public.${FN}(uuid,uuid)') is not null as ok`))[0].ok } catch { applied = null }
  const why = (what) => `v8a is not applied: ${what}`
  // kind: 'allow' (a working control; failing is BROKEN) or 'deny' (a protection; failing is VULN). reason null: a regression guard, never blamed on the apply.
  const outcome = (id, kind, ok, what, expected, observed, reason) => {
    if (ok) return rec(id, 'PASS', what, expected, observed)
    if (reason && applied === null) return rec(id, 'INCONCLUSIVE', what, expected, observed, 'could not tell whether v8a is applied (catalog read failed)')
    return rec(id, kind === 'allow' ? 'BROKEN' : 'VULN', what, expected, observed, reason && applied === false ? why(reason) : '')
  }
  const an = mkAnon()

  // fixtures
  const fx = {}
  for (const status of ['sold', 'rented', 'archived', 'pending', 'inactive', 'expired']) {
    const L = await makeListing(B.id, status, `v8_${status}`)
    const im = await svc.from('listing_images').insert({ listing_id: L.id, url: `${IMG}${RUN}_${status}.jpg` }).select('id')
    if (im.error) throw new Error(`prepare photo ${status}: ${im.error.message}`)
    fx[status] = L.id
  }
  const seen = async (client, id) => {
    const l = await client.from('listings').select('id').eq('id', id)
    const p = await client.from('listing_images').select('id').eq('listing_id', id)
    return { l, p, nl: l.error ? -1 : rows(l), np: p.error ? -1 : rows(p) }
  }
  const show = (s) => `listing ${s.l.error ? brief(s.l) : s.nl + ' row(s)'}; photo ${s.p.error ? brief(s.p) : s.np + ' row(s)'}`
  const actors = [['a guest', an], ['a signed-in account (A, active, not the owner)', A.client]]

  // ── R73 (a): sold and rented listings and their photos are public; the other statuses and their photos are not ──────────────────────────────
  for (const [id, ai, status] of [['V801', 0, 'sold'], ['V802', 0, 'rented'], ['V803', 1, 'sold'], ['V804', 1, 'rented']]) {
    const s = await seen(actors[ai][1], fx[status])
    outcome(id, 'allow', s.nl === 1 && s.np === 1, `${actors[ai][0]} reads a ${status.toUpperCase()} listing and its photo (R73 (a))`, 'the listing and its photo are readable', show(s), 'the listings read policy shows a visitor active listings only')
  }
  let k = 5
  for (const [who, client] of actors) {
    for (const status of ['archived', 'pending', 'inactive', 'expired']) {
      const id = `V8${String(k++).padStart(2, '0')}`
      const s = await seen(client, fx[status])
      const what = `${who} reads a ${status.toUpperCase()} listing or its photo (R73 (a))`
      if (s.nl < 0 || s.np < 0) rec(id, 'INCONCLUSIVE', what, 'neither the listing nor its photo is readable', show(s))
      else outcome(id, 'deny', s.nl === 0 && s.np === 0, what, 'neither the listing nor its photo is readable', show(s), 'the photo policy is "true": the photo of a listing that is not public is readable by id')
    }
  }
  const own = []
  for (const status of Object.keys(fx)) own.push([status, await seen(B.client, fx[status])])
  outcome('V813', 'allow', own.every(([, s]) => s.nl === 1 && s.np === 1), 'the OWNER (B) reads all of their own listings and photos in every status (sold, rented, archived, pending, inactive, expired)', 'six listings and six photos readable',
    own.map(([st, s]) => `${st} ${s.nl}/${s.np}`).join(' '), null)

  // ── R69 (b), (c): a session cannot store a latitude of 91 or an image address outside the project's prefix (23514); a control insert proves that nothing else is wrong ───────
  const mkBody = (slug, extra) => ({ user_id: A.id, slug, title: `${RUN} ${slug}`, price: 1, listing_type: 'sale', property_type: 'apartment', status: 'pending', expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), views_count: 0, ...extra })
  const insListing = async (slug, extra) => { const r = await A.client.from('listings').insert(mkBody(slug, extra)).select('id'); if (r.data && r.data[0]) created.listings.add(r.data[0].id); return r }
  const checkViolation = (r) => !!r.error && r.error.code === '23514'
  const verdict8 = (id, what, expected, bad, ctrl, reason) => {
    if (ctrl.error) return rec(id, 'INCONCLUSIVE', what, expected, `the control insert failed: ${brief(ctrl)}`)
    if (bad.error && !checkViolation(bad)) return rec(id, 'INCONCLUSIVE', what, expected, `${brief(bad)}; control ${brief(ctrl)}`)
    outcome(id, 'deny', checkViolation(bad), what, expected, `${brief(bad)}; control ${brief(ctrl)}`, reason)
  }
  const ctrlL = await insListing(`${SLUG}-v814c`, { lat: 41.3275, lng: 19.8187 })
  const badL = await insListing(`${SLUG}-v814b`, { lat: 91, lng: 19.8187 })
  verdict8('V814', 'A (a session) inserts a listing with latitude 91 (R69 (b))', 'refused with 23514 (check violation); the control with latitude 41.3275 is accepted', badL, ctrlL, 'no CHECK on listings.lat exists, the listing with latitude 91 was stored')
  const ctrlI = await A.client.from('listing_images').insert({ listing_id: LAp.id, url: `${IMG}${RUN}_v815ok.jpg` }).select('id')
  const badI = await A.client.from('listing_images').insert({ listing_id: LAp.id, url: `https://example.invalid/${RUN}_v815.jpg` }).select('id')
  for (const r of [ctrlI, badI]) if (r.data && r.data[0]) created.rows.push({ table: 'listing_images', id: r.data[0].id })
  verdict8('V815', 'A (a session) inserts an image of their own listing whose address is outside the project\'s Cloudinary prefix (R69 (c))', 'refused with 23514 (check violation); the control with an address on the prefix is accepted', badI, ctrlI, 'no CHECK on listing_images.url exists, the address was stored')

  // ── R69 (e), R75 (f), R75 (c): the catalogue (a privileged read-only catalog connection, labelled) ────────────────────────────────────────────
  try {
    const q = await catalogRows(`select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in ('Admin/moderator delete avatars', 'Admin/moderator update avatars', 'Admin/moderator upload avatars') order by 1`)
    outcome('V816', 'deny', q.length === 0, 'the three staff write policies of the avatars bucket are absent from the catalogue (R69 (e))', 'none of the three exists', q.length ? `still there: ${q.map((x) => x.policyname).join(', ')}` : 'none exists', 'the three policies still exist')
  } catch (e) { rec('V816', 'INCONCLUSIVE', 'the three staff write policies of the avatars bucket are absent from the catalogue (R69 (e))', 'none of the three exists', 'catalog read failed: ' + String(e.message).slice(0, 80)) }
  try {
    const q = await catalogRows(`select policyname from pg_policies where schemaname = 'public' and tablename = 'role_permissions' order by 1`)
    outcome('V817', 'deny', q.length === 0, 'public.role_permissions has no policy: its four row policies are absent from the catalogue (R75 (f))', 'no policy on the table', q.length ? `still there: ${q.map((x) => x.policyname).join(', ')}` : 'no policy', 'the four row policies still exist')
  } catch (e) { rec('V817', 'INCONCLUSIVE', 'public.role_permissions has no policy (R75 (f))', 'no policy on the table', 'catalog read failed: ' + String(e.message).slice(0, 80)) }
  try {
    const q = await catalogRows(`select role, permission_key, allowed from public.role_permissions where permission_key in (${KEYS8.map((x) => `'${x}'`).join(', ')}) order by permission_key`)
    const okRows = q.length === 8 && q.every((x) => x.role === 'moderator' && x.allowed === true) && KEYS8.every((x) => q.some((y) => y.permission_key === x))
    outcome('V818', 'allow', okRows, 'the eight new permission keys are in public.role_permissions for the role moderator with allowed = true (R75 (c); keys of permissionKeys.ts:17-24)', 'eight rows, all moderator and allowed', `${q.length} row(s); allowed ${q.filter((x) => x.allowed === true).length}`, 'the eight rows do not exist')
  } catch (e) { rec('V818', 'INCONCLUSIVE', 'the eight new permission keys are in public.role_permissions (R75 (c))', 'eight rows', 'catalog read failed: ' + String(e.message).slice(0, 80)) }

  // ── R75 (f): a session role can neither read nor write public.role_permissions (42501 for each of select, insert, update and delete) ──────────
  for (const [id, who, client] of [['V819', 'anon', an], ['V820', 'a signed-in session (A)', A.client]]) {
    const probe = `${RUN}_probe`
    const answers = [
      await client.from('role_permissions').select('permission_key').limit(1),
      await client.from('role_permissions').insert({ role: 'moderator', permission_key: probe, allowed: true }),
      await client.from('role_permissions').update({ allowed: true }).eq('permission_key', probe),
      await client.from('role_permissions').delete().eq('permission_key', probe),
    ]
    await svc.from('role_permissions').delete().like('permission_key', `${RUN}%`)   // the probe row exists only if the insert above worked; it is removed either way
    outcome(id, 'deny', answers.every((x) => x.error && x.error.code === '42501'), `${who} selects, inserts, updates and deletes public.role_permissions (R75 (f))`, 'permission denied (42501) for each', answers.map(brief).join(' | '), null)
  }

  // ── R86 (c) expand: public.get_listing_owner_contact_as ─────────────────────────────────────────────────────────────────────────────────────────
  const noFn = 'the function does not exist, so no grant refuses the call'
  for (const [id, who, client] of [['V821', 'anon', an], ['V822', 'a signed-in session (A)', A.client]]) {
    const what = `${who} calls public.${FN} (R86 (c))`
    if (applied !== true) { rec(id, applied === null ? 'INCONCLUSIVE' : 'VULN', what, 'permission denied (42501)', 'not called: ' + noFn, applied === null ? '' : why(noFn)); continue }
    const x = await client.rpc(FN, { p_caller: A.id, listing_id_param: LBa.id })
    rec(id, !x.error ? 'VULN' : x.error.code === '42501' ? 'PASS' : 'INCONCLUSIVE', what, 'permission denied (42501)', brief(x))
  }
  if (applied !== true) {
    const note = applied === null ? '' : why('public.get_listing_owner_contact_as does not exist')
    const st = applied === null ? 'INCONCLUSIVE' : null
    rec('V823', st || 'BROKEN', 'service_role gets the owner\'s phone for an ACTIVE caller on an ACTIVE listing (R86 (c))', 'one row with B\'s phone', 'not called: the function does not exist', note)
    rec('V824', st || 'VULN', 'service_role gets nothing for a SOLD listing (R86 (c))', 'no row', 'not called: the function does not exist', note)
    rec('V825', st || 'VULN', 'service_role gets nothing for a BLOCKED caller (R86 (c))', 'no phone (42501 or no row)', 'not called: the function does not exist', note)
  } else {
    const call = (caller, listing) => svc.rpc(FN, { p_caller: caller, listing_id_param: listing })
    const x = await call(A.id, LBa.id)
    allow('V823', 'service_role gets the owner\'s phone for an ACTIVE caller on an ACTIVE listing (R86 (c))', !x.error && rows(x) === 1 && x.data[0].phone === B.phone, brief(x), 'one row with B\'s phone')
    const y = await call(A.id, fx.sold)
    rec('V824', !y.error && rows(y) === 0 ? 'PASS' : !y.error ? 'VULN' : 'INCONCLUSIVE', 'service_role gets nothing for a SOLD listing (R86 (c))', 'no row', brief(y))
    const K = await makeUser('v8_blocked')
    await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', K.id), 'block the V825 caller')
    const z = await call(K.id, LBa.id)
    rec('V825', !z.error && rows(z) > 0 ? 'VULN' : !z.error || (z.error && z.error.code === '42501') ? 'PASS' : 'INCONCLUSIVE', 'service_role gets nothing for a BLOCKED caller (R86 (c))', 'no phone (42501 or no row)', brief(z))
  }

  // ── R98 (b) (kickoff section 48.3): V826-V831, ok only after the v8a apply. Each person and listing is synthetic and goes with the clean-up of the run ──────────────────
  const V8C = [
    ['V826', 'VULN', 'service_role calls public.get_listing_owner_contact_as with a null caller (R86 (c))', '42501 (unauthenticated)'],
    ['V827', 'VULN', 'service_role: a caller whose deleted_at is set gets no phone (R86 (c))', '42501 and no phone'],
    ['V828', 'BROKEN', 'service_role gets the owner\'s phone for a BLOCKED caller whose suspension has ended (R86 (c))', 'one row with B\'s phone'],
    ['V829', 'VULN', 'service_role gets nothing for an ACTIVE listing whose owner has deleted_at set (R86 (c))', 'no row'],
  ]
  if (applied !== true) {
    for (const [id, bad, what, expected] of V8C) rec(id, applied === null ? 'INCONCLUSIVE' : bad, what, expected, 'not called: the function does not exist', applied === null ? '' : why('public.get_listing_owner_contact_as does not exist'))
  } else {
    const call8 = (caller, listing) => svc.rpc(FN, { p_caller: caller, listing_id_param: listing })
    const nul = await call8(null, LBa.id)
    rec('V826', nul.error && nul.error.code === '42501' ? 'PASS' : !nul.error ? 'VULN' : 'INCONCLUSIVE', V8C[0][2], V8C[0][3], brief(nul))
    const D = await makeUser('v8_deleted')
    await must(svc.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', D.id), 'mark the V827 caller deleted')
    const dl = await call8(D.id, LBa.id)
    rec('V827', dl.error && dl.error.code === '42501' ? 'PASS' : !dl.error && rows(dl) > 0 ? 'VULN' : 'INCONCLUSIVE', V8C[1][2], V8C[1][3], brief(dl))
    const S = await makeUser('v8_suspended')
    await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: new Date(Date.now() - 36e5).toISOString() }).eq('id', S.id), 'block the V828 caller with a suspension that ended an hour ago')
    const sp = await call8(S.id, LBa.id)
    allow('V828', V8C[2][2], !sp.error && rows(sp) === 1 && sp.data[0].phone === B.phone, brief(sp), V8C[2][3])
    const O = await makeUser('v8_gone_owner')
    const LO = await makeListing(O.id, 'active', 'v8_gone_owner')
    const before = await call8(A.id, LO.id)   // the control: while the owner is live the same call answers with their phone
    await must(svc.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', O.id), 'mark the V829 owner deleted')
    const after = await call8(A.id, LO.id)
    if (before.error || rows(before) !== 1 || before.data[0].phone !== O.phone) rec('V829', 'INCONCLUSIVE', V8C[3][2], V8C[3][3], `the control call failed: ${brief(before)}`)
    else rec('V829', !after.error && rows(after) === 0 ? 'PASS' : !after.error ? 'VULN' : 'INCONCLUSIVE', V8C[3][2], V8C[3][3], `${brief(after)}; control ${brief(before)}`)
  }
  const insTitle = await insListing(`${SLUG}-v830b`, { title: '  abc  ' })
  const insTitleOk = await insListing(`${SLUG}-v830c`, { title: `${RUN} v830 control` })
  verdict8('V830', 'A (a session) inserts a listing whose title has three characters after trimming (R69 (b))', 'refused with 23514 (check violation); the control with a valid title is accepted', insTitle, insTitleOk, 'no CHECK on listings.title exists, the listing with a three-character title was stored')
  const insPrice = await insListing(`${SLUG}-v831b`, { price: 0 })
  const insPriceOk = await insListing(`${SLUG}-v831c`, { price: 1 })
  verdict8('V831', 'A (a session) inserts a listing with price 0 (R69 (b))', 'refused with 23514 (check violation); the control with price 1 is accepted', insPrice, insPriceOk, 'no CHECK on listings.price exists, the listing with price 0 was stored')
}

async function main() {
  const A = await makeUser('a')
  const B = await makeUser('b')
  const C = await makeUser('c_admin', { role: 'admin' })          // synthetic administrator, made by service_role like the admin panel does
  const LBa = await makeListing(B.id, 'active', 'b_active')
  const LBp = await makeListing(B.id, 'pending', 'b_pending')
  const LAp = await makeListing(A.id, 'pending', 'a_pending')
  const LBv = await makeListing(B.id, 'active', 'b_views')       // used only by the server-contract check V05/V06, so earlier direct calls cannot disturb it
  const an = mkAnon()
  console.log(`run ${RUN}: users A, B, C(admin) and 3 synthetic listings prepared (ids not printed)`)

  // ── 1. reading other people's data ────────────────────────────────────────────────────────────────────────────────────────────────
  let r = await A.client.from('users').select('id,phone,whatsapp,role').eq('id', B.id)
  deny('R01', 'A reads B\'s users row (phone/whatsapp/role)', r)
  r = await A.client.from('users').select('id').limit(5)
  rec('R02', (r.data || []).every((x) => x.id === A.id) && !r.error ? 'PASS' : 'VULN', 'A lists users', 'only A\'s own row', brief(r))
  deny('R03', 'anonymous lists users', await an.from('users').select('id').limit(5))
  deny('R04', 'A reads B\'s PENDING listing', await A.client.from('listings').select('id').eq('id', LBp.id))
  deny('R05', 'anonymous reads B\'s PENDING listing', await an.from('listings').select('id').eq('id', LBp.id))
  deny('R06', 'A reads the view ledger of B\'s listing', await A.client.from('listing_views').select('id').eq('listing_id', LBa.id))
  r = await A.client.from('listings').select('*').eq('id', LBa.id).maybeSingle()
  const leaked = r.data ? Object.keys(r.data).filter((k) => /phone|whatsapp|email/.test(k) && r.data[k]) : []
  rec('R07', r.error || !r.data ? 'INCONCLUSIVE' : leaked.length ? 'VULN' : 'PASS', 'public listing row carries no contact columns with data', 'no phone/whatsapp/email data', r.error ? brief(r) : leaked.length ? leaked.join(',') : 'none')
  // tables that have NO grant for the signed-in role: the only valid answer is "permission denied" (an empty list proves nothing)
  const NO_GRANT = ['contact_inquiries', 'support_tickets', 'support_messages', 'role_permissions', 'user_change_log', 'user_status_history', 'verification_requests', 'history_clear_events']
  const cat = require('C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/catalog.json')
  for (const [i, t] of NO_GRANT.entries()) {
    const id = `R09${String.fromCharCode(97 + i)}`
    const granted = cat.grants.some((g) => g.table === t && g.grantee === 'authenticated' && /SELECT/.test(g.privileges))
    const rr = await A.client.from(t).select('*').limit(1)
    if (granted) rec(id, 'INCONCLUSIVE', `A reads ${t}`, 'denied', 'the recorded catalog now shows a SELECT grant: add a synthetic row before trusting an empty result')
    else rec(id, rr.error && rr.error.code === '42501' ? 'PASS' : 'VULN', `A reads ${t} (no grant exists)`, 'error 42501', brief(rr))
  }

  // ── 2. writing other people's data ────────────────────────────────────────────────────────────────────────────────────────────────
  deny('W01', 'A updates B\'s users row', await A.client.from('users').update({ name: 'hijacked' }).eq('id', B.id).select('id'))
  deny('W02', 'A updates B\'s listing', await A.client.from('listings').update({ title: 'hijacked' }).eq('id', LBa.id).select('id'))
  deny('W03', 'A deletes B\'s listing', await A.client.from('listings').delete().eq('id', LBa.id).select('id'))
  r = await A.client.from('listings').insert({ user_id: B.id, slug: `${RUN}-forged`, title: `${RUN} forged`, price: 1, listing_type: 'sale', property_type: 'apartment', status: 'pending' }).select('id')
  if (r.data && r.data[0]) created.listings.add(r.data[0].id)
  deny('W04', 'A inserts a listing owned by B', r)
  deny('W05', 'A adds an image to B\'s listing', await A.client.from('listing_images').insert({ listing_id: LBa.id, url: 'https://res.cloudinary.com/x/image/upload/zz.jpg' }).select('id'))
  deny('W06', 'A adds a favourite for B', await A.client.from('favorites').insert({ user_id: B.id, listing_id: LBa.id }).select('id'))
  deny('W07', 'A writes the view ledger directly', await A.client.from('listing_views').insert({ listing_id: LBa.id, ip_hash: 'x' }).select('id'))
  const up = await A.client.storage.from('avatars').upload(`${A.id}/${RUN}.txt`, new Blob(['x']), { contentType: 'text/plain' })
  if (!up.error) created.storage.push(`${A.id}/${RUN}.txt`)
  rec('W08', up.error ? 'PASS' : 'VULN', 'A uploads to the avatars bucket (staff only)', 'refused', up.error ? 'error ' + String(up.error.message).slice(0, 60) : 'UPLOADED')

  // ── 3. server-only and restricted functions ───────────────────────────────────────────────────────────────────────────────────────
  r = await A.client.rpc('admin_search_users_by_email', { q: RUN })
  rec('F01', r.error ? 'PASS' : 'VULN', 'A calls admin_search_users_by_email', 'permission denied', brief(r))
  r = await A.client.rpc('clear_user_history', { p_history_source: 'x', p_entity_id: A.id, p_row_id: A.id, p_actor_user_id: A.id })
  rec('F02', r.error ? 'PASS' : 'VULN', 'A calls clear_user_history', 'permission denied', brief(r))
  r = await an.rpc('get_listing_owner_contact', { listing_id_param: LBa.id })
  rec('F03', r.error ? 'PASS' : 'VULN', 'anonymous calls get_listing_owner_contact', 'denied', brief(r))
  r = await A.client.rpc('get_listing_owner_contact', { listing_id_param: LBa.id })
  allow('F04', 'signed-in A gets the owner contact of an ACTIVE listing (the legitimate path)', !r.error && rows(r) === 1 && r.data[0].phone === B.phone, brief(r), 'one row with B\'s phone')
  deny('F05', 'A asks the owner contact of a PENDING listing', await A.client.rpc('get_listing_owner_contact', { listing_id_param: LBp.id }))
  // F06 (v7.1, owner decision D49): NO cap on contact reveals. One signed-in caller opens the owner contact of six different active listings in a row on the direct RPC and every call answers
  // (the audited function has no quota and v7.1 creates none; v7 created an unset one, S3).
  {
    const ids = [LBa.id]
    for (let i = 1; i <= 5; i++) ids.push((await makeListing(B.id, 'active', `b_nocap_${i}`)).id)
    const U = await makeUser('d_nocap')
    const outcomes = []
    for (const id of ids) outcomes.push(await U.client.rpc('get_listing_owner_contact', { listing_id_param: id }))
    const okCount = outcomes.filter((o) => !o.error && rows(o) === 1).length
    allow('F06', 'no cap on contact reveals (owner decision D49): one caller opens six different active listings in a row on the direct RPC', okCount === ids.length, `answered ${okCount} of ${ids.length}${okCount === ids.length ? '' : '; first miss ' + brief(outcomes.find((o) => o.error || rows(o) !== 1))}`, 'all six answer')
  }

  // ── 4. view counter and recently-viewed ───────────────────────────────────────────────────────────────────────────────────────────
  const v0 = (await sget('listings', LBp.id, 'views_count')).views_count
  const anonCall = await an.rpc('record_listing_view', { p_listing_id: LBp.id, p_user_id: null, p_ip_hash: `${RUN}-h1` })
  const authCall = await A.client.rpc('record_listing_view', { p_listing_id: LBa.id, p_user_id: B.id, p_ip_hash: '' })
  const v1 = (await sget('listings', LBp.id, 'views_count')).views_count
  rec('V01', anonCall.error ? 'PASS' : 'VULN', 'anonymous calls record_listing_view directly', 'permission denied', brief(anonCall))
  rec('V02', authCall.error ? 'PASS' : 'VULN', 'signed-in A calls record_listing_view directly (spoofing B)', 'permission denied', brief(authCall))
  rec('V03', v1 === v0 ? 'PASS' : 'VULN', 'a pending listing\'s views_count after the direct calls above', 'unchanged', `${v0} -> ${v1}`)
  const led = await svc.from('listing_views').select('user_id').eq('listing_id', LBa.id).eq('user_id', B.id)
  rec('V04', !led.error && (led.data || []).length === 0 ? 'PASS' : led.error ? 'INCONCLUSIVE' : 'VULN', 'no ledger row exists "as B" created by a non-server caller', '0 rows', led.error ? brief(led) : `rows=${(led.data || []).length}`)
  // the route's contract: service_role passes the server-established user id; the call counts once per 24 h and returns true
  const s1 = await svc.rpc('record_listing_view', { p_listing_id: LBv.id, p_user_id: A.id, p_ip_hash: '' })
  const s2 = await svc.rpc('record_listing_view', { p_listing_id: LBv.id, p_user_id: A.id, p_ip_hash: '' })
  const ledA = await svc.from('listing_views').select('id').eq('listing_id', LBv.id).eq('user_id', A.id)
  const cnt = (await sget('listings', LBv.id, 'views_count')).views_count
  allow('V05', 'server (service_role) records a view for the server-set user id exactly once', !s1.error && !s2.error && (ledA.data || []).length === 1 && cnt === 1, `${brief(s1)} ${brief(s2)} ledger=${(ledA.data || []).length} views_count=${cnt}`, 'one ledger row, views_count 1')
  rec('V06', 'INFO', 'return value of record_listing_view for the first server call', 'true after hardening (the route reads recorded === true); null before', JSON.stringify(s1.data))
  const sPend = await svc.rpc('record_listing_view', { p_listing_id: LBp.id, p_user_id: null, p_ip_hash: `${RUN}-srv` })
  const v2 = (await sget('listings', LBp.id, 'views_count')).views_count
  rec('V07', v2 === v0 ? 'PASS' : 'VULN', 'even the server does not count a view of a PENDING listing', 'unchanged', `${v0} -> ${v2} (${brief(sPend)})`)
  // recently viewed
  for (const [i, cap] of [0, -5, null, 1000000].entries()) {
    const rr = await A.client.rpc('record_recently_viewed', { p_listing_id: LBa.id, p_cap: cap })
    const kept = await svc.from('recently_viewed').select('id').eq('user_id', A.id)
    rec(`V08${'abcd'[i]}`, !rr.error && (kept.data || []).length >= 1 ? 'PASS' : 'VULN', `record_recently_viewed with cap ${JSON.stringify(cap)}`, 'no error, the just-viewed item is kept', `${brief(rr)}; kept=${(kept.data || []).length}`)
  }
  const rv = await A.client.rpc('record_recently_viewed', { p_listing_id: LBa.id })
  allow('V09', 'record_recently_viewed with the default cap', !rv.error, brief(rv))
  rec('V10', (await an.rpc('record_recently_viewed', { p_listing_id: LBa.id })).error ? 'PASS' : 'VULN', 'anonymous calls record_recently_viewed', 'refused', 'see result')

  // ── 5. positive controls for legitimate profile and listing work (must keep working after hardening) ───────────────────────────────
  r = await A.client.from('users').update({ name: `${RUN} renamed`, phone: '+355690000001' }).eq('id', A.id).select('name,phone')
  allow('P01', 'A edits own name and phone', !r.error && rows(r) === 1 && r.data[0].name === `${RUN} renamed`, brief(r))
  r = await A.client.from('listings').insert({ user_id: A.id, slug: `${SLUG}-alegit`, title: `${RUN} a_legit`, price: 5, listing_type: 'sale', property_type: 'apartment', status: 'pending', expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), views_count: 0 }).select('id,status')
  if (r.data && r.data[0]) created.listings.add(r.data[0].id)
  allow('P02', 'A creates a listing exactly as createListing does (pending, 30-day expiry, 0 views)', !r.error && rows(r) === 1 && r.data[0].status === 'pending', brief(r))
  r = await A.client.from('listings').update({ title: `${RUN} edited`, price: 77 }).eq('id', LAp.id).select('title,price')
  allow('P03', 'A edits title and price of own listing', !r.error && rows(r) === 1 && r.data[0].price === 77, brief(r))
  r = await A.client.from('listings').select('id,status').eq('id', LBa.id)
  allow('P04', 'signed-in A reads B\'s ACTIVE (public) listing', !r.error && rows(r) === 1, brief(r))
  r = await an.from('listings').select('id').eq('id', LBa.id)
  allow('P05', 'anonymous reads an ACTIVE (public) listing', !r.error && rows(r) === 1, brief(r))
  r = await svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', A.id).select('status')
  const lift = await svc.from('users').update({ status: 'active', suspended_until: null, block_reason: null }).eq('id', A.id).select('status')
  allow('P06', 'server (service_role) blocks and un-blocks a user (the auto-lift in blockCheck.ts)', !r.error && !lift.error && rows(lift) === 1, `${brief(r)} / ${brief(lift)}`)
  r = await svc.from('listings').update({ status: 'active', is_premium: true, premium_until: '2099-01-01T00:00:00Z', expires_at: '2099-01-01T00:00:00Z' }).eq('id', LBp.id).select('status,is_premium')
  allow('P07', 'server (service_role) publishes, premium-marks and re-stamps a listing (the gateway path)', !r.error && rows(r) === 1 && r.data[0].status === 'active', brief(r))
  await svc.from('listings').update({ status: 'pending', is_premium: false, premium_until: null, expires_at: new Date(Date.now() + 30 * 864e5).toISOString() }).eq('id', LBp.id)
  r = await C.client.from('listings').update({ is_premium: true }).eq('id', LAp.id).select('is_premium')
  allow('P08', 'a real administrator session may set premium on a listing', !r.error && rows(r) === 1 && r.data[0].is_premium === true, brief(r))
  await svc.from('listings').update({ is_premium: false }).eq('id', LAp.id)

  // ── 6. sign-up: the initial role must not come from user-controlled metadata (DBR-1) ────────────────────────────────────────────────
  // The trigger on auth.users reads raw_user_meta_data for ANY creation path; the admin API is used here (the public sign-up would also send a real e-mail).
  const S1 = await makeUser('e_signup', { metadata: { role: 'admin', is_verified: true, user_type: 'agent', phone: '+355690000009' } })
  const row = await sget('users', S1.id, 'role,is_verified,user_type')   // makeUser does not touch role / is_verified here: this is what the TRIGGER produced
  rec('S01', row.role === 'user' ? 'PASS' : 'VULN', 'sign-up metadata asks for role=admin', 'role = user', `role=${row.role}`)
  rec('S02', row.is_verified === false ? 'PASS' : 'VULN', 'sign-up metadata asks for is_verified=true', 'false', `is_verified=${row.is_verified}`)
  allow('S03', 'sign-up metadata user_type=agent (the one choice the form offers) is kept', row.user_type === 'agent', `user_type=${row.user_type}`, 'agent')
  const S2 = await makeUser('f_signup2', { metadata: { user_type: 'developer', avatar_url: 'javascript:alert(1)' } }).catch((e) => ({ error: e }))
  if (S2.error) rec('S04', 'PASS', 'sign-up metadata with an invalid user_type is refused or neutralised', 'no privileged row', 'creation refused: ' + String(S2.error.message).slice(0, 80))
  else { const rw = await sget('users', S2.id, 'user_type,avatar_url'); rec('S04', rw.user_type === 'private' && !/^javascript:/.test(rw.avatar_url || '') ? 'PASS' : 'VULN', 'invalid user_type / non-https avatar in metadata', 'private, no javascript: address', `user_type=${rw.user_type} avatar=${(rw.avatar_url || '').slice(0, 20)}`) }

  // ── 7. one protected column per attempt: users (A on own row) ────────────────────────────────────────────────────────────────────────
  const blockedBase = { status: 'blocked', block_reason: `${RUN} sanction`, suspended_until: '2099-01-01T00:00:00Z' }
  const cleanUser = { role: 'user', is_verified: false, status: 'active', block_reason: null, suspended_until: null, deleted_at: null }
  await fieldTest('U01', 'users', A, A.id, { role: 'admin' }, 'role', { ...cleanUser })
  await fieldTest('U02', 'users', A, A.id, { role: 'moderator' }, 'role', { ...cleanUser })
  await fieldTest('U03', 'users', A, A.id, { is_verified: true }, 'is_verified', { ...cleanUser })
  await fieldTest('U04', 'users', A, A.id, { status: 'active' }, 'status', { ...cleanUser, ...blockedBase }, cleanUser)
  await fieldTest('U05', 'users', A, A.id, { block_reason: null }, 'block_reason', { ...cleanUser, ...blockedBase }, cleanUser)
  await fieldTest('U06', 'users', A, A.id, { suspended_until: null }, 'suspended_until', { ...cleanUser, ...blockedBase }, cleanUser)
  await fieldTest('U07', 'users', A, A.id, { deleted_at: new Date().toISOString() }, 'deleted_at', { ...cleanUser })
  const pid = (await sget('users', A.id, 'public_id')).public_id
  await fieldTest('U08', 'users', A, A.id, { public_id: pid + 1000000 }, 'public_id', { public_id: pid })

  // ── 8. one protected column per attempt: listings (A on own pending listing) ─────────────────────────────────────────────────────────
  const lBase = { status: 'pending', is_premium: false, premium_until: null, views_count: 0, expires_at: new Date(Date.now() + 30 * 864e5).toISOString() }
  await fieldTest('L01', 'listings', A, LAp.id, { status: 'active' }, 'status', { ...lBase })
  await fieldTest('L02', 'listings', A, LAp.id, { is_premium: true }, 'is_premium', { ...lBase })
  await fieldTest('L03', 'listings', A, LAp.id, { premium_until: '2099-01-01T00:00:00Z' }, 'premium_until', { ...lBase })
  await fieldTest('L04', 'listings', A, LAp.id, { views_count: 999999 }, 'views_count', { ...lBase })
  await fieldTest('L05', 'listings', A, LAp.id, { expires_at: '2099-01-01T00:00:00Z' }, 'expires_at', { ...lBase })
  const lpid = (await sget('listings', LAp.id, 'public_id')).public_id
  await fieldTest('L06', 'listings', A, LAp.id, { public_id: lpid + 1000000 }, 'public_id', { public_id: lpid })
  await fieldTest('L07', 'listings', A, LAp.id, { user_id: B.id }, 'user_id', { user_id: A.id })

  // ── 9. one protected column per attempt: listings INSERT by A ────────────────────────────────────────────────────────────────────────
  const ins = async (id, what, extra) => {
    const slug = `${RUN}-ins_${id}`
    const rr = await A.client.from('listings').insert({ user_id: A.id, slug, title: `${RUN} ${id}`, price: 1, listing_type: 'sale', property_type: 'apartment', ...extra }).select('id')
    if (rr.data && rr.data[0]) created.listings.add(rr.data[0].id)
    deny(id, what, rr, 'refused')
  }
  await ins('I01', 'A inserts status=active', { status: 'active' })
  await ins('I02', 'A inserts with NO status (the column default is active)', {})
  await ins('I03', 'A inserts pending but is_premium=true', { status: 'pending', is_premium: true })
  await ins('I04', 'A inserts pending but premium_until set', { status: 'pending', premium_until: '2099-01-01T00:00:00Z' })
  await ins('I05', 'A inserts pending but views_count=5', { status: 'pending', views_count: 5 })
  await ins('I06', 'A inserts pending but expires_at in 2099', { status: 'pending', expires_at: '2099-01-01T00:00:00Z' })

  // ── 10b. D-blocked (owner decision 2026-10-17): a blocked / inactive person has NO access, even with a still-valid access token ──────────
  // A's session was opened before the status changed, exactly like a person who is blocked while signed in. (A Supabase Auth ban stops sign-in, refresh and
  // auth.getUser but NOT this token — measured by ban-experiment.cjs — so the database must refuse the writes itself.)
  const FUTURE = new Date(Date.now() + 864e5).toISOString()
  const PAST = new Date(Date.now() - 60000).toISOString()
  const statusCases = [
    ['BL01', 'status blocked, permanent', { status: 'blocked', block_reason: RUN, suspended_until: null }, true],
    ['BL02', 'status blocked until a FUTURE date', { status: 'blocked', block_reason: RUN, suspended_until: FUTURE }, true],
    ['BL03', 'status inactive (deactivated by staff)', { status: 'inactive', block_reason: null, suspended_until: null }, true],
    ['BL04', 'status blocked but the suspension date has PASSED (the auto-lift case)', { status: 'blocked', block_reason: RUN, suspended_until: PAST }, false],
    ['BL05', 'status active again after an unblock', { status: 'active', block_reason: null, suspended_until: null }, false],
  ]
  for (const [id, label, patch, denied] of statusCases) {
    await must(svc.from('users').update(patch).eq('id', A.id), 'set status ' + id)
    await must(svc.from('favorites').delete().eq('user_id', A.id), 'reset favourites ' + id)   // every case starts from the same state
    const w1 = await A.client.from('users').update({ name: `${RUN} ${id}` }).eq('id', A.id).select('id')
    const w2 = await A.client.from('listings').insert({ user_id: A.id, slug: `${SLUG}-${String(id).replace(/_/g, '').toLowerCase()}`, title: `${RUN} ${id}`, price: 1, listing_type: 'sale', property_type: 'apartment', status: 'pending', expires_at: new Date(Date.now() + 30 * 864e5).toISOString(), views_count: 0 }).select('id')
    if (w2.data && w2.data[0]) created.listings.add(w2.data[0].id)
    const w3 = await A.client.from('favorites').insert({ user_id: A.id, listing_id: LBa.id }).select('id')
    const w4 = await A.client.from('listings').update({ title: `${RUN} ${id} edited` }).eq('id', LAp.id).select('id')
    const f1 = await A.client.rpc('get_listing_owner_contact', { listing_id_param: LBa.id })
    const f2 = await A.client.rpc('record_recently_viewed', { p_listing_id: LBa.id })
    const rd = await A.client.from('users').select('status').eq('id', A.id)
    const works = (r) => !r.error && (Array.isArray(r.data) ? r.data.length > 0 : true)
    // a refusal only counts when it IS an access refusal (42501 / RLS / account_blocked) or the write touched 0 rows; any other error (a duplicate, a bad value) proves nothing
    const isAccessRefusal = (r) => !!r.error && (r.error.code === '42501' || /row-level security|permission denied|account_blocked/i.test(r.error.message || ''))
    const check = (suffix, what, r) => {
      if (!denied) return allow(`${id}${suffix}`, `${label}: ${what}`, works(r), brief(r))
      if (works(r)) return rec(`${id}${suffix}`, 'VULN', `${label}: ${what}`, 'refused', brief(r))
      if (r.error && !isAccessRefusal(r)) return rec(`${id}${suffix}`, 'INCONCLUSIVE', `${label}: ${what}`, 'refused by access control', brief(r))
      return rec(`${id}${suffix}`, 'PASS', `${label}: ${what}`, 'refused', brief(r))
    }
    check('a', 'edits own profile', w1)
    check('b', 'creates a listing', w2)
    check('c', 'adds a favourite', w3)
    check('d', 'edits own listing', w4)
    check('e', 'asks the owner contact (RPC)', f1)
    check('f', 'records a recently viewed item (RPC)', f2)
    // v4 (Opus review change 4, owner D26 "0 seconds"): reads are refused too. The application no longer needs this row with the person's session:
    // getBlockedError reads the status through the service role since Task 923 R44 (d).
    if (denied) check('g', 'cannot READ own status row either (reads are refused, D26)', rd)
    else allow(`${id}g`, `${label}: can still READ own status row`, !rd.error && rows(rd) === 1 && rd.data[0].status === patch.status, brief(rd))
  }
  // a blocked ADMINISTRATOR is blocked too: the staff policies must not carry a blocked account
  await must(svc.from('users').update({ status: 'blocked', block_reason: RUN, suspended_until: null }).eq('id', C.id), 'block C')
  r = await C.client.from('listings').update({ is_premium: true }).eq('id', LBa.id).select('id')
  rec('BL06', !r.error && rows(r) > 0 ? 'VULN' : 'PASS', 'a blocked administrator edits another person\'s listing', 'refused', brief(r))
  await must(svc.from('users').update({ status: 'active', block_reason: null, suspended_until: null }).eq('id', C.id), 'unblock C')
  r = await C.client.from('listings').update({ is_premium: false }).eq('id', LBa.id).select('id')
  allow('BL07', 'the same administrator after the unblock', !r.error && rows(r) === 1, brief(r))

  // ── 10c. v4 (Task 923 R37, owner D25-D29): every account state that gives no access, every role, reads AND writes ──────────────────────
  await v4checks({ A, C, LBa, LAp })

  // ── 10d. v7 (Task 923 R63, R64, R65; kickoff sections 27-29): listing columns, the old price, the owner contact, two new functions ──────
  try { await v7checks({ A, B, LBa, LAp }) } catch (e) { rec('V7ERR', 'INCONCLUSIVE', 'the v7 section ran to the end', 'no error', String(e.message).slice(0, 160)) }
  try { await reauthFailuresChecks({ A }) } catch (e) { rec('V75E', 'INCONCLUSIVE', 'the reauth_failures checks ran to the end', 'no error', String(e.message).slice(0, 160)) }
  try { await v8checks({ A, B, LBa, LAp }) } catch (e) { rec('V8ERR', 'INCONCLUSIVE', 'the v8a section (V801-V825) ran to the end', 'no error', String(e.message).slice(0, 160)) }

  // ── 10a. Revision 14 (kickoff section 24, R58 (c), R59 (d)): the view, the search_path of every SECURITY DEFINER function, and the deletion design ──
  await v5checks({ B })
  await deletionChecks({ B })

  // ── 10. the escalation attempts above must leave A unable to act as an administrator (independent of whether any attempt worked) ──────
  const roleNow = (await sget('users', A.id, 'role')).role
  rec('E01', roleNow === 'user' ? 'PASS' : 'VULN', 'A\'s role at the end of all attempts', 'user', `role=${roleNow}`)
  deny('E02', 'A edits B\'s listing after all escalation attempts', await A.client.from('listings').update({ title: `${RUN} touched-by-A` }).eq('id', LBa.id).select('id'))
}

;(async () => {
  if (process.argv.includes('--snapshot-updated-at')) {
    try { await snapshotMode(); process.exit(0) } catch (e) { console.log('SNAPSHOT ERROR:', scrub(e.message)); process.exit(1) }
  }
  let harnessError = null
  try { await main() } catch (e) { harnessError = scrub(e.message); console.log('HARNESS ERROR:', harnessError) }

  // ── clean-up: only rows of this run; every step is checked, nothing is assumed ───────────────────────────────────────────────────────
  const cleanup = { errors: [], left: {}, ok: false }
  const step = async (label, p) => { try { const r = await p; if (r && r.error) cleanup.errors.push(`${label}: ${scrub(r.error.message)}`); return r } catch (e) { cleanup.errors.push(`${label}: ${scrub(e.message)}`) } }
  try {
    // anything of this run that was created but not tracked (a failure half-way)
    for (const prefix of [RUN, SLUG]) {
      const lst = await svc.from('listings').select('id').like('slug', prefix + '%')
      if (lst.error) cleanup.errors.push('list listings: ' + scrub(lst.error.message)); else (lst.data || []).forEach((x) => created.listings.add(x.id))
    }
    for (let page = 1; page <= 10; page++) {
      const ul = await svc.auth.admin.listUsers({ page, perPage: 200 })
      if (ul.error) { cleanup.errors.push('list users: ' + scrub(ul.error.message)); break }
      ul.data.users.filter((u) => (u.email || '').startsWith(RUN)).forEach((u) => created.users.add(u.id))
      if (ul.data.users.length < 200) break
    }
    // the synthetic rows of the DX section that were not tracked (a failure half-way) are found by the run tag
    const pgs = await svc.from('pages').select('id').like('slug', RUN + '%')
    if (pgs.error) cleanup.errors.push('list pages: ' + scrub(pgs.error.message)); else (pgs.data || []).forEach((x) => created.rows.push({ table: 'pages', id: x.id }))
    const cos = await svc.from('companies').select('id').like('name', RUN + '%')
    if (cos.error) cleanup.errors.push('list companies: ' + scrub(cos.error.message)); else (cos.data || []).forEach((x) => created.rows.push({ table: 'companies', id: x.id }))
    const ets = await svc.from('email_templates').select('id').like('key', RUN + '%')
    if (ets.error) cleanup.errors.push('list email_templates: ' + scrub(ets.error.message)); else (ets.data || []).forEach((x) => created.rows.push({ table: 'email_templates', id: x.id }))
    const lids = [...created.listings], uids = [...created.users]
    // rows that point at a synthetic person with NO ACTION (user_status_history.changed_by) go first, or the person cannot be deleted
    for (const r of created.rows) await step(`row ${r.table}`, svc.from(r.table).delete().eq('id', r.id))
    if (uids.length) await step('status history by actor', svc.from('user_status_history').delete().in('changed_by', uids))
    if (created.storage.length) await step('storage', svc.storage.from('avatars').remove(created.storage))
    if (lids.length) { await step('listing_views', svc.from('listing_views').delete().in('listing_id', lids)); await step('listings', svc.from('listings').delete().in('id', lids)) }
    for (const u of uids) { await step('recently_viewed', svc.from('recently_viewed').delete().eq('user_id', u)); await step('deleteUser', svc.auth.admin.deleteUser(u)) }
    // verification: an ERROR in a check is a failure, never "0 left"
    const count = async (label, p) => { const r = await p; if (r.error) { cleanup.errors.push(`verify ${label}: ${scrub(r.error.message)}`); cleanup.left[label] = 'UNKNOWN'; return } cleanup.left[label] = (r.data || []).length }
    const none = '00000000-0000-0000-0000-000000000000'
    await count('users', svc.from('users').select('id').in('id', uids.length ? uids : [none]))
    await count('listings', svc.from('listings').select('id').like('slug', RUN + '%'))
    await count('listings_plain_slug', svc.from('listings').select('id').like('slug', SLUG + '%'))
    await count('listing_views', svc.from('listing_views').select('id').in('listing_id', lids.length ? lids : [none]))
    await count('recently_viewed', svc.from('recently_viewed').select('id').in('user_id', uids.length ? uids : [none]))
    await count('pages', svc.from('pages').select('id').like('slug', RUN + '%'))
    await count('companies', svc.from('companies').select('id').like('name', RUN + '%'))
    await count('email_templates', svc.from('email_templates').select('id').like('key', RUN + '%'))
    await count('status_history_by_actor', svc.from('user_status_history').select('id').in('changed_by', uids.length ? uids : [none]))
    let authLeft = 0
    for (let page = 1; page <= 10; page++) {
      const ul = await svc.auth.admin.listUsers({ page, perPage: 200 })
      if (ul.error) { cleanup.errors.push('verify auth users: ' + scrub(ul.error.message)); authLeft = 'UNKNOWN'; break }
      authLeft += ul.data.users.filter((u) => (u.email || '').startsWith(RUN)).length
      if (ul.data.users.length < 200) break
    }
    cleanup.left.auth_users = authLeft
    cleanup.ok = cleanup.errors.length === 0 && Object.values(cleanup.left).every((n) => n === 0)
  } catch (e) { cleanup.errors.push('cleanup crashed: ' + scrub(e.message)) }
  console.log(`cleanup: ${cleanup.ok ? 'VERIFIED COMPLETE' : 'NOT VERIFIED'} left=${JSON.stringify(cleanup.left)} errors=${cleanup.errors.length}`)
  cleanup.errors.forEach((e) => console.log('  cleanup error:', e))

  const count = (s) => results.filter((x) => x.status === s).length
  const summary = { pass: count('PASS'), vuln: count('VULN'), broken: count('BROKEN'), inconclusive: count('INCONCLUSIVE'), info: count('INFO'), cleanupOk: cleanup.ok, harnessError }
  fs.writeFileSync('C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/rls-session-test.json', JSON.stringify({ run: RUN, mode: DIAGNOSE ? 'diagnose' : 'strict', summary, cleanup, results }, null, 1))
  const bad = results.filter((x) => ['VULN', 'BROKEN', 'INCONCLUSIVE'].includes(x.status))
  console.log(`\n${results.length} checks: ${summary.pass} pass, ${summary.vuln} VULN, ${summary.broken} BROKEN, ${summary.inconclusive} INCONCLUSIVE, ${summary.info} info. Not passing: ${bad.map((x) => x.id).join(' ') || 'none'}`)
  const fail = bad.length > 0 || !cleanup.ok || !!harnessError
  console.log(DIAGNOSE ? `--diagnose: exit 0 although ${fail ? 'the run is NOT clean' : 'the run is clean'}` : fail ? 'RESULT: FAIL (exit 1)' : 'RESULT: PASS (exit 0)')
  process.exit(DIAGNOSE ? 0 : fail ? 1 : 0)
})()
