// Task 868 revision 1 — real-Chromium probes against storybook-static.
//   AC11  card badge on its own row sits at the start of the card (state 3)
//   AC12  RichTextEditor toolbar: controls, localized names, hit areas, no overflow
//   AC17  CmsPageView RichLayout: columns, table, image, H2 scale
//   GR-3b/3c/3d numbers for RichTextEditor, PageEditorDialogView RichContent and CmsPageView RichLayout
// Usage: node docs/sessions/evidence/task868/probe868-r1.mjs [badge|editor|cms|dialog|all] > ...
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const ROOT = path.resolve('storybook-static')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const which = process.argv[2] ?? 'all'
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8')).entries

async function open(id, w, locale = 'en', h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  // The fixture image lives on a public host; block it so the probe never depends on the network.
  await ctx.route('https://res.cloudinary.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"/>' }))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'load' })
  await page.waitForSelector('#storybook-root > :not(style)', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(2200)
  return { ctx, page, errors }
}
const r1 = (n) => Math.round(n * 10) / 10

// ── AC11: every card Story, state 3 ─────────────────────────────────────────────────────────────────
if (which === 'badge' || which === 'all') {
  const ids = Object.keys(index).filter((k) => /(admin(table|userstable|currenc|exchange|pages)|agentstatistics|primitives-table|datatable|admin-?users|adminlistings)/.test(k) && index[k].type === 'story')
  console.log('CARD CONSUMER STORIES', ids.length)
  for (const id of ids) {
    for (const loc of ['sq', 'uk']) {
      for (const w of [320, 390]) {
        const { ctx, page, errors } = await open(id, w, loc)
        const res = await page.evaluate(() => {
          // State 3 is the one place the badge wrapper carries `margin-right: var(--mantine-spacing-xs)`.
          const wraps = [...document.querySelectorAll('#storybook-root div')].filter((d) => (d.getAttribute('style') ?? '').includes('margin-right: var(--mantine-spacing-xs)') && d.querySelector('.mantine-Badge-root'))
          const cards = document.querySelectorAll('.mantine-Card-root').length
          return {
            cards,
            state3: wraps.map((wrap) => {
              const row = wrap.parentElement // the start-aligned Group
              const stack = row.parentElement
              const second = stack.children[1]
              const zone = [...second.querySelectorAll('div')].find((d) => (d.getAttribute('style') ?? '').includes('flex: 1'))
              const b = wrap.getBoundingClientRect(), g = row.getBoundingClientRect(), z = zone?.getBoundingClientRect()
              const avatarW = z ? z.left - second.getBoundingClientRect().left : 0
              return { badgeLeft: Math.round(b.left * 10) / 10, rowLeft: Math.round(g.left * 10) / 10, zoneLeft: z ? Math.round(z.left * 10) / 10 : null, avatarPx: Math.round(avatarW), toContentBox: Math.round((b.left - g.left) * 10) / 10, toZone: z ? Math.round((b.left - z.left) * 10) / 10 : null, justify: getComputedStyle(row).justifyContent }
            }),
          }
        })
        if (res.state3.length) console.log(`STATE3 ${id}@${w}@${loc}: cards=${res.cards} ${JSON.stringify(res.state3)}`)
        if (errors.length) console.log(`  console errors ${id}@${w}@${loc}: ${errors[0]}`)
        await ctx.close()
      }
    }
  }
  console.log('BADGE PROBE DONE')
}

