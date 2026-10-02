// Opus review 5 of Task 857 (Revision 4) — independent pre-owner measurement of every O78-12 matrix Story:
// §7.3 table fit (AgentStatisticsView), cards switch, GR-3b overflow, GR-3c font sizes, GR-3d four-side gutters, aria roles.
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
}).listen(6112)

const P = 'patterns-mantine-'
const MATRIX = [
  'adminlistingsview--default', 'adminlistingsview--visible-filter', 'adminlistingsview--hidden-eligible', 'adminlistingsview--paginated',
  'listingpreviewdialogview--active', 'listingpreviewdialogview--sold-status-actions', 'listingpreviewdialogview--delete-confirm', 'listingpreviewdialogview--premium',
  'premiumdialogview--not-premium', 'premiumdialogview--premium', 'premiumdialogview--custom-date',
  'adminuserstable--default', 'adminexchangeprovidersview--default', 'adminpagesview--default', 'adminreportsview--default',
  'admincurrenciesview--default', 'agentstatisticsview--default',
  'admininquiriesview--default', 'adminpermissionsview--default', 'adminuserprofileview--view', 'admincurrencytabs--default', 'adminpageframe--shell',
].map(s => P + s).concat(['mantine-primitives-table--cards-below-lg'])
const WIDTHS = [320, 390, 768, 1024, 1440]
const LOCALES = ['sq', 'uk']

const measureFn = () => {
  const vw = innerWidth
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }
  const main = document.querySelector('.mantine-AppShell-main')
  const nav = document.querySelector('.mantine-AppShell-navbar')
  const modal = document.querySelector('.mantine-Modal-content, .mantine-Drawer-content, [role="dialog"]')
  // fonts: every visible element with direct text
  const texts = []
  for (const el of document.querySelectorAll('#storybook-root *, .mantine-Portal *')) {
    if (!vis(el)) continue
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    if (!own) continue
    const fs = parseFloat(getComputedStyle(el).fontSize)
    texts.push({ fs, tag: el.tagName, h: /^H[1-6]$/.test(el.tagName) || el.classList.contains('mantine-Title-root'), t: el.textContent.trim().slice(0, 30), inNav: !!(nav && nav.contains(el)), inHeader: !!el.closest('.mantine-AppShell-header') })
  }
  const pageTexts = texts.filter(x => !x.inNav && !x.inHeader)
  const maxFs = pageTexts.reduce((m, x) => Math.max(m, x.fs), 0)
  const headings = pageTexts.filter(x => x.h).map(x => `${x.tag}:${x.fs}`)
  // overflow: elements extending past the viewport (excluding scroll containers' children)
  const overflowX = document.documentElement.scrollWidth > vw + 1
  // gutter
  let gutter = null
  if (main) {
    const mr = main.getBoundingClientRect()
    let frame = null
    const w = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT)
    for (let n = w.nextNode(); n; n = w.nextNode()) { const cs = getComputedStyle(n); if (parseFloat(cs.paddingLeft) >= 16 && parseFloat(cs.paddingTop) >= 16) { frame = n; break } }
    if (frame) {
      const cs = getComputedStyle(frame), fr = frame.getBoundingClientRect()
      const kids = [...frame.children].filter(vis)
      const u = kids.reduce((a, k) => { const r = k.getBoundingClientRect(); return { l: Math.min(a.l, r.left), r: Math.max(a.r, r.right), t: Math.min(a.t, r.top), b: Math.max(a.b, r.bottom) } }, { l: 1e9, r: -1e9, t: 1e9, b: -1e9 })
      gutter = { kind: 'shell', navW: nav && vis(nav) ? Math.round(nav.getBoundingClientRect().width) : 0, mainLeft: Math.round(mr.left),
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat),
        contentFromFrame: [Math.round(u.t - fr.top), Math.round(fr.right - u.r), Math.round(fr.bottom - u.b), Math.round(u.l - fr.left)],
        frameFromMain: [Math.round(fr.top - mr.top), Math.round(mr.right - fr.right), null, Math.round(fr.left - mr.left)] }
    }
  } else {
    const root = document.querySelector('#storybook-root')
    const leaves = [...root.querySelectorAll('*')].filter(e => vis(e) && e.children.length === 0)
    const u = leaves.reduce((a, k) => { const r = k.getBoundingClientRect(); return { l: Math.min(a.l, r.left), r: Math.max(a.r, r.right), t: Math.min(a.t, r.top), b: Math.max(a.b, r.bottom) } }, { l: 1e9, r: -1e9, t: 1e9, b: -1e9 })
    const docH = Math.max(document.documentElement.scrollHeight, innerHeight)
    gutter = { kind: 'noshell', trbl: [Math.round(u.t + scrollY), Math.round(vw - u.r), Math.round(docH - (u.b + scrollY)), Math.round(u.l)] }
  }
  // modal
  let dlg = null
  if (modal && vis(modal)) { const r = modal.getBoundingClientRect(); dlg = { w: Math.round(r.width), l: Math.round(r.left), r: Math.round(vw - r.right), overflow: modal.scrollWidth > modal.clientWidth + 1 } }
  // tables
  const tables = [...document.querySelectorAll('table')].filter(vis).map(t => {
    const vp = t.closest('.mantine-ScrollArea-viewport') ?? t.parentElement
    const card = t.closest('.mantine-Paper-root') ?? vp
    const cr = card.getBoundingClientRect()
    const row = t.querySelector('tbody tr')
    const tds = row ? [...row.children].filter(vis) : []
    const f = tds[0], l = tds[tds.length - 1]
    const insL = f ? Math.round(f.getBoundingClientRect().left + parseFloat(getComputedStyle(f).paddingLeft) - cr.left) - 1 : null
    const insR = l ? Math.round(cr.right - (l.getBoundingClientRect().right - parseFloat(getComputedStyle(l).paddingRight))) - 1 : null
    return { card: Math.round(cr.width), scroll: vp.scrollWidth - vp.clientWidth, insL, insR, heads: [...t.querySelectorAll('thead th')].filter(vis).map(th => th.textContent.trim().slice(0, 14)) }
  })
  const cardsVisible = [...document.querySelectorAll('.mantine-Card-root')].filter(vis).length
  // aria inside AGT table
  const aria = [...document.querySelectorAll('table [aria-label]')].filter(vis).map(e => `${e.tagName.toLowerCase()}:${e.getAttribute('role') ?? '-'}`)
  return { overflowX, maxFs, headings: [...new Set(headings)].slice(0, 8), big: pageTexts.filter(x => x.fs >= 20).map(x => `${x.tag}:${x.fs}:${x.t}`).slice(0, 6), gutter, dlg, tables, cardsVisible, aria: [...new Set(aria)] }
}

