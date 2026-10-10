// Task 859 review 16 (Opus) - the GR-3j census of review 15 / r14x scanned only `#storybook-root`; a Mantine Modal and
// the bottom sheet render in a portal under <body>, so no dialog content was ever measured. This is the same probe
// (r15-mobile.mjs A/B/C/F) run on `document.body`, on every Mantine dialog / picker / fact-panel Story.
// usage: node r16-dialogs.mjs > r16-dialogs.jsonl
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json'); const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const PORT = Number(process.env.PORT ?? 6641)
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) }) }).listen(PORT)
const ix = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const RE = new RegExp(process.env.RE ?? '^\\./src/stories/.*(Dialog|Modal|Picker|DetailList)')
const IDS = Object.values(ix.entries).filter(x => x.type === 'story' && RE.test(x.importPath)).map(x => x.id)
const WIDTHS = (process.env.W ?? '320,390,639,640,1440').split(',').map(Number)
const LOCS = (process.env.L ?? 'sq,en,uk,it').split(',')
const jobs = []; for (const id of IDS) for (const w of WIDTHS) for (const loc of LOCS) jobs.push({ id, w, loc })
const b = await chromium.launch()
async function run({ id, w, loc }) {
  const p = await b.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: 1 })
  try {
    await p.goto(`http://127.0.0.1:${PORT}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' }); await p.waitForFunction(() => document.body.innerText.trim().length > 0, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500)
    const r = await p.evaluate((touch) => {
      const root = document.body
      const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' }
      const rect = e => e.getBoundingClientRect(); const txt = e => (e.textContent || '').trim().replace(/\s+/g, ' ')
      const ctx = e => txt(e).slice(0, 45)
      const dialogs = [...root.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content, [role="dialog"]')].filter(vis)
      const out = { dialogs: dialogs.length, kvInline: [], cut: [], ellipsisText: [], smallTarget: [], pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }
      const records = [...root.querySelectorAll('.mantine-Card-root, .mantine-Paper-root, .mantine-Modal-content, .mantine-Drawer-content')].filter(vis)
      const inRecord = e => records.some(r => r.contains(e))
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
      for (const e of root.querySelectorAll('*')) {
        if (!vis(e)) continue; const t = txt(e); if (!t) continue
        if (e.closest('script, style')) continue
        if ([...e.children].some(c => txt(c) === t)) continue
        const cs = getComputedStyle(e); const why = []
        if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') why.push('clamp' + cs.webkitLineClamp)
        if (cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 0.5) why.push('ellipsis')
        else if (cs.textOverflow === 'ellipsis' && /hidden|clip/.test(cs.overflowX)) why.push('ellipsisStyle')
        if (/hidden|clip/.test(cs.overflowX + cs.overflowY) && (e.scrollWidth > e.clientWidth + 0.5 || e.scrollHeight > e.clientHeight + 0.5)) why.push('overflowHidden')
        const over = e.scrollHeight > e.clientHeight + 0.5 || e.scrollWidth > e.clientWidth + 0.5
        const where = e.closest('.mantine-Modal-content, .mantine-Drawer-content') ? 'DIALOG' : 'page'
        if (why.length) out.cut.push(`${where} ${over ? 'ACTIVE' : 'latent'} ${why.join('+')} "${t.slice(0, 40)}"`)
        if (/…|\.\.\.$/.test(t) && !e.children.length) out.ellipsisText.push(`"${t.slice(0, 40)}"`)
      }
      for (const e of root.querySelectorAll('button, a, [role="button"], input[type="checkbox"]')) {
        if (!vis(e) || !inRecord(e)) continue
        if (e.matches('a') && !e.querySelector('svg') && getComputedStyle(e).display.startsWith('inline')) continue
        const r = rect(e); if (Math.min(r.width, r.height) < touch - 0.5) out.smallTarget.push(`${Math.round(r.width)}x${Math.round(r.height)} ${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.getAttribute('title') || ctx(e)).slice(0, 30)}"`)
      }
      // the sheet/modal header: is it squeezed below its content? (the r14x-40 V1 check)
      const hdr = []
      for (const h of root.querySelectorAll('.mantine-Drawer-header, .mantine-Modal-header')) { if (!vis(h)) continue; if (h.scrollHeight > h.clientHeight + 1) hdr.push(`${Math.round(h.clientHeight)}<${h.scrollHeight}`) }
      const cnt = a => a.reduce((m, v) => (m[v] = (m[v] || 0) + 1, m), {})
      return { dialogs: out.dialogs, kvInline: cnt(out.kvInline), cut: cnt(out.cut), ellipsisText: cnt(out.ellipsisText), smallTarget: cnt(out.smallTarget), headerSqueezed: hdr, pageOverflow: out.pageOverflow, err: document.body.classList.contains('sb-show-errordisplay') }
    }, 44)
    console.log(JSON.stringify({ id, w, loc, ...r }))
  } catch (e) { console.log(JSON.stringify({ id, w, loc, error: String(e).slice(0, 160) })) }
  await p.close()
}
let i = 0; await Promise.all(Array.from({ length: 5 }, async () => { while (i < jobs.length) await run(jobs[i++]) }))
await b.close(); server.close()
console.error(`done: ${jobs.length} jobs, ${IDS.length} Stories`)