// ── AC12 + GR numbers: RichTextEditor Stories ───────────────────────────────────────────────────────
if (which === 'editor' || which === 'all') {
  const EN = ['Bold', 'Italic', 'Underline', 'Strikethrough', 'Heading 2', 'Insert table', 'Insert image', 'Undo', 'Insert 2 columns']
  for (const story of ['default', 'with-content', 'with-error', 'image-uploading']) {
    for (const loc of (process.env.LOCALES ?? 'sq,uk').split(',')) {
      for (const w of (process.env.WIDTHS ?? '320,390,768,1440').split(',').map(Number)) {
        const id = `patterns-mantine-richtexteditor--${story}`
        const { ctx, page, errors } = await open(id, w, loc)
        const m = await page.evaluate(() => {
          const doc = document.documentElement, vw = doc.clientWidth
          const root = document.querySelector('.mantine-RichTextEditor-root')
          const wrapper = root.parentElement.parentElement
          const wr = wrapper.getBoundingClientRect(), rr = root.getBoundingClientRect()
          const gutterEl = wrapper.parentElement
          const cs = getComputedStyle(gutterEl)
          const controls = [...root.querySelectorAll('.mantine-RichTextEditor-control')]
          const sizes = controls.map((c) => { const r = c.getBoundingClientRect(); return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] })
          const names = controls.map((c) => c.getAttribute('aria-label') || '')
          const tb = root.querySelector('.mantine-RichTextEditor-toolbar').getBoundingClientRect()
          const rows = new Set(controls.map((c) => Math.round(c.getBoundingClientRect().top))).size
          const content = root.querySelector('.tiptap')
          const h2 = root.querySelector('.tiptap h2')
          const label = wrapper.querySelector('label, [id$="-label"]')
          const err = wrapper.querySelector('[id$="-error"], .mantine-InputWrapper-error')
          return {
            vw, docOverflowX: doc.scrollWidth > vw + 1,
            gap: { top: Math.round(wr.top + scrollY), right: Math.round(vw - wr.right), bottom: parseFloat(cs.paddingBottom), left: Math.round(wr.left) },
            rootW: Math.round(rr.width), wrapperW: Math.round(wr.width),
            controlCount: controls.length, unnamed: names.filter((n) => !n).length,
            minHit: [Math.min(...sizes.map((s) => s[0])), Math.min(...sizes.map((s) => s[1]))],
            toolbarRows: rows, toolbarFits: tb.right <= vw + 1,
            names: names.slice(0, 40),
            contentFont: content ? parseFloat(getComputedStyle(content).fontSize) : null,
            h2Font: h2 ? parseFloat(getComputedStyle(h2).fontSize) : null,
            labelFont: label ? parseFloat(getComputedStyle(label).fontSize) : null,
            errorText: err ? err.textContent.trim().slice(0, 90) : null,
            errorBorder: getComputedStyle(root).borderColor,
            textbox: (() => { const t = root.querySelector('[role="textbox"]'); return t ? { labelledby: t.getAttribute('aria-labelledby'), name: !!document.getElementById((t.getAttribute('aria-labelledby') || '')) } : null })(),
            dialog: (() => { const d = document.querySelector('[role="dialog"]'); if (!d) return null; const r = d.getBoundingClientRect(); return { w: Math.round(r.width), bottomGap: Math.round(window.innerHeight - r.bottom), title: d.querySelector('.mantine-Modal-title, h2, h3, h4')?.textContent.trim().slice(0, 40) ?? null } })(),
          }
        })
        const leak = loc !== 'en' ? m.names.filter((n) => EN.includes(n)) : []
        console.log(`EDITOR ${story}@${w}@${loc}: overflow=${m.docOverflowX} gap=${JSON.stringify(m.gap)} root=${m.rootW}/${m.wrapperW} controls=${m.controlCount} unnamed=${m.unnamed} minHit=${m.minHit} rows=${m.toolbarRows} fits=${m.toolbarFits} content=${m.contentFont} label=${m.labelFont} englishNames=${JSON.stringify(leak)} error=${m.errorText} textbox=${JSON.stringify(m.textbox)} dialog=${JSON.stringify(m.dialog)} errs=${errors.length}`)
        if (story === 'default' && w === 390) console.log('  names sample:', m.names.slice(0, 8).join(' | '))
        await ctx.close()
      }
    }
  }
  console.log('EDITOR PROBE DONE')
}

