// Task 859 Revision 8 (Sonnet) - AC49. Copy of review-9/r9-header-shrink.mjs generalised to r7-scroll.mjs's job list:
//   usage: node r8-dialog-geometry.mjs <before|after>      (run from anywhere; serves C:/Claude_Code_Projects/lero-al/storybook-static)
// Job list = r7-scroll.mjs's (the review-5 dialog Stories + its named additions, the `Modal` primitive's triggers operated)
// plus EVERY CreateTicketDialogView export, at 1440x900, 1440x600, 1387x812 and 390x844 (sq, DPR 1).
// In every open dialog the header, the scroll region (the body) and the footer must be separate, non-overlapping bands:
//   V1 header height = header scrollHeight (the header is not squeezed)
//   V2 every header descendant's bottom <= header bottom (+1)  (nothing of the header spills below its box)
//   V3 footer height = footer scrollHeight (the footer is not squeezed)
//   V4 scroll-region top = header bottom (+-1)
//   V5 scroll-region bottom = footer top (+-1) when there is a footer
//   V6 (r7's `bad`) no scroller contains the title or the footer buttons, and the shell itself never scrolls
// Then, for createticketdialogview--complaint and --complaint-same-user at 1387x812, DPR 2: a crop of the header band with the
// body scrolled to 40px and to the end (AC49 crops).
// Output: r8-dialog-geometry-<tag>.json, r10-geometry-crop-<story>-<scroll>.png (after only).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const tag = process.argv[2] ?? 'after'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6209)
const census = JSON.parse(fs.readFileSync(path.join(DIR, '../review-5/r5-gr9-census.json'), 'utf8'))
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const CORNER = ['ticketdetaildialogview--with-timeline', 'modal--detail']
const CREATE = Object.values(index.entries).filter(e => e.type === 'story' && e.id.startsWith('patterns-mantine-createticketdialogview--')).map(e => e.id)
const ids = [...new Set([...census.rows.map(r => r.id),
  'patterns-mantine-admindashboardrecentlistings--modal-open', 'mantine-primitives-collectionssection--create-error',
  'mantine-primitives-collectionssection--rename-dialog-open', 'mantine-primitives-collectionssection--delete-confirm-open',
  'patterns-mantine-avatarcropmodal--saving', ...CREATE,
  ...Object.keys(index.entries).filter(id => CORNER.some(c => id.endsWith(c)))])]
const SIZES = [[1440, 900], [1440, 600], [1387, 812], [390, 844]]
// ONLY=<id>[,<id>] re-runs just those Stories (a Story whose dialog did not open in time in a full run).
if (process.env.ONLY) { const keep = new Set(process.env.ONLY.split(',')); ids.splice(0, ids.length, ...ids.filter(i => keep.has(i))) }

const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const shells = [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content, [role=dialog]')].filter(vis)
  if (!shells.length) return { open: false }
  const shell = shells.find(s => s.matches('.mantine-Modal-content, .mantine-Drawer-content')) ?? shells[0]
  const isSheet = shell.matches('.mantine-Drawer-content')
  const title = shell.querySelector('.mantine-Modal-title, .mantine-Drawer-title, h2, [id$=-title]')
  const header = shell.querySelector('.mantine-Modal-header, .mantine-Drawer-header')
  const body = shell.querySelector('.mantine-Modal-body, .mantine-Drawer-body')
  let footer = null
  let region = body
  if (isSheet) {
    footer = shell.querySelector('[data-testid="mantine-drawer-footer"]')
    region = shell.querySelector('[data-testid="mantine-drawer-scroll-content"]') ?? body
  } else {
    const last = shell.lastElementChild
    footer = last && last !== header && last !== body && last.querySelector('button') ? last : null
  }
  const footerBtn = footer ? [...footer.querySelectorAll('button')].filter(vis)[0] ?? null : null
  const scrollers = [shell, ...shell.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el)
    return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && vis(el)
  }).map(el => ({
    holdsTitle: !!title && el.contains(title), holdsFooter: !!footerBtn && el.contains(footerBtn), isShell: el === shell,
  }))
  const hb = header?.getBoundingClientRect(); const rb = region?.getBoundingClientRect(); const fb = footer?.getBoundingClientRect()
  const spill = header ? [...header.querySelectorAll('*')].filter(vis).some(el => el.getBoundingClientRect().bottom > hb.bottom + 1) : false
  const m = {
    open: true, isSheet, hasHeader: !!header, hasFooter: !!footer,
    headerH: hb?.height, headerScrollH: header?.scrollHeight, headerClientH: header?.clientHeight,
    footerH: fb?.height, footerScrollH: footer?.scrollHeight, footerClientH: footer?.clientHeight,
    headerBottom: hb?.bottom, regionTop: rb?.top, regionBottom: rb?.bottom, footerTop: fb?.top,
    regionOverflows: region ? region.scrollHeight > region.clientHeight + 1 : false,
    scrollers,
  }
  const v = []
  // `scrollHeight` excludes the element's border (the sheet header has a 1px bottom border), so a header whose box is only
  // a border taller than its content is NOT squeezed. Squeezed = the content is taller than the box (scrollHeight > clientHeight).
  if (header && header.scrollHeight > header.clientHeight + 1) v.push('V1 header squeezed')
  if (spill) v.push('V2 header descendant spills below the header')
  if (footer && footer.scrollHeight > footer.clientHeight + 1) v.push('V3 footer squeezed')
  if (header && region && Math.abs(rb.top - hb.bottom) > 1) v.push('V4 region top != header bottom')
  if (footer && region && Math.abs(rb.bottom - fb.top) > 1) v.push('V5 region bottom != footer top')
  if (scrollers.some(s => s.holdsTitle || s.holdsFooter || s.isShell)) v.push('V6 a scroller holds the title/footer or the shell scrolls')
  m.violations = v
  const r = shell.getBoundingClientRect()
  m.box = { x: r.x, y: r.y, w: r.width, h: r.height }
  return m
}

