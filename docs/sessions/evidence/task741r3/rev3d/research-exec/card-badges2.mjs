// Task 741 R3d — for each status-like label: is it inside a photo box, filled or tinted, sizes.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const pages = [['lahomes-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'], ['lahomes-list', 'https://techzaa.in/lahomes/admin/property-list.html'], ['omah-list', 'https://omah.dexignzone.com/xhtml/property-list.html']]
const b = await chromium.launch(); const p = await b.newPage(); const out = {}
for (const [id, url] of pages) for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: 844 }); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1800)
  out[`${id}@${w}`] = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map(i => i.getBoundingClientRect()).filter(r => r.width > 60 && r.height > 40)
    return [...document.querySelectorAll('span,a,div,label,small,p')].filter(e => e.children.length === 0 && /^(for (sale|rent)|sold|rented|new|featured|pending|active|inactive|sale|rent)$/i.test(e.textContent.trim()) && e.getBoundingClientRect().width > 0).slice(0, 6).map(e => {
      const s = getComputedStyle(e); const r = e.getBoundingClientRect()
      const onPhoto = imgs.some(i => r.left >= i.left - 2 && r.right <= i.right + 2 && r.top >= i.top - 2 && r.bottom <= i.bottom + 2)
      return { text: e.textContent.trim(), tag: e.tagName, cls: String(e.className).slice(0, 40), onPhoto, pos: s.position, fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color, pad: s.padding, h: Math.round(r.height) }
    })
  })
  console.log(id, w, out[`${id}@${w}`].length, JSON.stringify(out[`${id}@${w}`].slice(0, 2)))
}
writeFileSync('card-badges2.json', JSON.stringify(out, null, 1)); await b.close()
