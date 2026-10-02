// Renders the real PremiumDialogView radios at DPR 1 under size/border variants, then shows each crop 10x pixelated.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6115)
const VARIANTS = [
  ['16 now', ''],
  ['16 dot8', '.mantine-Radio-root{--radio-icon-size:0.5rem!important}'],
  ['20 dot8', '.mantine-Radio-root{--radio-size:1.25rem!important;--radio-icon-size:0.5rem!important}'],
  ['20 dot10', '.mantine-Radio-root{--radio-size:1.25rem!important;--radio-icon-size:0.625rem!important}'],
]
const browser = await chromium.launch()
const page = await (await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1340, height: 768 } })).newPage()
const crops = []
for (const [name, css] of VARIANTS) {
  await page.goto('http://127.0.0.1:6115/iframe.html?id=patterns-mantine-premiumdialogview--not-premium&globals=locale:en&viewMode=story')
  await page.waitForSelector('.mantine-Radio-radio', { timeout: 20000 })
  if (css) await page.addStyleTag({ content: css })
  // check the first radio so both states show
  await page.locator('.mantine-Radio-radio').first().check({ force: true }).catch(() => {})
  await page.waitForTimeout(500)
  const radios = await page.$$('.mantine-Radio-radio')
  const bufs = []
  for (const r of radios.slice(0, 2)) {
    const b = await r.boundingBox()
    bufs.push((await page.screenshot({ clip: { x: b.x - 3, y: b.y - 3, width: b.width + 6, height: b.height + 6 } })).toString('base64'))
  }
  crops.push([name, bufs])
}
const html = `<body style="margin:16px;font:14px sans-serif;background:#fff">${crops.map(([n, b]) => `<div style="display:flex;gap:24px;align-items:center;margin-bottom:12px"><div style="width:120px">${n}</div>${b.map(x => `<img src="data:image/png;base64,${x}" style="image-rendering:pixelated;width:${10 * 26}px">`).join('')}${b.map(x => `<img src="data:image/png;base64,${x}">`).join('')}</div>`).join('')}</body>`
const p2 = await (await browser.newContext({ viewport: { width: 900, height: 1500 } })).newPage()
await p2.setContent(html)
await p2.waitForTimeout(300)
await p2.screenshot({ path: OUT, fullPage: true })
await browser.close(); server.close()
console.log('ok')

