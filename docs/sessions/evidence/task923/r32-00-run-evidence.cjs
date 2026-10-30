/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R109: runs one command from the project root and saves its unpiped transcript with platform, Node, cwd, command, output and the real exit code.
// Usage: node docs/sessions/evidence/task923/r32-00-run-evidence.cjs <out-file> <command...>
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')

const [out, ...cmd] = process.argv.slice(2)
const command = cmd.join(' ')
const started = new Date().toISOString()
const run = spawnSync(command, { cwd: process.cwd(), shell: true, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 1_700_000 })
const body = `${run.stdout ?? ''}${run.stderr ?? ''}`
const header = `platform: ${process.platform} ${process.arch}\nnode: ${process.version}\ncwd: ${process.cwd()}\nstarted: ${started}\ncommand: ${command}\n---- output ----\n`
fs.writeFileSync(out, `${header}${body}\n---- end ----\nEXIT_CODE=${run.status}\n`)
console.log(`${out}: EXIT_CODE=${run.status}`)
