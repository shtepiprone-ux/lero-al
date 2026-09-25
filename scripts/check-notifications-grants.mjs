#!/usr/bin/env node
/**
 * check-notifications-grants.mjs — Static grant regression check for `notifications` (Task 881).
 *
 * Pattern: scripts/check-listing-reports-grants.mjs (Task 460). Rewritten at review 2 as a
 * fail-closed allowlist (review 1's spelling-enumeration approach still missed a multi-table
 * `ON` list, `TO public`, a quoted grantee, `GRANTED BY`, an unrecognised privilege keyword, and
 * a role-membership `GRANT role TO role` statement with no `ON` clause at all). Hardened at
 * review 3 (RV7): only `--` line comments were stripped, so a `/* … *\/`-prefixed GRANT and a
 * GRANT embedded inside a `DO $$ … $$` block were both invisible to the statement splitter; a
 * grantee carrying `WITH GRANT OPTION` was silently accepted.
 *
 * Sources scanned: scripts/grant-discipline-audit.sql and
 * scripts/task-881-notifications-least-privilege.sql. Deliberately IGNORES
 * scripts/task-881-rollback.sql — that file exists to restore authenticated's full grant set
 * on breakage (a deliberate, labelled exception), never to be held to the least-privilege
 * contract this gate enforces.
 *
 * Pipeline: strip `/* … *\/` block comments (non-greedy, across lines), then `--` line comments,
 * split each file on `;`, normalize whitespace and case.
 *
 * IN SCOPE: every `GRANT` statement whose text, with double quotes removed, contains the token
 * `notifications` anywhere (this deliberately catches a multi-table `ON` list that only
 * partially names the table), OR whose `ON` clause is `ALL TABLES IN SCHEMA <list>` where the
 * schema list includes `public`. A table-form `GRANT` that does not meet either test (an
 * unrelated table) is skipped entirely. A role-membership `GRANT <role> TO <grantee>` (no `ON`
 * clause at all) can never mention the table by name, so it is checked independently — see (f).
 *
 * For an in-scope table-form statement, the privilege list and the `TO` grantee list are each
 * split at TOP-LEVEL commas only (a column list's internal commas are never mistaken for another
 * privilege). Each grantee has a trailing `WITH GRANT OPTION` and/or `GRANTED BY <role>` (either
 * order) stripped before its identity is checked, but the raw (unstripped) token is separately
 * checked for `WITH GRANT OPTION` — see (h). Each privilege token is `select`, `insert`, `update`,
 * `delete`, `truncate`, `references`, `trigger` or `all` (optionally `... privileges`), with an
 * optional `(column[, column...])` list.
 *
 * Exits 1, naming the statement, when:
 *   (a) an in-scope statement's privilege list contains a token that is not one of the seven
 *       keywords above (or the statement's shape cannot be parsed as a table grant or a
 *       role-membership grant at all, while still being in scope);
 *   (b) an in-scope statement grants to anything other than `authenticated` or `service_role`
 *       (so `anon`, `public`, or any other role fails, whatever else is also granted);
 *   (c) `authenticated` is granted, in an in-scope statement, any privilege other than
 *       table-level `select` (no column list) or `update (is_read)` exactly;
 *   (f) a role-membership `GRANT ... TO ...` statement (no `ON` clause) names `anon`,
 *       `authenticated` or `public` as a grantee;
 *   (g) a `;`-delimited fragment that does NOT start with `grant`, but contains the word `grant`
 *       and, with quotes removed, contains `notifications` — e.g. a GRANT hidden inside a
 *       `DO $$ … $$` block, or after other leading text this parser cannot decompose. This
 *       fragment cannot be verified, so it fails closed rather than being silently skipped;
 *   (h) an in-scope table-form statement grants to `authenticated` with a raw `TO` token that
 *       carries `WITH GRANT OPTION` — `authenticated` must never be able to re-grant.
 *
 * After scanning every statement, also exits 1 (naming the whole scan) when:
 *   (d) no statement granted `authenticated` table-level `select`;
 *   (e) no statement granted `authenticated` `update (is_read)` exactly.
 *
 * SCOPE this tool itself cannot see: the live database's actual grants —
 * scripts/task-881-notifications-audit.sql's N1/N2/N4/N5 checks do that, run by the owner
 * (O80-5) — a grant built with dynamic SQL (`execute format(...)`), or a grant issued from inside
 * a function body stored elsewhere (this tool reads only the two named SQL files, never the
 * database's function definitions). A green result here proves the SQL declarations this parser
 * can read are correct; it does not prove they were ever applied, or that no dynamic/hidden grant
 * exists.
 *
 * CI-runnable — no DB, no server, no auth required.
 *
 * Usage:
 *   node scripts/check-notifications-grants.mjs
 *   npm run check:notifications-grants
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SQL_FILES = [
  'scripts/grant-discipline-audit.sql',
  'scripts/task-881-notifications-least-privilege.sql',
];

const TABLE_GRANTEE_ALLOWLIST = ['authenticated', 'service_role'];
const MEMBERSHIP_TRIGGER_ROLES = ['anon', 'authenticated', 'public'];

console.log(
  `Scope: reads ${SQL_FILES.join(' and ')} only (task-881-rollback.sql excluded by design). ` +
  'Allowlist (fail-closed, hardened review 3): an in-scope GRANT (mentions "notifications", or ' +
  'targets "ALL TABLES IN SCHEMA ..." including public) may grant only to ' +
  '{authenticated, service_role}; authenticated may hold only table-level SELECT or ' +
  'UPDATE (is_read) exactly, and never WITH GRANT OPTION; a role-membership GRANT with no ON ' +
  'clause may not name anon/authenticated/public as grantee; a fragment that mentions GRANT and ' +
  'notifications without itself starting with GRANT (a DO block, text after other leading tokens, ' +
  'or a /* */-commented prefix once stripped) fails as unverifiable rather than being skipped. ' +
  "It cannot see live database grants — scripts/task-881-notifications-audit.sql's N1/N2/N4/N5 " +
  'checks do (owner-run) — a grant built with dynamic SQL (execute format(...)), or a grant issued ' +
  'from inside a function body stored elsewhere.'
);

function stripBlockComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '');
}

function stripLineComments(sql) {
  return sql
    .split('\n')
    .map(line => line.replace(/--.*$/, ''))
    .join('\n');
}

function normalizeStatement(s) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function stripQuotes(s) {
  return s.replace(/"/g, '');
}

function extractStatements(sql) {
  return stripLineComments(stripBlockComments(sql))
    .split(';')
    .map(s => normalizeStatement(s))
    .filter(s => s.length > 0);
}

// Splits a comma-separated list at top-level commas only (not commas inside parentheses), so a
// column list like `(is_read, title)` is never mistaken for two separate list items.
function splitTopLevel(s) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map(p => p.trim()).filter(p => p.length > 0);
}

const PRIV_TOKEN_RE = /^(select|insert|update|delete|truncate|references|trigger|all)\b(?:\s+privileges)?\s*(?:\(([^)]*)\))?$/;

function parsePrivToken(tok) {
  const m = tok.match(PRIV_TOKEN_RE);
  if (!m) return null;
  return { priv: m[1], cols: m[2] !== undefined ? m[2].replace(/\s+/g, ' ').trim() : null };
}

const WITH_GRANT_OPTION_RE = /\bwith\s+grant\s+option\b/;

// Strips a trailing `WITH GRANT OPTION` and/or `GRANTED BY <role>`, in either order (applied
// twice to catch both orders), then removes quotes. The caller separately inspects the raw
// (unstripped) token for WITH GRANT OPTION before calling this — see (h).
function stripGranteeToken(tok) {
  let t = tok.trim();
  for (let i = 0; i < 2; i++) {
    t = t.replace(/\s+with\s+grant\s+option\s*$/, '');
    t = t.replace(/\s+granted\s+by\s+\S+\s*$/, '');
  }
  return stripQuotes(t).trim();
}

const ALL_TABLES_SCHEMA_RE = /^all\s+tables\s+in\s+schema\s+(.+)$/;

function isInScopeTableGrant(stmtNoQuotes, onPart) {
  if (stmtNoQuotes.includes('notifications')) return true;
  const m = stripQuotes(onPart).trim().match(ALL_TABLES_SCHEMA_RE);
  if (m) {
    const schemas = splitTopLevel(m[1]).map(s => s.trim());
    if (schemas.includes('public')) return true;
  }
  return false;
}

const failures = [];
const info = [];

let scannedInScope = 0;
let grantAuthTableSelect = false;
let grantAuthUpdateIsRead = false;

