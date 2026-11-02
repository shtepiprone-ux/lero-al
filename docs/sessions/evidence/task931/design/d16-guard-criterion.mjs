// Task 931 revision 3 design (Opus, read-only, 2026-11-02): the exact criterion the new guard test will apply. Does it
// reproduce the d09 list of hand-written Supabase query doubles? Usage: node <this file>
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
// Revision of the criterion (same session): the Supabase SDK mocked directly also counts, and a filter stub that ignores
// its arguments counts even in a file that imports fakeSupabase (error-path overrides).
const FACTORY = /vi\.mock\(\s*['"](?:@\/lib\/supabase\/(?:server|admin|client|browser)|@supabase\/ssr|@supabase\/supabase-js)['"]/;
const BLIND = /\b(?:eq|neq|lt|lte|gt|gte|is|in|ilike|like|match|contains|or|filter|not)\s*:\s*(?:\(\s*\)\s*=>|vi\.fn\(\s*\)|vi\.fn\(\s*\(\s*\)\s*=>)/;
const FAKE = /['"]@\/tests\/fakeSupabase['"]|['"](?:\.\.\/)+(?:tests\/)?fakeSupabase['"]/;
// a query method defined as a property (arrow, vi.fn, function, or a named spy) or with method syntax `from(table) {`
const DOUBLE = /\b(?:from|select|eq|insert|update|delete)\s*(?::\s*(?:vi\.fn|\(|async\s*\(|function\b|[A-Za-z_$][\w$]*\s*[,}\n])|\([^)]*\)\s*\{)/;
const files = [];
(function walk(dir) {
  for (const e of readdirSync(resolve(ROOT, dir), { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p); else if (/\.test\.tsx?$/.test(e.name)) files.push(p);
  }
})('src');
const hits = files.filter(f => { const t = readFileSync(resolve(ROOT, f), 'utf8'); return (FACTORY.test(t) && !FAKE.test(t) && DOUBLE.test(t)) || BLIND.test(t); }); // BLIND also catches injected clients
const blindOnly = hits.filter(f => { const t = readFileSync(resolve(ROOT, f), 'utf8'); return !(FACTORY.test(t) && !FAKE.test(t) && DOUBLE.test(t)); });
console.log(`hits that only the filter-blind rule finds: ${blindOnly.length}`);
const d09 = readFileSync(resolve(ROOT, 'docs/sessions/evidence/task931/design/d09-hand-written-query-doubles.txt'), 'utf8')
  .split(/\r?\n/).filter(l => /^src\/\S+\.test\.tsx?$/.test(l));
console.log(`test files ${files.length}; guard hits ${hits.length}; d09 files ${d09.length}; integration hits ${hits.filter(f => f.endsWith('.integration.test.ts')).length}`);
console.log(`in d09, not hit: ${JSON.stringify(d09.filter(f => !hits.includes(f)))}`);
console.log(`hit, not in d09: ${JSON.stringify(hits.filter(f => !d09.includes(f)))}`);
console.log('Guard hits (the revision 3 migration list):');
for (const f of hits.sort()) console.log(f);
