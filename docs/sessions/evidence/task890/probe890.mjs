// Task 890 measurement probe — real Chromium against storybook-static (GR-3b/3c/3d receipts + ACs).
// Usage: node docs/sessions/evidence/task890/probe890.mjs > docs/sessions/evidence/task890/probe890.out.txt
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

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
const browser = await chromium.launch()
const SHOTS = path.resolve('docs/sessions/evidence/task890/shots')
fs.mkdirSync(SHOTS, { recursive: true })

async function open(id, w, locale = 'en') {
  const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)) })
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'load' })
  await page.waitForSelector('#storybook-root > :not(style)', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(2500)
  return { ctx, page, errors }
}

const out = []
const log = (s) => { out.push(s); console.log(s) }
const VIEW = 'patterns-mantine-admindashboardview'
const WIDTHS = [320, 390, 768, 1024, 1440]

// ── per-width measurement common to every story ────────────────────────────────────────────────
async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const root = document.querySelector('#storybook-root')
    const vw = doc.clientWidth
    // the first content box inside the root that has layout — the dashboard grid's own root Box
    const first = [...root.querySelectorAll('*')].find((el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).display !== 'contents')
    const card = root.querySelector('.mantine-Card-root')
    const r = (card ?? first)?.getBoundingClientRect()
    const scrollers = [...document.querySelectorAll('*')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 && ['auto', 'scroll', 'hidden'].includes(getComputedStyle(el).overflowX) && el.clientWidth > 0)
      .map((el) => `${el.tagName.toLowerCase()}[${el.textContent.trim().slice(0, 24)}] ${el.scrollWidth}>${el.clientWidth}`)
    const fs = (sel) => [...document.querySelectorAll(sel)].map((el) => parseFloat(getComputedStyle(el).fontSize))
    const h1 = [...document.querySelectorAll('#storybook-root h1, #storybook-root [data-order="1"]')][0]
    const cardTitles = [...document.querySelectorAll('h2, h3, h4')].map((el) => `${el.tagName}:${el.textContent.trim().slice(0, 28)}:${parseFloat(getComputedStyle(el).fontSize)}`)
    return {
      vw,
      docScroll: doc.scrollWidth,
      overflowX: doc.scrollWidth > vw + 1,
      edgeLeft: r ? Math.round(r.left) : null,
      edgeRight: r ? Math.round(vw - [...root.querySelectorAll('.mantine-Card-root')].reduce((mx, c) => Math.max(mx, c.getBoundingClientRect().right), 0)) : null,
      gridW: r ? Math.round(r.width) : null,
      scrollers,
      h1: [...document.querySelectorAll('#storybook-root h1')].map((e) => e.textContent.trim().slice(0, 14) + ':' + parseFloat(getComputedStyle(e).fontSize)).join(','),
      titles: cardTitles.slice(0, 14),
      maxFont: Math.max(...fs('#storybook-root *')),
    }
  })
}

for (const loc of ['en', 'uk']) {
  log(`\n===== ${VIEW}--default locale=${loc} =====`)
  for (const w of WIDTHS) {
    const { ctx, page, errors } = await open(`${VIEW}--default`, w, loc)
    const m = await measure(page)
    log(`${w}: vw ${m.vw} docScroll ${m.docScroll} overflowX ${m.overflowX} edge L/R ${m.edgeLeft}/${m.edgeRight} grid ${m.gridW} h1 ${m.h1} maxFont ${m.maxFont} scrollers ${JSON.stringify(m.scrollers)} errors ${errors.length}`)
    if (loc === 'en') log('   titles: ' + m.titles.join(' | '))
    if (errors.length) log('   ERR ' + errors.slice(0, 3).join(' // '))
    if (loc === 'en' && (w === 1440 || w === 390)) await page.screenshot({ path: path.join(SHOTS, `default-${loc}-${w}.png`), fullPage: true })
    await ctx.close()
  }
}

