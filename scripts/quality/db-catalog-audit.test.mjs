// db-catalog-audit.mjs (whole-project audit 2026-11-06, G-01): a clean catalog passes, and each invariant refuses its
// planted violation, the class of each live finding DB-01..DB-08. No database is touched: the checks run on fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCatalog, DEFINER_EXECUTE_ALLOWED, QUERIES, scrub, secretParts, USERS_CHECKED_TEXT_COLUMNS } from './db-catalog-audit.mjs';

const ownerUpdate = { schema: 'public', table: 'listings', name: 'owner_update', permissive: 'PERMISSIVE', roles: '{authenticated}', cmd: 'UPDATE', qual: "(auth.uid() = user_id) AND (status <> 'active'::listing_status)", with_check: null };

/** A catalog that satisfies every invariant. */
function clean() {
  return {
    tables: [{ name: 'listings', rls: true }, { name: 'users', rls: true }],
    policies: [
      { schema: 'public', table: 'listings', name: 'blocked_account_no_select', permissive: 'RESTRICTIVE', roles: '{authenticated}', cmd: 'SELECT', qual: '( SELECT caller_is_active())', with_check: null },
      { schema: 'public', table: 'listings', name: 'public_read', permissive: 'PERMISSIVE', roles: '{public}', cmd: 'SELECT', qual: "((status = 'active'::listing_status) AND (expires_at >= now()))", with_check: null },
      { schema: 'public', table: 'listings', name: 'staff_write', permissive: 'PERMISSIVE', roles: '{authenticated}', cmd: 'ALL', qual: "(EXISTS (SELECT 1 FROM users WHERE users.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))) AND caller_has_permission('listings.moderate'::text)", with_check: null },
      { ...ownerUpdate },
      { schema: 'public', table: 'users', name: 'self_update', permissive: 'PERMISSIVE', roles: '{authenticated}', cmd: 'UPDATE', qual: '(auth.uid() = id)', with_check: null },
    ],
    tableGrants: [{ table: 'listings', grantee: 'anon', privs: 'SELECT' }, { table: 'listings', grantee: 'authenticated', privs: 'DELETE,INSERT,SELECT,UPDATE' }],
    columnGrants: [{ table: 'users', grantee: 'authenticated', privilege: 'UPDATE', cols: USERS_CHECKED_TEXT_COLUMNS.join(',') }],
    functions: [
      { name: 'caller_is_active', args: '', definer: true, config: ['search_path=public, pg_temp'], anon_exec: false, auth_exec: true },
      { name: 'internal_job', args: '', definer: true, config: ['search_path=public, pg_temp'], anon_exec: false, auth_exec: false },
      { name: 'update_updated_at', args: '', definer: false, config: null, anon_exec: true, auth_exec: true },
    ],
    checks: USERS_CHECKED_TEXT_COLUMNS.map((c) => ({ table: 'users', name: `users_${c}_check`, def: `CHECK ((length(${c}) <= 200))` })),
    triggers: [],
    buckets: [{ id: 'avatars', public: true, file_size_limit: 2097152, allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'] }],
  };
}

const ids = (cat) => checkCatalog(cat).map((f) => f.id);

test('a catalog that meets every invariant has no finding', () => {
  assert.deepEqual(checkCatalog(clean()), []);
});

test('I1: a table without row level security', () => {
  const cat = clean(); cat.tables[0].rls = false;
  assert.deepEqual(ids(cat), ['I1']);
});

test('I2: a PERMISSIVE blocked-account policy', () => {
  const cat = clean(); cat.policies[0].permissive = 'PERMISSIVE';
  assert.deepEqual(ids(cat), ['I2']);
});

test('I3 (DB-01): a definer function callable by a session and not allow-listed; a definer without search_path', () => {
  const cat = clean();
  cat.functions.push({ name: 'get_listing_owner_contact', args: 'listing_id_param uuid', definer: true, config: ['search_path=public, pg_temp'], anon_exec: false, auth_exec: true });
  assert.deepEqual(ids(cat), ['I3']);
  const cat2 = clean(); cat2.functions[1].config = null;
  assert.deepEqual(ids(cat2), ['I3']);
  assert.ok(!Object.hasOwn(DEFINER_EXECUTE_ALLOWED, 'get_listing_owner_contact'));
});

test('I4 (DB-05): anon holds a write grant', () => {
  const cat = clean(); cat.tableGrants[0].privs = 'DELETE,INSERT,SELECT,UPDATE';
  assert.deepEqual(ids(cat), ['I4']);
});

test('I5 (DB-02): a moderator write policy without a permission-key check; a moderator READ policy is not this invariant', () => {
  const cat = clean(); cat.policies[2].qual = "(EXISTS (SELECT 1 FROM users WHERE users.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role])))";
  assert.deepEqual(ids(cat), ['I5']);
  const read = clean(); read.policies.push({ ...read.policies[2], name: 'staff_read', cmd: 'SELECT', qual: "users.role = 'moderator'::user_role" });
  assert.deepEqual(ids(read), []);
});

// Task 956 AC9: the moderator key lives in public.caller_has_permission(key text); the policies call it with a literal key.
const STAFF = "(EXISTS (SELECT 1 FROM users WHERE users.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role])))";
const withQual = (qual) => { const cat = clean(); cat.policies[2].qual = qual; return cat; };

test('I3 (AC9): caller_has_permission is allow-listed, so a session may execute it; a lookalike definer function is not', () => {
  assert.ok(Object.hasOwn(DEFINER_EXECUTE_ALLOWED, 'caller_has_permission'));
  const cat = clean();
  cat.functions.push({ name: 'caller_has_permission', args: 'key text', definer: true, config: ['search_path=""'], anon_exec: true, auth_exec: true });
  assert.deepEqual(checkCatalog(cat), []);
  const lookalike = clean();
  lookalike.functions.push({ name: 'caller_has_permissions', args: 'key text', definer: true, config: ['search_path=""'], anon_exec: false, auth_exec: true });
  assert.deepEqual(checkCatalog(lookalike).map((f) => `${f.id} ${f.object}`), ['I3 public.caller_has_permissions(key text)']);
});

test('I5 (AC9): a moderator write policy calling caller_has_permission with a literal key passes, in every form Postgres prints', () => {
  for (const call of ["caller_has_permission('listings.moderate'::text)", "( SELECT caller_has_permission('listings.moderate'::text) AS caller_has_permission)",
    "public.caller_has_permission('email_templates.manage'::text)", "caller_has_permission( 'reports.delete' )"]) {
    assert.deepEqual(ids(withQual(`${STAFF} AND ${call}`)), [], call);
  }
});

test('I5 (AC9): a lookalike function, a key that is not a literal, or a mere mention of role_permissions is not a key check', () => {
  for (const qual of [`${STAFF} AND role_has_permission('listings.moderate'::text)`, `${STAFF} AND has_permission('listings.moderate'::text)`,
    `${STAFF} AND caller_has_permission(key_column)`, `${STAFF} AND caller_has_permission(''::text)`,
    `${STAFF} AND (NOT (EXISTS ( SELECT 1 FROM role_permissions)))`]) {
    assert.deepEqual(ids(withQual(qual)), ['I5'], qual);
  }
});

test('the snapshot has a columns query with every field db-types-drift.mjs reads (AC8)', () => {
  assert.match(QUERIES.columns, /pg_attribute/);
  for (const field of [' as table', ' as kind', ' as name', ' as type', ' as udt', ' as typtype', ' as nullable', ' as is_array', ' as enum_values']) {
    assert.ok(QUERIES.columns.includes(`${field},`) || QUERIES.columns.includes(`${field}\n`), field);
  }
});

test('I6 (DB-03): a server-only users column is session-writable; a session-writable text column has no CHECK', () => {
  const cat = clean(); cat.columnGrants[0].cols += ',company_id';
  assert.deepEqual(ids(cat), ['I6']);
  const cat2 = clean(); cat2.checks = cat2.checks.filter((k) => !/\bwebsite\b/.test(k.def));
  assert.deepEqual(checkCatalog(cat2).map((f) => f.object), ['public.users.website']);
});

// Task 956 AC9 (F5): a session INSERT grant writes a users column as an UPDATE grant does; two PERMISSIVE policies with one
// table, command, roles and expressions repeat one rule (the duplicate notifications policies, AC7).
const findings = (cat) => checkCatalog(cat).map((f) => `${f.id} ${f.object}: ${f.message}`);

test('I6 (AC9): a session INSERT grant on a server-only users column; an INSERT-writable text column with no CHECK', () => {
  for (const grantee of ['authenticated', 'anon']) {
    const cat = clean(); cat.columnGrants.push({ table: 'users', grantee, privilege: 'INSERT', cols: 'company_id,name' });
    assert.deepEqual(findings(cat), ['I6 public.users.company_id: a session may INSERT this server-only column directly'], grantee);
  }
  const both = clean(); both.columnGrants[0].cols += ',company_id';
  both.columnGrants.push({ table: 'users', grantee: 'authenticated', privilege: 'INSERT', cols: 'company_id' });
  assert.deepEqual(findings(both), ['I6 public.users.company_id: a session may INSERT and UPDATE this server-only column directly']);
  const unchecked = clean(); unchecked.columnGrants = [{ table: 'users', grantee: 'authenticated', privilege: 'INSERT', cols: 'website' }];
  unchecked.checks = [];
  assert.deepEqual(checkCatalog(unchecked).map((f) => `${f.id} ${f.object}`), ['I6 public.users.website']);
});

const notice = (name, extra = {}) => ({ schema: 'public', table: 'notifications', name, permissive: 'PERMISSIVE', roles: '{public}', cmd: 'SELECT', qual: '(user_id = auth.uid())', with_check: null, ...extra });

test('I15 (AC9): two PERMISSIVE policies of one table, command and roles with the same expressions', () => {
  // the live pair of 2026-11-16 (db-catalog-audit.mjs --save): one equality written in each operand order
  const cat = clean(); cat.policies.push(notice('Users can view own notifications', { qual: '(auth.uid() = user_id)' }), notice('notifications_select'));
  assert.deepEqual(findings(cat), ['I15 public.notifications.notifications_select: repeats "Users can view own notifications" (SELECT for public)']);
  const same = clean();
  same.policies.push(notice('site_settings_public_read', { table: 'site_settings', qual: 'true' }), notice('site_settings_read', { table: 'site_settings', qual: 'true' }));
  assert.deepEqual(ids(same), ['I15']);
  const reordered = clean();
  reordered.policies.push(notice('a', { roles: '{anon,authenticated}' }), notice('b', { roles: '{authenticated,anon}' }), notice('c', { roles: '{anon,authenticated}' }));
  assert.deepEqual(checkCatalog(reordered).map((f) => `${f.id} ${f.object}`), ['I15 public.notifications.b', 'I15 public.notifications.c']);
  const asArray = clean(); asArray.policies.push(notice('a', { roles: ['authenticated', 'anon'] }), notice('b', { roles: '{anon,authenticated}' }));
  assert.deepEqual(ids(asArray), ['I15']);
  assert.deepEqual(asArray.policies.at(-2).roles, ['authenticated', 'anon'], 'the catalog given is not changed');
});

test('I15 (AC9): two policies that differ in an expression, the command, the roles, the mode or the table are not duplicates', () => {
  for (const other of [{ qual: '(recipient_id = auth.uid())' }, { qual: '((user_id = auth.uid()) AND (is_read = false))' }, { with_check: '(user_id = auth.uid())' },
    { cmd: 'UPDATE' }, { roles: '{authenticated}' }, { permissive: 'RESTRICTIVE' }, { table: 'saved_searches' }, { schema: 'storage' }]) {
    const cat = clean(); cat.policies.push(notice('a'), notice('b', other));
    assert.deepEqual(ids(cat), [], JSON.stringify(other));
  }
  const ordered = clean(); ordered.policies.push(notice('a', { qual: '(created_at < now())' }), notice('b', { qual: '(now() < created_at)' }));
  assert.deepEqual(ids(ordered), [], 'only an equality reads the same both ways');
});

test('I7 (DB-08): the public read of active listings has no expiry rule', () => {
  const cat = clean(); cat.policies[1].qual = "(status = ANY (ARRAY['active'::listing_status, 'sold'::listing_status]))";
  assert.deepEqual(ids(cat), ['I7']);
});

test('I8 (DB-04): the owner update of a listing does not name the status, unless a moderation trigger exists', () => {
  const cat = clean(); cat.policies[3].qual = '(auth.uid() = user_id)';
  assert.deepEqual(ids(cat), ['I8']);
  cat.triggers.push({ table: 'listings', name: 'listings_owner_edit_moderation', timing: 'BEFORE', events: 'UPDATE' });
  assert.deepEqual(ids(cat), []);
});

test('I9 (DB-06): a bucket without a size or type limit', () => {
  const cat = clean(); cat.buckets[0].file_size_limit = null; cat.buckets[0].allowed_mime_types = null;
  assert.deepEqual(ids(cat), ['I9', 'I9']);
});

test('the connection string, host, user and password never reach a printed error', () => {
  const cs = 'postgresql://postgres.abcdefghij:S3cret-Pass@aws-0-eu.pooler.supabase.com:6543/postgres';
  const shown = scrub(`connect failed for ${cs} at aws-0-eu.pooler.supabase.com as postgres.abcdefghij with S3cret-Pass`, secretParts(cs));
  for (const s of ['S3cret-Pass', 'aws-0-eu.pooler.supabase.com', 'postgres.abcdefghij']) assert.ok(!shown.includes(s), s);
});
