/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R107 / AC105 proof (r31-04): updateListing.smoke.test.ts differs from Review 33's candidate only by R105 (a) and (b).
// Review 33's candidate is not kept as a file, only as a fingerprint (review-33/rv33r-13-fingerprints.txt). This script reverses the three R105 replacements in memory, checks that the result has
// that fingerprint (so the file today equals the candidate plus exactly those replacements), and prints the real difference with `git diff --no-index` (read-only).
// Run: node docs/sessions/evidence/task923/r31-04-ac105-diff.cjs <scratch-dir>
const { spawnSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const scratch = path.resolve(process.argv[2])
const FILE = 'src/modules/listings/actions/__tests__/updateListing.smoke.test.ts'
const FINGERPRINTS = 'docs/sessions/evidence/task923/review-33/rv33r-13-fingerprints.txt'
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

const current = fs.readFileSync(path.join(root, FILE))
const line = fs.readFileSync(path.join(root, FINGERPRINTS), 'utf8').split(/\r?\n/).find((l) => l.includes('updateListing.smoke.test.ts'))
const expected = line.trim().split(/\s+/)[0]

// the R105 replacements, new text -> Review 33's text
const REVERSE = [
  { now: `  it("happy path: owner edit of an active listing → { slug, status: 'pending' } (D53), one gateway move, one update", async () => {`,
    was: `  it('happy path: owner edit → { slug, status } returned, update called once', async () => {` },
  { now: `    expect(result).toEqual({ slug: LISTING_SLUG, status: 'pending' })\n    expect(mockListingsUpdateEq).toHaveBeenCalledTimes(1)\n    expect(mockApplyTransition).toHaveBeenCalledTimes(1)\n    expect(mockApplyTransition).toHaveBeenCalledWith(LISTING_ID, 'pending', expect.objectContaining({ source: 'cabinet' }))\n`,
    was: `    expect(result).toEqual({ slug: LISTING_SLUG, status: 'active' })\n    expect(mockListingsUpdateEq).toHaveBeenCalledTimes(1)\n` },
  { now: `  it("update DB error → { error: 'update_failed' } + console.error logged (Guard 4)", async () => {`,
    was: `  it('update DB error → { error: message } + console.error logged (Guard 4)', async () => {` },
  { now: `    expect(result).toEqual({ error: 'update_failed' })\n    expect(consoleSpy)`,
    was: `    expect(result).toEqual({ error: 'update constraint violation' })\n    expect(consoleSpy)` },
]
let text = current.toString('utf8')
const eol = text.includes('\r\n') ? '\r\n' : '\n'
if (eol === '\r\n') text = text.replace(/\r\n/g, '\n')
for (const r of REVERSE) {
  if (text.split(r.now).length !== 2) throw new Error(`R105 text not found exactly once: ${r.now.slice(0, 70)}`)
  text = text.replace(r.now, () => r.was)
}
if (eol === '\r\n') text = text.replace(/\n/g, '\r\n')
const candidate = Buffer.from(text, 'utf8')
fs.mkdirSync(scratch, { recursive: true })
const candidateFile = path.join(scratch, 'updateListing.smoke.review33-candidate.ts')
fs.writeFileSync(candidateFile, candidate)

console.log(`file: ${FILE}`)
console.log(`sha256 now:                           ${sha(current)}`)
console.log(`sha256 of now with R105 reversed:     ${sha(candidate)}`)
console.log(`sha256 of Review 33's candidate:      ${expected}  (${FINGERPRINTS})`)
const equal = sha(candidate) === expected
console.log(`reversed R105 == Review 33 candidate: ${equal}`)
const diff = spawnSync('git', ['diff', '--no-index', '--no-color', '--unified=2', candidateFile, path.join(root, FILE)], { cwd: root, encoding: 'utf8' })
console.log('---- git diff --no-index (Review 33 candidate reconstructed -> today) ----')
console.log(diff.stdout)
process.exit(equal ? 0 : 1)
