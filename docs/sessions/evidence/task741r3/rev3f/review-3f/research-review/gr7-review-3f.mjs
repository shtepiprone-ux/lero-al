// Task 741 — Opus review of Revision 3f, GR-7 live check (moment: review). Every reference page with a paginator that
// the subject relies on, at 1440 and 390: the visible page items, control size/radius/gap, document overflow, and the
// keyboard focus state of a page control (outline, and whether any overflow-clipping ancestor cuts the ring).
// Rozetka (owner link) runs headed Chrome, as in the 3e/3f precedent.
import { createRequire } from 'node:module'
import { writeFile, readFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3f/review-3f/research-review/'
const LIB = 'docs/research/references/2026-10-04/'
const PAGES = [
  ['tailadmin', 'https://demo.tailadmin.com/pagination'],
  ['tailadmin', 'https://demo.tailadmin.com/products-list'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/ui-pagination.html'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['kamr', 'https://kamr-vite.vercel.app/ui-pagination'],
  ['omah', 'https://omah.dexignzone.com/xhtml/property-list.html'],
  ['omah', 'https://omah.dexignzone.com/xhtml/order-list.html'],
  ['rozetka', 'https://rozetka.com.ua/ua/notebooks/c80004/'],
]
const SEL = 'rz-paginator, [class*="paginat" i], ul.pagination, nav[aria-label*="pag" i], .dataTables_paginate'
const probe = (SEL) => {
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const blocks = [...document.querySelectorAll(SEL)].filter(vis).filter(b => b.querySelectorAll('a, button').length >= 2)
  const top = blocks.filter(b => !blocks.some(o => o !== b && o.contains(b))).slice(0, 3)
  return {
    title: document.title, overflow: document.documentElement.scrollWidth > innerWidth + 1,
    paginators: top.map(b => {
      const items = [...b.querySelectorAll('a, button, span.page-link, li > span')].filter(vis).filter(e => !e.querySelector('a, button'))
      const s0 = items[0] && getComputedStyle(items[0]), r0 = items[0] && items[0].getBoundingClientRect(), r1 = items[1] && items[1].getBoundingClientRect()
      return { text: items.map(e => (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 12) || '·').join(' | '),
        n: items.length, ctrl: r0 ? { w: Math.round(r0.width), h: Math.round(r0.height), radius: s0.borderTopLeftRadius, fs: s0.fontSize } : null,
        gap: r0 && r1 ? Math.round(r1.left - r0.right) : null, blockW: Math.round(b.getBoundingClientRect().width) }
    }),
  }
}
const focusProbe = () => {
  const a = document.activeElement
  if (!a || a === document.body) return null
  const q = a.getBoundingClientRect(), s = getComputedStyle(a)
  const ext = (s.outlineStyle !== 'none' ? (parseFloat(s.outlineWidth) || 0) + (parseFloat(s.outlineOffset) || 0) : 0)
  let clip = null
  for (let p = a.parentElement; p && p !== document.body; p = p.parentElement) {
    const ps = getComputedStyle(p)
    if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') { const r = p.getBoundingClientRect(); clip = { tag: p.tagName.toLowerCase(), cls: String(p.className).slice(0, 50), overflow: ps.overflow, cutPx: { top: Math.max(0, r.top - (q.top - ext)), bottom: Math.max(0, q.bottom + ext - r.bottom), left: Math.max(0, r.left - (q.left - ext)), right: Math.max(0, q.right + ext - r.right) } }; break }
  }
  return { text: (a.textContent || '').trim().slice(0, 12), outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} offset ${s.outlineOffset}`, boxShadow: s.boxShadow.slice(0, 80), clip }
}
const lib = Object.fromEntries(['tailadmin', 'lahomes', 'kamr', 'omah'].map(r => [r, null]))
for (const r of Object.keys(lib)) { const a = JSON.parse(await readFile(LIB + `audit-${r}.json`, 'utf8')); lib[r] = a.rows || a }
const out = []
const headless = await chromium.launch()
const headed = await chromium.launch({ channel: 'chrome', headless: false, args: ['--disable-blink-features=AutomationControlled'] })
let kamrIn = false, i = 0
for (const [ref, url] of PAGES) {
  const row = { ref, url }
  const libRow = lib[ref]?.find(x => (x.finalUrl || x.url) === url)
  row.libraryRow = ref === 'rozetka' ? 'owner link, not in library' : libRow ? libRow.id : 'missing'
  for (const w of [1440, 390]) {
    const ctx = await (ref === 'rozetka' ? headed : headless).newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, locale: ref === 'rozetka' ? 'uk-UA' : 'en-US' })
    const page = await ctx.newPage()
    if (ref === 'rozetka') await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => undefined }))
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      if (ref === 'kamr') {
        await page.waitForTimeout(2500)
        if (await page.locator('input[type=email]').count()) {
          await page.locator('input[type=email]').first().fill('demo@example.com')
          await page.locator('input[type=password]').first().fill('123456')
          await page.locator('button[type=submit]').first().click()
          await page.waitForURL(u => !/login|sign/.test(String(u)), { timeout: 20000 }).catch(() => null)
          await page.goto(url, { waitUntil: 'domcontentloaded' })
        }
        kamrIn = true
      }
      await page.waitForTimeout(ref === 'rozetka' ? 8000 : 2500)
      for (let k = 0; k < 30; k++) { if (await page.locator(SEL).first().isVisible().catch(() => false)) break; await page.mouse.wheel(0, 900); await page.waitForTimeout(300) }
      await page.locator(SEL).first().scrollIntoViewIfNeeded().catch(() => null)
      await page.waitForTimeout(800)
      row[w] = await page.evaluate(probe, SEL)
      // keyboard focus on the first page control of the first paginator
      const target = page.locator(SEL).first().locator('a, button').nth(1)
      if (await target.count()) {
        await target.evaluate(e => { const p = e.previousElementSibling || e.parentElement?.previousElementSibling; e.scrollIntoView({ block: 'center' }) })
        await target.focus().catch(() => null)
        await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
        row[w].focus = await page.evaluate(focusProbe)
        const box = await target.boundingBox().catch(() => null)
        if (box) { const f = `rv-${String(i).padStart(2, '0')}-${ref}-${w}-focus.png`; await page.screenshot({ path: D + f, clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 20), width: Math.min(w - Math.max(0, box.x - 40), box.width + 200), height: box.height + 40 } }).catch(() => null); row[w].focusShot = f }
      }
      const shot = `rv-${String(i++).padStart(2, '0')}-${ref}-${w}.png`
      await page.screenshot({ path: D + shot, fullPage: ref !== 'rozetka' }).catch(() => null)
      row[w].screenshot = shot
    } catch (e) { row[w] = { error: String(e).slice(0, 200) } }
    await ctx.close()
  }
  out.push(row)
  console.log(ref, url, row.libraryRow)
  for (const w of [1440, 390]) { const v = row[w]; if (!v || v.error) { console.log('  ', w, 'ERROR', v?.error); continue } console.log('  ', w, v.overflow ? 'OVERFLOW' : 'no-overflow', v.paginators.map(p => `[${p.text}] ctrl ${p.ctrl?.w}x${p.ctrl?.h} r${p.ctrl?.radius} gap${p.gap}`).join(' || ')); if (v.focus) console.log('     focus', v.focus.text, v.focus.outline, '| shadow', v.focus.boxShadow, '| clip', JSON.stringify(v.focus.clip)) }
}
await headless.close(); await headed.close()
await writeFile(D + 'gr7-review-3f.json', JSON.stringify(out, null, 1) + '\n')
