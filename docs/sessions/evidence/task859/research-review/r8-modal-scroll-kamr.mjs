// Task 859 review 8 (Opus) — GR-7 live, Kamr: log in (demo@example.com / 123456), open /ui-modal, list its modal
// variants, and at 1440x420 and 390x420 open every trigger whose label mentions "scroll" or "long content"; record the scrolling
// element and whether the header/footer are inside it. Output: r8-modal-scroll-kamr.json + screenshots.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const DIR = path.dirname(fileURLToPath(import.meta.url))
const browser = await chromium.launch()
const results = []
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 420 } }); const page = await ctx.newPage()
  await page.goto('https://kamr-vite.vercel.app/login', { waitUntil: 'networkidle', timeout: 60000 })
  await page.locator('input[type="email"]').first().fill('demo@example.com').catch(() => null)
  await page.locator('input[type="password"]').first().fill('123456').catch(() => null)
  await page.locator('button[type="submit"]').first().click().catch(() => null)
  await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null)
  await page.goto('https://kamr-vite.vercel.app/ui-modal', { waitUntil: 'networkidle', timeout: 60000 })
  const triggers = await page.locator('button').evaluateAll(els => els.map(e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean))
  results.push({ w, finalUrl: page.url(), triggers: [...new Set(triggers)].slice(0, 40), scrollableClasses: await page.evaluate(() => document.querySelectorAll('.modal-dialog-scrollable').length) })
  const scrollBtns = page.locator('button').filter({ hasText: /scroll|long content/i })
  const n = await scrollBtns.count()
  for (let i = 0; i < n; i++) {
    const b = scrollBtns.nth(i); if (!(await b.isVisible())) continue
    const label = (await b.textContent()).trim()
    await b.scrollIntoViewIfNeeded(); await b.click(); await page.waitForTimeout(1000)
    const m = await page.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' }
      const dlg = [...document.querySelectorAll('.modal.show .modal-content, [role=dialog]')].filter(vis).pop()
      if (!dlg) return { opened: false }
      const header = dlg.querySelector('.modal-header, h5, h4'); const footer = dlg.querySelector('.modal-footer')
      const all = [dlg, ...dlg.querySelectorAll('*')]; for (let el = dlg.parentElement; el && el !== document.documentElement; el = el.parentElement) all.push(el)
      return { opened: true, scrollers: all.filter(el => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(el => ({ cls: el.className.toString().slice(0, 70), clientH: el.clientHeight, scrollH: el.scrollHeight, holdsHeader: !!header && el.contains(header), holdsFooter: !!footer && el.contains(footer) })) }
    })
    const shot = `r8-modal-scroll-kamr-${w}-${i}.png`; await page.screenshot({ path: path.join(DIR, shot) })
    results.push({ w, trigger: label, shot, ...m })
    await page.keyboard.press('Escape'); await page.waitForTimeout(600)
  }
  await ctx.close()
}
await browser.close()
fs.writeFileSync(path.join(DIR, 'r8-modal-scroll-kamr.json'), JSON.stringify({ checkedAt: new Date().toISOString(), platform: process.platform, node: process.version, results }, null, 1))
for (const r of results) console.log(JSON.stringify(r).slice(0, 900))
