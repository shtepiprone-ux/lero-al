// Task 741 — Opus review of Revision 3h: ListingsShellView Default at 1440 in grid and in list (toggle clicked),
// en, DPR 1, viewport screenshots of the first cards, plus the archived card of Mantine/Primitives/ListingCard.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = 'docs/sessions/evidence/task741r3/rev3h/review/'
await mkdir(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}/iframe.html?viewMode=story&globals=locale:en&id=`
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
await page.goto(base + 'patterns-mantine-listingsshellview--default'); await page.waitForTimeout(2500)
const cards = page.locator('[data-card-part="head"]').first()
await cards.scrollIntoViewIfNeeded(); await page.mouse.wheel(0, 300); await page.waitForTimeout(600)
await page.screenshot({ path: OUT + 'shell-grid-1440.png' })
await page.locator('[data-testid="listings-view-toggle"] button').nth(1).click(); await page.waitForTimeout(1200)
await page.screenshot({ path: OUT + 'shell-list-1440.png' })
await page.goto(base + 'mantine-primitives-listingcard--default'); await page.waitForTimeout(2500)
await page.screenshot({ path: OUT + 'primitive-1440-top.png' })
const archived = await page.evaluate(() => [...document.querySelectorAll('[class*="archived"]')].map(e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return { cls: e.className.slice(0, 80), opacity: s.opacity, filter: s.filter, radius: s.borderTopLeftRadius, border: s.borderTopColor, x: r.x, y: r.y + scrollY } }))
console.log(JSON.stringify(archived))
if (archived[0]) { await page.evaluate(y => scrollTo(0, y - 40), archived[0].y); await page.waitForTimeout(400); await page.screenshot({ path: OUT + 'primitive-archived-1440.png' }) }
await browser.close(); server.close()
