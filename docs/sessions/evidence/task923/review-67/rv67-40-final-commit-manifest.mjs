// Task 923 Review 67 (Opus): the path manifest of the one final commit (kickoff §80.3 step 5; owner decision of 2026-10-29: "without the raw files").
// Read-only on Git. Writes rv67-40-final-commit-paths.txt (one path per line, for reading) and rv67-40-final-commit-paths.nul (NUL-separated, for
// `git --literal-pathspecs add --pathspec-from-file=... --pathspec-file-nul`), and this output file.
// Included: every changed or deleted tracked path and every untracked path of `git status`, except
//   (a) an untracked file larger than 5 MB that no active kickoff cites (the raw run files; they stay on disk, untracked);
//   (b) every path under docs/sessions/evidence/task859/ and docs/sessions/evidence/task790/ (other tasks' evidence, not this push).
// Task 926's kickoff and sidecar leave the index by a separate `git rm --cached` of the owner's command; they are not in this manifest.
// Checks: every source a changed active kickoff cites, and every existing path, report and review evidence of every active contract, is tracked after the commit.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const E = 'docs/sessions/evidence/task923/review-67'
const BIG = 5 * 1024 * 1024
const OTHER = ['docs/sessions/evidence/task859/', 'docs/sessions/evidence/task790/']
const T926 = ['tasks/Sprints/Sprint_78_kickoff_prompt_Task_926_Company_Created_In_The_Cabinet.md', 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_926_Company_Created_In_The_Cabinet.security.json']
const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })
const out = [`# rv67-40: the final commit's path manifest`, `platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}; command: node ${E}/rv67-40-final-commit-manifest.mjs`,
  `HEAD ${git(['rev-parse', 'HEAD']).trim()}; origin/main ${git(['rev-parse', 'origin/main']).trim()}`]

// git status, NUL-separated, every untracked file listed
const raw = git(['status', '--porcelain=v1', '-z', '--untracked-files=all']).split('\0').filter(Boolean)
const entries = []
for (let i = 0; i < raw.length; i++) {
  const xy = raw[i].slice(0, 2)
  const path = raw[i].slice(3)
  if (xy[0] === 'R' || xy[0] === 'C') i++   // a rename carries its source as the next entry
  entries.push({ xy, path })
}
const kickoffs = []
const walk = (d) => { for (const n of readdirSync(d)) { const p = `${d}/${n}`; if (statSync(p).isDirectory()) { if (n !== 'Archive' && n !== 'archive') walk(p) } else if (/kickoff.*\.md$/i.test(n)) kickoffs.push(p) } }
walk('tasks')
const kickoffText = kickoffs.map((k) => readFileSync(k, 'utf8')).join('\n')
const include = []
const excluded = []
for (const { xy, path } of entries) {
  if (OTHER.some((p) => path.startsWith(p))) { excluded.push(['other task', path]); continue }
  if (xy === '??') {
    const size = statSync(path).size
    if (size > BIG && !kickoffText.includes(path)) { excluded.push([`raw ${(size / 1048576).toFixed(1)} MB`, path]); continue }
  }
  include.push({ xy, path })
}
const manifestTxt = `${E}/rv67-40-final-commit-paths.txt`
const manifestNul = `${E}/rv67-40-final-commit-paths.nul`
for (const p of [manifestTxt, manifestNul, `${E}/rv67-40-final-commit-manifest.txt`]) if (!include.some((e) => e.path === p)) include.push({ xy: '??', path: p })
include.sort((a, b) => (a.path < b.path ? -1 : 1))

// what is tracked once the commit is made
const head = new Set(git(['ls-tree', '-r', '--name-only', '-z', 'HEAD']).split('\0').filter(Boolean))
const after = new Set(head)
for (const { xy, path } of include) { if (xy.includes('D')) after.delete(path); else after.add(path) }
for (const p of T926) after.delete(p)
const problems = []