for (const file of SQL_FILES) {
  const fullPath = resolve(ROOT, file);
  if (!existsSync(fullPath)) {
    failures.push(`Missing file: ${file}`);
    continue;
  }
  const sql = readFileSync(fullPath, 'utf8');
  const allStmts = extractStatements(sql);

  for (const stmt of allStmts) {
    const stmtNoQuotes = stripQuotes(stmt);

    if (!stmt.startsWith('grant')) {
      // (g) — a fragment that mentions both GRANT and the table without itself being a GRANT
      // statement (a DO block, a comment-stripped remainder, text after other leading tokens)
      // cannot be verified by this parser and fails closed instead of being silently skipped.
      if (/\bgrant\b/.test(stmt) && stmtNoQuotes.includes('notifications')) {
        failures.push(`GRANT inside a block or after other text — cannot be verified: ${file} → ${stmt}`);
      }
      continue;
    }

    const tableMatch = stmt.match(/^grant\s+(.+?)\s+on\s+(.+?)\s+to\s+(.+)$/);

    if (tableMatch) {
      const [, privsPart, onPart, toPart] = tableMatch;
      if (!isInScopeTableGrant(stmtNoQuotes, onPart)) continue; // an unrelated table — ignored
      scannedInScope++;

      const privTokens = splitTopLevel(privsPart).map(parsePrivToken);
      if (privTokens.some(p => p === null)) {
        failures.push(`Unrecognised privilege token in an in-scope GRANT: ${file} → ${stmt}`);
        continue;
      }

      const rawGranteeTokens = splitTopLevel(toPart);
      const granteeTokens = rawGranteeTokens.map(stripGranteeToken);

      const badGrantee = granteeTokens.find(g => !TABLE_GRANTEE_ALLOWLIST.includes(g));
      if (badGrantee !== undefined) {
        failures.push(`Grantee "${badGrantee}" is outside the allowlist {authenticated, service_role} on an in-scope GRANT: ${file} → ${stmt}`);
        continue;
      }

      // (h) — authenticated must never hold WITH GRANT OPTION on this table.
      const authWithGrantOption = rawGranteeTokens.some(
        (raw, i) => granteeTokens[i] === 'authenticated' && WITH_GRANT_OPTION_RE.test(raw),
      );
      if (authWithGrantOption) {
        failures.push(`authenticated granted WITH GRANT OPTION on an in-scope GRANT: ${file} → ${stmt}`);
        continue;
      }

      if (granteeTokens.includes('authenticated')) {
        for (const p of privTokens) {
          const isAllowedSelect = p.priv === 'select' && p.cols === null;
          const isAllowedUpdate = p.priv === 'update' && p.cols === 'is_read';
          if (isAllowedSelect) {
            grantAuthTableSelect = true;
          } else if (isAllowedUpdate) {
            grantAuthUpdateIsRead = true;
          } else {
            const privLabel = p.cols !== null ? `${p.priv} (${p.cols})` : p.priv;
            failures.push(`authenticated granted "${privLabel}", outside table-level select / update (is_read), on an in-scope GRANT: ${file} → ${stmt}`);
          }
        }
      }
      continue;
    }

    // Role-membership form: `grant <role[, ...]> to <grantee[, ...]>` — no ON clause at all, so
    // it can never mention the table by name and is checked independently of "in scope".
    const membershipMatch = stmt.match(/^grant\s+(.+?)\s+to\s+(.+)$/);
    if (membershipMatch) {
      const [, , granteesRaw] = membershipMatch;
      const granteeTokens = splitTopLevel(granteesRaw).map(stripGranteeToken);
      const badGrantee = granteeTokens.find(g => MEMBERSHIP_TRIGGER_ROLES.includes(g));
      if (badGrantee !== undefined) {
        failures.push(`Role-membership GRANT (no ON clause) names "${badGrantee}" as grantee: ${file} → ${stmt}`);
      }
      continue;
    }

    if (stmtNoQuotes.includes('notifications')) {
      failures.push(`In-scope GRANT statement could not be parsed as a table grant or a role-membership grant: ${file} → ${stmt}`);
    }
  }
}

if (grantAuthTableSelect) {
  info.push('✅ authenticated table-level SELECT grant found.');
} else {
  failures.push('authenticated is NOT granted table-level SELECT on notifications in any SQL source file.');
}

if (grantAuthUpdateIsRead) {
  info.push('✅ authenticated UPDATE (is_read) grant found.');
} else {
  failures.push('authenticated is NOT granted UPDATE (is_read) on notifications in any SQL source file.');
}

if (failures.length === 0) {
  info.push('✅ Every in-scope GRANT stays inside the allowlist (authenticated/service_role; authenticated limited to select / update (is_read), never WITH GRANT OPTION); no role-membership grant names anon/authenticated/public; no unverifiable GRANT-mentioning fragment found.');
}

// Report
for (const line of info) console.log(line);

if (failures.length === 0) {
  console.log(`\n✅ notifications grant check PASSED — ${scannedInScope} in-scope GRANT statement(s) scanned across ${SQL_FILES.length} files.`);
  process.exit(0);
} else {
  console.error('\n❌ notifications grant check FAILED:\n');
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}
