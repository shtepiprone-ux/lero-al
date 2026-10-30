// Task 927 Amendment 11, AC42 (a11-01): the greps, each with its expected result. Read-only.
// Usage (repository root): node docs/sessions/evidence/task927/a11/a11-01-greps.mjs
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
const hitsOf = (files, pattern) => files.flatMap(file => fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap((line, index) => (pattern.test(line) ? [`${file.replaceAll('\\', '/')}:${index + 1}: ${line.trim().slice(0, 160)}`] : [])))

let failed = 0
const lines = [`platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, 'command: node docs/sessions/evidence/task927/a11/a11-01-greps.mjs', '']
const report = (label, expected, hits, ok) => {
  if (!ok) failed++
  lines.push(`## ${label}`, `expected: ${expected}`, `hits: ${hits.length}`, ...hits.map(hit => `  ${hit}`), `verdict: ${ok ? 'as expected' : 'NOT as expected'}`, '')
}

const removed = hitsOf(srcFiles, /requestGoogleCredential/)
report('requestGoogleCredential in src/', 'nowhere', removed, removed.length === 0)

const popupLines = fs.readFileSync('src/lib/auth/googlePopup.ts', 'utf8').split(/\r?\n/)
const at = popupLines.findIndex(line => line.startsWith('export function openGoogleAttempt'))
const next = at === -1 ? '' : popupLines[at + 1]
report('the line after `export function openGoogleAttempt` in src/lib/auth/googlePopup.ts', 'contains window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)',
  at === -1 ? [] : [`src/lib/auth/googlePopup.ts:${at + 1}: ${popupLines[at].trim()}`, `src/lib/auth/googlePopup.ts:${at + 2}: ${next.trim()}`],
  at !== -1 && next.includes('window.open(attempt.url, POPUP_NAME, POPUP_FEATURES)'))

const staleMock = hitsOf(['src/modules/auth/components/AuthSheet.banned.security.test.tsx'], /loadGoogleIdentity/)
report('loadGoogleIdentity in src/modules/auth/components/AuthSheet.banned.security.test.tsx', 'nowhere', staleMock, staleMock.length === 0)

lines.push(`exit code: ${failed ? 1 : 0}`)
fs.writeFileSync('docs/sessions/evidence/task927/a11/a11-01-greps.txt', lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(failed ? 1 : 0)
