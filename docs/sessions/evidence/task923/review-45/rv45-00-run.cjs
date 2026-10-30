/* eslint-disable @typescript-eslint/no-require-imports */
// Task 923 Review 45 (Opus, 2026-10-23), after review-43/rv43-00-run.cjs: Opus's independent runs on the R136/R137/R83 candidate (working tree on HEAD 513783a24).
// rv45-08 also reruns Task 927's AC10 census (its five Stories are part of R137 (d)'s six). Each evidence file records platform, Node, cwd, command, output and exit code.
// Usage: node rv45-00-run.cjs [evidence file name ...]
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
const six = 'patterns-mantine-authsheet--login,patterns-mantine-authsheet--login-validation-error,patterns-mantine-googlesigninslot--loading,patterns-mantine-googlesigninslot--unavailable,patterns-mantine-googlesigninslot--unavailable-reauth,mantine-primitives-modal--delete-confirm-password'
const email = ['with-password', 'ready-to-submit', 'google-only', 'wrong-password', 'google-required', 'sending', 'invalid-address', 'limit-reached', 'waiting-for-confirmation', 'resending', 'long-address']
  .map((s) => `patterns-mantine-cabinetemailchangesectionview--${s}`).join(',')
const uiFiles = [
  'src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx',
  'src/modules/cabinet/components/CabinetEmailChangeSection.tsx',
  'src/modules/cabinet/components/ProfileTab.tsx',
  'src/stories/patterns/mantine/CabinetEmailChangeSectionView.stories.tsx',
]
const runs = {
  'rv45-01-census-verify.txt': 'npm run check:rendered-state-census:verify',
  'rv45-02-targeted.txt': `npx vitest run --reporter=verbose ${targeted.join(' ')}`,
  'rv45-03-typecheck.txt': 'npm run typecheck',
  'rv45-04-eslint-quiet.txt': 'npx eslint . --quiet',
  'rv45-05-i18n.txt': 'npm run check:i18n',
  'rv45-06-ui-contract-verify.txt': 'npm run check:ui-contract:verify',
  'rv45-07-mobile-contract.txt': `node scripts/check-mobile-adaptation-contract.mjs --files ${uiFiles.join(' ')}`,
  'rv45-08-census-six.txt': `node scripts/check-rendered-state-census.mjs --stories ${six}`,
  'rv45-09-census-email-section.txt': `node scripts/check-rendered-state-census.mjs --stories ${email}`,
  'rv45-10-gr3j-probe.txt': 'node docs/sessions/evidence/task923/r40-05-gr3j-probe.mjs docs/sessions/evidence/task923/review-45/rv45-10-gr3j-cells.jsonl',
  'rv45-13-gr12-census.txt': 'node docs/sessions/evidence/task923/r40-05-gr12-census.mjs docs/sessions/evidence/task923/review-45/rv45-13-gr12-census.json',
  'rv45-14-zero-hit-grep.txt': `grep -n -E "\\bInput\\b|className|Loader2|style=|styles=|sx=|#[0-9a-fA-F]{3,6}\\b|[0-9]+px|[0-9.]+rem|\\.replace\\(" ${uiFiles.filter((f) => !f.endsWith('ProfileTab.tsx')).join(' ')} src/modules/cabinet/lib/emailChangeErrors.ts`,
  'rv45-15-placeholder-anchor-probe.txt': 'node docs/sessions/evidence/task923/review-45/rv45-15-placeholder-anchor-probe.mjs',
  'rv45-11-cli-plan.txt': 'node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
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
