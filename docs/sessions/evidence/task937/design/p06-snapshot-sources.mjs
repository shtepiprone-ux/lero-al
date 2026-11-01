// Tasks 937/942 design: read-only snapshot of the committed (HEAD) text of the files these tasks change, so their
// kickoffs' claim ledgers keep literal line evidence after implementation. Writes only under design/sources/.
// Usage (repo root): node docs/sessions/evidence/task937/design/p06-snapshot-sources.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const out = 'docs/sessions/evidence/task937/design/sources';
const files = [
  'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx',
  'src/components/shared/Map.module.css',
  'src/design-system/mantine/input-chrome.css',
  'src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx',
  'scripts/check-listing-visibility.mjs',
  'docs/sessions/evidence/task927/base/unit-base-failures.txt',
];
mkdirSync(out, { recursive: true });
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
for (const file of files) {
  const text = execFileSync('git', ['show', `HEAD:${file}`], { encoding: 'utf8' });
  const target = `${out}/${file.replace(/\//g, '__')}.txt`;
  // The Task 927 file is snapshotted only for its hash and line count (its mojibake would fail the gate), not its text.
  if (file.endsWith('unit-base-failures.txt')) { console.log(`${head} ${file}: ${text.split('\n').length} lines (hash in p03)`); continue; }
  writeFileSync(target, text);
  console.log(`${head} ${file} -> ${target} (${text.split('\n').length} lines)`);
}