// ── AC17: CmsPageView RichLayout ────────────────────────────────────────────────────────────────────
if (which === 'cms' || which === 'all') {
  for (const loc of ['sq', 'uk', 'en']) {
    for (const w of [320, 390, 700, 768, 1024, 1440]) {
      const { ctx, page, errors } = await open('patterns-mantine-cmspageview--rich-layout', w, loc)
      const m = await page.evaluate(() => {
        const doc = document.documentElement, vw = doc.clientWidth
        const body = document.querySelector('.mantine-Typography-root')
        const br = body.getBoundingClientRect()
        const blocks = [...body.querySelectorAll('[data-type="columns"]')].map((c) => {
          const cols = [...c.children].map((x) => x.getBoundingClientRect())
          return { cols: cols.length, sameRow: cols.every((x) => Math.abs(x.top - cols[0].top) < 2), widths: cols.map((x) => Math.round(x.width)), gap: getComputedStyle(c).columnGap }
        })
        const table = body.querySelector('table')
        const tr = table.getBoundingClientRect()
        const img = body.querySelector('img')
        const ir = img.getBoundingClientRect()
        const h = (sel) => { const e = body.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : null }
        const h1 = document.querySelector('main h1') ?? document.querySelector('#storybook-root h1')
        return {
          vw, docOverflowX: doc.scrollWidth > vw + 1,
          bodyW: Math.round(br.width), blocks,
          tableBox: { w: Math.round(tr.width), right: Math.round(tr.right), scrolls: table.scrollWidth > table.clientWidth + 1, overflowX: getComputedStyle(table).overflowX },
          img: { w: Math.round(ir.width), maxFits: ir.right <= br.right + 1, parentW: Math.round(img.parentElement.getBoundingClientRect().width) },
          h2: h('h2'), h3: h('h3'), body: h('p'), title: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
          centred: getComputedStyle(body.querySelector('p[style]')).textAlign,
        }
      })
      console.log(`CMS rich-layout@${w}@${loc}: overflow=${m.docOverflowX} body=${m.bodyW} blocks=${JSON.stringify(m.blocks)} table=${JSON.stringify(m.tableBox)} img=${JSON.stringify(m.img)} h1=${m.title} h2=${m.h2} h3=${m.h3} p=${m.body} align=${m.centred} errs=${errors.length}`)
      await ctx.close()
    }
  }
  console.log('CMS PROBE DONE')
}

// ── PageEditorDialogView RichContent ────────────────────────────────────────────────────────────────
if (which === 'dialog' || which === 'all') {
  for (const loc of ['sq', 'uk']) {
    for (const w of [320, 390, 768, 1024, 1440]) {
      const { ctx, page, errors } = await open('patterns-mantine-pageeditordialogview--rich-content', w, loc)
      const m = await page.evaluate(() => {
        const doc = document.documentElement, vw = doc.clientWidth
        const d = document.querySelector('[role="dialog"]')
        const r = d.getBoundingClientRect()
        const ed = d.querySelector('.mantine-RichTextEditor-root')
        const tb = d.querySelector('.mantine-RichTextEditor-toolbar')
        const controls = [...d.querySelectorAll('.mantine-RichTextEditor-control')]
        const minHit = controls.length ? Math.min(...controls.map((c) => Math.min(c.getBoundingClientRect().width, c.getBoundingClientRect().height))) : null
        const content = d.querySelector('.tiptap')
        return {
          vw, docOverflowX: doc.scrollWidth > vw + 1,
          dialog: { w: Math.round(r.width), left: Math.round(r.left), right: Math.round(vw - r.right), bottom: Math.round(window.innerHeight - r.bottom) },
          editorW: ed ? Math.round(ed.getBoundingClientRect().width) : null,
          toolbarRight: tb ? Math.round(tb.getBoundingClientRect().right) : null,
          controls: controls.length, minHit: minHit && Math.round(minHit * 10) / 10,
          columns: content ? content.querySelectorAll('[data-type="columns"]').length : 0,
          tables: content ? content.querySelectorAll('table').length : 0,
          images: content ? content.querySelectorAll('img').length : 0,
          dialogScrollsX: d.scrollWidth > d.clientWidth + 1,
          tabsSelected: [...d.querySelectorAll('[role="tab"][aria-selected="true"]')].map((t) => t.textContent.trim()),
        }
      })
      console.log(`DIALOG rich-content@${w}@${loc}: ${JSON.stringify(m)} errs=${errors.length}${errors[0] ? ' first=' + errors[0] : ''}`)
      await ctx.close()
    }
  }
  console.log('DIALOG PROBE DONE')
}

await browser.close()
server.close()
