/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code */
// Task 923 Review 48 (Opus, 2026-10-24): read-only summary of the D8_D9 contract's R139 cases and scope. Usage (repository root):
// node docs/sessions/evidence/task923/review-48/rv48-12-contract-cases.cjs
const c = require(process.cwd() + '/tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json')
console.log('keys', Object.keys(c).join(','))
const cases = c.cases || c.securityCases || []
console.log('cases', cases.length, 'critical', cases.filter((x) => x.critical).length, 'executionStatus', c.executionStatus, 'stage', c.stage)
const s = JSON.stringify(c)
for (const p of ['AdminPageHeader.tsx', 'AdminPageHeader.stories.tsx', 'adminUserGone.security.test.ts', 'adminUsersNotice.security.test.tsx']) console.log(p, s.includes(p))
for (const x of cases.filter((y) => /ADMIN-USER/.test(y.id))) console.log(JSON.stringify(x).slice(0, 500))
