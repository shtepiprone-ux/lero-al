// Task 931 revision 3 design (Opus, read-only, 2026-11-02): for a Vitest JSON report of the d18 busy-pool run, print each failed
// test outside the five class A files with its duration and the first line of its failure message.
// Usage: node <this file> <d18 json path>
import { readFileSync } from 'node:fs';

const CLASS_A = /googlePopup\.test|Header\.google\.security|AuthSheet\.google\.security|AuthSheet\.test|ProfileTab\.googleReauth/;
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const f of j.testResults) {
  const name = f.name.replace(/\\/g, '/').split('/lero-al/')[1];
  if (CLASS_A.test(name)) continue;
  for (const a of f.assertionResults.filter(r => r.status === 'failed')) {
    console.log(`${name} | ${a.title.slice(0, 70)} | ${Math.round(a.duration ?? -1)} ms | ${(a.failureMessages[0] || '').split('\n')[0].slice(0, 180)}`);
  }
}
