// Checks probe-states.json against the AC39 expectations (en badge texts; uk checked structurally + vs clock pass).
import fs from 'node:fs'
const j = JSON.parse(fs.readFileSync(process.argv[2] ?? new URL('./probe-states.json', import.meta.url), 'utf8'))
const EN = [['New'], [], ['New', 'Price reduced'], [], ['Inactive'], ['Under review'], ['Sold'], ['Rented'], ['Archived'], ['Expired'], []]
const OVERLAY = [false, false, false, false, false, false, true, true, false, false, false]
const fails = []
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
for (const [pass, stories] of Object.entries(j.passes)) {
  for (const [id, cells] of Object.entries(stories)) {
    for (const [cell, s] of Object.entries(cells)) {
      const [loc, w] = cell.split('@'); const W = Number(w)
      const tag = `${pass} ${id} ${cell}`
      if (s.gridCount !== 11) fails.push(`${tag}: grid count ${s.gridCount}`)
      if (s.overflow) fails.push(`${tag}: horizontal overflow`)
      if (loc === 'en') s.gridCards.forEach((c, i) => { if (!eq(c.badges, EN[i])) fails.push(`${tag}: card ${i + 1} badges ${JSON.stringify(c.badges)} != ${JSON.stringify(EN[i])}`) })
      s.gridCards.forEach((c, i) => {
        if (c.overlay !== OVERLAY[i]) fails.push(`${tag}: card ${i + 1} overlay ${c.overlay}`)
        if ((i === 8) !== c.dimmed) fails.push(`${tag}: card ${i + 1} dimmed ${c.dimmed}`)
        if ((i === 10) !== c.placeholder) fails.push(`${tag}: card ${i + 1} placeholder ${c.placeholder}`)
      })
      if (W < 640) { if (s.listVisible) fails.push(`${tag}: list visible below 640`) }
      else {
        if (!s.listVisible || s.listCards !== 11) fails.push(`${tag}: list visible=${s.listVisible} cards=${s.listCards}`)
        if (s.listOverlays !== 0) fails.push(`${tag}: list overlays ${s.listOverlays}`)
        if (loc === 'en') s.listBadges.forEach((b, i) => { if (!eq(b, EN[i])) fails.push(`${tag}: list card ${i + 1} badges ${JSON.stringify(b)}`) })
      }
    }
  }
}
// R3c AC41: the pattern Story shows the same badge texts as the primitive Story (production getBadges), card by card
const PRIM = 'mantine-primitives-listingcard--default', PAT = 'patterns-mantine-listingcardpattern--default'
for (const [pass, stories] of Object.entries(j.passes)) {
  const a = stories[PRIM] ?? {}, b = stories[PAT] ?? {}
  for (const cell of Object.keys(a)) {
    if (!b[cell]) { fails.push(`${pass} ${cell}: pattern cell missing`); continue }
    a[cell].gridCards.forEach((c, i) => { if (!eq(c.badges, b[cell].gridCards[i]?.badges)) fails.push(`parity ${pass} ${cell}: grid card ${i + 1} primitive ${JSON.stringify(c.badges)} != pattern ${JSON.stringify(b[cell].gridCards[i]?.badges)}`) })
    if (a[cell].listVisible) a[cell].listBadges.forEach((x, i) => { if (!eq(x, b[cell].listBadges[i])) fails.push(`parity ${pass} ${cell}: list card ${i + 1} primitive ${JSON.stringify(x)} != pattern ${JSON.stringify(b[cell].listBadges[i])}`) })
  }
}
// clock independence: pass B equals pass A for every cell
const A = j.passes.A_real_clock, B = j.passes['B_clock_2027-03-01']
for (const id of Object.keys(A)) for (const cell of Object.keys(A[id])) {
  const a = A[id][cell], b = B[id][cell]
  if (!eq(a.gridCards.map(c => c.badges), b.gridCards.map(c => c.badges)) || !eq(a.listBadges, b.listBadges)) fails.push(`clock: ${id} ${cell} badge texts differ between passes`)
}
console.log(fails.length ? 'FAILS (' + fails.length + '):\n' + fails.join('\n') : 'AC39 OK: all cells match')
const sample = A['mantine-primitives-listingcard--default']['uk@1440']
console.log('uk@1440 primitive grid badges:', JSON.stringify(sample.gridCards.map(c => c.badges)))
process.exit(fails.length ? 1 : 0)
