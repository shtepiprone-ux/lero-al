/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R114 (d): runs the integration files of the contact gateway against the approved development project and saves the unpiped transcript. The project ref is
// derived from the host of NEXT_PUBLIC_SUPABASE_URL in .env.local (as in r10-81) and is NEVER printed; only its length is. Cloudflare's published test secrets are set
// by the test itself, never the project's secret. Usage: node docs/sessions/evidence/task923/r33-04-integration-run.cjs <out-file>
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const out = process.argv[2]
const line = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('NEXT_PUBLIC_SUPABASE_URL='))
if (!line) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not in .env.local')
const host = new URL(line.slice('NEXT_PUBLIC_SUPABASE_URL='.length).replace(/^"|"$/g, '')).hostname
if (!host.endsWith('.supabase.co')) throw new Error('the configured URL is not a hosted *.supabase.co project')
const ref = host.slice(0, -'.supabase.co'.length)

const files = ['src/tests/integration/contactGateway.integration.test.ts', 'src/modules/listings/actions/contactSession.integration.test.ts']
const command = `npx vitest run --config vitest.integration.config.ts ${files.join(' ')}`
const started = new Date().toISOString()
const run = spawnSync(command, { cwd: process.cwd(), shell: true, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 1_700_000, env: { ...process.env, SECURITY_TEST_TARGET: 'development', SECURITY_TEST_PROJECT_REF: ref } })
const body = `${run.stdout ?? ''}${run.stderr ?? ''}`.split(ref).join('<ref>')
const header = `platform: ${process.platform} ${process.arch}\nnode: ${process.version}\ncwd: ${process.cwd()}\nstarted: ${started}\nenvironment: SECURITY_TEST_TARGET=development; SECURITY_TEST_PROJECT_REF derived from the host of NEXT_PUBLIC_SUPABASE_URL in .env.local (ref length ${ref.length}, value not printed)\ncommand: ${command}\n---- output ----\n`
fs.writeFileSync(out, `${header}${body}\n---- end ----\nEXIT_CODE=${run.status}\n`)
console.log(`${out}: EXIT_CODE=${run.status}`)
