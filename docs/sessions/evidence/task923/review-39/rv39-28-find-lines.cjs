/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 Review 39 (Opus, 2026-10-23): finds, in an Opus session transcript, the numbered Read lines of the pre-R117 CaptchaWidget.tsx that claim rows C1072 and
// C1073 cite. Those lines were changed by R117 and HEAD never held them, so the transcript of Review 38's read is their only retained copy. Read-only.
// Usage: node rv39-28-find-lines.cjs <transcript.jsonl>
const fs = require('fs')
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n')
const needles = ['if (onDemand) widget.execute()', 'setChallengeShown(false); onError?.() }}']
lines.forEach((l, i) => {
  if (!needles.some((n) => l.includes(n))) return
  let o
  try { o = JSON.parse(l) } catch { return }
  const walk = (v) => {
    if (typeof v === 'string') {
      for (const row of v.split('\n')) if (needles.some((n) => row.includes(n)) && /^\s*\d+\t/.test(row)) console.log(i, o.type, o.timestamp, JSON.stringify(row))
    } else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(o)
})
