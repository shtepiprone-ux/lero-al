// Task 859 review 15 (Opus) - independent GR-3h / GR-3i probe on the built Storybook (storybook-static, read-only).
// Pass "matrix": every Story of the changed components x 16 widths x 4 locales (rhythm + names).
// Pass "stress": the same Stories x 320/390/767/768/1440 x uk/en, every person name set in the DOM to a long
// real-shaped name (probe only), re-measured one frame later (cut, lines, overlap, rhythm).
// usage: node r15-probe.mjs <matrix|stress> > r15-<pass>.jsonl
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const PASS = process.argv[2] ?? 'matrix'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const PORT = PASS === 'matrix' ? 6631 : 6632
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(PORT)
const ix = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const RE = /(AdminTable|AdminSupportView|AdminListingsView|AdminReportsView|AdminUsersTable|AdminInquiriesView|primitives\/Table\.stories|AdminExchangeProvidersView|AgentStatisticsView|AdminDashboardView|AdminDashboardRecentListings|DashboardWorkList|AdminCurrencyTabs)/
const IDS = Object.values(ix.entries).filter(x => x.type === 'story' && RE.test(x.importPath)).map(x => x.id).filter(id => !process.env.ONLY || id.includes(process.env.ONLY))
const WIDTHS = process.env.W ? process.env.W.split(',').map(Number) : PASS === 'matrix' ? [320, 375, 390, 480, 560, 639, 640, 680, 767, 768, 810, 960, 1024, 1200, 1440, 1920] : [320, 390, 767, 768, 1440]
const LOCS = PASS === 'matrix' ? ['sq', 'en', 'uk', 'it'] : ['uk', 'en']
// Person names of the fixtures (grep of src/stories/fixtures + the Stories) and the companies that stand for an account.
const PERSONS = ['Agim Krasniqi-Berisha Hoxha', 'Arben Krasniqi-Marashi', 'Arben Krasniqi', 'Oksana Petrenko', 'Marco Rossi', 'Ana Koci', 'Blerim Hoxha', 'Flutura Lleshi', 'Gentiana Hoxha', 'Fatmir Gashi', 'Blerina Hoxha', 'Agim Krasniqi', 'Giulia Romano', 'Elira Dervishi', 'Elira Hoxha', 'Driton Berisha', 'Antonio Berluskoni', 'Admin User', 'Story User']
const COMPANIES = ['Adriatik Properties', 'Berisha Real Estate', 'Blloku Premium Homes', 'Tirana Real Estate Group']
const LONG = 'Arben Gjergj Krasniqi-Marashi'
const jobs = []; for (const id of IDS) for (const w of WIDTHS) for (const loc of LOCS) jobs.push({ id, w, loc })
const b = await chromium.launch()
const CONC = 8
async function run({ id, w, loc }) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  try {
    await p.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' })
    await p.waitForTimeout(1200)
    const r = await p.evaluate(async ({ PERSONS, COMPANIES, LONG, stress }) => {
      const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
      const rect = e => e.getBoundingClientRect()
      const ctx = e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
      let replaced = 0
      if (stress) {
        const tw = document.createTreeWalker(document.querySelector('#storybook-root') ?? document.body, NodeFilter.SHOW_TEXT)
        const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode)
        for (const n of nodes) { let t = n.nodeValue; for (const nm of PERSONS) if (t.includes(nm)) { t = t.split(nm).join(LONG); } if (t !== n.nodeValue) { n.nodeValue = t; replaced++ } }
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); await new Promise(r => setTimeout(r, 150))
      }
      const out = { cardStack: [], badgeAbove: [], badgeOdd: [], cellStack: [], cellText: [], inquiry: [], worklist: [], names: 0, cut: [], stressLines: [], overlap: [], replaced }
      // A. card top stacks. A record card (MantineDataTableToCards) has a Divider among its own Stack's children; any
      // other card (dashboard card bodies) is judged for one rhythm only (every gap = its own row gap).
      const gaps = st => { const k = [...st.children].filter(vis); const g = []; for (let i = 1; i < k.length; i++) g.push(Math.round(rect(k[i]).top - rect(k[i - 1]).bottom)); return g }
      const recordCards = []
      for (const c of [...document.querySelectorAll('.mantine-Card-root')].filter(vis)) { const st = c.querySelector(':scope > .mantine-Stack-root'); if (!st) continue; const rec = [...st.children].some(k => k.matches('.mantine-Divider-root')); if (rec) recordCards.push(c); out.cardStack.push(`${rec ? 'record' : 'other'}|${getComputedStyle(st).rowGap}|${gaps(st).join(',')}`) }
      const roots = [...recordCards, ...[...document.querySelectorAll('td, [data-testid="inquiry-row"]')].filter(vis)]
      // a "leaf" is a visible element with text and no element children, an svg root, an image, or a divider
      const leaf = e => { if (!vis(e)) return false; if (e.closest('svg') && !e.matches('svg')) return false; if (e.matches('svg, img, input, .mantine-Divider-root')) return true; return e.children.length === 0 && (e.textContent || '').trim().length > 0 }
      // B. every badge: distance to the nearest leaf above it that overlaps it horizontally, inside the same root
      for (const root of roots) for (const bd of root.querySelectorAll('.mantine-Badge-root')) {
        if (!vis(bd)) continue; const br = rect(bd); let best = null, bestEl = null
        for (const e of root.querySelectorAll('*')) { if (e.contains(bd) || bd.contains(e) || !leaf(e)) continue; const r = rect(e); if (r.bottom <= br.top + 0.5 && r.right > br.left && r.left < br.right) { const d = br.top - r.bottom; if (best == null || d < best) { best = d; bestEl = e } } }
        if (best == null) continue
        const gBd = bd.closest('.mantine-Group-root'); const same = gBd && gBd.contains(bestEl) && root.contains(gBd)
        const v = Math.round(best); const kind = root.matches('td') ? 'cell' : root.matches('.mantine-Card-root') ? 'card' : 'inq'
        out.badgeAbove.push(`${kind}:${same ? 'wrapSameRow' : 'block'}:${v}`)
        if (!same && v !== 12) out.badgeOdd.push(`${kind} ${v}px above "${ctx(bd)}" <- "${ctx(bestEl)}"`)
      }
      // C. records-table cells: every stack with >= 2 visible children
      for (const td of [...document.querySelectorAll('td')].filter(vis)) for (const st of td.querySelectorAll('.mantine-Stack-root')) {
        if (!vis(st)) continue; const k = [...st.children].filter(vis); if (k.length < 2) continue
        const obj = k.some(x => x.matches('.mantine-Badge-root, svg, button, img, a.mantine-Button-root') || x.querySelector('.mantine-Badge-root, svg, button, img'))
        ;(obj ? out.cellStack : out.cellText).push(`${getComputedStyle(st).rowGap}|${gaps(st).join(',')}`)
      }
      // D. inquiry rows: every column-direction flex container with >= 2 visible children
      for (const row of [...document.querySelectorAll('[data-testid="inquiry-row"]')].filter(vis)) {
        const parts = []
        for (const e of row.querySelectorAll('*')) { const cs = getComputedStyle(e); if (cs.display !== 'flex' || !cs.flexDirection.startsWith('column') || !vis(e)) continue; const k = [...e.children].filter(vis); if (k.length < 2) continue; const txt = k.every(x => !x.querySelector('.mantine-Badge-root, svg') && !x.matches('.mantine-Badge-root, svg') && !x.matches('.mantine-Group-root')); parts.push(`${txt ? 'text' : 'blocks'}:${gaps(e).join(',')}`) }
        out.inquiry.push(parts.join(' ; '))
      }
      // E. dashboard work-list rows (anchor rows): every visible column stack inside
      for (const a of [...document.querySelectorAll('a[href]')].filter(vis)) { const st = [...a.querySelectorAll(':scope > .mantine-Stack-root, :scope > .mantine-Group-root > .mantine-Stack-root')].filter(vis); for (const s of st) { const k = [...s.children].filter(vis); if (k.length >= 2) out.worklist.push(`${getComputedStyle(s).rowGap}|${gaps(s).join(',')}`) } }
      // F. names: the smallest element whose text contains a person/company name
      const ALL = stress ? [LONG, ...COMPANIES] : [...PERSONS, ...COMPANIES]
      const scope = document.querySelector('#storybook-root') ?? document.body
      const els = [...scope.querySelectorAll('*')].filter(e => vis(e) && ALL.some(n => (e.textContent || '').includes(n)) && ![...e.children].some(ch => ALL.some(n => (ch.textContent || '').includes(n))))
      for (const e of els) {
        out.names++
        const cs = getComputedStyle(e); const why = []
        if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') why.push('clamp' + cs.webkitLineClamp)
        if (cs.textOverflow === 'ellipsis' && cs.overflowX !== 'visible') why.push('ellipsis')
        if (e.scrollWidth > e.clientWidth + 0.5 && e.clientWidth > 0) why.push(`sw${e.scrollWidth}>cw${e.clientWidth}`)
        if (e.scrollHeight > e.clientHeight + 0.5 && e.clientHeight > 0) why.push(`sh${e.scrollHeight}>ch${e.clientHeight}`)
        // a clipping ancestor (overflow != visible) that does not contain the element's box
        const er = rect(e)
        for (let a = e.parentElement, i = 0; a && i < 8 && a !== scope; a = a.parentElement, i++) { const as = getComputedStyle(a); if (as.webkitLineClamp && as.webkitLineClamp !== 'none') why.push('ancClamp' + as.webkitLineClamp); if (/hidden|clip/.test(as.overflowX + as.overflowY)) { const ar = rect(a); if (er.right > ar.right + 0.5 || er.bottom > ar.bottom + 0.5 || er.left < ar.left - 0.5) why.push('ancClip') } }
        if (why.length) out.cut.push(`${why.join('+')} "${ctx(e)}"`)
        if (stress && (e.textContent || '').includes(LONG)) {
          const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.55; const lines = Math.round(er.height / lh)
          const cl = e.cloneNode(true); cl.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;width:auto;max-width:none;display:inline-block'; e.parentElement.appendChild(cl); const one = cl.getBoundingClientRect().width; cl.remove()
          const need = one > e.clientWidth + 0.5
          out.stressLines.push(`${need ? 'needsWrap' : 'fits'}:${lines}${need && lines < 2 ? ':FAIL' : ''}`)
          const root = e.closest('.mantine-Card-root, td, [data-testid="inquiry-row"], a[href], li, tr') ?? e.parentElement
          for (const o of root.querySelectorAll('*')) { if (o.contains(e) || e.contains(o) || !vis(o) || o.children.length) continue; const r = rect(o); const ix = Math.min(er.right, r.right) - Math.max(er.left, r.left); const iy = Math.min(er.bottom, r.bottom) - Math.max(er.top, r.top); if (ix > 1 && iy > 1) { out.overlap.push(`"${ctx(e)}" x "${ctx(o)}" ${Math.round(ix)}x${Math.round(iy)}`); break } }
        }
      }
      const cnt = a => a.reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {})
      return { cardStack: cnt(out.cardStack), badgeAbove: cnt(out.badgeAbove), badgeOdd: cnt(out.badgeOdd), cellStack: cnt(out.cellStack), cellText: cnt(out.cellText), inquiry: cnt(out.inquiry), worklist: cnt(out.worklist), names: out.names, cut: cnt(out.cut), stressLines: cnt(out.stressLines), overlap: cnt(out.overlap), replaced: out.replaced, err: document.body.classList.contains('sb-show-errordisplay') }
    }, { PERSONS, COMPANIES, LONG, stress: PASS === 'stress' })
    console.log(JSON.stringify({ id, w, loc, ...r }))
  } catch (e) { console.log(JSON.stringify({ id, w, loc, error: String(e).slice(0, 200) })) }
  await p.close()
}
let i = 0; await Promise.all(Array.from({ length: CONC }, async () => { while (i < jobs.length) { const j = jobs[i++]; await run(j) } }))
await b.close(); server.close()
console.error(`done ${PASS}: ${jobs.length} jobs, ${IDS.length} Stories`)
