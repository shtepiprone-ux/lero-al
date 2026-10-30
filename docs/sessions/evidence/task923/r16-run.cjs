/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Transcript runner of Revision 16: runs one command, writes its combined output into an evidence file with the platform line first and the child's own exit status last.
// The exit status is read from the child process object (spawnSync .status) - never from cmd.exe %errorlevel%.
//   node docs/sessions/evidence/task923/r16-run.cjs <out.txt> "<note>" -- <command> [args...]
const fs = require('fs')
const os = require('os')
const { spawnSync } = require('child_process')

const [out, note, sep, ...cmd] = process.argv.slice(2)
if (!out || sep !== '--' || !cmd.length) {
  console.error('usage: node r16-run.cjs <out.txt> "<note>" -- <command> [args...]')
  process.exit(2)
}
let pgVersion = 'n/a'
try { pgVersion = require('pg/package.json').version } catch { /* pg is optional for commands that do not use it */ }
fs.writeFileSync(out, `platform ${process.platform} ${os.release()} node ${process.version}; pg ${pgVersion} from a scratchpad prefix via NODE_PATH; start ${new Date().toISOString()}\ncmd ${cmd.join(' ')}   (${note})\n`)
const fd = fs.openSync(out, 'a')
const program = cmd[0] === 'node' ? process.execPath : cmd[0]
const r = spawnSync(program, cmd.slice(1), { stdio: ['ignore', fd, fd], env: process.env, windowsHide: true })
fs.closeSync(fd)
const code = typeof r.status === 'number' ? r.status : 1
fs.appendFileSync(out, `${r.error ? `SPAWN ERROR ${r.error.code}\n` : ''}EXIT_CODE=${code}\n`)
process.exit(code)
