/**
 * r7-61-narrowed-compare.mjs - AC32: the failing-rule set of every row across two full runs (a copy of r6-61-narrowed-compare.mjs,
 * changed only to take two run directories instead of three; the same script also compares the three runs of a narrowed
 * configuration, for the Story x state x width of AC32's isolation step)
 *
 *   node docs/sessions/evidence/task923/r7-61-narrowed-compare.mjs <dir-run-1> <dir-run-2> [<dir-run-3>]
 * Each directory holds the `rows.jsonl` of one run. For every row (Story | state | root | locale | width) it prints the
 * failing-rule set of each run and `same` / `DIFF`; at the end it lists every difference and classifies it. The only
 * difference AC32 allows is `focus-open` on `patterns-mantine-adminshell--drawer-open` rows (C118, a product race); any
 * other difference is run alone three times, sampled, recorded, and reported (strongest status PARTIALLY IMPLEMENTED); it does not stop the task.
 */
import { readFileSync } from 'node:fs';

const dirs = process.argv.slice(2);
if (dirs.length < 2 || dirs.length > 3) throw new Error('give two or three run directories');
const key = (r) => [r.story, r.state, r.root, r.locale, String(r.width).padStart(5, '0')].join(' | ');
const runs = dirs.map((d) => new Map(readFileSync(`${d}/rows.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).map((r) => [key(r), r])));
const failing = (r) => (r ? Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k).sort().join('+') || 'green' : '(missing)');
console.log(`platform ${process.platform} node ${process.version}`);
console.log(`runs ${dirs.join(' ; ')}; rows ${runs.map((m) => m.size).join(' / ')}`);
const keys = [...new Set(runs.flatMap((m) => [...m.keys()]))].sort();
const diffs = [];
for (const k of keys) {
  const sets = runs.map((m) => failing(m.get(k)));
  const same = sets.every((s) => s === sets[0]);
  console.log(`${same ? 'same' : 'DIFF'} ${k} :: ${sets.join(' || ')}`);
  if (!same) diffs.push({ k, sets });
}
console.log(`\nrows ${keys.length}; rows with a difference ${diffs.length}`);
let allowed = 0;
const blocked = [];
for (const { k, sets } of diffs) {
  // the allowed difference: the rule sets differ only by `focus-open`, on adminshell--drawer-open
  const strip = (s) => s.split('+').filter((x) => x !== 'focus-open').join('+') || 'green';
  const onlyFocusOpen = sets.every((s) => strip(s) === strip(sets[0]));
  if (onlyFocusOpen && /patterns-mantine-adminshell--drawer-open/.test(k)) allowed++;
  else blocked.push({ k, sets });
}
console.log(`differences allowed by AC32 (focus-open on adminshell--drawer-open): ${allowed}`);
console.log(`differences NOT allowed (AC32: isolate three times, sample, record, report PARTIALLY IMPLEMENTED): ${blocked.length}`);
for (const b of blocked) console.log(`  ${b.k} :: ${b.sets.join(' || ')}`);
process.exitCode = blocked.length === 0 ? 0 : 1;
