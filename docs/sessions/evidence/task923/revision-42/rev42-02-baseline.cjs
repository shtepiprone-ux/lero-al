/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code (Review 48, F12) */
// Task 923 Revision 42 (Opus, 2026-10-24): the design-time baseline of R139's reused tests. The guard test runs the real admin pages (users/[id] among them) for
// non-staff viewers; the listings smoke test shows what a page-render test meets when `requireStaffPage` is not a double. Usage (repository root):
// node docs/sessions/evidence/task923/revision-42/rev42-02-baseline.cjs
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const command = 'npx vitest run --reporter=verbose src/lib/auth/__tests__/staffPage.security.test.ts src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx'
const started = new Date().toISOString()
const r = spawnSync(command, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const text = [
  `platform: ${process.platform} ${process.arch}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, `started: ${started}`,
  `command: ${command}`, '---- output ----', (r.stdout ?? '') + (r.stderr ?? ''), '---- end ----', `EXIT_CODE=${r.status}`,
].join('\n')
fs.writeFileSync(path.join(__dirname, 'rev42-02-baseline-tests.txt'), text + '\n')
console.log(`EXIT_CODE=${r.status}`)
