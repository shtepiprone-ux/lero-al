// Task 943 approver (review 3, session e50584bc): runs the named read-only checks and keeps each output, with platform,
// Node, cwd, the exact command and its exit code, in docs/sessions/evidence/task943/review/r3-<name>.txt.
// Usage (project root): node test-results/943-r3/run.mjs <name> [<name> ...]
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { release } from 'node:os';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const EV = 'docs/sessions/evidence/task943/review';
const G = 'scripts/workflow-gates';
const SIDECAR = process.env.SIDECAR || 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json';
const node = process.execPath;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const jobs = {
  selftests: [node, [`${G}/selftests.mjs`]],
  govreport: [node, [`${EV}/r2-govreport.mjs`, ROOT, SIDECAR]],
  publication: [node, [`${G}/publication.mjs`, '--base', 'HEAD']],
  'check-workflow': [node, [`${G}/check-workflow.mjs`]],
  eslint: [node, ['node_modules/eslint/bin/eslint.js', '--config', `${G}/eslint.config.mjs`, G]],
  'kickoff-evidence': [npm, ['run', 'check:kickoff-evidence'], { shell: true }],
  adv: [node, [`${EV}/r1-adv-probe.mjs`]],
  audit2: [node, [`${EV}/r1-audit2-probe.mjs`, join(ROOT, G, 'security-hook.mjs')]],
  timing: [node, [`${EV}/r2-timing.mjs`, ROOT]],
  closure: [node, [`${EV}/r2-closure.mjs`]],
  ac7: [node, [`${EV}/r2-ac7-harness.mjs`]],
  'review-hashes': [node, ['test-results/943-r3/review-hashes.mjs']],
  'diff-release': [node, [`${G}/cli.mjs`, 'diff', '--phase', 'release', '--base', 'd8a07a3c7841022207fd5331f53e5a80b4d7c7e2', '--working-tree']],
  verify943: [node, [`${G}/cli.mjs`, 'verify', '--contract', SIDECAR]],
  plan943: [node, [`${G}/cli.mjs`, 'plan', '--contract', SIDECAR]],
  build: [npm, ['run', 'build'], { shell: true }],
  sens: [node, ['test-results/943-r3/sens.mjs']],
  sens2: [node, ['test-results/943-r3/sens2.mjs']],
  probes: [node, ['test-results/943-r3/probes.mjs']],
  adversarial: [node, ['test-results/943-r3/adversarial.mjs']],
  'review-ledger': [npm, ['run', 'check:review-ledger'], { shell: true }],
};
for (const name of process.argv.slice(2)) {
  const [cmd, args, extra = {}] = jobs[name] || [];
  if (!cmd) { console.log(`unknown job ${name}`); process.exitCode = 1; continue; }
  const started = new Date().toISOString();
  const t = performance.now();
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: process.env, ...extra });
  const ms = Math.round(performance.now() - t);
  const header = [`# Task 943 review 3 (session e50584bc): ${name}`,
    `platform ${process.platform} ${release()}; node ${process.version}; cwd ${ROOT}; started ${started}; ${ms} ms`,
    `command: ${[cmd === node ? 'node' : cmd, ...args].join(' ')}`,
    `exit ${r.status}${r.error ? ` (spawn error ${r.error.code})` : ''}`, ''];
  writeFileSync(join(ROOT, EV, `r3-${name}.txt`), `${header.join('\n')}\n## stdout\n${r.stdout || ''}\n## stderr\n${r.stderr || ''}`);
  console.log(`${name}: exit ${r.status} in ${ms} ms -> ${EV}/r3-${name}.txt`);
}
