// Lahomes /property-grid: is the "Sold" property card, its label or its photo faded? (review of 741 R70)
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3j/review/research-review/'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('https://techzaa.in/lahomes/admin/property-grid.html', { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(1500)
const h = await p.evaluateHandle(() => [...document.querySelectorAll('span,div')].find(e => e.textContent.trim() === 'Sold' && getComputedStyle(e).position === 'absolute'))
const r = await h.evaluate(s => {
  const eff = e => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o }
  const card = s.closest('.card'); s.scrollIntoView({ block: 'center' }); const img = card.querySelector('img')
  return { labelClass: s.className, labelBg: getComputedStyle(s).backgroundColor, labelRadius: getComputedStyle(s).borderTopLeftRadius, labelOpacity: eff(s), imgOpacity: eff(img), imgFilter: getComputedStyle(img).filter, cardOpacity: getComputedStyle(card).opacity, cardFilter: getComputedStyle(card).filter }
})
await (await h.evaluateHandle(s => s.closest('.card'))).asElement().screenshot({ path: D + 'shots/s2-lahomes-sold-card-1440.png' })
console.log(JSON.stringify(r))
await writeFile(D + 'lahomes-sold-s2.json', JSON.stringify(r, null, 1) + '\n')
await b.close()
