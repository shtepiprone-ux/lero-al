// Task 923 Revision 42 (Opus, 2026-10-24): copied from revision-41/rev41-07-readiness.mjs; it also runs the mobile-contract check of the kickoff.
// Copied by rev41-05-copy-tools.cjs from revision-40/rev40-16-readiness.mjs (Revision 41).
// Copied by rev40-15-copy-readiness.cjs from rev40-05-readiness.mjs (Review 44).
// Task 923 Revision 40 (Opus, 2026-10-23), after review-42/rv42-14-readiness.mjs: rebinds the kickoff docs contract to the edited kickoff, checks the D8_D9 contract
// in memory as `ready` (shared/orchestration-state.md), saves `ready` and records the readiness checks (check:kickoff-evidence, cli.mjs plan on both contracts and on
// Task 927's). A failing check sets D8_D9 back to `draft`. Usage: node rev40-05-readiness.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const root = path.resolve(process.argv[2] ?? '.')
const KICKOFF = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md'
const DOCS = 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.security.json'
const D8D9 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
const T927 = 'tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json'
const node = process.execPath
const out = [`# Task 923 Revision 42 readiness run (Opus), ${new Date().toISOString()}, HEAD ${execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()}, working tree, ${process.platform}, node ${process.version}, cwd ${root}`]
const run = (label, args) => {
  const r = spawnSync(label === 'npm' ? (process.platform === 'win32' ? 'npm.cmd' : 'npm') : node, args, { cwd: root, encoding: 'utf8', shell: label === 'npm' && process.platform === 'win32' })
  out.push(`== ${[label, ...args].join(' ')}`, (r.stdout + r.stderr).trim(), `exit ${r.status}`)
  return r.status
}
function rewrite(rel, change) {
  const file = path.join(root, rel)
  for (let attempt = 0; ; attempt++) {
    try {
      const text = fs.readFileSync(file, 'utf8')
      const eol = text.includes('\r\n') ? '\r\n' : '\n'
      const c = JSON.parse(text)
      change(c)
      fs.writeFileSync(file, JSON.stringify(c, null, 2).replace(/\n/g, eol) + eol)
      return c
    } catch (error) {
      if (attempt >= 10 || error.code !== 'UNKNOWN') throw error // a transient Windows lock (ra3-04's first run) is retried
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300)
    }
  }
}
const taskHash = execFileSync(node, ['scripts/workflow-gates/cli.mjs', 'hash', '--task', KICKOFF], { cwd: root, encoding: 'utf8' }).trim()
let before = null
rewrite(DOCS, (c) => { before = c.taskSha256; c.taskSha256 = taskHash })
out.push(`docs contract taskSha256 ${before} -> ${taskHash}`)

const { validateContract } = await import(pathToFileURL(path.join(root, 'scripts/workflow-gates/contract.mjs')).href)
const saved = JSON.parse(fs.readFileSync(path.join(root, D8D9), 'utf8'))
const memory = validateContract(root, { ...saved, executionStatus: 'ready' }, { phase: 'plan' })
out.push(`in-memory validateContract(ready, plan): ${JSON.stringify(memory)}`)

const d = rewrite(D8D9, (c) => { c.executionStatus = 'ready' })
let failed = memory.length ? 1 : 0
failed += run('npm', ['run', '-s', 'check:kickoff-evidence']) !== 0
failed += run('node', ['scripts/workflow-gates/cli.mjs', 'plan', '--contract', D8D9]) !== 0
failed += run('node', ['scripts/check-mobile-adaptation-contract.mjs', '--files', KICKOFF]) !== 0
failed += run('node', ['scripts/workflow-gates/cli.mjs', 'plan', '--contract', DOCS]) !== 0
run('node', ['scripts/workflow-gates/cli.mjs', 'plan', '--contract', T927])
if (failed) rewrite(D8D9, (c) => { c.executionStatus = 'draft' })
const lf = fs.readFileSync(path.join(root, KICKOFF), 'utf8').replace(/\r\n/g, '\n')
out.push(`D8_D9 executionStatus ${failed ? 'draft (a check failed)' : 'ready'}; stage ${d.stage}; scope ${d.scope.length}; cases ${d.cases.length}; critical ${d.cases.filter((k) => k.critical).length}`)
out.push(`kickoff sha256 (LF) ${crypto.createHash('sha256').update(lf).digest('hex')}`)
out.push(`D8_D9 sidecar sha256 ${crypto.createHash('sha256').update(fs.readFileSync(path.join(root, D8D9))).digest('hex')}`)
fs.writeFileSync(path.join(root, 'docs/sessions/evidence/task923/revision-42/rev42-10-readiness.txt'), out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = failed ? 1 : 0
