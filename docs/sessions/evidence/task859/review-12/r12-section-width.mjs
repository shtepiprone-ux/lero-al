// Task 859 review 12 (Opus) - width of each example inside a `MantineStorySection` row, against the row's own width,
// for the Stories Revision 10 moved from a column `Stack` into `MantineStorySection` (a wrapping `Group`).
// Before Revision 10 each example sat in a column Stack, so a block control (input, trigger, Radio.Group) took the
// full width of the content box. sq + en, DPR 1, 320 / 390 / 1024 / 1440, final storybook-static.
// usage: node r12-section-width.mjs        Output: r12-section-width.json + a summary on stdout.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6320)
const IDS = ['mantine-primitives-combobox--default', 'mantine-primitives-radio--default', 'mantine-primitives-radio--card', 'mantine-primitives-radiocardoption--default']
const WIDTHS = [320, 390, 1024, 1440]
const LOCALES = ['en', 'sq']
const probe = () => {
  const root = document.querySelector('#storybook-root')
  const out = []
  for (const stack of root.querySelectorAll('.mantine-Stack-root')) {
    const kids = [...stack.children]
    if (kids.length !== 2 || !kids[0].matches('p.mantine-Text-root') || !kids[1].matches('.mantine-Group-root')) continue
    const row = kids[1].getBoundingClientRect()
    out.push({
      caption: kids[0].textContent.trim().slice(0, 60),
      rowW: Math.round(row.width),
      items: [...kids[1].children].map(el => {
        const r = el.getBoundingClientRect()
        const ctl = el.querySelector('input:not([type="radio"]):not([type="hidden"]), button, .mantine-Radio-root, .mantine-RadioCard-root')
        return { cls: (el.className.match(/mantine-[A-Za-z]+-root/) ?? [el.tagName])[0], w: Math.round(r.width), ctlW: ctl ? Math.round(ctl.getBoundingClientRect().width) : null, pct: Math.round(100 * r.width / row.width) }
      }),
    })
  }
  return { overflowX: document.documentElement.scrollWidth > window.innerWidth, sections: out }
}
const browser = await chromium.launch()
const res = []
for (const id of IDS) for (const loc of LOCALES) for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  let err = null
  page.on('pageerror', e => { err = String(e) })
  await page.goto(`http://localhost:6320/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
  await page.waitForSelector('#storybook-root .mantine-Group-root', { timeout: 20000 })
  await page.waitForTimeout(400)
  const errorScreen = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'))
  const r = await page.evaluate(probe)
  if (w === 1440 && loc === 'en') await page.screenshot({ path: path.join(DIR, `r12-section-width-${id.replace(/^.*?--/, id.split('--')[0].split('-').pop() + '-')}-${w}.png`), fullPage: true })
  res.push({ id, loc, w, errorScreen, pageerror: err, ...r })
  await page.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r12-section-width.json'), JSON.stringify({ platform: process.platform, node: process.version, res }, null, 1))
for (const r of res) {
  const narrow = r.sections.flatMap(s => s.items.filter(i => i.pct < 99).map(i => `${i.cls} ${i.w}/${s.rowW} (${i.pct}%) ctl ${i.ctlW} [${s.caption.slice(0, 28)}]`))
  console.log(`${r.id} ${r.loc} ${r.w}: sections ${r.sections.length}, overflowX ${r.overflowX}, errorScreen ${r.errorScreen}, pageerror ${r.pageerror ? 'yes' : 'no'}; items under 99% of the row: ${narrow.length}`)
  for (const n of narrow) console.log('   ' + n)
}
