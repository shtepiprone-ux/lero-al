// Task 923 Revision 42 (Opus): one-off diagnosis of the self-test gap (rev42-05): margins and boxes around the injected block on the Default export at 390 en.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const ROOT = path.resolve('storybook-static')
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html' }); res.end(d) }) })
await new Promise((r) => server.listen(0, r))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 900 } })
await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=patterns-mantine-adminpageheader--default&viewMode=story&globals=locale:en`)
await page.waitForSelector('#storybook-root h1')
console.log(JSON.stringify(await page.evaluate(() => {
  const box = document.querySelector('#storybook-root h1').closest('[style*="margin-bottom"]')
  const header = box.firstElementChild
  const d = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { tag: e.tagName, cls: e.className.slice(0, 60), top: r.top, bottom: r.bottom, mt: cs.marginTop, mb: cs.marginBottom } }
  return { box: d(box), header: d(header), kids: [...header.querySelectorAll('*')].map(d) }
}), null, 1))
await browser.close(); server.close()
