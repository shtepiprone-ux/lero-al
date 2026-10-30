// Task 923 Revision 49 (Sonnet executor, 2026-10-25), r49-05: is the `.mockClear()` that R149 added to the test's beforeEach needed?
// Method: run adminUserGone.security.test.ts with the tests of the file in shuffled order for seeds 1..SEEDS, twice: as it is (with the line) and with the line removed.
// The test file is restored from the byte copy taken first; the script checks that its sha256 equals the one before. Exit code 0 only if the file was restored.
// Usage: node docs/sessions/evidence/task923/r49-05-mockclear.mjs   (from the repository root; unit tests, no network)
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'

const FILE = 'src/app/admin/users/__tests__/adminUserGone.security.test.ts'
const LINE = "  vi.mocked(console.error).mockClear()   // a spy that already exists keeps its calls: each case counts only its own\n"
const SEEDS = 12
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function run(seed) {
  const cmd = `npx vitest run --sequence.shuffle.tests --sequence.seed=${seed} ${FILE}`
  const r = spawnSync(cmd, { encoding: 'utf8', shell: true, maxBuffer: 1 << 28 })
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
  const failed = [...out.matchAll(/^\s*(?:FAIL|×)\s.*SEC-X-SRV-ADMIN-USER-[A-Z-]+/gm)].map((m) => m[0].trim().replace(/\s+/g, ' ').slice(0, 200))
  return { status: r.status, failed: [...new Set(failed)] }
}

console.log(`platform: ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}`)
const original = fs.readFileSync(FILE)
const before = sha(FILE)
const text = original.toString('utf8')
if (text.includes('\r')) throw new Error('the file has CR characters; the harness edits LF text only')
if (text.split(LINE).length !== 2) throw new Error('the mockClear line is not found exactly once')
console.log(`test file sha256 before: ${before}`)

const results = { with: [], without: [] }
try {
  for (const seed of Array.from({ length: SEEDS }, (_, i) => i + 1)) results.with.push({ seed, ...run(seed) })
  fs.writeFileSync(FILE, text.replace(LINE, ''))
  console.log(`sha256 without the line: ${sha(FILE)}`)
  for (const seed of Array.from({ length: SEEDS }, (_, i) => i + 1)) results.without.push({ seed, ...run(seed) })
} finally {
  fs.writeFileSync(FILE, original)
}
const after = sha(FILE)
for (const key of ['with', 'without']) {
  console.log(`\n--- ${key} the mockClear line`)
  for (const r of results[key]) console.log(`seed ${r.seed}: exit ${r.status}${r.failed.length ? `; failed: ${r.failed.join(' | ')}` : ''}`)
  console.log(`runs failed: ${results[key].filter((r) => r.status !== 0).length} of ${SEEDS}`)
}
console.log(`\ntest file sha256 after restore: ${after}; equals before: ${after === before}`)
process.exitCode = after === before ? 0 : 1
