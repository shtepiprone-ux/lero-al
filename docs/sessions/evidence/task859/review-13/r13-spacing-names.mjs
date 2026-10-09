import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const ids = process.argv.slice(2)
const widths = [320,375,390,480,560,680,767,768,810,960,1024,1200,1440,1920]
const locales = ['uk','en','sq','it']
const b = await chromium.launch()
const out = []
for (const id of ids) for (const loc of locales) for (const w of widths) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  await p.goto(`http://localhost:6111/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  const r = await p.evaluate(() => {
    const vis = el => { const s = getComputedStyle(el); const rc = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && rc.width > 0 && rc.height > 0 }
    // 1) badges: vertical gap to the nearest text block above them inside the same card / cell
    const badges = [...document.querySelectorAll('.mantine-Badge-root')].filter(vis)
    const gaps = []
    for (const bd of badges) {
      const br = bd.getBoundingClientRect()
      const card = bd.closest('[class*="Card-root"], td, [class*="Paper-root"]')
      if (!card) continue
      // text elements in the same card that end above the badge and overlap horizontally
      const texts = [...card.querySelectorAll('p, div, span, a')].filter(e => vis(e) && !e.closest('.mantine-Badge-root') && !e.contains(bd) && e.children.length === 0 && e.textContent.trim())
      let best = null
      for (const t of texts) { const tr = t.getBoundingClientRect(); if (tr.bottom <= br.top + 1 && tr.right > br.left && tr.left < br.right) { const g = br.top - tr.bottom; if (best === null || g < best.g) best = { g, txt: t.textContent.trim().slice(0, 30) } } }
      if (best) gaps.push({ badge: bd.textContent.trim().slice(0, 20), gap: Math.round(best.g * 10) / 10, above: best.txt, inTable: !!bd.closest('td') })
    }
    // 2) user names: links to /admin/users/<id> that are clipped
    const names = [...document.querySelectorAll('a[href*="/admin/users/"]')].filter(vis).map(a => {
      const s = getComputedStyle(a)
      return { name: a.textContent.trim(), clipped: a.scrollWidth > a.clientWidth + 1 || a.scrollHeight > a.clientHeight + 1, clamp: s.webkitLineClamp, ws: s.whiteSpace, w: Math.round(a.getBoundingClientRect().width) }
    })
    return { gaps, names }
  })
  out.push({ id, loc, w, minGap: r.gaps.length ? Math.min(...r.gaps.map(g => g.gap)) : null, gaps: r.gaps, clippedNames: r.names.filter(n => n.clipped), names: r.names.length })
  await p.close()
}
await b.close()
console.log(JSON.stringify(out, null, 1))
