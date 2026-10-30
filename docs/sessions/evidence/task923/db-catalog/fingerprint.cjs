/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// READ-ONLY schema fingerprint: complete trigger inventory (public + auth), defaults, constraints, enums, grants of functions, md5 of definitions.
const fs = require('fs'), crypto = require('crypto')
const { connect, scrub } = require('./lib.cjs')
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/fingerprint.json'
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex')
;(async () => {
  const c = await connect()
  try {
    await c.query('BEGIN READ ONLY')
    const q = async (s) => (await c.query(s)).rows
    const triggers = await q(`select n.nspname schema, c.relname tbl, t.tgname name, t.tgenabled enabled, pg_get_triggerdef(t.oid) def
      from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
      where not t.tgisinternal and n.nspname in ('public','auth','storage') order by 1,2,3`)
    const defaults = await q(`select table_name tbl, column_name col, data_type, is_nullable nullable, column_default def
      from information_schema.columns where table_schema='public' and table_name in ('users','listings','listing_views','recently_viewed') order by 1, ordinal_position`)
    const constraints = await q(`select conrelid::regclass::text tbl, conname, contype, pg_get_constraintdef(oid) def from pg_constraint
      where connamespace='public'::regnamespace and conrelid::regclass::text in ('users','listings','listing_views','recently_viewed') order by 1,2`)
    const enums = await q(`select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) labels from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by 1 order by 1`)
    const functions = await q(`select p.proname name, pg_get_function_identity_arguments(p.oid) args, p.prosecdef secdef, coalesce(p.proacl::text,'') acl, pg_get_functiondef(p.oid) def
      from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind in ('f','p') order by 1,2`)
    const policies = await q(`select schemaname, tablename, policyname, cmd, roles::text roles, qual, with_check from pg_policies where schemaname in ('public','storage') order by 1,2,3`)
    const version = (await q(`select current_setting('server_version') v`))[0].v
    const exts = (await q(`select extname from pg_extension order by 1`)).map((r) => r.extname)
    await c.query('ROLLBACK')
    const fp = {
      takenAt: new Date().toISOString(), serverVersion: version, extensions: exts,
      triggers, defaults, constraints, enums,
      functions: functions.map((f) => ({ name: f.name, args: f.args, securityDefiner: f.secdef, acl: f.acl, md5: md5(f.def) })),
      policiesMd5: md5(JSON.stringify(policies)), policyCount: policies.length,
    }
    fs.writeFileSync(OUT, JSON.stringify(fp, null, 1))
    const authT = triggers.filter((t) => t.schema === 'auth')
    console.log(`triggers ${triggers.length} (auth ${authT.length}: ${authT.map((t) => t.tbl + '.' + t.name).join(', ')}) | functions ${fp.functions.length} | policies ${policies.length} | enums ${enums.map((e) => e.typname + '=' + e.labels).filter((x) => /user_type|user_role|listing_status/.test(x)).join(' ; ')}`)
    console.log('public triggers:', triggers.filter((t) => t.schema === 'public').map((t) => t.tbl + '.' + t.name).join(', '))
  } catch (e) { try { await c.query('ROLLBACK') } catch {} console.log('FAILED:', e.code || '', scrub(e.message)); process.exit(1) } finally { await c.end() }
})()
