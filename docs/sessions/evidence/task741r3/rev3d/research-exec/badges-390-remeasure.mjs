// Task 741 Rev 3e (R45) — re-measure Lahomes 008 on-photo status badges at 390 and 1440 (own session, Sonnet).
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const b = await chromium.launch(); const p = await b.newPage(); const out = {}
for (const w of [390, 1440]) {
  await p.setViewportSize({ width: w, height: 844 })
  await p.goto('https://techzaa.in/lahomes/admin/property-grid.html', { waitUntil: 'load' }); await p.waitForTimeout(1800)
  out[w] = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map(i => i.getBoundingClientRect()).filter(r => r.width > 60 && r.height > 40)
    return [...document.querySelectorAll('span.badge')].filter(e => /^(for (sale|rent)|sold)$/i.test(e.textContent.trim())).slice(0, 4).map(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect()
      const onPhoto = imgs.some(i => r.left >= i.left - 2 && r.right <= i.right + 2 && r.top >= i.top - 2 && r.bottom <= i.bottom + 2)
      return { text: e.textContent.trim(), cls: String(e.className), onPhoto, fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, pad: s.padding, bg: s.backgroundColor, color: s.color, h: Math.round(r.height) }
    })
  })
  console.log(w, JSON.stringify(out[w]))
}
writeFileSync('badges-390-remeasure.json', JSON.stringify(out, null, 1)); await b.close()
