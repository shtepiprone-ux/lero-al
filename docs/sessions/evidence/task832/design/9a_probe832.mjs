// Task 832 design probe: /it footer "Chi siamo" null hit — viewport bounds vs overflow.
import { createRequire } from 'node:module'
import path from 'node:path'
const ROOT = process.argv[2]
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const base = 'http://localhost:3000'
const browser = await chromium.launch()
const out = []
for (const loc of ['it', 'en', 'sq', 'uk']) {
  for (const vp of [{ w: 320, h: 812 }, { w: 375, h: 812 }, { w: 390, h: 844 }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
    await page.goto(`${base}/${loc}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    const r = await page.evaluate(() => {
      const de = document.documentElement
      const res = { innerW: innerWidth, innerH: innerHeight, clientW: de.clientWidth, clientH: de.clientHeight, scrollW: de.scrollWidth, scrollH: de.scrollHeight, offenders: [], nullHits: [] }
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect()
        if (b.right > de.clientWidth + 1 && b.width > 0) {
          let p = el.parentElement, clipped = false
          while (p && p !== document.body) { const s = getComputedStyle(p); if (['hidden', 'auto', 'scroll', 'clip'].includes(s.overflowX)) { clipped = true; break } p = p.parentElement }
          if (!clipped) res.offenders.push({ tag: el.tagName, cls: String(el.className).slice(0, 80), right: +b.right.toFixed(1), text: (el.textContent || '').trim().slice(0, 40) })
        }
      }
      res.offenders = res.offenders.slice(0, 8)
      // band scan over footer links like the gate does: scroll so each link's centre is in the last 20px band
      const links = [...document.querySelectorAll('footer a')]
      for (const a of links) {
        a.scrollIntoView({ block: 'end' })
        const b = a.getBoundingClientRect()
        const cx = b.x + b.width / 2, cy = b.y + b.height / 2
        if (cy < innerHeight && cy >= de.clientHeight) res.nullHits.push({ text: a.textContent.trim(), cy: +cy.toFixed(2), hit: !!document.elementFromPoint(cx, cy) })
      }
      return res
    })
    out.push({ loc, ...vp, ...r })
    await page.close()
  }
}
await browser.close()
for (const o of out) console.log(JSON.stringify(o))
