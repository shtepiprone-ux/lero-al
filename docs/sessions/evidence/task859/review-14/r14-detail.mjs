// Task 859 review 14 (Opus) - which containers give the unexplained gaps (support Card roots 18/26/31, users cell 8).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6615)
const b = await chromium.launch()
for (const [id, w] of [['patterns-mantine-adminsupportview--default', 390], ['patterns-mantine-adminuserstable--default', 1440]]) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 } })
  await p.goto(`http://127.0.0.1:6615/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
  console.log(id, w, JSON.stringify(await p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const gapsOf = st => { const k = [...st.children].filter(vis); const g = []; for (let i = 1; i < k.length; i++) g.push(Math.round(k[i].getBoundingClientRect().top - k[i - 1].getBoundingClientRect().bottom)); return g }
    const o = []
    for (const c of [...document.querySelectorAll('.mantine-Card-root')].filter(vis)) { const st = c.querySelector(':scope > .mantine-Stack-root'); if (st) { const g = gapsOf(st); if (g.length === 1) o.push({ card: g, kids: [...st.children].filter(vis).map(k => k.textContent.trim().slice(0, 40) + ' |h ' + Math.round(k.getBoundingClientRect().height)), rowGap: getComputedStyle(st).rowGap }) } }
    for (const td of document.querySelectorAll('td')) for (const st of td.querySelectorAll('.mantine-Stack-root')) { const g = gapsOf(st); if (g.includes(8)) o.push({ cell: g, rowGap: getComputedStyle(st).rowGap, kids: [...st.children].filter(vis).map(k => k.textContent.trim().slice(0, 30)) }) }
    return o.slice(0, 6)
  })))
  await p.close()
}
await b.close(); server.close()
