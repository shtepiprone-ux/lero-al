// Task 927 Amendment 9 (a9-05 part 2): read-only check of what rises in the AuthSheet Login Story after Google's button settled.
// On the built Storybook served on localhost (mobile emulation, like rv8-07), it prints the dialog height before and after the late rise, and the box of every red/blue Alert in the dialog.
// Usage (repository root): node docs/sessions/evidence/task927/a9/a9-05-alert-check.mjs
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { chromium } from 'playwright'

const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!p.startsWith(ROOT)) { res.writeHead(404); res.end(); return }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
})
await new Promise((r) => server.listen(0, 'localhost', r))
const port = server.address().port
const browser = await chromium.launch()
const lines = ['# a9-05 part 2: what rises in the AuthSheet Login dialog after Google\'s button settled', `platform: ${os.platform()} ${os.release()}`, `node: ${process.version}`, `cwd: ${process.cwd()}`, 'command: node docs/sessions/evidence/task927/a9/a9-05-alert-check.mjs', '']
for (const [width, locale] of [[320, 'en'], [320, 'uk'], [390, 'en'], [390, 'uk'], [639, 'en'], [639, 'uk']]) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
  const page = await context.newPage()
  await page.goto(`http://localhost:${port}/iframe.html?id=patterns-mantine-authsheet--login&viewMode=story&globals=locale:${locale}`)
  await page.waitForSelector('[role="dialog"]', { timeout: 30000 })
  const sample = () => page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    const alerts = [...d.querySelectorAll('.mantine-Alert-root')].map((a) => ({ cls: a.getAttribute('data-variant') + '/' + (a.style.getPropertyValue('--alert-bg') || ''), h: Math.round(a.getBoundingClientRect().height * 10) / 10, text: a.textContent.slice(0, 70) }))
    return { h: Math.round(d.getBoundingClientRect().height * 10) / 10, alerts }
  })
  await page.waitForTimeout(1200)
  const early = await sample()
  await page.waitForTimeout(3500)
  const late = await sample()
  lines.push(`${width} ${locale}: early h=${early.h} alerts=${JSON.stringify(early.alerts)} | late h=${late.h} alerts=${JSON.stringify(late.alerts)} | rise=${Math.round((late.h - early.h) * 10) / 10}`)
  await context.close()
}
lines.push('', 'exit code: 0')
fs.writeFileSync('docs/sessions/evidence/task927/a9/a9-05b-alert-check.txt', lines.join('\n') + '\n')
console.log(lines.slice(5).join('\n'))
await browser.close()
server.close()
