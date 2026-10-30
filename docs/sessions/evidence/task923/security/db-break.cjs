/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923 Revision 54), not product code */
// Task 923 Revision 54 (kickoff §80, R163 (b)), owner decision D91 (.claude/rules/shared/security-test-environment.md, "One project before launch"):
// the scripted harness that breaks ONE database protection of the approved development project, so that a critical database case can be shown to FAIL, and restores it.
//   node db-break.cjs fingerprint            -> the sha256 over the touched catalog objects (and the part hashes)
//   node db-break.cjs break <case-id>        -> checks that no break is active, takes the fingerprint, applies the break in ONE committed transaction
//   node db-break.cjs restore <case-id>      -> restores the CAPTURED definition in one committed transaction and compares the fingerprint with the one taken before the break
// Rules it keeps (D91): through DATABASE_URL only, one break at a time (a state file refuses a second one), the fingerprint before and after must be equal, a mismatch stops everything
// and prints BLOCKED with the restore SQL, and the only rows it ever deletes are synthetic (`zz_synth_`) ones that a broken constraint let in.
// pg comes from pg@8.21.0 in the session scratchpad through NODE_PATH (as R93 did); credentials come through ../db-catalog/lib.cjs and every printed line is scrubbed.
const { createHash } = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { connect, scrub, env } = require('../db-catalog/lib.cjs')

const STATE = path.join(os.tmpdir(), 'lero-task923-db-break-state.json')
const sha = (value) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
const SYNTH = "'zz\\_synth\\_%' escape '\\'"
const PROJECT_CLOUD = 'https://res.cloudinary.com/die7okukn/'

// the tables whose policies, privileges and triggers the fingerprint covers (R163 (b))
const POLICY_TABLES = [['public', 'users'], ['public', 'listings'], ['public', 'listing_images'], ['public', 'notifications'], ['public', 'role_permissions'], ['public', 'role_permission_events'], ['public', 'reauth_failures'], ['public', 'listing_contact_reveals'], ['storage', 'objects']]
const TRIGGER_TABLES = ['users', 'listings', 'listing_images']

async function fingerprint(c) {
  const q = async (text, params) => (await c.query(text, params)).rows
  const tableList = POLICY_TABLES.map(([s, t]) => `${s}.${t}`)
  const parts = {}
  parts.triggers = await q(`
    select c.relname, t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) def from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any($1) and not t.tgisinternal order by c.relname, t.tgname`, [TRIGGER_TABLES])
  parts.guardFunctions = await q(`
    select p.proname, pg_get_functiondef(p.oid) def, p.proacl::text acl from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname in ('guard_users_protected_columns', 'guard_listings_protected_columns', 'caller_is_active', 'set_actor_name', 'account_display_name') or p.proname like 'zz\\_synth\\_%' escape '\\') order by p.proname`)
  parts.policies = await q(`
    select schemaname, tablename, policyname, permissive, roles::text, cmd, qual, with_check from pg_policies
    where (schemaname || '.' || tablename) = any($1) order by schemaname, tablename, policyname`, [tableList])
  parts.checks = await q(`
    select conrelid::regclass::text tbl, conname, convalidated, pg_get_constraintdef(oid) def from pg_constraint
    where contype = 'c' and conrelid in ('public.listings'::regclass, 'public.listing_images'::regclass) order by 1, 2`)
  parts.privileges = await q(`
    select table_schema, table_name, grantee, privilege_type from information_schema.role_table_grants
    where (table_schema || '.' || table_name) = any($1) and grantee in ('anon', 'authenticated', 'service_role') order by 1, 2, 3, 4`, [tableList])
  parts.realtime = await q(`select schemaname, tablename from pg_publication_tables where pubname = 'supabase_realtime' order by 1, 2`)
  parts.restoreFunctions = await q(`select p.proname, pg_get_function_identity_arguments(p.oid) args from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('restore_inactive_account', 'caller_access_state') order by 1, 2`)
  const hashes = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, sha(v)]))
  return { sha256: sha(hashes), parts: hashes, rows: parts }
}

