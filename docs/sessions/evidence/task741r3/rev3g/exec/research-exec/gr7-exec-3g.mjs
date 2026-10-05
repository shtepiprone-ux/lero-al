// Task 741 Rev 3g — GR-7 live check (execution, Sonnet): paginator page numbers per width and the keyboard focus ring.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3g/exec/research-exec/'
const PAGES = [['kamr', 'https://kamr-vite.vercel.app/ui-pagination'], ['tailadmin', 'https://demo.tailadmin.com/pagination'], ['lahomes', 'https://techzaa.in/lahomes/admin/ui-pagination.html']]
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
let kamrIn = false, i = 0
const out = []
for (const [ref, url] of PAGES) for (const w of [1440, 390]) {
  await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 })
  await page.goto(url, { waitUntil: 'load', timeout: 40000 }).catch(() => null)
  if (ref === 'kamr' && !kamrIn) {
    kamrIn = true; await page.waitForTimeout(2000)
    await page.locator('input[type=email]').first().fill('demo@example.com').catch(() => null)
    await page.locator('input[type=password]').first().fill('123456').catch(() => null)
    await page.locator('button[type=submit]').first().click().catch(() => null)
    await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null)
    await page.goto(url, { waitUntil: 'load' }).catch(() => null)
  }
  await page.waitForTimeout(1500)
  const info = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
    const pag = [...document.querySelectorAll('[class*="pagination" i], nav[aria-label*="pag" i], ul.pagination')].filter(vis)[0]
    const items = pag ? [...pag.querySelectorAll('a, button, li')].filter(vis).map(e => (e.textContent || e.getAttribute('aria-label') || '').trim()).filter(Boolean) : []
    const text = pag ? pag.innerText.replace(/\s+/g, ' ').slice(0, 80) : ''
    return { items: [...new Set(items)].slice(0, 12), text, overflow: document.documentElement.scrollWidth > innerWidth }
  })
  // keyboard focus: Tab until a control inside the paginator is focused, then record outline/box-shadow
  let focus = null
  const sel = '[class*="pagination" i] a, [class*="pagination" i] button'
  const first = page.locator(sel).filter({ hasText: /^2$/ }).first()
  if (await first.count()) { await first.focus().catch(() => null); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); focus = await page.evaluate(() => { const e = document.activeElement, s = getComputedStyle(e); return { tag: e.tagName, text: (e.textContent || '').trim().slice(0, 12), outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor} off ${s.outlineOffset}`, shadow: s.boxShadow.slice(0, 80) } }) }
  const shot = `exec-${String(i++).padStart(2, '0')}-${ref}-${w}.png`
  await page.screenshot({ path: D + shot, fullPage: true })
  out.push({ ref, url, w, ...info, focus, shot })
  console.log(ref, w, JSON.stringify(info.items), 'overflow', info.overflow, 'focus', JSON.stringify(focus))
}
writeFileSync(D + 'gr7-exec-3g.json', JSON.stringify(out, null, 1))
await browser.close()
