/**
 * r8-61-narrowed-compare.mjs - AC36: the comparator of two runs (a copy of r7-61-narrowed-compare.mjs, changed to take two run
 * directories and to apply the allowed list of AC36 instead of the single AC32 class).
 *
 *   node docs/sessions/evidence/task923/r8-61-narrowed-compare.mjs <dir-run-1> <dir-run-2>
 * Each directory holds the `rows.jsonl` of one run. It prints every row (Story | state | root | locale | width) whose failing-rule set
 * differs between the two runs, with the class that allows it or `NOT ALLOWED`, and exits 1 when any difference is not allowed.
 * The allowed list starts with exactly the three classes of AC36 (1 focus-open on the AdminShell drawer, 2 the Leaflet popup race,
 * 3 the share tooltip race) and grows only by an R33 outcome (ii): one narrowly named class per probe, with that probe as evidence
 * (an entry of EXTRA_CLASSES below, `evidence` naming the probe file). A job retried for `resource failed:` and recovered has no
 * allowance: its rows must equal the other run's.
 */
import { readFileSync } from 'node:fs';

/** Classes added by an R33 outcome (ii). { id, evidence, test(row, only, rowA, rowB) -> boolean } - empty at the start. */
// Story 059 proposed a class 4 (the ApexCharts canvas wider than its parent on a slow machine); it was FIXED in the product instead
// (useApexFluidBox, r8-71 / r8-74: 0 of 480 trials after the fix, 2 of 80 before), so no class was added.
const EXTRA_CLASSES = [];

const dirs = process.argv.slice(2);
if (dirs.length !== 2) throw new Error('give two run directories');
const key = (r) => [r.story, r.state, r.root, r.locale, String(r.width).padStart(5, '0')].join(' | ');
const load = (d) => new Map(readFileSync(`${d}/rows.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((r) => [key(r), r]));
const runs = dirs.map(load);
const rulesOf = (r) => (r ? Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k).sort() : null);
const label = (r) => (r ? rulesOf(r).join('+') || 'green' : '(missing)');

/** The allowed classes of AC36 (1-3), then EXTRA_CLASSES. `only` = the rules in the symmetric difference; `rowA`/`rowB` the two rows. */
function classify(row, only, rowA, rowB) {
  const both = [rowA, rowB];
  if (both.some((r) => !r)) return null; // a row missing from one run is never allowed
  const hasIt = (rule) => both.filter((r) => r.rules[rule].length);
  if (only.length === 1 && only[0] === 'focus-open' && /^patterns-mantine-adminshell--drawer-open$/.test(row.story)) return '1 focus-open on adminshell--drawer-open (C118)';
  if (row.root === 'app' && /^patterns-mantine-listingdetailview--/.test(row.story) && only.every((r) => r === 'component-overflow' || r === 'text-hidden')
    && only.every((rule) => hasIt(rule).every((x) => x.rules[rule].every((d) => d.includes('leaflet-popup') || d.includes('listing-map'))))) {
    return '2 Leaflet popup race (C172-C176, C182)';
  }
  if (row.root === 'portal:0' && /~share-listing$/.test(row.state) && only.length === 1 && only[0] === 'dismiss-escape'
    && hasIt('dismiss-escape').every((x) => x.rules['dismiss-escape'].every((d) => d === 'dismiss-escape: the portal is still visible 5000ms after the dismissal'))) {
    return '3 share tooltip race (C177-C181)';
  }
  for (const c of EXTRA_CLASSES) if (c.test(row, only, rowA, rowB)) return `${c.id} (${c.evidence})`;
  return null;
}

console.log(`platform ${process.platform} node ${process.version}`);
console.log(`runs ${dirs.join(' ; ')}; rows ${runs.map((m) => m.size).join(' / ')}`);
const keys = [...new Set(runs.flatMap((m) => [...m.keys()]))].sort();
const blocked = [];
let differing = 0;
const byClass = new Map();
for (const k of keys) {
  const [a, b] = runs.map((m) => m.get(k));
  const ra = rulesOf(a);
  const rb = rulesOf(b);
  if (ra && rb && ra.join('+') === rb.join('+')) continue;
  differing++;
  const row = a ?? b;
  const only = ra && rb ? [...new Set([...ra.filter((x) => !rb.includes(x)), ...rb.filter((x) => !ra.includes(x))])] : [];
  const cls = classify(row, only, a, b);
  const retries = [a?.retry, b?.retry].map((x) => (x ? ` retry ${JSON.stringify(x.slice(0, 80))}` : '')).join('');
  console.log(`DIFF ${k} :: ${label(a)} || ${label(b)} :: ${cls ? `allowed by class ${cls}` : 'NOT ALLOWED'}${retries ? ` ::${retries}` : ''}`);
  if (cls) byClass.set(cls, (byClass.get(cls) ?? 0) + 1);
  else blocked.push(k);
}
console.log(`\nrows ${keys.length}; rows with a difference ${differing}`);
for (const [c, n] of byClass) console.log(`  allowed, class ${c}: ${n}`);
console.log(`differences NOT allowed (R33: diagnose, then outcome (i) gate defect / (ii) product race / (iii) unresolved): ${blocked.length}`);
process.exitCode = blocked.length === 0 ? 0 : 1;
