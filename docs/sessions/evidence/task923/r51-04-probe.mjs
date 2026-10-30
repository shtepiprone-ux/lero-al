// Task 923 Revision 51 (Sonnet executor, 2026-10-25), AC151 r51-04: a real-boundary probe by the executor, after review-58/rv58-05-session-client-global-probe.mjs. It runs the REAL
// `changeCabinetPassword` on the approved development project, with `next/headers` giving the browser session's cookie and recording the cookie writes (the body is
// r51-04-probe.body.mjs, run through vitest with the aliases of vitest.integration.config.ts). Before the call the browser, a second session and nothing else are alive; after it
// the answer is { ok: true }, every session of the account is ended and the auth cookie is written empty. The synthetic user is deleted and the clean-up is verified.
// Runs with SECURITY_TEST_TARGET=development and SECURITY_TEST_PROJECT_REF from the URL in .env.local; neither the URL, the ref, a key, a token nor a password is printed or written.
// Run (repository root): node docs/sessions/evidence/task923/r51-04-probe.mjs      Writes docs/sessions/evidence/task923/r51-04-probe.txt
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const repo = process.cwd().replace(/\\/g, '/')
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => /^NEXT_PUBLIC_SUPABASE_URL=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, '')]))
const url = env.NEXT_PUBLIC_SUPABASE_URL
const ref = new URL(url).hostname.split('.')[0]

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r51-04-'))
const config = path.join(dir, 'vitest.r51-04.config.mjs')
fs.writeFileSync(config, `export default {
  root: ${JSON.stringify(repo)},
  test: {
    environment: 'node',
    include: ['docs/sessions/evidence/task923/r51-04-probe.body.mjs'],
    setupFiles: [${JSON.stringify(repo + '/src/tests/integration/setup.ts')}],
    testTimeout: 120000, hookTimeout: 180000, retry: 0, fileParallelism: false, allowOnly: false, passWithNoTests: false, isolate: true,
  },
  resolve: { alias: { '@': ${JSON.stringify(repo + '/src')}, 'server-only': ${JSON.stringify(repo + '/src/tests/server-only-stub.ts')}, 'next/cache': ${JSON.stringify(repo + '/src/tests/next-cache-stub.ts')} } },
}
`)

const started = new Date().toISOString()
const result = spawnSync(`npx vitest run --config "${config}" --reporter=verbose`, {
  encoding: 'utf8', shell: true, maxBuffer: 1 << 28,
  env: { ...process.env, SECURITY_TEST_TARGET: 'development', SECURITY_TEST_PROJECT_REF: ref },
})
fs.rmSync(dir, { recursive: true, force: true })

const redact = (text) => text
  .split(url).join('<url>').split(new URL(url).hostname).join('<host>').split(ref).join('<ref>')
  .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '<jwt>')
const output = redact(`${result.stdout ?? ''}${result.stderr ?? ''}`)
const status = result.status ?? 1
const text = [
  '# r51-04-probe.txt: Task 923 Revision 51, R156, the real changeCabinetPassword on the approved development project',
  `platform: ${process.platform} ${os.release()} ${process.arch}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  'command: node docs/sessions/evidence/task923/r51-04-probe.mjs   (runs: npx vitest run --config <generated, outside the repository> --reporter=verbose, with SECURITY_TEST_TARGET=development and SECURITY_TEST_PROJECT_REF taken from the URL in .env.local; neither is printed)',
  `started: ${started}`,
  '--- output (URL, host, project ref and JWT-shaped strings replaced by placeholders) ---',
  output,
  `--- exit code: ${status} ---`,
].join('\n')
fs.writeFileSync('docs/sessions/evidence/task923/r51-04-probe.txt', text + '\n')
console.log(text)
process.exitCode = status
