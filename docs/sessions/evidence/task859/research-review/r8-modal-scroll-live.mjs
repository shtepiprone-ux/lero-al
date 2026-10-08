// Task 859 review 8 (Opus) — GR-7 live research for the owner's "scroll only the content, never the header or footer"
// return. Opens the modal demo page of each reference, operates every trigger whose label mentions scroll(ing) (plus
// every trigger on TailAdmin /modals), and records which element scrolls and whether the header/footer sit inside it.
// 1440x900 and 390x844. Output: r8-modal-scroll-live.json + r8-modal-scroll-<ref>-<w>-<n>.png
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const DIR = path.dirname(fileURLToPath(import.meta.url))
const PAGES = [
  ['lahomes', 'https://techzaa.in/lahomes/admin/ui-modal.html'],
  ['kamr', 'https://kamr-vite.vercel.app/ui-modal'],
  ['omah', 'https://omah.dexignzone.com/xhtml/ui-modal.html'],
  ['tailadmin', 'https://demo.tailadmin.com/modals'],
]
const measure = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05 }
  const dlg = [...document.querySelectorAll('.modal.show .modal-content, [role=dialog], .modal-content')].filter(vis).pop()
  if (!dlg) return null
  const header = dlg.querySelector('.modal-header, h1, h2, h3, h4, h5')
  const footer = dlg.querySelector('.modal-footer') ?? [...dlg.querySelectorAll('button')].filter(vis).pop()
  const chain = []
  for (let el = dlg; el && el !== document.body; el = el.parentElement) chain.push(el)
  const cands = [...chain, ...dlg.querySelectorAll('*')]
  const scrollers = cands.filter(el => /(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1 && vis(el)).map(el => ({
    cls: el.className.toString().slice(0, 60), clientH: el.clientHeight, scrollH: el.scrollHeight,
    holdsHeader: !!header && el.contains(header), holdsFooter: !!footer && el.contains(footer),
  }))
  return { radius: getComputedStyle(dlg).borderTopRightRadius, scrollers }
}
const browser = await chromium.launch()
const results = []
for (const [ref, url] of PAGES) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      const triggers = await page.locator('button, a').evaluateAll(els => els.map((e, i) => ({ i, t: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60), modal: !!(e.getAttribute('data-bs-toggle') === 'modal' || e.getAttribute('data-toggle') === 'modal' || /open|modal|launch/i.test(e.textContent || '')) })))
      const wanted = triggers.filter(t => ref === 'tailadmin' ? /open|modal/i.test(t.t) : /scroll/i.test(t.t))
      let n = 0
      for (const t of wanted.slice(0, 8)) {
        const loc = page.locator('button, a').nth(t.i)
        if (!(await loc.isVisible().catch(() => false))) continue
        await loc.click({ timeout: 5000 }).catch(() => null)
        await page.waitForTimeout(900)
        const m = await page.evaluate(measure)
        const shot = `r8-modal-scroll-${ref}-${w}-${n++}.png`
        await page.screenshot({ path: path.join(DIR, shot) })
        results.push({ ref, url, w, trigger: t.t, shot, ...(m ?? { opened: false }) })
        await page.keyboard.press('Escape'); await page.waitForTimeout(500)
        const closeBtn = page.locator('.modal.show [data-bs-dismiss=modal], .modal.show .btn-close, [role=dialog] button[aria-label*=lose]').first()
        if (await closeBtn.isVisible().catch(() => false)) { await closeBtn.click().catch(() => null); await page.waitForTimeout(500) }
      }
      if (!wanted.length) results.push({ ref, url, w, note: 'no scroll trigger found', triggers: triggers.filter(t => t.modal).slice(0, 15).map(t => t.t) })
    } catch (e) { results.push({ ref, url, w, error: String(e.message).slice(0, 160) }) }
    await ctx.close()
  }
}
await browser.close()
fs.writeFileSync(path.join(DIR, 'r8-modal-scroll-live.json'), JSON.stringify({ checkedAt: new Date().toISOString(), platform: process.platform, node: process.version, results }, null, 1))
for (const r of results) console.log(r.ref, r.w, r.trigger ?? r.note ?? r.error, JSON.stringify(r.scrollers ?? r.triggers ?? ''))
