// Task 923 Review 66 (Opus): kickoff section 85.3, step 3. Sets the D8_D9 contract to reviewed with the review binding of shared/workflow-gates.md. The hashes come from the
// gate's own digest/scopeDigest. The owner-fixes and Task 927 contracts and scripts/workflow-gates/release-blockers.json are not touched.
import { readFileSync, writeFileSync } from 'node:fs'
import { digest, scopeDigest } from '../../../../../scripts/workflow-gates/contract.mjs'

const root = process.cwd()
const EVIDENCE = 'docs/sessions/evidence/task923/review-66/rv66-10-review-decision.md'
const C = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
console.log(`platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${root}; command: node docs/sessions/evidence/task923/review-66/rv66-11-set-reviewed.mjs`)
const text = readFileSync(C, 'utf8')
const contract = JSON.parse(text)
if (contract.stage !== 'implemented') throw new Error(`${C}: stage ${contract.stage}, expected implemented`)
contract.stage = 'reviewed'
contract.review = { role: 'Opus', decision: 'APPROVED WITH NOTES', evidence: EVIDENCE, evidenceSha256: digest(root, [EVIDENCE]),
  scopeSha256: scopeDigest(root, contract), reportSha256: digest(root, [contract.report]) }
const indent = /\n( +)"/.exec(text)?.[1] ?? '  '
writeFileSync(C, JSON.stringify(contract, null, indent) + (text.endsWith('\n') ? '\n' : ''))
console.log(`${C}: stage reviewed; executionStatus ${contract.executionStatus}; cases ${contract.cases.length}; scope ${contract.scope.length}; review ${JSON.stringify(contract.review)}`)
console.log('exit 0')
