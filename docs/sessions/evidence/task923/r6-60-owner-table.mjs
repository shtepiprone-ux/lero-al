/**
 * r6-60-owner-table.mjs - the violations of the Revision 5 full run, each with its owner, plus the AC18 / AC21 / AC26 row checks
 * (Task 923, R9, R18, R21, R23, AC4, AC18, AC21, AC26)
 *
 *   node docs/sessions/evidence/task923/r6-60-owner-table.mjs <rows.jsonl> <revision-4-rows.jsonl> <out-prefix>
 * Writes `<out-prefix>-by-story-state-root.txt`, `<out-prefix>-owner-summary.txt`, `<out-prefix>-component-overflow-change.txt`
 * and `<out-prefix>-ac18-checks.txt`, and prints the summary and the checks.
 *
 * Ownership: as `r4-60-owner-table.mjs` (the numbered tasks of R9; 924 = the 640 cells of `r2-85-width-640-findings.txt`
 * lines 3-6 and 9-11; 925 = the `custom-range-too-long` error screen; R21: the Leaflet popup of `listingdetailview` and the
 * dashboard chart of `admindashboardview` / `dashboardsemidonut` as their own rows under "new - Opus to file"), plus (R23):
 *   - the gallery counter class (`listingdetailpattern`, `listinggallerypattern`: the "n / N" counter clipped away below
 *     640, flush on the frame's top edge from 640) is owned by 859 R58, not "new";
 *   - the gallery desync (`listinggallerypattern`: a hidden slide in the frame while the named, tabbable slide is
 *     off-screen) is its own row under "new - Opus to file";
 *   - (found by Revision 4, not named by R23) the visible slide measured against its displaced track box by the in-flow path: R25
 *     removes it, so this run must show 0 such details (printed in the checks file);
 *   - (Revision 5, AC26) the AdminShell drawer opened on mount that leaves the focus on the app's menu button (`focus-open` on
 *     `adminshell--drawer-open`, C118) is its own row under "new - Opus to file".
 * A row can hold details of several classes, so ownership is per detail: a (row, rule) pair counts once for each owner it
 * has. Every other pair is "new - Opus to file", grouped by the component under test. AC21: a gate-level cell (open-failed,
 * portal-count, widths-mismatch, error-screen) outside 924 / 925 is listed and counted; it must be 0.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [rowsPath, revision1Path, prefix] = process.argv.slice(2);
if (!rowsPath || !revision1Path || !prefix) throw new Error('usage: node r6-60-owner-table.mjs <rows.jsonl> <revision-4-rows.jsonl> <out-prefix>');
const load = (p) => readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const rows = load(rowsPath);
const before = load(revision1Path);

const R89_DIALOGS = new Set(['adminuserprofiledialogsview', 'avatarcropmodal', 'createticketdialogview', 'currencydetaildialogview', 'currencyformdialogview', 'inquirydetaildialogview', 'listingpreviewdialogview', 'pageeditordialogview', 'premiumdialogview', 'providerformdialogview', 'reportdetaildialogview', 'ticketdetaildialogview']);
const R921_STORIES = new Set(['admindashboardview', 'adminsupportview', 'agentstatisticsview']);
const componentOf = (story) => story.replace(/--.*$/, '').replace(/^(patterns-mantine|mantine-primitives)-/, '');
const stateName = (r) => (r.state.includes('~') ? r.state.split('~')[1] : r.state);
const GATE_LEVEL = ['open-failed', 'portal-count', 'widths-mismatch', 'error-screen'];

// R18: the 640 states of r2-85-width-640-findings.txt lines 3-6 and 9-11, read from that file
const findings = readFileSync('docs/sessions/evidence/task923/r2-85-width-640-findings.txt', 'utf8').split('\n');
const owned924 = new Map();
for (const i of [2, 3, 4, 5, 8, 9, 10]) {
  const m = findings[i].match(/^(open-failed|portal-count|widths-mismatch) \| (\S+) \| (\S+) @640 x\d+$/);
  if (!m) throw new Error(`r2-85-width-640-findings.txt line ${i + 1} is not a 640 finding: ${findings[i]}`);
  owned924.set(`${m[1]}|${m[2]}|${m[3]}`, true);
}
const is924 = (r, rule) => r.width === 640 && owned924.has(`${rule}|${componentOf(r.story)}|${stateName(r)}`);
const is925 = (r, rule) => rule === 'error-screen' && /dashboardperiodcontrol--custom-range-too-long$/.test(r.story);

function ownersOf(r, rule) {
  const comp = componentOf(r.story);
  if (is924(r, rule)) return ['924 (compact presentation still shown at exactly 640px)'];
  if (is925(r, rule)) return ['925 (DashboardPeriodControl CustomRangeTooLong error screen)'];
  const details = r.rules[rule] ?? [];
  // R21 (classified by Story like review 3's rv3-d16-classes.mjs: every component-overflow row of these two Stories is chart internals)
  if (rule === 'component-overflow' && comp === 'listingdetailview' && details.some((d) => /leaflet/.test(d))) return ['new — Opus to file: listingdetailview (class: Leaflet popup wider than its map, close control clipped away)'];
  if (rule === 'component-overflow' && (comp === 'admindashboardview' || comp === 'dashboardsemidonut')) return ['new — Opus to file: admindashboardview + dashboardsemidonut (class: dashboard chart extends past its card)'];
  // R23: the two gallery patterns, per detail
  if (rule === 'component-overflow' && (comp === 'listingdetailpattern' || comp === 'listinggallerypattern')) {
    const owners = new Set();
    for (const d of details) {
      if (/^…\+\d+ more/.test(d)) continue;
      if (/^div "\d+ \/ \d+" \(absolute\) y /.test(d)) owners.add('859 R58 (gallery counter placed with theme spacing)');
      else if (/^div "" \(transformed\) x .* holds button/.test(d)) owners.add('new — Opus to file: listinggallerypattern (class: gallery desync - a hidden slide in the frame while the named, tabbable slide is off-screen)');
      else if (/^button\S* "" x [-\d.]+\.\.[-\d.]+ past div [-\d.]+\.\.[-\d.]+$/.test(d)) owners.add('new — Opus to file: listingdetailpattern + listinggallerypattern (class: the visible slide measured against its displaced track box by the in-flow path)');
      else owners.add(`new — Opus to file: ${comp}`);
    }
    return owners.size ? [...owners] : [`new — Opus to file: ${comp}`];
  }
  if (comp === 'adminshell' && rule === 'focus-open') return ['new — Opus to file: AdminShell drawer initial-focus race (class: the drawer opened on mount leaves the focus on the app menu button)'];
  if (comp === 'ticketdetaildialogview' && rule === 'component-overflow') return ['859 §31 R88 (sheet header never shrinks)'];
  if (R89_DIALOGS.has(comp) && ['text-clamp', 'text-hidden', 'text-ellipsis'].includes(rule)) return ['859 §31 R89 (dialog title / description never cut)'];
  if (comp === 'userpickerfieldview' && ['component-overflow', 'viewport-overflow', 'word-split'].includes(rule)) return ['859 §31 R90 (one combobox option anatomy)'];
  if (R921_STORIES.has(comp) && rule === 'text-clamp') return ['921 (MantineDashboardStatCard / BarChart text)'];
  if (comp === 'adminpermissionsview' && rule === 'target-small') return ['922 (AdminPermissionsView switch)'];
  if (comp === 'rangedatepicker' && rule === 'text-ellipsis') return ['922 (RangeDatePicker label truncation)'];
  if (/^admin/.test(comp) && rule === 'text-ellipsis') return ['922 (AdminSidebar label truncation)'];
  return [`new — Opus to file: ${comp}`];
}

const RULES = [...new Set(rows.flatMap((r) => Object.keys(r.rules)))];
const failingRules = (r) => RULES.filter((k) => r.rules[k].length);
const groups = new Map();
const perOwnerRule = new Map();
const ownerGroups = new Map();
for (const r of rows) {
  if (r.pass) continue;
  const root = r.root === 'app' ? 'app' : 'portal';
  const key = `${r.story} | ${r.state === 'closed' ? '(closed)' : r.state.replace(r.story, '') || '(mount)'} | ${root}`;
  const g = groups.get(key) ?? { cells: 0, rules: new Map() };
  g.cells++;
  for (const rule of failingRules(r)) {
    for (const owner of ownersOf(r, rule)) {
      g.rules.set(`${rule} -> ${owner}`, owner);
      const pk = `${owner} :: ${rule}`;
      perOwnerRule.set(pk, (perOwnerRule.get(pk) ?? 0) + 1);
    }
  }
  groups.set(key, g);
}
for (const [, g] of groups) for (const owner of new Set(g.rules.values())) ownerGroups.set(owner, (ownerGroups.get(owner) ?? 0) + 1);

const L1 = ['Task 923 Revision 5 full run - every violation by Story | state | root, with rule -> owner (cells = locale x width cells with a violation)'];
for (const key of [...groups.keys()].sort()) {
  const g = groups.get(key);
  L1.push(`${key} :: ${g.cells} cell(s) :: ${[...g.rules.keys()].join(' ; ')}`);
}
writeFileSync(`${prefix}-by-story-state-root.txt`, L1.join('\n') + '\n');

const bucket = (owner) => (owner.startsWith('new') ? 'new — Opus to file' : owner);
const byOwner = new Map();
for (const [pk, n] of perOwnerRule) {
  const [owner, rule] = pk.split(' :: ');
  const list = byOwner.get(bucket(owner)) ?? new Map();
  list.set(rule, (list.get(rule) ?? 0) + n);
  byOwner.set(bucket(owner), list);
}
const newByComponent = [...ownerGroups].filter(([o]) => o.startsWith('new')).sort();
const S = [`groups ${groups.size} (Story x state x root); ${ownerGroups.size} owner bucket(s); rows with a violation ${rows.filter((r) => !r.pass).length}`, '', 'Story x state x root groups per owner:'];
for (const [owner, n] of [...ownerGroups].filter(([o]) => !o.startsWith('new')).sort()) S.push(`  ${owner}: ${n}`);
S.push(`  new — Opus to file (${newByComponent.length} components): ${newByComponent.reduce((a, [, n]) => a + n, 0)}`);
S.push('', 'rows (Story x state x root x locale x width) with a violation, per owner and rule:');
for (const [owner, rules] of [...byOwner].sort()) S.push(`  ${owner}: ${[...rules].sort().map(([r, n]) => `${r} ${n}`).join(', ')}`);
S.push('', 'new — Opus to file, by component (groups):');
for (const [owner, n] of newByComponent) S.push(`  ${owner.replace('new — Opus to file: ', '')}: ${n}`);
writeFileSync(`${prefix}-owner-summary.txt`, S.join('\n') + '\n');

// ---- component-overflow change against Revision 4, per component (R15) ----
const perComponent = (list) => {
  const m = new Map();
  for (const r of list) {
    if (!r.rules['component-overflow'].length) continue;
    const c = m.get(componentOf(r.story)) ?? { rows: 0, positioned: 0 };
    c.rows++;
    if (r.rules['component-overflow'].some((d) => /\((absolute|fixed|transformed)[^)]*\) [xy] /.test(d))) c.positioned++;
    m.set(componentOf(r.story), c);
  }
  return m;
};
const was = perComponent(before);
const now = perComponent(rows);
const comps = [...new Set([...was.keys(), ...now.keys()])].sort();
const C = ['component-overflow rows (Story x state x root x locale x width with the rule) per component: Revision 4 -> Revision 5; "positioned" = rows in which at least one detail is a positioned / transformed element', ''];
let w1 = 0, w2 = 0, w2p = 0;
for (const c of comps) {
  const a = was.get(c)?.rows ?? 0;
  const b = now.get(c)?.rows ?? 0;
  const p = now.get(c)?.positioned ?? 0;
  w1 += a; w2 += b; w2p += p;
  if (a !== b) C.push(`  ${c}: ${a} -> ${b} (${b - a >= 0 ? '+' : ''}${b - a}); positioned ${p}`);
}
C.push('', `components with a change: ${C.length - 2}; components unchanged: ${comps.length - (C.length - 2)}`);
C.push(`total rows with component-overflow: ${w1} -> ${w2} (${w2 - w1 >= 0 ? '+' : ''}${w2 - w1}); rows with a positioned / transformed detail in Revision 5: ${w2p}`);
writeFileSync(`${prefix}-component-overflow-change.txt`, C.join('\n') + '\n');

// ---- AC14 / AC4 row checks ----
const K = ['text-clamp', 'text-ellipsis', 'text-hidden', 'word-split', 'viewport-overflow', 'component-overflow', 'action-hidden', 'action-covered', 'target-small', 'focus-open', 'focus-trigger', 'focus-trap', 'dismiss-escape', 'dismiss-close-control', 'dismiss-outside', 'open-failed', 'portal-count', 'error-screen', 'unregistered-portal', 'widths-mismatch'];
const A = [`rows ${rows.length}; app ${rows.filter((r) => r.root === 'app').length}; portal ${rows.filter((r) => r.root !== 'app').length}`];
A.push(`rows missing a rule key (of ${K.length}) ${rows.filter((r) => K.some((k) => !Array.isArray(r.rules[k]))).length}; rows without notApplicable ${rows.filter((r) => !r.notApplicable).length}; unique ${new Set(rows.map((r) => [r.story, r.state, r.root, r.locale, r.width].join('|'))).size}`);
const retried = new Set(rows.filter((r) => r.retry).map((r) => `${r.story}|${r.state}|${r.locale}|${r.width}`));
A.push(`rows with a retry key ${rows.filter((r) => 'retry' in r).length} (cells ${retried.size}); retry value not a string ${rows.filter((r) => 'retry' in r && typeof r.retry !== 'string').length}`);
const gate = {};
const stray = [];
for (const r of rows) {
  for (const k of GATE_LEVEL) {
    if (!r.rules[k].length) continue;
    const owner = is924(r, k) ? '924' : is925(r, k) ? '925' : 'NONE';
    const key = `${k} @${r.width} -> ${owner}`;
    gate[key] = (gate[key] ?? 0) + 1;
    if (owner === 'NONE') stray.push(`${k} | ${r.story} | ${r.state} | ${r.locale} | @${r.width}: ${r.rules[k][0]}`);
  }
}
A.push('gate-level cells (open-failed, portal-count, widths-mismatch, error-screen) by width and owner: ' + JSON.stringify(gate));
A.push(`gate-level cells owned by neither 924 nor 925 (AC18: must be 0), of which at 639: ${stray.length} (${stray.filter((s) => s.endsWith('@639') || /@639:/.test(s)).length})`);
for (const s of stray) A.push(`  STRAY ${s}`);
A.push(`unregistered-portal rows ${rows.filter((r) => r.rules['unregistered-portal'].length).length}`);
const inflowSlide = /^buttonS* "" x [-d.]+..[-d.]+ past div [-d.]+..[-d.]+$/;
A.push(`in-flow slide details ("button x..x past div", AC26: the row is gone, must be 0): ${rows.reduce((n, r) => n + r.rules['component-overflow'].filter((d) => inflowSlide.test(d)).length, 0)}`);
A.push(`rows with a retry key (summary lists each): ${rows.filter((r) => 'retry' in r).length}`);
for (const [s, w] of [['patterns-mantine-ticketdetaildialogview--support', 320], ['patterns-mantine-ticketdetaildialogview--support', 390], ['patterns-mantine-userpickerfieldview--results', 320], ['patterns-mantine-listingpreviewdialogview--active', 320]]) {
  const p = rows.filter((r) => r.story === s && r.width === w && r.root !== 'app');
  const a = rows.filter((r) => r.story === s && r.width === w && r.root === 'app');
  const rules = new Set();
  for (const r of p) for (const k of K) if (r.rules[k].length) rules.add(k);
  A.push(`AC4 ${s} @${w}: portal rows ${p.length}, failing ${p.filter((r) => !r.pass).length} [${[...rules].join(', ')}]; app rows failing ${a.filter((r) => !r.pass).length} of ${a.length}`);
}
writeFileSync(`${prefix}-ac18-checks.txt`, A.join('\n') + '\n');

console.log(S.join('\n'));
console.log('');
console.log(C.join('\n'));
console.log('');
console.log(A.join('\n'));
