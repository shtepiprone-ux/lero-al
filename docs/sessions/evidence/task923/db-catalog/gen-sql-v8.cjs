/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Generates hardening v8a (kickoff section 47, R97): proposed-hardening-v8a.sql, proposed-hardening-v8a-rollback.sql and proposed-hardening-v8a.dryrun.sql.
// Input: catalog-post-v71.json, the read-only capture of the database after v7.1 (r24-capture.cjs, R96 (a)). Read-only reads of two product sources check the facts the SQL rests on
// (permissionKeys.ts lines 17-24, the Zod bounds of validations/index.ts); no product file is written. Nothing is executed against the database here.
//   node docs/sessions/evidence/task923/db-catalog/gen-sql-v8.cjs
// v8a = the part of hardening v8 that is applied BEFORE the one push (kickoff section 47, C820-C836): R73 (a), R69 (b) without a price ceiling, R69 (c), R69 (e)'s three policies, R75 (c), R75 (f)
// and R86 (c)'s expand step. v8b (R69 (a), R69 (d) with the sign-up trigger change, the price ceiling with R72 (d), R78 (a), R84 and R86 (c)'s contract step) follows the push, with its own revision.
const fs = require('fs')
const crypto = require('crypto')
const ROOT = 'C:/Claude_Code_Projects/lero-al/'
const D = ROOT + 'docs/sessions/evidence/task923/db-catalog/'
const cat = require(D + 'catalog-post-v71.json')
const lit = (s) => "'" + String(s).replace(/'/g, "''") + "'"
const qi = (s) => '"' + String(s).replace(/"/g, '""') + '"'
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex')
const fail = (m) => { throw new Error(m) }

// ── the facts the SQL rests on, read from the working tree (read-only) ────────────────────────────────────────────────────────────────────────
// R75 (c): one row per key of permissionKeys.ts lines 17-24 (C835): the eight keys the release adds
const PK = 'src/lib/auth/permissionKeys.ts'
const pkLines = fs.readFileSync(ROOT + PK, 'utf8').split(/\r?\n/)
const KEYS = pkLines.slice(16, 24).map((l, i) => { const m = /^\s*'([a-z_]+\.[a-z_]+)',\s*$/.exec(l); return m ? m[1] : fail(`${PK}:${17 + i} is not a permission key line: ${l}`) })
if (KEYS.length !== 8 || KEYS[0] !== 'users.edit' || pkLines[24].trim() !== '] as const') fail(`${PK} lines 17-24 are not the eight new keys (C835): ${KEYS.join(', ')}`)
if (new Set(KEYS).size !== 8) fail('duplicate permission key')
// R69 (b): the bounds come from the Zod schema; a line that no longer says what the SQL assumes stops the generator, and the header cites the line it found
const VAL = 'src/modules/listings/validations/index.ts'
const vLines = fs.readFileSync(ROOT + VAL, 'utf8').split(/\r?\n/)
const vFind = (re, what) => { const i = vLines.findIndex((l) => re.test(l)); return i < 0 ? fail(`${VAL}: no line for ${what}`) : i + 1 }
const LN = {
  title: vFind(/^\s*title:\s+z\.string\(\)\.trim\(\)\.min\(5\)\.max\(150\),/, 'title (trim, 5..150)'),
  description: vFind(/^\s*description:\s+z\.string\(\)\.max\(5000\)/, 'description (max 5000)'),
  price: vFind(/^\s*price:\s+z\.number\(\)\.positive\(\),/, 'price (positive)'),
  priceOld: vFind(/^\s*price_old:\s+z\.number\(\)\.positive\(\)\.optional\(\),/, 'price_old (positive)'),
  lat: vFind(/^\s*lat:\s+z\.number\(\)\.min\(-90\)\.max\(90\)/, 'lat (-90..90)'),
  lng: vFind(/^\s*lng:\s+z\.number\(\)\.min\(-180\)\.max\(180\)/, 'lng (-180..180)'),
}
if (vLines.some((l) => /^\s*price(_old)?:.*\.max\(/.test(l))) fail('the Zod schema now has a price ceiling: C834 no longer holds, and v8a has none')
// R73 (a): the photo policy reads the unqualified column listing_id inside a subquery on listings; that is the photo's own column only while listings has no such column
const listingsCols = cat.defaults.filter((d) => d.tbl === 'listings').map((d) => d.col)
if (!listingsCols.includes('lat') || !listingsCols.includes('lng') || !listingsCols.includes('price_old') || listingsCols.includes('listing_id')) fail('listings columns are not what R73 (a) and R69 (b) assume (lat, lng, price_old present; no listing_id)')
const CLOUD = 'https://res.cloudinary.com/die7okukn/'   // R69 (c), C833: the project's own Cloudinary prefix; r24-02 B8: no stored image address is outside it

// ── the recorded objects v8a changes or relies on ────────────────────────────────────────────────────────────────────────────────────────────────
const pol = (schema, table, policy) => {
  const m = cat.policies.filter((p) => p.schema === schema && p.table === table && p.policy === policy)
  if (m.length !== 1) fail(`catalog-post-v71.json: ${schema}.${table} "${policy}": ${m.length} matches`)
  if (m[0].permissive !== 'PERMISSIVE' || m[0].roles !== '{public}') fail(`${schema}.${table} "${policy}" is not a permissive policy for {public}`)
  return m[0]
}
const POL_LISTINGS = pol('public', 'listings', 'Listings viewable by everyone')
const POL_IMAGES = pol('public', 'listing_images', 'Listing images viewable by everyone')
if (POL_LISTINGS.cmd !== 'SELECT' || POL_IMAGES.cmd !== 'SELECT' || POL_IMAGES.qual !== 'true') fail('the two read policies are not the recorded ones')
const POL_STORAGE = ['Admin/moderator delete avatars', 'Admin/moderator update avatars', 'Admin/moderator upload avatars'].map((n) => pol('storage', 'objects', n))
const POL_RP = ['role_permissions_admin_insert', 'role_permissions_admin_select', 'role_permissions_admin_update', 'role_permissions_moderator_read'].map((n) => pol('public', 'role_permissions', n))
if (cat.policies.filter((p) => p.schema === 'public' && p.table === 'role_permissions').length !== 4) fail('role_permissions has policies other than the four of R75 (f)')
const RP_TABLE = cat.tables.find((t) => t.schema === 'public' && t.table === 'role_permissions')
if (!RP_TABLE || RP_TABLE.rls !== true) fail('role_permissions has no row level security in the capture')
if (cat.grants.some((g) => g.table === 'role_permissions' && /SELECT|INSERT|UPDATE|DELETE/.test(g.privileges))) fail('a role holds a row privilege on role_permissions in the capture')
const fnRec = (name, args) => { const f = cat.functions.find((x) => x.name === name && x.args === args); const g = cat.functionGrants.find((x) => x.name === name && x.args === args); if (!f || !g) fail(`catalog-post-v71.json has no function ${name}(${args})`); if (md5(f.def) !== g.md5) fail(`${name}: the recorded md5 is not the md5 of the recorded definition`); return { ...f, md5: g.md5, acl: g.acl } }
const FN_CONTACT = fnRec('get_listing_owner_contact', 'listing_id_param uuid')
const FN_ACTIVE = fnRec('caller_is_active', '')
if (cat.functions.some((f) => f.name === 'get_listing_owner_contact_as')) fail('the capture already has get_listing_owner_contact_as')
if (cat.constraints.some((c) => /^(listings_(title_length|description_length|price_positive|price_old_positive|lat_range|lng_range)_check|listing_images_url_prefix_check)$/.test(c.conname))) fail('the capture already has one of the new constraint names')

// ── R69 (b), (c): the seven CHECKs, added NOT VALID and then validated ──────────────────────────────────────────────────────────────────────────
const CHECKS = [
  { table: 'listings', name: 'listings_title_length_check', expr: 'char_length(btrim(title)) between 5 and 150', what: `title: 5 to 150 characters after btrim (${VAL}:${LN.title})` },
  { table: 'listings', name: 'listings_description_length_check', expr: 'description is null or char_length(description) <= 5000', what: `description: null or at most 5000 characters (${VAL}:${LN.description})` },
  { table: 'listings', name: 'listings_price_positive_check', expr: 'price > 0', what: `price: above 0, no ceiling (${VAL}:${LN.price}; C834)` },
  { table: 'listings', name: 'listings_price_old_positive_check', expr: 'price_old is null or price_old > 0', what: `price_old: null or above 0 (${VAL}:${LN.priceOld})` },
  { table: 'listings', name: 'listings_lat_range_check', expr: 'lat is null or lat between -90 and 90', what: `lat (latitude): null or -90 to 90 (${VAL}:${LN.lat})` },
  { table: 'listings', name: 'listings_lng_range_check', expr: 'lng is null or lng between -180 and 180', what: `lng (longitude): null or -180 to 180 (${VAL}:${LN.lng})` },
  { table: 'listing_images', name: 'listing_images_url_prefix_check', expr: `starts_with(url, ${lit(CLOUD)})`, what: `url: starts with ${CLOUD} (R69 (c), C833)` },
]
const breaking = (c) => `(select count(*) from public.${c.table} where not coalesce((${c.expr}), true)) = 0`

// ── policy helpers ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// R99: a recorded policy text is compared as its md5 (32 hex characters survive the owner's paste; a literal that spans lines does not, C852-C860). A recorded null stays "is null".
const textIs = (col, v) => (v === null ? `${col} is null` : `md5(${col}) = ${lit(md5(v))}`)
const polMatch = (p) => `exists (select 1 from pg_policies x where x.schemaname = ${lit(p.schema)} and x.tablename = ${lit(p.table)} and x.policyname = ${lit(p.policy)} and x.permissive = ${lit(p.permissive)} and x.cmd = ${lit(p.cmd)} and x.roles::text = ${lit(p.roles)} and ${textIs('x.qual', p.qual)} and ${textIs('x.with_check', p.with_check)})`
const polGone = (p) => `not exists (select 1 from pg_policies x where x.schemaname = ${lit(p.schema)} and x.tablename = ${lit(p.table)} and x.policyname = ${lit(p.policy)})`
const mkPolicy = (p) => {
  const roles = p.roles.replace(/^\{|\}$/g, '').split(',').map((s) => s.trim()).filter(Boolean)
  return `create policy ${qi(p.policy)} on ${p.schema}.${p.table}${p.permissive === 'PERMISSIVE' ? '' : ' as restrictive'} for ${p.cmd.toLowerCase()} to ${roles.join(', ')}`
    + `${p.qual ? ` using (${p.qual})` : ''}${p.with_check ? ` with check (${p.with_check})` : ''};`
}
const fnState = (f, schemaSig) => `(select md5(pg_get_functiondef(p.oid)) from pg_proc p where p.oid = to_regprocedure(${lit(schemaSig)})) is not distinct from ${lit(f.md5)} and (select p.proacl::text from pg_proc p where p.oid = to_regprocedure(${lit(schemaSig)})) is not distinct from ${lit(f.acl)}`
const KEYLIST = KEYS.map(lit).join(', ')
const NEWFN = 'public.get_listing_owner_contact_as(uuid, uuid)'

// ── the preflight: each entry is one header line and one check of the DO block (they cannot drift apart) ────────────────────────────────────────
const PRE = []
const pre = (text, cond, msg) => PRE.push({ text, cond, msg })
pre(`public.listings policy "${POL_LISTINGS.policy}" is the recorded one (PERMISSIVE, SELECT, {public}, qual and with_check as in catalog-post-v71.json)`, polMatch(POL_LISTINGS), `the policy ${POL_LISTINGS.policy} on public.listings changed since the capture`)
pre(`public.listing_images policy "${POL_IMAGES.policy}" is the recorded one (PERMISSIVE, SELECT, {public}, qual true)`, polMatch(POL_IMAGES), `the policy ${POL_IMAGES.policy} on public.listing_images changed since the capture`)
for (const p of POL_STORAGE) pre(`storage.objects policy "${p.policy}" is the recorded one (PERMISSIVE, ${p.cmd}, {public}, qual and with_check as recorded)`, polMatch(p), `the policy ${p.policy} on storage.objects changed since the capture`)
for (const p of POL_RP) pre(`public.role_permissions policy "${p.policy}" is the recorded one (PERMISSIVE, ${p.cmd}, {public}, qual and with_check as recorded)`, polMatch(p), `the policy ${p.policy} on public.role_permissions changed since the capture`)
pre('public.role_permissions has row level security on, so the table stays closed to a session once its four policies are dropped', `(select c.relrowsecurity from pg_class c where c.oid = 'public.role_permissions'::regclass)`, 'public.role_permissions has no row level security')
pre('anon and authenticated hold no SELECT, INSERT, UPDATE or DELETE on public.role_permissions (table level or column level), as recorded', `not exists (select 1 from information_schema.role_table_grants g where g.table_schema = 'public' and g.table_name = 'role_permissions' and g.grantee in ('anon', 'authenticated', 'PUBLIC') and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) and not exists (select 1 from information_schema.column_privileges g where g.table_schema = 'public' and g.table_name = 'role_permissions' and g.grantee in ('anon', 'authenticated', 'PUBLIC') and g.privilege_type in ('SELECT', 'INSERT', 'UPDATE'))`, 'a session role holds a row privilege on public.role_permissions')
pre('public.get_listing_owner_contact(uuid) has the recorded body (md5 of pg_get_functiondef) and the recorded ACL; v8a does not change it, and its rules are the ones the new function copies', fnState(FN_CONTACT, 'public.get_listing_owner_contact(uuid)'), 'public.get_listing_owner_contact(uuid) changed since the capture (body or ACL)')
pre('public.caller_is_active() has the recorded body and the recorded ACL; the new function evaluates its predicate for p_caller', fnState(FN_ACTIVE, 'public.caller_is_active()'), 'public.caller_is_active() changed since the capture (body or ACL)')
pre('none of the seven constraints v8a adds exists (listings_title_length_check, listings_description_length_check, listings_price_positive_check, listings_price_old_positive_check, listings_lat_range_check, listings_lng_range_check, listing_images_url_prefix_check)', `not exists (select 1 from pg_constraint k where k.conname in (${CHECKS.map((c) => lit(c.name)).join(', ')}) and k.conrelid in ('public.listings'::regclass, 'public.listing_images'::regclass))`, 'one of the new constraints already exists')
pre('no function named get_listing_owner_contact_as exists in schema public, whatever its arguments', `not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'get_listing_owner_contact_as')`, 'public.get_listing_owner_contact_as already exists')
pre(`none of the eight keys (${KEYS.join(', ')}) has a row in public.role_permissions, for any role`, `not exists (select 1 from public.role_permissions r where r.permission_key in (${KEYLIST}))`, 'a role_permissions row for one of the eight keys already exists')
for (const c of CHECKS) pre(`0 rows of public.${c.table} break the new ${c.name} (${c.what})`, breaking(c), `rows of public.${c.table} break ${c.name}`)

// ── what the apply must have done, checked inside the same transaction (the dry run shows it too) ──────────────────────────────────────────────
const POST = []
const post = (text, cond, msg) => POST.push({ text, cond, msg })
post('the two read policies keep their command and roles; the listings policy now names sold and rented, the photo policy names listings', `exists (select 1 from pg_policies x where x.schemaname = 'public' and x.tablename = 'listings' and x.policyname = ${lit(POL_LISTINGS.policy)} and x.cmd = 'SELECT' and x.roles::text = '{public}' and x.permissive = 'PERMISSIVE' and x.qual like '%sold%' and x.qual like '%rented%' and x.qual like '%active%' and x.qual like '%user_id%') and exists (select 1 from pg_policies x where x.schemaname = 'public' and x.tablename = 'listing_images' and x.policyname = ${lit(POL_IMAGES.policy)} and x.cmd = 'SELECT' and x.roles::text = '{public}' and x.permissive = 'PERMISSIVE' and x.qual like '%listings%' and x.qual like '%listing_id%')`, 'a read policy is not as v8a wrote it')
post('the three avatars policies of storage.objects and the four policies of public.role_permissions are gone', [...POL_STORAGE, ...POL_RP].map(polGone).join(' and '), 'a dropped policy still exists')
post('all seven constraints exist and are validated', `(select count(*) from pg_constraint k where k.conname in (${CHECKS.map((c) => lit(c.name)).join(', ')}) and k.conrelid in ('public.listings'::regclass, 'public.listing_images'::regclass) and k.contype = 'c' and k.convalidated) = ${CHECKS.length}`, 'a new constraint is missing or not validated')
post('the eight keys are in public.role_permissions for the role moderator with allowed = true', `(select count(*) from public.role_permissions r where r.role = 'moderator' and r.allowed and r.permission_key in (${KEYLIST})) = 8 and (select count(*) from public.role_permissions r where r.permission_key in (${KEYLIST})) = 8`, 'the eight seeded rows are not as v8a wrote them')
post('get_listing_owner_contact_as exists, is security definer with search_path public, pg_temp, and only service_role (and its owner) may execute it (no PUBLIC, anon or authenticated)',
  `exists (select 1 from pg_proc p where p.oid = to_regprocedure(${lit(NEWFN)}) and p.prosecdef and p.proconfig = array['search_path=public, pg_temp']::text[] and p.prorettype = 'record'::regtype and has_function_privilege('service_role', p.oid, 'execute') and not has_function_privilege('anon', p.oid, 'execute') and not has_function_privilege('authenticated', p.oid, 'execute') and not exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0))`, 'the new function is not as v8a wrote it')
post('public.get_listing_owner_contact(uuid) is untouched (same body, same ACL)', fnState(FN_CONTACT, 'public.get_listing_owner_contact(uuid)'), 'public.get_listing_owner_contact(uuid) changed')

const block = (tag, list, prefix) => `do $${tag}$\nbegin\n${list.map((c) => `  if not (${c.cond}) then\n    raise exception ${lit(prefix + c.msg)};\n  end if;`).join('\n')}\nend $${tag}$;`
const headerList = (label, list) => list.map((c, i) => `--   ${label} ${String(i + 1).padStart(2, '0')}: ${c.text}`).join('\n')

const apply = `-- PROPOSED (v8a) — NOT APPLIED. Executor draft for Opus's review and the owner's approval of THIS file's SHA-256; the database was NOT changed by the executor.
-- Hardening v8a = the part of hardening v8 that is applied BEFORE the one push of Task 923 (kickoff section 47, R97; evidence C820-C836; owner decisions D67, D68).
--   R73 (a)   the listings read policy shows a visitor sold and rented listings too, and the photo policy follows the listing's visibility
--   R69 (b)   listings CHECKs (title, description, price, price_old, lat, lng), added NOT VALID and then validated; NO price ceiling (the Zod schema has none, C834)
--   R69 (c)   listing_images.url must start with ${CLOUD}, the same way (C833)
--   R69 (e)   the three staff WRITE policies of the avatars bucket are dropped; the bucket stays (it holds one object, C826)
--   R75 (c)   one public.role_permissions row per key of ${PK}:17-24, role moderator, allowed = true (C835)
--   R75 (f)   the four policies of public.role_permissions are dropped (the table stays closed: RLS on, no policy, no grant to a session role)
--   R86 (c)   EXPAND step: public.get_listing_owner_contact_as(p_caller uuid, listing_id_param uuid), executable by service_role only. get_listing_owner_contact(uuid) is NOT changed here.
-- NOT in this file (v8b, after the push, with its own revision): R69 (a) the staff listings policy; R69 (d) the users CHECKs and the sign-up trigger change; the price ceiling with R72 (d); R78 (a) the drop of
--   exchange_providers; R84 the moderation rules for an active listing; R86 (c)'s CONTRACT step (revoking authenticated from get_listing_owner_contact). Each of those breaks the live HEAD code (C822-C829).
-- Generated by gen-sql-v8.cjs from catalog-post-v71.json (the read-only capture of the database after v7.1, R96 (a)). The apply file and the dry-run file differ in their LAST LINE only.
-- Every check of a recorded policy text compares the md5 of the stored text with a 32-character hex value, so no string literal that spans lines is compared and the owner's paste cannot break a check (R99).
--
-- OWNER STEPS: (1) Get-FileHash -Algorithm SHA256 proposed-hardening-v8a.dryrun.sql against the hash Opus gives; run it in the SQL editor at low traffic: it runs the preflight and every statement and the post-checks,
--   then ROLLS BACK. (2) After a clean dry run: the same for proposed-hardening-v8a.sql, which COMMITS. (3) After an error the owner runs "rollback;" as a separate query and reports the error to Opus.
-- The rollback is proposed-hardening-v8a-rollback.sql. It deletes the eight seeded rows whatever their allowed value, so a switch an administrator changed after the apply is not kept.
--
-- WHAT THE PREFLIGHT REFUSES (every check is one line here and one test in section 0; the transaction stops at the first that fails and nothing is changed):
${headerList('PREFLIGHT', PRE)}
-- WHAT THE POST-CHECKS REQUIRE BEFORE COMMIT (section 6):
${headerList('POSTCHECK', POST)}
--
-- BEHAVIOUR (Opus: confirm each)
--   1. (R73 (a)) A guest and a signed-in visitor read SOLD and RENTED listings and their photos. Archived, pending, inactive and expired listings stay unreadable to a visitor, and so do their photos: the old photo
--      policy was "true", so the photo of ANY listing, a pending one included, was readable by a guest. The owner reads all of their own listings (auth.uid() = user_id); staff keep their read through the
--      staff "ALL" policy of listings (R69 (a) comes with v8b). The listing page code of R73 (b) asks for active, sold and rented only and comes with the push (C830).
--   2. (R69 (b), (c)) The CHECKs apply to EVERY writer, service_role included. The preflight proves 0 breaking rows, and the working tree's Zod schema is at least as strict, so a valid listing is not refused (C832, C833).
--      If the Cloudinary cloud name ever changes, listing_images.url needs a new CHECK in the same release. title is measured after btrim, which removes spaces only (Zod's trim removes all white space), so the
--      database rule is never stricter than the working tree's. Two differences for the live HEAD code, which runs until the push (r24-03 section 3, rows 2 and 3): HEAD trims AFTER its length test, so a title of five
--      spaces passes HEAD and the CHECK refuses it (HEAD shows the database message); HEAD has no image-address validation, so an address outside the prefix would save the listing without its photos
--      and report success. Neither is a flow of a real user, and the working tree refuses both before the database does.
--   3. (R69 (e)) A staff SESSION can no longer upload, update or delete in the avatars bucket. Neither HEAD nor the working tree uses Supabase Storage (avatars go to Cloudinary; r24-03 section 3, row 5), so
--      no code path is affected. The bucket and its one object stay.
--   4. (R75 (c), (f)) The working tree reads a MISSING permission row as refused (C836), so the eight rows must exist no later than the code that reads them (C831): they are seeded here, allowed = true, which keeps
--      today's behaviour until an administrator changes a switch. After the four policies are dropped no session role can read or write role_permissions; the server reads it with the service role.
--   5. (R86 (c)) get_listing_owner_contact_as is NEW and called by nothing until the contact gateway ships. It keeps the rules of get_listing_owner_contact (no caller: 42501 unauthenticated; a caller without access:
--      42501 account_blocked; a listing that is not active, or an owner who is deleted: no row) with two differences: auth.uid() becomes p_caller, and the access predicate of caller_is_active() (the profile row
--      exists, deleted_at is null, status active or a blocked status whose suspension has ended) is evaluated for p_caller. The SESSION part of caller_is_active() (the JWT's session_id names a row of
--      auth.sessions) cannot be evaluated for a caller id: the gateway verifies the session with Supabase Auth before it calls the function, and only service_role may call it.
--      Execute is revoked from PUBLIC, anon and authenticated and granted to service_role. v8b's contract step revokes authenticated from get_listing_owner_contact once the gateway is deployed (C814, C829).
--   6. r24-03 section 3 finds no break for valid input in HEAD or in the working tree for any change of this file (rows 2, 3, 5, 6, 7, 8 and 13 expand), apart from the two differences in item 2.
--      Visible change as intended (row 6): favourites and recently viewed also show sold and rented listings. The harness row N05a (an ACTIVE moderator uploads to the avatars bucket) is a positive control of
--      v7.1 that R69 (e) turns into a refusal on purpose: it reads BROKEN after this apply until the harness is updated in the revision that follows it.

begin;
set local lock_timeout = '10s';
-- the text of a policy expression depends on the search_path that renders it; the capture and this preflight both render under this one
set local search_path = public, pg_temp;

-- ── 0. preflight: refuse to run against a schema that is not the one that was captured ──────────────────────────────────────────────────────────
${block('pre', PRE, 'preflight failed: ')}

-- ── 1. R73 (a): visitors see sold and rented listings; a photo follows its listing's visibility ─────────────────────────────────────────────────
-- ALTER POLICY keeps the command and the roles. The photo policy's subquery runs under the caller's own RLS, so a photo is readable exactly when its listing is.
alter policy ${qi(POL_LISTINGS.policy)} on public.listings using (status in ('active', 'sold', 'rented') or auth.uid() = user_id);
alter policy ${qi(POL_IMAGES.policy)} on public.listing_images using (exists (select 1 from public.listings l where l.id = listing_id));

-- ── 2. R69 (b), (c): CHECKs, added NOT VALID (every new write is checked at once) and then validated (the preflight proved 0 breaking rows) ────────
${CHECKS.map((c) => `-- ${c.what}\nalter table public.${c.table} add constraint ${c.name} check (${c.expr}) not valid;`).join('\n')}
${CHECKS.map((c) => `alter table public.${c.table} validate constraint ${c.name};`).join('\n')}

-- ── 3. R69 (e): the three staff write policies of the avatars bucket (the bucket and its object stay) ──────────────────────────────────────────
${POL_STORAGE.map((p) => `drop policy ${qi(p.policy)} on storage.objects;`).join('\n')}

-- ── 4. R75 (c): the eight new moderator keys, allowed = true (today's behaviour; an administrator changes a switch later) ──────────────────────
insert into public.role_permissions (role, permission_key, allowed) values
${KEYS.map((k) => `  ('moderator', ${lit(k)}, true)`).join(',\n')};

-- ── 5. R75 (f): the four policies of public.role_permissions (RLS stays on; with no policy and no grant a session reads and writes nothing) ──────
${POL_RP.map((p) => `drop policy ${qi(p.policy)} on public.role_permissions;`).join('\n')}

-- ── 5b. R86 (c) expand: the contact read for a caller the gateway has verified (service_role only) ───────────────────────────────────────────────
create function ${NEWFN.replace('(uuid, uuid)', '(p_caller uuid, listing_id_param uuid)')}
returns table(phone text, whatsapp text) language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if p_caller is null then raise exception 'unauthenticated' using errcode = '42501'; end if;
  -- the access predicate of caller_is_active(), for p_caller (its session part is the gateway's check)
  if not coalesce(
       (select u.deleted_at is null
           and (u.status = 'active' or (u.status = 'blocked' and u.suspended_until is not null and u.suspended_until <= now()))
        from public.users u where u.id = p_caller),
       false) then
    raise exception 'account_blocked' using errcode = '42501';
  end if;
  if not exists (select 1 from public.listings l join public.users u on u.id = l.user_id
                 where l.id = listing_id_param and l.status = 'active' and u.deleted_at is null) then
    return;
  end if;
  return query
    select u.phone, u.whatsapp from public.listings l join public.users u on u.id = l.user_id
    where l.id = listing_id_param and l.status = 'active' and u.deleted_at is null;
end $$;
revoke all on function ${NEWFN} from public, anon, authenticated;
grant execute on function ${NEWFN} to service_role;

-- ── 6. post-checks: what the statements above did, checked before the commit ────────────────────────────────────────────────────────────────────
${block('post', POST, 'post-check failed: ')}

notify pgrst, 'reload schema';
commit;
`

const rollback = `-- ROLLBACK for proposed-hardening-v8a.sql — NOT APPLIED. Restores every object v8a changed exactly as recorded in catalog-post-v71.json: the two read policies (command, roles and expressions), the three avatars
-- policies of storage.objects and the four policies of public.role_permissions (each dropped if present and created again from the recorded text). It drops the seven new constraints and the new function
-- get_listing_owner_contact_as, and deletes exactly the eight seeded role_permissions rows (role moderator, the eight keys of ${PK}:17-24), whatever their allowed value is by then.
-- get_listing_owner_contact(uuid) is not touched by v8a and is not touched here. The rollback is safe to run twice: every drop is "if exists" and every policy is dropped before it is created.
-- Generated by gen-sql-v8.cjs from catalog-post-v71.json. It ends with checks that every restored policy equals the recorded one; a mismatch stops the transaction with a message that names the object.
-- Every check of a recorded policy text compares the md5 of the stored text with a 32-character hex value, so no string literal that spans lines is compared and the owner's paste cannot break a check (R99).
-- Its last check also requires get_listing_owner_contact(uuid) to be the recorded one. After v8b's contract step (which revokes authenticated from that function) the check stops this rollback: roll v8b back first.
begin;
set local lock_timeout = '10s';
set local search_path = public, pg_temp;

-- R86 (c): the expand function (nothing calls it yet)
drop function if exists ${NEWFN};
-- R75 (c): the eight seeded rows, and only them
delete from public.role_permissions where role = 'moderator' and permission_key in (${KEYLIST});
-- R75 (f): the four policies, as recorded
${POL_RP.map((p) => `drop policy if exists ${qi(p.policy)} on public.role_permissions;\n${mkPolicy(p)}`).join('\n')}
-- R69 (e): the three avatars policies, as recorded
${POL_STORAGE.map((p) => `drop policy if exists ${qi(p.policy)} on storage.objects;\n${mkPolicy(p)}`).join('\n')}
-- R69 (b), (c): the seven constraints
${CHECKS.map((c) => `alter table public.${c.table} drop constraint if exists ${c.name};`).join('\n')}
-- R73 (a): the two read policies, as recorded (command and roles are kept by ALTER POLICY)
alter policy ${qi(POL_LISTINGS.policy)} on public.listings using (${POL_LISTINGS.qual});
alter policy ${qi(POL_IMAGES.policy)} on public.listing_images using (${POL_IMAGES.qual});

-- checks: every changed object is the recorded one again
${block('chk', [
  ...[POL_LISTINGS, POL_IMAGES, ...POL_STORAGE, ...POL_RP].map((p) => ({ cond: polMatch(p), msg: `the policy ${p.policy} on ${p.schema}.${p.table} is not the recorded one after the rollback` })),
  { cond: `not exists (select 1 from pg_constraint k where k.conname in (${CHECKS.map((c) => lit(c.name)).join(', ')}) and k.conrelid in ('public.listings'::regclass, 'public.listing_images'::regclass))`, msg: 'a v8a constraint is still there' },
  { cond: `not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = 'get_listing_owner_contact_as')`, msg: 'public.get_listing_owner_contact_as is still there' },
  { cond: `not exists (select 1 from public.role_permissions r where r.permission_key in (${KEYLIST}))`, msg: 'a seeded role_permissions row is still there' },
  { cond: fnState(FN_CONTACT, 'public.get_listing_owner_contact(uuid)'), msg: 'public.get_listing_owner_contact(uuid) is not the recorded one' },
], 'rollback check failed: ')}
notify pgrst, 'reload schema';
commit;
`

// the dry run is the apply file with only its last line changed
const applyLines = apply.split('\n')
if (applyLines[applyLines.length - 1] !== '' || applyLines[applyLines.length - 2] !== 'commit;') fail('the apply file does not end with a line "commit;"')
const dryrun = [...applyLines.slice(0, -2), 'rollback;', ''].join('\n')
if (apply.split('\n').filter((l, i) => l !== dryrun.split('\n')[i]).length !== 1) fail('the dry run differs from the apply file in more than one line')

fs.writeFileSync(D + 'proposed-hardening-v8a.sql', apply)
fs.writeFileSync(D + 'proposed-hardening-v8a-rollback.sql', rollback)
fs.writeFileSync(D + 'proposed-hardening-v8a.dryrun.sql', dryrun)
console.log(`written proposed-hardening-v8a.sql (${apply.length} chars, ${applyLines.length - 1} lines), -rollback.sql (${rollback.length}), .dryrun.sql (${dryrun.length}); preflight checks ${PRE.length}, post-checks ${POST.length}, constraints ${CHECKS.length}, keys ${KEYS.length}`)
