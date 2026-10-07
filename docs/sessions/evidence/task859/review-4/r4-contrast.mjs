// Task 859 review 4: WCAG 2.x contrast of every light badge (text on its solid fill) in Mantine/Primitives/Badge
// Default and Statuses on the rebuilt storybook-static, plus the theme colours the registry uses, measured at index 0 / 7.
// D78-21 was chosen on the premise "text stays index 7, which keeps WCAG AA 4.5:1"; this checks that premise per colour.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-4/r4-contrast.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6143)
const lum = rgb => {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => v / 255).map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2) }
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://127.0.0.1:6143/iframe.html?id=mantine-primitives-badge--statuses&globals=locale:en&viewMode=story')
await page.waitForTimeout(3500)
const palette = await page.evaluate(() => {
  const css = getComputedStyle(document.documentElement)
  const toRgb = v => { const d = document.createElement('div'); d.style.color = v; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c }
  return ['gray', 'blueLight', 'green', 'yellow', 'red', 'brand', 'sale', 'purple', 'orange'].map(n => ({ n, c0: toRgb(css.getPropertyValue(`--mantine-color-${n}-0`).trim()), c7: toRgb(css.getPropertyValue(`--mantine-color-${n}-7`).trim()) }))
})
const colours = palette.map(p => ({ ...p, ratio: ratio(p.c7, p.c0), aa: ratio(p.c7, p.c0) >= 4.5 }))
const badges = []
for (const id of ['mantine-primitives-badge--statuses', 'mantine-primitives-badge--default']) {
  await page.goto(`http://127.0.0.1:6143/iframe.html?id=${id}&globals=locale:en&viewMode=story`)
  await page.waitForTimeout(3000)
  const rows = await page.evaluate(() => [...document.querySelectorAll('.mantine-Badge-root[data-variant="light"]')].map(b => {
    const s = getComputedStyle(b)
    const m = (b.getAttribute('style') || '').match(/--mantine-color-([a-zA-Z]+)-0/)
    return { text: b.innerText.trim(), colour: m ? m[1] : null, bg: s.backgroundColor, fg: s.color }
  }))
  for (const r of rows) badges.push({ story: id, ...r, ratio: ratio(r.fg, r.bg), aa: ratio(r.fg, r.bg) >= 4.5 })
}
fs.writeFileSync(OUT, JSON.stringify({ platform: process.platform, node: process.version, colours, failingBadges: badges.filter(b => !b.aa), badges }, null, 1))
for (const c of colours) console.log(c.n.padEnd(10), c.c7, 'on', c.c0, c.ratio, c.aa ? 'AA' : 'FAIL')
console.log('light badges', badges.length, 'below 4.5:', badges.filter(b => !b.aa).map(b => `${b.text}(${b.colour} ${b.ratio})`).join(', '))
await browser.close()
server.close()
