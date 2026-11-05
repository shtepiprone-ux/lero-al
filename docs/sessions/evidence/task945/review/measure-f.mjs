// Task 945 review: the cost of the proposed guard and lint row on the real tree. Read-only.
import { execFileSync, spawnSync } from 'node:child_process';
const time = (name, action) => { const begun = Date.now(); const value = action(); console.log(`${name}: ${Date.now() - begun} ms${value === undefined ? '' : `, ${value}`}`); };
const status = args => execFileSync('git', ['status', '--porcelain', '-z', '--untracked-files=all', ...args], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean).length;
time('git status of the whole tree', () => `${status([])} entries`);
time('git status of the roots', () => `${status(['--', 'src', 'scripts', 'messages', '.claude', '.storybook'])} entries`);
time('the CI lint config on two gate files', () => `exit ${spawnSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '--config', 'scripts/workflow-gates/eslint.config.mjs', 'scripts/workflow-gates/code-check.mjs', 'scripts/workflow-gates/change-review.mjs'], { encoding: 'utf8' }).status}`);
