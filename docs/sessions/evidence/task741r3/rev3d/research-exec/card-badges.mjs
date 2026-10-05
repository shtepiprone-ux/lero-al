// Task 741 R3d — card-level status badges on the two real-estate references (own session).
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const pages = [['lahomes-grid', 'https://techzaa.in/lahomes/admin/property-grid.html'], ['lahomes-list', 'https://techzaa.in/lahomes/admin/property-list.html'], ['omah-list', 'https://omah.dexignzone.com/xhtml/property-list.html']]
const b = await chromium.launch(); const p = await b.newPage(); const out = {}
for (const [id, url] of pages) for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: 844 }); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500)
  out[`${id}@${w}`] = await p.evaluate(() => [...document.querySelectorAll('.card span, .card a, .card div, .card label, .card small')].filter(e => e.children.length === 0 && /^(for (sale|rent)|sold|rented|new|featured|pending|active|inactive)/i.test(e.textContent.trim())).slice(0, 4).map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { text: e.textContent.trim(), pos: s.position, fs: s.fontSize, fw: s.fontWeight, radius: s.borderTopLeftRadius, bg: s.backgroundColor, color: s.color, h: Math.round(r.height) } }))
  console.log(id, w, JSON.stringify(out[`${id}@${w}`].slice(0, 2)))
}
writeFileSync('card-badges.json', JSON.stringify(out, null, 1)); await b.close()
