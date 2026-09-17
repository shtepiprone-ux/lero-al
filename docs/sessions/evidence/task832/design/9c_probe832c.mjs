// Task 832 design probe C: does Chromium's elementFromPoint return null for a fractional point
// just inside the bottom viewport edge (cy in [innerHeight-1, innerHeight))?
import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(path.join(process.argv[2], 'package.json'))
const { chromium } = require('playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 320, height: 812 } })
await page.setContent('<html><body style="margin:0;height:3000px;background:#eee"><div id="t" style="position:absolute;left:0;top:0;width:320px;height:3000px"></div></body></html>')
const r = await page.evaluate(() => {
  const out = []
  for (const cy of [810.5, 811, 811.25, 811.5, 811.75, 811.9, 811.99, 812, 812.01]) {
    const el = document.elementFromPoint(160, cy)
    out.push({ cy, innerHeight, clientHeight: document.documentElement.clientHeight, dpr: devicePixelRatio, vv: visualViewport && visualViewport.height, hit: el ? el.id || el.tagName : null })
  }
  return out
})
console.log(JSON.stringify(r))
await browser.close()
