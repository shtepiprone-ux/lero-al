// Task 923 Revision 46 (Sonnet executor, 2026-10-24), AC146 r46-03: two deliberate breaks, one at a time (B8, B9). Same method as r44-03-breaks.mjs and r45-03-breaks.mjs: each break rewrites ONE product file,
// runs the named test, expects it to FAIL on the intended assertion (not on a compile or import error), restores the file from the byte copy taken before the break, checks that the
// restored file's sha256 equals its after-edit hash, and runs the same test again to show it passes. Exit code 0 only if both did exactly that.
// Usage: node docs/sessions/evidence/task923/r46-03-breaks.mjs   (from the repository root; both breaks run on the unit test, no network)
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
  return (start < 0 ? [] : lines.slice(start, start + 8)).join('\n')
}

function replaceOnce(text, from, to, what) {
  const index = text.indexOf(from)
  if (index < 0 || text.indexOf(from, index + 1) >= 0) throw new Error(`break ${what}: the text to change is not found exactly once`)
  return text.slice(0, index) + to + text.slice(index + from.length)
}

const DELETE_ACCOUNT = 'src/lib/account/deleteAccount.ts'

const IMAGES_READ = `  // the images are read through their listing, so the number of listings the person holds does not grow the request
  failed = await read('listing_images', (from, to) => db.from('listing_images').select('url, listings!inner(user_id)').eq('listings.user_id', userId).order('id').range(from, to),
    (batch) => batch.forEach((row) => urls.push(row.url)))
  if (failed) return failed
`

const OLD_READS = `  const listed = await db.from('listings').select('id').eq('user_id', userId)
  if (listed.error) return { ok: false, source: 'listings', code: listed.error.code ?? 'error' }
  const listingIds = rows(listed.data).map((row) => row.id)
  if (listingIds.length) {
    const images = await db.from('listing_images').select('url').in('listing_id', listingIds)
    if (images.error) return { ok: false, source: 'listing_images', code: images.error.code ?? 'error' }
    rows(images.data).forEach((row) => urls.push(row.url))
  }
`

const breaks = [
  {
    id: 'B8',
    title: "put back the `listings` read and the `in('listing_id', …)` image read of R141",
    file: DELETE_ACCOUNT,
    test: ['src/lib/account/deleteAccount.security.test.ts', '-t', 'SEC-DEL-SRV-ALLOW'],
    expect: 'what each read asked for',
    mutate: (text) => replaceOnce(text, IMAGES_READ, OLD_READS, 'B8'),
  },
  {
    id: 'B9',
    title: 'read one page only: the loop of `read` returns after the first page',
    file: DELETE_ACCOUNT,
    test: ['src/lib/account/deleteAccount.security.test.ts', '-t', 'SEC-DEL-SRV-ALLOW'],
    expect: 'of the 2 345 image ids were not released',
    mutate: (text) => replaceOnce(text, '      from += batch.length', '      return null', 'B9'),
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
console.log(`\n${allGood ? 'BOTH BREAKS BEHAVED AS REQUIRED' : 'AT LEAST ONE BREAK DID NOT BEHAVE AS REQUIRED'}`)
process.exitCode = allGood ? 0 : 1
