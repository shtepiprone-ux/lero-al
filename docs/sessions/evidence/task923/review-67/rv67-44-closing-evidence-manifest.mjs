// Task 923 Review 67 (Opus): the path manifest of the final commit, narrowed by the owner's decision of 2026-10-29 (translated): "I am not sure that
// screenshots of checks and other graphic materials need to go into git, because in fact they no longer decide anything. Only the facts and proofs that
// finally closed one or another part of the tasks need to go into git."
// Read-only on Git. Starts from rv67-40's rules (no other tasks' evidence, Task 926 leaves the index separately) and keeps a new (untracked) evidence file
// only when a closing document cites it:
//   - an active task document or contract under tasks/ (kickoff ledgers, sidecars, security contracts);
//   - a contract's report and review decision, and every file a report names (sensitivity artifacts, test files);
//   - a session record docs/sessions/*.md, docs/backlog.md, docs/backlog-reserved.md.
// A citation is the full path, a path relative to the citing file's folder, or a bare file name that is unique among the new evidence files.
// Writes rv67-44-closing-evidence-paths.txt and .nul (for `git add --pathspec-from-file=... --pathspec-file-nul` with GIT_LITERAL_PATHSPECS=1), and this output.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, posix } from 'node:path'

const E = 'docs/sessions/evidence/task923/review-67'
const EV = 'docs/sessions/evidence/'
const OTHER = ['docs/sessions/evidence/task859/', 'docs/sessions/evidence/task790/']
const T926 = ['tasks/Sprints/Sprint_78_kickoff_prompt_Task_926_Company_Created_In_The_Cabinet.md', 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_926_Company_Created_In_The_Cabinet.security.json']
const OWN = [`${E}/rv67-44-closing-evidence-manifest.mjs`, `${E}/rv67-44-closing-evidence-manifest.txt`, `${E}/rv67-44-closing-evidence-paths.txt`, `${E}/rv67-44-closing-evidence-paths.nul`]
const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })
const out = [`# rv67-44: the final commit's path manifest, closing evidence only`,
  `platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}; command: node ${E}/rv67-44-closing-evidence-manifest.mjs`,
  `HEAD ${git(['rev-parse', 'HEAD']).trim()}; origin/main ${git(['rev-parse', 'origin/main']).trim()}`]

// every changed path against HEAD: the working tree, as `git status` lists it (renames split, every untracked file)
const raw = git(['status', '--porcelain=v1', '-z', '--untracked-files=all', '--no-renames']).split('\0').filter(Boolean)
const head = new Set(git(['ls-tree', '-r', '--name-only', '-z', 'HEAD']).split('\0').filter(Boolean))
const entries = raw.map((r) => ({ xy: r.slice(0, 2), path: r.slice(3) })).filter((e) => !T926.includes(e.path))
const isNew = (e) => !head.has(e.path) && !e.xy.includes('D')
const newEvidence = new Set(entries.filter((e) => isNew(e) && e.path.startsWith(EV) && !OTHER.some((p) => e.path.startsWith(p)) && !OWN.includes(e.path)).map((e) => e.path))

// closing documents
const walk = (d, keep, acc = []) => { for (const n of readdirSync(d)) { const p = `${d}/${n}`; if (statSync(p).isDirectory()) { if (!/^archive$/i.test(n)) walk(p, keep, acc) } else if (keep(p)) acc.push(p) } return acc }
const roots = new Set([...walk('tasks', (p) => /\.(md|json)$/.test(p) && !T926.includes(p)),
  ...readdirSync('docs/sessions').filter((n) => n.endsWith('.md')).map((n) => `docs/sessions/${n}`),
  'docs/backlog.md', 'docs/backlog-reserved.md'].filter((p) => existsSync(p)))
const contracts = [...roots].filter((p) => p.endsWith('.security.json'))
const contractPaths = []
for (const c of contracts) {
  const j = JSON.parse(readFileSync(c, 'utf8'))
  for (const p of [j.report, j.review?.evidence]) if (p && existsSync(p)) { roots.add(p); contractPaths.push(p) }
  for (const p of j.scope ?? []) if (existsSync(p) && statSync(p).isFile()) contractPaths.push(p)
}
const reportFiles = []
const strings = (v, acc) => { if (typeof v === 'string') acc.push(v); else if (v && typeof v === 'object') for (const x of Object.values(v)) strings(x, acc); return acc }
for (const c of contracts) {
  const r = JSON.parse(readFileSync(c, 'utf8')).report
  if (r && existsSync(r)) for (const s of strings(JSON.parse(readFileSync(r, 'utf8')), [])) if (/^[\w.\-/]+\.\w+$/.test(s) && existsSync(s) && statSync(s).isFile()) reportFiles.push(s)
}

