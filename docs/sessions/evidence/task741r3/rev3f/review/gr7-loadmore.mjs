// Task 741 O46-2 row 3 — GR-7 live: "show more" / pagination at the end of a listing grid, every reference + Rozetka.
// Headed Chrome (Rozetka blocks headless). 1440 and 390: bottom-of-list controls, their computed styles, screenshot.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3f/review/gr7-loadmore/'
const PAGES = [
  ['rozetka', 'catalog', 'https://rozetka.com.ua/ua/notebooks/c80004/'],
  ['lahomes', 'property-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['lahomes', 'ui-pagination', 'https://techzaa.in/lahomes/admin/ui-pagination.html'],
  ['omah', 'property-list', 'https://omah.dexignzone.com/xhtml/property-list.html'],
  ['kamr', 'ecom-product-grid', 'https://kamr-vite.vercel.app/ecom-product-grid'],
  ['kamr', 'ui-pagination', 'https://kamr-vite.vercel.app/ui-pagination'],
  ['tailadmin', 'products-list', 'https://demo.tailadmin.com/products-list'],
  ['tailadmin', 'buttons', 'https://demo.tailadmin.com/buttons'],
]
const probe = () => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
  const st = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return { text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), tag: e.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, bg: s.backgroundColor, color: s.color, pad: s.padding } }
  const more = [...document.querySelectorAll('button, a')].filter(e => vis(e) && /показати ще|load more|show more|view more|see more|більше/i.test(e.textContent || '')).slice(0, 4).map(st)
  const pag = [...document.querySelectorAll('.pagination, [class*=pagination], nav[aria-label*=agin i], ul[class*=paginat]')].filter(vis).slice(0, 2).map(p => ({ box: st(p), items: [...p.querySelectorAll('a, button, li > span')].filter(vis).slice(0, 8).map(st) }))
  return { title: document.title, more, pag, overflow: document.documentElement.scrollWidth > innerWidth + 1 }
}
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA' })
await ctx.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }))
const page = await ctx.newPage()
await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'load', timeout: 45000 }).catch(() => null)
await page.waitForTimeout(2500)
if (await page.locator('input[type=email]').count()) { await page.locator('input[type=email]').first().fill('demo@example.com'); await page.locator('input[type=password]').first().fill('123456'); await page.locator('button[type=submit]').first().click().catch(() => null); await page.waitForTimeout(4000) }
const out = []
for (const [ref, name, url] of PAGES) {
  const row = { ref, name, url }
  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => { row.error = e.message.slice(0, 80) })
    await page.waitForTimeout(ref === 'rozetka' ? 8000 : 3000)
    for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(250) }
    await page.waitForTimeout(1500)
    row[w] = await page.evaluate(probe).catch(e => ({ error: e.message.slice(0, 80) }))
    await page.screenshot({ path: `${D}${ref}-${name}-${w}.png` }).catch(() => null)
  }
  out.push(row)
  const r = row[1440]; console.log(ref, name, '| more', JSON.stringify(r.more?.map(m => `${m.text} ${m.w}x${m.h} ${m.fs}/${m.fw} r${m.radius} bd ${m.border} bg ${m.bg} c ${m.color}`)), '| pag', JSON.stringify(r.pag?.map(p => p.items.map(i => `${i.text}:${i.w}x${i.h} ${i.fs} r${i.radius} bg ${i.bg}`).join(' '))), '| 390 more', JSON.stringify(row[390].more?.map(m => `${m.w}x${m.h}`)))
}
await browser.close()
await writeFile(D + 'gr7-loadmore.json', JSON.stringify(out, null, 1) + '\n')
