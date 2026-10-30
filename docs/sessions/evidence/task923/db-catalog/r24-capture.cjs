/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// READ-ONLY capture of Revision 24 (Task 923 R96; kickoff section 46): one connection, one BEGIN READ ONLY transaction, always ROLLBACKed. Nothing is created, changed or locked
// beyond catalogue and aggregate reads. It writes, under docs/sessions/evidence/task923/:
//   db-catalog/catalog-post-v71.json   the seven keys of catalog.json (tables, policies, grants, colGrants, functions, views, buckets) and the keys of fingerprint.json
//                                      (triggers, defaults, constraints, enums, functionGrants = fingerprint.json's `functions`, policiesMd5, policyCount, extensions, serverVersion)
//   r24-01-catalog-diff.txt            every difference from catalog.json and fingerprint.json, each marked "v7.1" (named in proposed-hardening.sql) or "other"
//   r24-02-counts.txt                  the counts of R96 (b), each with its exact SQL and its result
// No row content beyond ids is read into the output; URL columns are reduced in SQL to scheme + host (+ the cloud name for res.cloudinary.com) before they leave the database;
// every printed line passes scrub(). Run:  node docs/sessions/evidence/task923/db-catalog/r24-capture.cjs --i-confirm-dev-database   (NODE_PATH on a pg@8.21.0 folder)
const fs = require('fs')
const crypto = require('crypto')
const os = require('os')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/'
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex')
const startedAt = new Date().toISOString()
const runLog = []
const log = (s) => { const line = scrub(s); runLog.push(line); console.log(line) }

