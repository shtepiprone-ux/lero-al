// Task 741 Revision 3e design — GR-7 live: Omah property-list grid vs list toggle; same card text styles in both?
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto('https://omah.dexignzone.com/xhtml/property-list.html', { waitUntil: 'load', timeout: 45000 })
await page.waitForTimeout(2000)
const measure = () => page.evaluate(() => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' }
  const priceEl = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,span,p,div')].find(e => vis(e) && e.children.length === 0 && /^\$\d+/.test(e.textContent.trim()))
  if (!priceEl) return { note: 'no price found' }
  let card = priceEl; for (let i = 0; i < 8 && card.parentElement; i++) { card = card.parentElement; if (card.querySelector('img') && card.getBoundingClientRect().height > 250) break }
  const out = []
  for (const e of card.querySelectorAll('*')) { if (!vis(e) || e.children.length > 0) continue; const t = e.textContent.trim(); if (!t) continue; const s = getComputedStyle(e); out.push(`${t.slice(0, 32)} | ${s.fontSize}/${s.fontWeight} ${s.color}`) }
  const r = card.getBoundingClientRect(); const img = card.querySelector('img').getBoundingClientRect()
  return { card: `${Math.round(r.width)}x${Math.round(r.height)} img ${Math.round(img.width)}x${Math.round(img.height)} at ${Math.round(img.left - r.left)},${Math.round(img.top - r.top)}`, text: out.slice(0, 16) }
})
const res = { grid: await measure() }
await page.screenshot({ path: 'docs/sessions/evidence/task741r3/rev3e/design/omah-grid-1440.png' })
const before = page.url()
await page.mouse.click(1380, 493)
await page.waitForTimeout(2500)
res.clicked = true
res.urlAfter = page.url() + (page.url() === before ? ' (same page)' : '')
res.list = await measure()
await page.screenshot({ path: 'docs/sessions/evidence/task741r3/rev3e/design/omah-list-1440.png' })
await browser.close()
await writeFile('docs/sessions/evidence/task741r3/rev3e/design/gr7-omah-toggle.json', JSON.stringify(res, null, 1) + '\n')
console.log(JSON.stringify(res, null, 1))
