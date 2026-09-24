#!/usr/bin/env node
/**
 * check-notification-type-enum.mjs — TS/enum-record drift guard (Task 880).
 *
 * Compares the `NotificationType` union declared in src/types/database.ts against the
 * versioned record in scripts/notification-type-enum.json and fails when the two sets
 * differ in either direction, naming each extra and each missing value.
 *
 * Scope (printed on every run): this gate compares the TypeScript union with the
 * committed record. It CANNOT see the live database — that gap is closed separately by
 * the owner running scripts/task-880-verify.sql against Supabase (O82-1), which is the
 * only source of truth for what the live public.notification_type enum actually accepts.
 *
 * Exit codes:
 *   0 — the two sets are identical.
 *   1 — the two sets differ (each extra/missing value is named).
 *   2 — either source could not be parsed.
 *
 * Usage:
 *   node scripts/check-notification-type-enum.mjs
 *   npm run check:notification-type-enum
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const TS_FILE = 'src/types/database.ts';
const JSON_FILE = 'scripts/notification-type-enum.json';

console.log('SCOPE: this gate compares the TS NotificationType union with the committed');
console.log(`       record (${JSON_FILE}). It cannot see the live database — O82-1's`);
console.log('       scripts/task-880-verify.sql closes that gap separately.');

// ── Parse the TS union ──────────────────────────────────────────────────────────

const tsPath = resolve(ROOT, TS_FILE);
if (!existsSync(tsPath)) {
  console.error(`\n❌ Cannot find ${TS_FILE}`);
  process.exit(2);
}

const tsSource = readFileSync(tsPath, 'utf8');
const tsMatch = tsSource.match(/export type NotificationType\s*=\s*([^\n]+)/);
if (!tsMatch) {
  console.error(`\n❌ Cannot find "export type NotificationType = ..." in ${TS_FILE}`);
  process.exit(2);
}

const tsValues = tsMatch[1]
  .split('|')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => {
    const m = s.match(/^'([^']+)'$/);
    return m ? m[1] : null;
  });

if (tsValues.some(v => v === null) || tsValues.length === 0) {
  console.error(`\n❌ Could not parse every NotificationType member as a quoted string literal in ${TS_FILE}`);
  process.exit(2);
}

const tsSet = new Set(tsValues);

// ── Parse the committed record ──────────────────────────────────────────────────

const jsonPath = resolve(ROOT, JSON_FILE);
if (!existsSync(jsonPath)) {
  console.error(`\n❌ Cannot find ${JSON_FILE}`);
  process.exit(2);
}

let record;
try {
  record = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch (err) {
  console.error(`\n❌ Cannot parse ${JSON_FILE} as JSON: ${err.message}`);
  process.exit(2);
}

if (!Array.isArray(record?.values) || record.values.length === 0) {
  console.error(`\n❌ ${JSON_FILE} has no non-empty "values" array`);
  process.exit(2);
}

const recordSet = new Set(record.values);

// ── Diff ─────────────────────────────────────────────────────────────────────────

const missingFromRecord = [...tsSet].filter(v => !recordSet.has(v));
const extraInRecord = [...recordSet].filter(v => !tsSet.has(v));

if (missingFromRecord.length === 0 && extraInRecord.length === 0) {
  console.log(`\n✅ notification-type-enum check PASSED — ${tsSet.size} values match between ${TS_FILE} and ${JSON_FILE}.`);
  process.exit(0);
}

console.error('\n❌ notification-type-enum check FAILED:\n');
for (const v of missingFromRecord) {
  console.error(`   missing from the record: '${v}' (declared in ${TS_FILE}, absent from ${JSON_FILE})`);
}
for (const v of extraInRecord) {
  console.error(`   extra in the record: '${v}' (present in ${JSON_FILE}, absent from ${TS_FILE})`);
}
process.exit(1);
