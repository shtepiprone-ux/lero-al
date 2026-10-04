// Task 741 Revision 3e review — the paginator in patterns-mantine-listingsshellview--default (3 pages): every child, visibility.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
const out = {}
for (const w of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 })
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=patterns-mantine-listingsshellview--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Pagination-root', { timeout: 30000 })
  await page.waitForTimeout(1000)
  const nav = page.locator('nav').last()
  await nav.scrollIntoViewIfNeeded()
  out[w] = await page.evaluate(() => [...document.querySelector('.mantine-Pagination-root').querySelectorAll('*')].filter(e => e.children.length === 0 || e.tagName === 'BUTTON').map(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { tag: e.tagName.toLowerCase(), cls: String(e.className.baseVal ?? e.className).split(' ').filter(c => c.startsWith('mantine')).join(' '), text: (e.textContent || '').trim(), aria: e.getAttribute('aria-label') || e.getAttribute('aria-current'), w: Math.round(r.width), h: Math.round(r.height), display: s.display, vis: r.width > 0 && r.height > 0 } }))
  await nav.screenshot({ path: `docs/sessions/evidence/task741r3/rev3e/review/pagination-${w}.png` })
  await page.close()
}
await browser.close(); server.close()
await writeFile('docs/sessions/evidence/task741r3/rev3e/review/pagination-probe.json', JSON.stringify(out, null, 1) + '\n')
for (const w of [390, 1440]) { console.log('==', w); for (const e of out[w]) if (e.tag === 'button' || e.text) console.log(JSON.stringify(e)) }
