// Task 927 Amendment 9, AC36 (a9-05): runs docs/sessions/evidence/task927/review-8/rv8-07-mobile-jump.mjs (served on localhost, default mobile emulation, no SB_URL, no FIX_HOST)
// for three states x 320, 390, 639 x en, uk, records every run's raw output and checks, per run:
//  - from the first frame whose btn= is not "-" to the last frame, h has one value;
//  - the run ends with iframes=1 and has a frame with hostKids=1/44 (Google's swap happened).
// The only expected exception is Login's captcha alert (a later rise of 70 px, Review 9 F9): it is reported with its frame, not hidden.
// Usage (repository root): node docs/sessions/evidence/task927/a9/a9-05-matrix.mjs [outfile]
import fs from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

const outFile = process.argv[2] ?? 'docs/sessions/evidence/task927/a9/a9-05a-mobile-jump-matrix.txt'
const STATES = [
  'mantine-primitives-modal--delete-confirm-password~delete-google-ready',
  'patterns-mantine-authsheet--welcome-back',
  'patterns-mantine-authsheet--login',
]
const WIDTHS = [320, 390, 639]
const LOCALES = ['en', 'uk']
const lines = [
  '# a9-05 part 1: rv8-07-mobile-jump.mjs on the fresh build, served on localhost, default mobile emulation (no SB_URL, no FIX_HOST)',
  `platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`,
  'command: node docs/sessions/evidence/task927/review-8/rv8-07-mobile-jump.mjs <state> <width> <locale>', `started: ${new Date().toISOString()}`, '',
]
const env = { ...process.env }
delete env.SB_URL
delete env.FIX_HOST
let runs = 0, problems = 0, exceptions = 0
for (const state of STATES) for (const width of WIDTHS) for (const locale of LOCALES) {
  const result = spawnSync('node', ['docs/sessions/evidence/task927/review-8/rv8-07-mobile-jump.mjs', state, String(width), locale], { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 })
  runs++
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  const frames = out.split('\n').filter((l) => l.startsWith('t=')).map((l) => ({
    raw: l, t: Number(/t=(\d+)/.exec(l)?.[1]), h: Number(/ h=([\d.]+)/.exec(l)?.[1]), btn: /btn=(\S+)/.exec(l)?.[1], iframes: Number(/iframes=(\d+)/.exec(l)?.[1]), hostKids: /hostKids=(\S+)/.exec(l)?.[1],
  }))
  const first = frames.findIndex((f) => f.btn && f.btn !== '-')
  const tail = first >= 0 ? frames.slice(first) : []
  const heights = [...new Set(tail.map((f) => f.h))]
  const swapped = frames.some((f) => f.hostKids?.startsWith('1/44'))
  const endsWithIframe = frames.length > 0 && frames[frames.length - 1].iframes === 1
  const verdict = []
  if (first < 0) verdict.push('no frame with Google\'s button')
  if (heights.length > 1) {
    // Login's captcha alert: a later rise of 70 px, after the button settled
    const rise = Math.max(...heights) - Math.min(...heights)
    if (state.endsWith('authsheet--login') && rise === 70) { exceptions++; verdict.push(`EXCEPTION (Review 9 F9, captcha alert): h ${heights.join(' -> ')} at ${tail.find((f) => f.h === Math.max(...heights))?.raw}`) }
    else verdict.push(`h changes after the button appears: ${heights.join(' -> ')}`)
  }
  if (!swapped) verdict.push('no hostKids=1/44 frame: Google\'s swap did not happen')
  if (!endsWithIframe) verdict.push('the run does not end with iframes=1')
  const bad = verdict.filter((v) => !v.startsWith('EXCEPTION')).length
  if (bad) problems++
  lines.push(`## ${state} ${width} ${locale}: ${bad ? 'FAIL' : 'ok'}${verdict.length ? ' | ' + verdict.join('; ') : ''}`, out, '')
}
lines.push(`runs ${runs}; runs with a problem: ${problems}; reported exceptions (Login captcha alert, F9): ${exceptions}`, `finished: ${new Date().toISOString()}`, `exit code: ${problems ? 1 : 0}`)
fs.writeFileSync(outFile, lines.join('\n') + '\n')
console.log(lines.filter((l) => l.startsWith('## ') || l.startsWith('runs ') || l.startsWith('exit code')).join('\n'))
process.exitCode = problems ? 1 : 0
