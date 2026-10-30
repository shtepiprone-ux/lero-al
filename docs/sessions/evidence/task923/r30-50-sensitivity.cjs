/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R104 (f) sensitivity proof (r30-05): the new deny cases of R101-R103 fail when their ONE check is removed in the working tree (M1-M7 of kickoff 54.4), and the two
// in-test negative controls of R104 (c) fail on their deny assertion, then everything passes again after the restore.
// Unit mutations: the baseline run of the case passes; the file is changed by one exact replacement (or a few exact replacements of one change); the case's test file is run;
// the run must FAIL on an ASSERTION of the named case (a compile/import error or a timeout is not detection); the file is restored byte for byte (sha256 compared) and the case passes again.
// Controls: the integration file is run without the control (passes), with SEC_NEGATIVE_CONTROL set (the named case must fail on its deny assertion, no other test may fail, the
// clean-up of the run must still be verified), and without it again (passes). The shared database is not touched: the control only changes the request the test itself sends.
// The artifact (r30-50-sensitivity.json) holds, per item, the diff, the failing assertion text and the sha256 of the changed file before and after the restore.
// Run: node docs/sessions/evidence/task923/r30-50-sensitivity.cjs [id ...]   (no argument: all items; the controls need SECURITY_TEST_TARGET and SECURITY_TEST_PROJECT_REF in the environment)
const { spawnSync } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const OUT = path.join(root, 'docs/sessions/evidence/task923/r30-50-sensitivity.json')
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

const PAGE = 'src/app/[locale]/listings/[slug]/page.tsx'
const EDIT = 'src/app/[locale]/listings/[slug]/edit/page.tsx'
const RESTRICTED_TEST = 'src/app/[locale]/listings/[slug]/__tests__/listingAccessRestricted.security.test.ts'

/** Unit mutations. `edits` are exact replacements in `file`; `tests` are [test file, case id, assertion fragment]. */
const MUTATIONS = [
  { id: 'M1-drop-owner-filter', file: PAGE,
    edits: [{ find: "      if (!isStaff) hiddenQuery = hiddenQuery.eq('user_id', viewer.userId)\n", replace: '' }],
    tests: [[RESTRICTED_TEST, 'SEC-X-SRV-RESTRICTED-PAGE-DENY']] },
  { id: 'M2-listing-in-restricted-branch', file: PAGE,
    edits: [{
      find: "    if ((await getListingAccessState(slug)) !== 'hidden') notFound()\n",
      replace: "    if ((await getListingAccessState(slug)) !== 'hidden') notFound()\n    const leaked = (await (await import('@/lib/supabase/admin')).createAdminClient().from('listings').select(LISTING_PAGE_SELECT).eq('slug', slug).single()).data\n    if (leaked) return <ListingDetailView listing={leaked} />\n",
    }],
    tests: [[RESTRICTED_TEST, 'SEC-X-SRV-RESTRICTED-PAGE-DENY']] },
  { id: 'M3-hidden-for-missing-slug', file: 'src/modules/listings/lib/listingAccessState.ts',
    edits: [{ find: "if (!data) return 'missing'", replace: "if (!data) return 'hidden'" }],
    tests: [[RESTRICTED_TEST, 'SEC-X-SRV-RESTRICTED-PAGE-DENY']] },
  { id: 'M4-one-ceiling-for-both-currencies', file: 'src/modules/listings/validations/index.ts',
    edits: [{ find: '{ EUR: 10_000_000_000, ALL: 1_000_000_000_000 }', replace: '{ EUR: 1_000_000_000_000, ALL: 1_000_000_000_000 }' }],
    tests: [
      ['src/modules/listings/actions/__tests__/listingBounds.security.test.ts', 'SEC-X-SRV-LISTING-BOUNDS-DENY'],
      ['src/modules/listings/components/__tests__/ListingFormShell.bounds.security.test.tsx', 'SEC-X-FE-LISTING-BOUNDS'],
    ] },
  { id: 'M5-guest-redirect-before-state-check', file: EDIT,
    edits: [{ find: "    if ((await getListingAccessState(slug)) === 'hidden') return restrictedPage(locale, slug, 'sign-in')\n", replace: '' }],
    tests: [['src/app/[locale]/listings/[slug]/edit/__tests__/editAccessRestricted.security.test.ts', 'SEC-X-SRV-RESTRICTED-EDIT']] },
  { id: 'M6-action-rendered-twice', file: 'src/modules/listings/components/ListingAccessRestrictedView.tsx',
    edits: [{
      find: '          <Button component={Link} href={actionHref} color="brand" w={FULL_BELOW_SM}>\n            {actionLabel}\n          </Button>\n',
      replace: '          <><Button component={Link} href={actionHref} color="brand" w={FULL_BELOW_SM}>{actionLabel}</Button><Button component={Link} href={actionHref} color="brand" w={FULL_BELOW_SM}>{actionLabel}</Button></>\n',
    }],
    tests: [['src/modules/listings/components/__tests__/ListingAccessRestrictedView.security.test.tsx', 'SEC-X-FE-RESTRICTED-VIEW']] },
  { id: 'M7-drop-parsePriceDigits', file: 'src/modules/listings/components/ListingFormShellView.tsx',
    edits: [{ find: 'onChange={e => patch({ price: parsePriceDigits(e.target.value) })}', replace: 'onChange={e => patch({ price: e.target.value ? Number(e.target.value) : undefined })}' }],
    tests: [['src/modules/listings/components/__tests__/ListingFormShellView.price.security.test.tsx', 'SEC-X-FE-PRICE-DIGITS']] },
]

