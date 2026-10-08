// Task 859 review 7 (Opus) — own GR-3b/3c/3d/3e + GR-9 step-3 measurement of the five Stories Revision 5 created or
// changed, on the final storybook-static (rebuilt by Revision 6). sq locale, DPR 1, 320/390/1024/1440.
// Output: r7-gr3.json + r7-gr3-<story>-<width>.png beside this file.
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
}).listen(6175)

// Each Story's play ends in a distinct observable state; wait for it, not for a timer.
const STORIES = {
  'patterns-mantine-admindashboardrecentlistings--modal-open': '[role=dialog]',
  'mantine-primitives-collectionssection--create-error': '[role=dialog] [aria-invalid=true]',
  'mantine-primitives-collectionssection--rename-dialog-open': '[role=dialog] input',
  'mantine-primitives-collectionssection--delete-confirm-open': '[role=dialog]',
  'patterns-mantine-avatarcropmodal--saving': '[role=dialog] button[data-loading=true]',
}

const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0 }
  const W = innerWidth
  const dialogs = [...document.querySelectorAll('[role=dialog]')].filter(vis)
  const d = dialogs[dialogs.length - 1]
  const dr = d?.getBoundingClientRect()
  const content = d?.closest('.mantine-Modal-content, .mantine-Drawer-content') ?? d
  const cs = content ? getComputedStyle(content) : null
  // text sizes
  const texts = []
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    if (!own) continue
    texts.push({ tag: el.tagName, cls: (el.className?.baseVal ?? el.className ?? '').toString().split(' ').filter(c => c.startsWith('mantine-')).slice(0, 2).join(' '), fs: parseFloat(getComputedStyle(el).fontSize), text: el.textContent.trim().slice(0, 40), inDialog: !!d?.contains(el) })
  }
  const big = texts.filter(t => t.fs >= 24)
  const headings = texts.filter(t => /^H[1-6]$/.test(t.tag) || t.cls.includes('Title'))
  // GR-3e: visible text buttons in the dialog sharing a row
  const btns = d ? [...d.querySelectorAll('button')].filter(vis).filter(b => b.textContent.trim()).map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim().slice(0, 30), top: r.top, bottom: r.bottom, left: r.left, right: r.right } }) : []
  const pairs = []
  for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
    const a = btns[i], b = btns[j]
    if (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4) pairs.push([a.t, b.t])
  }
  // GR-3d: the Story's page content (beneath the overlay) against the viewport edges
  const root = document.querySelector('#storybook-root')
  const firstContent = root ? [...root.querySelectorAll('*')].find(el => vis(el) && el.getBoundingClientRect().width < W && !el.closest('[role=dialog]') && !el.closest('.mantine-Modal-root')) : null
  const fr = firstContent?.getBoundingClientRect()
  return {
    W,
    overflowX: document.documentElement.scrollWidth > W,
    dialogs: dialogs.length,
    dialog: dr ? { left: Math.round(dr.left), right: Math.round(W - dr.right), width: Math.round(dr.width), top: Math.round(dr.top) } : null,
    radius: cs ? [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius] : null,
    maxFont: Math.max(...texts.map(t => t.fs)),
    big, headings: headings.map(h => ({ tag: h.tag, fs: h.fs, text: h.text, inDialog: h.inDialog })),
    dialogTextButtons: btns.map(b => b.t), rowPairs: pairs,
    pageContent: fr ? { tag: firstContent.tagName, cls: (firstContent.className ?? '').toString().slice(0, 60), left: Math.round(fr.left), right: Math.round(W - fr.right), top: Math.round(fr.top) } : null,
  }
}

const browser = await chromium.launch()
const out = []
for (const [id, done] of Object.entries(STORIES)) {
  for (const width of [320, 390, 1024, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 200)))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)) })
    await page.goto(`http://127.0.0.1:6175/iframe.html?id=${id}&globals=locale:sq&viewMode=story`)
    let reached = true
    try { await page.waitForSelector(done, { state: 'attached', timeout: 20000 }) } catch { reached = false }
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(800)
    const m = await page.evaluate(probe)
    const shot = `r7-gr3-${id.split('--')[0].split('-').pop()}-${id.split('--')[1]}-${width}.png`
    await page.screenshot({ path: path.join(DIR, shot), animations: 'disabled' })
    out.push({ id, width, playEndState: reached, errors, shot, ...m })
    console.log(id, width, 'end', reached, 'dialogs', m.dialogs, 'dlg', JSON.stringify(m.dialog), 'r', m.radius?.join('/'), 'maxFont', m.maxFont, 'big', m.big.length, 'pairs', m.rowPairs.length, 'overflow', m.overflowX, 'page', JSON.stringify(m.pageContent), 'err', errors.length)
    await ctx.close()
  }
}
await browser.close()
server.close()
fs.writeFileSync(path.join(DIR, 'r7-gr3.json'), JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
