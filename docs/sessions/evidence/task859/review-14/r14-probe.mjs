// Task 859 review 14 (Opus) - independent GR-3h / GR-3i probe on the built Storybook (storybook-static, read-only).
// usage: node r14-probe.mjs > r14-probe.jsonl
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6614)
const IDS = ['patterns-mantine-admintable--wrapped-title-column', 'patterns-mantine-adminsupportview--default', 'patterns-mantine-adminlistingsview--default', 'patterns-mantine-adminreportsview--default', 'patterns-mantine-adminuserstable--default', 'patterns-mantine-admininquiriesview--default', 'mantine-primitives-table--cards-below-md', 'patterns-mantine-adminexchangeprovidersview--default', 'patterns-mantine-agentstatisticsview--default', 'patterns-mantine-admindashboardview--default', 'patterns-mantine-admindashboardrecentlistings--default']
const WIDTHS = [320, 390, 767, 768, 1440]; const LOCS = ['uk', 'en']
const NAMES = ['Ana Koci', 'Arben Krasniqi', 'Blerim Hoxha', 'Flutura Lleshi', 'Oksana Petrenko', 'Marco Rossi', 'Gentiana']
const b = await chromium.launch()
for (const id of IDS) for (const w of WIDTHS) for (const loc of LOCS) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  try {
    await p.goto(`http://127.0.0.1:6614/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForTimeout(1500)
    const r = await p.evaluate((NAMES) => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const gapsOf = st => { const k = [...st.children].filter(vis); const g = []; for (let i = 1; i < k.length; i++) g.push(Math.round(k[i].getBoundingClientRect().top - k[i - 1].getBoundingClientRect().bottom)); return g }
      const out = { cards: [], cardBadgeAbove: [], cells: [], inquiryRows: [], clampedNames: [] }
      for (const c of [...document.querySelectorAll('.mantine-Card-root')].filter(vis)) {
        const st = c.querySelector(':scope > .mantine-Stack-root'); if (st) out.cards.push(gapsOf(st).join(','))
        for (const bd of c.querySelectorAll('.mantine-Badge-root')) { if (!vis(bd)) continue; const t = bd.getBoundingClientRect().top; let best = null
          for (const e of c.querySelectorAll('*')) { if (e.contains(bd) || bd.contains(e) || !vis(e) || e.children.length) continue; const r = e.getBoundingClientRect(); const br = bd.getBoundingClientRect(); if (r.bottom <= t + 0.5 && r.right > br.left && r.left < br.right) { const d = t - r.bottom; if (best == null || d < best) best = d } }
          if (best != null) out.cardBadgeAbove.push(Math.round(best)) }
      }
      for (const td of [...document.querySelectorAll('td')].filter(vis)) for (const st of td.querySelectorAll('.mantine-Stack-root')) { if (!vis(st)) continue; const g = gapsOf(st); if (g.length) out.cells.push(g.join(',')) }
      for (const row of document.querySelectorAll('[data-testid="inquiry-row"]')) { const st = row.querySelector('.mantine-Stack-root'); if (st && vis(st)) out.inquiryRows.push(gapsOf(st).join(',')) }
      for (const e of document.querySelectorAll('body *')) { if (!vis(e)) continue; const cs = getComputedStyle(e); const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none'; const ell = cs.textOverflow === 'ellipsis'; if (!(clamp || ell)) continue; const tx = e.textContent.trim(); if (NAMES.some(n => tx.includes(n))) out.clampedNames.push(`${tx.slice(0, 50)} [clamp ${cs.webkitLineClamp}, ell ${ell}]`) }
      const cnt = a => a.reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {})
      return { cards: cnt(out.cards), cardBadgeAbove: cnt(out.cardBadgeAbove), cells: cnt(out.cells), inquiryRows: cnt(out.inquiryRows), clampedNames: cnt(out.clampedNames), err: !!document.querySelector('.sb-show-errordisplay') }
    }, NAMES)
    console.log(JSON.stringify({ id, w, loc, ...r }))
  } catch (e) { console.log(JSON.stringify({ id, w, loc, error: String(e) })) }
  await p.close()
}
await b.close(); server.close()
