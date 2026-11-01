// Task 942 design: read-only snapshot of the committed (HEAD) text of the files the kickoff's claim ledger cites, so the
// ledger keeps literal line evidence after implementation. Writes only under design/sources/.
// Usage (repo root): node docs/sessions/evidence/task942/design/p04-snapshot-sources.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'docs/sessions/evidence/task942/design/sources';
const files = [
  'src/modules/listings/actions/contactEvents.ts',
  'src/app/[locale]/listings/[slug]/page.tsx',
  'src/modules/listings/lib/visibility.ts',
  'scripts/workflow-gates/security-hook.mjs',
  'scripts/workflow-gates/contract.mjs',
  'scripts/workflow-gates/publication.mjs',
  'scripts/workflow-gates/selftests.mjs',
  'scripts/workflow-gates/pipeline.json',
  'package.json',
  '.claude/rules/shared/git-publication.md',
];
mkdirSync(out, { recursive: true });
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
for (const file of files) {
  const text = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const target = `${out}/${file.replace(/[\\/]/g, '__').replace(/[[\]]/g, '_')}.txt`;
  writeFileSync(target, text);
  console.log(`${head} ${file} -> ${target} (${text.split('\n').length} lines)`);
}
// The Task 923 kickoff is ~7 MB; keep only its R66 row, with its line number, as the excerpt.
const k923 = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md';
const lines = execFileSync('git', ['show', `HEAD:${k923}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n');
const idx = lines.findIndex(l => l.startsWith('| R66 ['));
const excerpt = `${k923} at ${head}, line ${idx + 1} (the R66 row, verbatim):\n${lines[idx]}\n`;
writeFileSync(`${out}/task923-kickoff-R66-row.txt`, excerpt);
console.log(`${head} ${k923} line ${idx + 1} -> ${out}/task923-kickoff-R66-row.txt`);