// (1) every source cited by an active kickoff that changes in this push (Task 926's leaves the index)
const changedKickoffs = new Set(git(['diff', '--name-only', 'origin/main', '--', 'tasks']).split(/\r?\n/).filter(Boolean))
for (const { path } of include) if (path.startsWith('tasks/')) changedKickoffs.add(path)
let cited = 0
let installed = 0
for (const k of kickoffs.filter((k) => changedKickoffs.has(k) && !T926.includes(k))) {
  for (const m of readFileSync(k, 'utf8').matchAll(/source: `([^`]+?):\d+(?:-\d+)?`/g)) {
    cited++
    // CI's static job runs `npm ci` before check:kickoff-evidence (.github/workflows/governance-pr.yml), so a cited dependency file is present there
    if (m[1].startsWith('node_modules/') && existsSync(m[1])) { installed++; continue }
    if (!after.has(m[1])) problems.push(`kickoff ${k} cites ${m[1]}, which is not tracked after the commit`)
  }
}
out.push(`changed active kickoffs checked: ${[...changedKickoffs].filter((k) => kickoffs.includes(k) && !T926.includes(k)).length}; cited sources checked: ${cited}, of them ${installed} under node_modules/ (installed by npm ci)`)

// (2) every active contract's existing scope paths, report and review evidence
const contracts = []
const walkJson = (d) => { for (const n of readdirSync(d)) { const p = `${d}/${n}`; if (statSync(p).isDirectory()) { if (n !== 'Archive' && n !== 'archive') walkJson(p) } else if (n.endsWith('.security.json')) contracts.push(p) } }
walkJson('tasks')
for (const c of contracts.filter((c) => !T926.includes(c))) {
  const j = JSON.parse(readFileSync(c, 'utf8'))
  const need = [c, j.task, j.report, j.review?.evidence, ...(j.scope ?? []).filter((p) => existsSync(p) && statSync(p).isFile())].filter(Boolean)
  const missing = need.filter((p) => existsSync(p) && !after.has(p))
  out.push(`${c}: stage ${j.stage}; ${need.length} paths checked; not tracked after the commit ${missing.length}`)
  for (const p of missing) problems.push(`${c} needs ${p}, which is not tracked after the commit`)
}

// (3) sizes and the exclusions
let bytes = 0
let largest = ['', 0]
for (const { xy, path } of include) if (!xy.includes('D') && existsSync(path)) { const s = statSync(path).size; bytes += s; if (s > largest[1]) largest = [path, s] }
out.push(`included: ${include.length} paths (${include.filter((e) => e.xy === '??').length} untracked, ${include.filter((e) => e.xy.includes('M')).length} modified, ${include.filter((e) => e.xy.includes('D')).length} deleted); ${(bytes / 1048576).toFixed(1)} MB; largest ${largest[0]} ${(largest[1] / 1048576).toFixed(1)} MB`)
out.push(`excluded: ${excluded.length} paths (raw ${excluded.filter((e) => e[0].startsWith('raw')).length}, other tasks ${excluded.filter((e) => e[0] === 'other task').length})`)
for (const [why, p] of excluded.filter((e) => e[0].startsWith('raw'))) out.push(`  ${why}  ${p}`)
out.push(`  other tasks: ${excluded.filter((e) => e[0] === 'other task').length} paths under ${OTHER.join(', ')}`)
out.push(`Task 926 leaves the index (git rm --cached): ${T926.join(', ')}`)
out.push(`problems: ${problems.length}`, ...problems.slice(0, 40).map((p) => `  ${p}`))
writeFileSync(manifestTxt, include.map((e) => e.path).join('\n') + '\n')
writeFileSync(manifestNul, include.map((e) => e.path).join('\0') + '\0')
out.push(`exit ${problems.length ? 1 : 0}`)
writeFileSync(`${E}/rv67-40-final-commit-manifest.txt`, out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = problems.length ? 1 : 0
