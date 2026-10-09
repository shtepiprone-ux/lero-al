// Task 859 review 15 (Opus) - DPR-1 crops of the unbroken-name overflow at 320 (uk); probe-only DOM text change.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6634)
const b = await chromium.launch()
for (const id of ['patterns-mantine-admininquiriesview--default', 'patterns-mantine-admindashboardrecentlistings--default', 'patterns-mantine-adminlistingsview--default']) {
  const p = await b.newPage({ viewport: { width: 320, height: 900 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6634/iframe.html?id=${id}&viewMode=story&globals=locale:uk`, { waitUntil: 'load' }); await p.waitForTimeout(1200)
  await p.evaluate(() => { const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const ns = []; while (tw.nextNode()) ns.push(tw.currentNode); for (const t of ns) t.nodeValue = t.nodeValue.replace(/(Blerina Hoxha|Agim Krasniqi|Fatmir Gashi|Ana Koci|Arben Krasniqi|Blerim Hoxha|Oksana Petrenko|Marco Rossi)/g, 'arbengjergjkrasniqimarashi@example.com') })
  await p.waitForTimeout(300); await p.screenshot({ path: `r15-unbroken-${id.replace(/^patterns-mantine-/, '')}-uk-320.png` }); await p.close()
}
await b.close(); server.close()
