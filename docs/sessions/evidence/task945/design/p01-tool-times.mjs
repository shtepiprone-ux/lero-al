// Task 945 design: what the checks cost and what they say on this tree, read-only. Run from the project root:
// node docs/sessions/evidence/task945/design/p01-tool-times.mjs
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const run = (name, command, keep = 4) => {
  const t0 = performance.now();
  const result = spawnSync(command, { shell: true, encoding: 'utf8', timeout: 400000, maxBuffer: 1 << 28 });
  const lines = `${result.stdout || ''}\n${result.stderr || ''}`.split('\n').map(line => line.trim()).filter(Boolean);
  console.log(`${name}: exit ${result.status}; ${Math.round(performance.now() - t0)} ms; ${lines.length} lines`);
  for (const line of lines.slice(-keep)) console.log(`  ${line.replace(/[A-Za-z]:\\Users\\[^\\\s]+/g, '<user-home>').slice(0, 150)}`);
  return result;
};
const file = 'src/modules/listings/queries/visibility.ts';
const shared = 'src/lib/utils.ts';
run('git status of code paths', 'git status --porcelain -- src scripts .claude/hooks');
run('whole tsc, first run', 'npx tsc --noEmit --pretty false');
run('whole tsc, second run', 'npx tsc --noEmit --pretty false');
run('eslint of one file', `npx eslint --quiet ${shared}`);
run('eslint of one gate script', 'npx eslint --quiet scripts/check-listing-visibility.mjs');
run('vitest related, a shared util', `npx vitest related ${shared} --run --reporter=dot`, 6);
run('node --check', 'node --check scripts/workflow-gates/security-hook.mjs');
run('whole gate suite', 'node scripts/workflow-gates/selftests.mjs', 5);
run('whole vitest', 'npx vitest run --reporter=dot', 6);
void file;
