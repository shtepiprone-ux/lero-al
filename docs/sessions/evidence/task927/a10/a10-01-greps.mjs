// Task 927 Amendment 10, AC38 (a10-01): the greps, each with its expected result. Read-only.
// Usage (repository root): node docs/sessions/evidence/task927/a10/a10-01-greps.mjs
// `FavoriteButton.test.tsx` defines a local helper named `renderButton` (kickoff §21 readiness: "a local helper, not Google's"); it is the one expected hit of that word and is listed, not hidden.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx|js|jsx|mjs|json|css)$/.test(entry.name)) out.push(full)
  }
  return out
}
const srcFiles = walk('src')
const hitsOf = (files, pattern) => files.flatMap(file => fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line, index) => (pattern.test(line) ? [`${file.replaceAll('\\', '/')}:${index + 1}: ${line.trim().slice(0, 140)}`] : [])))

let failed = 0
const lines = [`platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, 'command: node docs/sessions/evidence/task927/a10/a10-01-greps.mjs', '']
const report = (label, expected, hits, ok) => {
  if (!ok) failed++
  lines.push(`## ${label}`, `expected: ${expected}`, `hits: ${hits.length}`, ...hits.map(hit => `  ${hit}`), `verdict: ${ok ? 'as expected' : 'NOT as expected'}`, '')
}

for (const term of ['google_loading', 'googleButton', 'GoogleSignInSlot status="loading"']) {
  const hits = hitsOf(srcFiles, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  report(`${term} in src/`, 'nowhere', hits, hits.length === 0)
}
const renderButtonHits = hitsOf(srcFiles, /renderButton/)
report('renderButton in src/', 'nowhere, except the local helper of FavoriteButton.test.tsx (not Google\'s)', renderButtonHits, renderButtonHits.every(hit => hit.startsWith('src/modules/listings/components/__tests__/FavoriteButton.test.tsx:')))
const registryHits = hitsOf(['scripts/rendered-interaction-states.json'], /nsm7Bb/)
report('nsm7Bb in scripts/rendered-interaction-states.json', 'nowhere', registryHits, registryHits.length === 0)
for (const locale of ['sq', 'en', 'uk', 'it']) {
  const file = `messages/${locale}.json`
  const hits = ['google_sign_in', 'google_popup_blocked', 'google_failed'].flatMap(key => hitsOf([file], new RegExp(`"${key}"`)))
  report(`google_sign_in, google_popup_blocked, google_failed in ${file}`, 'three keys', hits, hits.length === 3)
}
const dataHits = hitsOf(['src/components/auth/GoogleSignInSlot.tsx'], /data-google-sign-in/)
report('data-google-sign-in in src/components/auth/GoogleSignInSlot.tsx', 'present', dataHits, dataHits.length >= 1)

lines.push(`exit code: ${failed ? 1 : 0}`)
fs.writeFileSync('docs/sessions/evidence/task927/a10/a10-01-greps.txt', lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(failed ? 1 : 0)
