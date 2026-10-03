// Task 857 Revision 3 — §7.3 TABLE FIT CHECK (AC17/AC19) and the R25 shell/gutter/type receipts (AC18, GR-3b/3c/3d).
// Run: node docs/sessions/evidence/task857/88-measure-r3.mjs <out.json>   (serves storybook-static on :6099)
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
const NAVBAR = 240
const LG = 1024
// Production card = viewport - navbar (from lg) - frame gutter each side, capped by the page maw (kickoff §18.2a).
function adminCard(w, maw, gutterKind) {
  const avail = w - (w >= LG ? NAVBAR : 0)
  const box = Math.min(avail, maw)
  const g = gutterKind === 'xl' ? 24 : (w >= LG ? 32 : 24)
  return box - 2 * g
}
const SHELL = 112 * REM, PAGE = 64 * REM, NARROW = 56 * REM
// [story id, route label, expected card fn (null = not asserted)]
const TABLES = [
  ['patterns-mantine-adminlistingsview--default', w => adminCard(w, SHELL, 'responsive')],
  ['patterns-mantine-adminlistingsview--paginated', w => adminCard(w, SHELL, 'responsive')],
  ['patterns-mantine-adminuserstable--default', w => adminCard(w, SHELL, 'xl')],
  ['patterns-mantine-adminuserstable--verified-tab', w => adminCard(w, SHELL, 'xl')],
  ['patterns-mantine-adminexchangeprovidersview--default', w => adminCard(w, PAGE, 'responsive')],
  ['patterns-mantine-adminpagesview--default', w => adminCard(w, NARROW, 'responsive')],
  ['patterns-mantine-adminreportsview--all-tab', w => adminCard(w, PAGE, 'responsive')],
  ['patterns-mantine-admincurrenciesview--default', w => adminCard(w, PAGE, 'responsive')],
  ['patterns-mantine-agentstatisticsview--default', w => ({ 768: 678, 1024: 934, 1280: 1190, 1440: 1350 })[w]],
  ['patterns-mantine-admintable--wrapped-title-column', null],
]
const TABLE_W = [768, 1024, 1280, 1440]
const LOCALES = ['sq', 'en', 'uk', 'it']

// R25 stories: [id, route frame props for the expected gutters]
const R25 = [
  ['patterns-mantine-adminlistingsview--default', 'responsive'],
  ['patterns-mantine-adminuserstable--default', 'xl'],
  ['patterns-mantine-admincurrencytabs--default', 'responsive'],
  ['patterns-mantine-admincurrenciesview--default', 'responsive'],
  ['patterns-mantine-adminexchangeprovidersview--default', 'responsive'],
  ['patterns-mantine-adminpagesview--default', 'responsive'],
  ['patterns-mantine-adminreportsview--all-tab', 'responsive'],
  ['patterns-mantine-admininquiriesview--default', 'responsive'],
  ['patterns-mantine-adminpermissionsview--default', 'xl'],
  ['patterns-mantine-adminuserprofileview--view', 'responsive'],
  ['patterns-mantine-adminuserprofileview--create', 'responsive'],
  ['patterns-mantine-adminpageframe--page', 'responsive'],
  ['patterns-mantine-adminpageframe--shell', 'responsive'],
  ['patterns-mantine-adminpageframe--shell-fixed-gutter', 'xl'],
  ['patterns-mantine-adminpageframe--narrow', 'responsive'],
  ['patterns-mantine-adminpageframe--panel', 'xl'],
  ['patterns-mantine-adminpageframe--form', 'responsive'],
]
const R25_W = [320, 390, 768, 1024, 1440]

const browser = await chromium.launch()
const out = { platform: process.platform + ' ' + process.version, tables: [], cards: [], shell: [], audit: [] }

async function open(page, id, w, l) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(`http://127.0.0.1:6099/iframe.html?id=${id}&globals=locale:${l}&viewMode=story`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(450)
}