// citations
const names = new Map()
for (const p of newEvidence) names.set(basename(p), names.has(basename(p)) ? null : p)
const cited = new Map()
for (const r of roots) {
  const text = readFileSync(r, 'utf8')
  for (const m of text.matchAll(/[\w.\-/]+\.\w{1,5}/g)) {
    const t = m[0]
    for (const c of [t, posix.join(dirname(r).replaceAll('\\', '/'), t), names.get(basename(t)) && basename(t) === t ? names.get(t) : null]) {
      if (c && newEvidence.has(c) && !cited.has(c)) cited.set(c, r)
    }
  }
}
for (const p of [...contractPaths, ...reportFiles]) if (newEvidence.has(p) && !cited.has(p)) cited.set(p, 'contract or report')

// the manifest: every changed path outside the evidence folders, changed tracked evidence of this push, and the cited new evidence
const include = []
const left = []
for (const e of entries) {
  if (OTHER.some((p) => e.path.startsWith(p))) continue
  if (newEvidence.has(e.path) && !cited.has(e.path)) { left.push(e.path); continue }
  include.push(e)
}
for (const p of OWN) if (!include.some((e) => e.path === p)) include.push({ xy: '??', path: p })
include.sort((a, b) => (a.path < b.path ? -1 : 1))

// what is tracked once the commit is made
const after = new Set(head)
for (const { xy, path } of include) { if (xy.includes('D')) after.delete(path); else after.add(path) }
for (const p of T926) after.delete(p)
const problems = []
const kickoffs = walk('tasks', (p) => /kickoff.*\.md$/i.test(basename(p)) && !T926.includes(p))
const changed = new Set(git(['diff', '--name-only', 'origin/main', '--', 'tasks']).split(/\r?\n/).filter(Boolean))
let sources = 0
let installed = 0
for (const k of kickoffs.filter((k) => changed.has(k))) {
  for (const m of readFileSync(k, 'utf8').matchAll(/source: `([^`]+?):\d+(?:-\d+)?`/g)) {
    sources++
    // CI's static job runs `npm ci` before check:kickoff-evidence, so a cited dependency file is present there
    if (m[1].startsWith('node_modules/') && existsSync(m[1])) { installed++; continue }
    if (!after.has(m[1])) problems.push(`${k} cites ${m[1]}, which is not tracked after the commit`)
  }
}
for (const p of [...contracts, ...contractPaths, ...reportFiles]) if (existsSync(p) && !after.has(p)) problems.push(`a contract or report needs ${p}, which is not tracked after the commit`)

const size = (list) => (list.reduce((a, p) => a + (existsSync(p) ? statSync(p).size : 0), 0) / 1048576).toFixed(1)
const image = (p) => /\.(png|jpe?g|webp|gif|svg|zip)$/i.test(p)
const includedPaths = include.filter((e) => !e.xy.includes('D')).map((e) => e.path)
out.push(`closing documents read: ${roots.size}; contracts ${contracts.length}; files named by reports ${new Set(reportFiles).size}`)
out.push(`new evidence files: ${newEvidence.size} (${size([...newEvidence])} MB); cited, kept: ${cited.size} (${size([...cited.keys()])} MB, images ${[...cited.keys()].filter(image).length}); not cited, left on disk untracked: ${left.length} (${size(left)} MB, images ${left.filter(image).length})`)
out.push(`kickoff sources checked: ${sources}, of them ${installed} under node_modules/ (installed by npm ci)`)
out.push(`included: ${include.length} paths (${include.filter((e) => e.xy.includes('D')).length} deletions); ${size(includedPaths)} MB`)
for (const p of [...cited.keys()].filter(image)) out.push(`  cited image kept: ${p} (cited by ${cited.get(p)})`)
out.push(`Task 926 leaves the index (git rm --cached): ${T926.join(', ')}`)
out.push(`problems: ${problems.length}`, ...problems.slice(0, 40).map((p) => `  ${p}`))
writeFileSync(OWN[2], include.map((e) => e.path).join('\n') + '\n')
writeFileSync(OWN[3], include.map((e) => e.path).join('\0') + '\0')
out.push(`exit ${problems.length ? 1 : 0}`)
writeFileSync(OWN[1], out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = problems.length ? 1 : 0
