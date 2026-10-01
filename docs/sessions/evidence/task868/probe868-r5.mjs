// Task 868 revision 5 — real-Chromium probes against storybook-static.
//   AC28  RichTextEditor toolbar: 5 controls in 1 row, sizes, no overflow
//   AC32  PageEditorDialogView rich-content at 390: the Paragraph sheet opens above the dialog, H2 applies, the sheet closes
//   GR-3b / GR-3c numbers for RichTextEditor Default and DropdownMenu WithActiveItems
// Usage: node docs/sessions/evidence/task868/probe868-r5.mjs [editor|dialog|menu|all]
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

async function open(id, w, locale = 'en', h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
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

const toolbarMetrics = () => {
  const doc = document.documentElement
  const vw = doc.clientWidth
  const root = document.querySelector('.mantine-RichTextEditor-root')
  const toolbar = root.querySelector('.mantine-RichTextEditor-toolbar')
  const controls = [...toolbar.querySelectorAll('.mantine-RichTextEditor-control')]
  const boxes = controls.map((c) => c.getBoundingClientRect())
  const label = document.querySelector('[id$="-label"]')
  const content = root.querySelector('.tiptap')
  return {
    vw,
    docOverflowX: doc.scrollWidth > vw + 1,
    controls: controls.length,
    groups: toolbar.querySelectorAll('.mantine-RichTextEditor-controlsGroup').length,
    unnamed: controls.filter((c) => !c.getAttribute('aria-label')).length,
    rows: new Set(boxes.map((b) => Math.round(b.top))).size,
    minW: Math.round(Math.min(...boxes.map((b) => b.width)) * 10) / 10,
    minH: Math.round(Math.min(...boxes.map((b) => b.height)) * 10) / 10,
    maxH: Math.round(Math.max(...boxes.map((b) => b.height)) * 10) / 10,
    fits: toolbar.getBoundingClientRect().right <= vw + 1,
    rootW: Math.round(root.getBoundingClientRect().width),
    contentFont: content ? parseFloat(getComputedStyle(content).fontSize) : null,
    labelFont: label ? parseFloat(getComputedStyle(label).fontSize) : null,
  }
}

if (which === 'editor' || which === 'all') {
  for (const story of ['default', 'with-content']) {
    for (const loc of (process.env.LOCALES ?? 'sq,uk').split(',')) {
      for (const w of (process.env.WIDTHS ?? '320,390,639,640,768,1440').split(',').map(Number)) {
        const { ctx, page, errors } = await open(`patterns-mantine-richtexteditor--${story}`, w, loc)
        const m = await page.evaluate(toolbarMetrics)
        console.log(`EDITOR ${story}@${w}@${loc}: overflow=${m.docOverflowX} root=${m.rootW}/${m.vw} controls=${m.controls} groups=${m.groups} unnamed=${m.unnamed} rows=${m.rows} minW=${m.minW} minH=${m.minH} maxH=${m.maxH} fits=${m.fits} content=${m.contentFont} label=${m.labelFont} errs=${errors.length}`)
        await ctx.close()
      }
    }
  }
  console.log('EDITOR PROBE DONE')
}

if (which === 'dialog' || which === 'all') {
  for (const w of [390, 1440]) {
    const { ctx, page, errors } = await open('patterns-mantine-pageeditordialogview--rich-content', w, 'sq')
    const m = await page.evaluate(toolbarMetrics)
    console.log(`DIALOG rich-content@${w}@sq: overflow=${m.docOverflowX} controls=${m.controls} groups=${m.groups} rows=${m.rows} minW=${m.minW} minH=${m.minH} maxH=${m.maxH} fits=${m.fits} errs=${errors.length}`)
    if (w === 390) {
      const before = await page.evaluate(() => {
        const t = document.querySelector('.mantine-RichTextEditor-root .tiptap')
        const p = t.querySelector(':scope > p')
        return { h2: t.querySelectorAll('h2').length, paragraphText: p?.textContent.slice(0, 30), dialogs: document.querySelectorAll('[role="dialog"]').length }
      })
      // A plain top-level paragraph (not the leading heading, not inside a column or table cell).
      await page.locator('.mantine-RichTextEditor-root .tiptap > p').first().click({ position: { x: 8, y: 8 } })
      await page.locator('.mantine-RichTextEditor-toolbar .lucide-pilcrow').first().click()
      await page.waitForTimeout(900)
      const sheet = await page.evaluate(() => {
        const row = document.querySelector('.lucide-heading-2')?.closest('button')
        if (!row) return { found: false }
        const r = row.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const hit = document.elementFromPoint(cx, cy)
        return { found: true, rowH: Math.round(r.height), hitInsideRow: !!hit && row.contains(hit), dialogs: document.querySelectorAll('[role="dialog"]').length, rowText: row.textContent.trim() }
      })
      console.log('  sheet:', JSON.stringify(sheet), 'before:', JSON.stringify(before))
      await page.locator('.lucide-heading-2').first().locator('xpath=ancestor::button[1]').click()
      await page.waitForTimeout(1000)
      const after = await page.evaluate(() => {
        const t = document.querySelector('.mantine-RichTextEditor-root .tiptap')
        const target = [...t.querySelectorAll('h2')].map((h) => h.textContent.slice(0, 30))
        return { h2: t.querySelectorAll('h2').length, h2Texts: target, h2Row: !!document.querySelector('.lucide-heading-2'), editorDialogOpen: !!document.querySelector('.mantine-RichTextEditor-root'), dialogs: document.querySelectorAll('[role="dialog"]').length }
      })
      console.log('  after H2:', JSON.stringify(after))
    }
    await ctx.close()
  }
  console.log('DIALOG PROBE DONE')
}

if (which === 'menu' || which === 'all') {
  for (const loc of ['sq', 'uk']) {
    for (const w of [320, 390, 768, 1440]) {
      const { ctx, page, errors } = await open('mantine-primitives-dropdownmenu--with-active-items', w, loc)
      const before = await page.evaluate(() => {
        const doc = document.documentElement
        const btn = document.querySelector('#storybook-root button')
        const caption = [...document.querySelectorAll('#storybook-root p, #storybook-root div')].find((e) => /active item/.test(e.textContent) && e.children.length === 0)
        return { vw: doc.clientWidth, overflow: doc.scrollWidth > doc.clientWidth + 1, btnW: Math.round(btn.getBoundingClientRect().width), captionFont: caption ? parseFloat(getComputedStyle(caption).fontSize) : null }
      })
      await page.locator('#storybook-root button').first().click()
      await page.waitForTimeout(800)
      const opened = await page.evaluate(() => {
        const checks = [...document.querySelectorAll('.lucide-check')]
        const items = [...document.querySelectorAll('[role="menuitem"], [data-active]')]
        const active = document.querySelector('[data-active]')
        const font = active ? [...active.querySelectorAll('*')].map((e) => parseFloat(getComputedStyle(e).fontSize)).filter(Boolean) : []
        const ar = active?.getBoundingClientRect()
        const c = checks[0]?.getBoundingClientRect()
        return { checks: checks.length, activeAttr: document.querySelectorAll('[data-active]').length, itemFonts: [...new Set(font)], checkAtEnd: ar && c ? Math.round(ar.right - c.right) : null, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, menuItems: items.length }
      })
      console.log(`MENU with-active-items@${w}@${loc}: before=${JSON.stringify(before)} opened=${JSON.stringify(opened)} errs=${errors.length}`)
      await ctx.close()
    }
  }
  console.log('MENU PROBE DONE')
}

await browser.close()
server.close()
