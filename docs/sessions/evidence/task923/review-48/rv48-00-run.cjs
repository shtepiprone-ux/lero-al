/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code */
// Task 923 Review 48 (Opus, 2026-10-24; session record Review 48): independent runs on the R139 candidate (kickoff §68). Usage (repository root):
// node docs/sessions/evidence/task923/review-48/rv48-00-run.cjs [file ...]
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const targeted = [
  'src/app/admin/users/__tests__/adminUserGone.security.test.ts',
  'src/app/admin/users/__tests__/adminUsersNotice.security.test.tsx',
  'src/lib/auth/__tests__/staffPage.security.test.ts',
]
const mobileFiles = [
  'tasks/Archive/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md',
  'src/components/admin/AdminPageHeader.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/users/[id]/page.tsx',
  'src/stories/patterns/mantine/AdminPageHeader.stories.tsx',
]
const probe = 'docs/sessions/evidence/task923/revision-42/rev42-04-header-notice-probe.mjs'
const runs = {
  'rv48-01-targeted.txt': `npx vitest run --reporter=verbose ${targeted.join(' ')}`,
  'rv48-02-typecheck.txt': 'npm run typecheck',
  'rv48-03-i18n.txt': 'npm run check:i18n',
  'rv48-04-eslint-quiet.txt': 'npx eslint . --quiet',
  'rv48-05-ui-contract-verify.txt': 'npm run check:ui-contract:verify',
  'rv48-06-mobile-contract.txt': `node scripts/check-mobile-adaptation-contract.mjs --files ${mobileFiles.map((f) => `"${f}"`).join(' ')}`,
  'rv48-07-cli-plan.txt': 'node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
  'rv48-08-build-storybook.txt': 'npm run build-storybook',
  'rv48-09-probe-self-test.txt': `node ${probe} self-test`,
  'rv48-10-header-notice-probe.txt': `node ${probe} default,with-action,with-notice docs/sessions/evidence/task923/revision-42/rev42-06-probe-baseline.txt`,
  'rv48-11-build.txt': 'npm run build',
  'rv48-15-route-probe.txt': 'node docs/sessions/evidence/task923/review-48/rv48-15-route-probe.mjs',
}
const only = process.argv.slice(2)
for (const [file, command] of Object.entries(runs)) {
  if (only.length && !only.includes(file)) continue
  const started = new Date().toISOString()
  const r = spawnSync(command, { shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  const text = [
    `platform: ${process.platform} ${process.arch}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, `started: ${started}`,
    `command: ${command}`, '---- output ----', (r.stdout ?? '') + (r.stderr ?? ''), '---- end ----', `EXIT_CODE=${r.status}`,
  ].join('\n')
  fs.writeFileSync(path.join(__dirname, file), text + '\n')
  console.log(`${file}: EXIT_CODE=${r.status}`)
}
