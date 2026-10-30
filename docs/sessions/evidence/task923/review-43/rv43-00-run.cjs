/* eslint-disable @typescript-eslint/no-require-imports */
// Task 923 Review 43 (copied from review-42/rv42-00-run.cjs): Opus's independent runs on the R134–R135 candidate. Each evidence file records platform, Node, cwd,
// command, output and exit code. R134 adds one test file and changes no product file, so no integration run and no mobile gate. Usage: node rv43-00-run.cjs [evidence file name ...]
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const dir = __dirname
const focused = ['src/modules/admin/__tests__/adminOrphans.test.ts']
const runs = {
  'rv43-02-focused.txt': `npx vitest run --reporter=verbose ${focused.join(' ')}`,
  'rv43-03-typecheck.txt': 'npm run typecheck',
  'rv43-04-lint.txt': 'npm run lint',
  'rv43-05-sensitivity.txt': 'node docs/sessions/evidence/task923/review-43/rv43-05-sensitivity.cjs',
  'rv43-06-cli-plan.txt': 'node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
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
