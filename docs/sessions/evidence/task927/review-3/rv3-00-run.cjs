/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code (Review 48, F12) */
// Task 927 review 3 (Opus, 2026-10-24; session record Review 47): independent runs on the Amendment 4 candidate. Usage (repository root):
// node docs/sessions/evidence/task927/review-3/rv3-00-run.cjs [file ...]
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const targeted = [
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx',
  'src/lib/auth/__tests__/googleIdentity.test.ts',
  'src/lib/auth/__tests__/browserAuth.security.test.ts',
  'src/lib/auth/__tests__/browser.smoke.test.ts',
  'src/app/api/auth/me/__tests__/route.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauth.security.test.ts',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/auth/components/AuthSheet.banned.security.test.tsx',
  'src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx',
]
const runs = {
  'rv3-01-centre-probe.txt': 'node docs/sessions/evidence/task927/amendment-4/a4-02-centre-probe.mjs both',
  'rv3-02-targeted.txt': `npx vitest run --reporter=verbose ${targeted.join(' ')}`,
  'rv3-03-typecheck.txt': 'npm run typecheck',
  'rv3-04-i18n.txt': 'npm run check:i18n',
  'rv3-05-census-verify-gate.txt': 'npm run check:rendered-state-census:verify',
  'rv3-06-cli-plan.txt': 'node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json',
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
