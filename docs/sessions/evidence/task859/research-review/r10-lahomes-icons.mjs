// Review 10 (Opus), GR-7: owner asks why icons in Lahomes property-grid listing chips are legible. Measures the
// icon element, its library/name, rendered size, colour and the chip around it at 1440 and 390, DPR 1 and 2 crops.
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const DIR = path.dirname(fileURLToPath(import.meta.url))
const URL = 'https://techzaa.in/lahomes/admin/property-grid.html'
const out = { platform: process.platform, node: process.version, url: URL, runs: [] }
const browser = await chromium.launch()
for (const [w, h, dpr] of [[1440, 900, 1], [1440, 900, 2], [390, 844, 2]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  const data = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('iconify-icon, i[class*="ri-"], i[class*="bx"], svg')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.top < 1400 && el.closest('.card') })
    return icons.slice(0, 40).map(el => {
      const r = el.getBoundingClientRect(); const s = getComputedStyle(el)
      const host = el.parentElement; const hs = getComputedStyle(host)
      return { tag: el.tagName.toLowerCase(), icon: el.getAttribute('icon') ?? el.className?.baseVal ?? el.className, w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        color: s.color, fontSize: s.fontSize, hostTag: host.tagName.toLowerCase(), hostClass: String(host.className).slice(0, 80), hostBg: hs.backgroundColor, hostText: host.textContent.trim().slice(0, 40), x: Math.round(r.x), y: Math.round(r.y) }
    })
  })
  const shot = `r10-lahomes-grid-${w}-dpr${dpr}.png`
  await page.screenshot({ path: path.join(DIR, shot), clip: { x: 0, y: 0, width: w, height: Math.min(h, 900) } })
  out.runs.push({ w, h, dpr, status: resp?.status(), icons: data, shot })
  await page.close()
}
await browser.close()
fs.writeFileSync(path.join(DIR, 'r10-lahomes-icons.json'), JSON.stringify(out, null, 1))
console.log(JSON.stringify(out.runs.map(r => ({ w: r.w, dpr: r.dpr, status: r.status, n: r.icons.length, sample: r.icons.slice(0, 12) })), null, 1))
