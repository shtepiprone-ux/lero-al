// Task 943 approver (review 2), read-only: which of this session's tool calls the independence check reads as writes of a
// 943 scope file, and whether those files differ from HEAD. Usage: node <this file> <transcript .jsonl path>.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shellWriteTargets } from '../../../../../scripts/workflow-gates/security-hook.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C943 = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
const scope = new Set(readJson(ROOT, C943).scope.map(s => s.toLowerCase()));
let n = 0;
for (const line of readFileSync(process.argv[2], 'utf8').split('\n')) {
  let entry; try { entry = JSON.parse(line); } catch { continue; }
  for (const block of entry?.message?.content || []) {
    if (block?.type !== 'tool_use') continue;
    n++;
    if (['Write', 'Edit'].includes(block.name)) {
      const p = String(block.input?.file_path || '').replaceAll('\\', '/').replace(/^.*?lero-al\//i, '');
      if (scope.has(p.toLowerCase())) console.log(`call ${n} ${block.name} ${p}`);
      continue;
    }
    if (!['Bash', 'PowerShell'].includes(block.name)) continue;
    const hits = shellWriteTargets(ROOT, String(block.input?.command || ''), entry.cwd).filter(t => scope.has(t.toLowerCase()));
    if (hits.length) {
      const c = String(block.input.command);
      const words = [...c.matchAll(/\b(?:Out-File|Set-Content|WriteAllText|writeFileSync|Copy-Item|Move-Item|Remove-Item|cp|mv|rm)\b/g)].map(m => m[0]);
      console.log(`call ${n} ${block.name}: reported ${JSON.stringify(hits)}; write words in the text ${JSON.stringify([...new Set(words)])}; first 120 chars ${JSON.stringify(c.slice(0, 120))}`);
    }
  }
}
const changed = execFileSync('git', ['status', '--porcelain', '--', ...readJson(ROOT, C943).scope.filter(p => p.startsWith('scripts/') || p.startsWith('.claude/'))], { cwd: ROOT, encoding: 'utf8' });
console.log(`git status of the 943 code and rule scope files: ${changed.trim() ? changed.trim() : 'clean (identical to HEAD)'}`);
