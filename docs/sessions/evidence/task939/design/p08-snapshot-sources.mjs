// Task 939 design: read-only snapshot of the committed (HEAD) text of the files this task changes, so the kickoff's
// claim ledger keeps literal line evidence after implementation. Writes only under design/sources/.
// Usage (repo root): node docs/sessions/evidence/task939/design/p08-snapshot-sources.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'docs/sessions/evidence/task939/design/sources';
const files = [
  'src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx',
  'src/stories/mantine/primitives/FavoritesShell.stories.tsx',
  '.storybook/main.ts',
];
mkdirSync(out, { recursive: true });
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
for (const file of files) {
  const text = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });
  const target = `${out}/${file.replace(/\//g, '__')}.txt`;
  writeFileSync(target, text);
  console.log(`${head} ${file} -> ${target} (${text.split('\n').length} lines)`);
}
