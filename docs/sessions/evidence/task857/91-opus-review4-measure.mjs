// Opus review 4 of Task 857 r3 — independent table-fit spot check + AgentStatisticsView option simulation.
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
}).listen(6111)

const IDS = [
  'patterns-mantine-adminlistingsview--default',
  'patterns-mantine-adminuserstable--default',
  'patterns-mantine-adminexchangeprovidersview--default',
  'patterns-mantine-adminpagesview--default',
  'patterns-mantine-adminreportsview--all-tab',
  'patterns-mantine-admincurrenciesview--default',
  'patterns-mantine-agentstatisticsview--default',
  'patterns-mantine-admintable--wrapped-title-column',
]
const out = { platform: process.platform + ' ' + process.version, fit: [], agt: [] }
const browser = await chromium.launch()
const page = await (await browser.newContext()).newPage()
async function open(id, w, l) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(`http://127.0.0.1:6111/iframe.html?id=${id}&globals=locale:${l}&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(600)
}
const fitFn = () => [...document.querySelectorAll('table')].filter(t => t.getBoundingClientRect().width > 0).map(t => {
  const vp = t.closest('.mantine-ScrollArea-viewport') ?? t.parentElement
  const card = t.closest('.mantine-Paper-root') ?? vp
  const nav = document.querySelector('.mantine-AppShell-navbar')
  const ths = [...t.querySelectorAll('thead th')].filter(th => th.getBoundingClientRect().width > 0)
  return {
    card: Math.round(card.getBoundingClientRect().width), cardLeft: Math.round(card.getBoundingClientRect().left),
    navW: nav ? Math.round(nav.getBoundingClientRect().width) : null,
    client: vp.clientWidth, scroll: vp.scrollWidth,
    cols: ths.map(th => `${th.textContent.trim().slice(0, 18)}=${Math.round(th.getBoundingClientRect().width)}`),
  }
})
for (const id of IDS) for (const w of [768, 1024, 1280, 1440]) for (const l of ['uk', 'sq']) {
  await open(id, w, l)
  out.fit.push({ id: id.replace('patterns-mantine-', ''), w, l, t: await page.evaluate(fitFn) })
}
// AgentStatisticsView option simulation: hide columns by header index, re-measure scroll.
const simFn = (hideKeys) => {
  const t = [...document.querySelectorAll('table')].find(x => x.getBoundingClientRect().width > 0)
  const vp = t.closest('.mantine-ScrollArea-viewport') ?? t.parentElement
  const ths = [...t.querySelectorAll('thead th')]
  const labels = ths.map(th => th.textContent.trim())
  const idx = hideKeys.map(k => k)
  for (const tr of t.querySelectorAll('tr')) [...tr.children].forEach((c, i) => { if (idx.includes(i)) c.style.display = 'none' })
  const r = { labels, client: vp.clientWidth, scroll: vp.scrollWidth, cols: ths.map(th => Math.round(th.getBoundingClientRect().width)) }
  for (const tr of t.querySelectorAll('tr')) [...tr.children].forEach(c => { c.style.display = '' })
  return r
}
// column order: 0 title, 1 status, 2 expires, 3 counts, 4 activity, 5 actions
const OPTIONS = { none: [], hideActivity: [4], hideExpires: [2], hideExpiresAndActivity: [2, 4] }
for (const w of [768, 1024]) for (const l of ['sq', 'en', 'uk', 'it']) {
  await open('patterns-mantine-agentstatisticsview--default', w, l)
  for (const [name, keys] of Object.entries(OPTIONS)) out.agt.push({ w, l, name, ...(await page.evaluate(simFn, keys)) })
}
await browser.close(); server.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
for (const r of out.fit) for (const t of r.t) console.log(`${r.id} @${r.w} ${r.l}: card ${t.card} left ${t.cardLeft} nav ${t.navW} ${t.scroll > t.client + 1 ? 'SCROLL +' + (t.scroll - t.client) : 'fit'} | ${t.cols.join(', ')}`)
for (const a of out.agt) console.log(`AGT @${a.w} ${a.l} ${a.name}: ${a.scroll > a.client + 1 ? 'SCROLL +' + (a.scroll - a.client) : 'fit'} (client ${a.client}) cols ${a.cols.join('/')}`)
