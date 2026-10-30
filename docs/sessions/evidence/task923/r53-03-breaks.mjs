// Task 923 Revision 53 (Sonnet executor, 2026-10-25), AC153 r53-03: one deliberate break, B18. A copy of r51-03-breaks.mjs (itself a copy of r49-02-breaks.mjs) with B18 only. Same method as
// r44-03, r45-03, r46-03-breaks.mjs, r47-02-breaks.mjs, r48-02-breaks.mjs, r49-02-breaks.mjs and r51-03-breaks.mjs: the break rewrites ONE product file, runs the named test, expects it to FAIL on the
// intended assertion (not on a compile or import error), restores the file from the byte copy taken before the break, checks that the restored file's sha256 equals its after-edit hash, and runs
// the same test again to show it passes. Exit code 0 only if both did exactly that.
// Usage: node docs/sessions/evidence/task923/r53-03-breaks.mjs   (from the repository root; the break runs on the unit test, no network)
// It also writes docs/sessions/evidence/task923/r53-03-breaks.txt with the same lines.
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const lines = []
const log = (line = '') => { lines.push(line); console.log(line) }

function vitest(args) {
  const cmd = ['npx', 'vitest', 'run', ...args].join(' ')
  const result = spawnSync(cmd, { encoding: 'utf8', shell: true, maxBuffer: 1 << 28 })
  return { status: result.status, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** the first failure block of a vitest transcript, trimmed to what shows the failing assertion */
function failureExcerpt(out) {
  const text = out.split(/\r?\n/)
  const start = text.findIndex((l) => /^\s*FAIL\s/.test(l))
  return (start < 0 ? [] : text.slice(start, start + 24)).join('\n')
}

function replaceOnce(text, from, to, what) {
  const index = text.indexOf(from)
  if (index < 0 || text.indexOf(from, index + 1) >= 0) throw new Error(`break ${what}: the text to change is not found exactly once`)
  return text.slice(0, index) + to + text.slice(index + from.length)
}

const TEST = 'src/modules/auth/components/__tests__/staleSession.security.test.tsx'

const breaks = [
  {
    id: 'B18',
    title: 'the bridge no longer replaces the page by the language home after it opens the sheet: a person without a session is left on the sign-in page',
    file: 'src/modules/auth/components/AuthRedirect.tsx',
    test: [TEST, '-t', 'SEC-D29-FE-STALE-DENY'],
    expect: 'expect(boundary.replace).toHaveBeenCalledTimes(1)',
    mutate: (text) => replaceOnce(text, "      if (view === 'login') router.replace(`/${locale}`)\n", '', 'B18'),
  },
]

log('# r53-03: Task 923 Revision 53, R158, break B18')
log(`platform: ${process.platform} ${os.release()} ${process.arch}`)
log(`node: ${process.version}`)
log(`cwd: ${process.cwd()}`)
log('command: node docs/sessions/evidence/task923/r53-03-breaks.mjs')
log(`started: ${new Date().toISOString()}`)
let allGood = true
for (const brk of breaks) {
  log(`\n=== ${brk.id}: ${brk.title}`)
  log(`file: ${brk.file}`)
  log(`test: npx vitest run ${brk.test.join(' ')}`)
  const original = fs.readFileSync(brk.file)
  const afterEdit = sha(brk.file)
  log(`after-edit sha256 (before the break): ${afterEdit}`)
  const baseline = vitest(brk.test)
  log(`baseline run: exit ${baseline.status}`)

  let broken
  try {
    const text = original.toString('utf8')
    if (text.includes('\r')) throw new Error(`break ${brk.id}: the file has CR characters; the harness edits LF text only`)
    const mutated = brk.mutate(text)
    if (mutated === text) throw new Error(`break ${brk.id}: the mutation changed nothing`)
    fs.writeFileSync(brk.file, mutated)
    log(`broken sha256: ${sha(brk.file)}`)
    broken = vitest(brk.test)
  } finally {
    fs.writeFileSync(brk.file, original)
  }
  const restoredHash = sha(brk.file)
  log(`broken run: exit ${broken.status}`)
  log(failureExcerpt(broken.out))
  log(`restored sha256: ${restoredHash}`)
  const restored = vitest(brk.test)
  log(`restored run: exit ${restored.status}`)

  const failedOnAssertion = broken.status !== 0 && /AssertionError/.test(broken.out) && broken.out.includes(brk.expect) && !/(SyntaxError|ReferenceError|Cannot find module)/.test(broken.out)
  const verdict = {
    'baseline passes': baseline.status === 0,
    'the break fails on the intended assertion': failedOnAssertion,
    'restored sha256 equals the after-edit hash': restoredHash === afterEdit,
    'restored run passes': restored.status === 0,
  }
  for (const [what, ok] of Object.entries(verdict)) log(`${ok ? 'OK  ' : 'FAIL'} ${brk.id}: ${what}`)
  if (!Object.values(verdict).every(Boolean)) allGood = false
}
log(`\n${allGood ? 'THE BREAK BEHAVED AS REQUIRED' : 'THE BREAK DID NOT BEHAVE AS REQUIRED'}`)
log(`exit code: ${allGood ? 0 : 1}`)
fs.writeFileSync('docs/sessions/evidence/task923/r53-03-breaks.txt', lines.join('\n') + '\n')
process.exitCode = allGood ? 0 : 1
