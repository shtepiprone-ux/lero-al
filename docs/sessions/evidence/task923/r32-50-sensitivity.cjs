/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R108 sensitivity proof (r32-05): the post-save redirect of an owner lands on the cabinet's listings tab, and the two cases that pin it fail when the missing path comes back.
//   M9: `getPostSaveRedirect` (the helper only) returns `/${locale}/cabinet/listings` again for every status that is not visible.
// The break is run alone: the baseline run of each test file passes; the helper is changed by one exact replacement; both test files are run; each run must FAIL on an ASSERTION of its named
// case (a compile/import error or a timeout is not detection): SEC-X-FE-EDIT-MODERATION (ListingFormShell.moderation.security.test.tsx) and the `listingDomain` case "after saving the owner goes
// to the public page only when it is public, else to the cabinet". The file is restored byte for byte (sha256 compared) and both files pass again. The artifact (r32-50-sensitivity.json) holds
// the diff, the failing assertion text of each case and the sha256 of the changed file before and after the restore. Same retrying writes and exit-time restore as r31-50-sensitivity.cjs.
// Run: node docs/sessions/evidence/task923/r32-50-sensitivity.cjs [id ...]   (no argument: all items)
const { spawnSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const OUT = path.join(root, 'docs/sessions/evidence/task923/r32-50-sensitivity.json')
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

const HELPER = 'src/modules/listings/domain/listingSemanticHelpers.ts'
const MODERATION_TEST = 'src/modules/listings/components/__tests__/ListingFormShell.moderation.security.test.tsx'
const DOMAIN_TEST = 'src/modules/listings/domain/__tests__/listingDomain.test.ts'

/** Unit mutations. `edits` are exact replacements in `file`; `tests` are [test file, case id, fragment the failing message must contain (or null)]. */
const MUTATIONS = [
  { id: 'M9-post-save-redirect-missing-path', file: HELPER,
    edits: [{ find: '  return `/${locale}/cabinet?tab=listings`\n', replace: '  return `/${locale}/cabinet/listings`\n' }],
    tests: [
      [MODERATION_TEST, 'SEC-X-FE-EDIT-MODERATION', null],
      [DOMAIN_TEST, 'after saving the owner goes to the public page only when it is public, else to the cabinet', null],
    ] },
]

const failuresOf = (result) => result.testResults.flatMap((suite) => suite.assertionResults.filter((a) => a.status === 'failed').map((a) => ({
  name: a.fullName,
  message: (a.failureMessages[0] ?? '').split('\n')[0].slice(0, 300),
  full: a.failureMessages[0] ?? '',
  kind: /AssertionError|expected|Unable to find an element/.test(a.failureMessages[0] ?? '') ? 'assertion' : 'other',
})))

function runVitest(args, tag) {
  const outFile = path.join(root, `test-results/r32-sensitivity-${tag}.json`)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  const run = spawnSync('npx', ['vitest', 'run', ...args, '--reporter=json', `--outputFile=${outFile}`], { cwd: root, encoding: 'utf8', shell: true, timeout: 600000 })
  const result = JSON.parse(fs.readFileSync(outFile, 'utf8'))
  const suiteErrors = result.testResults.filter((s) => s.status === 'failed' && !s.assertionResults.some((a) => a.status === 'failed')).map((s) => (s.message ?? '').slice(0, 300))
  return { exit: run.status, result, failed: failuresOf(result), passed: result.numPassedTests, total: result.numTotalTests, suiteErrors }
}

/** a small unified-style diff of one replacement: removed lines with "-", added lines with "+" */
function diffOf(file, before, after) {
  const a = before.split('\n'), b = after.split('\n')
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length - 1, endB = b.length - 1
  while (endA >= start && endB >= start && a[endA] === b[endB]) { endA--; endB-- }
  return [`--- ${file}`, `+++ ${file} (mutated)`, `@@ line ${start + 1} @@`, ...a.slice(start, endA + 1).map((l) => `-${l}`), ...b.slice(start, endB + 1).map((l) => `+${l}`)].join('\n')
}

/** Windows can refuse a write for a moment (a scanner or a watcher holds the file): retry, so that a restore is never lost. */
function writeSafely(file, content) {
  let last
  for (let attempt = 0; attempt < 20; attempt++) {
    try { fs.writeFileSync(file, content); return } catch (error) { last = error; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250) }
  }
  throw last
}
/** every file the run changes is restored at exit even when the run itself fails half-way */
const originals = new Map()
process.on('exit', () => { for (const [file, content] of originals) { try { if (!fs.readFileSync(file).equals(content)) writeSafely(file, content) } catch (error) { console.error(`RESTORE FAILED for ${file}: ${error.message}`) } } })

