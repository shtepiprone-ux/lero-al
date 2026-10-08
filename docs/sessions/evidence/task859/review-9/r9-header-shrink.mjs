// Review 9 (Opus): is the structured dialog header shrinking when the body overflows? (owner report 2026-10-08)
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); res.end(d) }) }).listen(6196)
const browser = await chromium.launch()
const rows = []
for (const [story, h] of [['complaint', 812], ['complaint-same-user', 812], ['support', 812], ['complaint', 600], ['complaint', 1200]]) {
  const page = await browser.newPage({ viewport: { width: 1387, height: h } })
  await page.goto(`http://127.0.0.1:6196/iframe.html?id=patterns-mantine-createticketdialogview--${story}&globals=locale:en&viewMode=story`)
  await page.waitForSelector('.mantine-Modal-content'); await page.waitForTimeout(1200)
  rows.push({ story, h, ...(await page.evaluate(() => {
    const hd = document.querySelector('.mantine-Modal-header'); const s = getComputedStyle(hd)
    const div = hd.querySelector('.mantine-Divider-root'); const body = document.querySelector('.mantine-Modal-body')
    return { headerH: hd.getBoundingClientRect().height, headerScrollH: hd.scrollHeight, flexShrink: s.flexShrink, position: s.position, overflow: s.overflowY,
      dividerTop: div?.getBoundingClientRect().top, headerBottom: hd.getBoundingClientRect().bottom, bodyTop: body.getBoundingClientRect().top, bodyOverflows: body.scrollHeight > body.clientHeight }
  })) })
  await page.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r9-header-shrink.json'), JSON.stringify({ platform: process.platform, node: process.version, rows }, null, 1))
for (const r of rows) console.log(JSON.stringify(r))
