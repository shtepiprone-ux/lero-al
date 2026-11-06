// Prototype for the correction of Task 945 review 2: how a test can reach the timeout branch of selftests.mjs with no wait of 180 s. A preload replaces spawnSync through
// syncBuiltinESMExports, and the real script runs with it. Design evidence to read, not code to paste. Usage (project root): node <this file>
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const folder = mkdtempSync(join(tmpdir(), 'lero-945-p06-'));
const preload = join(folder, 'preload.mjs');
writeFileSync(preload, "import child from 'node:child_process';\nimport { syncBuiltinESMExports } from 'node:module';\nchild.spawnSync = () => ({ status: null, signal: 'SIGTERM', error: Object.assign(new Error('spawnSync node ETIMEDOUT'), { code: 'ETIMEDOUT' }) });\nsyncBuiltinESMExports();\n");
const run = spawnSync(process.execPath, [`--import=${pathToFileURL(preload).href}`, resolve('scripts/workflow-gates/selftests.mjs')], { encoding: 'utf8', timeout: 30000 });
console.log(`the real selftests.mjs under the preload: exit ${run.status}; stdout ${JSON.stringify(run.stdout)}; stderr ${JSON.stringify(run.stderr)}`);
rmSync(folder, { recursive: true, force: true });
