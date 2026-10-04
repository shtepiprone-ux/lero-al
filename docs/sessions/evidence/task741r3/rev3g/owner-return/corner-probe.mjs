// Task 741 — owner return of O46-3 rows 3–4 (2026-10-04: "кути не скруглені, а багатогранні"). Opus diagnosis probe.
// For the paginator controls in Mantine/Primitives/Pagination InCenteredGroup at 390 and 1440, at deviceScaleFactor
// 1, 1.25, 1.5 and 2: computed corner chrome (radius, border, box-shadow, outline, clip-path, transform, size), and a
// crop of one active, one inactive and one edge control at rest, plus the focused active control, each scaled 10×.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'docs/sessions/evidence/task741r3/rev3g/owner-return/'
await mkdir(OUT + 'crops', { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
const out = {}
for (const w of [390, 1440]) for (const dpr of [1, 1.25, 1.5, 2]) {
  const page = await browser.newPage({ viewport: { width: w, height: 700 }, deviceScaleFactor: dpr })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=mantine-primitives-pagination--in-centered-group&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Pagination-control', { timeout: 15000 })
  await page.waitForTimeout(1500)
  const key = `${w}@${dpr}`
  out[key] = await page.evaluate(() => {
    const row = document.querySelectorAll('.mantine-Pagination-root')[1].firstElementChild
    const ctrls = [...row.children].filter(c => getComputedStyle(c).position !== 'fixed')
    const pick = { edge: ctrls[0], active: ctrls.find(c => c.hasAttribute('data-active')), inactive: ctrls.find(c => !c.hasAttribute('data-active') && c.classList.contains('mantine-Pagination-control') && !c.classList.contains('mantine-Pagination-edgeControl')) }
    const r = {}
    for (const [n, el] of Object.entries(pick)) {
      const s = getComputedStyle(el), q = el.getBoundingClientRect()
      el.setAttribute('data-probe', n)
      r[n] = { w: q.width, h: q.height, x: q.x, y: q.y, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, bg: s.backgroundColor, boxShadow: s.boxShadow, outline: `${s.outlineStyle} ${s.outlineWidth}`, clipPath: s.clipPath, transform: s.transform, cornerShape: s.getPropertyValue('corner-shape') || 'n/a', varRadius: s.getPropertyValue('--pagination-control-radius') }
    }
    return r
  })
  for (const n of ['edge', 'active', 'inactive']) {
    const q = out[key][n]
    const clip = { x: Math.floor(q.x - 4), y: Math.floor(q.y - 4), width: Math.ceil(q.w + 8), height: Math.ceil(q.h + 8) }
    const png = await page.screenshot({ clip })
    const f = `crops/${w}-dpr${dpr}-${n}`
    await writeFile(OUT + f + '.png', png)
    const z = await browser.newPage({ viewport: { width: Math.ceil(clip.width * dpr * 10), height: Math.ceil(clip.height * dpr * 10) } })
    await z.setContent(`<body style="margin:0"><img src="data:image/png;base64,${png.toString('base64')}" style="width:${Math.ceil(clip.width * dpr * 10)}px;image-rendering:pixelated"></body>`)
    await z.screenshot({ path: OUT + f + '-10x.png' }); await z.close()
  }
  await page.close()
}
await browser.close(); server.close()
await writeFile(OUT + 'corner-probe.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) for (const [n, q] of Object.entries(v)) console.log(k, n, `${q.w.toFixed(2)}x${q.h.toFixed(2)} at ${q.x.toFixed(2)},${q.y.toFixed(2)}`, 'r', q.radius, 'var', q.varRadius, '|', q.border, '|', q.bg, '| shadow', q.boxShadow, '| clip', q.clipPath, '| tf', q.transform)
