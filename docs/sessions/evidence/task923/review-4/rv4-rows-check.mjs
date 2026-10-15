// Review 4 (Opus): independent AC18 checks on r4-full/rows.jsonl.  node docs/sessions/evidence/task923/review-4/rv4-rows-check.mjs
import { readFileSync } from 'node:fs';
console.log(`platform ${process.platform} node ${process.version}`);
const rows = readFileSync('docs/sessions/evidence/task923/r4-full/rows.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const keys = new Set(rows.flatMap((r) => Object.keys(r.rules)));
console.log('rows', rows.length, 'rule keys', keys.size, 'rows missing a key', rows.filter((r) => Object.keys(r.rules).length !== keys.size).length, 'rows without notApplicable', rows.filter((r) => !('notApplicable' in r)).length);
const uniq = new Set(rows.map((r) => [r.story, r.state, r.root, r.locale, r.width].join('|'))); console.log('unique', uniq.size);
const gate = {}; for (const r of rows) for (const k of ['open-failed', 'portal-count', 'widths-mismatch', 'error-screen']) if (r.rules[k]?.length) { const c = `${k} @${r.width} ${r.story}${r.state ? '~' + r.state : ''}`; gate[c] = 1; }
const g = Object.keys(gate); console.log('gate-level cells', g.length, 'not at 640 and not custom-range-too-long:', g.filter((c) => !/@640 /.test(c) && !/custom-range-too-long/.test(c)));
console.log('error-screen cells', g.filter((c) => c.startsWith('error-screen')));
console.log('at 639', g.filter((c) => /@639 /.test(c)).length);
const retried = new Set(rows.filter((r) => r.retry).map((r) => `${r.story}|${r.state}|${r.locale}|${r.width}`)); console.log('retried jobs', retried.size, 'widths', [...new Set([...retried].map((s) => s.split('|')[3]))]);
const summ = readFileSync('docs/sessions/evidence/task923/r4-full/summary.txt', 'utf8'); console.log('retried jobs listed in summary', [...retried].filter((j) => { const [s, st, l, w] = j.split('|'); return summ.includes(s) && summ.includes(w); }).length);
for (const [s, w, must] of [['patterns-mantine-ticketdetaildialogview--support', 320, []], ['patterns-mantine-ticketdetaildialogview--support', 390, []], ['patterns-mantine-userpickerfieldview--results', 320, ['word-split', 'viewport-overflow']], ['patterns-mantine-listingpreviewdialogview--active', 320, ['text-clamp']]]) {
  const P = rows.filter((r) => r.story === s && r.width === w && r.root.startsWith('portal')); const A = rows.filter((r) => r.story === s && r.width === w && r.root === 'app');
  const pr = new Set(P.flatMap((r) => Object.keys(r.rules).filter((k) => r.rules[k].length)));
  console.log('AC4', s, w, 'portal rows', P.length, 'failing', P.filter((r) => !r.pass).length, [...pr].join(','), 'must', must.every((m) => pr.has(m)), '| app failing', A.filter((r) => !r.pass).length, 'of', A.length);
}
console.log('EXIT_CODE=0');
