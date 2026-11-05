// Task 945 review, read-only: which contracts hold the files a revision may touch, and the AGENTS.md classification.
import { readdirSync, readFileSync } from 'node:fs';
const wanted = ['scripts/workflow-gates/contract.mjs', 'AGENTS.md', 'scripts/workflow-gates/code-check.mjs', 'scripts/workflow-gates/code-check.json', 'scripts/workflow-gates/change-review.mjs', 'scripts/workflow-gates/dependency-check.mjs', 'scripts/workflow-gates/mutation-check.mjs', 'scripts/workflow-gates/security-hook.mjs', '.claude/rules/shared/secure-code-review.md', 'scripts/workflow-gates/publication.json'];
for (const folder of ['tasks/Archive', 'tasks/Sprints']) for (const name of readdirSync(folder).filter(f => f.endsWith('.security.json'))) {
  let c; try { c = JSON.parse(readFileSync(`${folder}/${name}`, 'utf8')); } catch { continue; }
  const hits = wanted.filter(file => (c.scope || []).includes(file));
  if (hits.length && !/Task_945/.test(name)) console.log(/Task_(\d+)/.exec(name)?.[1], c.stage, c.executionStatus || '-', hits.map(h => h.split('/').pop()).join(', '));
}
