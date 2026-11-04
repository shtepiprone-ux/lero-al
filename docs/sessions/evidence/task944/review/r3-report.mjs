// Task 944 review 3 (approver, read-only): AC9 and AC13 without the `governance-report` command, which writes a scope file (D2).
// Runs the canonical governanceReport in memory, validates it and the retained report, and checks each sensitivity record and
// artifact. Writes no file. Usage (project root): node docs/sessions/evidence/task944/review/r3-report.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { governanceReport } from '../../../../../scripts/workflow-gates/cli.mjs';
import { digest, planDigest, scopeDigest, validateContract, validateGovernanceReport } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PATH = 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json';
const json = file => JSON.parse(readFileSync(resolve(ROOT, file), 'utf8'));
const contract = json(PATH);
const beforeScope = scopeDigest(ROOT, contract);
const memory = governanceReport(ROOT, contract);
console.log(`in-memory report: status ${memory.status}; errors ${JSON.stringify(memory.errors)}; ${memory.cases.length} cases`);
for (const row of memory.cases) console.log(`  ${row.status} ${row.id}${row.sensitivity ? ' (sensitivity)' : ''}`);
console.log(`validate in-memory: ${JSON.stringify(validateGovernanceReport(ROOT, contract, memory))}`);
const saved = json(contract.report);
console.log(`retained report: status ${saved.status}; cases ${saved.cases.length}; node ${saved.node}; platform ${saved.platform}`);
console.log(`validate retained: ${JSON.stringify(validateGovernanceReport(ROOT, contract, saved))}`);
console.log(`retained contractSha256 ${saved.contractSha256} current ${planDigest(ROOT, contract)}`);
console.log(`retained scopeSha256 ${saved.scopeSha256} current ${scopeDigest(ROOT, contract)}; unchanged by the run: ${beforeScope === scopeDigest(ROOT, contract)}`);
console.log(`validateContract verify: ${JSON.stringify(validateContract(ROOT, contract, { phase: 'verify' }))}`);
const sensitivity = json(contract.sensitivity);
console.log(`sensitivity file: task ${sensitivity.task}; ${sensitivity.cases.length} records`);
for (const record of sensitivity.cases) {
  const spec = json(record.break);
  const artifact = readFileSync(resolve(ROOT, record.artifact), 'utf8');
  const part = name => artifact.slice(artifact.indexOf(`## ${name}`), artifact.indexOf('--- end TAP', artifact.indexOf(`## ${name}`)));
  const mutantText = part('mutant');
  console.log(`${record.id}: method ${record.method}; baseline ${record.baseline}; mutant ${record.mutant}; failureKind ${record.failureKind}; restored ${record.restored}`);
  console.log(`  break ${record.break} current ${record.breakSha256 === digest(ROOT, [record.break])}; artifact current ${record.artifactSha256 === digest(ROOT, [record.artifact])}; spec case ${spec.case === record.id}; testName mapped ${contract.cases.find(c => c.id === record.id)?.testName === record.testName}`);
  console.log(`  target ${spec.target}: find once in live ${readFileSync(resolve(ROOT, spec.target), 'utf8').replace(/\r\n/g, '\n').split(spec.find.replace(/\r\n/g, '\n')).length - 1 === 1}`);
  console.log(`  find: ${JSON.stringify(spec.find)}`);
  console.log(`  replace: ${JSON.stringify(spec.replace)}`);
  console.log(`  artifact: baseline exit ${/exit code: (\d+)/.exec(part('baseline'))?.[1]}, mutant exit ${/exit code: (\d+)/.exec(mutantText)?.[1]} ERR_ASSERTION ${/code: 'ERR_ASSERTION'/.test(mutantText)}, restored exit ${/exit code: (\d+)/.exec(part('restored'))?.[1]}`);
  console.log(`  mutant error: ${/^\s*error: (.*)$/m.exec(mutantText)?.[1]}`);
  const lines = artifact.split('\n').filter(line => /digest before/.test(line));
  for (const line of lines) { const m = /^(.*?) digest before (\S+) after (\S+)$/.exec(line); console.log(`  ${m[1]} unchanged ${m[2] === m[3]}`); }
}