const wanted = process.argv.slice(2)
const records = []
let allProved = true

for (const m of MUTATIONS.filter((x) => !wanted.length || wanted.includes(x.id))) {
  const file = path.join(root, m.file)
  const original = fs.readFileSync(file)
  originals.set(file, original)
  const originalText = original.toString('utf8')
  const record = { id: m.id, kind: 'mutation', file: m.file, cases: m.tests.map(([, c]) => c), status: 'pending' }
  try {
    let mutated = originalText
    for (const edit of m.edits) {
      if (mutated.split(edit.find).length !== 2) throw new Error(`the text to change is not unique (or absent) in ${m.file}: ${edit.find.slice(0, 60)}`)
      mutated = mutated.replace(edit.find, () => edit.replace)
    }
    record.baseline = []
    for (const [test, caseId] of m.tests) {
      const base = runVitest([test], 'baseline')
      record.baseline.push({ caseId, passed: base.passed, total: base.total, failed: base.failed.length })
      if (base.failed.length || base.exit !== 0) throw new Error(`the baseline of ${test} does not pass`)
    }
    record.diff = diffOf(m.file, originalText, mutated)
    record.shaBefore = sha(original)
    writeSafely(file, mutated)
    record.mutant = []
    try {
      for (const [test, caseId, fragment] of m.tests) {
        const run = runVitest([test], 'mutant')
        const hit = run.failed.filter((f) => f.name.includes(caseId))
        const named = fragment ? hit.some((f) => f.full.includes(fragment)) : true
        record.mutant.push({ caseId, exit: run.exit, detected: hit.some((f) => f.kind === 'assertion') && named, fragment, failed: run.failed.map((f) => ({ name: f.name, kind: f.kind, message: f.message })), suiteErrors: run.suiteErrors })
      }
    } finally { writeSafely(file, original) }
    record.shaAfterRestore = sha(fs.readFileSync(file))
    record.restored = record.shaAfterRestore === record.shaBefore
    record.restoredRun = []
    for (const [test, caseId] of m.tests) {
      const again = runVitest([test], 'restored')
      record.restoredRun.push({ caseId, exit: again.exit, passed: again.passed, total: again.total, failed: again.failed.length })
    }
    const detected = record.mutant.every((r) => r.detected)
    const restoredOk = record.restoredRun.every((r) => r.exit === 0 && r.failed === 0)
    record.status = detected && record.restored && restoredOk ? 'proved' : 'NOT PROVED'
  } catch (error) {
    record.status = 'ERROR'
    record.error = String(error.message ?? error)
    writeSafely(file, original)
  }
  originals.delete(file)
  if (record.status !== 'proved') allProved = false
  records.push(record)
  console.log(`${record.status.padEnd(10)} ${m.id} (${record.cases.join(', ')})${record.error ? ` ${record.error}` : ''}${record.mutant?.[0]?.failed?.[0] ? `\n           -> ${record.mutant.map((r) => r.failed[0]?.message ?? 'no failure').join('\n           -> ').slice(0, 800)}` : ''}`)
}

fs.writeFileSync(OUT, JSON.stringify({ takenAt: new Date().toISOString(), node: process.version, platform: process.platform, proved: records.filter((r) => r.status === 'proved').length, total: records.length, records }, null, 2) + '\n')
console.log(`${records.filter((r) => r.status === 'proved').length} of ${records.length} proved.`)
process.exit(allProved ? 0 : 1)
