// Sensitivity proof for the CRITICAL deny cases of the owner-fixes security contract (security-test-quality.md "Sensitivity and reproducibility"), Task 923 R38:
//   baseline PASS  ->  a scoped deliberate break of the protection FAILS the intended assertion  ->  restored PASS.
// A compile / import error, a timeout or a missing service is NOT evidence, so the failure must be an assertion failure of the mapped test itself.
// Output: one raw artifact per case in docs/sessions/evidence/task923/security/sensitivity-owner-fixes/<case>.json (vitest JSON of the three runs + the mutation).
// The break is applied to the working-tree file and restored in `finally`; the restored file must hash identical or the case fails.
// The manifest cases break `.next/server/server-reference-manifest.json` (the build artifact) and need a build made AFTER the sources (the test checks that).
// The `encryptionKey` of the manifest is never read here: the mutation inserts text after the opening `{"node":{` and the file is restored byte for byte.
//   node docs/sessions/evidence/task923/security/owner-fixes-sensitivity.mjs [caseId]            (unit runs)
//   SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> node .../owner-fixes-sensitivity.mjs --integration       (also the real-boundary runs)
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(new URL('../../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const OUT = join(ROOT, 'docs/sessions/evidence/task923/security/sensitivity-owner-fixes')
const sha = (t) => createHash('sha256').update(t).digest('hex')
const withInteg = process.argv.includes('--integration')
const only = process.argv.slice(2).find((a) => !a.startsWith('--'))

const NOTIFICATION = 'src/modules/notifications/lib/createNotification.ts'
const GATEWAY = 'src/modules/listings/actions/applyListingTransition.ts'
const PROVIDERS = 'src/modules/admin/actions/exchangeProviders.ts'
const ADMIN = 'src/modules/admin/actions/index.ts'
const MANIFEST = '.next/server/server-reference-manifest.json'

const PROVIDER_GUARD = "  if ('error' in (await assertAdmin())) return []\n"
const PROFILE_KEYS = "  for (const key of ['name', 'phone', 'company_name'] as const) {\n"
const PROFILE_KEYS_BROKEN = "  for (const key of ['name', 'phone', 'company_name', 'role', 'status'] as unknown as readonly ('name' | 'phone' | 'company_name')[]) {\n"
const manifestEntry = (file, name) => `{"node":{"zz-sensitivity-${name}":{"workers":{},"layer":{},"filename":"${file}","exportedName":"${name}"},`

// id = the contract case; integ = the real-boundary deny control of the same invariant (same break).
const CASES = [
  {
    id: 'SEC-S01-SRV-DENY', file: NOTIFICATION,
    describe: "the server-only marker of createNotification.ts becomes a 'use server' directive, so the writer is a public Server Action again",
    from: "import 'server-only'\n\nimport { createAdminClient } from '@/lib/supabase/admin'\n", to: "'use server'\n\nimport { createAdminClient } from '@/lib/supabase/admin'\n",
  },
  {
    id: 'SEC-S01-INT-DENY', file: MANIFEST, integ: true,
    describe: 'the manifest gets an entry for createNotification, as if the writer were a public Server Action of the build',
    from: '{"node":{', to: manifestEntry('../x/src/modules/notifications/lib/createNotification.ts', 'createNotification'),
  },
  {
    id: 'SEC-S16-SRV-DENY', file: PROVIDERS,
    describe: 'the staff guard of getAllExchangeProvidersAdmin is removed, so any caller reads the providers with their api_key',
    from: PROVIDER_GUARD, to: '',
    integ: { id: 'SEC-S16-INT-DENY', file: 'src/modules/admin/actions/adminGetters.integration.test.ts' },
  },
  {
    id: 'SEC-S28-SRV-DENY', file: GATEWAY,
    describe: "the server-only marker of the status gateway becomes a 'use server' directive, so applyListingTransitionByStatus is a public Server Action again",
    from: "import 'server-only'\n\nimport { revalidateTag, revalidatePath } from 'next/cache'\n", to: "'use server'\n\nimport { revalidateTag, revalidatePath } from 'next/cache'\n",
  },
  {
    id: 'SEC-S28-INT-DENY', file: MANIFEST, integ: true,
    describe: 'the manifest gets an entry for applyListingTransitionByStatus, as if the gateway were a public Server Action of the build',
    from: '{"node":{', to: manifestEntry('../x/src/modules/listings/actions/applyListingTransition.ts', 'applyListingTransitionByStatus'),
  },
  {
    id: 'SEC-S44-SRV-DENY', file: ADMIN,
    describe: 'updateUserProfile also copies role and status from the caller, so a staff member can change them through it',
    from: PROFILE_KEYS, to: PROFILE_KEYS_BROKEN,
    integ: { id: 'SEC-S44-INT-DENY', file: 'src/modules/admin/actions/userProfileFields.integration.test.ts' },
  },
  // Task 923 R163 (kickoff §80, C1536, C1564): SEC-S44-INT-DENY had only the artifact of SEC-S44-SRV-DENY. It gets its own: the same break, run on the real-boundary test, written to its own file.
  {
    id: 'SEC-S44-INT-DENY', file: ADMIN, integ: true,
    describe: 'updateUserProfile also copies role and status from the caller, so a staff member can change them through it',
    from: PROFILE_KEYS, to: PROFILE_KEYS_BROKEN,
  },
  // the critical ALLOW cases: a break that refuses what must be allowed (or empties what the check reads) fails the allow assertion
  {
    id: 'SEC-S16-SRV-ALLOW', file: PROVIDERS,
    describe: 'getAllExchangeProvidersAdmin refuses every caller, the administrator included',
    from: PROVIDER_GUARD, to: '  return []\n',
    integ: { id: 'SEC-S16-INT-ALLOW', file: 'src/modules/admin/actions/adminGetters.integration.test.ts' },
  },
  {
    id: 'SEC-S44-INT-ALLOW', file: ADMIN, integ: true,
    describe: 'updateUserProfile no longer copies the display name, so the permitted text change is lost',
    from: PROFILE_KEYS, to: "  for (const key of ['phone', 'company_name'] as const) {\n",
  },
  {
    id: 'SEC-S01-INT-ALLOW', file: MANIFEST, integ: true,
    describe: 'the node map of the manifest is emptied, so a check that reads it sees no public action at all',
    from: '{"node":{', to: '{"node":{},"zz-sensitivity":{',
  },
  {
    id: 'SEC-S28-INT-ALLOW', file: MANIFEST, integ: true,
    describe: 'the node map of the manifest is emptied, so a check that reads it sees no public action at all',
    from: '{"node":{', to: '{"node":{},"zz-sensitivity":{',
  },
]

const contract = JSON.parse(readFileSync(join(ROOT, 'tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json'), 'utf8'))
const caseOf = (id) => {
  const row = contract.cases.find((c) => c.id === id)
  if (!row) throw new Error(`case ${id} is not in the contract`)
  return row
}

function runVitest(testFile, idToken, integration) {
  const dir = mkdtempSync(join(tmpdir(), 'lero-sens-'))
  try {
    const outputFile = join(dir, 'result.json')
    const args = ['vitest', 'run', ...(integration ? ['--config', 'vitest.integration.config.ts'] : []), testFile, '-t', idToken, '--reporter=json', `--outputFile=${outputFile}`, '--retry=0']
    const run = spawnSync('npx', args, { cwd: ROOT, encoding: 'utf8', shell: true, timeout: 15 * 60 * 1000 })
    let json = null
    try { json = JSON.parse(readFileSync(outputFile, 'utf8')) } catch { /* no result file: reported as such */ }
    return { exitCode: run.status, json }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}
function testResult(result, testName) {
  const rows = (result.json?.testResults ?? []).flatMap((f) => f.assertionResults ?? [])
  const hits = rows.filter((a) => a.fullName === testName)
  return hits.length === 1 ? hits[0] : null
}

function withMutation(mutations, fn) {
  // several breaks in ONE file are applied one after the other to the evolving text (each anchor must still occur exactly once); the original is restored byte for byte
  const files = [...new Set(mutations.map((m) => m.file))].map((file) => ({ file, abs: join(ROOT, file), text: readFileSync(join(ROOT, file), 'utf8'), times: statSync(join(ROOT, file)) }))
  try {
    for (const f of files) {
      const crlf = f.text.includes('\r\n')
      let current = crlf ? f.text.replace(/\r\n/g, '\n') : f.text
      for (const m of mutations.filter((x) => x.file === f.file)) {
        if (current.split(m.from).length !== 2) throw new Error('anchor is not exactly once in ' + f.file)
        current = current.replace(m.from, () => m.to)
      }
      writeFileSync(f.abs, crlf ? current.replace(/\n/g, '\r\n') : current)
    }
    return fn()
  } finally {
    for (const f of files) { writeFileSync(f.abs, f.text); utimesSync(f.abs, f.times.atime, f.times.mtime) }   // same bytes AND the same modification time
    for (const f of files) if (sha(readFileSync(f.abs, 'utf8')) !== sha(f.text)) throw new Error('RESTORE FAILED for ' + f.file)
  }
}

function sensitivity(id, testFile, testName, mutations, integration) {
  const baseline = runVitest(testFile, id, integration)
  const base = testResult(baseline, testName)
  const mutant = withMutation(mutations, () => runVitest(testFile, id, integration))
  const hit = testResult(mutant, testName)
  const restored = runVitest(testFile, id, integration)
  const rest = testResult(restored, testName)
  const message = (hit?.failureMessages ?? []).join('\n')
  // the failure must be an assertion of the mapped test, not an import / compile error, a timeout or a missing service
  const failureKind = hit?.status === 'failed' && /AssertionError|expected .* to |toEqual|toBe|toHaveLength|toContain|toMatchObject/.test(message) && !/SyntaxError|Cannot find module|Failed to resolve|Timeout|timed out|ECONNREFUSED|Transform failed/i.test(message.split('\n')[0]) ? 'assertion' : (hit?.status === 'failed' ? 'other' : 'none')
  return {
    id, testFile, testName, boundary: integration ? 'integration' : 'unit',
    baseline: base?.status === 'passed' ? 'passed' : `not passed (${base?.status ?? 'absent'})`,
    mutant: hit?.status === 'failed' ? 'failed' : `not failed (${hit?.status ?? 'absent'})`,
    failureKind,
    restored: rest?.status === 'passed' ? 'passed' : `not passed (${rest?.status ?? 'absent'})`,
    mutation: mutations.map((m) => ({ file: m.file, description: m.describe, from: m.from, to: m.to })),
    failureMessage: message.slice(0, 1500),
    raw: { baseline: baseline.json, mutant: mutant.json, restored: restored.json },
  }
}

mkdirSync(OUT, { recursive: true })
const summary = []
for (const c of CASES) {
  if (only && c.id !== only) continue
  const row = caseOf(c.id)
  const manifestCase = c.integ === true            // the case itself is the real-boundary one
  if (manifestCase && !withInteg) continue
  const mutation = { file: c.file, describe: c.describe, from: c.from, to: c.to }
  const results = [sensitivity(c.id, row.testFile, row.testName, [mutation], manifestCase)]
  if (withInteg && c.integ && c.integ !== true) {
    const ir = caseOf(c.integ.id)
    results.push(sensitivity(c.integ.id, ir.testFile, ir.testName, [mutation], true))
  }
  const artifact = { version: 1, generatedAt: new Date().toISOString(), case: c.id, results }
  writeFileSync(join(OUT, `${c.id}.json`), JSON.stringify(artifact, null, 1))
  for (const r of results) {
    const ok = r.baseline === 'passed' && r.mutant === 'failed' && r.failureKind === 'assertion' && r.restored === 'passed'
    summary.push({ id: r.id, boundary: r.boundary, ok })
    console.log(`${ok ? 'PROVED    ' : 'NOT PROVED'} ${r.id} [${r.boundary}] baseline=${r.baseline} mutant=${r.mutant} kind=${r.failureKind} restored=${r.restored}`)
  }
}
const bad = summary.filter((s) => !s.ok)
console.log(`\n${summary.length - bad.length} of ${summary.length} sensitivity runs proved.`)
process.exitCode = bad.length ? 1 : 0
