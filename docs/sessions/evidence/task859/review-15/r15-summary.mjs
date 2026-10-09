// Task 859 review 15 (Opus) - summary of r15-probe.mjs output. usage: node r15-summary.mjs r15-matrix.jsonl
import fs from 'node:fs'
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
const add = (m, k, n = 1) => (m[k] = (m[k] || 0) + n)
const S = { jobs: rows.length, errors: 0, errScreens: 0, stories: new Set(), cardStack: {}, badgeAbove: {}, badgeOdd: {}, cellStack: {}, cellText: {}, inquiry: {}, worklist: {}, names: 0, cut: {}, stressLines: {}, overlap: {}, replaced: 0 }
const offCard = {}, offCell = {}, offInq = {}, cutBy = {}, oddBy = {}, failLines = {}, overlapBy = {}
for (const r of rows) {
  S.stories.add(r.id)
  if (r.error) { S.errors++; continue }
  if (r.err) S.errScreens++
  // a record card is off when any gap != 12 (its rhythm sm); any other card is off when a gap != its own row gap
  for (const [k, n] of Object.entries(r.cardStack)) { add(S.cardStack, k, n); const [kind, rg, g] = k.split('|'); const want = kind === 'record' ? '12' : String(Math.round(parseFloat(rg))); if (g && g.split(',').some(v => v !== want)) add(offCard, `${r.id} ${r.w} ${r.loc} ${k}`, n) }
  for (const [k, n] of Object.entries(r.badgeAbove)) add(S.badgeAbove, k, n)
  for (const [k, n] of Object.entries(r.badgeOdd)) { add(S.badgeOdd, k, n); add(oddBy, `${r.id} :: ${k}`, n) }
  for (const [k, n] of Object.entries(r.cellStack)) { add(S.cellStack, k, n); const g = k.split('|')[1]; if (g.split(',').some(v => v !== '12')) add(offCell, `${r.id} ${r.w} ${r.loc} ${k}`, n) }
  for (const [k, n] of Object.entries(r.cellText)) add(S.cellText, k, n)
  for (const [k, n] of Object.entries(r.inquiry)) { add(S.inquiry, k, n); for (const part of k.split(' ; ')) { const [kind, g] = part.split(':'); if (kind === 'blocks' && g.split(',').some(v => v !== '12')) add(offInq, `${r.id} ${r.w} ${r.loc} ${k}`, n) } }
  for (const [k, n] of Object.entries(r.worklist)) add(S.worklist, k, n)
  S.names += r.names; S.replaced += r.replaced ?? 0
  for (const [k, n] of Object.entries(r.cut)) { add(S.cut, k, n); add(cutBy, `${r.id} ${r.w} ${r.loc} ${k}`, n) }
  for (const [k, n] of Object.entries(r.stressLines ?? {})) { add(S.stressLines, k, n); if (k.endsWith(':FAIL')) add(failLines, `${r.id} ${r.w} ${r.loc}`, n) }
  for (const [k, n] of Object.entries(r.overlap ?? {})) { add(S.overlap, k, n); add(overlapBy, `${r.id} ${r.w} ${r.loc} ${k}`, n) }
}
const top = (m, n = 40) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `  ${v}  ${k}`).join('\n') || '  (none)'
const sum = m => Object.values(m).reduce((a, b) => a + b, 0)
console.log(`jobs ${S.jobs}, Stories ${S.stories.size}, crashed ${S.errors}, error screens ${S.errScreens}`)
console.log(`card top stacks ${sum(S.cardStack)}; distinct (rowGap|gaps):\n${top(S.cardStack, 25)}`)
console.log(`card stacks with a gap != 12: ${sum(offCard)}\n${top(offCard, 20)}`)
console.log(`badge -> nearest leaf above (root:kind:px):\n${top(S.badgeAbove)}`)
console.log(`badges off 12 that are not a wrapped line of their own row: ${sum(S.badgeOdd)}\n${top(oddBy, 40)}`)
console.log(`records-cell stacks holding objects ${sum(S.cellStack)}:\n${top(S.cellStack, 20)}`)
console.log(`records-cell stacks with a gap != 12: ${sum(offCell)}\n${top(offCell, 20)}`)
console.log(`text-only cell stacks (listed, not judged):\n${top(S.cellText, 15)}`)
console.log(`inquiry rows ${sum(S.inquiry)}:\n${top(S.inquiry)}\ninquiry rows with a block gap != 12: ${sum(offInq)}\n${top(offInq, 20)}`)
console.log(`one-link list rows (anchor stacks) ${sum(S.worklist)}:\n${top(S.worklist, 20)}`)
console.log(`name elements ${S.names}; cut ${sum(S.cut)}\n${top(cutBy, 60)}`)
if (S.replaced) console.log(`stress: text nodes replaced ${S.replaced}; lines:\n${top(S.stressLines)}\nneeds-wrap but 1 line: ${sum(failLines)}\n${top(failLines)}\noverlaps ${sum(S.overlap)}\n${top(overlapBy, 40)}`)
