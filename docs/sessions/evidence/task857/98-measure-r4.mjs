// Task 857 Revision 4 — AC20: AgentStatisticsView table fit (dates merged, cards below 1024), cards at 390/768,
// Mantine/Primitives/Table cards-below-lg/md/default switch widths, aria-group roles, and the R35 receipts data.
// Run: node docs/sessions/evidence/task857/98-measure-r4.mjs <out.json>   (serves storybook-static on :6098)
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
}).listen(6098)

const AGT = 'patterns-mantine-agentstatisticsview--default'
const WRAP = 'patterns-mantine-admintable--wrapped-title-column'
const TBL = ['default', 'cards-below-md', 'cards-below-lg'].map(n => 'mantine-primitives-table--' + n)
const LOCALES = ['sq', 'en', 'uk', 'it']
const EXPECTED = { 1024: 934, 1280: 1190, 1440: 1350 }

const browser = await chromium.launch()
const out = { platform: process.platform + ' ' + process.version, fit: [], cards: [], aria: [], switch: [], receipts: [] }

async function open(page, id, w, l) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(`http://127.0.0.1:6098/iframe.html?id=${id}&globals=locale:${l}&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(450)
}

const fitFn = () => {
  const vis = [...document.querySelectorAll('table')].filter(t => t.getBoundingClientRect().width > 0)
  return vis.map(t => {
    const vp = t.closest('.mantine-ScrollArea-viewport') ?? t.parentElement
    const card = t.closest('.mantine-Paper-root') ?? vp
    const cr = card.getBoundingClientRect()
    const rows = [...t.querySelectorAll('tbody tr')]
    const vtds = rows[0] ? [...rows[0].querySelectorAll('td')].filter(td => td.getBoundingClientRect().width > 0) : []
    const inset = (td, side) => {
      if (!td) return null
      const r = td.getBoundingClientRect(), cs = getComputedStyle(td)
      return side === 'l' ? Math.round(r.left + parseFloat(cs.paddingLeft) - cr.left) - 1 : Math.round(cr.right - (r.right - parseFloat(cs.paddingRight))) - 1
    }
    const clipped = [...t.querySelectorAll('td')].filter(td => td.getBoundingClientRect().width > 0).some(td => td.getBoundingClientRect().right > cr.right + 1 || td.getBoundingClientRect().left < cr.left - 1)
    return {
      cardW: Math.round(cr.width), tableW: Math.round(t.scrollWidth), viewW: vp.clientWidth, scrollW: vp.scrollWidth,
      scrolls: vp.scrollWidth > vp.clientWidth + 1, clipped, insetFirst: inset(vtds[0], 'l'), insetLast: inset(vtds[vtds.length - 1], 'r'),
      headers: [...t.querySelectorAll('thead th')].filter(th => th.getBoundingClientRect().width > 0).map(th => th.textContent.trim()),
      colWidths: [...t.querySelectorAll('thead th')].filter(th => th.getBoundingClientRect().width > 0).map(th => Math.round(th.getBoundingClientRect().width)),
    }
  })
}
const cardsFn = () => {
  const tbl = [...document.querySelectorAll('table')].some(t => t.getBoundingClientRect().width > 0)
  const hidden = document.querySelector('.mantine-hidden-from-lg, .mantine-hidden-from-md')
  const visibleCards = hidden && hidden.getBoundingClientRect().width > 0
  const cardEls = hidden ? [...hidden.querySelectorAll('.mantine-Card-root, [data-card]')] : []
  return { tableVisible: tbl, cardsVisible: !!visibleCards, cardCount: cardEls.length, firstCardText: cardEls[0]?.textContent.slice(0, 160) ?? null }
}
const ariaFn = () => {
  const tbl = [...document.querySelectorAll('table')].find(t => t.getBoundingClientRect().width > 0)
  if (!tbl) return { noTable: true }
  const els = [...tbl.querySelectorAll('tbody tr:first-child [aria-label]')].filter(e => !e.hasAttribute('aria-hidden'))
  return { count: els.length, all: els.every(e => e.getAttribute('role') === 'group'), labels: els.map(e => e.getAttribute('aria-label')) }
}
const recFn = () => {
  const root = document.querySelector('#storybook-root')
  const fs = sel => [...root.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0).slice(0, 2).map(e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10)
  const rects = [...root.querySelectorAll('*')].filter(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0)
  const minL = Math.min(...rects.map(e => e.getBoundingClientRect().left))
  const maxR = Math.max(...rects.map(e => e.getBoundingClientRect().right))
  const minT = Math.min(...rects.map(e => e.getBoundingClientRect().top))
  const doc = document.documentElement
  return {
    overflowX: doc.scrollWidth > innerWidth + 1, h: fs('h1,h2,h3,h4,h5,h6,.mantine-Title-root'), body: fs('.mantine-Text-root, p, td'),
    left: Math.round(minL), right: Math.round(innerWidth - maxR), top: Math.round(minT), bottom: Math.round(doc.scrollHeight - Math.max(...rects.map(e => e.getBoundingClientRect().bottom + scrollY))),
  }
}

const jobs = []
for (const w of [1024, 1280, 1440]) for (const l of LOCALES) jobs.push(['fit', AGT, w, l])
for (const w of [390, 768]) for (const l of ['sq', 'uk']) jobs.push(['cards', AGT, w, l])
for (const w of [1024, 1280, 1440]) for (const l of ['sq', 'uk']) jobs.push(['aria', AGT, w, l])
for (const id of TBL) for (const w of [700, 1000, 1024]) jobs.push(['switch', id, w, 'sq'])
for (const id of [AGT, WRAP, TBL[2]]) for (const w of [320, 390, 768, 1024, 1440]) jobs.push(['rec', id, w, 'sq'])

async function worker() {
  const page = await (await browser.newContext()).newPage()
  while (jobs.length) {
    const [k, id, w, l] = jobs.shift()
    await open(page, id, w, l)
    if (k === 'fit') { const m = await page.evaluate(fitFn); out.fit.push({ id, w, l, expectedCard: EXPECTED[w], tables: m.map(t => ({ ...t, cardOk: Math.abs(t.cardW - EXPECTED[w]) <= 1 })) }) }
    else if (k === 'cards') out.cards.push({ id, w, l, ...(await page.evaluate(cardsFn)) })
    else if (k === 'aria') out.aria.push({ id, w, l, ...(await page.evaluate(ariaFn)) })
    else if (k === 'switch') out.switch.push({ id, w, ...(await page.evaluate(() => ({ tableVisible: [...document.querySelectorAll('table')].some(t => t.getBoundingClientRect().width > 0) }))) })
    else out.receipts.push({ id, w, ...(await page.evaluate(recFn)) })
    process.stdout.write('.')
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close(); server.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
const bad = []
for (const r of out.fit) for (const t of r.tables) if (t.scrolls || t.clipped || !t.cardOk || t.insetFirst !== 24 || t.insetLast !== 24) bad.push(`${r.w} ${r.l} card ${t.cardW} (exp ${r.expectedCard}) scroll ${t.scrollW - t.viewW} clip ${t.clipped} in ${t.insetFirst}/${t.insetLast} cols ${t.colWidths}`)
console.log('\nFIT FAILURES:', bad.length, '\n' + bad.join('\n'))
console.log('HEADERS', JSON.stringify([...new Set(out.fit.map(r => r.tables[0]?.headers.join('|')))]))
console.log('CARDS', JSON.stringify(out.cards.map(c => [c.w, c.l, c.tableVisible, c.cardsVisible, c.cardCount])))
console.log('ARIA', JSON.stringify(out.aria.map(a => [a.w, a.l, a.count, a.all])))
console.log('SWITCH', JSON.stringify(out.switch.map(s => [s.id.replace('mantine-primitives-table--', ''), s.w, s.tableVisible ? 'table' : 'cards'])))
