// Task 923 Revision 50 (Sonnet executor, 2026-10-25): runs ONE command from the repository root and writes an evidence file in the format of r49-*:
// title, platform, node, cwd, command, NODE_PATH, started, stdout, stderr, exit code. It changes nothing else.
// Usage: node docs/sessions/evidence/task923/r50-run-evidence.mjs <out-file> <title> <cmd|bash> <command> [--display <text recorded as the command>]
// `cmd` runs the command through the platform shell (cmd.exe), `bash` through Git Bash. Environment variables of the caller pass through unchanged and are never printed.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const [out, title, shellKind, command, ...rest] = process.argv.slice(2)
let display = command
for (let i = 0; i < rest.length; i++) if (rest[i] === '--display') display = rest[++i]

const started = new Date().toISOString()
const result = shellKind === 'bash'
  ? spawnSync('bash', ['-c', command], { encoding: 'utf8', maxBuffer: 1 << 29 })
  : spawnSync(command, { encoding: 'utf8', shell: true, maxBuffer: 1 << 29 })
const lines = [
  `# ${title}`,
  `platform: ${process.platform} ${process.arch} (${process.platform} ${process.arch})`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `command: ${display}`,
  `NODE_PATH: ${process.env.NODE_PATH ?? '(unset)'}`,
  `started: ${started}`,
  '--- stdout ---',
  result.stdout ?? '',
  '--- stderr ---',
  result.stderr ?? '',
  `--- exit code: ${result.status} ---`,
  '',
]
fs.writeFileSync(out, lines.join('\n'))
console.log(`wrote ${out}: exit ${result.status}`)
process.exitCode = result.status === 0 ? 0 : 1
