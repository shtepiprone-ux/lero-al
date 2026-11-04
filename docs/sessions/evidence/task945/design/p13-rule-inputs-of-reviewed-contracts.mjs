// Task 945 self-audit: a reviewed contract's digest also reads its rule inputs, so scope alone does not say which contracts a changed file stales. Read-only: the file is overridden in memory.
// Run from the project root: node docs/sessions/evidence/task945/design/p13-rule-inputs-of-reviewed-contracts.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { scopeDigest } = await import(pathToFileURL(resolve('scripts/workflow-gates/contract.mjs')).href);
const contracts = [];
for (const folder of ['tasks/Sprints', 'tasks/Archive']) for (const name of readdirSync(folder, { recursive: true }).map(String).filter(file => file.endsWith('.security.json'))) {
  const path = join(folder, name).replaceAll('\\', '/');
  try { contracts.push({ path, contract: JSON.parse(readFileSync(path, 'utf8')) }); } catch { /* not a contract */ }
}
const reviewed = contracts.filter(row => row.contract.stage === 'reviewed');
console.log(`contracts ${contracts.length}; reviewed ${reviewed.length}`);
const candidates = ['.claude/settings.json', 'scripts/workflow-gates/check-workflow.mjs', 'scripts/workflow-gates/publication.json', '.claude/rules/shared/workflow-gates.md', '.claude/rules/shared/task-readiness.md', '.claude/rules/shared/workflow-contract.md', '.claude/rules/shared/workflow-evidence.md', 'docs/rule-index.md', 'CLAUDE.md'];
for (const file of candidates) {
  const overrides = new Map([[file, `${readFileSync(file, 'utf8')}\n<!-- probe -->\n`]]);
  const stale = [];
  let failed = 0;
  for (const row of reviewed) {
    try { if (scopeDigest(resolve('.'), row.contract) !== scopeDigest(resolve('.'), row.contract, overrides)) stale.push(row.path.split('/').at(-1).replace(/\.security\.json$/, '')); }
    catch { failed++; }
  }
  const named = stale.map(name => (name.match(/Task_(\d+)/) || [])[1] || name);
  console.log(`${file}: changes the digest of ${stale.length} reviewed contracts${failed ? ` (${failed} unreadable)` : ''}: ${named.join(' ')}`);
}
