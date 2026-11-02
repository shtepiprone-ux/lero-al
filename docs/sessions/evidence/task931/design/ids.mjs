// Task 931 design: failing test identities of a Vitest JSON report. Usage: node <this file> <unit.json> <output.txt>
// ESM form of the former ids.cjs (same output), because CI lint forbids require() imports.
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = ['source: CI run 41296776854 artifact unit-results (test-results/unit.json), head 516b4d827',
  `numTotalTests ${r.numTotalTests} numPassedTests ${r.numPassedTests} numFailedTests ${r.numFailedTests}`];
const files = new Set();
for (const t of r.testResults) for (const a of t.assertionResults) if (a.status === 'failed') {
  const f = t.name.split(/[/]/).join('/').replace(/^.*?\/src\//, 'src/');
  files.add(f); out.push(`FAILED ${f} :: ${a.fullName}`);
}
out.push(`failed files ${files.size}`);
writeFileSync(process.argv[3], out.join('\n') + '\n');
console.log(out.slice(0, 2).join('\n'), '\nfiles', files.size);
