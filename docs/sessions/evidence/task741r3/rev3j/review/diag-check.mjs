// Task 741 review of Revision 3j (Opus) — GR-11 diagonal check on the executor's own R75 crops.
// For every object/twin crop pair (normal run and --plant run), at DPR 1 and 1.25: flip so the measured corner is
// top-left, take the backdrop at the crop's outer corner pixel and the straight-edge colour 1px inside the top edge just
// past the arc, then read coverage (0 = backdrop, 100 = straight-edge colour) on the diagonal band around the arc
// (pixels (k, k), (k+1, k), (k, k+1) for k = 0 .. ceil(r * dpr)). Reports the object's and the twin's diagonal
// triplet at the arc crossing and the largest object-twin difference on the band, in points.
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const X = 'docs/sessions/evidence/task741r3/rev3j/exec/'
const OUT = 'docs/sessions/evidence/task741r3/rev3j/review/'
const browser = await chromium.launch()
const page = await browser.newPage()
const report = { platform: process.platform, node: process.version, runs: {} }
for (const [run, json, sub] of [['normal', 'corner-twin.json', 'corners'], ['plant', 'corner-twin-plant.json', 'corners-plant']]) {
  const data = JSON.parse(await readFile(X + json, 'utf8'))
  const rows = {}
  for (const [k, rec] of Object.entries(data.objects)) {
    for (const [d, o] of [['1', rec.dpr1], ['1.25', rec.dpr125]]) {
      if (!o?.files) continue
      const dpr = Number(d)
      const corner = o.corner ?? 'tl'
      const [objB64, twinB64] = await Promise.all(o.files.map(async f => (await readFile(X + f)).toString('base64')))
      const res = await page.evaluate(async ([a, t, fx, fy, r, dpr]) => {
        const load = async b64 => {
          const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
          const g = c.getContext('2d'); g.translate(fx ? img.width : 0, fy ? img.height : 0); g.scale(fx ? -1 : 1, fy ? -1 : 1); g.drawImage(img, 0, 0)
          const D = g.getImageData(0, 0, img.width, img.height)
          return (x, y) => { const i = (y * img.width + x) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2]] }
        }
        const A = await load(a), T = await load(t)
        // the shape's corner sits 2 CSS px in from the crop edge (probe clip = cx - 2)
        const o = Math.round(2 * dpr)
        const bg = T(0, 0)
        const edge = T(o + Math.ceil(r) + 2, o)
        const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
        const F = dist(edge, bg) || 1
        const cov = (P, x, y) => Math.round(100 * Math.min(1, dist(P(x, y), bg) / F))
        let maxDiff = 0, at = null
        const band = []
        for (let k = 0; k <= Math.ceil(r); k++) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) {
          const x = o + k + dx, y = o + k + dy
          const ca = cov(A, x, y), ct = cov(T, x, y)
          band.push([k, dx, dy, ca, ct])
          if (Math.abs(ca - ct) > maxDiff) { maxDiff = Math.abs(ca - ct); at = [x - o, y - o] }
        }
        // the arc crosses the diagonal at r(1 - 1/sqrt 2)
        const kc = Math.floor(r * (1 - Math.SQRT1_2))
        const trip = P => [cov(P, o + kc, o + kc + 1), cov(P, o + kc, o + kc), cov(P, o + kc + 1, o + kc)]
        return { F: Math.round(F), triplet: { object: trip(A), twin: trip(T) }, maxDiff, at, kc }
      }, [objB64, twinB64, corner === 'br', corner === 'bl' || corner === 'br', (o.radius ?? 0) * dpr, dpr]).catch(e => ({ error: String(e) }))
      rows[`${k}@${d}`] = { radius: o.radius, corner, effOpacity: o.effOpacity, border: o.border, bg: o.bg, ...res }
    }
  }
  report.runs[run] = rows
}
await browser.close()
await writeFile(OUT + 'diag-check.json', JSON.stringify(report, null, 1) + '\n')
for (const [run, rows] of Object.entries(report.runs)) {
  console.log(`== ${run}`)
  for (const [k, v] of Object.entries(rows)) console.log(k.padEnd(40), v.error ?? `r ${v.radius} F ${v.F} obj ${v.triplet.object.join('/')} twin ${v.triplet.twin.join('/')} maxDiff ${v.maxDiff} at ${v.at}`)
}
