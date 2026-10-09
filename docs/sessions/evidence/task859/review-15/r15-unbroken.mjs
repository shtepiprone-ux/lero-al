// Task 859 review 15 (Opus) - GR-3i "a long unbroken token breaks inside the word": every person name in the DOM is
// replaced (probe only) by an e-mail-shaped display name with no space, at 320/390 (uk); does any name element push
// past its own box or its container (overflow) instead of breaking? Read-only on storybook-static.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6633)
const IDS = ['patterns-mantine-admininquiriesview--default', 'patterns-mantine-adminsupportview--default', 'patterns-mantine-adminuserstable--default', 'patterns-mantine-adminlistingsview--default', 'patterns-mantine-adminreportsview--default', 'patterns-mantine-admindashboardrecentlistings--default', 'patterns-mantine-dashboardworklist--default', 'mantine-primitives-table--cards-below-md']
const PERSONS = ['Agim Krasniqi-Berisha Hoxha', 'Arben Krasniqi-Marashi', 'Arben Krasniqi', 'Oksana Petrenko', 'Marco Rossi', 'Ana Koci', 'Blerim Hoxha', 'Flutura Lleshi', 'Gentiana Hoxha', 'Fatmir Gashi', 'Blerina Hoxha', 'Agim Krasniqi', 'Giulia Romano', 'Elira Dervishi', 'Elira Hoxha', 'Driton Berisha', 'Antonio Berluskoni']
const TOKEN = 'arbengjergjkrasniqimarashi@example.com'
const b = await chromium.launch()
for (const id of IDS) for (const w of (process.env.W ?? "320,390,1440").split(",").map(Number)) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6633/iframe.html?id=${id}&viewMode=story&globals=locale:uk`, { waitUntil: 'load' }); await p.waitForTimeout(1200)
  const r = await p.evaluate(async ({ PERSONS, TOKEN }) => {
    const root = document.querySelector('#storybook-root') ?? document.body
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const ns = []; while (tw.nextNode()) ns.push(tw.currentNode)
    let n = 0; for (const t of ns) { let v = t.nodeValue; for (const nm of PERSONS) if (v.includes(nm)) v = v.split(nm).join(TOKEN); if (v !== t.nodeValue) { t.nodeValue = v; n++ } }
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); await new Promise(r => setTimeout(r, 150))
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const els = [...root.querySelectorAll('*')].filter(e => vis(e) && (e.textContent || '').includes(TOKEN) && ![...e.children].some(c => (c.textContent || '').includes(TOKEN)))
    const bad = []
    for (const e of els) {
      const er = e.getBoundingClientRect(); const cs = getComputedStyle(e)
      // the nearest ancestor that is a row container: card, cell, inquiry row, anchor row
      const box = e.closest('.mantine-Card-root, td, [data-testid="inquiry-row"], a[href]') ?? e.parentElement; const br = box.getBoundingClientRect()
      const over = Math.round(Math.max(er.right - br.right, e.scrollWidth - e.clientWidth))
      if (over > 1 || er.right > document.documentElement.clientWidth) bad.push(`${over}px past its box, ow=${cs.overflowWrap} "${(e.textContent || '').trim().slice(0, 50)}"`)
    }
    return { replaced: n, elements: els.length, overflowing: bad, pageScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth }
  }, { PERSONS, TOKEN })
  console.log(JSON.stringify({ id, w, ...r }))
  await p.close()
}
await b.close(); server.close()
