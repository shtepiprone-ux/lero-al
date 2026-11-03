// Task 943 review 3 (session e50584bc), read-only: canonical task digest and plan validation of a sidecar.
// Usage (project root): node test-results/943-r3/digest.mjs <sidecar path> [<file to digest> ...]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const c = await import(new URL('../../scripts/workflow-gates/contract.mjs', import.meta.url));
const [sidecar, ...files] = process.argv.slice(2);
const contract = JSON.parse(readFileSync(resolve(ROOT, sidecar), 'utf8'));
console.log(`task ${contract.task}: current digest ${c.digest(ROOT, [contract.task])}; sidecar taskSha256 ${contract.taskSha256}`);
console.log(`validateContract plan ${JSON.stringify(c.validateContract(ROOT, contract, { phase: 'plan' }))}`);
for (const file of files) console.log(`digest ${file}: ${c.digest(ROOT, [file])}`);
