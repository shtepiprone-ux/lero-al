// Task 859 review 3 — reviewer GR-11 screen (not a gate) against the executor's storybook-static build:
// for every Badge and every Button rendered by the Badge and Modal primitive Stories, record fill, border colour/width,
// radius and opacity, and flag a same-colour border on a fill or an opacity fade (GR-11 forbidden list).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/research-review/r3-gr11-probe.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6131)
const STORIES = ['mantine-primitives-badge--default', 'mantine-primitives-badge--statuses', 'mantine-primitives-modal--delete-confirm', 'mantine-primitives-modal--detail', 'mantine-primitives-modal--form']
const browser = await chromium.launch()
const out = []
for (const id of STORIES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:6131/iframe.html?id=${id}&globals=locale:en&viewMode=story`)
  await page.waitForTimeout(4000)
  const rows = await page.evaluate(() => [...document.querySelectorAll('.mantine-Badge-root, button.mantine-Button-root')].map(el => {
    const s = getComputedStyle(el)
    let op = 1; for (let n = el; n; n = n.parentElement) op *= +getComputedStyle(n).opacity
    const fill = s.backgroundColor, bc = s.borderTopColor, bw = parseFloat(s.borderTopWidth)
    return { kind: el.classList.contains('mantine-Badge-root') ? 'badge' : 'button', text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30), variant: el.getAttribute('data-variant'), disabled: el.hasAttribute('disabled') || el.getAttribute('data-disabled') === 'true', fill, border: `${bw}px ${bc}`, radius: s.borderTopLeftRadius, opacity: +op.toFixed(2), sameColourBorderOnFill: bw > 0 && fill !== 'rgba(0, 0, 0, 0)' && fill === bc, opacityFade: op < 1 }
  }))
  out.push({ id, n: rows.length, flagged: rows.filter(r => r.sameColourBorderOnFill || r.opacityFade), rows })
  console.log(id, 'elements', rows.length, 'flagged', rows.filter(r => r.sameColourBorderOnFill || r.opacityFade).map(r => `${r.kind}:${r.text}:${r.variant}:${r.border}/${r.fill}/op${r.opacity}`).join(' | ') || 'none')
  await ctx.close()
}
fs.writeFileSync(OUT, JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
await browser.close(); server.close()