// ── the breaks. Each has: capture(q) -> ctx (what the restore needs), apply(ctx) -> SQL[], restore(ctx) -> SQL[], settle ('schema' waits for PostgREST's schema cache), note ──────────────────────
const REFUSE_FUNCTION = `create function public.zz_synth_sens_refuse() returns trigger language plpgsql as $f$ begin raise exception 'zz_synth_sens_refuse' using errcode = '42501'; end $f$`
const refuseTrigger = (table, event, when) => ({
  apply: () => [REFUSE_FUNCTION, `revoke all on function public.zz_synth_sens_refuse() from public`,
    `create trigger zz_synth_sens_refuse before ${event} on public.${table} for each row when (${when}) execute function public.zz_synth_sens_refuse()`],
  restore: () => [`drop trigger if exists zz_synth_sens_refuse on public.${table}`, `drop function if exists public.zz_synth_sens_refuse()`],
})
const disableTrigger = (table, trigger) => ({
  capture: async (q) => ({ enabled: (await q(`select tgenabled from pg_trigger where tgrelid = 'public.${table}'::regclass and tgname = $1`, [trigger]))[0]?.tgenabled }),
  apply: () => [`alter table public.${table} disable trigger ${trigger}`],
  restore: (ctx) => [`alter table public.${table} ${{ O: 'enable', A: 'enable always', R: 'enable replica' }[ctx.enabled] ?? 'enable'} trigger ${trigger}`],
})
const callerIsActive = (result) => ({
  capture: async (q) => ({ def: (await q(`select pg_get_functiondef('public.caller_is_active()'::regprocedure) def`))[0].def }),
  apply: () => [`create or replace function public.caller_is_active() returns boolean language sql stable security definer set search_path = public, pg_temp as $f$ select ${result} $f$`],
  restore: (ctx) => [ctx.def],
})
const dropCheck = (table, name, purge) => ({
  capture: async (q) => { const r = (await q(`select convalidated, pg_get_constraintdef(oid) def from pg_constraint where conrelid = 'public.${table}'::regclass and conname = $1`, [name]))[0]; return { def: r.def, valid: r.convalidated } },
  apply: () => [`alter table public.${table} drop constraint ${name}`],
  // a row that the dropped CHECK let in is a synthetic row of the mutant run (its test cleans up in afterAll); any such leftover is removed here so that the constraint can be added back
  restore: (ctx) => [purge, `alter table public.${table} add constraint ${name} ${ctx.def}${ctx.valid ? '' : ' not valid'}`].filter(Boolean),
})
const grantTo = (table, privilege, roles) => ({
  capture: async (q) => ({ held: (await q(`select grantee from information_schema.role_table_grants where table_schema = 'public' and table_name = $1 and privilege_type = $2 and grantee = any($3)`, [table, privilege, roles])).map((r) => r.grantee) }),
  apply: () => [`grant ${privilege} on public.${table} to ${roles.join(', ')}`],
  restore: (ctx) => { const gave = roles.filter((r) => !ctx.held.includes(r)); return gave.length ? [`revoke ${privilege} on public.${table} from ${gave.join(', ')}`] : [] },
})
const revokeFrom = (table, privilege, role) => ({
  capture: async (q) => ({ held: (await q(`select 1 from information_schema.role_table_grants where table_schema = 'public' and table_name = $1 and privilege_type = $2 and grantee = $3`, [table, privilege, role])).length > 0 }),
  apply: () => [`revoke ${privilege} on public.${table} from ${role}`],
  restore: (ctx) => (ctx.held ? [`grant ${privilege} on public.${table} to ${role}`] : []),
})
const SYNTH_NAME = "new.name like 'zz\\_synth\\_%' escape '\\'"
const SYNTH_TITLE = "new.title like 'zz\\_synth\\_%' escape '\\'"
const SYNTH_SLUG = "new.slug like 'zz\\_synth\\_%' escape '\\'"

