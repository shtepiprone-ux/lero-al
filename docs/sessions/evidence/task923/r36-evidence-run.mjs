// Task 923 Revision 36 evidence runner. Usage: node docs/sessions/evidence/task923/r36-evidence-run.mjs <evidence-file-name> <command string>
// Runs the command through the shell in the project root and writes the evidence file with its header (platform, Node, cwd, command), the unpiped output and the real exit code.
import { spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'

const [name, ...rest] = process.argv.slice(2)
const command = rest.join(' ')
const root = process.cwd()
const dir = join(root, 'docs', 'sessions', 'evidence', 'task923')
mkdirSync(dir, { recursive: true })
const started = new Date().toISOString()
const result = spawnSync(command, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 })
const exit = result.status === null ? `signal ${result.signal}` : String(result.status)
const out = `${result.stdout ?? ''}${result.stderr ? `\n--- stderr ---\n${result.stderr}` : ''}`
const header = [
  `platform: ${os.platform()} ${os.release()} (${os.arch()})`,
  `node: ${process.version}`,
  `cwd: ${root}`,
  `command: ${command}`,
  `started: ${started}`,
  '',
].join('\n')
writeFileSync(join(dir, name), `${header}${out}\n\nexit code: ${exit}\n`)
console.log(`${name}: exit ${exit}`)
process.exit(result.status ?? 1)
