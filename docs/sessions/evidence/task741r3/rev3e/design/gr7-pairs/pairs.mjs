// Task 741 Rev 3e / Task 918 amendment (D89-10) — GR-7 live, all four references: every page that shows one entity
// in a grid and in a list. Per page at 1440 and 390: full-page screenshot, and the text-style signature
// (font-size/weight/colour → sample texts) of the record items, so grid vs list can be compared per reference.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const DIR = 'docs/sessions/evidence/task741r3/rev3e/design/gr7-pairs/'
const PAGES = [
  ['lahomes', 'property-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['lahomes', 'property-list', 'https://techzaa.in/lahomes/admin/property-list.html'],
  ['lahomes', 'agents-grid', 'https://techzaa.in/lahomes/admin/agents-grid.html'],
  ['lahomes', 'agents-list', 'https://techzaa.in/lahomes/admin/agents-list.html'],
  ['lahomes', 'customers-grid', 'https://techzaa.in/lahomes/admin/customers-grid.html'],
  ['lahomes', 'customers-list', 'https://techzaa.in/lahomes/admin/customers-list.html'],
  ['kamr', 'room', 'https://kamr-vite.vercel.app/room'],
  ['kamr', 'ecom-product-grid', 'https://kamr-vite.vercel.app/ecom-product-grid'],
  ['kamr', 'ecom-product-list', 'https://kamr-vite.vercel.app/ecom-product-list'],
  ['omah', 'property-list-grid', 'https://omah.dexignzone.com/xhtml/property-list.html'],
  ['omah', 'property-list-list', 'https://omah.dexignzone.com/xhtml/property-list.html#list'],
  ['omah', 'ecom-product-grid', 'https://omah.dexignzone.com/xhtml/ecom-product-grid.html'],
  ['omah', 'ecom-product-list', 'https://omah.dexignzone.com/xhtml/ecom-product-list.html'],
  ['tailadmin', 'products-list', 'https://demo.tailadmin.com/products-list'],
  ['tailadmin', 'task-list', 'https://demo.tailadmin.com/task-list'],
  ['tailadmin', 'list', 'https://demo.tailadmin.com/list'],
  ['tailadmin', 'cards', 'https://demo.tailadmin.com/cards'],
]
const sig = () => {
  const main = document.querySelector('main, .content-body, .page-content, .main-content, #root main') || document.body
  const skip = e => e.closest('nav, aside, header, .sidebar, .deznav, .header, .app-sidebar, .main-nav, footer')
  const m = new Map()
  for (const e of main.querySelectorAll('*')) {
    if (e.children.length || skip(e)) continue
    const t = (e.textContent || '').trim(); if (!t || t.length > 60) continue
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue
    const s = getComputedStyle(e); const k = `${s.fontSize}/${s.fontWeight} ${s.color}`
    if (!m.has(k)) m.set(k, []); const a = m.get(k); if (a.length < 4) a.push(t.slice(0, 28))
  }
  const imgs = [...main.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 60 && !skip(i) }).slice(0, 3).map(i => { const r = i.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}` })
  return { overflow: document.documentElement.scrollWidth > innerWidth + 1, imgs, styles: Object.fromEntries([...m.entries()].slice(0, 24)) }
}
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
// Kamr sign-in (demo@example.com / 123456, owner 2026-10-04)
await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'load', timeout: 45000 }).catch(() => null)
await page.waitForTimeout(2000)
if (await page.locator('input[type=email]').count()) {
  await page.locator('input[type=email]').first().fill('demo@example.com')
  await page.locator('input[type=password]').first().fill('123456')
  await page.locator('button[type=submit]').first().click().catch(() => null)
  await page.waitForTimeout(4000)
}
const out = { kamrAfterLogin: page.url(), pages: [] }
for (const [ref, name, url] of PAGES) {
  const row = { ref, name, url }
  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.goto(url.replace('#list', ''), { waitUntil: 'load', timeout: 45000 }).catch(e => { row.error = e.message.slice(0, 80) })
    await page.waitForTimeout(2500)
    if (url.endsWith('#list') && w === 1440) { await page.mouse.click(1380, 493); await page.waitForTimeout(2000) }
    if (url.endsWith('#list') && w === 390) { row.note390 = 'toggle not operated at 390 (hidden/position differs)'; }
    row.finalUrl = page.url()
    row[w] = await page.evaluate(sig).catch(e => ({ error: e.message.slice(0, 80) }))
    const shot = `${ref}-${name}-${w}.png`
    await page.screenshot({ path: DIR + shot, fullPage: w === 1440 }).catch(() => null)
    row[w].shot = shot
  }
  out.pages.push(row)
  console.log(ref, name, row.finalUrl, '1440 imgs', row[1440].imgs, 'styles', Object.keys(row[1440].styles || {}).length, 'ovf390', row[390].overflow)
}
await browser.close()
await writeFile(DIR + 'pairs.json', JSON.stringify(out, null, 1) + '\n')
