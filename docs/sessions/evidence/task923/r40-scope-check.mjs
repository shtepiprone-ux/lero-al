// Task 923 Revision 40 (executor helper, read-only): classifies the paths R136 edits with the gate's own isProductPath / isPolicyPath
// and checks them against the scope of the D8_D9 contract. Writes nothing.
import { readFileSync } from 'node:fs';
import { isProductPath, isPolicyPath } from '../../../../scripts/workflow-gates/contract.mjs';

const contract = JSON.parse(readFileSync('tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json', 'utf8'));
const paths = [
  'scripts/rendered-state-census/registry.mjs',
  'scripts/rendered-state-census/in-page.mjs',
  'scripts/rendered-state-census/runner.mjs',
  'scripts/rendered-state-census/verify.mjs',
  'scripts/__fixtures__/rendered-state-census/vendor-label-exempt.html',
  'scripts/__fixtures__/rendered-state-census/vendor-label-unexempt.html',
  'scripts/rendered-interaction-states.json',
];
console.log(`contract: ${contract.task} stage=${contract.stage} executionStatus=${contract.executionStatus} scope=${contract.scope.length} paths`);
for (const p of paths) {
  console.log(`${p.padEnd(76)} isProductPath=${isProductPath(p)} isPolicyPath=${isPolicyPath(p)} inScope=${contract.scope.includes(p)}`);
}
