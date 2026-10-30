// Task 923 Review 67 (Opus): the path manifest of the one squashed commit on origin/main, after the owner's decisions of 2026-10-30 (translated):
// "push to git only the necessary final proofs, if they are needed there at all; the screenshot/image files we will not push, because they carry
// no value by themselves", and the answer "One commit": the 107 unpushed commits and the final commit become one commit, without media.
// Read-only on Git. The owner runs `git reset -q origin/main` (HEAD and index = origin/main, working tree untouched), then stages this list.
// Rules, for every path whose working-tree state differs from origin/main (tracked changes and untracked, non-ignored files):
//   - other tasks' evidence (task859/, task790/), Task 926's kickoff and sidecar, .playwright-mcp/ and debug.log: left out (stay on disk);
//   - media (image, video, zip) outside public/ and src/: left out;
//   - an evidence file under docs/sessions/evidence/ that origin/main does not track: kept only when a closing document cites it (rv67-44's rule);
//   - every other change: kept.
// Writes rv67-46-squash-paths.txt and .nul (for `git add --pathspec-from-file=... --pathspec-file-nul` with GIT_LITERAL_PATHSPECS=1), and this output.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, posix } from 'node:path'

const E = 'docs/sessions/evidence/task923/review-67'
const EV = 'docs/sessions/evidence/'
const OTHER = ['docs/sessions/evidence/task859/', 'docs/sessions/evidence/task790/']
const JUNK = (p) => p.startsWith('.playwright-mcp/') || p === 'debug.log'
const T926 = ['tasks/Sprints/Sprint_78_kickoff_prompt_Task_926_Company_Created_In_The_Cabinet.md', 'tasks/Sprints/Sprint_78_kickoff_prompt_Task_926_Company_Created_In_The_Cabinet.security.json']
const MEDIA = (p) => /\.(png|jpe?g|webp|gif|bmp|avif|svg|ico|zip|webm|mp4|mov)$/i.test(p) && !p.startsWith('public/') && !p.startsWith('src/')
const OWN = [`${E}/rv67-46-squash-manifest.mjs`, `${E}/rv67-46-squash-manifest.txt`, `${E}/rv67-46-squash-paths.txt`, `${E}/rv67-46-squash-paths.nul`]
const git = (args, input) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28, input })
const out = [`# rv67-46: the one squashed commit on origin/main, closing evidence only, no media`,
  `platform ${process.platform} ${process.arch}; node ${process.version}; cwd ${process.cwd()}; command: node ${E}/rv67-46-squash-manifest.mjs`,
  `HEAD ${git(['rev-parse', 'HEAD']).trim()}; origin/main ${git(['rev-parse', 'origin/main']).trim()}`]

// the outputs exist before they are listed, so `git add` finds them
for (const p of OWN.slice(1)) if (!existsSync(p)) writeFileSync(p, '')
const base = new Set(git(['ls-tree', '-r', '--name-only', '-z', 'origin/main']).split('\0').filter(Boolean))
// tracked differences between the working tree and origin/main (index paths and origin/main paths), and untracked non-ignored files
const nz = git(['diff', '--name-status', '-z', '--no-renames', 'origin/main']).split('\0').filter(Boolean)
const changes = []
for (let i = 0; i < nz.length; i += 2) changes.push({ st: nz[i], path: nz[i + 1] })
const seen = new Set(changes.map((c) => c.path))
for (const p of git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean)) if (!seen.has(p)) changes.push({ st: '?', path: p })
for (const p of OWN) if (!changes.some((c) => c.path === p)) changes.push({ st: '?', path: p })

const newEvidence = new Set(changes.filter((c) => c.st !== 'D' && !base.has(c.path) && c.path.startsWith(EV) && !OTHER.some((o) => c.path.startsWith(o)) && !MEDIA(c.path) && !OWN.includes(c.path)).map((c) => c.path))

// closing documents and citations (rv67-44's rule)
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

// classify
const include = []
const left = { other: [], t926: [], junk: [], media: [], uncited: [] }
for (const c of changes) {
  const p = c.path
  if (OWN.includes(p)) { include.push(c); continue }
  if (OTHER.some((o) => p.startsWith(o))) left.other.push(p)
  else if (T926.includes(p)) left.t926.push(p)
  else if (JUNK(p)) left.junk.push(p)
  else if (c.st !== 'D' && !base.has(p) && MEDIA(p)) left.media.push(p)
  else if (newEvidence.has(p) && !cited.has(p)) left.uncited.push(p)
  else include.push(c)
}
include.sort((a, b) => (a.path < b.path ? -1 : 1))
// paths origin/main tracks that must leave the index but stay on disk
const untrack = [...left.t926, ...left.junk].filter((p) => base.has(p))

