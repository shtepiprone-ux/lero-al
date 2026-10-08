// Task 859 review 8 (Opus) — owner return of O78-13: "the scrollbar runs into the rounded corner; the scroll must be
// limited to the scrolling content, never the header or the sticky footer". For every matrix Story with an open dialog
// (review 5 census ids + the five Revision 5 Stories), at 1440 and 390 (sq, DPR 1): find every element inside the open
// dialog/sheet whose content overflows and scrolls, and record whether the dialog's header/title and footer buttons sit
// INSIDE that scroller. Output: r8-scroll.json, plus a crop of the dialog's top-right corner for each offender.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6178)
const census = JSON.parse(fs.readFileSync(path.join(DIR, '../review-5/r5-gr9-census.json'), 'utf8'))
const ids = [...new Set([...census.rows.map(r => r.id),
  'patterns-mantine-admindashboardrecentlistings--modal-open', 'mantine-primitives-collectionssection--create-error',
  'mantine-primitives-collectionssection--rename-dialog-open', 'mantine-primitives-collectionssection--delete-confirm-open',
  'patterns-mantine-avatarcropmodal--saving'])]

const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const shells = [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content, [role=dialog]')].filter(vis)
  if (!shells.length) return { open: false }
  const shell = shells.find(s => s.matches('.mantine-Modal-content, .mantine-Drawer-content')) ?? shells[0]
  const title = shell.querySelector('.mantine-Modal-title, .mantine-Drawer-title, h2, [id$=-title]')
  const btns = [...shell.querySelectorAll('button')].filter(vis).filter(b => b.textContent.trim())
  const footerBtn = btns[btns.length - 1]
  const scrollers = [shell, ...shell.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el)
    return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && vis(el)
  }).map(el => ({
    cls: (el.className?.baseVal ?? el.className ?? '').toString().split(' ').filter(c => c.startsWith('mantine-')).join(' ') || el.tagName,
    clientH: el.clientHeight, scrollH: el.scrollHeight,
    holdsTitle: !!title && el.contains(title), holdsFooter: !!footerBtn && el.contains(footerBtn) && !el.contains(title) ? 'footer-only' : (!!footerBtn && el.contains(footerBtn)),
    isShell: el === shell,
  }))
  const r = shell.getBoundingClientRect()
  return { open: true, shellCls: shell.className.toString().split(' ').filter(c => c.startsWith('mantine-')).join(' '), radius: getComputedStyle(shell).borderTopRightRadius, box: { x: r.x, y: r.y, w: r.width, h: r.height }, scrollers }
}

const browser = await chromium.launch()
const out = []
let next = 0
const jobs = ids.flatMap(id => [1440, 390].map(w => ({ id, w })))
async function worker() {
  while (next < jobs.length) {
    const { id, w } = jobs[next++]
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    try {
      await page.goto(`http://127.0.0.1:6178/iframe.html?id=${id}&globals=locale:sq&viewMode=story`, { timeout: 30000 })
      await page.waitForSelector('[role=dialog]', { timeout: 12000 }).catch(() => null)
      await page.waitForTimeout(1500)
      const m = await page.evaluate(probe)
      const bad = m.open && m.scrollers.some(s => s.holdsTitle || s.holdsFooter === true)
      let crop = null
      if (bad) {
        crop = `r8-scroll-${id.replace(/^.*?--/, id.split('--')[0].split('-').pop() + '-')}-${w}.png`
        await page.screenshot({ path: path.join(DIR, crop), clip: { x: Math.max(0, m.box.x + m.box.w - 120), y: Math.max(0, m.box.y), width: 120, height: Math.min(160, m.box.h) } })
      }
      out.push({ id, w, ...m, bad, crop })
    } catch (e) { out.push({ id, w, error: String(e.message).slice(0, 160) }) }
    await ctx.close()
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r8-scroll.json'), JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
const open = out.filter(o => o.open)
console.log('jobs', jobs.length, 'open dialogs', open.length, 'with a scroller', open.filter(o => o.scrollers.length).length, 'scroller holds header or footer', open.filter(o => o.bad).length, 'errors', out.filter(o => o.error).length)
for (const o of open.filter(o => o.scrollers.length)) console.log(o.id, o.w, o.bad ? 'BAD' : 'ok', JSON.stringify(o.scrollers))
