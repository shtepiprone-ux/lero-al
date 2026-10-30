/**
 * r8-146-test-matrix.mjs - the map and the completeness check of the unit-test work (Task 923 Revision 7, owner 2026-10-17).
 *
 *   node docs/sessions/evidence/task923/r8-146-test-matrix.mjs --coverage <dir with coverage-summary.json> [--phase 1|2|all] [--check] [--out <dir>]
 * Joins three measurements into one row per production file:
 *   - r8-144 inventory (does a test import it: direct / indirect / none; its exported symbols = its "elements"),
 *   - V8 coverage of the whole unit-test run (lines, branches, functions; `npx vitest run --coverage.enabled --coverage.provider=v8 ...`),
 *   - the mutation score of the file (r8-145, optional `r8-147-mutation-scores.json`) and a recorded exemption (optional `r8-148-exemptions.json`).
 * A file is DONE when it has a direct test AND lines >= LINES AND branches >= BRANCHES AND functions >= FUNCS (or a recorded exemption names the reason)
 * AND, where a mutation score is recorded, score >= MUTATION. `--check` exits 1 while any file of the chosen phase is not DONE: it is the stage-5 omission check.
 * Phase 1 = components and hooks (`.tsx` and `use*.ts`, the inventory scope); phase 2 = every other production file of src/ (lib, actions, services).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const BAR = { lines: 90, branches: 80, functions: 90, mutation: 70 };

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const covDir = resolve(opt('--coverage', 'docs/sessions/evidence/task923/cov-baseline'));
const phase = opt('--phase', 'all');
const outDir = resolve(opt('--out', 'docs/sessions/evidence/task923'));
const check = args.includes('--check');
const root = process.cwd();
const rel = (p) => p.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', '');

const cov = JSON.parse(readFileSync(join(covDir, 'coverage-summary.json'), 'utf8'));
const inv = JSON.parse(readFileSync(join(outDir, 'r8-144-inventory.json'), 'utf8'));
const read = (f, d) => (existsSync(join(outDir, f)) ? JSON.parse(readFileSync(join(outDir, f), 'utf8')) : d);
const mutation = read('r8-147-mutation-scores.json', {});
const exemptions = read('r8-148-exemptions.json', {});

const invByFile = new Map(inv.rows.map((r) => [r.file, r]));
const files = Object.keys(cov).filter((f) => f !== 'total').map(rel).filter((f) => f.startsWith('src/'));
const rows = files.map((f) => {
  const c = cov[Object.keys(cov).find((k) => rel(k) === f)];
  const i = invByFile.get(f);
  const inScope1 = !!i;
  const m = mutation[f];
  const ex = exemptions[f];
  const pct = { lines: c.lines.pct, branches: c.branches.total === 0 ? 100 : c.branches.pct, functions: c.functions.total === 0 ? 100 : c.functions.pct };
  const gaps = [];
  if (inScope1 && i.level !== 'direct') gaps.push(`no direct test (${i.level})`);
  for (const k of ['lines', 'branches', 'functions']) if (pct[k] < BAR[k]) gaps.push(`${k} ${pct[k]}% < ${BAR[k]}%`);
  if (m !== undefined && m.score < BAR.mutation) gaps.push(`mutation ${m.score}% < ${BAR.mutation}%`);
  const done = gaps.length === 0 || (ex && ex.reason);
  return { file: f, phase: inScope1 ? 1 : 2, level: i?.level ?? '-', exports: i?.exports ?? [], ...pct, mutation: m?.score ?? null, status: done ? 'DONE' : 'TODO', gaps, exemption: ex?.reason ?? null };
});
const chosen = rows.filter((r) => phase === 'all' || String(r.phase) === phase);
const todo = chosen.filter((r) => r.status === 'TODO');

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'r8-146-test-matrix.json'), JSON.stringify({ bar: BAR, phase, rows: chosen }, null, 1));
const L = [];
L.push('# Unit-test matrix');
L.push('');
L.push(`Bar per file: lines >= ${BAR.lines}%, branches >= ${BAR.branches}%, functions >= ${BAR.functions}%, a direct test (phase 1), mutation score >= ${BAR.mutation}% where measured, or a recorded exemption with its reason.`);
L.push(`Phase ${phase}: ${chosen.length} files, DONE ${chosen.length - todo.length}, TODO ${todo.length}.`);
for (const ph of [1, 2]) {
  const g = chosen.filter((r) => r.phase === ph);
  if (!g.length) continue;
  L.push('');
  L.push(`## Phase ${ph} (${g.length} files, ${g.filter((r) => r.status === 'DONE').length} done)`);
  L.push('');
  L.push('| File | test | lines | branches | funcs | mutation | status | gaps |');
  L.push('|---|---|---|---|---|---|---|---|');
  for (const r of g.sort((a, b) => (a.status === b.status ? a.file.localeCompare(b.file) : a.status === 'TODO' ? -1 : 1))) {
    L.push(`| ${r.file} | ${r.level} | ${r.lines} | ${r.branches} | ${r.functions} | ${r.mutation ?? '-'} | ${r.status}${r.exemption ? ' (exempt)' : ''} | ${r.gaps.join('; ') || (r.exemption ?? '')} |`);
  }
}
writeFileSync(join(outDir, 'r8-146-test-matrix.md'), L.join('\n') + '\n');
const by = (ph) => { const g = rows.filter((r) => r.phase === ph); return `${g.filter((r) => r.status === 'DONE').length}/${g.length}`; };
console.log(`phase 1 (components, hooks) done ${by(1)}; phase 2 (other production files) done ${by(2)}; chosen phase ${phase}: TODO ${todo.length}`);
if (check) process.exitCode = todo.length === 0 ? 0 : 1;
