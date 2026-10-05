// Task 741 Rev 3g — AC52/AC53 checks over probe-ac52.json (Sonnet). Independent copy of the ladder's item counts.
import { readFileSync, writeFileSync } from 'node:fs'
const D = 'docs/sessions/evidence/task741r3/rev3h/exec/'
const a = JSON.parse(readFileSync(D + 'probe-ac52.json', 'utf8'))
const old = JSON.parse(readFileSync('docs/sessions/evidence/task741r3/rev3g/exec/probe-ac52.json', 'utf8'))
const range = (s, e) => (e < s ? [] : Array.from({ length: e - s + 1 }, (_, i) => s + i))
function full(total, active, sib = 1) { const b = 1; if (sib * 2 + 3 + b * 2 >= total) return range(1, total); const l = Math.max(active - sib, b), r = Math.min(active + sib, total - b); const ld = l > b + 2, rd = r < total - (b + 1); if (!ld && rd) return [...range(1, sib * 2 + b + 2), 'd', ...range(total, total)]; if (ld && !rd) return [...range(1, b), 'd', ...range(total - (b + 1 + 2 * sib), total)]; return [...range(1, b), 'd', ...range(l, r), 'd', ...range(total, total)] }
function asym(total, active, lead, trail) { const p = new Set(); if (lead) p.add(1); p.add(active); if (trail) p.add(total); const s = [...p].sort((x, y) => x - y); const o = []; s.forEach((v, i) => { if (i && v - s[i - 1] > 1) o.push('d'); o.push(v) }); return o }
function fill(total, active, f) { const p = new Set([1, total, active]); let n = 0; for (let st = 1; n < f && st <= total; st++) for (const c of [active + st, active - st]) { if (n >= f) break; if (c < 1 || c > total || p.has(c)) continue; p.add(c); n++ } const s = [...p].sort((x, y) => x - y); const o = []; s.forEach((v, i) => { if (i) { const g = v - s[i - 1]; if (g === 2) o.push(v - 1); else if (g > 2) o.push('d') } o.push(v) }); return o }
const LEVELS = [t => full(...t), t => fill(t[0], t[1], 3), t => fill(t[0], t[1], 2), t => fill(t[0], t[1], 1), t => asym(t[0], t[1], 1, 1), t => asym(t[0], t[1], 1, 0), t => asym(t[0], t[1], 0, 0)]
const ROWS = {
  'mantine-primitives-pagination--in-centered-group': [[3, 1], [10, 1], [50, 25]],
  'mantine-primitives-pagination--default': [[10, 5], [50, 25], [250, 137], [10, 1], [10, 10], [1, 1]],
  'patterns-mantine-listingspagination--default': [[5, 1], [5, 3], [5, 5], [20, 10], [20, 10]],
}
const res = { cells: 0, overflow: [], scrollNotOk: [], focus: { controls: 0, clipped: [], noAncestor: 0, minRoom: Infinity }, level: { checked: 0, bad: [] }, same1024_1440: { checked: 0, diff: [] } }
for (const [k, v] of Object.entries(a)) {
  res.cells++
  if (v.overflow) res.overflow.push(k)
  v.pagers.forEach((p, i) => {
    if (!p.scrollOk) res.scrollNotOk.push(`${k}#${i}`)
    // level check: derive total/active from the visible string
    const nums = p.visible.split(' ').filter(x => /^\d+$/.test(x)).map(Number)
    if (!nums.length || !p.ctrlW) return
  })
  const story = k.split('@')[0]
  if (ROWS[story]) v.pagers.forEach((p, i) => {
    const row = ROWS[story][i]; if (!row) return
    const [t, act] = row
    let chosen = LEVELS.length - 1
    for (let l = 0; l < LEVELS.length; l++) { const n = LEVELS[l]([t, act]).length + 2; if (n * p.ctrlW + (n - 1) * p.gapPx <= p.consumerW) { chosen = l; break } }
    const exp = LEVELS[chosen]([t, act]).map(x => (x === 'd' ? '…' : x)).join(' ')
    const got = p.visible.replace(/[‹›]/g, '').trim().replace(/\s+/g, ' ')
    res.level.checked++
    if (exp !== got) res.level.bad.push(`${k}#${i} (total ${t}, page ${act}): level ${chosen} expects "${exp}", rendered "${got}", budget ${p.consumerW}, ctrl ${p.ctrlW}, gap ${p.gapPx}`)
  })
  for (const f of v.focus ?? []) {
    res.focus.controls++
    if (!f.ancestor) { res.focus.noAncestor++; continue }
    const c = f.clippedPx
    if (c.top + c.bottom + c.left + c.right > 0) res.focus.clipped.push(`${k} ${f.label} ${JSON.stringify(c)}`)
    res.focus.minRoom = Math.min(res.focus.minRoom, ...Object.values(f.roomPx))
  }
  const m = k.match(/@(en|uk)@(1024|1440)$/)
  if (m && old[k]) { res.same1024_1440.checked++; const o = old[k].pagers.map(p => p.visible).join('|'), n = v.pagers.map(p => p.visible).join('|'); if (o !== n) res.same1024_1440.diff.push(`${k}: ${o} -> ${n}`) }
}
writeFileSync(D + 'check-ac52-53.json', JSON.stringify(res, null, 1) + '\n')
console.log(JSON.stringify({ ...res, focus: { ...res.focus, clipped: res.focus.clipped.slice(0, 5) } }, null, 1))
