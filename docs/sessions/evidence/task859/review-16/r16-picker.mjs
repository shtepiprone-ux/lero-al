// Task 859 review 16 (Opus) - UserPickerFieldView `Results` at 320/390/639/640 x 4 locales: for every combobox option,
// the name's width and line count, the right group's width (badges + description), and any overflow past the option.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6642)
const b = await chromium.launch()
for (const w of [320, 390, 639, 640]) for (const loc of ['sq', 'en', 'uk', 'it']) {
  const p = await b.newPage({ viewport: { width: w, height: 844 } })
  await p.goto(`http://127.0.0.1:6642/iframe.html?id=patterns-mantine-userpickerfieldview--results&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForTimeout(1800)
  const r = await p.evaluate(() => [...document.querySelectorAll('.mantine-Drawer-content button[value], [role="option"]')].filter(o => o.getBoundingClientRect().width > 0).map(o => {
    const or = o.getBoundingClientRect(); const kids = [...o.querySelectorAll('*')]
    const row = o.querySelector('.mantine-Group-root'); const [name, right] = row ? [...row.children] : []
    const nr = name?.getBoundingClientRect(), rr = right?.getBoundingClientRect()
    const lh = name ? parseFloat(getComputedStyle(name).lineHeight) : 1
    const maxRight = Math.max(...kids.map(k => k.getBoundingClientRect().right))
    return { text: (name?.textContent ?? '').trim(), option: Math.round(or.width), nameW: nr && Math.round(nr.width), nameLines: nr && Math.round(nr.height / lh), rightW: rr && Math.round(rr.width), spillPastOption: Math.round(maxRight - or.right), spillPastViewport: Math.round(maxRight - innerWidth) }
  }))
  console.log(JSON.stringify({ w, loc, options: r }))
  await p.screenshot({ path: `C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task859/review-16/r16-picker-${w}-${loc}.png` })
  await p.close()
}
await b.close(); server.close()
