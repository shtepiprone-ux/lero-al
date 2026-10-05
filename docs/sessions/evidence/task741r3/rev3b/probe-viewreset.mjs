// Task 741 R3b — AC37 probe (evidence, not a gate). Usage: node probe-viewreset.mjs <out.json>
// patterns-mantine-listingsshellview--default: 1440 -> click `view_list` -> resize to 390 -> read -> resize to 1440 -> read.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const out = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const id = 'patterns-mantine-listingsshellview--default'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
await page.waitForSelector('[data-testid="listings-view-toggle"]', { timeout: 30000 })
await page.waitForTimeout(1200)

const read = () => page.evaluate(() => {
  const toggle = document.querySelector('[data-testid="listings-view-toggle"]')
  const vis = (e) => !!e && (() => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' })()
  const btn = (label) => document.querySelector(`[data-testid="listings-view-toggle"] button[aria-label="${label}"]`)
  return {
    innerWidth,
    horizontalCards: document.querySelectorAll('.listing-card--horizontal').length,
    verticalCards: document.querySelectorAll('.listing-card:not(.listing-card--horizontal)').length,
    toggleVisible: vis(toggle),
    gridButtonVariant: btn('Grid')?.getAttribute('data-variant') ?? null,
    listButtonVariant: btn('List')?.getAttribute('data-variant') ?? null,
  }
})

const result = { id, platform: process.platform, steps: {} }
result.steps['1_1440_initial'] = await read()
await page.click('[data-testid="listings-view-toggle"] button[aria-label="List"]')
await page.waitForTimeout(500)
result.steps['2_1440_after_click_List'] = await read()
await page.setViewportSize({ width: 390, height: 900 })
await page.waitForTimeout(800)
result.steps['3_390'] = await read()
await page.setViewportSize({ width: 1440, height: 900 })
await page.waitForTimeout(800)
result.steps['4_1440_back'] = await read()
await browser.close(); server.close()
await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
console.log(JSON.stringify(result, null, 2))
