// Task 859 review 13 — GR-3h object gaps and GR-3i cut names, on the built Storybook (served at :6111).
// Usage: W=390,767 L=uk OUT=out.jsonl node measure-par.mjs ids.txt|<story ids...>
import fs from 'node:fs'
import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const arg = process.argv[2]
const ids = arg.endsWith('.txt') ? fs.readFileSync(arg, 'utf8').split(/\s+/).filter(Boolean) : process.argv.slice(2)
const widths = (process.env.W || '390,767').split(',').map(Number)
const locales = (process.env.L || 'uk').split(',')
const outFile = process.env.OUT
fs.writeFileSync(outFile, '')
const jobs = []
for (const id of ids) for (const loc of locales) for (const w of widths) jobs.push({ id, loc, w })

function probe() {
  const vis = el => { const s = getComputedStyle(el); const rc = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && rc.width > 0 && rc.height > 0 }
  const badges = [...document.querySelectorAll('.mantine-Badge-root')].filter(vis)
  const gaps = []
  for (const bd of badges) {
    const br = bd.getBoundingClientRect()
    const card = bd.closest('[class*="Card-root"], td, [class*="Paper-root"]')
    if (!card) continue
    const texts = [...card.querySelectorAll('p, div, span, a')].filter(e => vis(e) && !e.closest('.mantine-Badge-root') && !e.contains(bd) && e.children.length === 0 && e.textContent.trim())
    const others = [...card.querySelectorAll('.mantine-Badge-root')].filter(o => o !== bd && vis(o))
    let best = null
    for (const t of [...texts, ...others]) {
      const tr = t.getBoundingClientRect()
      let g = null, axis = null
      if (tr.bottom <= br.top + 1 && tr.right > br.left && tr.left < br.right) { g = br.top - tr.bottom; axis = 'v' }
      else if (tr.right <= br.left + 1 && tr.bottom > br.top && tr.top < br.bottom) { g = br.left - tr.right; axis = 'h' }
      if (g !== null && (best === null || g < best.g)) best = { g, axis, txt: t.textContent.trim().slice(0, 30) }
    }
    if (best) gaps.push({ badge: bd.textContent.trim().slice(0, 20), gap: Math.round(best.g * 10) / 10, axis: best.axis, above: best.txt, inTable: !!bd.closest('td') })
  }
  const names = [...document.querySelectorAll('a[href*="/admin/users/"], [data-testid="agent-detail-link"]')].filter(vis).map(a => {
    const t = a.querySelector('p,span,div') || a
    const s = getComputedStyle(t)
    return { name: a.textContent.trim(), clipped: t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1 || s.textOverflow === 'ellipsis' && t.scrollWidth > t.clientWidth, clamp: s.webkitLineClamp }
  })
  return { gaps, names, error: document.body.classList.contains('sb-show-errordisplay') }
}

const b = await chromium.launch()
let next = 0, done = 0
async function worker() {
  const ctx = await b.newContext({ deviceScaleFactor: 1 })
  while (next < jobs.length) {
    const { id, loc, w } = jobs[next++]
    const p = await ctx.newPage()
    await p.setViewportSize({ width: w, height: 1400 })
    try {
      await p.goto(`http://localhost:6111/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load', timeout: 30000 })
      await p.waitForFunction(() => (document.querySelector('#storybook-root')?.children.length ?? 0) > 0 || document.body.classList.contains('sb-show-errordisplay'), null, { timeout: 15000 }).catch(() => {})
      await p.waitForTimeout(700)
      const r = await p.evaluate(probe)
      fs.appendFileSync(outFile, JSON.stringify({ id, loc, w, error: r.error, minGap: r.gaps.length ? Math.min(...r.gaps.map(g => g.gap)) : null, gaps: r.gaps, clippedNames: r.names.filter(n => n.clipped), names: r.names.length }) + '\n')
    } catch (e) {
      fs.appendFileSync(outFile, JSON.stringify({ id, loc, w, error: String(e).slice(0, 100) }) + '\n')
    }
    await p.close()
    done++
  }
  await ctx.close()
}
await Promise.all(Array.from({ length: 6 }, worker))
await b.close()
console.log('done', done)
