// Task 923 Review 45 (Opus, 2026-10-23): screenshots of Patterns/Mantine/CabinetEmailChangeSectionView from the built Storybook (storybook-static, read-only) for Opus's own look.
// Usage (repository root): node docs/sessions/evidence/task923/review-45/rv45-12-shots.mjs <out dir> <width,...> <locale,...> <story,...>
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.resolve('package.json'))
const { chromium } = require('playwright')
const [OUT, WIDTHS, LOCALES, STORIES] = process.argv.slice(2)
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' })
    res.end(d)
  })
})
await new Promise((r) => server.listen(0, r))
const port = server.address().port
fs.mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
for (const w of WIDTHS.split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  for (const locale of LOCALES.split(',')) {
    for (const s of STORIES.split(',')) {
      await page.goto(`http://127.0.0.1:${port}/iframe.html?id=patterns-mantine-cabinetemailchangesectionview--${s}&viewMode=story&globals=locale:${locale}`)
      await page.waitForSelector('#storybook-root .mantine-Stack-root', { timeout: 20000 })
      await page.waitForTimeout(400)
      const file = path.join(OUT, `${s}-${w}-${locale}.png`)
      await page.screenshot({ path: file, fullPage: true })
      console.log(file)
    }
  }
  await page.close()
}
await browser.close()
server.close()
