// Task 868 measurement probe — real Chromium against storybook-static (GR-3b / GR-3c / GR-3d receipts).
// Usage: node docs/sessions/evidence/task868/probe868.mjs > docs/sessions/evidence/task868/30-measurements.txt
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

const VIEW = 'patterns-mantine-adminpagesview'
const DIALOG = 'patterns-mantine-pageeditordialogview'
const VIEW_STORIES = ['default', 'empty', 'migration-pending', 'deleting', 'delete-confirm']
const DIALOG_STORIES = ['new', 'edit-published', 'empty-locale-warning', 'slug-error', 'publish-body-required', 'saving']
const WIDTHS = [320, 390, 768, 1024, 1440]

async function open(id, w, locale = 'en') {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)) })
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'load' })
  await page.waitForSelector('#storybook-root > :not(style)', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1800)
  return { ctx, page, errors }
}

function measure(page, kind) {
  return page.evaluate((kind) => {
    const doc = document.documentElement
    const vw = doc.clientWidth
    const num = (n) => Math.round(n * 10) / 10
    const sizes = (nodes) => [...new Set(nodes.map((el) => parseFloat(getComputedStyle(el).fontSize)))].sort((a, b) => a - b)
    const out = { vw, docOverflowX: doc.scrollWidth > vw + 1 }
    if (kind === 'view') {
      const root = document.querySelector('[data-testid="admin-pages-manager"]')
      const r = root.getBoundingClientRect()
      out.gutter = { top: num(r.top + window.scrollY), right: num(vw - r.right), bottom: num(doc.scrollHeight - (r.bottom + window.scrollY)), left: num(r.left) }
      out.rootWidth = num(r.width)
      out.parentWidth = num(root.parentElement.getBoundingClientRect().width)
      out.tableVisible = !!root.querySelector('table') && root.querySelector('table').offsetParent !== null
      out.headers = [...root.querySelectorAll('thead th')].filter((th) => th.offsetParent !== null).map((th) => th.textContent.trim())
      const actions = [...root.querySelectorAll('button[aria-label], a[aria-label]')].filter((el) => el.offsetParent !== null)
      out.actionCount = actions.length
      out.actionMin = actions.length ? { w: num(Math.min(...actions.map((a) => a.getBoundingClientRect().width))), h: num(Math.min(...actions.map((a) => a.getBoundingClientRect().height))) } : null
      out.actionNamesMissing = actions.filter((a) => !a.getAttribute('aria-label')).length
      out.alert = !!root.querySelector('[role="alert"], .mantine-Alert-root')
      out.fontSizes = sizes([...root.querySelectorAll('p, td, th, span, button, a')].filter((el) => el.offsetParent !== null && el.textContent.trim()))
      out.headingSizes = sizes([...root.querySelectorAll('h1,h2,h3,h4,h5,h6')])
      const dlg = document.querySelector('[role="dialog"]')
      if (dlg) {
        const d = dlg.getBoundingClientRect()
        out.dialog = { w: num(d.width), left: num(d.left), right: num(vw - d.right), bottomAnchored: num(window.innerHeight - d.bottom) }
        const title = dlg.querySelector('h1,h2,h3,h4,h5,h6, .mantine-Modal-title')
        out.dialogTitleSize = title ? parseFloat(getComputedStyle(title).fontSize) : null
        out.dialogBodySizes = sizes([...dlg.querySelectorAll('p, button, span')].filter((el) => el.textContent.trim()))
        const btns = [...dlg.querySelectorAll('button')].filter((b) => b.textContent.trim())
        out.dialogButtonMinH = btns.length ? num(Math.min(...btns.map((b) => b.getBoundingClientRect().height))) : null
      }
    } else {
      const dlg = document.querySelector('[role="dialog"]')
      const d = dlg.getBoundingClientRect()
      out.dialog = { w: num(d.width), left: num(d.left), right: num(vw - d.right), bottomAnchored: num(window.innerHeight - d.bottom) }
      const title = dlg.querySelector('h1,h2,h3,h4,h5,h6, .mantine-Modal-title')
      out.dialogTitleSize = title ? parseFloat(getComputedStyle(title).fontSize) : null
      out.headingSizes = sizes([...dlg.querySelectorAll('h1,h2,h3,h4,h5,h6')])
      out.labelSizes = sizes([...dlg.querySelectorAll('label')])
      out.inputSizes = sizes([...dlg.querySelectorAll('input:not([type=checkbox]), textarea')])
      out.tabs = [...dlg.querySelectorAll('[role="tab"]')].map((t) => ({ name: t.textContent.trim(), selected: t.getAttribute('aria-selected') === 'true', check: !!t.querySelector('svg[aria-hidden], [aria-hidden="true"] svg'), w: num(t.getBoundingClientRect().width) }))
      const vp = dlg.querySelector('.mantine-ScrollArea-viewport') ?? dlg.querySelector('[role="tablist"]')
      const tabs = vp.getBoundingClientRect()
      out.tabListFitsDialog = tabs.right <= d.right + 1 && tabs.left >= d.left - 1
      out.tabsSwipe = vp.scrollWidth > vp.clientWidth + 1
      const ta = [...dlg.querySelectorAll('textarea')].find((x) => x.offsetParent !== null)
      out.textareaFont = ta ? getComputedStyle(ta).fontFamily.split(',')[0] : null
      out.textareaRows = ta ? Math.round(ta.getBoundingClientRect().height) : null
      const slugInput = dlg.querySelector('input[placeholder="about-us"]')
      out.slugFont = slugInput ? getComputedStyle(slugInput).fontFamily.split(',')[0] : null
      out.errorTexts = [...dlg.querySelectorAll('.mantine-InputWrapper-error, [data-error]')].map((e) => e.textContent.trim()).filter(Boolean)
      out.alertCount = [...dlg.querySelectorAll('.mantine-Alert-root')].filter((a) => a.offsetParent !== null).length
      out.switchLabel = dlg.querySelector('.mantine-Switch-label')?.textContent.trim() ?? null
      out.saveDisabled = [...dlg.querySelectorAll('button')].filter((b) => b.textContent.trim()).slice(-1)[0]?.disabled
      const footerBtns = [...dlg.querySelectorAll('button')].filter((b) => b.textContent.trim())
      out.footerButtonMinH = footerBtns.length ? num(Math.min(...footerBtns.map((b) => b.getBoundingClientRect().height))) : null
      const scrollers = [...dlg.querySelectorAll('*')].filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible' && el.clientWidth > 0).length
      out.contentOverflowingEls = scrollers
    }
    return out
  }, kind)
}

const results = {}
for (const [prefix, stories, kind] of [[VIEW, VIEW_STORIES, 'view'], [DIALOG, DIALOG_STORIES, 'dialog']]) {
  for (const s of stories) {
    const id = `${prefix}--${s}`
    for (const w of WIDTHS) {
      const { ctx, page, errors } = await open(id, w)
      const m = await measure(page, kind)
      m.errors = errors
      results[`${id}@${w}@en`] = m
      await ctx.close()
    }
    // locale expansion: uk and sq at 390 and 1440
    for (const loc of ['uk', 'sq']) {
      for (const w of [390, 1440]) {
        const { ctx, page, errors } = await open(id, w, loc)
        const m = await measure(page, kind)
        m.errors = errors
        results[`${id}@${w}@${loc}`] = m
        await ctx.close()
      }
    }
    console.log('done', id)
  }
}
fs.writeFileSync('docs/sessions/evidence/task868/30-measurements.json', JSON.stringify(results, null, 1))
await browser.close()
server.close()
console.log('WROTE docs/sessions/evidence/task868/30-measurements.json', Object.keys(results).length)