const tableFn = () => {
  const vis = [...document.querySelectorAll('table')].filter(t => t.getBoundingClientRect().width > 0)
  return vis.map(t => {
    const vp = t.closest('.mantine-ScrollArea-viewport') ?? t.parentElement
    const card = t.closest('.mantine-Paper-root') ?? vp
    const cr = card.getBoundingClientRect()
    const rows = [...t.querySelectorAll('tbody tr')]
    const vtds = rows[0] ? [...rows[0].querySelectorAll('td')].filter(td => td.getBoundingClientRect().width > 0) : []
    const firstTd = vtds[0]
    const lastTd = vtds[vtds.length - 1]
    const inset = (td, side) => {
      if (!td) return null
      const r = td.getBoundingClientRect(), cs = getComputedStyle(td)
      // minus the card's 1px border: the inset from the card's inner edge
      return side === 'l' ? Math.round(r.left + parseFloat(cs.paddingLeft) - cr.left) - 1 : Math.round(cr.right - (r.right - parseFloat(cs.paddingRight))) - 1
    }
    const clipped = [...t.querySelectorAll('td')].filter(td => td.getBoundingClientRect().width > 0).some(td => td.getBoundingClientRect().right > cr.right + 1 || td.getBoundingClientRect().left < cr.left - 1)
    const clamps = [...t.querySelectorAll('[data-line-clamp]')].map(e => {
      const lh = parseFloat(getComputedStyle(e).lineHeight)
      return Math.round(e.getBoundingClientRect().height / lh)
    })
    return {
      cardW: Math.round(cr.width), tableW: Math.round(t.scrollWidth), viewW: vp.clientWidth, scrollW: vp.scrollWidth,
      scrolls: vp.scrollWidth > vp.clientWidth + 1, clipped,
      insetFirst: inset(firstTd, 'l'), insetLast: inset(lastTd, 'r'),
      maxTitleLines: clamps.length ? Math.max(...clamps) : null,
      headers: [...t.querySelectorAll('thead th')].filter(th => th.getBoundingClientRect().width > 0).map(th => th.textContent.trim()),
      colWidths: [...t.querySelectorAll('thead th')].filter(th => th.getBoundingClientRect().width > 0).map(th => Math.round(th.getBoundingClientRect().width)),
      hasMetaLine: !!rows[0]?.querySelector('.mantine-Text-root[data-size="xs"], [class*="Text-root"]'),
    }
  })
}

const shellFn = () => {
  const main = document.querySelector('.mantine-AppShell-main')
  const nav = document.querySelector('.mantine-AppShell-navbar')
  const navR = nav ? nav.getBoundingClientRect() : null
  if (!main) return { noShell: true }
  // the frame = the first descendant of main whose own padding-left >= 24px
  let frame = null
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_ELEMENT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const cs = getComputedStyle(n)
    if (parseFloat(cs.paddingLeft) >= 24 && parseFloat(cs.paddingTop) >= 24) { frame = n; break }
  }
  const mr = main.getBoundingClientRect()
  if (!frame) return { noFrame: true, mainLeft: Math.round(mr.left), navVisible: !!(navR && navR.width > 0) }
  const fr = frame.getBoundingClientRect(), cs = getComputedStyle(frame)
  const first = frame.firstElementChild
  const last = frame.lastElementChild
  const lastR = last ? last.getBoundingClientRect() : fr
  const firstR = first ? first.getBoundingClientRect() : fr
  const fonts = (sel) => [...frame.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0).slice(0, 3).map(e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10)
  return {
    navVisible: !!(navR && navR.width > 0), navW: navR ? Math.round(navR.width) : 0, mainLeft: Math.round(mr.left),
    pad: { t: parseFloat(cs.paddingTop), r: parseFloat(cs.paddingRight), b: parseFloat(cs.paddingBottom), l: parseFloat(cs.paddingLeft) },
    frameW: Math.round(fr.width), frameLeft: Math.round(fr.left),
    contentLeft: Math.round(firstR.left), contentTop: Math.round(firstR.top - mr.top), contentRight: Math.round(fr.right - lastR.right),
    contentBottomGap: Math.round(fr.bottom - lastR.bottom),
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    h: fonts('h1,h2,h3,h4,h5,h6,.mantine-Title-root'),
    body: fonts('.mantine-Text-root, p'),
  }
}

