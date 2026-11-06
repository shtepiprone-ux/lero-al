// Task 945 approval of revision 1 (approver, read-only): what the Stop hook's shell reader would count as written for the commands this review plans, before
// any of them runs, because a call counted as a write of a scope file cannot be taken back out of a transcript (D2). Usage: node <this file>.
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shellWriteTargets } from '../../../../../scripts/workflow-gates/security-hook.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const C = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_945_Written_Code_Is_Always_Checked.security.json';
const contract = JSON.parse(readFileSync(resolve(ROOT, C), 'utf8'));
const scope = new Set(contract.scope.map(file => file.toLowerCase()));
const run = (name, ...rest) => ['node docs/sessions/evidence/task945/review/a-run.mjs', name, ...rest].join(' ');
const breaks = readdirSync(resolve(ROOT, 'docs/sessions/evidence/task945/sensitivity')).filter(file => file.endsWith('.break.json'));
const commands = [
  ...breaks.map(file => run(`s-${file.replace('.break.json', '').toLowerCase()}`, 'node scripts/workflow-gates/cli.mjs sensitivity --contract', C, '--break', `docs/sessions/evidence/task945/sensitivity/${file}`)),
  run('governance-report', 'node scripts/workflow-gates/cli.mjs governance-report --contract', C),
  run('verify', 'node scripts/workflow-gates/cli.mjs verify --contract', C),
  run('change-review', 'node scripts/workflow-gates/change-review.mjs'),
  run('selftests', 'node scripts/workflow-gates/selftests.mjs'),
  run('differential', 'node scripts/workflow-gates/hook-differential.mjs'),
  run('check-workflow', 'node scripts/workflow-gates/check-workflow.mjs'),
  run('publication', 'node scripts/workflow-gates/publication.mjs --base HEAD'),
];
for (const command of commands) {
  const targets = shellWriteTargets(ROOT, command);
  const hits = targets.filter(target => scope.has(String(target).toLowerCase()));
  console.log(`${hits.length ? 'HIT' : 'ok '} ${JSON.stringify(targets)} :: ${command.slice(0, 110)}`);
}
