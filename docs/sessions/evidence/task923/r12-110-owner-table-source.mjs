/**
 * r12-110-owner-table-source.mjs - the source of the owner table of R55 (Task 923 Revision 12). Groups the failing rows of a run by Story x rule, the way
 * r10-110-owner-table-source.txt was laid out: one block per (Story, rule) with its row count, states, widths, locales and the distinct details.
 *
 *   node docs/sessions/evidence/task923/r12-110-owner-table-source.mjs <run dir>
 * Prints: the row counts, then one block per Story x rule of the failing rows (a rule key with a non-empty finding list). Reads only `<run dir>/rows.jsonl`.
 */
import { readFileSync } from 'node:fs';

const dir = process.argv[2];
if (!dir) throw new Error('give the run directory');
const rows = readFileSync(`${dir}/rows.jsonl`, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const failing = rows.filter((r) => Object.values(r.rules).some((v) => Array.isArray(v) && v.length));
console.log(`rows ${rows.length} | failing rows ${failing.length}`);

const groups = new Map();
for (const r of failing) {
  for (const [rule, found] of Object.entries(r.rules)) {
    if (!Array.isArray(found) || !found.length) continue;
    const key = `${r.story} :: ${rule}`;
    const g = groups.get(key) ?? { rows: 0, states: new Set(), widths: new Set(), locales: new Set(), roots: new Set(), details: new Set() };
    g.rows++;
    g.states.add(r.state === r.story ? '(mount)' : r.state.replace(`${r.story}~`, ''));
    g.widths.add(r.width);
    g.locales.add(r.locale);
    g.roots.add(r.root);
    for (const d of found) g.details.add(String(d));
    groups.set(key, g);
  }
}
for (const [key, g] of [...groups].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
  const w = [...g.widths].sort((a, b) => a - b).join(',');
  console.log(`${g.rows} rows | ${key} | roots ${[...g.roots].sort().join(',')} | states ${[...g.states].sort().join(',')} | widths ${w} | ${g.locales.size} locales`);
  for (const d of [...g.details].sort().slice(0, 6)) console.log(`     ${d}`);
}
