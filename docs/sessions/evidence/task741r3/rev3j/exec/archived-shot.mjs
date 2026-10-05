// Task 741 Revision 3j AC63 — re-shot of the archived card on the primitive Story at 1440 (3i's primitive-archived-1440.png).
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).split(String.fromCharCode(92)).join('/').replace(/^\/+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=mantine-primitives-listingcard--default&viewMode=story&globals=locale:en`)
await p.waitForSelector('.mantine-Card-root[class*="archived"]'); await p.waitForTimeout(2500)
const el = await p.$('.mantine-SimpleGrid-root .mantine-Card-root[class*="archived"]')
await el.screenshot({ path: 'docs/sessions/evidence/task741r3/rev3j/exec/primitive-archived-1440.png' })
await b.close(); server.close(); console.log('ok')
