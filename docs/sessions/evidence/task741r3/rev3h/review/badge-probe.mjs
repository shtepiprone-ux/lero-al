// Task 741 — Opus review of Revision 3h: do the card badges render? For ListingsShellView Default/ClosedTab and the two
// card Stories at 1440 en: per card, the badges part (present, child count, texts, box size, visibility, z-order vs image).
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'docs/sessions/evidence/task741r3/rev3h/review/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
const out = {}
for (const id of ['patterns-mantine-listingsshellview--default', 'patterns-mantine-listingsshellview--closed-tab', 'mantine-primitives-listingcard--default', 'patterns-mantine-listingcardpattern--default']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?viewMode=story&globals=locale:en&id=${id}`); await page.waitForTimeout(2500)
  out[id] = await page.evaluate(() => [...document.querySelectorAll('.mantine-Card-root')].slice(0, 12).map(card => {
    const b = card.querySelector('[data-card-part="badges"]')
    const o = card.querySelector('[data-card-part="overlay"]')
    const img = card.querySelector('img')
    const info = el => { if (!el) return null; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return { w: Math.round(r.width), h: Math.round(r.height), vis: s.visibility, disp: s.display, z: s.zIndex, pos: s.position, texts: [...el.querySelectorAll('*')].filter(e => !e.children.length).map(e => e.textContent.trim()).filter(Boolean) } }
    const hit = b && b.firstElementChild ? (() => { const r = b.firstElementChild.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return top ? (top.closest('[data-card-part]')?.getAttribute('data-card-part') ?? top.tagName) : null })() : null
    return { title: card.querySelector('h3')?.textContent.trim().slice(0, 30), badges: info(b), badgeChildren: b ? b.children.length : 0, topmostAtFirstBadge: hit, overlay: info(o), img: img ? info(img) : null }
  }))
  await page.close()
}
await browser.close(); server.close()
await writeFile(OUT + 'badge-probe.json', JSON.stringify(out, null, 1) + '\n')
for (const [k, v] of Object.entries(out)) { console.log(k); for (const c of v) console.log('  ', c.title, '| badges', c.badges ? `${c.badgeChildren} child ${c.badges.w}x${c.badges.h} ${c.badges.vis}/${c.badges.disp} z${c.badges.z} [${c.badges.texts.join(', ')}] top=${c.topmostAtFirstBadge}` : 'none', '| overlay', c.overlay ? `${c.overlay.w}x${c.overlay.h} [${c.overlay.texts.join(',')}]` : 'none') }
