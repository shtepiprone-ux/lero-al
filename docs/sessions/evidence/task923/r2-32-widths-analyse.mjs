/**
 * r2-32-widths-analyse.mjs - derive the true switch of every `widths` state from the probe rows (Task 923, R12)
 *
 *   node docs/sessions/evidence/task923/r2-32-widths-analyse.mjs <probe.jsonl> [--apply]
 * For each state the set S of probed widths at which the registered trigger exists AND opens a portal must be one
 * contiguous run of the probed widths (theme breakpoints and breakpoints minus 1). Its lower end must be a theme
 * breakpoint (-> widths.min) or the probe floor (no min); its upper end must be a breakpoint minus 1 (-> widths.max)
 * or the probe ceiling (no max). A state that opens at every probed width carries no `widths`. A state that opens at
 * none, or whose run is not contiguous, or whose edge is not a breakpoint, is a PROBLEM that is reported, never guessed.
 * `--apply` rewrites `scripts/rendered-interaction-states.json` with the derived `widths` (key order preserved).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { loadBreakpoints } from '../../../../scripts/rendered-state-census/theme-breakpoints.mjs';

const [probePath, flag] = process.argv.slice(2);
const rows = readFileSync(probePath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const { list } = loadBreakpoints(process.cwd());
// 319 (the smallest breakpoint minus 1) is no real viewport: the floor is the smallest breakpoint itself
const widths = [...new Set(list.flatMap((b, i) => (i === 0 ? [b] : [b - 1, b])))].sort((a, b) => a - b);
const floor = widths[0];
const ceiling = widths[widths.length - 1];

// States whose probe is not one clean theme-grid run. Each decision is backed by the sequential bisect of
// `r2-35-widths-bisect.txt` (every width 320..1440 around each transition) and registers the CONTRACT range, so the gate
// itself reports the off-by-one instead of the registry hiding it:
//  - `all-photos` (listing detail): opens 320..767, absent from 768 -> { max: 767 } (the coarse probe was noisy there);
//  - `public-visibility` / `unassigned`: open 320..640, absent from 641 -> { max: 639 }; at 640 the gate reports widths-mismatch;
//  - relative time: opens from 641 only -> { min: 640 }; at 640 the gate reports that nothing opens;
//  - user menu: the trigger exists at every width (a drawer is already open over it at exactly 640) -> no widths.
const OVERRIDES = new Map([
  ['mantine-primitives-relativetime--default', { min: 640 }],
  ['mantine-primitives-usermenu--default~akalba-krasniqi', null],
]);
const overrideFor = (id) => {
  if (OVERRIDES.has(id)) return { has: true, widths: OVERRIDES.get(id) };
  if (/~all-photos$/.test(id) && id.startsWith('patterns-mantine-listingdetailview--')) return { has: true, widths: { max: 767 } };
  if (/^patterns-mantine-adminlistingsview--.*~public-visibility$/.test(id) || /^patterns-mantine-adminsupportview--.*~unassigned$/.test(id)) return { has: true, widths: { max: 639 } };
  return { has: false };
};

const byId = new Map();
for (const r of rows) byId.set(r.id, [...(byId.get(r.id) ?? []), r]);

const registryPath = 'scripts/rendered-interaction-states.json';
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const summary = { unchanged: 0, changed: 0, dropped: 0, problems: 0 };
const lines = [];
for (const state of registry.states) {
  if (!state.widths) continue;
  const cells = (byId.get(state.id) ?? []).filter((c) => widths.includes(c.width)).sort((a, b) => a.width - b.width);
  const open = cells.filter((c) => c.opens).map((c) => c.width);
  const old = JSON.stringify(state.widths);
  const ov = overrideFor(state.id);
  if (ov.has) {
    const now = ov.widths ? JSON.stringify(ov.widths) : null;
    if (now === old) summary.unchanged++;
    else {
      summary.changed++;
      lines.push(`OVERRIDE ${state.id}: ${old} -> ${now ?? 'no widths'} (bisect evidence)`);
      if (flag === '--apply') { if (ov.widths) state.widths = ov.widths; else delete state.widths; }
    }
    continue;
  }
  if (cells.length !== widths.length) { lines.push(`PROBLEM ${state.id}: ${cells.length} of ${widths.length} cells probed`); summary.problems++; continue; }
  if (open.length === 0) { lines.push(`PROBLEM ${state.id}: opens at no probed width (was ${old}); errors: ${cells.filter((c) => c.error).length}`); summary.problems++; continue; }
  const lo = open[0];
  const hi = open[open.length - 1];
  const run = widths.filter((w) => w >= lo && w <= hi);
  if (run.length !== open.length) { lines.push(`PROBLEM ${state.id}: opens at ${open.join(',')} - not one contiguous run`); summary.problems++; continue; }
  const next = {};
  if (lo > floor) {
    if (!list.includes(lo)) { lines.push(`PROBLEM ${state.id}: lowest opening width ${lo} is not a theme breakpoint (opens at ${open.join(',')})`); summary.problems++; continue; }
    next.min = lo;
  }
  if (hi < ceiling) {
    if (!list.includes(hi + 1)) { lines.push(`PROBLEM ${state.id}: highest opening width ${hi} is not a breakpoint minus 1 (opens at ${open.join(',')})`); summary.problems++; continue; }
    next.max = hi;
  }
  const now = JSON.stringify(next);
  if (Object.keys(next).length === 0) {
    summary.dropped++;
    lines.push(`DROP    ${state.id}: opens at every probed width (was ${old})`);
    if (flag === '--apply') delete state.widths;
  } else if (now === old) {
    summary.unchanged++;
  } else {
    summary.changed++;
    lines.push(`CHANGE  ${state.id}: ${old} -> ${now}`);
    if (flag === '--apply') state.widths = next;
  }
}
console.log(lines.join('\n'));
console.log(`\nwidths states ${[...byId.keys()].length}: unchanged ${summary.unchanged}, changed ${summary.changed}, dropped ${summary.dropped}, problems ${summary.problems}`);
if (flag === '--apply' && summary.problems === 0) {
  writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
  console.log(`applied to ${registryPath}`);
}
