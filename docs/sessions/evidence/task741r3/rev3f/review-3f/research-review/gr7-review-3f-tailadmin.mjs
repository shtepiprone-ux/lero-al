// Task 741 review of Revision 3f — TailAdmin /pagination and /products-list paginators (Tailwind markup, no
// "pagination" class): page items, control size, and the keyboard focus ring of page "2" with its clipping ancestor.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3f/review-3f/research-review/'
const browser = await chromium.launch()
const out = {}
for (const url of ['https://demo.tailadmin.com/pagination', 'https://demo.tailadmin.com/products-list']) for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null)
  await page.waitForTimeout(2000)
  const key = `${url.split('/').pop()}@${w}`
  out[key] = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
    const btns = [...document.querySelectorAll('button, a')].filter(vis)
    const groups = new Map()
    for (const b of btns) { const t = b.textContent.trim(); if (/^(\d+|Previous|Next|\.\.\.)$/.test(t) || (!t && b.querySelector('svg') && /prev|next|arrow/i.test(b.outerHTML))) { const p = b.closest('div'); const gp = p.parentElement?.closest('div') || p; const k = gp; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b) } }
    const texts = [...document.querySelectorAll('span, p, div')].filter(vis).filter(e => /^Page \d+ of \d+$/.test(e.textContent.trim()) && !e.children.length).map(e => e.textContent.trim())
    return { pageText: texts, paginators: [...groups.values()].filter(g => g.length >= 3).map(g => ({ items: g.map(b => b.textContent.trim() || 'icon').join(' '), ctrl: (() => { const r = g[1].getBoundingClientRect(), s = getComputedStyle(g[1]); return { w: Math.round(r.width), h: Math.round(r.height), radius: s.borderTopLeftRadius } })() })) }
  })
  const two = page.locator('button:text-is("2"), a:text-is("2")').first()
  if (await two.count() && await two.isVisible().catch(() => false)) {
    await two.scrollIntoViewIfNeeded(); await two.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    out[key].focus = await page.evaluate(() => {
      const a = document.activeElement, q = a.getBoundingClientRect(), s = getComputedStyle(a)
      let clip = null
      for (let p = a.parentElement; p && p !== document.body; p = p.parentElement) { const ps = getComputedStyle(p); if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') { const r = p.getBoundingClientRect(); clip = { cls: String(p.className).slice(0, 60), overflow: ps.overflow, roomPx: { top: q.top - r.top, bottom: r.bottom - q.bottom, left: q.left - r.left, right: r.right - q.right } }; break } }
      return { text: a.textContent.trim(), outline: `${s.outlineStyle} ${s.outlineWidth} offset ${s.outlineOffset}`, boxShadow: s.boxShadow.slice(0, 90), clip }
    })
    const box = await two.boundingBox()
    await page.screenshot({ path: D + `rv-tailadmin-${key.replace('@', '-')}-focus.png`, clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 16), width: 220, height: box.height + 32 } })
  }
  await page.screenshot({ path: D + `rv-tailadmin-${key.replace('@', '-')}-pager.png`, fullPage: true })
  await page.close()
}
await browser.close()
await writeFile(D + 'gr7-review-3f-tailadmin.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1))
