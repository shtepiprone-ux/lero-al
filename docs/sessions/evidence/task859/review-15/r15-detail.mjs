// Task 859 review 15 (Opus) - which elements give the outliers of r15-matrix.jsonl (read-only).
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6636)
const b = await chromium.launch()
const JOBS = [['patterns-mantine-adminuserstable--default', 390], ['patterns-mantine-adminsupportview--default', 390], ['mantine-primitives-table--row-click', 1440], ['patterns-mantine-agentstatisticsview--activity-error', 390]]
for (const [id, w] of JOBS) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  await p.goto(`http://127.0.0.1:6636/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
  const o = await p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const rect = e => e.getBoundingClientRect(); const ctx = e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)
    const desc = e => `${e.tagName.toLowerCase()}.${[...e.classList].filter(c => c.startsWith('mantine-')).join('.')}`
    const out = { otherCards: [], badges: [], clip: [] }
    for (const c of [...document.querySelectorAll('.mantine-Card-root')].filter(vis)) {
      const st = c.querySelector(':scope > .mantine-Stack-root'); if (!st) continue
      if ([...st.children].some(k => k.matches('.mantine-Divider-root'))) {
        // record card: every badge's nearest leaf above, with the leaf described
        for (const bd of c.querySelectorAll('.mantine-Badge-root')) { if (!vis(bd)) continue; const br = rect(bd); let best = null, el = null
          for (const e of c.querySelectorAll('*')) { if (e.contains(bd) || bd.contains(e) || !vis(e)) continue; if (e.closest('svg') && !e.matches('svg')) continue; if (!(e.matches('svg,img,.mantine-Divider-root') || (!e.children.length && ctx(e)))) continue; const r = rect(e); if (r.bottom <= br.top + 0.5 && r.right > br.left && r.left < br.right) { const d = br.top - r.bottom; if (best == null || d < best) { best = d; el = e } } }
          if (best != null && Math.round(best) !== 12 && Math.round(best) !== 14) out.badges.push(`${Math.round(best)}px "${ctx(bd)}" <- ${desc(el)} "${ctx(el)}" | badge parent ${desc(bd.parentElement)} rowGap ${getComputedStyle(bd.parentElement).rowGap}`) }
        continue
      }
      const k = [...st.children].filter(vis); const g = []; for (let i = 1; i < k.length; i++) g.push(Math.round(rect(k[i]).top - rect(k[i - 1]).bottom))
      if (g.some(v => v !== Math.round(parseFloat(getComputedStyle(st).rowGap)))) out.otherCards.push({ rowGap: getComputedStyle(st).rowGap, gaps: g, kids: k.map(x => `${desc(x)} mt=${getComputedStyle(x).marginTop} mb=${getComputedStyle(x).marginBottom} h=${Math.round(rect(x).height)} "${ctx(x)}"`), card: ctx(c) })
    }
    for (const e of document.querySelectorAll('td *')) { if (!vis(e) || e.children.length) continue; const er = rect(e); for (let a = e.parentElement, i = 0; a && i < 8; a = a.parentElement, i++) { const as = getComputedStyle(a); if (/hidden|clip/.test(as.overflowX + as.overflowY)) { const ar = rect(a); if (er.right > ar.right + 0.5 || er.left < ar.left - 0.5) { out.clip.push(`"${ctx(e)}" clipped by ${desc(a)} ox=${as.overflowX} oy=${as.overflowY}; scroll ancestor between: ${(() => { for (let s = e.parentElement; s && s !== a; s = s.parentElement) { const ss = getComputedStyle(s); if (/auto|scroll/.test(ss.overflowX)) return desc(s) } return 'none' })()}`); break } } } }
    out.clip = out.clip.slice(0, 6); out.badges = [...new Set(out.badges)].slice(0, 8); out.otherCards = out.otherCards.slice(0, 3)
    return out
  })
  console.log(id, w, JSON.stringify(o, null, 1))
  await p.close()
}
await b.close(); server.close()
