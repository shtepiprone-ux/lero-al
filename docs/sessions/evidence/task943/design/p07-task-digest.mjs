// Task 943 revision 1 (Opus, read-only, 2026-11-02): print the gate digest of a saved kickoff, as `taskSha256` is checked
// by validateContract. Usage: node <this file> <tasks/... .md>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from '../../../../../scripts/workflow-gates/contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
for (const path of process.argv.slice(2)) console.log(`${digest(ROOT, [path])} ${path}`);
