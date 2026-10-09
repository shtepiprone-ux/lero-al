// Task 859 review 15 (Opus) - second look at the stress pass: (1) an inline name element (a, span) has clientWidth 0,
// so "needs wrap" is judged against its containing block's content width; (2) overlap is judged on the text's line
// boxes (Range.getClientRects) against the neighbour's box, because a title wraps around a floated badge.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(6638)
const ix = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const RE = /(AdminTable|AdminSupportView|AdminListingsView|AdminReportsView|AdminUsersTable|AdminInquiriesView|primitives\/Table\.stories|AdminExchangeProvidersView|AgentStatisticsView|AdminDashboardView|AdminDashboardRecentListings|DashboardWorkList|AdminCurrencyTabs)/
const IDS = Object.values(ix.entries).filter(x => x.type === 'story' && RE.test(x.importPath)).map(x => x.id)
const PERSONS = ['Agim Krasniqi-Berisha Hoxha', 'Arben Krasniqi-Marashi', 'Arben Krasniqi', 'Oksana Petrenko', 'Marco Rossi', 'Ana Koci', 'Blerim Hoxha', 'Flutura Lleshi', 'Gentiana Hoxha', 'Fatmir Gashi', 'Blerina Hoxha', 'Agim Krasniqi', 'Giulia Romano', 'Elira Dervishi', 'Elira Hoxha', 'Driton Berisha', 'Antonio Berluskoni', 'Admin User', 'Story User']
const LONG = 'Arben Gjergj Krasniqi-Marashi'
const jobs = []; for (const id of IDS) for (const w of [320, 390, 767, 768, 1440]) for (const loc of ['uk', 'en']) jobs.push({ id, w, loc })
const b = await chromium.launch()
async function run({ id, w, loc }) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  try {
    await p.goto(`http://127.0.0.1:6638/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForTimeout(1200)
    const r = await p.evaluate(async ({ PERSONS, LONG }) => {
      const root = document.querySelector('#storybook-root') ?? document.body
      const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const ns = []; while (tw.nextNode()) ns.push(tw.currentNode)
      for (const t of ns) { let v = t.nodeValue; for (const nm of PERSONS) if (v.includes(nm)) v = v.split(nm).join(LONG); if (v !== t.nodeValue) t.nodeValue = v }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); await new Promise(r => setTimeout(r, 150))
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
      const ctx = e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)
      const fail = [], over = []; let n = 0
      const els = [...root.querySelectorAll('*')].filter(e => vis(e) && (e.textContent || '').includes(LONG) && ![...e.children].some(c => (c.textContent || '').includes(LONG)))
      for (const e of els) {
        n++
        // the text node(s) of LONG inside e: their line boxes
        const range = document.createRange(); range.selectNodeContents(e); const lines = [...range.getClientRects()].filter(r => r.width > 0.5)
        const lineTops = [...new Set(lines.map(r => Math.round(r.top)))]
        // available width: the nearest block ancestor's content box
        let blk = e; while (blk && getComputedStyle(blk).display.startsWith('inline')) blk = blk.parentElement
        const bcs = getComputedStyle(blk); const avail = blk.clientWidth - parseFloat(bcs.paddingLeft) - parseFloat(bcs.paddingRight)
        const cl = e.cloneNode(true); cl.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:auto;max-width:none;display:inline-block'; e.parentElement.appendChild(cl); const one = cl.getBoundingClientRect().width; cl.remove()
        const lineW = lines.reduce((m, r) => Math.max(m, r.right), 0) - lines.reduce((m, r) => Math.min(m, r.left), 1e9); if (one > avail + 0.5 && lineTops.length < 2 && lineW > avail + 0.5) fail.push(`"${ctx(e)}" line box ${Math.round(lineW)}, clone ${Math.round(one)} > avail ${Math.round(avail)}, lines ${lineTops.length}`)
        const box = e.closest('.mantine-Card-root, td, [data-testid="inquiry-row"], a[href], li, tr') ?? e.parentElement
        for (const o of box.querySelectorAll('*')) { if (o.contains(e) || e.contains(o) || !vis(o) || (o.children.length && !o.matches('.mantine-Badge-root, svg, button'))) continue; if (o.closest('svg') && !o.matches('svg')) continue; const orr = o.getBoundingClientRect()
          for (const lr of lines) { const ix = Math.min(lr.right, orr.right) - Math.max(lr.left, orr.left); const iy = Math.min(lr.bottom, orr.bottom) - Math.max(lr.top, orr.top); if (ix > 1 && iy > 1) { over.push(`"${ctx(e)}" x "${ctx(o)}" ${Math.round(ix)}x${Math.round(iy)}`); break } } }
      }
      return { n, fail, over }
    }, { PERSONS, LONG })
    console.log(JSON.stringify({ id, w, loc, ...r }))
  } catch (e) { console.log(JSON.stringify({ id, w, loc, error: String(e).slice(0, 160) })) }
  await p.close()
}
let i = 0; await Promise.all(Array.from({ length: 6 }, async () => { while (i < jobs.length) await run(jobs[i++]) }))
await b.close(); server.close()
