// Task 923 Revision 45 (Sonnet executor, 2026-10-24), AC145 r45-03: two deliberate breaks, one at a time (B6, B7). Same method as r44-03-breaks.mjs: each break rewrites ONE product file,
// runs the named test, expects it to FAIL on the intended assertion (not on a compile or import error), restores the file from the byte copy taken before the break, checks that the
// restored file's sha256 equals its after-edit hash, and runs the same test again to show it passes. Exit code 0 only if both did exactly that.
// Usage: node docs/sessions/evidence/task923/r45-03-breaks.mjs   (from the repository root; B6 needs .env.local and reaches the approved project, D66, D67)
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')

function projectRef() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = /^NEXT_PUBLIC_SUPABASE_URL=(.*)$/.exec(line)
    if (match) return new URL(match[1].replace(/^["']|["']$/g, '')).hostname.split('.')[0]
  }
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
}

function vitest(args, integration) {
  const ref = integration ? projectRef() : ''
  const cmd = ['npx', 'vitest', 'run', ...(integration ? ['--config', 'vitest.integration.config.ts'] : []), ...args].join(' ')
  const env = integration ? { ...process.env, SECURITY_TEST_TARGET: 'development', SECURITY_TEST_PROJECT_REF: ref } : process.env
  const result = spawnSync(cmd, { encoding: 'utf8', env, shell: true, maxBuffer: 1 << 28 })
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`
  return { status: result.status, out: ref ? out.split(ref).join('<ref>') : out }
}

/** the first failure block of a vitest transcript, trimmed to what shows the failing assertion */
function failureExcerpt(out) {
  const lines = out.split(/\r?\n/)
  const start = lines.findIndex((l) => /^\s*FAIL\s/.test(l))
  return (start < 0 ? [] : lines.slice(start, start + 14)).join('\n')
}

function replaceOnce(text, from, to, what) {
  const index = text.indexOf(from)
  if (index < 0 || text.indexOf(from, index + 1) >= 0) throw new Error(`break ${what}: the text to change is not found exactly once`)
  return text.slice(0, index) + to + text.slice(index + from.length)
}

const CLOUDINARY_DELETE = 'src/lib/cloudinaryDelete.ts'

const breaks = [
  {
    id: 'B6',
    title: 'put the line of C1347 (the listing_images.public_id read) back before the listing_images.url read',
    file: CLOUDINARY_DELETE,
    test: ['src/lib/account/deleteAccount.integration.test.ts', '-t', 'SEC-DEL-INT-ALLOW'],
    integration: true,
    expect: 'the reference check passed and the dry run was logged',
    mutate: (text) => replaceOnce(
      text,
      '  // listing_images.url — URL reference',
      "  await check('listing_images.public_id', () => db.from('listing_images').select('id').eq('public_id', publicId).limit(1), any)\n  // listing_images.url — URL reference",
      'B6',
    ),
  },
  {
    id: 'B7',
    title: 'in check, replace the failed-read branch with `if (error) return`',
    file: CLOUDINARY_DELETE,
    test: ['src/lib/cloudinaryDelete.security.test.ts', '-t', 'SEC-X-SRV-CLEANUP-FAILCLOSED'],
    integration: false,
    expect: 'fails',
    mutate: (text) => replaceOnce(
      text,
      "if (error) { lookupFailed ??= `${label}: ${error.code ?? 'error'}`; return }",
      'if (error) return',
      'B7',
    ),
  },
]

console.log(`platform: ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}`)
let allGood = true
for (const brk of breaks) {
  console.log(`\n=== ${brk.id}: ${brk.title}`)
  console.log(`file: ${brk.file}`)
  console.log(`test: npx vitest run ${brk.integration ? '--config vitest.integration.config.ts ' : ''}${brk.test.join(' ')}`)
  const original = fs.readFileSync(brk.file)
  const afterEdit = sha(brk.file)
  console.log(`after-edit sha256 (before the break): ${afterEdit}`)
  const baseline = vitest(brk.test, brk.integration)
  console.log(`baseline run: exit ${baseline.status}`)

  let broken
  try {
    const text = original.toString('utf8')
    if (text.includes('\r')) throw new Error(`break ${brk.id}: the file has CR characters; the harness edits LF text only`)
    const mutated = brk.mutate(text)
    if (mutated === text) throw new Error(`break ${brk.id}: the mutation changed nothing`)
    fs.writeFileSync(brk.file, mutated)
    console.log(`broken sha256: ${sha(brk.file)}`)
    broken = vitest(brk.test, brk.integration)
  } finally {
    fs.writeFileSync(brk.file, original)
  }
  const restoredHash = sha(brk.file)
  console.log(`broken run: exit ${broken.status}`)
  console.log(failureExcerpt(broken.out))
  console.log(`restored sha256: ${restoredHash}`)
  const restored = vitest(brk.test, brk.integration)
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
