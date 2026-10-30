// Task 927 Amendment 9: runs commands and records platform, Node, cwd, command, output and exit code in one file.
// Usage (repository root): node docs/sessions/evidence/task927/a9/a9-run.mjs <outfile> <title> <command> [<command> ...]
// Each command runs through the shell in order; every command's output and exit code is recorded; this script exits
// with the first non-zero exit code (0 when all commands exit 0).
import fs from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

const [outFile, title, ...commands] = process.argv.slice(2)
const lines = [
  `# ${title}`,
  `platform: ${os.platform()} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `started: ${new Date().toISOString()}`,
  '',
]
let firstFailure = 0
for (const command of commands) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  const code = result.status ?? 1
  if (code !== 0 && firstFailure === 0) firstFailure = code
  lines.push(`command: ${command}`, '--- output ---', `${result.stdout ?? ''}${result.stderr ?? ''}`.replace(/\s+$/, ''), `--- exit code: ${code} ---`, '')
}
lines.push(`finished: ${new Date().toISOString()}`, `exit code: ${firstFailure}`)
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(firstFailure)
