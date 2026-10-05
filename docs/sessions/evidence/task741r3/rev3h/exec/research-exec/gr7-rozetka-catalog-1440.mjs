// Task 918 amendment (D89-10) — GR-7 live, owner reference Rozetka (D89-3), headed Chrome (headless got 403).
// Home tiles + a catalogue page: price block (old above current, colours) and the catalogue view toggle, both views.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3h/exec/research-exec/'
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'uk-UA' })
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }))
const tiles = () => page.evaluate(() => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const P = /^\d[\d\s ]*\s?₴$/
  const prices = [...document.querySelectorAll('*')].filter(e => vis(e) && P.test(e.textContent.trim()) && ![...e.children].some(c => P.test(c.textContent.trim())))
  const rows = []
  for (const p of prices.slice(0, 40)) {
    const s = getComputedStyle(p); const r = p.getBoundingClientRect()
    let card = p; for (let i = 0; i < 8 && card.parentElement; i++) { card = card.parentElement; if (card.querySelector('img') && card.getBoundingClientRect().height > 200) break }
    const title = [...card.querySelectorAll('a, span, p, div')].find(e => e.children.length === 0 && vis(e) && e.textContent.trim().length > 15 && !/₴/.test(e.textContent))
    const ts = title ? getComputedStyle(title) : null
    rows.push({ price: p.textContent.trim(), fs: s.fontSize, fw: s.fontWeight, color: s.color, td: s.textDecorationLine, y: Math.round(r.top), x: Math.round(r.left), card: `${Math.round(card.getBoundingClientRect().width)}x${Math.round(card.getBoundingClientRect().height)}`, title: title ? `${title.textContent.trim().slice(0, 30)} | ${ts.fontSize}/${ts.fontWeight} ${ts.color}` : null })
  }
  return rows.slice(0, 12)
})
const out = {}
await page.goto('https://rozetka.com.ua/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(9000); await page.mouse.wheel(0, 1600); await page.waitForTimeout(3000)
out.home = { status: 'loaded', title: await page.title(), tiles: await tiles() }
await page.goto('https://rozetka.com.ua/ua/notebooks/c80004/', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForTimeout(9000)
out.catalog = { url: page.url(), title: await page.title() }
out.catalog.toggles = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter(b => /плитк|спис|tile|list|view|вигляд/i.test((b.getAttribute('aria-label') || '') + (b.getAttribute('title') || '') + b.className + (b.textContent || ''))).slice(0, 10).map(b => ({ text: (b.textContent || '').trim().slice(0, 30), aria: b.getAttribute('aria-label'), title: b.getAttribute('title'), cls: String(b.className).slice(0, 60) })))
out.catalog.view1 = await tiles()
await page.screenshot({ path: D + 'rozetka-catalog-view1-1440.png' })
// operate the other view toggle if present
const alt = page.locator('button[title="Крупна плитка"]').first()
if (await alt.count()) { await alt.click().catch(() => null); await page.waitForTimeout(4000); out.catalog.toggled = true; out.catalog.view2 = await tiles(); await page.screenshot({ path: D + 'rozetka-catalog-view2-1440.png' }) } else out.catalog.toggled = false
await browser.close()
await writeFile(D + 'gr7-rozetka-catalog-1440.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1).slice(0, 6000))
