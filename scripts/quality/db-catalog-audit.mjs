#!/usr/bin/env node
// Read-only audit of the LIVE database catalog against the project's authorization invariants (whole-project audit
// 2026-11-06, finding G-01). The repository holds no complete schema, so a diff review cannot see a policy, a grant or a
// SECURITY DEFINER function; this tool reads them from the database itself.
// OWASP: Database Security (least privilege, RLS on every table), Authorization (the data layer enforces what the
// application enforces), Mass Assignment (column grants), File Upload (store limits), Secure Code Review (configuration).
//
// Usage:
//   node scripts/quality/db-catalog-audit.mjs                     read the live catalog and check it
//   node scripts/quality/db-catalog-audit.mjs --save <file.json>  also write the catalog snapshot (no secret in it)
//   node scripts/quality/db-catalog-audit.mjs --snapshot <file>   check a saved snapshot, no connection
// Connection: DATABASE_URL from the environment or `.env.local`; TLS verified with the CA file in SUPABASE_CA_FILE or
// `prod-ca-2021.crt` at the repository root (no CA, no connection); every query inside `begin transaction read only`.
// The `pg` module comes from the project or from the path in LERO_PG_MODULE. Exit 0 = no finding, 1 = findings,
// 2 = the catalog could not be read. Errors are printed with the connection string, host, user and password removed.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

export const QUERIES = {
  tables: `select c.relname as name, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r', 'p') order by 1`,
  policies: `select schemaname as schema, tablename as table, policyname as name, permissive, roles::text as roles, cmd, qual, with_check
             from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3`,
  tableGrants: `select table_name as table, grantee, string_agg(privilege_type, ',' order by privilege_type) as privs
                from information_schema.role_table_grants where table_schema = 'public' and grantee in ('anon', 'authenticated')
                group by 1, 2 order by 1, 2`,
  columnGrants: `select table_name as table, grantee, privilege_type as privilege, string_agg(column_name, ',' order by column_name) as cols
                 from information_schema.column_privileges where table_schema = 'public' and grantee in ('anon', 'authenticated')
                 and privilege_type in ('INSERT', 'UPDATE') group by 1, 2, 3 order by 1, 2, 3`,
  functions: `select p.proname as name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as definer, p.proconfig as config,
                has_function_privilege('anon', p.oid, 'EXECUTE') as anon_exec, has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_exec
              from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' order by 1, 2`,
  checks: `select c.conrelid::regclass::text as table, c.conname as name, pg_get_constraintdef(c.oid) as def from pg_constraint c
           join pg_namespace n on n.oid = c.connamespace where n.nspname = 'public' and c.contype = 'c' order by 1, 2`,
  triggers: `select event_object_table as table, trigger_name as name, action_timing as timing, string_agg(event_manipulation, ',') as events
             from information_schema.triggers where trigger_schema = 'public' group by 1, 2, 3 order by 1, 2`,
  buckets: `select id, public, file_size_limit, allowed_mime_types from storage.buckets order by 1`,
};

/**
 * SECURITY DEFINER functions a session may call, each with the reason it is safe. A definer function runs with the
 * owner's rights and skips RLS: anything not on this list must not be executable by `anon` or `authenticated`.
 */
export const DEFINER_EXECUTE_ALLOWED = {
  caller_is_active: 'answers a yes/no about the caller only; used inside policies',
  caller_is_admin: 'answers a yes/no about the caller only; used inside policies and guard triggers',
  record_recently_viewed: 'writes only the caller\'s own history row, checks caller_is_active, bounds the cap',
};

/** `users` columns a session must never write directly: set by the server, by Auth or by an administrator only. */
export const USERS_SERVER_ONLY_COLUMNS = ['avatar_url', 'company_id', 'company_logo_url', 'created_at', 'inactivity_warning_sent_at',
  'last_seen_at', 'location_request', 'pending_email', 'public_id', 'social_provider'];

/** `users` text columns a session may write: each needs a CHECK constraint that names it (bound and shape at the data layer). */
export const USERS_CHECKED_TEXT_COLUMNS = ['company_name', 'last_name', 'name', 'phone', 'position', 'website', 'whatsapp'];

