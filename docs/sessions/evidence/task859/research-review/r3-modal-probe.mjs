import { createRequire } from 'node:module'
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6132)
const browser = await chromium.launch(); const out = []
for (const id of ['mantine-primitives-modal--delete-confirm', 'mantine-primitives-modal--form']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  await page.goto(`http://127.0.0.1:6132/iframe.html?id=${id}&globals=locale:en&viewMode=story`); await page.waitForTimeout(3000)
  if (!(await page.locator('.mantine-Modal-content').count())) { await page.locator('button:visible').first().click(); await page.waitForTimeout(1200) }
  out.push({ id, m: await page.evaluate(() => { const c = document.querySelector('.mantine-Modal-content'); if (!c) return null; const s = getComputedStyle(c); const t = document.querySelector('.mantine-Modal-title'); return { radius: s.borderRadius, w: c.getBoundingClientRect().width, title: t && getComputedStyle(t).fontSize, buttons: [...c.querySelectorAll('button')].map(b => ({ t: (b.innerText || b.getAttribute('aria-label')).trim(), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), r: getComputedStyle(b).borderRadius, bg: getComputedStyle(b).backgroundColor })) } }) })
}
console.log(JSON.stringify(out, null, 1)); await browser.close(); server.close()
