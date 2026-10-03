// Task 857 Revision 4 R35: edge gaps from the visible content boxes (not the root's own box).
import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return } r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' }[path.extname(p)] ?? 'application/octet-stream' }); r.end(d) }) }).listen(6096)
const IDS = ['patterns-mantine-agentstatisticsview--default', 'patterns-mantine-admintable--wrapped-title-column', 'mantine-primitives-table--cards-below-lg']
const b = await chromium.launch(); const pg = await b.newPage(); const out = []
for (const id of IDS) for (const w of [320, 390, 1024, 1440]) {
  await pg.setViewportSize({ width: w, height: 900 })
  await pg.goto(`http://127.0.0.1:6096/iframe.html?id=${id}&globals=locale:sq&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await pg.waitForSelector('#storybook-root *', { timeout: 15000 }).catch(() => {}); await pg.waitForTimeout(600)
  const m = await pg.evaluate(() => {
    const els = [...document.querySelectorAll('#storybook-root .mantine-Paper-root, #storybook-root .mantine-Card-root, #storybook-root table, #storybook-root .mantine-Title-root, #storybook-root .mantine-Text-root')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest('[aria-hidden="true"]') })
    const rs = els.map(e => e.getBoundingClientRect())
    const doc = document.documentElement
    return { n: els.length, left: Math.round(Math.min(...rs.map(r => r.left))), right: Math.round(innerWidth - Math.max(...rs.map(r => r.right))), top: Math.round(Math.min(...rs.map(r => r.top))), bottom: Math.round(doc.scrollHeight - Math.max(...rs.map(r => r.bottom + scrollY))) }
  })
  out.push({ id, w, ...m }); process.stdout.write('.')
}
await b.close(); srv.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
for (const r of out) console.log(r.id.replace('patterns-mantine-', ''), r.w, `${r.top}/${r.right}/${r.bottom}/${r.left}`)
