/**
 * r2-60-owner-table.mjs - the violations of a full run, by Story x state x root, each with its owner (Task 923, R9, AC10)
 *
 *   node docs/sessions/evidence/task923/r2-60-owner-table.mjs <rows.jsonl> <out-prefix>
 * Writes `<out-prefix>-by-story-state-root.txt` and `<out-prefix>-owner-summary.txt`, and prints the summary.
 * The first pass produced its owner table with a script that lived in a session scratchpad; this is the committed
 * replacement. The owner of a (Story, rule) pair is decided by the ownership rules below (the numbered tasks of the
 * kickoff's R9, reconstructed from the first-pass table `r1-50-violations-by-story-state-root.txt`); every other pair is
 * "new - Opus to file", grouped by the component under test.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [rowsPath, prefix] = process.argv.slice(2);
if (!rowsPath || !prefix) throw new Error('usage: node r2-60-owner-table.mjs <rows.jsonl> <out-prefix>');
const rows = readFileSync(rowsPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

const R89_DIALOGS = new Set(['adminuserprofiledialogsview', 'avatarcropmodal', 'createticketdialogview', 'currencydetaildialogview', 'currencyformdialogview', 'inquirydetaildialogview', 'listingpreviewdialogview', 'pageeditordialogview', 'premiumdialogview', 'providerformdialogview', 'reportdetaildialogview', 'ticketdetaildialogview']);
const R921_STORIES = new Set(['admindashboardview', 'adminsupportview', 'agentstatisticsview']);
const componentOf = (story) => story.replace(/--.*$/, '').replace(/^(patterns-mantine|mantine-primitives)-/, '');

function ownerOf(story, rule) {
  const comp = componentOf(story);
  if (comp === 'ticketdetaildialogview' && rule === 'component-overflow') return '859 §31 R88 (sheet header never shrinks)';
  if (R89_DIALOGS.has(comp) && ['text-clamp', 'text-hidden', 'text-ellipsis'].includes(rule)) return '859 §31 R89 (dialog title / description never cut)';
  if (comp === 'userpickerfieldview' && ['component-overflow', 'viewport-overflow', 'word-split'].includes(rule)) return '859 §31 R90 (one combobox option anatomy)';
  if (R921_STORIES.has(comp) && rule === 'text-clamp') return '921 (MantineDashboardStatCard / BarChart text)';
  if (comp === 'adminpermissionsview' && rule === 'target-small') return '922 (AdminPermissionsView switch)';
  if (comp === 'rangedatepicker' && rule === 'text-ellipsis') return '922 (RangeDatePicker label truncation)';
  if (/^admin/.test(comp) && rule === 'text-ellipsis') return '922 (AdminSidebar label truncation)';
  return `new — Opus to file: ${comp}`;
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
    const owner = ownerOf(r.story, rule);
    g.rules.set(rule, owner);
    const pk = `${owner} :: ${rule}`;
    perOwnerRule.set(pk, (perOwnerRule.get(pk) ?? 0) + 1);
  }
  groups.set(key, g);
}
for (const [key, g] of groups) for (const owner of new Set(g.rules.values())) ownerGroups.set(owner, (ownerGroups.get(owner) ?? 0) + 1);

const L1 = [`Task 923 Revision 1 full run - every violation by Story | state | root, with rule -> owner (cells = locale x width cells with a violation)`];
for (const key of [...groups.keys()].sort()) {
  const g = groups.get(key);
  L1.push(`${key} :: ${g.cells} cell(s) :: ${[...g.rules].map(([rule, owner]) => `${rule} -> ${owner}`).join(' ; ')}`);
}
writeFileSync(`${prefix}-by-story-state-root.txt`, L1.join('\n') + '\n');

const byOwner = new Map();
for (const [pk, n] of perOwnerRule) {
  const [owner, rule] = pk.split(' :: ');
  const list = byOwner.get(owner.startsWith('new') ? 'new — Opus to file' : owner) ?? new Map();
  list.set(rule, (list.get(rule) ?? 0) + n);
  byOwner.set(owner.startsWith('new') ? 'new — Opus to file' : owner, list);
}
const newByComponent = [...ownerGroups].filter(([o]) => o.startsWith('new')).sort();
const S = [`groups ${groups.size} (Story x state x root); ${ownerGroups.size} owner bucket(s)`, '', 'Story x state x root groups per owner:'];
for (const [owner, n] of [...ownerGroups].filter(([o]) => !o.startsWith('new')).sort()) S.push(`  ${owner}: ${n}`);
S.push(`  new — Opus to file (${newByComponent.length} components): ${newByComponent.reduce((a, [, n]) => a + n, 0)}`);
S.push('', 'rows (Story x state x root x locale x width) with a violation, per owner and rule:');
for (const [owner, rules] of [...byOwner].sort()) S.push(`  ${owner}: ${[...rules].sort().map(([r, n]) => `${r} ${n}`).join(', ')}`);
S.push('', 'new — Opus to file, by component (groups):');
for (const [owner, n] of newByComponent) S.push(`  ${owner.replace('new — Opus to file: ', '')}: ${n}`);
writeFileSync(`${prefix}-owner-summary.txt`, S.join('\n') + '\n');
console.log(S.join('\n'));
