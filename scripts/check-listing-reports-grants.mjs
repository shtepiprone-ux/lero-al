#!/usr/bin/env node
/**
 * check-listing-reports-grants.mjs — Static grant regression check for listing_reports (Task 460).
 *
 * Scans the SQL source-of-truth files for listing_reports grant/revoke statements and asserts:
 *   1. authenticated is granted INSERT and SELECT.
 *   2. No un-countered revoke of INSERT/SELECT from authenticated exists.
 *   3. anon is NOT granted INSERT or SELECT.
 *   4. authenticated is NOT granted UPDATE, DELETE, or ALL (overgrant gate).
 *
 * Strips SQL comments and normalizes case/whitespace before evaluation.
 * CI-runnable — no DB, no server, no auth required.
 *
 * Usage:
 *   node scripts/check-listing-reports-grants.mjs
 *   npm run check:listing-reports-grants
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SQL_FILES = [
  'scripts/grant-discipline-audit.sql',
  'scripts/task-460-listing-reports-authenticated-grants.sql',
];

function stripComments(sql) {
  return sql
    .split('\n')
    .map(line => line.replace(/--.*$/, ''))
    .join('\n');
}

function normalizeStatement(s) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractStatements(sql) {
  return stripComments(sql)
    .split(';')
    .map(s => normalizeStatement(s))
    .filter(s => s.length > 0);
}

function isListingReportsStatement(stmt) {
  return /\bpublic\.listing_reports\b/.test(stmt) || /\blisting_reports\b/.test(stmt);
}

const failures = [];
const info = [];

let allStatements = [];
for (const file of SQL_FILES) {
  const fullPath = resolve(ROOT, file);
  if (!existsSync(fullPath)) {
    failures.push(`Missing file: ${file}`);
    continue;
  }
  const sql = readFileSync(fullPath, 'utf8');
  const stmts = extractStatements(sql);
  allStatements.push(...stmts.filter(isListingReportsStatement).map(s => ({ file, stmt: s })));
}

const grantAuth = [];
const revokeAuth = [];
const grantAnon = [];
const grantOverAuth = [];

for (const { file, stmt } of allStatements) {
  if (/^grant\b/.test(stmt) && /\bauthenticated\b/.test(stmt)) {
    if (/\ball\b/.test(stmt) || /\bupdate\b/.test(stmt) || /\bdelete\b/.test(stmt)) {
      grantOverAuth.push({ file, stmt });
    }
    if (/\binsert\b/.test(stmt)) grantAuth.push({ type: 'insert', file, stmt });
    if (/\bselect\b/.test(stmt)) grantAuth.push({ type: 'select', file, stmt });
  }
  if (/^revoke\b/.test(stmt) && /\bauthenticated\b/.test(stmt)) {
    if (/\binsert\b/.test(stmt) || /\bselect\b/.test(stmt) || /\ball\b/.test(stmt)) {
      revokeAuth.push({ file, stmt });
    }
  }
  if (/^grant\b/.test(stmt) && /\banon\b/.test(stmt)) {
    if (/\binsert\b/.test(stmt) || /\bselect\b/.test(stmt) || /\ball\b/.test(stmt)) {
      grantAnon.push({ file, stmt });
    }
  }
}

// Check 1: authenticated has INSERT grant
const hasInsert = grantAuth.some(g => g.type === 'insert');
if (!hasInsert) {
  failures.push('authenticated is NOT granted INSERT on listing_reports in any SQL source file.');
} else {
  info.push('✅ authenticated INSERT grant found.');
}

// Check 2: authenticated has SELECT grant
const hasSelect = grantAuth.some(g => g.type === 'select');
if (!hasSelect) {
  failures.push('authenticated is NOT granted SELECT on listing_reports in any SQL source file.');
} else {
  info.push('✅ authenticated SELECT grant found.');
}

// Check 3: no un-countered revoke of INSERT/SELECT from authenticated
if (revokeAuth.length > 0) {
  for (const r of revokeAuth) {
    failures.push(`Un-countered revoke of INSERT/SELECT from authenticated: ${r.file} → ${r.stmt}`);
  }
} else {
  info.push('✅ No revoke of INSERT/SELECT from authenticated on listing_reports.');
}

// Check 4: anon NOT granted
if (grantAnon.length > 0) {
  for (const g of grantAnon) {
    failures.push(`anon granted INSERT/SELECT on listing_reports (must be locked out): ${g.file} → ${g.stmt}`);
  }
} else {
  info.push('✅ anon is NOT granted INSERT/SELECT on listing_reports.');
}

// Check 5: no overgrant to authenticated (UPDATE/DELETE/ALL)
if (grantOverAuth.length > 0) {
  for (const g of grantOverAuth) {
    failures.push(`Overgrant to authenticated (UPDATE/DELETE/ALL): ${g.file} → ${g.stmt}`);
  }
} else {
  info.push('✅ No overgrant (UPDATE/DELETE/ALL) to authenticated on listing_reports.');
}

// Report
for (const line of info) console.log(line);

if (failures.length === 0) {
  console.log(`\n✅ listing_reports grant check PASSED — ${allStatements.length} statements scanned across ${SQL_FILES.length} files.`);
  process.exit(0);
} else {
  console.error('\n❌ listing_reports grant check FAILED:\n');
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}
