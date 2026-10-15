// Review 6 (diagnosis; Revision 6 AC31 copies it with only its input paths changed). Compares two full runs row by row
// (Story | state | root | locale | width): the rows whose pass verdict differs, grouped by the change of their failing-rule
// set, then the cells (Story | state | locale | width, all roots) whose verdict differs.
//   node docs/sessions/evidence/task923/review-6/rv6-11-verdict-flips.mjs <base rows.jsonl> <new rows.jsonl>
import { readFileSync } from 'node:fs';
const load = (p) => new Map(readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((r) => [[r.story, r.state, r.root, r.locale, r.width].join('|'), r]));
const [a, b] = [load(process.argv[2]), load(process.argv[3])];
const fail = (r) => Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k);
const flips = {};
const cellA = new Map();
const cellB = new Map();
for (const [k, ra] of a) {
  const rb = b.get(k);
  if (!rb) continue;
  const c = k.split('|');
  const cell = [c[0], c[1], c[3], c[4]].join('|');
  cellA.set(cell, (cellA.get(cell) ?? true) && ra.pass);
  cellB.set(cell, (cellB.get(cell) ?? true) && rb.pass);
  if (ra.pass !== rb.pass) {
    const fa = fail(ra);
    const fb = fail(rb);
    const diff = [...fa.filter((x) => !fb.includes(x)).map((x) => `-${x}`), ...fb.filter((x) => !fa.includes(x)).map((x) => `+${x}`)].join(',');
    flips[diff] = (flips[diff] || 0) + 1;
  }
}
console.log(`row pass flips ${process.argv[2]} -> ${process.argv[3]} by rule change:`);
for (const [k, v] of Object.entries(flips).sort((x, y) => y[1] - x[1])) console.log(`   ${v} ${k}`);
const cells = [...cellA].filter(([c, v]) => v !== cellB.get(c));
console.log(`cell (story x state x locale x width) verdict flips: ${cells.length}`);
for (const [c, v] of cells) console.log(`   ${c} ${v}->${cellB.get(c)}`);
