// Task 857 Revision 2: four-side edge gaps (GR-3d) of the content root of each changed Story.
import fs from 'node:fs'
import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:6090'
const IDS = [
  ['patterns-mantine-adminlistingsview--default', '[data-testid="admin-listings-table"]'],
  ['patterns-mantine-adminlistingsview--visible-filter', '[data-testid="admin-listings-table"]'],
  ['patterns-mantine-adminlistingsview--hidden-eligible', '[data-testid="admin-listings-table"]'],
  ['patterns-mantine-adminlistingsview--paginated', '[data-testid="admin-listings-table"]'],
  ['patterns-mantine-admintable--wrapped-title-column', '[data-testid="admin-table"]'],
]
const b = await chromium.launch(); const p = await b.newPage(); const out = []
for (const [id, sel] of IDS) for (const w of [320, 390, 1024, 1440]) {
  await p.setViewportSize({ width: w, height: 900 })
  await p.goto(`${BASE}/iframe.html?id=${id}&globals=locale:en&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await p.waitForSelector(sel, { timeout: 30000 }); await p.waitForTimeout(400)
  out.push({ id, w, ...(await p.evaluate(sel => {
    const r = document.querySelector(sel).getBoundingClientRect(); const vw = window.innerWidth
    const docH = document.documentElement.scrollHeight
    return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(vw - r.right), bottom: Math.round(docH - (r.bottom + window.scrollY)), rootW: Math.round(r.width), vw }
  }, sel)) })
}
fs.writeFileSync('docs/sessions/evidence/task857/59c-gutters-r2.json', JSON.stringify(out, null, 1))
for (const r of out) console.log(r.id.replace('patterns-mantine-', ''), r.w, `${r.top}/${r.right}/${r.bottom}/${r.left}`, 'rootW', r.rootW)
await b.close()
