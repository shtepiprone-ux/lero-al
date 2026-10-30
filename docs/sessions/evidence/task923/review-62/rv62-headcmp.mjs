// Task 923 Review 62 (Opus), read-only: compare a sha256 manifest against the HEAD blobs.
// Usage: node rv62-headcmp.mjs <manifest> [extra paths...]
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const lines = readFileSync(process.argv[2], 'utf8').split('\n').filter(l => /^([0-9a-f]{64}|ABSENT)\s/.test(l))
const extra = process.argv.slice(3).map(p => 'X ' + p)
for (const l of [...lines, ...extra]) {
  const [h, p] = l.split(/\s+/)
  let s
  try {
    const b = execFileSync('git', ['show', `HEAD:${p}`], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] })
    const hh = createHash('sha256').update(b).digest('hex')
    s = h === 'X' ? 'IN_HEAD' : hh === h ? 'HEAD_EQ' : 'HEAD_DIFF'
  } catch { s = 'NOT_IN_HEAD' }
  console.log(s, h.slice(0, 8), p)
}
