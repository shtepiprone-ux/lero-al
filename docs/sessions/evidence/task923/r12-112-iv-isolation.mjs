/**
 * r12-112-iv-isolation.mjs - R55 outcome (iv), first condition: "the row's verdict is the same in the full run and in three isolated runs".
 * For each of the six `listingdetailview` Stories, compares the verdict of EVERY row of the Story (Story x state x root x locale x width -> rule keys with a finding, and the findings)
 * in `r12-full` with the isolated runs `a`, `b` (r12-60-story-pairs.mjs) and `c` (r12-62-story-third-runs.mjs). Prints per Story: rows, failing rows, and the number of rows
 * whose verdict differs from the full run, per isolated run.
 *   node docs/sessions/evidence/task923/r12-112-iv-isolation.mjs
 * Exit 1 when any row differs.
 */
import { readFileSync } from 'node:fs';

const OUT = 'docs/sessions/evidence/task923';
const STORIES = [
  'patterns-mantine-listingdetailview--public-listing',
  'patterns-mantine-listingdetailview--public-listing-not-reduced',
  'patterns-mantine-listingdetailview--public-listing-converted',
  'patterns-mantine-listingdetailview--staff-preview-unpublished',
  'patterns-mantine-listingdetailview--staff-preview-published',
  'patterns-mantine-listingdetailview--archived-listing',
];
const key = (r) => [r.story, r.state, r.root, r.locale, r.width].join(' | ');
const verdict = (r) => JSON.stringify(Object.entries(r.rules).filter(([, v]) => Array.isArray(v) && v.length).sort(([a], [b]) => (a < b ? -1 : 1)));
const load = (file, story) => new Map(readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.story === story).map((r) => [key(r), r]));

let differing = 0;
for (const story of STORIES) {
  const full = load(`${OUT}/r12-full/rows.jsonl`, story);
  const failing = [...full.values()].filter((r) => verdict(r) !== '[]').length;
  const parts = [];
  for (const run of ['a', 'b', 'c']) {
    const iso = load(`${OUT}/r12-story/${story}-${run}/rows.jsonl`, story);
    let diff = 0;
    for (const [k, r] of full) if (!iso.has(k) || verdict(iso.get(k)) !== verdict(r)) diff++;
    for (const k of iso.keys()) if (!full.has(k)) diff++;
    differing += diff;
    parts.push(`${run}: ${iso.size} rows, ${diff} differ`);
  }
  console.log(`${story.replace('patterns-mantine-', '')}: full ${full.size} rows, ${failing} failing; ${parts.join('; ')}`);
}
console.log(`rows whose verdict differs from the full run, all isolated runs: ${differing}`);
process.exit(differing ? 1 : 0);