const jobs = []
for (const [id, fn] of TABLES) for (const w of TABLE_W) for (const l of LOCALES) jobs.push(['t', id, fn, w, l])
for (const [id, g] of TABLES.slice(0, 1).concat([])) void g
for (const [id, g] of R25) for (const w of R25_W) jobs.push(['s', id, g, w, 'sq'])
for (const [id] of TABLES) jobs.push(['c', id, null, 390, 'sq'])
for (const l of LOCALES) jobs.push(['a', 'patterns-mantine-adminlistingsview--hidden-eligible', null, 1024, l])

async function worker() {
  const page = await (await browser.newContext()).newPage()
  while (jobs.length) {
    const [kind, id, fn, w, l] = jobs.shift()
    await open(page, id, w, l)
    if (kind === 't') {
      const m = await page.evaluate(tableFn)
      const exp = fn ? fn(w) : null
      out.tables.push({ id, w, l, expectedCard: exp, tables: m.map(t => ({ ...t, cardOk: exp == null ? null : Math.abs(t.cardW - exp) <= 1 })) })
    } else if (kind === 's') {
      out.shell.push({ id, w, expectedGutterKind: fn, ...(await page.evaluate(shellFn)) })
    } else if (kind === 'c') {
      const cards = await page.evaluate(() => {
        const tbl = [...document.querySelectorAll('table')].some(t => t.getBoundingClientRect().width > 0)
        const hidden = document.querySelector('.mantine-hidden-from-md')
        const hr = hidden ? hidden.getBoundingClientRect() : null
        const cardEls = hidden ? [...hidden.querySelectorAll('.mantine-Card-root, [data-card]')] : []
        const insets = cardEls.slice(0, 3).map(c => {
          const r = c.getBoundingClientRect(), inner = c.firstElementChild?.getBoundingClientRect()
          return inner ? { l: Math.round(inner.left - r.left), r: Math.round(r.right - inner.right) } : null
        })
        return { tableVisible: tbl, cardsBoxW: hr ? Math.round(hr.width) : 0, cardCount: cardEls.length, insets }
      })
      out.cards.push({ id, w, l, ...cards })
    } else if (kind === 'a') {
      const sizes = await page.evaluate(() => [...document.querySelectorAll('.mantine-Paper-root button')].map(b => ({ t: b.textContent.trim().slice(0, 24), fs: parseFloat(getComputedStyle(b.querySelector('p, .mantine-Text-root') ?? b).fontSize) })))
      out.audit.push({ l, sizes })
    }
    process.stdout.write('.')
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close(); server.close()
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1))

// ---- summary ----
const fail = []
const rows = {}
for (const r of out.tables) for (const t of r.tables) {
  const k = `${r.id.replace('patterns-mantine-', '')} @${r.w}`
  ;(rows[k] ??= []).push(`${r.l}:${t.scrolls ? 'SCROLL+' + (t.scrollW - t.viewW) : 'ok'}${t.clipped ? ' CLIP' : ''}(card ${t.cardW}${t.cardOk === false ? ' !=' + r.expectedCard : ''}; in ${t.insetFirst}/${t.insetLast}${t.maxTitleLines ? '; ' + t.maxTitleLines + 'ln' : ''})`)
  if (t.scrolls || t.clipped || t.cardOk === false || t.insetFirst !== 24 || t.insetLast !== 24) fail.push(k + ' ' + r.l)
}
console.log('\n' + Object.entries(rows).map(([k, v]) => k + '\n   ' + v.join('\n   ')).join('\n'))
console.log('\nTABLE FIT FAILURES:', fail.length, fail.slice(0, 80).join(' | '))
