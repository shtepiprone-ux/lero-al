// Task 923 Revision 51 (Sonnet executor, 2026-10-25), AC151: runs one command and writes its evidence file with platform, Node, cwd, command, the full unpiped output and the real exit code.
// Usage (repository root): node docs/sessions/evidence/task923/r51-run.mjs <evidence-file> <command...>
// The process exits with the command's exit code.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

const [file, ...parts] = process.argv.slice(2)
if (!file || parts.length === 0) throw new Error('usage: node docs/sessions/evidence/task923/r51-run.mjs <evidence-file> <command...>')
const command = parts.join(' ')
const started = new Date().toISOString()
const result = spawnSync(command, { encoding: 'utf8', shell: true, maxBuffer: 1 << 29 })
const status = result.status ?? 1
const text = [
  `# ${file.split('/').pop()}: Task 923 Revision 51, R156`,
  `platform: ${process.platform} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: ${command}`,
  `started: ${started}`,
  '--- stdout ---',
  result.stdout ?? '',
  '--- stderr ---',
  result.stderr ?? '',
  `--- exit code: ${status} ---`,
].join('\n')
fs.writeFileSync(file, text + '\n')
console.log(text)
process.exitCode = status
