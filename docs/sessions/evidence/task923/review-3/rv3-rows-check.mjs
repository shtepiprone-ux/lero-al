// Review 2 (Opus): independent check of full/rows.jsonl - row count, rule keys, notApplicable, uniqueness, gate-level
// failures by width, AC4 targets.
import { readFileSync } from 'node:fs';
const L = readFileSync('docs/sessions/evidence/task923/r3-full/rows.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const K = ['text-clamp','text-ellipsis','text-hidden','word-split','viewport-overflow','component-overflow','action-hidden','action-covered','target-small','focus-open','focus-trigger','focus-trap','dismiss-escape','dismiss-close-control','dismiss-outside','open-failed','portal-count','error-screen','unregistered-portal','widths-mismatch'];
console.log(`rows ${L.length}; app ${L.filter((r) => r.root === 'app').length}; portal ${L.filter((r) => r.root !== 'app').length}`);
console.log(`rows missing a rule key ${L.filter((r) => K.some((k) => !Array.isArray(r.rules[k]))).length}; rows without notApplicable ${L.filter((r) => !r.notApplicable).length}; unique ${new Set(L.map((r) => [r.story, r.state, r.root, r.locale, r.width].join('|'))).size}`);
const c = {};
for (const r of L) for (const k of ['open-failed', 'portal-count', 'widths-mismatch', 'error-screen', 'unregistered-portal']) if (r.rules[k].length) c[`${k} @${r.width}`] = (c[`${k} @${r.width}`] ?? 0) + 1;
console.log('gate-level failures by width: ' + JSON.stringify(c));
for (const [s, w] of [['patterns-mantine-ticketdetaildialogview--support', 320], ['patterns-mantine-ticketdetaildialogview--support', 390], ['patterns-mantine-userpickerfieldview--results', 320], ['patterns-mantine-listingpreviewdialogview--active', 320]]) {
  const p = L.filter((r) => r.story === s && r.width === w && r.root !== 'app');
  const a = L.filter((r) => r.story === s && r.width === w && r.root === 'app');
  const rules = new Set(); for (const r of p) for (const k of K) if (r.rules[k].length) rules.add(k);
  console.log(`AC4 ${s} @${w}: portal rows ${p.length}, failing ${p.filter((r) => !r.pass).length} [${[...rules].join(', ')}]; app rows failing ${a.filter((r) => !r.pass).length} of ${a.length}`);
}
// Review 3 additions: the retry key, its rows, and gate-level cells by Story at 640 against the 924 list.
const ret = L.filter((r) => 'retry' in r);
console.log(`rows with retry key ${ret.length}; non-string ${ret.filter((r) => typeof r.retry !== 'string').length}; retried jobs ${new Set(ret.map((r) => [r.story, r.state, r.locale, r.width].join('|'))).size}; retried jobs not at 640 ${new Set(ret.filter((r) => r.width !== 640).map((r) => [r.story, r.state, r.locale, r.width].join('|'))).size}`);
const g = new Set();
for (const r of L) for (const k of ['open-failed', 'portal-count', 'widths-mismatch', 'error-screen']) if (r.rules[k].length) g.add(`${k} @${r.width} ${r.state} ${k === 'error-screen' ? r.locale : ''}`);
console.log([...g].sort().join('\n'));
