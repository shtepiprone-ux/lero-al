// db-catalog-audit.mjs (whole-project audit 2026-11-06, G-01): a clean catalog passes, and each invariant refuses its
// planted violation, the class of each live finding DB-01..DB-08. No database is touched: the checks run on fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCatalog, DEFINER_EXECUTE_ALLOWED, scrub, secretParts, USERS_CHECKED_TEXT_COLUMNS } from './db-catalog-audit.mjs';

const ownerUpdate = { schema: 'public', table: 'listings', name: 'owner_update', permissive: 'PERMISSIVE', roles: '{authenticated}', cmd: 'UPDATE', qual: "(auth.uid() = user_id) AND (status <> 'active'::listing_status)", with_check: null };

/** A catalog that satisfies every invariant. */
function clean() {
  return {
    tables: [{ name: 'listings', rls: true }, { name: 'users', rls: true }],
    policies: [
      { schema: 'public', table: 'listings', name: 'blocked_account_no_select', permissive: 'RESTRICTIVE', roles: '{authenticated}', cmd: 'SELECT', qual: '( SELECT caller_is_active())', with_check: null },
      { schema: 'public', table: 'listings', name: 'public_read', permissive: 'PERMISSIVE', roles: '{public}', cmd: 'SELECT', qual: "((status = 'active'::listing_status) AND (expires_at >= now()))", with_check: null },
      { schema: 'public', table: 'listings', name: 'staff_write', permissive: 'PERMISSIVE', roles: '{authenticated}', cmd: 'ALL', qual: "(EXISTS (SELECT 1 FROM users WHERE users.role = ANY (ARRAY['admin'::user_role, 'moderator'::user_role]))) AND has_permission('listings.moderate')", with_check: null },
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

test('I6 (DB-03): a server-only users column is session-writable; a session-writable text column has no CHECK', () => {
  const cat = clean(); cat.columnGrants[0].cols += ',company_id';
  assert.deepEqual(ids(cat), ['I6']);
  const cat2 = clean(); cat2.checks = cat2.checks.filter((k) => !/\bwebsite\b/.test(k.def));
  assert.deepEqual(checkCatalog(cat2).map((f) => f.object), ['public.users.website']);
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
