// Opus review 3 (Task 857): every Mantine table measured at its production container width.
// Admin Stories: body padding-left 240 at >= 1024 (AdminShell navbar) and #storybook-root max-width = the page Box maw.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6099)
const REM = 16
const STORIES = [
  ['patterns-mantine-adminlistingsview--default', 112 * REM, true],
  ['patterns-mantine-adminuserstable--default', 112 * REM, true],
  ['patterns-mantine-admincurrenciesview--default', 64 * REM, true],
  ['patterns-mantine-adminexchangeprovidersview--default', 64 * REM, true],
  ['patterns-mantine-adminpagesview--default', 56 * REM, true],
  ['patterns-mantine-adminreportsview--all-tab', 64 * REM, true],
  ['patterns-mantine-agentstatisticsview--default', null, false],
  ['patterns-mantine-adminsurfacepattern--default', null, false],
  ['patterns-mantine-admintable--default', null, false],
]
const browser = await chromium.launch()
const out = []
const jobs = []
for (const [id, maw, admin] of STORIES) for (const w of [768, 1024, 1280, 1440]) for (const l of ['sq', 'uk']) jobs.push([id, maw, admin, w, l])
async function worker() {
  const page = await (await browser.newContext()).newPage()
  while (jobs.length) {
  const [id, maw, admin, w, l] = jobs.shift()
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(`http://127.0.0.1:6099/iframe.html?id=${id}&globals=locale:${l}&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('table', { timeout: 5000 }).catch(() => {})
  await page.evaluate(([maw, admin]) => {
    if (admin && innerWidth >= 1024) document.body.style.paddingLeft = '240px'
    if (admin && maw) { const r = document.querySelector('#storybook-root'); r.style.maxWidth = maw + 'px'; r.style.margin = '0 auto' }
  }, [maw, admin])
  await page.waitForTimeout(300)
  const m = await page.evaluate(() => [...document.querySelectorAll('table')].filter(t => t.getBoundingClientRect().width > 0).map(t => {
    const vp = t.closest('.mantine-ScrollArea-viewport') ?? t.parentElement
    const card = t.closest('.mantine-Paper-root') ?? vp
    return { cardW: Math.round(card.getBoundingClientRect().width), tableW: Math.round(t.scrollWidth), viewW: vp.clientWidth, scrolls: vp.scrollWidth > vp.clientWidth + 1, over: vp.scrollWidth - vp.clientWidth,
      cols: [...t.querySelectorAll('thead th')].filter(th => th.getBoundingClientRect().width > 0).map(th => Math.round(th.getBoundingClientRect().width)) }
  }))
  out.push({ id, w, l, tables: m }); process.stdout.write('.')
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close(); server.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
const sum = {}
for (const r of out) for (const t of r.tables) { const k = `${r.id.replace('patterns-mantine-', '')} @${r.w}`; (sum[k] ??= []).push(`${r.l}:${t.scrolls ? 'SCROLL+' + t.over : 'ok'}(card ${t.cardW})`) }
console.log('\n' + Object.entries(sum).map(([k, v]) => k + '  ' + v.join(' ')).join('\n'))
