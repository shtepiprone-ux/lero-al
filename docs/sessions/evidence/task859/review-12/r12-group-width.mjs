// Task 859 review 12 (Opus) - width of every `MantineRadioCardGroup` (the Radio.Group root that holds `.mantine-RadioCard-card`s)
// against its parent's content box, in the production dialog Stories and the Stories that show the group directly.
// en, DPR 1, 390 and 1440, final storybook-static. Output: r12-group-width.json + summary.
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
}).listen(6321)
const IDS = ['patterns-mantine-ticketdetaildialogview--support', 'patterns-mantine-premiumdialogview--not-premium', 'patterns-mantine-premiumdialogview--custom-date',
  'mantine-primitives-radio--card', 'mantine-primitives-radiocardoption--default', 'mantine-primitives-modal--detail']
const probe = () => {
  const groups = new Set([...document.querySelectorAll('.mantine-RadioCard-card')].map(c => c.closest('.mantine-InputWrapper-root')).filter(Boolean))
  return [...groups].map(g => {
    const p = g.parentElement; const cs = getComputedStyle(p)
    const inner = p.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const w = g.getBoundingClientRect().width
    return { cards: g.querySelectorAll('.mantine-RadioCard-card').length, w: Math.round(w), parent: Math.round(inner), parentDisplay: cs.display + '/' + cs.flexDirection, pct: Math.round(100 * w / inner) }
  })
}
const browser = await chromium.launch()
const res = []
for (const id of IDS) for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`http://localhost:6321/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-RadioCard-card, #storybook-root button', { timeout: 40000 }).catch(() => null)
  await page.waitForTimeout(800)
  if (id.includes('modal--detail')) {
    // open the detail dialog: the trigger whose dialog holds the Radio.Card choice
    for (const b of await page.locator('#storybook-root button').all()) {
      await b.click().catch(() => null); await page.waitForTimeout(700)
      if (await page.locator('.mantine-RadioCard-card').count()) break
      await page.keyboard.press('Escape'); await page.waitForTimeout(400)
    }
  }
  const n = await page.locator('.mantine-RadioCard-card').count()
  res.push({ id, w, n, groups: await page.evaluate(probe) })
  await page.close()
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r12-group-width.json'), JSON.stringify({ platform: process.platform, node: process.version, res }, null, 1))
for (const r of res) console.log(`${r.id} ${r.w} (cards in page ${r.n}): ` + (r.groups.map(g => `${g.cards} cards ${g.w}/${g.parent} (${g.pct}%, parent ${g.parentDisplay})`).join('; ') || 'NO GROUP'))