// what is tracked after the commit
const after = new Set(base)
for (const { st, path } of include) { if (st === 'D') after.delete(path); else after.add(path) }
for (const p of untrack) after.delete(p)
const problems = []
// CI's check:kickoff-evidence verifies only kickoffs changed against origin/main (scripts/check-kickoff-evidence.mjs:265); an unchanged kickoff's stale citation is a note
const changedPaths = new Set(changes.map((c) => c.path))
const notes = []
let sources = 0
let installed = 0
for (const k of walk('tasks', (p) => /kickoff.*\.md$/i.test(basename(p)) && !T926.includes(p)).filter((k) => after.has(k))) {
  for (const m of readFileSync(k, 'utf8').matchAll(/source: `([^`]+?):\d+(?:-\d+)?`/g)) {
    sources++
    if (m[1].startsWith('node_modules/') && existsSync(m[1])) { installed++; continue }
    if (!after.has(m[1])) (changedPaths.has(k) ? problems : notes).push(`${k} cites ${m[1]}, which is not tracked after the commit`)
  }
}
for (const p of [...contracts, ...contractPaths, ...reportFiles]) if (existsSync(p) && !after.has(p)) problems.push(`a contract or report needs ${p}, which is not tracked after the commit`)
const addPaths = include.filter((c) => c.st !== 'D').map((c) => c.path)
// check-ignore exits 1 when no path is ignored
const checkIgnore = (list) => { try { return git(['check-ignore', '--no-index', '--stdin', '-z'], list.join('\0') + '\0') } catch (e) { if (e.status === 1) return ''; throw e } }
const ignored = addPaths.length ? checkIgnore(addPaths).split('\0').filter(Boolean) : []
for (const p of ignored) problems.push(`${p} is ignored by .gitignore; git add would refuse it`)
for (const p of addPaths) if (!existsSync(p)) problems.push(`${p} is listed for add but is missing on disk`)
const allAfterMedia = [...after].filter(MEDIA).filter((p) => !base.has(p))
for (const p of allAfterMedia) problems.push(`media would be committed: ${p}`)

const size = (list) => (list.reduce((a, p) => a + (existsSync(p) && statSync(p).isFile() ? statSync(p).size : 0), 0) / 1048576).toFixed(1)
out.push(`changed against origin/main: ${changes.length}; closing documents read: ${roots.size}; contracts ${contracts.length}; files named by reports ${new Set(reportFiles).size}`)
out.push(`new evidence (non-media): ${newEvidence.size} (${size([...newEvidence])} MB); cited, kept: ${cited.size} (${size([...cited.keys()])} MB)`)
out.push(`left out, stay on disk: other tasks' evidence ${left.other.length}; Task 926 ${left.t926.length}; .playwright-mcp/debug.log ${left.junk.length}; media ${left.media.length} (${size(left.media)} MB); uncited evidence ${left.uncited.length} (${size(left.uncited)} MB)`)
out.push(`included: ${include.length} paths (${include.filter((c) => c.st === 'D').length} deletions); ${size(addPaths)} MB`)
out.push(`untrack (git rm --cached, stay on disk): ${untrack.length ? untrack.join(', ') : 'none'}`)
// committed in the 107 local commits, but not in the squashed commit: they become untracked and stay on disk
const headTracked = git(['ls-tree', '-r', '--name-only', '-z', 'HEAD']).split('\0').filter(Boolean)
const dropped = headTracked.filter((p) => !after.has(p) && existsSync(p))
const dk = (p) => (MEDIA(p) ? 'media' : OTHER.some((o) => p.startsWith(o)) ? 'other tasks' : JUNK(p) ? 'junk' : T926.includes(p) ? 'Task 926' : 'uncited evidence')
const dc = {}
for (const p of dropped) dc[dk(p)] = (dc[dk(p)] ?? 0) + 1
out.push(`committed locally, left out of the squashed commit (stay on disk, untracked): ${dropped.length} (${size(dropped)} MB) ${JSON.stringify(dc)}`)
out.push(`kickoff sources checked: ${sources}, of them ${installed} under node_modules/ (installed by npm ci)`)
const big = addPaths.map((p) => [statSync(p).size, p]).sort((a, b) => b[0] - a[0]).slice(0, 5)
for (const [s, p] of big) out.push(`  largest kept: ${(s / 1048576).toFixed(1)} MB ${p} (cited by ${cited.get(p) ?? 'not new evidence'})`)
out.push(`notes (unchanged kickoffs, not checked by CI): ${notes.length}`, ...notes.map((p) => `  ${p}`))
out.push(`problems: ${problems.length}`, ...problems.slice(0, 40).map((p) => `  ${p}`))
writeFileSync(OWN[2], include.map((c) => c.path).join('\n') + '\n')
writeFileSync(OWN[3], include.map((c) => c.path).join('\0') + '\0')
out.push(`exit ${problems.length ? 1 : 0}`)
writeFileSync(OWN[1], out.join('\n') + '\n')
console.log(out.join('\n'))
process.exitCode = problems.length ? 1 : 0
