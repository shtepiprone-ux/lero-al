// Task 859 review 15b (Opus, after the owner's O78-13 return) - GR-3j mobile-adaptation census on the built
// Storybook (read-only). For every Story of the 859 surfaces, at the compact range, both sides of 640 and the card
// switches (768 / 1024), in four locales, it records:
//   A. label/value pairs that share one line (a short text label beside its value) - key-value-stack violations;
//   B. every visible text that is cut: line clamp, ellipsis, or overflowing a hidden-overflow box (ALL text, not names);
//   C. text that carries a literal ellipsis character from code ("…" / "...");
//   D. an avatar beside a text block that is shorter than the avatar but not vertically centred on it;
//   E. a card whose first row holds no text (only an icon/chevron);
//   F. interactive controls inside a record card/row smaller than the 44px touch token (inline text links excluded);
//   G. page-level horizontal overflow.
// usage: node r15-mobile.mjs > r15-mobile.jsonl
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(Number(process.env.PORT ?? 6640))
const ix = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const RE = new RegExp(process.env.RE ?? '(AdminTable|AdminSupportView|AdminListingsView|AdminReportsView|AdminUsersTable|AdminInquiriesView|primitives/Table\\.stories|AdminExchangeProvidersView|AgentStatisticsView|AdminDashboardView|AdminDashboardRecentListings|DashboardWorkList|AdminCurrencyTabs|DetailList)')
const IDS = Object.values(ix.entries).filter(x => x.type === 'story' && RE.test(x.importPath)).map(x => x.id)
const WIDTHS = (process.env.W ?? '320,375,390,480,560,639,640,680,767,768,1023').split(',').map(Number)
const LOCS = (process.env.L ?? 'sq,en,uk,it').split(',')
// resume + shard: skip jobs already in DONE (a jsonl file), take every SHARD_N-th remaining job from SHARD_I
const DONE = new Set(process.env.DONE && fs.existsSync(process.env.DONE) ? fs.readFileSync(process.env.DONE, 'utf8').trim().split('\n').filter(Boolean).map(l => { const r = JSON.parse(l); return r.error ? '' : `${r.id}|${r.w}|${r.loc}` }) : [])
const SHARD_I = Number(process.env.SHARD_I ?? 0), SHARD_N = Number(process.env.SHARD_N ?? 1)
const all = []; for (const id of IDS) for (const w of WIDTHS) for (const loc of LOCS) if (!DONE.has(id + "|" + w + "|" + loc)) all.push({ id, w, loc })
const jobs = all.filter((_, k) => k % SHARD_N === SHARD_I)
const b = await chromium.launch()
async function run({ id, w, loc }) {
  const p = await b.newPage({ viewport: { width: w, height: 1400 }, deviceScaleFactor: 1 })
  try {
    await p.goto(`http://127.0.0.1:${process.env.PORT ?? 6640}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForFunction(() => { const r = document.querySelector('#storybook-root'); return r && r.textContent.trim().length > 0 }, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1200)
    const r = await p.evaluate((touch) => {
      const root = document.querySelector('#storybook-root') ?? document.body
      const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' }
      const rect = e => e.getBoundingClientRect(); const txt = e => (e.textContent || '').trim().replace(/\s+/g, ' ')
      const ctx = e => txt(e).slice(0, 45)
      const out = { kvInline: [], cut: [], ellipsisText: [], avatarOff: [], emptyFirstRow: [], smallTarget: [], pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }
      const records = [...root.querySelectorAll('.mantine-Card-root, [data-testid="inquiry-row"], .mantine-Paper-root, .mantine-Modal-content, .mantine-Drawer-content')].filter(vis)
      const inRecord = e => records.some(r => r.contains(e))
      // A. a row (flex row) of exactly two visible children: a short text-only label, then a value beside it
      for (const g of root.querySelectorAll('*')) {
        if (!vis(g) || !inRecord(g)) continue
        const cs = getComputedStyle(g); if (!(cs.display.includes('flex') && cs.flexDirection === 'row')) continue
        const k = [...g.children].filter(vis); if (k.length !== 2) continue
        const [l, v] = k; const lt = txt(l)
        if (!lt || l.querySelector('svg, img, .mantine-Badge-root, .mantine-Avatar-root, button, a') || l.matches('.mantine-Badge-root, .mantine-Avatar-root, a, button')) continue
        if (lt.length > 40 || v.querySelector('button, [role="button"]') || (!txt(v) && !v.querySelector('.mantine-Badge-root'))) continue
        const lr = rect(l), vr = rect(v)
        if (vr.left >= lr.right - 0.5 && vr.top < lr.bottom && vr.bottom > lr.top) out.kvInline.push(`"${lt.slice(0, 22)}" | "${ctx(v).slice(0, 26)}"`)
      }
      // B. cut text (every visible leaf-ish text element)
      for (const e of root.querySelectorAll('*')) {
        if (!vis(e)) continue; const t = txt(e); if (!t) continue
        if ([...e.children].some(c => txt(c) === t)) continue // the deepest element carrying the whole text
        const cs = getComputedStyle(e); const why = []
        if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') why.push('clamp' + cs.webkitLineClamp)
        if (cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 0.5) why.push('ellipsis')
        else if (cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX)) why.push('ellipsisStyle')
        if (/hidden|clip/.test(cs.overflowX + cs.overflowY) && (e.scrollWidth > e.clientWidth + 0.5 || e.scrollHeight > e.clientHeight + 0.5)) why.push('overflowHidden')
        const over = e.scrollHeight > e.clientHeight + 0.5 || e.scrollWidth > e.clientWidth + 0.5
        if (why.length) out.cut.push(`${over ? 'ACTIVE' : 'latent'} ${why.join('+')} "${t.slice(0, 40)}"`)
        if (/…|\.\.\.$/.test(t) && !e.children.length) out.ellipsisText.push(`"${t.slice(0, 40)}"`)
      }
      // D. avatar beside a shorter text block, not centred
      for (const av of root.querySelectorAll('.mantine-Avatar-root')) {
        if (!vis(av)) continue; const row = av.parentElement; const sib = [...row.children].filter(x => x !== av && vis(x) && txt(x))
        if (!sib.length) continue; const s = sib[0]; const ar = rect(av), sr = rect(s)
        if (sr.height < ar.height - 1) { const d = Math.abs((ar.top + ar.bottom) / 2 - (sr.top + sr.bottom) / 2); if (d > 1.5) out.avatarOff.push(`${Math.round(d)}px off "${ctx(s).slice(0, 30)}"`) }
      }
      // E. card whose first visible row of its own stack has no text
      for (const c of root.querySelectorAll('.mantine-Card-root')) { if (!vis(c)) continue; const st = c.querySelector(':scope > .mantine-Stack-root'); const first = st && [...st.children].find(vis); if (first && !txt(first)) out.emptyFirstRow.push(`card "${ctx(c).slice(0, 30)}"`) }
      // F. small interactive targets inside record containers (not inline text links)
      for (const e of root.querySelectorAll('button, a, [role="button"], input[type="checkbox"]')) {
        if (!vis(e) || !inRecord(e) || e.matches('.mantine-Card-root, [data-testid="inquiry-row"]')) continue
        if (e.matches('a') && !e.querySelector('svg') && getComputedStyle(e).display.startsWith('inline')) continue
        const r = rect(e); if (Math.min(r.width, r.height) < touch - 0.5) out.smallTarget.push(`${Math.round(r.width)}x${Math.round(r.height)} ${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.getAttribute('title') || ctx(e)).slice(0, 30)}"`)
      }
      const cnt = a => a.reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {})
      return { kvInline: cnt(out.kvInline), cut: cnt(out.cut), ellipsisText: cnt(out.ellipsisText), avatarOff: cnt(out.avatarOff), emptyFirstRow: cnt(out.emptyFirstRow), smallTarget: cnt(out.smallTarget), pageOverflow: out.pageOverflow, err: document.body.classList.contains('sb-show-errordisplay') }
    }, 44)
    console.log(JSON.stringify({ id, w, loc, ...r }))
  } catch (e) { console.log(JSON.stringify({ id, w, loc, error: String(e).slice(0, 160) })) }
  await p.close()
}
let i = 0; await Promise.all(Array.from({ length: 5 }, async () => { while (i < jobs.length) await run(jobs[i++]) }))
await b.close(); server.close()
console.error(`done: ${jobs.length} jobs, ${IDS.length} Stories`)
