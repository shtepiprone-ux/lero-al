// Task 931 R9 / AC7 — planted-break harness. One break at a time, in isolation:
//   baseline PASS -> apply ONE textual break to ONE production file -> the named case FAILS with an assertion
//   -> restore the file byte-for-byte in `finally` -> restored PASS -> `git diff --exit-code -- <file>` exits 0.
// Read-only Git only (`git diff`). Usage: node run-plants.mjs [P1 P2 ...]  (default: all six)
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'docs/sessions/evidence/task931/impl/sensitivity')
const VITEST = path.join(ROOT, 'node_modules/vitest/vitest.mjs')

const PLANTS = [
  {
    id: 'P1',
    caseId: 'SEC-931-FE-PAGE-DENY',
    file: 'src/lib/auth/staff.ts',
    testFile: 'src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx',
    find: "  if (viewer.role !== 'admin' && viewer.role !== 'moderator') notFound()\n",
    replace: '  // PLANTED P1: the staff-role check is dropped\n',
    what: 'requireStaffPage no longer refuses a signed-in viewer whose role is not admin or moderator',
  },
  {
    id: 'P2',
    caseId: 'SEC-931-SRV-PERM-DENY',
    file: 'src/lib/auth/permissions.ts',
    testFile: 'src/lib/auth/__tests__/permissions.test.ts',
    find: 'if (!viewer.ok || !viewer.role) return false',
    replace: "if (!viewer.ok || !viewer.role) return roleHasPermission('moderator', key)",
    what: 'hasPermission lets a viewer refused by requireViewer through as a moderator',
  },
  {
    id: 'P3',
    caseId: 'SEC-931-SRV-MODPERM-MODERATOR-DENY',
    file: 'src/modules/admin/actions/permissions.ts',
    testFile: 'src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts',
    find: "if (viewer.role !== 'admin') throw new Error('forbidden')",
    replace: "if (viewer.role !== 'admin' && viewer.role !== 'moderator') throw new Error('forbidden')",
    what: 'getModeratorPermissions admits a moderator',
  },
  {
    id: 'P4',
    caseId: 'SEC-931-SRV-CAPTCHA-DENY',
    file: 'src/modules/auth/actions/captcha.ts',
    testFile: 'src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts',
    find: "reason: isCaptchaRefusal(error) ? 'captcha_failed' : 'signup_failed'",
    replace: "reason: 'signup_failed'",
    what: 'signUpWithCaptcha maps a Supabase captcha refusal to signup_failed',
  },
  {
    id: 'P5',
    caseId: 'SEC-931-SRV-CRON-DENY',
    file: 'src/app/api/cron/listings-expiry/route.ts',
    testFile: 'src/app/api/cron/listings-expiry/__tests__/route.test.ts',
    find: '  const summary = {\n',
    replace:
      "  await db.from('listings').update({ status: 'expired' }).eq('status', 'active').is('expires_at', null) // PLANTED P5\n  const summary = {\n",
    what: 'the paused cron job writes a status to the NULL-expiry active rows',
  },
  {
    id: 'P6',
    caseId: 'SEC-931-SRV-STATS-DENY',
    file: 'src/modules/cabinet/statistics/access.ts',
    testFile: 'src/modules/cabinet/statistics/__tests__/access.test.ts',
    find: "viewer.reason === 'lookup_failed' ? { kind: 'not_agent' } : { kind: 'unauthenticated' }",
    replace: "viewer.reason === 'lookup_failed' ? { kind: 'ok', ownerId: 'planted-owner' as AgentOwnerId } : { kind: 'unauthenticated' }",
    what: 'getAgentStatisticsAccess grants access when the viewer lookup failed',
  },
]

function run(plant, label) {
  const json = path.join(OUT, `${plant.id}-${label}.json`)
  const r = spawnSync(
    process.execPath,
    [VITEST, 'run', plant.testFile, '-t', plant.caseId, '--reporter=default', '--reporter=json', `--outputFile=${json}`],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } },
  )
  const report = fs.existsSync(json) ? JSON.parse(fs.readFileSync(json, 'utf8')) : null
  const cases = report ? report.testResults.flatMap((f) => f.assertionResults) : []
  const target = cases.filter((c) => c.fullName.includes(`[${plant.caseId}]`))
  return { exit: r.status, text: `${r.stdout}\n${r.stderr}`, report, target }
}