/** The two in-test negative controls of R104 (c): the case must fail on its deny assertion (the fragment is in the assertion's message). */
const INTEGRATION = 'src/tests/integration/accessHardening.integration.test.ts'
const CONTROLS = [
  { id: 'C1-closed-read', control: 'closed-read', caseId: 'SEC-DB-X-CLOSED-READ-DENY', fragment: 'is not readable' },
  { id: 'C2-listing-checks', control: 'listing-checks', caseId: 'SEC-DB-X-LISTING-CHECKS-DENY', fragment: 'refused with a check violation' },
]

const failuresOf = (result) => result.testResults.flatMap((suite) => suite.assertionResults.filter((a) => a.status === 'failed').map((a) => ({
  name: a.fullName,
  message: (a.failureMessages[0] ?? '').split('\n')[0].slice(0, 300),
  kind: /AssertionError|expected|Unable to find an element/.test(a.failureMessages[0] ?? '') ? 'assertion' : 'other',
})))

function runVitest(args, tag, extraEnv = {}) {
  const outFile = path.join(root, `test-results/r30-sensitivity-${tag}.json`)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  const run = spawnSync('npx', ['vitest', 'run', ...args, '--reporter=json', `--outputFile=${outFile}`], { cwd: root, encoding: 'utf8', shell: true, timeout: 600000, env: { ...process.env, ...extraEnv } })
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
      for (const [test, caseId] of m.tests) {
        const run = runVitest([test], 'mutant')
        const hit = run.failed.filter((f) => f.name.includes(caseId))
        record.mutant.push({ caseId, exit: run.exit, detected: hit.some((f) => f.kind === 'assertion'), failed: run.failed.map((f) => ({ name: f.name, kind: f.kind, message: f.message })), suiteErrors: run.suiteErrors })
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
  console.log(`${record.status.padEnd(10)} ${m.id} (${record.cases.join(', ')})${record.error ? ` ${record.error}` : ''}${record.mutant?.[0]?.failed?.[0] ? `\n           -> ${record.mutant.map((r) => r.failed[0]?.message ?? 'no failure').join('\n           -> ').slice(0, 400)}` : ''}`)
}

for (const c of CONTROLS.filter((x) => !wanted.length || wanted.includes(x.id))) {
  const record = { id: c.id, kind: 'negative control', file: INTEGRATION, cases: [c.caseId], env: `SEC_NEGATIVE_CONTROL=${c.control}`, status: 'pending' }
  try {
    const args = ['--config', 'vitest.integration.config.ts', INTEGRATION]
    const base = runVitest(args, 'control-baseline')
    record.baseline = { exit: base.exit, passed: base.passed, total: base.total, failed: base.failed.length, suiteErrors: base.suiteErrors }
    if (base.exit !== 0 || base.failed.length || base.suiteErrors.length) throw new Error('the normal run of the integration file does not pass')
    const control = runVitest(args, 'control-run', { SEC_NEGATIVE_CONTROL: c.control })
    const onlyTarget = control.failed.length === 1 && control.failed[0].name.includes(c.caseId)
    record.control = {
      exit: control.exit, failed: control.failed, suiteErrors: control.suiteErrors,
      failedOnDenyAssertion: onlyTarget && control.failed[0].kind === 'assertion' && control.failed[0].message.includes(c.fragment),
      cleanupVerified: control.suiteErrors.length === 0,
    }
    const again = runVitest(args, 'control-restored')
    record.restoredRun = { exit: again.exit, passed: again.passed, total: again.total, failed: again.failed.length, suiteErrors: again.suiteErrors }
    record.status = record.control.failedOnDenyAssertion && record.control.cleanupVerified && again.exit === 0 && !again.failed.length && !again.suiteErrors.length ? 'proved' : 'NOT PROVED'
  } catch (error) {
    record.status = 'ERROR'
    record.error = String(error.message ?? error)
  }
  if (record.status !== 'proved') allProved = false
  records.push(record)
  console.log(`${record.status.padEnd(10)} ${c.id} (${c.caseId})${record.error ? ` ${record.error}` : ''}${record.control?.failed?.[0] ? `\n           -> ${record.control.failed[0].message.slice(0, 200)}` : ''}`)
}

fs.writeFileSync(OUT, JSON.stringify({ takenAt: new Date().toISOString(), node: process.version, platform: process.platform, proved: records.filter((r) => r.status === 'proved').length, total: records.length, records }, null, 2) + '\n')
console.log(`${records.filter((r) => r.status === 'proved').length} of ${records.length} proved.`)
process.exit(allProved ? 0 : 1)