;(async () => {
  log(`platform ${process.platform} ${os.release()} node ${process.version}; pg ${require('pg/package.json').version} (NODE_PATH, not installed in the repository); start ${startedAt}`)
  log('cmd node docs/sessions/evidence/task923/db-catalog/r24-capture.cjs --i-confirm-dev-database   (R96 (a) and (b): read-only)')
  const c = await connect()
  log('connection 1: opened')
  const cat = {}
  const counts = []
  let ok = false
  try {
    await c.query('BEGIN READ ONLY')
    await c.query('set local search_path = public, pg_temp')
    log(`connection 1: BEGIN READ ONLY; show transaction_read_only = ${(await c.query('show transaction_read_only')).rows[0].transaction_read_only}`)
    const q = async (s, p) => (await c.query(s, p)).rows

    // ── (a) the catalogue: the seven keys of catalog.json ──────────────────────────────────────────────────────────────────────────────────
    cat.tables = await q(`select n.nspname as schema, c.relname as "table", c.relkind, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls, coalesce(c.reloptions::text, '') as options
      from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p') order by 2`)
    cat.policies = await q(`select schemaname as schema, tablename as "table", policyname as policy, permissive, roles::text as roles, cmd, qual, with_check from pg_policies
      where schemaname in ('public', 'storage') order by 1, 2, 3`)
    cat.grants = await q(`select table_schema as schema, table_name as "table", grantee, string_agg(privilege_type, ',' order by privilege_type) as privileges from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 1, 2, 3 order by 2, 3`)
    // catalog.json's colGrants is the INSERT and UPDATE rows of information_schema.column_privileges (a column counts when the role holds the privilege through the table or the column):
    // users/anon has 29 columns x 2 privileges = 58 entries there, listing_reports/authenticated (INSERT only) has 7
    cat.colGrants = await q(`select table_name as "table", grantee, string_agg(column_name || ':' || privilege_type, ',' order by column_name, privilege_type) as cols
      from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon', 'authenticated') and privilege_type in ('INSERT', 'UPDATE') group by 1, 2 order by 1, 2`)
    cat.functions = await q(`select p.proname as name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer, p.proconfig::text as config, p.proacl::text as acl,
        l.lanname as lang, p.provolatile as volatility, pg_get_functiondef(p.oid) as def
      from pg_proc p join pg_language l on l.oid = p.prolang where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p') order by 1, 2`)
    cat.views = await q(`select c.relname as "view", c.reloptions::text as options from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'v' order by 1`)
    cat.buckets = await q(`select id, public from storage.buckets order by id`)

    // ── (a) the fingerprint keys of fingerprint.json (same queries as fingerprint.cjs) ─────────────────────────────────────────────────────────
    cat.triggers = await q(`select n.nspname as schema, c.relname as tbl, t.tgname as name, t.tgenabled as enabled, pg_get_triggerdef(t.oid) as def
      from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal and n.nspname in ('public', 'auth', 'storage') order by 1, 2, 3`)
    cat.defaults = await q(`select table_name as tbl, column_name as col, data_type, is_nullable as nullable, column_default as def
      from information_schema.columns where table_schema = 'public' and table_name in ('users', 'listings', 'listing_views', 'recently_viewed') order by 1, ordinal_position`)
    cat.constraints = await q(`select conrelid::regclass::text as tbl, conname, contype, pg_get_constraintdef(oid) as def from pg_constraint
      where connamespace = 'public'::regnamespace and conrelid::regclass::text in ('users', 'listings', 'listing_views', 'recently_viewed') order by 1, 2`)
    cat.enums = await q(`select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels from pg_type t join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' group by 1 order by 1`)
    cat.functionGrants = cat.functions.map((f) => ({ name: f.name, args: f.args, securityDefiner: f.security_definer, acl: f.acl || '', md5: md5(f.def) }))
    const pol = await q(`select schemaname, tablename, policyname, cmd, roles::text as roles, qual, with_check from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3`)
    cat.policiesMd5 = md5(JSON.stringify(pol))
    cat.policyCount = pol.length
    cat.serverVersion = (await q(`select current_setting('server_version') as v`))[0].v
    cat.extensions = (await q(`select extname from pg_extension order by 1`)).map((r) => r.extname)
    cat.takenAt = new Date().toISOString()

    // ── (b) the counts ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    const add = async (id, title, sql, cite, opts = {}) => {
      const entry = { id, title, sql: sql.replace(/\s+\n/g, '\n').trim(), cite: cite || '' }
      try { entry.rows = await q(sql) } catch (e) { entry.error = `${e.code || ''} ${e.message}`.trim() }
      counts.push(entry)
      return entry
    }
    const idsOf = (sqlWhere, table) => `select id::text as id from public.${table} where ${sqlWhere} order by id limit 20`

    // R69 (b): listings CHECKs (bounds from src/modules/listings/validations/index.ts)
    const L = 'src/modules/listings/validations/index.ts'
    await add('B1', 'R69 (b) listings.title: null, shorter than 5 after trim, or longer than 150', `select count(*) as breaking from public.listings where title is null or char_length(btrim(title)) < 5 or char_length(title) > 150`, `${L}:7 title: z.string().trim().min(5).max(150)`)
    await add('B1a', 'R69 (b) listings.title: ids of the breaking rows (at most 20)', idsOf(`title is null or char_length(btrim(title)) < 5 or char_length(title) > 150`, 'listings'), '')
    await add('B2', 'R69 (b) listings.description: longer than 5000', `select count(*) as breaking from public.listings where char_length(description) > 5000`, `${L}:8 description: z.string().max(5000)`)
    await add('B3', 'R69 (b) listings.price: null or not above 0', `select count(*) as breaking from public.listings where price is null or price <= 0`, `${L}:9 price: z.number().positive()`)
    await add('B3a', 'R69 (b) listings.price: ids of the breaking rows (at most 20)', idsOf(`price is null or price <= 0`, 'listings'), '')
    await add('B4', 'R69 (b) listings.price_old: not null and not above 0', `select count(*) as breaking from public.listings where price_old is not null and price_old <= 0`, `${L}:10 price_old: z.number().positive().optional()`)
    await add('B4a', 'R69 (b) listings.price_old: ids of the breaking rows (at most 20)', idsOf(`price_old is not null and price_old <= 0`, 'listings'), '')
    await add('B5', 'R69 (b) price and price_old CEILING (R72 (d)): the largest stored values and the rows above round values. The Zod schema has NO ceiling today (price is only .positive(), line 9), so no bound can be cited and the number is for Opus to choose',
      `select max(price) as max_price, max(price_old) as max_price_old,
         count(*) filter (where price > 1e6 or price_old > 1e6) as above_1e6, count(*) filter (where price > 1e7 or price_old > 1e7) as above_1e7,
         count(*) filter (where price > 1e8 or price_old > 1e8) as above_1e8, count(*) filter (where price > 1e9 or price_old > 1e9) as above_1e9,
         count(*) filter (where price > 1e10 or price_old > 1e10) as above_1e10, count(*) as listings_total from public.listings`, `${L}:9-10 (no ceiling in the working tree)`)
    await add('B6', 'R69 (b) listings.lat: outside -90..90', `select count(*) as breaking from public.listings where lat is not null and (lat < -90 or lat > 90 or lat = 'NaN'::float8)`, `${L}:30 lat: z.number().min(-90).max(90).optional()`)
    await add('B7', 'R69 (b) listings.lng: outside -180..180', `select count(*) as breaking from public.listings where lng is not null and (lng < -180 or lng > 180 or lng = 'NaN'::float8)`, `${L}:31 lng: z.number().min(-180).max(180).optional()`)

    // URL prefixes: scheme + host (+ the cloud name for res.cloudinary.com) only; the rest of the URL never leaves the database
    const prefixSql = (table, col, where) => `select case
        when ${col} is null then '<null>'
        when ${col} ~ '^https://res\\.cloudinary\\.com/[^/]+/' then substring(${col} from '^(https://res\\.cloudinary\\.com/[^/]+)/')
        when ${col} ~ '^https?://[^/]+' then substring(${col} from '^(https?://[^/]+)') || ' (other host: path not shown)'
        else '<not an http(s) URL>' end as prefix, count(*) as rows
      from public.${table} ${where || ''} group by 1 order by 2 desc, 1`
    const imgP = await add('P1', 'URL prefixes of listing_images.url (R69 (c))', prefixSql('listing_images', 'url'), '')
    await add('P2', 'URL prefixes of users.avatar_url (R69 (d))', prefixSql('users', 'avatar_url'), '')
    await add('P3', 'URL prefixes of users.company_logo_url (R69 (d))', prefixSql('users', 'company_logo_url'), '')

    // the project's own cloud, read from the stored listing_images URLs (R69 (c)): the cloud names found
    const clouds = (imgP.rows || []).filter((r) => r.prefix.startsWith('https://res.cloudinary.com/'))
    const project = clouds.length ? clouds[0].prefix : null
    const projectNote = project ? `project prefix taken from listing_images: ${project}/ (${clouds.length} cloud name(s) found: ${clouds.map((x) => x.prefix.split('/').pop()).join(', ')})` : 'no Cloudinary URL found in listing_images'
    counts.push({ id: 'P0', title: 'The project cloud prefix used by the checks below (R69 (c), (d))', sql: '(derived in the script from the result of P1: the most frequent https://res.cloudinary.com/<cloud> prefix)', cite: '', rows: [{ note: projectNote }] })
    if (project) {
      const lit = `${project}/`.replace(/'/g, "''")
      await add('B8', 'R69 (c) listing_images.url: not starting with the project prefix (null counts as breaking)', `select count(*) as breaking from public.listing_images where url is null or left(url, ${lit.length}) <> '${lit}'`, 'src/lib/uploads/imageUrl.ts:13-24 isTrustedImageUrl: https, host res.cloudinary.com, path starts /<cloud>/')
      await add('B8a', 'R69 (c) listing_images.url: ids of the breaking rows (at most 20)', idsOf(`url is null or left(url, ${lit.length}) <> '${lit}'`, 'listing_images'), '')
      await add('B9', 'R69 (d) users.avatar_url: not null and not starting with the project prefix', `select count(*) as breaking from public.users where avatar_url is not null and left(avatar_url, ${lit.length}) <> '${lit}'`, 'no Zod bound; the column is written by the avatar upload route and by sign-in providers (see r24-03 section 1)')
      await add('B9a', 'R69 (d) users.avatar_url: ids of the breaking rows (at most 20)', idsOf(`avatar_url is not null and left(avatar_url, ${lit.length}) <> '${lit}'`, 'users'), '')
      await add('B10', 'R69 (d) users.company_logo_url: not null and not starting with the project prefix', `select count(*) as breaking from public.users where company_logo_url is not null and left(company_logo_url, ${lit.length}) <> '${lit}'`, 'src/components/admin/AdminUserProfile.tsx:73 companyLogoUrl: z.string().optional() (no bound)')
      await add('B10a', 'R69 (d) users.company_logo_url: ids of the breaking rows (at most 20)', idsOf(`company_logo_url is not null and left(company_logo_url, ${lit.length}) <> '${lit}'`, 'users'), '')
    }
    // R69 (d) users: website, phone, whatsapp, name, last_name
    await add('B11', 'R69 (d) users.website: not null and not starting with http:// or https://', `select count(*) as breaking from public.users where website is not null and website !~* '^https?://'`, 'src/modules/admin/actions/index.ts:438-441 normalizeWebsite -> src/lib/security/safeUrl.ts:19 safeExternalUrl (stores href; scheme http(s)); AdminUserProfile.tsx:74 website: z.string().optional() (no bound)')
    await add('B11a', 'R69 (d) users.website: ids of the breaking rows (at most 20)', idsOf(`website is not null and website !~* '^https?://'`, 'users'), '')
    await add('B12', 'R69 (d) users.website: longer than 200 characters', `select count(*) as breaking from public.users where char_length(website) > 200`, 'no Zod bound; safeUrl.ts:22 allows up to 2048')
    await add('B13', 'R69 (d) users.phone: not null and not E.164 (^\\+[1-9][0-9]{7,14}$)', `select count(*) as breaking from public.users where phone is not null and phone !~ '^\\+[1-9][0-9]{7,14}$'`, 'src/lib/phone/index.ts:255 E164_GUARD = /^\\+[1-9]\\d{7,14}$/ (applied at :319 by validateNationalPhone); AdminUserProfile.tsx:68 phone: z.string() (no bound)')
    await add('B13a', 'R69 (d) users.phone: ids of the breaking rows (at most 20)', idsOf(`phone is not null and phone !~ '^\\+[1-9][0-9]{7,14}$'`, 'users'), '')
    await add('B14', 'R69 (d) users.whatsapp: not null and not E.164', `select count(*) as breaking from public.users where whatsapp is not null and whatsapp !~ '^\\+[1-9][0-9]{7,14}$'`, 'src/lib/phone/index.ts:255 E164_GUARD; AdminUserProfile.tsx:70 whatsapp: z.string().optional() (no bound)')
    await add('B14a', 'R69 (d) users.whatsapp: ids of the breaking rows (at most 20)', idsOf(`whatsapp is not null and whatsapp !~ '^\\+[1-9][0-9]{7,14}$'`, 'users'), '')
    await add('B15', 'R69 (d) users.name: longer than 100', `select count(*) as breaking from public.users where char_length(name) > 100`, 'src/modules/auth/validations/index.ts:14 name: z.string().trim().min(2).max(100)')
    await add('B16', 'R69 (d) users.last_name: longer than 100', `select count(*) as breaking from public.users where char_length(last_name) > 100`, 'no Zod bound on last_name (AdminUserProfile.tsx:66 lastName: z.string().min(1); AdminUserCreate.tsx:45 lastName: z.string().optional()); 100 is the bound R69 (d) names')
    // R69 (e): the avatars bucket
    await add('B17', 'R69 (e) storage.objects in the avatars bucket', `select count(*) as objects from storage.objects where bucket_id = 'avatars'`, '')
    // R78 (a): exchange_providers (ids only, never a key)
    await add('B18', 'R78 (a) rows of public.exchange_providers', `select count(*) as rows from public.exchange_providers`, '')
    await add('B18a', 'R78 (a) ids of public.exchange_providers (no other column is read)', `select id::text as id from public.exchange_providers order by id`, '')
    // R75 (c): role_permissions
    await add('B19', 'R75 (c) constraints of public.role_permissions (does the table restrict the text of permission_key?)', `select c.conname as name, c.contype as type, pg_get_constraintdef(c.oid) as def from pg_constraint c where c.conrelid = 'public.role_permissions'::regclass order by 1`, '')
    await add('B19a', 'R75 (c) column types of public.role_permissions', `select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' and table_name = 'role_permissions' order by ordinal_position`, '')
    await add('B19b', 'R75 (c) triggers on public.role_permissions', `select t.tgname as name, pg_get_triggerdef(t.oid) as def from pg_trigger t where t.tgrelid = 'public.role_permissions'::regclass and not t.tgisinternal order by 1`, '')
    await add('B19c', 'R75 (c) the permission keys stored today (configuration keys, no personal data): role, key, allowed', `select role, permission_key, allowed from public.role_permissions order by role, permission_key`, 'src/lib/auth/permissionKeys.ts (PERMISSION_KEYS)')
    // R79 (b): which existing table could store a rate set
    await add('B20', 'R79 (b) tables of public with a column that could store a rate set: a column named like rate/currenc/exchange, or of type json/jsonb (table and columns only)',
      `select table_name as "table", string_agg(column_name || ' ' || data_type, ', ' order by ordinal_position) as columns from information_schema.columns
       where table_schema = 'public' and table_name in (select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE')
         and (column_name ilike '%rate%' or column_name ilike '%currenc%' or column_name ilike '%exchange%' or data_type in ('json', 'jsonb')) group by 1 order by 1`, '')
    await add('B20a', 'R79 (b) public.currency_rates: columns and row count', `select (select count(*) from public.currency_rates) as rows, (select string_agg(column_name || ' ' || data_type, ', ' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'currency_rates') as columns`, '')

    await c.query('ROLLBACK')
    ok = true
    log('connection 1: ROLLBACK done (the transaction was read only; nothing was written)')
  } catch (e) {
    try { await c.query('ROLLBACK') } catch { /* read only */ }
    log(`CAPTURE ERROR: ${e.code || ''} ${scrub(e.message)}`)
  } finally {
    await c.end()
    log('connection 1: closed')
  }
  if (!ok) process.exit(1)

  // ── write the catalogue ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  fs.writeFileSync(D + 'db-catalog/catalog-post-v71.json', JSON.stringify(cat, null, 1))
  log(`wrote db-catalog/catalog-post-v71.json: ${Object.keys(cat).map((k) => `${k}=${Array.isArray(cat[k]) ? cat[k].length : typeof cat[k] === 'string' ? 'string' : cat[k]}`).join(' ')}`)

  // ── the diff against catalog.json and fingerprint.json ─────────────────────────────────────────────────────────────────────────────────────
  const old = require(D + 'db-catalog/catalog.json')
  const oldFp = require(D + 'db-catalog/fingerprint.json')
  const sql = fs.readFileSync(D + 'db-catalog/proposed-hardening.sql', 'utf8')
  const sqlLines = sql.split(/\r?\n/)
  const has = (word) => word && new RegExp(`(^|[^a-z0-9_])${String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9_]|$)`, 'i').test(sql)
  const hasInStatement = (re, word) => sqlLines.some((l) => re.test(l) && new RegExp(`(^|[^a-z0-9_])${word}([^a-z0-9_]|$)`, 'i').test(l))
  const diffs = []
  const mark = (key, object, kind, detail, token) => diffs.push({ key, object, kind, detail, via: token || '' })
  const trunc = (s, n = 150) => { const t = String(s ?? '∅').replace(/\s+/g, ' '); return t.length > n ? t.slice(0, n) + '…' : t }
  const byKey = (arr, kf) => new Map(arr.map((x) => [kf(x), x]))
  const compare = (key, oldArr, newArr, kf, fields, tokenOf) => {
    const o = byKey(oldArr, kf), n = byKey(newArr, kf)
    for (const [k, v] of n) {
      if (!o.has(k)) { mark(key, k, 'added', fields.map((f) => `${f}=${trunc(v[f], 100)}`).join('; '), tokenOf(k, v)); continue }
      const ov = o.get(k)
      const changed = fields.filter((f) => String(ov[f] ?? '') !== String(v[f] ?? ''))
      if (changed.length) mark(key, k, 'changed', changed.map((f) => f === 'def' && key.startsWith('functions') ? `def md5 ${md5(String(ov[f]))} -> ${md5(String(v[f]))}` : `${f}: ${trunc(ov[f])} -> ${trunc(v[f])}`).join(' | '), tokenOf(k, v))
    }
    for (const [k, v] of o) if (!n.has(k)) mark(key, k, 'removed', fields.map((f) => `${f}=${trunc(v[f], 100)}`).join('; '), tokenOf(k, v))
  }
  // each object is "v7.1" when proposed-hardening.sql names it by the most specific word the object has
  const tokOf = (field) => (k, v) => {
    const w = v?.[field] ?? String(k).split('.').pop()
    return has(w) ? w : null
  }
  compare('tables', old.tables, cat.tables, (x) => x.table, ['relkind', 'rls', 'force_rls', 'options'], (k) => (hasInStatement(/(create|alter|drop)\s+(table|view)/i, k) || hasInStatement(/enable row level security/i, k) ? k : null))
  compare('policies', old.policies, cat.policies, (x) => `${x.schema}.${x.table}.${x.policy}`, ['permissive', 'roles', 'cmd', 'qual', 'with_check'], tokOf('policy'))
  // S65 (v7.1): one statement, `revoke truncate on all tables in schema public from anon, authenticated`, so a grant that only lost TRUNCATE is named by that statement
  const truncateRevoke = /revoke\s+truncate\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon,\s*authenticated/i.test(sql)
  const o0 = byKey(old.grants, (x) => `${x.table}/${x.grantee}`)
  compare('grants', old.grants, cat.grants, (x) => `${x.table}/${x.grantee}`, ['privileges'], (k, v) => {
    const before = o0.get(k)?.privileges
    if (truncateRevoke && before && before.split(',').filter((p) => p !== 'TRUNCATE').join(',') === v.privileges && before !== v.privileges) return 'revoke truncate on all tables in schema public'
    return hasInStatement(/(grant|revoke)/i, v.table) ? v.table : null
  })
  // column grants are compared as sets of col:PRIVILEGE
  {
    const setOf = (s) => new Set(String(s || '').split(',').filter(Boolean))
    const o = byKey(old.colGrants, (x) => `${x.table}/${x.grantee}`), n = byKey(cat.colGrants, (x) => `${x.table}/${x.grantee}`)
    for (const k of new Set([...o.keys(), ...n.keys()])) {
      const a = setOf(o.get(k)?.cols), b = setOf(n.get(k)?.cols)
      const gone = [...a].filter((x) => !b.has(x)), came = [...b].filter((x) => !a.has(x))
      if (!gone.length && !came.length) continue
      const tbl = k.split('/')[0]
      // a privilege that appears only because a column was added (the table-level grant covers a new column) is named by the ALTER TABLE ... ADD COLUMN of the file
      const addedColumns = [...new Set(came.map((x) => x.split(':')[0]))]
      const viaColumn = !gone.length && addedColumns.length && addedColumns.every((col) => hasInStatement(/add\s+column/i, col)) ? `add column ${addedColumns.join(', ')}` : null
      mark('colGrants', k, !o.has(k) ? 'added' : !n.has(k) ? 'removed' : 'changed', `${came.length} column privilege(s) added${came.length ? ' (' + trunc(came.join(','), 90) + ')' : ''}; ${gone.length} removed${gone.length ? ' (' + trunc(gone.join(','), 90) + ')' : ''}`, viaColumn || (hasInStatement(/(grant|revoke)/i, tbl) ? tbl : null))
    }
  }
  compare('functions', old.functions, cat.functions, (x) => `${x.name}(${x.args})`, ['security_definer', 'config', 'acl', 'lang', 'volatility', 'def'], (k, v) => (has(v.name) ? v.name : null))
  compare('views', old.views, cat.views, (x) => x.view, ['options'], (k) => (has(k) ? k : null))
  compare('buckets', old.buckets, cat.buckets, (x) => x.id, ['public'], (k) => (hasInStatement(/(storage\.buckets|bucket)/i, k) ? k : null))
  compare('triggers', oldFp.triggers, cat.triggers, (x) => `${x.schema}.${x.tbl}.${x.name}`, ['enabled', 'def'], tokOf('name'))
  compare('defaults', oldFp.defaults, cat.defaults, (x) => `${x.tbl}.${x.col}`, ['data_type', 'nullable', 'def'], (k, v) => (has(v.col) ? v.col : null))
  compare('constraints', oldFp.constraints, cat.constraints, (x) => `${x.tbl}.${x.conname}`, ['contype', 'def'], tokOf('conname'))
  compare('enums', oldFp.enums, cat.enums, (x) => x.typname, ['labels'], tokOf('typname'))
  compare('functionGrants (fingerprint.functions)', oldFp.functions, cat.functionGrants, (x) => `${x.name}(${x.args})`, ['securityDefiner', 'acl', 'md5'], (k, v) => (has(v.name) ? v.name : null))
  for (const f of ['serverVersion', 'policyCount', 'policiesMd5']) if (String(oldFp[f]) !== String(cat[f])) mark('fingerprint', f, 'changed', `${oldFp[f]} -> ${cat[f]}`, f === 'serverVersion' ? null : 'derived from the policy list')
  { const a = new Set(oldFp.extensions), b = new Set(cat.extensions); for (const x of b) if (!a.has(x)) mark('extensions', x, 'added', '', null); for (const x of a) if (!b.has(x)) mark('extensions', x, 'removed', '', null) }
  for (const d of diffs) d.mark = d.via ? 'v7.1' : 'other'

  const out = []
  out.push(...runLog.slice(0, 4))
  out.push('R96 (a): every difference between catalog.json + fingerprint.json (taken 2026-10-17) and catalog-post-v71.json (this run), each marked "v7.1" or "other".')
  out.push('Rule for the mark: "v7.1" when docs/sessions/evidence/task923/db-catalog/proposed-hardening.sql (the applied file) names the object by its most specific word (policy, trigger, constraint, enum, function or column name; for a table or grant, a CREATE/ALTER/DROP/ENABLE RLS or GRANT/REVOKE statement that names the table); the word that matched is shown after "via". Everything else is "other".')
  out.push(`Totals: ${diffs.length} differences; v7.1 ${diffs.filter((d) => d.mark === 'v7.1').length}; other ${diffs.filter((d) => d.mark === 'other').length}.`)
  out.push('')
  const keys = [...new Set(diffs.map((d) => d.key))]
  for (const k of keys) {
    const list = diffs.filter((d) => d.key === k)
    out.push(`== ${k}: ${list.length} difference(s) (v7.1 ${list.filter((d) => d.mark === 'v7.1').length}, other ${list.filter((d) => d.mark === 'other').length})`)
    for (const d of list) out.push(`[${d.mark}] ${d.object} ${d.kind}${d.via ? ` (via ${d.via})` : ''}${d.detail ? ': ' + d.detail : ''}`)
    out.push('')
  }
  const others = diffs.filter((d) => d.mark === 'other')
  out.push(`== OTHER differences (${others.length}):`)
  if (!others.length) out.push('none')
  for (const d of others) out.push(`${d.key} | ${d.object} | ${d.kind}${d.detail ? ' | ' + d.detail : ''}`)
  out.push('', 'read-only evidence of the run:', ...runLog.filter((l) => /connection 1/.test(l)))
  fs.writeFileSync(D + 'r24-01-catalog-diff.txt', scrub(out.join('\n')) + '\n')
  log(`wrote r24-01-catalog-diff.txt: ${diffs.length} differences (v7.1 ${diffs.length - others.length}, other ${others.length})`)

  // ── the counts file ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const co = []
  co.push(...runLog.slice(0, 4))
  co.push('R96 (b): counts. Every entry has its exact SQL and its result. Only counts, ids, URL prefixes (scheme + host, plus the cloud name for res.cloudinary.com) and configuration keys are printed; no URL path, key or personal value.')
  co.push('')
  for (const e of counts) {
    co.push(`## ${e.id}  ${e.title}`)
    if (e.cite) co.push(`bound / source: ${e.cite}`)
    co.push('SQL:', ...e.sql.split('\n').map((l) => '  ' + l))
    if (e.error) co.push(`RESULT: ERROR ${e.error}`)
    else co.push(`RESULT (${e.rows.length} row${e.rows.length === 1 ? '' : 's'}):`, ...e.rows.map((r) => '  ' + JSON.stringify(r, (_, v) => (typeof v === 'bigint' ? v.toString() : v))))
    co.push('')
  }
  co.push('read-only evidence of the run:', ...runLog.filter((l) => /connection 1/.test(l)))
  fs.writeFileSync(D + 'r24-02-counts.txt', scrub(co.join('\n')) + '\n')
  log(`wrote r24-02-counts.txt: ${counts.length} entries (${counts.filter((e) => e.error).length} with an error)`)
})()