const jobs = []
for (const id of MATRIX) for (const w of WIDTHS) for (const l of LOCALES) jobs.push([id, w, l])
for (const id of [P + 'agentstatisticsview--default']) for (const w of [1280]) for (const l of ['sq', 'en', 'uk', 'it']) jobs.push([id, w, l])
for (const id of [P + 'agentstatisticsview--default']) for (const w of [1024, 1440]) for (const l of ['en', 'it']) jobs.push([id, w, l])
for (const id of ['mantine-primitives-table--cards-below-lg', 'mantine-primitives-table--cards-below-md', 'mantine-primitives-table--default']) for (const w of [700, 1000, 1023]) jobs.push([id, w, 'sq'])
const out = { platform: process.platform + ' ' + process.version, rows: [] }
const browser = await chromium.launch()
async function worker() {
  const page = await (await browser.newContext()).newPage()
  while (jobs.length) {
    const [id, w, l] = jobs.shift()
    try {
      await page.setViewportSize({ width: w, height: 900 })
      await page.goto(`http://127.0.0.1:6112/iframe.html?id=${id}&globals=locale:${l}&viewMode=story`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('#storybook-root > *', { timeout: 20000 }).catch(() => {})
      await page.waitForTimeout(700)
      out.rows.push({ id: id.replace(P, ''), w, l, ...(await page.evaluate(measureFn)) })
    } catch (e) { out.rows.push({ id, w, l, error: String(e).slice(0, 200) }) }
  }
}
await Promise.all([worker(), worker(), worker()])
await browser.close(); server.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))
console.log('rows', out.rows.length, 'errors', out.rows.filter(r => r.error).length)
