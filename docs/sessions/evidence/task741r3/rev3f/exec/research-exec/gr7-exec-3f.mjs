// Task 741 Rev 3f — GR-7 live check (moment: execution, role: Sonnet): end-of-list "show more", paginator, button
// sizes and empty/loading controls, on the pages §18.15.3 relies on, at 1440 and 390. Rozetka runs headed Chrome.
import { createRequire } from 'node:module'
import { writeFileSync, readFileSync } from 'node:fs'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3f/exec/research-exec/'
const LIB = 'docs/research/references/2026-10-04/'
const PAGES = [
  ['lahomes', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/ui-pagination.html'],
  ['kamr', 'https://kamr-vite.vercel.app/ui-pagination'],
]
const lib = Object.fromEntries(['tailadmin', 'lahomes', 'kamr', 'omah'].map(r => [r, JSON.parse(readFileSync(LIB + `audit-${r}.json`, 'utf8'))]))
const probe = () => {
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const st = e => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return { text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 60), w: Math.round(r.width), h: Math.round(r.height), fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color } }
  const pag = [...document.querySelectorAll('[class*="pagination" i], nav[aria-label*="pag" i], ul.pagination')].filter(vis).slice(0, 2)
  const pagItems = pag.flatMap(p => [...p.querySelectorAll('a, button, li')].filter(vis).slice(0, 6).map(st))
  const more = [...document.querySelectorAll('button, a')].filter(vis).filter(b => /show more|load more|view more|більше|показати/i.test(b.textContent || '')).slice(0, 4).map(st)
  const buttons = [...document.querySelectorAll('button, a.btn')].filter(vis).slice(0, 8).map(st)
  return { title: document.title, h: document.querySelector('h1,h2,h3,h4')?.innerText?.trim().slice(0, 60), pagItems, more, buttons, overflow: document.documentElement.scrollWidth > innerWidth + 1 }
}
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
let kamrIn = false, i = 0
const results = []
for (const [ref, url] of PAGES) {
  const row = { ref, url }
  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 })
    await page.goto(url, { waitUntil: 'load', timeout: 40000 }).catch(() => null)
    if (ref === 'kamr' && !kamrIn) {
      kamrIn = true
      await page.waitForTimeout(2000)
      await page.locator('input[type=email]').first().fill('demo@example.com').catch(() => null)
      await page.locator('input[type=password]').first().fill('123456').catch(() => null)
      await page.locator('button[type=submit]').first().click().catch(() => null)
      await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null)
      await page.goto(url, { waitUntil: 'load' }).catch(() => null)
    }
    await page.waitForTimeout(1500)
    row[w] = await page.evaluate(probe)
    const shot = `exec-${String(i++).padStart(2, '0')}-${ref}-${w}.png`
    await page.screenshot({ path: D + shot, fullPage: true })
    row[w].screenshot = shot
  }
  const libRow = lib[ref].rows.find(r => (r.finalUrl || r.url) === url)
  row.libraryRow = libRow ? libRow.id : 'missing'
  row.unchanged = libRow ? libRow.title === row[1440].title : null
  results.push(row)
  console.log(ref, url, 'lib', row.libraryRow, 'unchanged', row.unchanged, 'pag', row[1440].pagItems.length, 'more', row[1440].more.length, 'overflow390', row[390].overflow)
}
writeFileSync(D + 'gr7-exec-3f.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 1))
await browser.close()
