// Task 868 plant runner (two-armed: plant -> run -> restore -> run).
// usage: node plant.mjs <evidenceFile> <title> <testCmd> <file> <anchor1>=><replacement1> [<anchor2>=><replacement2> ...]
// The hash is the git blob SHA-1 (identical to `git hash-object <file>` for these LF files), computed with Node crypto.
import fs from 'node:fs'
import cp from 'node:child_process'
import crypto from 'node:crypto'

const [ev, title, cmd, file, ...pairs] = process.argv.slice(2)
const blob = (text) => {
  const body = Buffer.from(text, 'utf8')
  return crypto.createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex')
}

const orig = fs.readFileSync(file, 'utf8')
const h0 = blob(orig)
let planted = orig
for (const pair of pairs) {
  const [anchor, replacement] = pair.split('=>')
  if (planted.split(anchor).length !== 2) throw new Error('anchor not unique/found: ' + anchor)
  planted = planted.replace(anchor, replacement)
}
fs.writeFileSync(file, planted, 'utf8')
const h1 = blob(fs.readFileSync(file, 'utf8'))

function run() {
  try {
    return { out: cp.execSync(cmd + ' 2>&1', { maxBuffer: 1e8 }).toString(), code: 0 }
  } catch (e) {
    return { out: (e.stdout || '').toString(), code: e.status }
  }
}

const planted_run = run()
fs.writeFileSync(file, orig, 'utf8')
const h2 = blob(fs.readFileSync(file, 'utf8'))
const after = run()

const pick = (t) => t.split('\n').filter((l) => /×|FAIL|Tests |Test Files/.test(l)).slice(0, 12).join('\n')
const report = [
  title,
  `file: ${file}`,
  `hash before=${h0} planted=${h1} restored=${h2}`,
  h0 === h2 ? 'HASH_EQUAL' : 'HASH_MISMATCH',
  `planted run exit=${planted_run.code}`,
  pick(planted_run.out),
  `--- after restore: exit=${after.code}`,
  pick(after.out),
].join('\n') + '\n'
fs.writeFileSync(ev, report)
console.log(report)
