// Runs one command in the project root and writes an evidence file: platform, Node, command, output (unpiped, stderr merged) and the real exit code.
// Usage: node docs/sessions/evidence/task923/r30-00-run-evidence.mjs <out-file> [--env NAME=VALUE]... -- <command...>
import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', '..', '..', '..')
const args = process.argv.slice(2)
const out = resolve(root, args.shift())
const env = { ...process.env }
const envNotes = []
while (args[0] === '--env') {
  args.shift()
  const [k, ...v] = args.shift().split('=')
  env[k] = v.join('=')
  envNotes.push(`${k}=${v.join('=')}`)
}
if (args[0] === '--') args.shift()
const command = args.join(' ')
const started = new Date().toISOString()
const result = spawnSync(`${command} 2>&1`, { shell: true, cwd: root, env, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 })
const header = [
  `platform: ${process.platform} ${process.arch}`,
  `node: ${process.version}`,
  `cwd: ${root}`,
  `started: ${started}`,
  `command: ${command}`,
  ...(envNotes.length ? [`env: ${envNotes.join(' ')}`] : []),
  '---- output ----',
].join('\n')
writeFileSync(out, `${header}\n${result.stdout ?? ''}${result.stderr ?? ''}\n---- end ----\nEXIT_CODE=${result.status}\n`, 'utf8')
console.log(`${out} EXIT_CODE=${result.status}`)
