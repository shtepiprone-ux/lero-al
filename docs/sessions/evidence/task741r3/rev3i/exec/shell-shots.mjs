// Task 741 Rev 3i (AC60) — ListingsShellView Default at 1440: the grid and the list view, with the badges on the photos.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const D = 'docs/sessions/evidence/task741r3/rev3i/exec/'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/\\])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch()
const out = {}
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=patterns-mantine-listingsshellview--default&viewMode=story&globals=locale:en`)
await page.waitForSelector('.mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500)
await page.screenshot({ path: D + 'shell-grid-1440.png', fullPage: true })
out.grid = await page.evaluate(() => [...document.querySelectorAll('[data-card-part="badges"]')].map(g => ({ text: g.textContent.trim(), top: Math.round(g.getBoundingClientRect().top - g.closest('.mantine-Card-section').getBoundingClientRect().top), left: Math.round(g.getBoundingClientRect().left - g.closest('.mantine-Card-section').getBoundingClientRect().left) })))
await page.getByRole('button', { name: 'List', exact: true }).click().catch(async () => { await page.locator('[aria-label="List view"], [aria-label="List"]').first().click() })
await page.waitForTimeout(1500)
await page.screenshot({ path: D + 'shell-list-1440.png', fullPage: true })
out.list = await page.evaluate(() => ({ horizontal: document.querySelectorAll('.listing-card--horizontal').length, badges: [...document.querySelectorAll('.listing-card--horizontal [data-card-part="badges"]')].map(g => g.textContent.trim()) }))
// archived card root opacity and the photo's, in the card Stories
await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=mantine-primitives-listingcard--default&viewMode=story&globals=locale:en`)
await page.waitForSelector('.mantine-Card-root', { timeout: 30000 }); await page.waitForTimeout(2500)
out.archived = await page.evaluate(() => [...document.querySelectorAll('.mantine-Card-root')].filter(c => /archived/.test(c.className)).map(c => { const s = getComputedStyle(c), p = getComputedStyle(c.querySelector('.mantine-Card-section')); return { rootOpacity: s.opacity, rootFilter: s.filter, rootBorder: `${s.borderTopWidth} ${s.borderTopColor}`, photoOpacity: p.opacity } }))
await page.screenshot({ path: D + 'primitive-archived-1440.png', fullPage: true })
await browser.close(); server.close()
await writeFile(D + 'shell-shots.json', JSON.stringify(out, null, 1) + '\n')
console.log(JSON.stringify(out))
