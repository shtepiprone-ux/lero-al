/* eslint-disable @typescript-eslint/no-require-imports */
// Task 927 review 2 (Opus, 2026-10-23), after task923/review-43/rv43-00-run.cjs: Opus's independent runs on the Amendment 3 candidate (working tree on HEAD 4527bc648).
// Each evidence file records platform, Node, cwd, command, output and exit code. Usage: node rv2-00-run.cjs [evidence file name ...]
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const dir = __dirname
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
const stories = 'patterns-mantine-authsheet--login,patterns-mantine-googlesigninslot--loading,patterns-mantine-googlesigninslot--unavailable,patterns-mantine-googlesigninslot--unavailable-reauth,mantine-primitives-modal--delete-confirm-password'
const runs = {
  'rv2-01-targeted.txt': `npx vitest run --reporter=verbose ${targeted.join(' ')}`,
  'rv2-02-typecheck.txt': 'npm run typecheck',
  'rv2-03-census.txt': `node scripts/check-rendered-state-census.mjs --stories ${stories}`,
  'rv2-04-cli-plan.txt': 'node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json',
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
