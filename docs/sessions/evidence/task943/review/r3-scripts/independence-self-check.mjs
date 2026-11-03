// Task 943 approver (review 3, session e50584bc), read-only: the Stop hook's governanceIndependenceErrors on this session's
// own transcript for the 943 contract (active or archived path), and which tool calls the hook reads as scope-file writes.
// Usage: node test-results/943-r3/independence-self-check.mjs <contract path> <transcript .jsonl path>
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const hook = await import(new URL('../../scripts/workflow-gates/security-hook.mjs', import.meta.url));
const cli = await import(new URL('../../scripts/workflow-gates/cli.mjs', import.meta.url));
const [contractPath, transcriptPath] = process.argv.slice(2);
const contract = cli.readJson(ROOT, contractPath);
const transcript = readFileSync(transcriptPath, 'utf8');
const errors = hook.governanceIndependenceErrors(ROOT, contract, contractPath, transcript);
console.log(`contract ${contractPath}`);
console.log(`independence errors: ${errors.length}`);
for (const error of errors) console.log(`  ${error}`);
const scope = new Set(contract.scope.map(s => s.toLowerCase()));
let n = 0, hits = 0;
for (const line of transcript.split('\n')) {
  let entry; try { entry = JSON.parse(line); } catch { continue; }
  for (const block of entry?.message?.content || []) {
    if (block?.type !== 'tool_use') continue;
    n++;
    if (['Write', 'Edit'].includes(block.name)) {
      const p = String(block.input?.file_path || '').replaceAll('\\', '/').replace(/^.*?lero-al\//i, '');
      if (scope.has(p.toLowerCase())) { hits++; console.log(`call ${n} ${block.name} ${p}`); }
      continue;
    }
    if (!['Bash', 'PowerShell'].includes(block.name)) continue;
    const found = hook.shellWriteTargets(ROOT, String(block.input?.command || ''), entry.cwd).filter(t => scope.has(t.toLowerCase()));
    if (found.length) { hits++; console.log(`call ${n} ${block.name}: reported ${JSON.stringify(found)}; first 100 chars ${JSON.stringify(String(block.input.command).slice(0, 100))}`); }
  }
}
console.log(`tool calls read: ${n}; calls reported as scope writes: ${hits}`);
const code = contract.scope.filter(p => p.startsWith('scripts/') || p.startsWith('.claude/'));
const status = execFileSync('git', ['status', '--porcelain', '--', ...code], { cwd: ROOT, encoding: 'utf8' }).trim();
console.log(`git status of the 943 code and rule scope files: ${status || 'clean (identical to HEAD)'}`);
