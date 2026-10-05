// Task 741 R3c — uk@320: every badge of the pattern Story's grid cards lies inside its card's photo box.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 320, height: 900 } })
await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=patterns-mantine-listingcardpattern--default&viewMode=story&globals=locale:uk`)
await page.waitForSelector('.mantine-SimpleGrid-root .mantine-Badge-root'); await page.waitForTimeout(1500)
const r = await page.evaluate(() => [...document.querySelectorAll('.mantine-SimpleGrid-root .mantine-Card-root')].map((c, i) => { const cr = c.getBoundingClientRect(); const img = c.querySelector('img'); const ir = (img?.parentElement ?? c).getBoundingClientRect(); return { card: i + 1, badges: [...c.querySelectorAll('.mantine-Badge-root')].map(b => { const x = b.getBoundingClientRect(); return { t: b.textContent.trim(), inside: x.left >= cr.left - 0.5 && x.right <= cr.right + 0.5 && x.top >= ir.top - 0.5 && x.bottom <= ir.bottom + 0.5 } }) } }))
const bad = r.flatMap(c => c.badges.filter(b => !b.inside).map(b => `card ${c.card} ${b.t}`))
await writeFile(new URL('./probe-uk320.json', import.meta.url), JSON.stringify({ r, bad }, null, 2) + '\n', 'utf8')
console.log('badges', r.flatMap(c => c.badges).length, 'outside', bad.length, bad.join('; ')); console.log(JSON.stringify(r[2]))
await browser.close(); server.close()
