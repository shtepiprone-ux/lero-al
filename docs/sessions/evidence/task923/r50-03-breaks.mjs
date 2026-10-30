// Task 923 Revision 50 (Sonnet executor, 2026-10-25), AC150 r50-03: three deliberate breaks, B14, B15 and B16. A copy of r49-02-breaks.mjs with these breaks only. Same method as r44-03, r45-03,
// r46-03-breaks.mjs, r47-02-breaks.mjs, r48-02-breaks.mjs and r49-02-breaks.mjs: each break rewrites ONE product file, runs the named test, expects it to FAIL on the intended assertion (not on a
// compile or import error), restores the file from the byte copy taken before the break, checks that the restored file's sha256 equals its after-edit hash, and runs the same test again to show it
// passes. Exit code 0 only if every break did exactly that.
// Usage: node docs/sessions/evidence/task923/r50-03-breaks.mjs   (from the repository root; the breaks run on unit tests, no network)
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function vitest(args) {
  const cmd = ['npx', 'vitest', 'run', ...args].join(' ')
  const result = spawnSync(cmd, { encoding: 'utf8', shell: true, maxBuffer: 1 << 28 })
  return { status: result.status, out: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

/** the first failure block of a vitest transcript, trimmed to what shows the failing assertion */
function failureExcerpt(out) {
  const lines = out.split(/\r?\n/)
  const start = lines.findIndex((l) => /^\s*FAIL\s/.test(l))
  return (start < 0 ? [] : lines.slice(start, start + 12)).join('\n')
}

function replaceOnce(text, from, to, what) {
  const index = text.indexOf(from)
  if (index < 0 || text.indexOf(from, index + 1) >= 0) throw new Error(`break ${what}: the text to change is not found exactly once`)
  return text.slice(0, index) + to + text.slice(index + from.length)
}

const SHEET = 'src/modules/auth/components/AuthSheet.tsx'
const SHEET_TEST = 'src/modules/auth/components/__tests__/AuthSheet.passwordCaptcha.security.test.tsx'

const breaks = [
  {
    id: 'B14',
    title: 'createVerifyClient is back on the anon key: the password check is refused by the CAPTCHA protection for a right password',
    file: 'src/modules/cabinet/actions/index.ts',
    test: ['src/modules/cabinet/actions/__tests__/reauth.security.test.ts', '-t', 'SEC-X-SRV-REAUTH-VERIFY-KEY'],
    expect: 'the password check signs in as the service role',
    mutate: (text) => replaceOnce(text, '    process.env.SUPABASE_SERVICE_ROLE_KEY!,\n', '    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\n', 'B14'),
  },
  {
    id: 'B15',
    title: 'the login view signs in with signIn(email, password) again: the token of the silent check is not sent',
    file: SHEET,
    test: [SHEET_TEST, '-t', 'SEC-X-FE-LOGIN-CAPTCHA-ALLOW'],
    expect: 'to be called with arguments',
    mutate: (text) => replaceOnce(text, 'await signIn(email, password, captchaToken)', 'await signIn(email, password)', 'B15'),
  },
  {
    id: 'B16',
    title: 'the login view does not reset the check after a refused sign-in: the used token stays and the widget is not renewed',
    file: SHEET,
    test: [SHEET_TEST, '-t', 'SEC-X-FE-LOGIN-CAPTCHA-ERR'],
    expect: 'captcha refusal resets the check',
    mutate: (text) => replaceOnce(text, '      // a token is valid once (Task 923 R151): the next attempt needs a new check\n      widgetRef.current?.reset()\n', '      // a token is valid once (Task 923 R151): the next attempt needs a new check\n', 'B16'),
  },
]

console.log(`platform: ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}`)
let allGood = true
for (const brk of breaks) {
  console.log(`\n=== ${brk.id}: ${brk.title}`)
  console.log(`file: ${brk.file}`)
  console.log(`test: npx vitest run ${brk.test.join(' ')}`)
  const original = fs.readFileSync(brk.file)
  const afterEdit = sha(brk.file)
  console.log(`after-edit sha256 (before the break): ${afterEdit}`)
  const baseline = vitest(brk.test)
  console.log(`baseline run: exit ${baseline.status}`)

  let broken
  try {
    const text = original.toString('utf8')
    if (text.includes('\r')) throw new Error(`break ${brk.id}: the file has CR characters; the harness edits LF text only`)
    const mutated = brk.mutate(text)
    if (mutated === text) throw new Error(`break ${brk.id}: the mutation changed nothing`)
    fs.writeFileSync(brk.file, mutated)
    console.log(`broken sha256: ${sha(brk.file)}`)
    broken = vitest(brk.test)
  } finally {
    fs.writeFileSync(brk.file, original)
  }
  const restoredHash = sha(brk.file)
  console.log(`broken run: exit ${broken.status}`)
  console.log(failureExcerpt(broken.out))
  console.log(`restored sha256: ${restoredHash}`)
  const restored = vitest(brk.test)
  console.log(`restored run: exit ${restored.status}`)

  const failedOnAssertion = broken.status !== 0 && /AssertionError/.test(broken.out) && broken.out.includes(brk.expect) && !/(SyntaxError|ReferenceError|Cannot find module)/.test(broken.out)
  const verdict = {
    'baseline passes': baseline.status === 0,
    'the break fails on the intended assertion': failedOnAssertion,
    'restored sha256 equals the after-edit hash': restoredHash === afterEdit,
    'restored run passes': restored.status === 0,
  }
  for (const [what, ok] of Object.entries(verdict)) console.log(`${ok ? 'OK  ' : 'FAIL'} ${brk.id}: ${what}`)
  if (!Object.values(verdict).every(Boolean)) allGood = false
}
console.log(`\n${allGood ? 'ALL THREE BREAKS BEHAVED AS REQUIRED' : 'A BREAK DID NOT BEHAVE AS REQUIRED'}`)
process.exitCode = allGood ? 0 : 1
