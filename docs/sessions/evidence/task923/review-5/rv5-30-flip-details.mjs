// Review 5 (diagnosis only): print the details of every row whose failing-rule set differs between r4-full and r5-full.
import { readFileSync } from 'node:fs';
const load = (p) => new Map(readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((r) => [[r.story, r.state, r.root, r.locale, r.width].join(' | '), r]));
const a = load('docs/sessions/evidence/task923/r4-full/rows.jsonl');
const b = load('docs/sessions/evidence/task923/r5-full/rows.jsonl');
const byRule = {};
for (const [k, ra] of a) {
  const rb = b.get(k); if (!rb) continue;
  for (const rule of new Set([...Object.keys(ra.rules), ...Object.keys(rb.rules)])) {
    const fa = (ra.rules[rule] || []).length > 0, fb = (rb.rules[rule] || []).length > 0;
    if (fa === fb) continue;
    (byRule[rule] ||= []).push(`${fa ? 'r4 FAIL' : 'r5 FAIL'} ${k} retry r4=${ra.retry ?? '-'} r5=${rb.retry ?? '-'}\n      ${(fa ? ra : rb).rules[rule].slice(0, 2).join('\n      ')}`);
  }
}
for (const [rule, list] of Object.entries(byRule)) { console.log(`== ${rule} (${list.length})`); for (const l of list) console.log('  ' + l); }
