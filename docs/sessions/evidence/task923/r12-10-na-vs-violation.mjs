// Task 923 R52 / AC55 (AC36): a copy of r7-10-na-vs-violation.mjs (itself a copy of review-6/rv6-10-na-vs-violation.mjs); only this comment and the usage line differ. Counts the rows of a run whose rule
// is at once recorded as not applicable and violated, split by whether the row was retried, and prints the first six.
//   node docs/sessions/evidence/task923/r8-10-na-vs-violation.mjs <rows.jsonl> [<rows.jsonl> ...]
import { readFileSync } from 'node:fs';
for (const p of process.argv.slice(2)) {
  console.log(`== ${p}`);
  const rows = readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const retried = rows.filter((r) => 'retry' in r);
  const contra = [];
  for (const r of rows) {
    for (const k of Object.keys(r.notApplicable || {})) {
      if (r.rules[k] && r.rules[k].length) contra.push([r.story, r.state, r.root, r.locale, r.width, k, 'retry' in r ? 'RETRY' : '-', r.notApplicable[k].slice(0, 70), r.rules[k][0].slice(0, 70)].join(' | '));
    }
  }
  console.log(`rows ${rows.length} retried rows ${retried.length} rows with a rule both notApplicable and violated ${contra.length}`);
  const byRetry = contra.reduce((acc, c) => { const k = c.includes('RETRY') ? 'retry' : 'no-retry'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  console.log(byRetry);
  for (const c of contra.slice(0, 6)) console.log(`  ${c}`);
}
