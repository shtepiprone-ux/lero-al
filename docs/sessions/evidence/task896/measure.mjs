import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
const root = path.resolve('storybook-static')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end() }
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res)
}).listen(0)
const port = srv.address().port
const ids = ['default', 'verified-tab', 'empty', 'location-filter'].map(s => `patterns-mantine-adminuserstable--${s}`)
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'))
for (const id of ids) if (!index.entries[id]) throw new Error('missing ' + id)
const browser = await chromium.launch()
const out = []
for (const id of ids) {
  for (const w of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } })
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story`)
    await page.waitForSelector('[data-testid="admin-users-table"]', { timeout: 15000 })
    await page.waitForTimeout(800)
    const m = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="admin-users-table"]')
      const r = el.getBoundingClientRect(); const sy = window.scrollY
      const de = document.documentElement
      const fs = {}
      el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,button,input').forEach(n => { if (n.textContent?.trim() || n.tagName === 'INPUT') { const k = n.tagName.toLowerCase(); const v = parseFloat(getComputedStyle(n).fontSize); (fs[k] ||= new Set()).add(v) } })
      return { compW: Math.round(r.width), vw: window.innerWidth, top: Math.round(r.top + sy), left: Math.round(r.left), right: Math.round(window.innerWidth - r.right), bottom: Math.round(de.scrollHeight - (r.bottom + sy)), overflow: de.scrollWidth > window.innerWidth, fonts: Object.fromEntries(Object.entries(fs).map(([k, v]) => [k, [...v].sort((a, b) => a - b)])) }
    })
    out.push({ id, w, ...m }); await page.close()
  }
}
await browser.close(); srv.close()
fs.writeFileSync('docs/sessions/evidence/task896/23-measurements.json', JSON.stringify(out, null, 1))
for (const o of out) console.log(o.id.split('--')[1], o.w, `comp ${o.compW}/${o.vw}`, `t/r/b/l ${o.top}/${o.right}/${o.bottom}/${o.left}`, 'overflow', o.overflow, JSON.stringify(o.fonts))
