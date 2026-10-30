/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R43 (a): read-only inventory of what the 41 foreign keys of deletion-facts.txt cannot show. READ-ONLY queries on the approved development database; no row is
// written. Output: docs/sessions/evidence/task923/r9-account-references.json (each finding with the SQL that produced it) and r9-61-deletion-schema-facts.txt.
//   NODE_PATH=<dir with pg> node docs/sessions/evidence/task923/db-catalog/r9-60-account-references.cjs
const fs = require('fs')
const { connect, scrub } = require('./lib.cjs')
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/'

const Q = {
  columnsWithoutKey: `
    with fk as (
      select c.conrelid, unnest(c.conkey) as attnum
      from pg_constraint c where c.contype = 'f' and c.connamespace = 'public'::regnamespace
    )
    select cl.relname as tbl, a.attname as col, format_type(a.atttypid, a.atttypmod) as typ
    from pg_attribute a
    join pg_class cl on cl.oid = a.attrelid and cl.relkind = 'r'
    join pg_namespace n on n.oid = cl.relnamespace and n.nspname = 'public'
    where a.attnum > 0 and not a.attisdropped
      and (a.attname ~* '(^|_)(user|owner|actor|author|sender|reviewer|requester|reporter|agent|buyer|seller|handled|assigned|created_by|updated_by|reviewed_by|changed_by|replied_by)(_|$)'
           or a.attname ~* '(e_?mail|phone|whatsapp|(^|_)name$|first_name|last_name|full_name|company_name|ip_hash|fingerprint)')
      and not exists (select 1 from fk where fk.conrelid = cl.oid and fk.attnum = a.attnum)
    order by 1, 2`,
  userKeys: `
    select cl.relname as tbl, a.attname as col, c.conname, c.confdeltype, a.attnotnull, c.confrelid::regclass::text as references_table
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace and c.confrelid in ('public.users'::regclass, 'auth.users'::regclass)
    order by 1, 2`,
  urlColumns: `
    select table_name as tbl, column_name as col, data_type
    from information_schema.columns
    where table_schema = 'public' and column_name ~* '(url|image|photo|logo|avatar|public_id|cloudinary)'
    order by 1, 2`,
  storageBuckets: `select id, public from storage.buckets order by id`,
  storageObjects: `
    select bucket_id, count(*)::int as objects,
           count(*) filter (where (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')::int as in_a_uuid_folder
    from storage.objects group by bucket_id order by 1`,
  companiesCols: `select column_name, data_type, is_nullable from information_schema.columns where table_schema='public' and table_name='companies' order by ordinal_position`,
  triggersOnDeleted: `
    select event_object_table as tbl, trigger_name, event_manipulation, action_timing
    from information_schema.triggers where event_object_schema = 'public' and event_object_table in ('listing_views','listings','users','listing_contact_events','companies')
    order by 1, 2`,
  viewsCountSemantics: `select count(*)::int as listing_views_rows, count(user_id)::int as with_user from public.listing_views`,
}

;(async () => {
  const c = await connect()
  const out = { takenAt: new Date().toISOString(), note: 'read-only; every finding carries the SQL that produced it', findings: {} }
  try {
    for (const [k, sql] of Object.entries(Q)) {
      const r = await c.query(sql)
      out.findings[k] = { sql: sql.replace(/\s+/g, ' ').trim(), rows: r.rows }
      console.log(k, r.rows.length)
    }
  } catch (e) { console.log('ERROR', scrub(e.message)); out.error = scrub(e.message) } finally { await c.end() }
  fs.writeFileSync(OUT + 'r9-account-references.json', JSON.stringify(out, null, 2) + '\n')
  const lines = []
  lines.push('foreign keys of public tables to public.users / auth.users: tbl.col confdeltype(a=no action, c=cascade, n=set null) notnull')
  for (const r of out.findings.userKeys?.rows ?? []) lines.push(`${r.tbl}.${r.col} -> ${r.references_table} ${r.confdeltype} notnull=${r.attnotnull} (${r.conname})`)
  fs.writeFileSync(OUT + 'r9-61-deletion-schema-facts.txt', lines.join('\n') + '\n')
})()
