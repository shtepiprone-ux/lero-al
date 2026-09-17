// Task 832 design probe B: replay the gate's band offsets and report candidates whose centre falls in
// the last pixel row of the viewport, with raw (unrounded) geometry and elementFromPoint result.
import { createRequire } from 'node:module'
import path from 'node:path'
const ROOT = process.argv[2]
const require = createRequire(path.join(ROOT, 'package.json'))
const { chromium } = require('playwright')
const browser = await chromium.launch()
const SEL = 'a, button, [role="button"], input, select'
for (const loc of ['sq', 'en', 'uk', 'it']) for (const vp of [{ w: 320, h: 812 }, { w: 375, h: 812 }, { w: 390, h: 844 }]) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } })
  await page.goto(`http://localhost:3000/${loc}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const { ih, max } = await page.evaluate(() => ({ ih: innerHeight, max: Math.max(0, document.documentElement.scrollHeight - innerHeight) }))
  const offsets = [0]; for (let o = ih; o < max; o += ih) offsets.push(o); if (max > 0) offsets.push(max)
  const edge = []
  for (const o of offsets) {
    await page.evaluate((y) => window.scrollTo(0, y), o)
    await page.waitForTimeout(150)
    edge.push(...await page.evaluate(({ SEL, o }) => {
      const r = []
      for (const el of document.querySelectorAll(SEL)) {
        const b = el.getBoundingClientRect(); if (b.width <= 0 || b.height <= 0) continue
        const cx = b.x + b.width / 2, cy = b.y + b.height / 2
        if (cy >= innerHeight - 1 && cy < innerHeight) r.push({ scrollY: scrollY, requested: o, text: (el.textContent || '').trim().slice(0, 24), y: b.y, h: b.height, cy, hit: !!document.elementFromPoint(cx, cy), hitFloor: !!document.elementFromPoint(cx, Math.floor(cy)) })
      }
      return r
    }, { SEL, o }))
  }
  console.log(JSON.stringify({ loc, ...vp, offsets, edge }))
  await page.close()
}
await browser.close()

