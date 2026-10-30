// Task 927 Review 6: Opus's independent checks of Amendment 6 (R29, AC28), with platform, Node, cwd, command, output and exit code.
// Read-only: it writes only its own output file (argv[2]).
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import os from 'node:os'

const out = process.argv[2]
const lines = [
  '# rv6-01: Task 927 Review 6, independent checks',
  `platform: ${process.platform} ${os.release()}`,
  `node: ${process.version}`,
  `cwd: ${process.cwd()}`,
  `date: ${new Date().toISOString()}`,
  '',
]
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex')

lines.push('## sha256 of the reviewed paths')
for (const p of ['messages/uk.json', 'scripts/__tests__/check-stories.test.ts', 'scripts/check-stories.mjs']) {
  lines.push(`${sha(p)}  ${p}`)
}

// The pre-edit state of the uk file, rebuilt by putting the Cyrillic value back: it must equal a6-00's before-hash.
const bullets = '•'.repeat(5)
const uk = readFileSync('messages/uk.json', 'utf8')
const cur = `"google_welcome_demo_email": "ar${bullets}@example.com"`
lines.push('', '## uk: one value changed', `occurrences of the new value: ${uk.split(cur).length - 1}`)
const before = uk.replace(cur, `"google_welcome_demo_email": "ар${bullets}@example.com"`)
lines.push(
  `rebuilt pre-edit sha256: ${createHash('sha256').update(before, 'utf8').digest('hex')}`,
  'a6-00 before-hash:      b452e6c9a465322e2ed9a31487d5e1e97e397d3c044137e84d4141bef82ea767',
)

// Does each new test depend on the masked-address pattern? Checked in memory, without a gate copy.
const src = readFileSync('scripts/check-stories.mjs', 'utf8')
const pats = eval(src.match(/const LATIN_ALLOWLIST_PATTERNS = (\[[\s\S]*?\n  \]);/)[1])
const masked = pats.find((p) => p.source.includes('•'))
const without = pats.filter((p) => p !== masked)
lines.push('', '## the Check 8 allowlist with and without the masked-address pattern (Review 4)')
for (const v of [`ar${bullets}@example.com`, `a${bullets}@example.com`, `Arta${bullets}`, `arta${bullets}@`]) {
  lines.push(`${JSON.stringify(v)} allowed with: ${pats.some((p) => p.test(v))}; without: ${without.some((p) => p.test(v))}`)
}

const run = (cmd) => {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  lines.push('', `command: ${cmd}`, '--- output ---', ((r.stdout ?? '') + (r.stderr ?? '')).trimEnd(), `--- exit code: ${r.status} ---`)
}
run('npx vitest run --reporter=verbose scripts/__tests__/check-stories.test.ts')
run('npm run check:stories')
run('npm run check:i18n')
run('node scripts/check-rendered-state-census.mjs --stories patterns-mantine-googlewelcomeback--initials,patterns-mantine-googlewelcomeback--long-name,patterns-mantine-authsheet--welcome-back')
run('node scripts/workflow-gates/cli.mjs plan --contract tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json')

writeFileSync(out, lines.join('\n') + '\n')
