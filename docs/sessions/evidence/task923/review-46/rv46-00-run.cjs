/* eslint-disable @typescript-eslint/no-require-imports */
// Task 923 Review 46 (Opus, 2026-10-23), after review-45/rv45-00-run.cjs: Opus's independent runs on the R138 candidate (working tree on HEAD 28beaf673). R138 changes
// only the View and three test files, so the census code, the six-Story census and the full suite of Review 45 / r41-07 are not rerun. Each evidence file records
// platform, Node, cwd, command, output and exit code. Usage: node rv46-00-run.cjs [evidence file name ...]
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const dir = __dirname
const targeted = [
  'scripts/__tests__/rendered-state-census.test.ts',
  'src/modules/cabinet/components/__tests__/CabinetEmailChangeSection.security.test.tsx',
  'src/modules/cabinet/lib/__tests__/emailChangeErrors.security.test.ts',
  'src/modules/cabinet/components/__tests__/ProfileTab.deletePassword.security.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  'src/modules/cabinet/actions/__tests__/emailChange.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauth.security.test.ts',
  'src/modules/cabinet/actions/__tests__/reauthIdToken.security.test.ts',
  'src/modules/cabinet/components/__tests__/CabinetPasswordSection.signOut.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx',
  'src/lib/auth/__tests__/googleIdentity.test.ts',
  'src/design-system/mantine/patterns/__tests__/MantineDeleteConfirmModal.smoke.test.tsx',
]
const email = ['with-password', 'ready-to-submit', 'google-only', 'wrong-password', 'google-required', 'sending', 'invalid-address', 'limit-reached', 'waiting-for-confirmation', 'resending', 'long-address']
  .map((s) => `patterns-mantine-cabinetemailchangesectionview--${s}`).join(',')
const runs = {
  'rv46-01-targeted.txt': `npx vitest run --reporter=verbose ${targeted.join(' ')}`,
  'rv46-02-typecheck.txt': 'npm run typecheck',
  'rv46-03-eslint-quiet.txt': 'npx eslint . --quiet',
  'rv46-04-placeholder-anchor-probe.txt': 'node docs/sessions/evidence/task923/review-45/rv45-15-placeholder-anchor-probe.mjs',
  'rv46-05-gr3j-probe.txt': 'node docs/sessions/evidence/task923/r40-05-gr3j-probe.mjs docs/sessions/evidence/task923/review-46/rv46-05-gr3j-cells.jsonl',
  'rv46-06-gr12-census.txt': 'node docs/sessions/evidence/task923/r40-05-gr12-census.mjs docs/sessions/evidence/task923/review-46/rv46-06-gr12-census.json',
  'rv46-07-census-email-section.txt': `node scripts/check-rendered-state-census.mjs --stories ${email}`,
  'rv46-08-ui-contract-verify.txt': 'npm run check:ui-contract:verify',
  'rv46-09-cli-plan.txt': 'node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
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
  fs.writeFileSync(path.join(dir, file), text)
  console.log(`${file} EXIT=${r.status}`)
}
