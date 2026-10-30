/**
 * r12-113-r54-rows.mjs - R55: the rows of `r12-full` that differ from `r10-108-full-merged`, against the rows R54 reports.
 * A row "differs" when its set of rule keys with a finding, or one of the findings, is not the same in the two runs. Prints, per Story and width: the failing rows of `r12-full`, how many of
 * them differ from the base, and whether each differing row's whole change is a `text-overlap` finding (the base row has no `text-overlap` finding and every other rule is equal).
 *   node docs/sessions/evidence/task923/r12-113-r54-rows.mjs
 * Exit 1 when a differing row changes anything but its `text-overlap` finding.
 */
import { readFileSync } from 'node:fs';

const D = 'docs/sessions/evidence/task923';
const key = (r) => [r.story, r.state, r.root, r.locale, r.width].join(' | ');
const load = (dir) => new Map(readFileSync(`${dir}/rows.jsonl`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((r) => [key(r), r]));
const found = (r) => Object.fromEntries(Object.entries(r.rules).filter(([, v]) => Array.isArray(v) && v.length).map(([k, v]) => [k, JSON.stringify(v)]));
const neu = load(`${D}/r12-full`);
const base = load(`${D}/r10-108-full-merged`);

let differing = 0, onlyOverlap = 0, other = 0;
const perStoryWidth = new Map();
const otherRows = [];
for (const [k, r] of neu) {
  const b = base.get(k);
  const fa = found(r), fb = b ? found(b) : null;
  const failing = Object.keys(fa).length > 0;
  const same = fb && JSON.stringify(fa) === JSON.stringify(fb);
  if (!failing && same) continue;
  const g = `${r.story.replace('patterns-mantine-', '')} @${r.width}`;
  const e = perStoryWidth.get(g) ?? { failing: 0, differ: 0, overlapOnly: 0 };
  if (failing) e.failing++;
  if (!same) {
    differing++;
    e.differ++;
    const faRest = { ...fa }; delete faRest['text-overlap'];
    const fbRest = { ...(fb ?? {}) }; delete fbRest['text-overlap'];
    if (fb && !fb['text-overlap'] && fa['text-overlap'] && JSON.stringify(faRest) === JSON.stringify(fbRest)) { onlyOverlap++; e.overlapOnly++; } else { other++; otherRows.push(k); }
  }
  perStoryWidth.set(g, e);
}
for (const [g, e] of [...perStoryWidth].sort((a, b) => (a[0] < b[0] ? -1 : 1))) console.log(`${g}: failing rows ${e.failing}; differ from r10-108-full-merged ${e.differ}; whole change is a new text-overlap finding ${e.overlapOnly}`);
console.log(`rows differing from r10-108-full-merged: ${differing}; whole change a new text-overlap finding: ${onlyOverlap}; any other change: ${other}`);
for (const k of otherRows.slice(0, 20)) console.log(`OTHER ${k}`);
process.exit(other ? 1 : 0);
