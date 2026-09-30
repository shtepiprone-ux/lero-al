// Task 863 review 1 — adversarial probe (read-only; Opus reviewer, 2026-09-30).
// The gate module runs its scan and calls process.exit at import time, so this probe copies the
// detector section (everything before `console.log(SCOPE_LINE);`) into the OS temp dir and imports it.
// Run from the project root: node.exe docs/sessions/evidence/task863/30-review1-adversarial-probe.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const src = readFileSync('scripts/check-listing-visibility.mjs', 'utf8');
const cut = src.indexOf('console.log(SCOPE_LINE);');
if (cut < 0) throw new Error('cut marker not found');
const tmp = join(tmpdir(), `task863-detector-${process.pid}.mjs`);
writeFileSync(tmp, src.slice(0, cut));
const { detectVisibilityViolations: d } = await import(pathToFileURL(tmp).href);

const cases = [
  ['A write carrying a literal through a factory -> excluded (0)', 0,
    "const base = () => db.from('listings').select('*')\nawait base().update({ x: 1 }).eq('status', 'active')"],
  ['B same factory name declared twice in one file -> reported twice (over-report, N2)', 2,
    "function a(){ const base = () => db.from('listings').select('*')\n return base().eq('status','active') }\nfunction b(){ const base = () => db.from('listings').select('id')\n return 1 }"],
  ['C call inside a multi-line arrow argument -> detected', 1,
    "const listingCount = () => db.from('listings').select('id')\nawait countOf(() =>\n  listingCount().eq('status', 'active'))"],
  ['D derived variable reassigned inside if -> detected', 1,
    "const base = () => db.from('listings').select('*')\nlet q = base()\nif (x) q = q.in('status', ['active'])"],
  ['E factory name inside another identifier (database) -> clean', 0,
    "const base = () => db.from('listings').select('*')\nconst r = database().eq('status','active')"],
  ['F async arrow factory -> detected', 1,
    "const load = async () => (await client()).from('listings').select('*')\nconst r = await (await load()).eq('status','active')"],
  ['G non-factory lambda before from(listings) -> clean, no crash', 0,
    "const rows = await Promise.all(ids.map((id) => db.from('listings').select().eq('id', id)))"],
];

let mismatches = 0;
for (const [label, expected, code] of cases) {
  const v = d(code, 'probe.ts');
  const ok = v.length === expected;
  if (!ok) mismatches++;
  console.log(`${ok ? 'AS EXPECTED' : 'MISMATCH   '} ${label}: ${v.length} hit(s) ${JSON.stringify(v.map(x => x.line))}`);
}
console.log(`probe done — ${mismatches} mismatch(es)`);
process.exit(mismatches ? 1 : 0);