const BREAKS = {
  'SEC-DB-S59-DENY': { describe: 'the BEFORE INSERT OR UPDATE guard trigger of public.users is disabled', ...disableTrigger('users', 'users_guard_protected') },
  'SEC-DB-S59-ALLOW': { describe: 'a BEFORE UPDATE trigger refuses (42501) every change of the name of a synthetic user', ...refuseTrigger('users', 'update', `old.name is distinct from new.name and ${SYNTH_NAME}`) },
  'SEC-DB-S61-DENY': { describe: 'the BEFORE INSERT OR UPDATE guard trigger of public.listings is disabled', ...disableTrigger('listings', 'listings_guard_protected') },
  'SEC-DB-S61-ALLOW': { describe: 'a BEFORE UPDATE trigger refuses (42501) every change of the title of a listing to a synthetic title', ...refuseTrigger('listings', 'update', `old.title is distinct from new.title and ${SYNTH_TITLE}`) },
  'SEC-DB-ACCESS-DENY': { describe: 'caller_is_active() returns true for every caller', ...callerIsActive('true') },
  'SEC-DB-ACCESS-ALLOW': { describe: 'caller_is_active() returns false for every caller', ...callerIsActive('false') },
  'SEC-DB-REALTIME-DENY': { describe: 'caller_is_active() returns true for every caller', ...callerIsActive('true') },
  'SEC-DB-REALTIME-ALLOW': {
    describe: 'public.notifications is dropped from the supabase_realtime publication',
    apply: () => ['alter publication supabase_realtime drop table public.notifications'],
    restore: () => ['alter publication supabase_realtime add table public.notifications'],
  },
  'SEC-DB-X-LISTING-CHECKS-DENY': { describe: 'the CHECK listings_price_positive_check is dropped', ...dropCheck('listings', 'listings_price_positive_check', `delete from public.listings where price <= 0 and slug like ${SYNTH}`) },
  'SEC-DB-X-LISTING-CHECKS-ALLOW': { describe: 'a BEFORE INSERT OR UPDATE trigger refuses (42501) every write of a listing with a synthetic slug', ...refuseTrigger('listings', 'insert or update', SYNTH_SLUG) },
  'SEC-DB-X-IMAGE-URL-DENY': {
    describe: 'the CHECK listing_images_url_prefix_check is dropped',
    ...dropCheck('listing_images', 'listing_images_url_prefix_check',
      `delete from public.listing_images where not starts_with(url, '${PROJECT_CLOUD}') and listing_id in (select id from public.listings where slug like ${SYNTH})`),
  },
  'SEC-DB-X-IMAGE-URL-ALLOW': { describe: 'a BEFORE INSERT trigger refuses (42501) every photo whose address names a synthetic file', ...refuseTrigger('listing_images', 'insert', "new.url like '%zz-synth-%'") },
  'SEC-DB-X-AVATARS-STORAGE-DENY': {
    describe: 'a permissive INSERT policy zz_synth_sens_allow on storage.objects lets authenticated write the avatars bucket',
    apply: () => [`create policy zz_synth_sens_allow on storage.objects as permissive for insert to authenticated with check (bucket_id = 'avatars')`],
    restore: () => ['drop policy if exists zz_synth_sens_allow on storage.objects'],
  },
  'SEC-DB-X-CLOSED-READ-DENY': {
    describe: 'the USING of the policy "Listings viewable by everyone" becomes true',
    capture: async (q) => ({ qual: (await q(`select qual from pg_policies where schemaname = 'public' and tablename = 'listings' and policyname = 'Listings viewable by everyone'`))[0].qual }),
    apply: () => [`alter policy "Listings viewable by everyone" on public.listings using (true)`],
    restore: (ctx) => [`alter policy "Listings viewable by everyone" on public.listings using (${ctx.qual})`],
  },
  'SEC-DB-X-CLOSED-READ-ALLOW': {
    describe: 'a restrictive SELECT policy zz_synth_sens_block on public.listings for anon, USING false',
    apply: () => ['create policy zz_synth_sens_block on public.listings as restrictive for select to anon using (false)'],
    restore: () => ['drop policy if exists zz_synth_sens_block on public.listings'],
  },
  'SEC-DB-X-PERMS-NO-SESSION': { describe: 'SELECT on public.role_permissions is granted to anon and authenticated', ...grantTo('role_permissions', 'SELECT', ['anon', 'authenticated']) },
  'SEC-DB-X-REAUTH-FAILURES-NO-SESSION': { describe: 'SELECT on public.reauth_failures is granted to anon and authenticated', ...grantTo('reauth_failures', 'SELECT', ['anon', 'authenticated']) },
  'SEC-DB-X-NO-SELF-RESTORE': {
    describe: 'an empty public.restore_inactive_account() with EXECUTE for authenticated is created',
    settle: 'schema',
    apply: () => ['create function public.restore_inactive_account() returns void language sql as $f$ select $f$', 'revoke all on function public.restore_inactive_account() from public, anon', 'grant execute on function public.restore_inactive_account() to authenticated'],
    restore: () => ['drop function if exists public.restore_inactive_account()'],
  },
  'SEC-DEL-INT-STAFF': {
    describe: 'public.set_actor_name() no longer fills the kept name column of an actor record (the step that keeps the name of a deleted staff member)',
    capture: async (q) => ({ def: (await q(`select pg_get_functiondef('public.set_actor_name()'::regprocedure) def`))[0].def }),
    apply: () => [`create or replace function public.set_actor_name() returns trigger language plpgsql security definer set search_path = public, pg_temp as $f$ begin return new; end $f$`],
    restore: (ctx) => [ctx.def],
  },
  'SEC-X-INT-REVEAL-TABLE-DENY': { describe: 'SELECT on public.listing_contact_reveals is granted to anon and authenticated', ...grantTo('listing_contact_reveals', 'SELECT', ['anon', 'authenticated']) },
  'SEC-X-INT-REVEAL-TABLE-SERVER': { describe: 'INSERT on public.listing_contact_reveals is revoked from service_role', ...revokeFrom('listing_contact_reveals', 'INSERT', 'service_role') },
}

