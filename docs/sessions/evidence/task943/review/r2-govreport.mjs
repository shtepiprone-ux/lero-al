// Review 2 harness: rerun the canonical governanceReport in memory (no write) and compare with the retained report.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const sidecar = process.argv[3];
const cli = await import(pathToFileURL(`${root}/scripts/workflow-gates/cli.mjs`).href);
const c = await import(pathToFileURL(`${root}/scripts/workflow-gates/contract.mjs`).href);
const contract = JSON.parse(readFileSync(`${root}/${sidecar}`, 'utf8'));
const fresh = cli.governanceReport(root, contract);
const kept = JSON.parse(readFileSync(`${root}/${contract.report}`, 'utf8'));
console.log('fresh status', fresh.status, 'errors', JSON.stringify(fresh.errors));
for (const row of fresh.cases) console.log(`${row.status === 'passed' ? 'PASS' : 'FAIL'} ${row.id}`);
const strip = r => JSON.stringify({ ...r, node: undefined, platform: undefined });
console.log('fresh equals retained report', strip(fresh) === strip(kept));
console.log('planDigest', c.planDigest(root, contract), 'retained', kept.contractSha256);
console.log('scopeDigest', c.scopeDigest(root, contract), 'retained', kept.scopeSha256);
console.log('validateGovernanceReport(retained)', JSON.stringify(c.validateGovernanceReport(root, contract, kept)));
console.log('validateContract verify', JSON.stringify(c.validateContract(root, contract, { phase: 'verify' })));
console.log('taskSha256 current', c.digest(root, [contract.task]), 'sidecar', contract.taskSha256);