// ── AC4-AC7 structure at 1440 (Default) ─────────────────────────────────────────────────────────
{
  const { ctx, page } = await open(`${VIEW}--default`, 1440)
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#storybook-root .mantine-Card-root')]
    const bg = (el) => getComputedStyle(el).backgroundColor
    const info = cards.map((c, i) => {
      const t = c.querySelector('h2,h3,h4,h5')?.textContent?.trim().slice(0, 40) ?? c.innerText.trim().split(String.fromCharCode(10)).slice(0, 3).join(' / ').slice(0, 60)
      return { i, t, top: Math.round(c.getBoundingClientRect().top + scrollY), left: Math.round(c.getBoundingClientRect().left), w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height), bg: bg(c) + ' img ' + getComputedStyle(c).backgroundImage.slice(0, 60), bars: c.querySelectorAll('.apexcharts-bar-area').length, anchors: c.querySelectorAll('a').length, series: c.querySelectorAll('.apexcharts-line-series .apexcharts-series, .apexcharts-area-series .apexcharts-series').length, aria: [...c.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((a) => /per day|trend|activity|Platform|listings/i.test(a)).slice(0, 3) }
    })
    return info
  })
  log('\n===== Default @1440 cards (DOM order) =====')
  r.forEach((c) => log(`${c.i}: top ${c.top} left ${c.left} ${c.w}x${c.h} bg ${c.bg} bars ${c.bars} <a> ${c.anchors} series ${c.series} "${c.t}" aria ${JSON.stringify(c.aria)}`))
  await ctx.close()
}

// ── states ──────────────────────────────────────────────────────────────────────────────────────
for (const name of ['activity-stale', 'activity-error', 'activity-empty-period', 'trends-error', 'cities-only-other', 'adm02-error', 'all-queues-zero', 'adm09-zero', 'no-location-requests']) {
  for (const w of [1440, 390]) {
    const { ctx, page, errors } = await open(`${VIEW}--${name}`, w)
    const m = await measure(page)
    const txt = await page.evaluate(() => {
      const t = document.querySelector('#storybook-root').innerText
      return {
        stale: /Data updated at/.test(t),
        retry: (t.match(/Retry/g) || []).length,
        totalsRows: [...document.querySelectorAll('#storybook-root')].length,
        bars: document.querySelectorAll('.apexcharts-bar-area').length,
        head: t.split('\n').filter((l) => /Updated|updated/.test(l)).slice(0, 2),
      }
    })
    log(`${name}@${w}: overflowX ${m.overflowX} edge ${m.edgeLeft}/${m.edgeRight} stale-caption ${txt.stale} retry-buttons ${txt.retry} bars ${txt.bars} header ${JSON.stringify(txt.head)} errors ${errors.length}`)
    if (errors.length) log('   ERR ' + errors.slice(0, 2).join(' // '))
    if (w === 1440 && ['activity-stale', 'activity-error', 'activity-empty-period', 'trends-error', 'cities-only-other'].includes(name)) await page.screenshot({ path: path.join(SHOTS, `${name}-en-1440.png`), fullPage: true })
    await ctx.close()
  }
}

// ── StatRows NoLinks + gutter ───────────────────────────────────────────────────────────────────
for (const sid of ['patterns-mantine-dashboardstatrows--default', 'patterns-mantine-dashboardstatrows--no-links', 'patterns-mantine-dashboardstatrows--loading', 'patterns-mantine-dashboardstatrows--error']) {
  for (const w of [320, 390, 1024, 1440]) {
    const { ctx, page, errors } = await open(sid, w)
    const m = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const root = document.querySelector('#storybook-root')
      const first = [...root.querySelectorAll('*')].find((el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).display !== 'contents' && el.children.length)
      const r = { left: Math.min(...[...root.querySelectorAll('p,a,span,.mantine-Skeleton-root,.mantine-Alert-root')].map((e) => e.getBoundingClientRect().left).filter((x) => x >= 0)) }
      const c = { left: first.getBoundingClientRect().left }
      return { vw, left: Math.round(r.left), rootLeft: Math.round(c.left), anchors: root.querySelectorAll('a').length, svgs: root.querySelectorAll('svg').length, over: document.documentElement.scrollWidth > vw + 1, fonts: [...new Set([...root.querySelectorAll('p,span,a')].map((e) => parseFloat(getComputedStyle(e).fontSize)))] }
    })
    log(`${sid}@${w}: edge-left ${m.left} (root ${m.rootLeft}) overflow ${m.over} <a> ${m.anchors} svg ${m.svgs} fonts ${JSON.stringify(m.fonts)} errors ${errors.length}`)
    await ctx.close()
  }
}

fs.writeFileSync('docs/sessions/evidence/task890/probe890.out.txt', out.join('\n') + '\n')
await browser.close()
server.close()
