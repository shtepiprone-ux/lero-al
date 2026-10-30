// Task 923 Revision 42 (Opus, 2026-10-24): task-readiness section 2 — the canonical isPolicyPath of every R139 executor write path, and the D8_D9 scope membership of
// each. Read-only. Usage (repository root): node docs/sessions/evidence/task923/revision-42/rev42-12-write-authority.mjs
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const { isPolicyPath } = await import(pathToFileURL(path.resolve('scripts/workflow-gates/contract.mjs')).href)
const contract = JSON.parse(fs.readFileSync('tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json', 'utf8'))
const paths = [
  'src/app/admin/users/[id]/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/components/admin/AdminPageHeader.tsx',
  'src/stories/patterns/mantine/AdminPageHeader.stories.tsx',
  'src/app/admin/users/__tests__/adminUserGone.security.test.ts',
  'src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx',
  'messages/sq.json', 'messages/en.json', 'messages/uk.json', 'messages/it.json',
]
const out = [`# Task 923 Revision 42 write authority (Opus), ${new Date().toISOString()}, ${process.platform}, node ${process.version}, cwd ${process.cwd()}`]
for (const p of paths) out.push(`${p}: isPolicyPath ${isPolicyPath(p)}; in D8_D9 scope ${contract.scope.includes(p)}`)
out.push(`D8_D9 executionStatus ${contract.executionStatus}; scope ${contract.scope.length}`)
fs.writeFileSync('docs/sessions/evidence/task923/revision-42/rev42-12-write-authority.txt', out.join('\n') + '\n')
console.log(out.join('\n'))