const wanted = process.argv.slice(2)
const list = PLANTS.filter((p) => wanted.length === 0 || wanted.includes(p.id))
const summary = []

for (const plant of list) {
  const abs = path.join(ROOT, plant.file)
  const original = fs.readFileSync(abs) // Buffer: byte-for-byte
  const text = original.toString('utf8')
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const find = plant.find.replace(/\n/g, eol)
  const replace = plant.replace.replace(/\n/g, eol)
  const lines = []
  const log = (s) => lines.push(s)
  let ok = false
  let restoredExit = null
  let diffExit = null
  try {
    log(`# ${plant.id} — ${plant.what}`)
    log(`case: ${plant.caseId}`)
    log(`production file: ${plant.file}`)
    log(`test file: ${plant.testFile}`)
    log(`date: ${new Date().toISOString()} node ${process.version} ${process.platform}`)

    const base = run(plant, 'baseline')
    log(`\n## 1. baseline (unmodified code): exit ${base.exit}; case results: ${JSON.stringify(base.target.map((c) => [c.fullName, c.status]))}`)
    if (base.exit !== 0 || base.target.length !== 1 || base.target[0].status !== 'passed') throw new Error('baseline did not pass the named case')

    const first = text.indexOf(find)
    if (first < 0 || text.indexOf(find, first + 1) >= 0) throw new Error(`break anchor must match exactly once in ${plant.file}`)
    fs.writeFileSync(abs, text.replace(find, () => replace))
    log(`\n## 2. planted break applied (one replacement):\n--- find\n${plant.find}--- replace\n${plant.replace}`)

    const broken = run(plant, 'broken')
    log(`\n## 3. with the break: exit ${broken.exit}`)
    log(`case results: ${JSON.stringify(broken.target.map((c) => [c.fullName, c.status]))}`)
    const failed = broken.target.filter((c) => c.status === 'failed')
    for (const c of failed) log(`failure message of [${plant.caseId}]:\n${c.failureMessages.join('\n').split('\n').slice(0, 12).join('\n')}`)
    const assertion = failed.length === 1 && /AssertionError|expected|instead of rejecting/.test(failed[0].failureMessages.join('\n')) &&
      !/TypeError|ReferenceError|SyntaxError|Cannot find module|Failed to resolve/.test(failed[0].failureMessages.join('\n'))
    log(`named case failed with an assertion (not a compile/import/type error): ${assertion}`)
    ok = assertion
  } catch (e) {
    log(`\nHARNESS ERROR: ${e.message}`)
  } finally {
    fs.writeFileSync(abs, original)
    const same = Buffer.compare(fs.readFileSync(abs), original) === 0
    log(`\n## 4. restored in finally; bytes identical to the original: ${same}`)
    const restored = run(plant, 'restored')
    restoredExit = restored.exit
    log(`restored run: exit ${restored.exit}; case results: ${JSON.stringify(restored.target.map((c) => [c.fullName, c.status]))}`)
    const d = spawnSync('git', ['diff', '--exit-code', '--', plant.file], { cwd: ROOT, encoding: 'utf8' })
    diffExit = d.status
    log(`git diff --exit-code -- ${plant.file}: exit ${d.status}${d.stdout ? `\n${d.stdout}` : ''}`)
    const pass = ok && restoredExit === 0 && diffExit === 0 && same && restored.target.length === 1 && restored.target[0].status === 'passed'
    log(`\nRESULT ${plant.id}: ${pass ? 'PASS (fails with the break, passes restored, file unchanged)' : 'FAIL'}`)
    fs.writeFileSync(path.join(OUT, `${plant.id}-${plant.caseId}.txt`), lines.join('\n') + '\n')
    summary.push({ id: plant.id, caseId: plant.caseId, pass })
  }
}
console.log(JSON.stringify(summary, null, 2))
process.exit(summary.every((s) => s.pass) ? 0 : 1)
