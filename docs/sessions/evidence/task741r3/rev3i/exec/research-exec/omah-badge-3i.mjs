import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const b = await chromium.launch(); const p = await b.newPage(); const out = {}
for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: 844 }); await p.goto('https://omah.dexignzone.com/xhtml/property-list.html', { waitUntil: 'load' }); await p.waitForTimeout(2500)
  out[w] = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map(i => i.getBoundingClientRect()).filter(r => r.width > 60 && r.height > 40)
    return [...document.querySelectorAll('[class*=badge],[class*=label]')].filter(e => /for (rent|sale)/i.test(e.textContent) && e.children.length === 0 && e.getBoundingClientRect().width > 0).slice(0, 4).map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), cls: String(e.className).slice(0, 50), onPhoto: imgs.some(i => r.left >= i.left - 2 && r.right <= i.right + 2 && r.top >= i.top - 2 && r.bottom <= i.bottom + 2), pos: s.position, fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color, h: Math.round(r.height) } })
  })
  console.log(w, JSON.stringify(out[w]))
}
writeFileSync('omah-badge-3i.json', JSON.stringify(out, null, 1)); await b.close()
