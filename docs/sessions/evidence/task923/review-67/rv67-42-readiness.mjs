// Task 923 Review 67 (Opus): after the retained external reports (rv67-41). Rebinds taskSha256 of the kickoff sidecar (the D8_D9 record is unchanged) with the gate's own `hash --task`, then runs the
// kickoff ledger check, `plan` on both sidecars and the plan-phase diff. Writes the two sidecars and this output file only.
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const E = 'docs/sessions/evidence/task923/review-67'
const node = process.execPath
const out = [`platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}; command: node ${E}/rv67-42-readiness.mjs`]
const SIDECARS = ['tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.security.json', 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json']
const REBIND = [SIDECARS[0]]
for (const c of REBIND) {
  const text = readFileSync(c, 'utf8')
  const contract = JSON.parse(text)
  const h = execFileSync(node, ['scripts/workflow-gates/cli.mjs', 'hash', '--task', contract.task], { encoding: 'utf8' }).trim()
  out.push(`${c}: taskSha256 ${contract.taskSha256} -> ${h}`)
  contract.taskSha256 = h
  const indent = /\n( +)"/.exec(text)?.[1] ?? '  '
  writeFileSync(c, JSON.stringify(contract, null, indent) + (text.endsWith('\n') ? '\n' : ''))
}
const run = (label, cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' && cmd.endsWith('.cmd') })
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`.split(/\r?\n/).filter((l) => l.trim() && !/^warning: in the working copy/.test(l))
  out.push(`command: ${label}`, ...text.slice(-3), `exit ${r.status}`)
  return r.status
}
let failed = 0
failed += run('node scripts/check-kickoff-evidence.mjs --files tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md', node, ['scripts/check-kickoff-evidence.mjs', '--files', 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_923_Rendered_State_Census_Gate.md']) ? 1 : 0
failed += run('npm run check:kickoff-evidence', 'npm.cmd', ['run', 'check:kickoff-evidence']) ? 1 : 0
for (const c of SIDECARS) failed += run(`node scripts/workflow-gates/cli.mjs plan --contract ${c}`, node, ['scripts/workflow-gates/cli.mjs', 'plan', '--contract', c]) ? 1 : 0
failed += run('node scripts/workflow-gates/cli.mjs diff --phase plan --base 7dd707aa154801ff2e44402e3976841cb377dddb --working-tree', node, ['scripts/workflow-gates/cli.mjs', 'diff', '--phase', 'plan', '--base', '7dd707aa154801ff2e44402e3976841cb377dddb', '--working-tree']) ? 1 : 0
const d = JSON.parse(readFileSync(SIDECARS[1], 'utf8'))
out.push(`D8_D9: ${d.stage} ${d.executionStatus} ${d.cases.length} cases ${d.cases.filter((c) => c.critical).length} critical ${d.scope.length} paths; review ${d.review ? 'present' : 'none'}`)
out.push(`exit ${failed ? 1 : 0}`)
writeFileSync(`${E}/rv67-42-readiness.txt`, out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = failed ? 1 : 0
