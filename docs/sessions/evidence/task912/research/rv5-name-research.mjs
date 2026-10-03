// GR-7 research for Task 912 Revision 5 (review 5): how the references render a person's name beside an avatar —
// truncated with an ellipsis, or wrapped. Per page: every element with text-overflow: ellipsis and every heading-like
// name element next to an <img>, with its white-space and whether its text is cut (scrollWidth > clientWidth).
import fs from 'node:fs'
import { chromium } from 'playwright'

const dir = 'docs/sessions/evidence/task912/research'
const pages = [
  'https://techzaa.in/lahomes/admin/agents-grid.html',
  'https://techzaa.in/lahomes/admin/agents-list.html',
  'https://techzaa.in/lahomes/admin/agents-details.html',
  'https://techzaa.in/lahomes/admin/property-details.html',
  'https://techzaa.in/lahomes/admin/customers-grid.html',
  'https://demo.tailadmin.com/profile.html',
]
const b = await chromium.launch()
const out = []
for (const w of [1440, 375]) {
  const p = await b.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1 })
  for (const u of pages) {
    await p.goto(u, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    await p.waitForTimeout(1200)
    const r = await p.evaluate(() => {
      const ellipsis = []
      const names = []
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        const t = (el.textContent || '').trim()
        if (!t || el.getBoundingClientRect().width === 0) continue
        if (cs.textOverflow === 'ellipsis' && cs.overflow !== 'visible') ellipsis.push({ t: t.slice(0, 40), cut: el.scrollWidth > el.clientWidth })
        if (el.children.length === 0 && /^(h[1-6]|a|p|span)$/i.test(el.tagName) && /^[A-Z][a-z]+ [A-Z][a-z]+/.test(t) && t.length < 40) {
          const box = el.closest('div')
          if (box && box.parentElement && box.parentElement.querySelector('img')) names.push({ t, ws: cs.whiteSpace, to: cs.textOverflow, cut: el.scrollWidth > el.clientWidth })
        }
      }
      return { ellipsis: ellipsis.slice(0, 8), names: names.slice(0, 6) }
    })
    out.push({ w, u, ...r })
    if (w === 375) await p.screenshot({ path: `${dir}/rv5-${u.split('/').pop().replace('.html', '')}-375.png` }).catch(() => {})
  }
  await p.close()
}
await b.close()
fs.writeFileSync(`${dir}/rv5-name-research.json`, JSON.stringify(out, null, 2))
for (const o of out) console.log(o.w, o.u.split('/').pop(), 'ellipsis:', JSON.stringify(o.ellipsis), 'names:', JSON.stringify(o.names))