const STAFF_ROLE = /'moderator'::user_role|'moderator'::text/;
const PERMISSION_CHECK = /has_permission\s*\(|role_permissions/;
const WRITE_CMDS = new Set(['ALL', 'INSERT', 'UPDATE', 'DELETE']);
const SESSION_ROLES = /\b(public|anon|authenticated)\b/;
const list = (v) => (Array.isArray(v) ? v : String(v ?? '').replace(/^\{|\}$/g, '').split(',').filter(Boolean));
const text = (p) => `${p.qual ?? ''} ${p.with_check ?? ''}`;

/** Every invariant, applied to one catalog snapshot. Returns `{ id, object, message }` per violation. */
export function checkCatalog(cat) {
  const out = [];
  const add = (id, object, message) => out.push({ id, object, message });

  // I1 — row level security on every public table
  for (const t of cat.tables ?? []) if (!t.rls) add('I1', `public.${t.name}`, 'row level security is off');

  // I2 — every blocked_account_* policy is RESTRICTIVE (a PERMISSIVE one would OPEN the table)
  for (const p of cat.policies ?? []) {
    if (/^blocked_account_/.test(p.name) && p.permissive !== 'RESTRICTIVE') add('I2', `${p.schema}.${p.table}.${p.name}`, 'a blocked-account policy is PERMISSIVE');
  }

  // I3 — SECURITY DEFINER: pinned search_path; executable by a session only when allow-listed
  for (const f of cat.functions ?? []) {
    if (!f.definer) continue;
    const name = `public.${f.name}(${f.args ?? ''})`;
    if (!list(f.config).some((c) => /^search_path=/.test(c))) add('I3', name, 'SECURITY DEFINER without a pinned search_path');
    if ((f.anon_exec || f.auth_exec) && !Object.hasOwn(DEFINER_EXECUTE_ALLOWED, f.name)) {
      add('I3', name, `SECURITY DEFINER executable by ${[f.anon_exec && 'anon', f.auth_exec && 'authenticated'].filter(Boolean).join(' and ')}: it skips RLS and every application check`);
    }
  }

  // I4 — anon holds no INSERT / UPDATE / DELETE / TRUNCATE grant on a public table (least privilege, not only RLS)
  for (const g of cat.tableGrants ?? []) {
    if (g.grantee !== 'anon') continue;
    const bad = list(g.privs).filter((p) => ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'].includes(p));
    if (bad.length) add('I4', `public.${g.table}`, `anon holds ${bad.join(', ')}`);
  }

  // I5 — a policy that lets a moderator WRITE also checks the moderator's permission key (the keys are not only in the app)
  for (const p of cat.policies ?? []) {
    if (p.schema !== 'public' || !WRITE_CMDS.has(p.cmd) || p.permissive !== 'PERMISSIVE') continue;
    if (STAFF_ROLE.test(text(p)) && !PERMISSION_CHECK.test(text(p))) add('I5', `public.${p.table}.${p.name}`, `${p.cmd} for a moderator without a permission-key check`);
  }

  // I6 — users: no session write on server-only columns; every session-writable text column has a CHECK that names it
  const userWrites = new Set((cat.columnGrants ?? []).filter((g) => g.table === 'users' && g.grantee === 'authenticated' && g.privilege === 'UPDATE').flatMap((g) => list(g.cols)));
  const usersUpdatable = (cat.policies ?? []).some((p) => p.schema === 'public' && p.table === 'users' && p.permissive === 'PERMISSIVE' && ['UPDATE', 'ALL'].includes(p.cmd) && SESSION_ROLES.test(p.roles));
  if (usersUpdatable) {
    for (const c of USERS_SERVER_ONLY_COLUMNS) if (userWrites.has(c)) add('I6', `public.users.${c}`, 'a session may write this server-only column directly');
    const checks = (cat.checks ?? []).filter((k) => k.table === 'users' || k.table === 'public.users').map((k) => k.def);
    for (const c of USERS_CHECKED_TEXT_COLUMNS) {
      if (userWrites.has(c) && !checks.some((d) => new RegExp(`\\b${c}\\b`).test(d))) add('I6', `public.users.${c}`, 'session-writable with no CHECK constraint (length and shape are enforced only by the application)');
    }
  }

  // I7 — the public read of listings carries the expiry rule the application applies (visibility.ts)
  for (const p of cat.policies ?? []) {
    if (p.schema !== 'public' || p.table !== 'listings' || p.cmd !== 'SELECT' || p.permissive !== 'PERMISSIVE' || !/\b(public|anon)\b/.test(p.roles)) continue;
    if (/'active'/.test(text(p)) && !/expires_at/.test(text(p))) add('I7', `public.listings.${p.name}`, 'anyone reads an active listing whose expiry has passed; the application hides it');
  }

  // I8 — an owner's direct UPDATE of a listing cannot skip moderation: the policy names the status, or a moderation trigger exists
  const moderationTrigger = (cat.triggers ?? []).some((t) => t.table === 'listings' && /moderat/i.test(t.name) && /UPDATE/.test(t.events));
  for (const p of cat.policies ?? []) {
    if (p.schema !== 'public' || p.table !== 'listings' || !['UPDATE', 'ALL'].includes(p.cmd) || p.permissive !== 'PERMISSIVE') continue;
    if (!/auth\.uid\(\)\s*=\s*user_id|user_id\s*=\s*auth\.uid\(\)/.test(text(p))) continue;
    if (!/\bstatus\b/.test(text(p)) && !moderationTrigger) add('I8', `public.listings.${p.name}`, 'the owner edits an active listing directly, without the moderation step');
  }

  // I9 — every storage bucket bounds the size and the type of what it stores
  for (const b of cat.buckets ?? []) {
    if (b.file_size_limit == null) add('I9', `storage.buckets.${b.id}`, 'no file_size_limit');
    if (!list(b.allowed_mime_types).length) add('I9', `storage.buckets.${b.id}`, 'no allowed_mime_types');
  }
  return out;
}

const SECRET_ENV = ['DATABASE_URL'];

function readEnvLocal(root) {
  const env = {};
  const file = `${root}.env.local`;
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

/** The secret parts of a connection string, for removal from any printed text. */
export function secretParts(connectionString) {
  const parts = [connectionString];
  try {
    const u = new URL(connectionString);
    parts.push(u.hostname, u.username, decodeURIComponent(u.password));
  } catch { /* not a URL: only the whole string is hidden */ }
  return parts.filter((p) => p && p.length > 3);
}
export const scrub = (message, parts) => parts.reduce((s, p) => s.split(p).join('<hidden>'), String(message));

async function readLiveCatalog(root) {
  const env = { ...readEnvLocal(root), ...Object.fromEntries(SECRET_ENV.filter((k) => process.env[k]).map((k) => [k, process.env[k]])) };
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set (environment or .env.local)');
  const caFile = process.env.SUPABASE_CA_FILE || `${root}prod-ca-2021.crt`;
  if (!existsSync(caFile)) throw new Error('no CA file: set SUPABASE_CA_FILE or place prod-ca-2021.crt at the repository root (TLS is never unverified)');
  const require = createRequire(import.meta.url);
  const { Client } = require(process.env.LERO_PG_MODULE || 'pg');
  const url = new URL(env.DATABASE_URL);
  for (const k of ['sslmode', 'ssl', 'sslrootcert']) url.searchParams.delete(k);
  const parts = secretParts(env.DATABASE_URL);
  const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: true, ca: readFileSync(caFile, 'utf8') }, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    const cat = {};
    await client.query('begin transaction read only');
    for (const [k, sql] of Object.entries(QUERIES)) cat[k] = (await client.query(sql)).rows;
    await client.query('rollback');
    return cat;
  } catch (e) {
    throw new Error(scrub(e?.message ?? e, parts));
  } finally {
    await client.end().catch(() => {});
  }
}

async function main(argv) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const arg = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  let cat;
  try {
    cat = arg('--snapshot') ? JSON.parse(readFileSync(arg('--snapshot'), 'utf8')) : await readLiveCatalog(root);
  } catch (e) {
    console.error(`db-catalog-audit: the catalog could not be read: ${e.message}`);
    return 2;
  }
  if (arg('--save')) writeFileSync(arg('--save'), JSON.stringify(cat, null, 1));
  const findings = checkCatalog(cat);
  const counts = Object.fromEntries(Object.entries(cat).map(([k, v]) => [k, v.length]));
  console.log(`db-catalog-audit: ${JSON.stringify(counts)}`);
  for (const f of findings) console.log(`${f.id} ${f.object}: ${f.message}`);
  console.log(findings.length ? `db-catalog-audit: ${findings.length} finding(s)` : 'db-catalog-audit: no finding');
  return findings.length ? 1 : 0;
}

if (isEntryPoint(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
