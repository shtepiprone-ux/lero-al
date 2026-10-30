// Task 923 R52 / AC55 (AC36): the changes of the final full run `r8-full` against `r7-full-b`, for information. A copy of r7-85-row-diff.mjs with its input paths changed (new = r8-full,
// base = r7-full-b, older = r7-full-a, which the R31 attribution needs); the attribution rules (R28, R29, R31) and everything else are unchanged, except one `?.` on the base row's
// rule list: the base runs have 20 rule keys and the final run 22 (`svg-text-clipped`, `text-overlap`), so the copy crashed on a rule the base row lacks.
//   node docs/sessions/evidence/task923/r8-85-row-diff.mjs [new rows.jsonl] [base rows.jsonl] [older rows.jsonl]
// For every row present in both runs and every rule: a STATUS change (the rule failed in one run only) or a DETAIL change (the
// printed details differ in shape - digits are normalised - while the rule fails in both). Each change is attributed by its
// detail to the requirement that explains it, or listed:
//   R28  a dismiss-* detail "the portal is still visible 1000ms after the dismissal" is gone and nothing was added: the
//        overlay is now given 5 000ms to close.
//   R29  the base row carries `retry`: a retried row merged the first attempt into the second one.
//   R31  a detail that the base run lacked and the older run had is back, and nothing was removed: the page
//        is measured once settled (a chart, a late list).
//   A change that no rule above explains is LISTED, with its details, never attributed by guess.
import { readFileSync } from 'node:fs';

const D = 'docs/sessions/evidence/task923';
const newPath = process.argv[2] ?? `${D}/r8-full/rows.jsonl`;
const basePath = process.argv[3] ?? `${D}/r7-full-b/rows.jsonl`;
const olderPath = process.argv[4] ?? `${D}/r7-full-a/rows.jsonl`;
const load = (p) => readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const key = (r) => `${r.story} | ${r.state} | ${r.root} | ${r.locale} | ${r.width}`;
const componentOf = (story) => story.replace(/--.*$/, '').replace(/^(patterns-mantine|mantine-primitives)-/, '');
const a = new Map(load(basePath).map((r) => [key(r), r]));
const b = new Map(load(newPath).map((r) => [key(r), r]));
const o = new Map(load(olderPath).map((r) => [key(r), r]));
console.log(`platform ${process.platform} node ${process.version}`);
console.log(`new ${newPath}: ${b.size} rows; base ${basePath}: ${a.size} rows; older ${olderPath}: ${o.size} rows`);
const onlyA = [...a.keys()].filter((k) => !b.has(k));
const onlyB = [...b.keys()].filter((k) => !a.has(k));
console.log(`rows only in the base ${onlyA.length}; only in the new run ${onlyB.length}`);
for (const k of onlyA.slice(0, 20)) console.log(`  only base: ${k}`);
for (const k of onlyB.slice(0, 20)) console.log(`  only new: ${k}`);

const TAIL = /^…\+\d+ more \(\d+ in total\)$/;
const shape = (d) => d.replace(/-?\d+(\.\d+)?/g, '#');
const multisetDiff = (xs, ys) => { const m = new Map(); for (const y of ys) m.set(y, (m.get(y) ?? 0) + 1); const out = []; for (const x of xs) { const n = m.get(x) ?? 0; if (n > 0) m.set(x, n - 1); else out.push(x); } return out; };

const attribution = {};
const perRuleComponent = {};
const listed = [];
let changes = 0;
let rowsChanged = new Set();
for (const [k, rb] of b) {
  const ra = a.get(k);
  if (!ra) continue;
  for (const rule of Object.keys(rb.rules)) {
    const A = (ra.rules[rule] ?? []).filter((d) => !TAIL.test(d));
    const B = rb.rules[rule].filter((d) => !TAIL.test(d));
    const tailA = (ra.rules[rule] ?? []).length - A.length;
    const tailB = rb.rules[rule].length - B.length;
    const status = (ra.rules[rule]?.length > 0) !== (rb.rules[rule].length > 0);
    const removed = multisetDiff(A.map(shape), B.map(shape));
    const added = multisetDiff(B.map(shape), A.map(shape));
    if (!status && !removed.length && !added.length && !(tailA !== tailB)) continue;
    changes++;
    rowsChanged.add(k);
    const kind = status ? (ra.rules[rule]?.length ? 'failing -> green' : 'green -> failing') : 'details changed';
    const comp = componentOf(rb.story);
    const bucket = `${rule}: ${kind} :: ${comp}`;
    perRuleComponent[bucket] = (perRuleComponent[bucket] ?? 0) + 1;
    let by = null;
    const older = (o.get(k)?.rules[rule] ?? []).map(shape);
    if (/^dismiss-/.test(rule) && removed.length && !added.length && removed.every((x) => /still visible #ms after the dismissal/.test(x))) by = 'R28';
    else if ('retry' in ra) by = 'R29';
    else if (added.length && !removed.length && added.every((x) => older.includes(x))) by = 'R31';
    if (by) attribution[by] = (attribution[by] ?? 0) + 1;
    else listed.push({ k, rule, kind, A: A.slice(0, 2), B: B.slice(0, 2) });
  }
}
console.log(`\nrows in both runs with at least one change: ${rowsChanged.size}; changes (row x rule): ${changes}`);
console.log(`attributed by detail: ${JSON.stringify(attribution)}; listed (no requirement explains them by detail): ${listed.length}`);
console.log('\nchanges per rule, direction and component (row counts):');
for (const k of Object.keys(perRuleComponent).sort()) console.log(`  ${perRuleComponent[k]} x ${k}`);
console.log('\nlisted changes (row | rule | direction | details in the base | details in the new run):');
for (const l of listed) console.log(`  ${l.k} | ${l.rule} | ${l.kind} | base: ${l.A.join(' ;; ') || '-'} | new: ${l.B.join(' ;; ') || '-'}`);
