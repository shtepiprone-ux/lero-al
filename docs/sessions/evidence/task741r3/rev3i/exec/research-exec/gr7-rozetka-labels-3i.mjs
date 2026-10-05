// Task 741 Rev 3i — GR-7 live (execution, Sonnet): Rozetka catalogue tile labels (promo/status) and their position on the photo.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3i/exec/research-exec/'
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
const out = {}
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA' })
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }))
  await page.goto('https://rozetka.com.ua/ua/notebooks/c80004/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(9000)
  out[w] = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const tiles = [...document.querySelectorAll('rz-catalog-tile, .goods-tile')].filter(vis).slice(0, 12)
    return tiles.map(t => {
      const img = [...t.querySelectorAll('img')].find(vis); const ir = img?.getBoundingClientRect()
      const labels = [...t.querySelectorAll('[class*="label"], [class*="promo"], [class*="badge"]')].filter(e => vis(e) && e.children.length <= 1 && (e.textContent || '').trim().length > 0 && (e.textContent || '').trim().length < 24)
      return labels.slice(0, 3).map(l => { const r = l.getBoundingClientRect(), s = getComputedStyle(l); return { text: l.textContent.trim(), cls: String(l.className).slice(0, 40), onPhoto: !!ir && r.left >= ir.left - 2 && r.right <= ir.right + 2 && r.top >= ir.top - 2 && r.bottom <= ir.bottom + 2, atTopLeft: !!ir && Math.round(r.left - ir.left) < 24 && Math.round(r.top - ir.top) < 24, dx: ir ? Math.round(r.left - ir.left) : null, dy: ir ? Math.round(r.top - ir.top) : null, pos: s.position, fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, bg: s.backgroundColor } })
    }).flat().slice(0, 10)
  })
  await page.screenshot({ path: `${D}rozetka-labels-${w}.png` })
  console.log(w, JSON.stringify(out[w]))
  await page.close()
}
await browser.close()
await writeFile(D + 'gr7-rozetka-labels-3i.json', JSON.stringify(out, null, 1) + '\n')
