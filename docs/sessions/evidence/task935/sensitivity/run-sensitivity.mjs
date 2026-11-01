#!/usr/bin/env node
// Task 935 sensitivity proof: for each critical GOV case, run the mapped test on the baseline, apply one isolated break
// to the protection, require an assertion failure of that exact test, restore the file byte-for-byte and require a pass.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs';

const root = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const outDir = 'docs/sessions/evidence/task935/sensitivity';
const contractPath = 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json';
const contract = JSON.parse(readFileSync(join(root, contractPath), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const breaks = [
  { id: 'GOV-935-VAL-RELEASE-DENY', file: 'scripts/workflow-gates/contract.mjs', description: 'remove the governance release block',
    from: "if (phase === 'release' && ['product', 'governance'].includes(value.kind)) {", to: "if (phase === 'release' && value.kind === 'product') {" },
  { id: 'GOV-935-HOOK-SELF-APPROVE-DENY', file: 'scripts/workflow-gates/security-hook.mjs', description: 'remove the scope-write independence check',
    from: '            if (approving) errors.push(...governanceIndependenceErrors(root, contract, receipt.path, transcript));\n', to: '' },
  { id: 'GOV-935-CI-DIFF-DENY', file: 'scripts/workflow-gates/cli.mjs', description: 'remove the executable policy-file loop of validateDiff',
    from: "  for (const file of policy) {\n    if (!contracts.some(c => c.contract.kind === 'governance' && c.contract.scope?.includes(file))) errors.push(`${file}: outside every changed governance contract scope`);\n  }\n", to: '' },
  { id: 'GOV-935-HOOK-PUSH-INLINE-DENY', file: 'scripts/workflow-gates/push-safety.mjs', description: 'restore a start-of-line push regex',
    from: "const GIT_PUSH = /(?:^|[\\s`|(;&\"'*:])(?:[^\\s`|\"']*[/\\\\])?git", to: "const GIT_PUSH = /^\\s*(?:[^\\s`|\"']*[/\\\\])?git" },
  { id: 'GOV-935-HOOK-PUSH-MAIN-DENY', file: 'scripts/workflow-gates/push-safety.mjs', description: 'remove the main-only-via-PR refusal',
    from: "  if (commands.some(command => /(?:\\s|:)(?:refs\\/heads\\/)?(?:main|master|HEAD)$/.test(command) || /^git push(?: \\S+)?$/.test(command))) return ['Direct push to main is prohibited; push the task branch and merge its pull request after the required checks pass'];\n", to: '' },
  { id: 'GOV-935-VAL-REBASE-DENY', file: 'scripts/workflow-gates/contract.mjs', description: 'accept any rulesRebase without the changed-file checks',
    from: '  if (!problems.length && recorded === contract.review.rulesRebase.originalScopeSha256) return [];', to: '  if (recorded === contract.review.rulesRebase.originalScopeSha256) return [];' },
];
function run(row) {
  const pattern = row.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=^${pattern}$`, row.testFile],
    { cwd: root, encoding: 'utf8', timeout: 120000, env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP } });
  const out = `${child.stdout}${child.stderr}`;
  const escaped = row.testName.replace(/\\/g, '\\\\').replace(/#/g, '\\#');
  const ok = new RegExp(`^ok \\d+ - ${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm').test(out);
  const notOk = new RegExp(`^not ok \\d+ - ${escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm').test(out);
  const passed = child.status === 0 && ok && /^# pass 1$/m.test(out) && /^# fail 0$/m.test(out);
  return { status: passed ? 'passed' : notOk ? 'failed' : 'error', code: child.status, assertion: /code: 'ERR_ASSERTION'/.test(out), out };
}
mkdirSync(join(root, outDir), { recursive: true });
const records = [];
let failures = 0;
for (const b of breaks) {
  const row = contract.cases.find(c => c.id === b.id);
  const target = join(root, b.file);
  const original = readFileSync(target);
  const text = original.toString('utf8');
  if (text.split(b.from).length !== 2) throw new Error(`${b.id}: the break site must occur exactly once in ${b.file}`);
  const baseline = run(row);
  let mutant;
  try { writeFileSync(target, text.replace(b.from, b.to)); mutant = run(row); }
  finally { writeFileSync(target, original); }
  const identical = sha(readFileSync(target)) === sha(original);
  const restored = run(row);
  const record = { id: b.id, testName: row.testName, testFile: row.testFile, mutation: `${b.file}: ${b.description}`,
    baseline: baseline.status, mutant: mutant.status, failureKind: mutant.assertion ? 'assertion' : 'other',
    restored: identical ? restored.status : 'not-restored', artifact: `${outDir}/${b.id}.txt` };
  const artifact = [`Case: ${b.id}`, `Test: ${row.testFile} :: ${row.testName}`, `Break: ${b.file} - ${b.description}`,
    `Platform: ${process.platform} ${process.version}`, '', '--- removed', b.from, '+++ inserted', b.to || '(nothing)', '',
    `Baseline: ${baseline.status} (exit ${baseline.code})`, `Mutant: ${mutant.status} (exit ${mutant.code}), assertion failure: ${mutant.assertion}`,
    `Restored byte-identical: ${identical}; restored run: ${restored.status} (exit ${restored.code})`, '',
    '=== mutant TAP ===', mutant.out.trim(), ''].join('\n');
  writeFileSync(join(root, record.artifact), artifact);
  record.artifactSha256 = digest(root, [record.artifact]);
  records.push(record);
  const good = record.baseline === 'passed' && record.mutant === 'failed' && record.failureKind === 'assertion' && record.restored === 'passed';
  if (!good) failures++;
  console.log(`${good ? 'PROVEN' : 'NOT PROVEN'} ${b.id}: baseline ${record.baseline}, mutant ${record.mutant}/${record.failureKind}, restored ${record.restored}`);
}
writeFileSync(join(root, contract.sensitivity), `${JSON.stringify({ version: 1, task: contract.task, cases: records }, null, 2)}\n`);
process.exitCode = failures ? 1 : 0;
