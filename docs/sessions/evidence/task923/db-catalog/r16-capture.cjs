/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// READ-ONLY capture of Revision 16 (Task 923 R62 (b); kickoff section 26): one BEGIN READ ONLY transaction on the approved development database, always ROLLBACKed; nothing is created,
// changed or locked beyond catalog reads. Writes docs/sessions/evidence/task923/r16-00-capture.json, which gen-sql-deletion.cjs reads:
//   tables    public.pages and public.site_footer: owner, relacl (the table-level ACL), RLS flag, and the policies
//   columns   every non-dropped column in attnum order with its type and its column-level ACL (attacl; null when none)
//   ri        the AFTER DELETE referential-action triggers on auth.users and on public.users, in the order PostgreSQL fires them (alphabetical by name), each with its constraint,
//             its child table and its delete rule (R62 (c): which parent row is gone when a SET NULL of a key to auth.users runs)
// No connection detail and no row data is read or printed: every printed line passes scrub().
//   node docs/sessions/evidence/task923/db-catalog/r16-capture.cjs --i-confirm-dev-database
const fs = require('fs')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/'
const TABLES = ['pages', 'site_footer']

;(async () => {
  const c = await connect()
  const out = { takenAt: new Date().toISOString() }
  try {
    await c.query('BEGIN READ ONLY')
    await c.query('set local search_path = public, pg_temp')
    const q = async (s, p) => (await c.query(s, p)).rows

    out.tables = await q(`select c.relname as tbl, c.relkind, c.relacl::text as acl, pg_get_userbyid(c.relowner) as owner, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
      from pg_class c where c.relnamespace = 'public'::regnamespace and c.relname = any($1) order by 1`, [TABLES])
    out.columns = await q(`select c.relname as tbl, a.attnum as num, a.attname as col, format_type(a.atttypid, a.atttypmod) as type, a.attacl::text as col_acl
      from pg_attribute a join pg_class c on c.oid = a.attrelid
      where c.relnamespace = 'public'::regnamespace and c.relname = any($1) and a.attnum > 0 and not a.attisdropped order by 1, 2`, [TABLES])
    out.policies = await q(`select tablename as tbl, policyname as name, cmd, roles::text as roles, qual, with_check from pg_policies where schemaname = 'public' and tablename = any($1) order by 1, 2`, [TABLES])
    out.grantsInformationSchema = await q(`select table_name as tbl, grantee, privilege_type as privilege from information_schema.role_table_grants
      where table_schema = 'public' and table_name = any($1) and grantee in ('anon', 'authenticated') order by 1, 2, 3`, [TABLES])

    // R62 (c): the referential-action triggers that fire when a row of auth.users / public.users is deleted, in firing order (PostgreSQL sorts same-event triggers by name, byte order)
    const ri = await q(`select cl.relnamespace::regnamespace::text || '.' || cl.relname as parent, t.tgname as trigger, t.tgenabled as enabled, con.conname as constraint,
        (select n.nspname || '.' || k.relname from pg_class k join pg_namespace n on n.oid = k.relnamespace where k.oid = con.conrelid) as child, con.confdeltype as delete_rule,
        p.proname as fn
      from pg_trigger t join pg_class cl on cl.oid = t.tgrelid join pg_constraint con on con.oid = t.tgconstraint join pg_proc p on p.oid = t.tgfoid
      where t.tgisinternal and con.confrelid = cl.oid and cl.oid = any(array['auth.users'::regclass, 'public.users'::regclass]) and p.proname like 'RI\\_FKey\\_%\\_del'`)
    const byteOrder = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
    out.ri = ri.sort((a, b) => byteOrder(a.parent, b.parent) || byteOrder(a.trigger, b.trigger)).map((r, i, all) => ({ ...r, position: all.filter((x) => x.parent === r.parent).indexOf(r) + 1 }))

    // R63, R64, R65 (hardening v7): what the new guard, the old-price trigger and the two new functions rely on
    out.listingsColumns = await q(`select a.attname as col, format_type(a.atttypid, a.atttypmod) as type, a.attnotnull as notnull, pg_get_expr(d.adbin, d.adrelid) as def
      from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where a.attrelid = 'public.listings'::regclass and a.attnum > 0 and not a.attisdropped order by a.attnum`)
    out.listingsTriggers = await q(`select t.tgname as name, t.tgenabled as enabled, pg_get_triggerdef(t.oid) as def from pg_trigger t where t.tgrelid = 'public.listings'::regclass and not t.tgisinternal order by 1`)
    out.listingsConstraints = await q(`select c.conname as name, c.contype as type, pg_get_constraintdef(c.oid) as def from pg_constraint c where c.conrelid = 'public.listings'::regclass and c.contype in ('c', 'u', 'p') order by 1`)
    out.publicIdSequence = (await q(`select c.relname as name, pg_get_userbyid(c.relowner) as owner, s.seqtypid::regtype::text as type, s.seqincrement as increment, s.seqmax as max, s.seqcycle as cycle
      from pg_class c join pg_sequence s on s.seqrelid = c.oid where c.oid = 'public.listings_public_id_seq'::regclass`))[0] || null
    out.currencyColumns = await q(`select table_name as tbl, column_name as col, data_type as type, is_nullable as nullable, column_default as def from information_schema.columns
      where table_schema = 'public' and (table_name ilike '%currenc%' or table_name ilike '%exchange%' or table_name ilike '%rate%') order by table_name, ordinal_position`)
    out.currencyConstraints = await q(`select c.conrelid::regclass::text as tbl, c.conname as name, c.contype as type, pg_get_constraintdef(c.oid) as def from pg_constraint c
      where c.conrelid in (select cl.oid from pg_class cl where cl.relnamespace = 'public'::regnamespace and cl.relkind = 'r' and (cl.relname ilike '%currenc%' or cl.relname ilike '%exchange%' or cl.relname ilike '%rate%')) order by 1, 2`)
    // R64 (a): can the database convert a starting price at "the rate the site uses at that moment"? Public exchange-rate data only (pairs, rates, times), no personal data.
    out.currencyRatesRows = await q(`select from_currency, to_currency, rate::text as rate, source_url, fetched_at from public.currency_rates order by from_currency, to_currency`)
    out.listingCurrencyLabels = (await q(`select e.enumlabel as label from pg_enum e where e.enumtypid = 'public.listing_currency'::regtype order by e.enumsortorder`)).map((x) => x.label)
    out.currenciesRows = await q(`select code, is_active, is_default from public.currencies order by id`)
    out.authSessionsReferrers = await q(`select c.conrelid::regclass::text as child, c.conname as name, c.confdeltype as delete_rule, pg_get_constraintdef(c.oid) as def from pg_constraint c where c.confrelid = 'auth.sessions'::regclass and c.contype = 'f' order by 1`)
    out.authSessionsPrivileges = (await q(`select has_table_privilege(current_user, 'auth.sessions', 'DELETE') as can_delete, has_table_privilege(current_user, 'auth.sessions', 'SELECT') as can_select`))[0]
    await c.query('ROLLBACK')
  } catch (e) {
    try { await c.query('ROLLBACK') } catch { /* the transaction is read only */ }
    console.log('CAPTURE ERROR:', scrub(e.message))
    await c.end()
    process.exit(1)
  }
  await c.end()
  fs.writeFileSync(D + 'r16-00-capture.json', JSON.stringify(out, null, 1))
  const line = (s) => console.log(scrub(s))
  line(`captured ${out.takenAt}`)
  for (const t of out.tables) {
    const cols = out.columns.filter((x) => x.tbl === t.tbl)
    line(`${t.tbl}: owner ${t.owner}, rls ${t.rls}, force_rls ${t.force_rls}, relacl ${t.acl}`)
    line(`  ${cols.length} columns: ${cols.map((x) => x.col).join(', ')}`)
    line(`  columns with a column-level ACL: ${cols.filter((x) => x.col_acl !== null).map((x) => `${x.col}=${x.col_acl}`).join('; ') || 'none'}`)
    line(`  policies: ${out.policies.filter((p) => p.tbl === t.tbl).map((p) => `${p.name} [${p.cmd} ${p.roles}] using ${p.qual}`).join(' | ') || 'none'}`)
  }
  line(`information_schema grants to anon / authenticated: ${out.grantsInformationSchema.map((g) => `${g.tbl}.${g.grantee}.${g.privilege}`).join(' ')}`)
  for (const parent of ['auth.users', 'public.users']) {
    line(`RI triggers on ${parent} in firing order:`)
    for (const r of out.ri.filter((x) => x.parent === parent)) line(`  ${String(r.position).padStart(2)}. ${r.trigger}  ${r.fn}  ${r.constraint} on ${r.child} (delete rule ${r.delete_rule}, enabled ${r.enabled})`)
  }
  line('public.listings columns:')
  for (const x of out.listingsColumns) line(`  ${x.col} ${x.type}${x.notnull ? ' not null' : ''}${x.def ? ' default ' + x.def : ''}`)
  line(`public.listings triggers: ${out.listingsTriggers.map((t) => `${t.name}[${t.enabled}]`).join(' ') || 'none'}`)
  for (const t of out.listingsTriggers) line(`  ${t.def}`)
  line('public.listings constraints (check / unique / primary):')
  for (const x of out.listingsConstraints) line(`  ${x.name} (${x.type}) ${x.def}`)
  line(`listings_public_id_seq: ${JSON.stringify(out.publicIdSequence)}`)
  line('currency-related columns:')
  for (const x of out.currencyColumns) line(`  ${x.tbl}.${x.col} ${x.type} nullable=${x.nullable}${x.def ? ' default ' + x.def : ''}`)
  line('currency-related constraints:')
  for (const x of out.currencyConstraints) line(`  ${x.tbl} ${x.name} (${x.type}) ${x.def}`)
  line(`public.currency_rates: ${out.currencyRatesRows.length} rows${out.currencyRatesRows.length ? ` (fetched_at ${out.currencyRatesRows.map((x) => new Date(x.fetched_at).toISOString()).sort()[0]} .. ${out.currencyRatesRows.map((x) => new Date(x.fetched_at).toISOString()).sort().at(-1)})` : ''}`)
  for (const x of out.currencyRatesRows) line(`  ${x.from_currency} -> ${x.to_currency} rate ${x.rate} source ${x.source_url} fetched ${new Date(x.fetched_at).toISOString()}`)
  line(`listing_currency labels: ${out.listingCurrencyLabels.join(', ')}`)
  line(`public.currencies: ${out.currenciesRows.map((x) => `${x.code}[active=${x.is_active},default=${x.is_default}]`).join(' ')}`)
  line('keys that reference auth.sessions:')
  for (const x of out.authSessionsReferrers) line(`  ${x.child} ${x.name} delete rule ${x.delete_rule}: ${x.def}`)
  line(`the capture role may delete from auth.sessions: ${out.authSessionsPrivileges.can_delete}; select: ${out.authSessionsPrivileges.can_select}`)
})()
