// Task 890 revision 1 probe — real Chromium against storybook-static.
// node docs/sessions/evidence/task890/rev1/probe-rev1.mjs <out-file> <id-regex> [widths] [locales]
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const [outFile, idRegex, widthsArg, localesArg] = process.argv.slice(2)
const WIDTHS = (widthsArg ?? '320,390,768,1024,1280,1440').split(',').map(Number)
const LOCALES = (localesArg ?? 'en,uk').split(',')
const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' }
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}`
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const ids = Object.entries(index.entries).filter(([k, e]) => e.type === 'story' && new RegExp(idRegex).test(k)).map(([k]) => k)
const browser = await chromium.launch()
const out = []
const log = (s) => { out.push(s); console.log(s) }
log(`# ids (${ids.length}): ${ids.join(' ')}`)

async function measure(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const root = document.querySelector('#storybook-root')
    const cards = [...root.querySelectorAll('.mantine-Card-root')]
    const rect = (el) => el.getBoundingClientRect()
    const firstTop = cards.length ? Math.round(rect(cards[0]).top) : null
    const row1 = cards.filter((c) => Math.abs(Math.round(rect(c).top) - firstTop) <= 2).map((c) => Math.round(rect(c).width))
    const main = root.querySelector('.mantine-AppShell-main')
    const mainLeft = main ? Math.round(rect(main).left) : 0
    const mainRight = main ? Math.round(rect(main).right) : vw
    const left = cards.length ? Math.round(Math.min(...cards.map((c) => rect(c).left))) : null
    const right = cards.length ? Math.round(Math.max(...cards.map((c) => rect(c).right))) : null
    const clipped = [...root.querySelectorAll('p, a, span')]
      .filter((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && ['hidden', 'auto', 'scroll', 'clip'].includes(getComputedStyle(el).overflowX))
      .map((el) => `${el.tagName.toLowerCase()}[${el.textContent.trim().slice(0, 26)}] ${el.scrollWidth}>${el.clientWidth}`)
    const title = root.querySelector('h1')
    const h2 = [...root.querySelectorAll('h2')].map((e) => parseFloat(getComputedStyle(e).fontSize))
    return {
      vw,
      overflow: document.documentElement.scrollWidth > vw + 1,
      row1,
      edgeViewport: left === null ? null : `${left}/${vw - right}`,
      edgeMain: left === null ? null : `${left - mainLeft}/${mainRight - right}`,
      hasShell: Boolean(main),
      clipped,
      h1: title ? parseFloat(getComputedStyle(title).fontSize) : null,
      h2max: h2.length ? Math.max(...h2) : null,
      maxFont: Math.max(...[...root.querySelectorAll('*')].map((e) => parseFloat(getComputedStyle(e).fontSize) || 0)),
    }
  })
}

for (const id of ids) {
  for (const loc of LOCALES) {
    for (const w of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } })
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`, { waitUntil: 'load' })
      await page.waitForSelector('#storybook-root > :not(style)', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(2200)
      const m = await measure(page)
      log(`${id} ${loc} ${w}: overflow ${m.overflow} row1 [${m.row1.join(',')}] edge(viewport) ${m.edgeViewport} edge(main) ${m.edgeMain} shell ${m.hasShell} h1 ${m.h1} h2max ${m.h2max} maxFont ${m.maxFont} clipped ${JSON.stringify(m.clipped)}${errors.length ? ' ERR ' + errors[0].slice(0, 80) : ''}`)
      await ctx.close()
    }
  }
}
fs.writeFileSync(outFile, out.join('\n') + '\n')
await browser.close()
server.close()
