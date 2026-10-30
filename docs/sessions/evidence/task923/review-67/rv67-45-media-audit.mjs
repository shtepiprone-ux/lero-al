// Task 923 Review 67 (Opus): read-only audit of the media and sizes in the unpushed commits (origin/main..HEAD) and in the rv67-44 list,
// after the owner's decision of 2026-10-30 (translated): "push to git only the necessary final proofs, if they are needed there at all; the
// screenshot/image files we will not push, because they carry no value by themselves."
import { execFileSync } from 'node:child_process'
import { existsSync, statSync, readFileSync } from 'node:fs'
const git = (a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 })
const added = git(['diff', '--name-only', '-z', '--diff-filter=A', 'origin/main', 'HEAD']).split('\0').filter(Boolean)
const p44 = readFileSync('docs/sessions/evidence/task923/review-67/rv67-44-closing-evidence-paths.txt', 'utf8').split(/\r?\n/).filter(Boolean)
const sz = (p) => (existsSync(p) && statSync(p).isFile() ? statSync(p).size : 0)
const MB = (n) => (n / 1048576).toFixed(1)
const img = /\.(png|jpe?g|webp|gif|bmp|avif|svg|zip|webm|mp4)$/i
const sum = (l) => l.reduce((a, p) => a + sz(p), 0)
console.log('committed, unpushed, added:', added.length, MB(sum(added)), 'MB; media:', added.filter((p) => img.test(p)).length, MB(sum(added.filter((p) => img.test(p)))), 'MB')
console.log('rv67-44 list:', p44.length, MB(sum(p44)), 'MB; media:', p44.filter((p) => img.test(p)).length)
const big = [...new Set([...added, ...p44])].map((p) => [sz(p), p]).sort((a, b) => b[0] - a[0]).slice(0, 15)
for (const [s, p] of big) console.log(' ', MB(s), p)
const tracked = git(['ls-files', 'tasks']).split(/\r?\n/)
const srcs = new Set()
for (const k of tracked.filter((p) => /kickoff.*\.md$/i.test(p))) if (existsSync(k)) for (const m of readFileSync(k, 'utf8').matchAll(/source: `([^`]+?):\d+(?:-\d+)?`/g)) srcs.add(m[1])
const media = [...new Set([...added, ...p44])].filter((p) => img.test(p))
console.log('media cited as a kickoff source:', media.filter((p) => srcs.has(p)))
let hits = 0
for (const c of tracked.filter((p) => p.endsWith('.security.json'))) { const t = readFileSync(c, 'utf8'); for (const p of media) if (t.includes(p)) { hits++; console.log('  contract', c, 'names', p) } }
console.log('media named by contracts:', hits)
