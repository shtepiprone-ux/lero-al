// Task 945 design: which contracts hold the files this task changes, the digest of the hook its corrections belong to, and the size limit of the rule files. Read-only.
// Run from the project root: node docs/sessions/evidence/task945/design/p09-reviewed-scopes-and-base.mjs
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const changed = ['.claude/settings.json', 'scripts/workflow-gates/check-workflow.mjs', 'scripts/workflow-gates/publication.json', '.claude/rules/shared/task-readiness.md', 'CLAUDE.md'];
for (const folder of ['tasks/Sprints', 'tasks/Archive']) {
  let names = [];
  try { names = readdirSync(folder, { recursive: true }).map(String).filter(name => name.endsWith('.security.json')); } catch { continue; }
  for (const name of names) {
    const path = join(folder, name).replaceAll('\\', '/');
    let contract;
    try { contract = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
    const held = changed.filter(file => (contract.scope || []).includes(file));
    if (held.length) console.log(`scope holder: ${path}; stage ${contract.stage}; holds ${held.join(', ')}`);
  }
}
const blob = execFileSync('git', ['show', 'HEAD:scripts/workflow-gates/security-hook.mjs'], { maxBuffer: 1 << 26 });
console.log(`sha256 of the hook at HEAD, as git show gives it: ${createHash('sha256').update(blob).digest('hex')}`);
console.log(`HEAD: ${execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}`);
for (const file of changed.filter(name => name.endsWith('.md'))) console.log(`${file}: ${statSync(file).size} bytes`);
const workflow = readFileSync('scripts/workflow-gates/check-workflow.mjs', 'utf8');
const from = workflow.indexOf('export function validateRuleSizes');
console.log(workflow.slice(from, from + 620));