// PostgREST caches the schema (functions are in it): after a DDL that creates or drops a function the harness asks for a reload and waits until the Data API shows the change
async function settleSchema(c, presentWanted) {
  await c.query(`select pg_notify('pgrst', 'reload schema')`)
  const base = env.NEXT_PUBLIC_SUPABASE_URL
  const until = Date.now() + 30_000
  while (Date.now() < until) {
    const response = await fetch(`${base}/rest/v1/rpc/restore_inactive_account`, { method: 'POST', headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'content-type': 'application/json' }, body: '{}' })
    const present = response.status !== 404
    if (present === presentWanted) return true
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

async function inTransaction(c, statements) {
  await c.query('begin')
  try {
    for (const statement of statements) await c.query(statement)
    await c.query('commit')
  } catch (error) {
    await c.query('rollback').catch(() => undefined)
    throw error
  }
}

const readState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : null)
const say = (value) => console.log(scrub(JSON.stringify(value)))

async function main() {
  const [command, caseId] = process.argv.slice(2)
  const c = await connect()
  const q = async (text, params) => (await c.query(text, params)).rows
  try {
    if (command === 'fingerprint') {
      const f = await fingerprint(c)
      say({ fingerprint: f.sha256, parts: f.parts })
      return
    }
    const spec = BREAKS[caseId]
    if (!spec) { console.error(`unknown break "${caseId}"`); process.exitCode = 2; return }
    if (command === 'break') {
      const active = readState()
      if (active) { console.error(`BLOCKED: a break is still active (${active.caseId}); restore it first`); process.exitCode = 2; return }
      const before = await fingerprint(c)
      const ctx = spec.capture ? await spec.capture(q) : {}
      const restoreSql = spec.restore(ctx)
      fs.writeFileSync(STATE, JSON.stringify({ caseId, fingerprintBefore: before.sha256, partsBefore: before.parts, ctx, restoreSql, at: new Date().toISOString() }))
      try {
        await inTransaction(c, spec.apply(ctx))
      } catch (error) {
        fs.rmSync(STATE, { force: true })   // the transaction was rolled back: nothing is applied, so no break is active
        throw error
      }
      if (spec.settle === 'schema') say({ settled: await settleSchema(c, true) })
      say({ broken: caseId, describe: spec.describe, fingerprintBefore: before.sha256 })
      return
    }
    if (command === 'restore') {
      const state = readState()
      if (!state || state.caseId !== caseId) { say({ restored: caseId, note: 'no active break of this case; nothing to restore' }); return }
      await inTransaction(c, state.restoreSql)
      if (spec.settle === 'schema') say({ settled: await settleSchema(c, false) })
      const after = await fingerprint(c)
      const equal = after.sha256 === state.fingerprintBefore
      if (!equal) {
        const differing = Object.keys(after.parts).filter((k) => after.parts[k] !== state.partsBefore[k])
        say({ BLOCKED: 'the fingerprint after the restore differs from the one before the break', caseId, differing, restoreSql: state.restoreSql })
        process.exitCode = 3
        return
      }
      fs.rmSync(STATE)
      say({ restored: caseId, fingerprintBefore: state.fingerprintBefore, fingerprintAfter: after.sha256, equal })
      return
    }
    console.error(`unknown command "${command}"`)
    process.exitCode = 2
  } finally {
    await c.end()
  }
}
main().catch((e) => { console.error(scrub(e.stack || e.message)); process.exitCode = 1 })
