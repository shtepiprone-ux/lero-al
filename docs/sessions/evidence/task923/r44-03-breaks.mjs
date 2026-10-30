// Task 923 Revision 44 (Sonnet executor, 2026-10-24), AC141 r44-03: five deliberate breaks, one at a time. Each break rewrites ONE product file in memory-checked text, runs the named
// test, expects it to FAIL on the intended assertion (not on a compile or import error), restores the file from the byte copy taken before the break, checks that the restored file's
// sha256 equals its after-edit hash, and runs the same test again to show it passes. Exit code 0 only if all five did exactly that.
// Usage: node docs/sessions/evidence/task923/r44-03-breaks.mjs   (run from the repository root; the integration break needs .env.local and reaches the approved project, D66, D67)
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
  return { cmd, status: result.status, out: ref ? out.split(ref).join('<ref>') : out }
}

/** the first failure block of a vitest transcript, trimmed to what shows the failing assertion */
function failureExcerpt(out) {
  const lines = out.split(/\r?\n/)
  const start = lines.findIndex((l) => /^\s*FAIL\s/.test(l))
  return (start < 0 ? lines.slice(0, 0) : lines.slice(start, start + 14)).join('\n')
}

function replaceOnce(text, from, to, what) {
  const index = text.indexOf(from)
  if (index < 0 || text.indexOf(from, index + 1) >= 0) throw new Error(`break ${what}: the text to change is not found exactly once`)
  return text.slice(0, index) + to + text.slice(index + from.length)
}

const DELETE_ACCOUNT = 'src/lib/account/deleteAccount.ts'
const ADMIN_ACTIONS = 'src/modules/admin/actions/index.ts'
const ADMIN_DIALOGS = 'src/components/admin/AdminUserProfileDialogsView.tsx'
const UNIT = 'src/lib/account/deleteAccount.security.test.ts'

const breaks = [
  {
    id: 'B1',
    title: 'move the deleteAsset loop before auth.admin.deleteUser',
    file: DELETE_ACCOUNT,
    test: [UNIT, '-t', 'SEC-DEL-SRV-ALLOW'],
    integration: false,
    expect: 'no file is released before the Auth deletion',
    mutate(text) {
      const start = text.indexOf('  const released = await Promise.allSettled(')
      const end = text.indexOf('  filesNotRemoved += await removeAvatarObjects')
      if (start < 0 || end < start) throw new Error('break B1: the loop is not found')
      const block = text.slice(start, end)
      let mutated = text.slice(0, start) + text.slice(end)
      mutated = replaceOnce(mutated, '  let filesNotRemoved = 0\n\n', '', 'B1')
      mutated = replaceOnce(mutated, '  let db: Db\n', '  let filesNotRemoved = 0\n  let db: Db\n', 'B1')
      const indented = block.split('\n').map((line) => (line ? `  ${line}` : line)).join('\n')
      return replaceOnce(mutated, '    const { error } = await db.auth.admin.deleteUser(userId)\n', `${indented}    const { error } = await db.auth.admin.deleteUser(userId)\n`, 'B1')
    },
  },
  {
    id: 'B2',
    title: 'drop the companies.logo_url read',
    file: DELETE_ACCOUNT,
    test: [UNIT, '-t', 'SEC-DEL-SRV-ALLOW'],
    integration: false,
    expect: 'the ids released',
    mutate: (text) => replaceOnce(
      text,
      "  failed = await read('companies', () => db.from('companies').select('logo_url').eq('created_by', userId),\n    (data) => rows(data).forEach((row) => urls.push(row.logo_url)))\n  if (failed) return failed\n\n",
      '',
      'B2',
    ),
  },
  {
    id: 'B3',
    title: 'remove rankCheck from hardDeleteUser',
    file: ADMIN_ACTIONS,
    test: [UNIT, '-t', 'SEC-DEL-SRV-DENY'],
    integration: false,
    expect: 'a moderator deleting an administrator',
    mutate(text) {
      const from = text.indexOf('export async function hardDeleteUser')
      if (from < 0) throw new Error('break B3: hardDeleteUser is not found')
      const rank = "  const rank = await rankCheck(me.id, userId)\n  if (!rank.allowed || !rank.actorRole) return { error: 'forbidden' }\n"
      const index = text.indexOf(rank, from)
      if (index < 0) throw new Error('break B3: the rank check is not found in hardDeleteUser')
      return text.slice(0, index) + text.slice(index + rank.length)
    },
  },
  {
    id: 'B4',
    title: 'remove typedConfirm from the admin delete dialog',
    file: ADMIN_DIALOGS,
    test: ['src/components/admin/__tests__/adminDeleteDialog.security.test.tsx'],
    integration: false,
    expect: 'SEC-DEL-FE-ADMIN',
    mutate: (text) => replaceOnce(text, "        typedConfirm={{ word: DELETE_CONFIRM_WORD, label: t('dialogs.delete_type_confirm') }}\n", '', 'B4'),
  },
  {
    id: 'B5',
    title: 'make hardDeleteUser delete only the users row',
    file: ADMIN_ACTIONS,
    test: ['src/lib/account/deleteAccount.integration.test.ts', '-t', 'SEC-DEL-INT-ALLOW'],
    integration: true,
    expect: 'the Auth user is gone',
    mutate: (text) => replaceOnce(
      text,
      "  const result = await deleteAccount(userId, { reason: 'staff' })\n  if (!result.ok) return { error: 'delete_failed' }\n",
      "  const profileOnly = await createAdminClient().from('users').delete().eq('id', userId)\n  if (profileOnly.error) return { error: 'delete_failed' }\n",
      'B5',
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
  let mutatedHash = ''
  try {
    const text = original.toString('utf8')
    if (text.includes('\r')) throw new Error(`break ${brk.id}: the file has CR characters; the harness edits LF text only`)
    const mutated = brk.mutate(text)
    if (mutated === text) throw new Error(`break ${brk.id}: the mutation changed nothing`)
    fs.writeFileSync(brk.file, mutated)
    mutatedHash = sha(brk.file)
    console.log(`broken sha256: ${mutatedHash}`)
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
console.log(`\n${allGood ? 'ALL FIVE BREAKS BEHAVED AS REQUIRED' : 'AT LEAST ONE BREAK DID NOT BEHAVE AS REQUIRED'}`)
process.exitCode = allGood ? 0 : 1
