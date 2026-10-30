// Task 923 Revision 48 (Sonnet executor, 2026-10-25), AC148 r48-02: three deliberate breaks, one at a time (B10, B11, B12). A copy of r47-02-breaks.mjs with B12 added. Same method as r44-03, r45-03, r46-03-breaks.mjs and r47-02-breaks.mjs: each break rewrites ONE product file,
// runs the named test, expects it to FAIL on the intended assertion (not on a compile or import error), restores the file from the byte copy taken before the break, checks that the
// restored file's sha256 equals its after-edit hash, and runs the same test again to show it passes. Exit code 0 only if both did exactly that.
// Usage: node docs/sessions/evidence/task923/r48-02-breaks.mjs   (from the repository root; all breaks run on the unit test, no network)
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

const TEST = 'src/modules/auth/components/__tests__/staleSession.security.test.tsx'

const breaks = [
  {
    id: 'B10',
    title: 'the bridge acts on the status at mount again: the re-check is never pending',
    file: 'src/modules/auth/components/AuthRedirect.tsx',
    test: [TEST, '-t', 'SEC-D29-FE-STALE-DENY'],
    expect: 'to not be called',
    mutate: (text) => replaceOnce(text, "(status === 'authenticated' ? 'pending' : 'settled')", "('settled')", 'B10'),
  },
  {
    id: 'B11',
    title: 'handleNavigation() does nothing',
    file: 'src/lib/auth/controller.ts',
    test: [TEST, '-t', 'SEC-D29-FE-STALE-DENY'],
    expect: 'to be null',
    mutate: (text) => replaceOnce(text, "  handleNavigation(): void {\n    if (this.state.status !== 'authenticated') return\n", '  handleNavigation(): void {\n    return\n', 'B11'),
  },
  {
    id: 'B12',
    title: 'the restart in mount() is removed: a re-check that an unmount cut off is never started again',
    file: 'src/lib/auth/controller.ts',
    test: [TEST, '-t', 'SEC-D29-FE-STALE-ALLOW'],
    expect: 'to be called 1 times, but got 0 times',
    mutate: (text) => replaceOnce(text, "    if (this.state.status === 'refreshing' && this.inflight === null) this.syncFromServer()\n", '', 'B12'),
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
console.log(`\n${allGood ? 'ALL THREE BREAKS BEHAVED AS REQUIRED' : 'AT LEAST ONE BREAK DID NOT BEHAVE AS REQUIRED'}`)
process.exitCode = allGood ? 0 : 1
