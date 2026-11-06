// Prototype for the correction of Task 945 review 2: the recording loader over real runs. It changes no result of the gate suite or of the Vitest run of a shared util, and costs little.
// Usage (project root): node <this file>
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const report = resolve('test-results/task945-approval/out/compat-writes.log');
rmSync(report, { force: true });
const env = { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(resolve('test-results/task945-approval/p05-loader.mjs')).href}`, CODE_CHECK_WRITES: report };
delete env.NODE_TEST_CONTEXT;
const timed = (label, args) => {
  const started = Date.now();
  const run = spawnSync(process.execPath, args, { env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 280000 });
  const text = `${run.stdout}${run.stderr}`.replace(/\u001b\[[0-9;]*m/g, '');
  console.log(`${label}: exit ${run.status}; ${Math.round((Date.now() - started) / 1000)} s; ${text.split(/\r?\n/).filter(line => /^# (tests|pass|fail) |Tests  |Test Files  /.test(line)).join(' | ')}`);
};
timed('gate suite', ['scripts/workflow-gates/selftests.mjs']);
timed('vitest related of a shared util', ['node_modules/vitest/vitest.mjs', 'related', 'src/lib/utils.ts', '--run', '--passWithNoTests', '--allowOnly=false', '--reporter=dot']);
console.log(`record: ${existsSync(report) ? readFileSync(report, 'utf8').split('\n').length : 0} lines, ${existsSync(report) ? readFileSync(report).length : 0} bytes`);
