// Task 937 revision 1 (Opus, read-only, 2026-11-02): which reviewed contracts go stale when the 937 reviewer writes R12?
// Starts from the files R12 writes and follows each written contract file to every reviewed contract that scopes it.
// For each pair prints scope membership, case-test and runtime status and the digest effect of a later write.
// Usage: node <this file>
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';
import { scopeDigest, isRuntimeFile } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C923 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json';
const C937 = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_937_Governance_Check_Product_Findings.security.json';
const files = [];
for (const dir of ['tasks/Sprints', 'tasks/Archive']) for (const f of readdirSync(resolve(ROOT, dir))) if (f.endsWith('.security.json')) files.push(`${dir}/${f}`);
const reviewed = [];
for (const f of files) { try { const c = readJson(ROOT, f); if (c.stage === 'reviewed' && Array.isArray(c.scope)) reviewed.push([f, c]); } catch {} }
console.log(`reviewed contracts: ${reviewed.length}`);
const queue = [C923]; const seen = new Set();
while (queue.length) {
  const written = queue.shift(); if (seen.has(written)) continue; seen.add(written);
  for (const [f, c] of reviewed) {
    if (f === written || !c.scope.includes(written)) continue;
    const before = scopeDigest(ROOT, c);
    const after = scopeDigest(ROOT, c, new Map([[written, `${readFileSync(resolve(ROOT, written), 'utf8')} `]]));
    const caseTest = c.cases.some(row => row.testFile === written);
    console.log(`write ${written} -> stales ${f}: digest ${before === after ? 'unchanged' : 'CHANGED'}; case test ${caseTest}; runtime ${isRuntimeFile(written)}`);
    if (before !== after) queue.push(f);
  }
}
const s937 = readJson(ROOT, C937).scope;
for (const w of seen) console.log(`937 scope lists ${w}: ${s937.includes(w)}`);