const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
const out = []
let next = 0
const jobs = ids.flatMap(id => SIZES.map(([w, h]) => ({ id, w, h })))
async function worker() {
  while (next < jobs.length) {
    const { id, w, h } = jobs[next++]
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    try {
      await page.goto(`http://127.0.0.1:6209/iframe.html?id=${id}&globals=locale:sq&viewMode=story`, { timeout: 30000 })
      await page.waitForSelector('[role=dialog]', { timeout: 12000 }).catch(() => null)
      await page.waitForTimeout(1500)
      const m = await page.evaluate(probe)
      if (!m.open && /primitives-modal--/.test(id)) {
        const n = await page.locator('#storybook-root button').count()
        let opened = 0
        for (let i = 0; i < n; i += 1) {
          const btn = page.locator('#storybook-root button').nth(i)
          if (!(await btn.isVisible().catch(() => false))) continue
          await btn.click({ timeout: 3000 }).catch(() => null)
          await page.waitForTimeout(900)
          const mm = await page.evaluate(probe)
          if (mm.open) { opened += 1; out.push({ id, w, h, trigger: i, ...mm }); await page.keyboard.press('Escape'); await page.waitForTimeout(600) }
        }
        if (!opened) out.push({ id, w, h, ...m })
      } else {
        out.push({ id, w, h, ...m })
      }
    } catch (e) { out.push({ id, w, h, error: String(e.message).slice(0, 160) }) }
    await ctx.close()
  }
}
await Promise.all([worker(), worker(), worker(), worker()])

// AC49 crops (DPR 2, 1387x812): the header band with the body scrolled to 40px and to the end.
const crops = []
if (tag === 'after') {
  for (const story of ['complaint', 'complaint-same-user']) {
    for (const where of ['40px', 'end']) {
      const ctx = await browser.newContext({ viewport: { width: 1387, height: 812 }, deviceScaleFactor: 2 })
      const page = await ctx.newPage()
      await page.goto(`http://127.0.0.1:6209/iframe.html?id=patterns-mantine-createticketdialogview--${story}&globals=locale:sq&viewMode=story`)
      await page.waitForSelector('.mantine-Modal-content'); await page.waitForTimeout(1500)
      await page.evaluate(w => { const b = document.querySelector('.mantine-Modal-body'); b.scrollTop = w === 'end' ? b.scrollHeight : 40 }, where)
      await page.waitForTimeout(400)
      const box = await page.evaluate(() => { const c = document.querySelector('.mantine-Modal-content').getBoundingClientRect(); const hd = document.querySelector('.mantine-Modal-header').getBoundingClientRect(); return { x: c.x, y: hd.y, w: c.width, h: hd.height + 60 } })
      const file = `r10-geometry-crop-${story}-${where}.png`
      await page.screenshot({ path: path.join(DIR, file), clip: { x: box.x, y: box.y, width: box.w, height: box.h } })
      crops.push({ story, scrolledTo: where, file, clip: box })
      await ctx.close()
    }
  }
}
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, `r10-dialog-geometry-${tag}.json`), JSON.stringify({ platform: process.platform, node: process.version, tag, sizes: SIZES, stories: ids.length, crops, out }, null, 1))
const open = out.filter(o => o.open)
const bad = open.filter(o => o.violations.length)
console.log(`stories ${ids.length} jobs ${jobs.length} open dialogs ${open.length} (sheets ${open.filter(o => o.isSheet).length}) violations ${bad.length} errors ${out.filter(o => o.error).length} not open ${out.filter(o => !o.open && !o.error).length}`)
for (const o of bad) console.log('VIOLATION', o.id, o.w + 'x' + o.h, o.trigger ?? '', o.violations.join('; '), 'headerH', o.headerH, 'scrollH', o.headerScrollH)
for (const o of out.filter(o => !o.open && !o.error)) console.log('NOT OPEN', o.id, o.w + 'x' + o.h)
for (const o of out.filter(o => o.error)) console.log('ERROR', o.id, o.w + 'x' + o.h, o.error)
