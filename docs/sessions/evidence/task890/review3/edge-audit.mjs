// Task 890 review 3 — four-edge gutter audit of every Patterns/Mantine Story in storybook-static.
// For each story × width: the union box of every visible element inside #storybook-root (text, border,
// background, img/svg/canvas/input), ignoring fixed/portal overlays. Reports the gap to each viewport edge.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(import.meta.url); const { chromium } = require('playwright')
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(r) })
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const B = `http://127.0.0.1:${srv.address().port}`
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const ids = Object.values(idx.entries).filter((e) => e.type === 'story' && e.title.startsWith('Patterns/Mantine')).map((e) => e.id)
const br = await chromium.launch(); const out = [`# ${ids.length} stories; columns: id width top/left/right/bottom (px from viewport edge; bottom only when content ends above the fold)`]
for (const w of [320, 1234]) {
  const ctx = await br.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage()
  for (const id of ids) {
    try {
      await p.goto(`${B}/iframe.html?id=${id}&viewMode=story&globals=locale:en`, { waitUntil: 'load' }); await p.waitForTimeout(900)
      const m = await p.evaluate(() => {
        const root = document.querySelector('#storybook-root'); if (!root) return null
        const vis = (el) => { const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) return false
          const bg = s.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor)
          const bd = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0
          const tx = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
          return bg || bd || tx || /^(IMG|SVG|CANVAS|INPUT|TEXTAREA|SELECT|svg)$/.test(el.tagName) }
        const fixedAnc = (el) => { for (let a = el; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true; return false }
        let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity, n = 0
        for (const el of root.querySelectorAll('*')) { const bx = el.getBoundingClientRect(); if (bx.width < 2 || bx.height < 2) continue; if (!vis(el) || fixedAnc(el)) continue
          n++; t = Math.min(t, bx.top + scrollY); l = Math.min(l, bx.left); r = Math.max(r, bx.right); b = Math.max(b, bx.bottom + scrollY) }
        if (!n) return { n: 0 }
        return { n, top: Math.round(t), left: Math.round(l), right: Math.round(innerWidth - r), bottom: b < innerHeight ? Math.round(innerHeight - b) : null }
      })
      out.push(m && m.n ? `${id} ${w} ${m.top}/${m.left}/${m.right}/${m.bottom ?? '-'}` : `${id} ${w} overlay-or-empty`)
    } catch (e) { out.push(`${id} ${w} ERROR ${String(e).slice(0, 80)}`) }
  }
  await ctx.close()
}
fs.writeFileSync(process.argv[2], out.join('\n') + '\n'); await br.close(); srv.close()
