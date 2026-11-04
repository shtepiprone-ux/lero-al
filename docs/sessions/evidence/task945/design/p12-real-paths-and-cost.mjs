// Task 945 self-audit of the kickoff: real App Router paths through the registry commands, several files at once, the cost of an event on this tree, and what the leftover copies import. Read-only.
// Run from the project root: node docs/sessions/evidence/task945/design/p12-real-paths-and-cost.mjs
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

const run = text => spawnSync(text, { shell: true, encoding: 'utf8', maxBuffer: 1 << 28 });
const listed = spawnSync('git', ['ls-files', 'src/app'], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
const bracket = listed.find(file => /\[[^\]]+\]/.test(file) && /\(.+\)/.test(file) && file.endsWith('.tsx')) || listed.find(file => /\[[^\]]+\]/.test(file) && file.endsWith('.tsx'));
const tested = listed.find(file => /\[[^\]]+\]/.test(file) && /\.test\.tsx?$/.test(file));
console.log(`a real path with brackets: ${bracket}`);
// Without --quiet: with it the JSON holds only files with errors, so a count of 0 would prove nothing (the first run of this probe).
const lint = run(`node node_modules/eslint/bin/eslint.js --format json "${bracket}" "src/lib/utils.ts"`);
const results = JSON.parse(lint.stdout || '[]');
console.log(`eslint, that path and another, quoted: exit ${lint.status}; files linted ${results.length}; bracket path among them: ${results.some(row => row.filePath.replaceAll('\\', '/').endsWith(bracket))}; error ${lint.stderr.trim().slice(0, 100)}`);
const integrity = run(`node scripts/check-file-integrity.mjs --files "${bracket}" "src/lib/utils.ts"`);
console.log(`file integrity, two files, quoted: exit ${integrity.status}; ${integrity.stdout.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 2).join(' / ').slice(0, 130)}`);
if (tested) {
  const related = run(`node node_modules/vitest/vitest.mjs related "${tested}" --run --passWithNoTests --reporter=dot`);
  console.log(`vitest related, a bracket test ${tested}: exit ${related.status}; ${`${related.stdout}${related.stderr}`.replace(/\u001b\[[0-9;]*m/g, '').split('\n').map(line => line.trim()).filter(line => /Test Files|No test files/.test(line))[0]?.slice(0, 90)}`);
} else console.log('vitest related, a bracket test: no tracked test file under a bracket path');
const relatedSource = run(`node node_modules/vitest/vitest.mjs related "${bracket}" --run --passWithNoTests --reporter=dot`);
console.log(`vitest related, the bracket source: exit ${relatedSource.status}; ${`${relatedSource.stdout}${relatedSource.stderr}`.replace(/\u001b\[[0-9;]*m/g, '').split('\n').map(line => line.trim()).filter(line => /Test Files|No test files/.test(line))[0]?.slice(0, 90)}`);

const roots = ['src', 'scripts', '.claude/hooks', '.claude/settings.json', 'messages'];
const times = [];
for (let i = 0; i < 5; i++) {
  const t0 = performance.now();
  spawnSync(process.execPath, ['-e', `require('child_process').spawnSync('git',['status','--porcelain','-z','--untracked-files=all','--',${roots.map(root => `'${root}'`).join(',')}])`]);
  times.push(Math.round(performance.now() - t0));
}
console.log(`node start and git status of the roots, this tree, 5 runs: ${times.join(' ')} ms`);

const folder = 'test-results/task941-review2/r12-scan';
if (existsSync(folder)) {
  const copies = readdirSync(folder).filter(name => name.endsWith('.copy.test.mjs'));
  const importing = copies.filter(name => /from\s+['"][^'"]*\/src\//.test(readFileSync(join(folder, name), 'utf8')));
  console.log(`leftover copies ${copies.length}; importing a src file ${importing.length}`);
}
const publication = readFileSync('scripts/workflow-gates/publication.mjs', 'utf8').split('\n');
console.log(`publication candidateReader: ${publication.findIndex(line => /candidateReader/.test(line)) + 1}`);
