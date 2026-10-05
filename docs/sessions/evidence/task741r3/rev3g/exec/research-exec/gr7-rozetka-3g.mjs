// Task 741 Rev 3e exec — GR-7 live, owner reference Rozetka: the end-of-grid "show more" button and the paginator.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3g/exec/research-exec/'
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
const out = {}
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA' })
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }))
  await page.goto('https://rozetka.com.ua/ua/notebooks/c80004/', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(8000)
  const sel = 'rz-catalog-paginator, rz-paginator, [class*="paginator"], [class*="pagination"], [class*="show-more"], [class*="load-more"]'
  for (let i = 0; i < 30; i++) { if (await page.locator(sel).first().isVisible().catch(() => false)) break; await page.mouse.wheel(0, 900); await page.waitForTimeout(400) }
  const loc = page.locator(sel).first()
  await loc.scrollIntoViewIfNeeded().catch(() => null); await page.waitForTimeout(1500)
  out[w] = await page.evaluate((sel) => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const st = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return { text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50), tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 70), w: Math.round(r.width), h: Math.round(r.height), fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, bg: s.backgroundColor, color: s.color, pad: s.padding } }
    const blocks = [...document.querySelectorAll(sel)].filter(vis).slice(0, 4)
    const buttons = blocks.flatMap(b => [...b.querySelectorAll('button, a')].filter(vis).slice(0, 10).map(st))
    const pageW = innerWidth
    return { blocks: blocks.map(st), buttons, pageW }
  }, sel)
  const box = await loc.boundingBox().catch(() => null)
  await page.screenshot({ path: `${D}rozetka-paginator-${w}.png`, clip: box ? { x: 0, y: Math.max(0, box.y - 120), width: w, height: Math.min(900, box.height + 240) } : undefined }).catch(() => null)
  await page.close()
}
await browser.close()
await writeFile(D + 'gr7-rozetka-more.json', JSON.stringify(out, null, 1) + '\n')
for (const w of [1440, 390]) { console.log('==', w); for (const b of out[w].blocks) console.log(' block', JSON.stringify(b)); for (const b of out[w].buttons) console.log('  btn', JSON.stringify(b)) }
