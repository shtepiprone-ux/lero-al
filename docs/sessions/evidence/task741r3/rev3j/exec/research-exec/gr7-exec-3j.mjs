// Task 741 Revision 3j — GR-7 live check (Sonnet, executor): Lahomes /property-grid Sold card, TailAdmin /cards and /badge.
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3j/exec/research-exec/'
const b = await chromium.launch()
const out = { platform: process.platform, at: new Date().toISOString(), pages: {} }
const eff = `const eff = e => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return Math.round(o*100)/100 }`
for (const w of [1440, 390]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage()
  // Lahomes Sold card
  await p.goto('https://techzaa.in/lahomes/admin/property-grid.html', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null); await p.waitForTimeout(1500)
  await p.screenshot({ path: `${D}shots/lahomes-property-grid-${w}.jpg`, fullPage: true, type: 'jpeg', quality: 60 })
  out.pages[`lahomes@${w}`] = await p.evaluate(`(() => { ${eff}
    const s = [...document.querySelectorAll('span,div')].find(e => e.textContent.trim() === 'Sold' && getComputedStyle(e).position === 'absolute'); if (!s) return { found: false }
    const card = s.closest('.card'), img = card.querySelector('img'), cs = getComputedStyle(card)
    return { found: true, labelBg: getComputedStyle(s).backgroundColor, labelRadius: getComputedStyle(s).borderTopLeftRadius, labelOpacity: eff(s), imgOpacity: eff(img), imgFilter: getComputedStyle(img).filter, cardOpacity: eff(card), cardRadius: cs.borderTopLeftRadius, cardBorder: cs.borderTopWidth + ' ' + cs.borderTopColor } })()`)
  for (const [k, url, sel] of [['tailadmin-cards', 'https://demo.tailadmin.com/cards', '.rounded-xl.border'], ['tailadmin-badge', 'https://demo.tailadmin.com/badge', 'span.rounded-full']]) {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null); await p.waitForTimeout(2000)
    await p.screenshot({ path: `${D}shots/${k}-${w}.jpg`, fullPage: true, type: 'jpeg', quality: 60 })
    out.pages[`${k}@${w}`] = await p.evaluate(`(() => { ${eff}
      const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter(e => ${k === 'tailadmin-cards' ? 'e.querySelector("img")' : 'e.textContent.trim().length > 0'}).slice(0, 4)
      return els.map(e => { const s = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 24), radius: s.borderTopLeftRadius, border: s.borderTopWidth + ' ' + s.borderTopColor, bg: s.backgroundColor, effOpacity: eff(e), filter: s.filter } }) })()`)
  }
}
await b.close()
await writeFile(D + 'gr7-exec-3j.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out, null, 1).slice(0, 3500))
